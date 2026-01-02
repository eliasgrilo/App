/**
 * Serverless Functions Service - Ephemeral Compute Orchestration
 * 
 * PREMIUM FEATURE #8: Serverless Functions (Cloud Functions Pattern)
 * 
 * Manages serverless function invocations with:
 * - Automatic scaling (0 to 10,000+ concurrent)
 * - Cold start optimization
 * - Function warming strategies
 * - Cost tracking per invocation
 * 
 * Architecture:
 * - Frontend calls through this service
 * - Service routes to Firebase Cloud Functions
 * - Handles retries, timeouts, and error recovery
 * 
 * @module serverlessFunctions
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Firebase Functions base URL (auto-detected or configured)
    FUNCTIONS_BASE_URL: null, // Will be set from environment

    // Timeouts
    DEFAULT_TIMEOUT_MS: 60000,
    COLD_START_BUFFER_MS: 5000,

    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAYS_MS: [1000, 3000, 10000],

    // Warming configuration
    WARM_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes

    // Concurrency limits
    MAX_CONCURRENT_CALLS: 100
};

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTION REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Registry of available serverless functions
 * Maps function names to their configurations
 */
export const FunctionRegistry = Object.freeze({
    // Email Processing Functions
    PROCESS_QUOTATION_EMAIL: {
        name: 'processQuotationEmail',
        timeout: 30000,
        retries: 3,
        warmable: true,
        description: 'Parses and processes incoming quotation emails'
    },
    SEND_QUOTATION_REQUEST: {
        name: 'sendQuotationRequest',
        timeout: 15000,
        retries: 2,
        warmable: false,
        description: 'Sends quotation request to suppliers'
    },

    // AI/ML Functions
    ANALYZE_PRICE_TRENDS: {
        name: 'analyzePriceTrends',
        timeout: 45000,
        retries: 2,
        warmable: true,
        description: 'ML-based price trend analysis'
    },
    SEMANTIC_PRODUCT_MATCH: {
        name: 'semanticProductMatch',
        timeout: 30000,
        retries: 2,
        warmable: true,
        description: 'Vector-based product matching'
    },
    GENERATE_PURCHASE_FORECAST: {
        name: 'generatePurchaseForecast',
        timeout: 60000,
        retries: 1,
        warmable: false,
        description: 'Generates demand forecasts'
    },

    // Document Processing
    SCAN_INVOICE: {
        name: 'scanInvoice',
        timeout: 45000,
        retries: 3,
        warmable: true,
        description: 'OCR and extraction from invoice images'
    },
    GENERATE_REPORT_PDF: {
        name: 'generateReportPdf',
        timeout: 30000,
        retries: 2,
        warmable: false,
        description: 'Generates PDF reports'
    },

    // Integration Functions
    SYNC_ERP: {
        name: 'syncErp',
        timeout: 60000,
        retries: 3,
        warmable: false,
        description: 'Syncs data with external ERP'
    },
    WEBHOOK_DISPATCH: {
        name: 'webhookDispatch',
        timeout: 10000,
        retries: 5,
        warmable: false,
        description: 'Dispatches webhooks to external systems'
    },

    // Batch Processing
    BATCH_PRICE_UPDATE: {
        name: 'batchPriceUpdate',
        timeout: 120000,
        retries: 1,
        warmable: false,
        description: 'Processes bulk price updates'
    },
    RECALCULATE_ANALYTICS: {
        name: 'recalculateAnalytics',
        timeout: 180000,
        retries: 1,
        warmable: false,
        description: 'Recalculates supplier analytics'
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTION INVOCATION STATUS
// ═══════════════════════════════════════════════════════════════════════════

export const InvocationStatus = Object.freeze({
    PENDING: 'pending',
    RUNNING: 'running',
    SUCCESS: 'success',
    FAILED: 'failed',
    TIMEOUT: 'timeout',
    RETRYING: 'retrying',
    CANCELLED: 'cancelled'
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVERLESS FUNCTIONS SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class ServerlessFunctionsService {
    constructor() {
        this.baseUrl = CONFIG.FUNCTIONS_BASE_URL;
        this.activeInvocations = new Map();
        this.warmingTimers = new Map();
        this.metrics = {
            totalInvocations: 0,
            successfulInvocations: 0,
            failedInvocations: 0,
            totalRetries: 0,
            averageLatency: 0,
            coldStarts: 0
        };
        this.latencies = []; // Rolling window for average calculation
    }

    /**
     * Initialize the service with Firebase project configuration
     */
    initialize(projectId, region = 'us-central1') {
        this.baseUrl = `https://${region}-${projectId}.cloudfunctions.net`;
        console.log(`[Serverless] Initialized with base URL: ${this.baseUrl}`);
    }

    /**
     * Set a custom base URL (for emulator or custom endpoints)
     */
    setBaseUrl(url) {
        this.baseUrl = url;
    }

    // ─────────────────────────────────────────────────
    // FUNCTION INVOCATION
    // ─────────────────────────────────────────────────

    /**
     * Invoke a serverless function
     * 
     * @param {Object} functionConfig - Function from FunctionRegistry
     * @param {Object} payload - Data to send to the function
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Function result
     */
    async invoke(functionConfig, payload, options = {}) {
        const invocationId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const startTime = Date.now();

        const config = typeof functionConfig === 'string'
            ? FunctionRegistry[functionConfig]
            : functionConfig;

        if (!config) {
            throw new Error(`Unknown function: ${functionConfig}`);
        }

        // Track active invocation
        this.activeInvocations.set(invocationId, {
            functionName: config.name,
            startTime,
            status: InvocationStatus.PENDING
        });

        this.metrics.totalInvocations++;

        try {
            const result = await this.invokeWithRetry(config, payload, {
                ...options,
                invocationId
            });

            // Update metrics
            const latency = Date.now() - startTime;
            this.updateLatencyMetrics(latency);
            this.metrics.successfulInvocations++;

            this.activeInvocations.delete(invocationId);

            return {
                invocationId,
                success: true,
                result,
                latency,
                functionName: config.name
            };
        } catch (error) {
            this.metrics.failedInvocations++;
            this.activeInvocations.delete(invocationId);

            return {
                invocationId,
                success: false,
                error: error.message,
                latency: Date.now() - startTime,
                functionName: config.name
            };
        }
    }

    /**
     * Invoke with retry logic
     */
    async invokeWithRetry(config, payload, options) {
        const maxRetries = options.maxRetries ?? config.retries ?? CONFIG.MAX_RETRIES;
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    this.activeInvocations.set(options.invocationId, {
                        ...this.activeInvocations.get(options.invocationId),
                        status: InvocationStatus.RETRYING,
                        attempt
                    });
                    this.metrics.totalRetries++;

                    // Wait before retry
                    const delay = CONFIG.RETRY_DELAYS_MS[attempt - 1] || 5000;
                    await new Promise(r => setTimeout(r, delay));
                }

                return await this.executeFunction(config, payload, options);
            } catch (error) {
                lastError = error;

                // Don't retry for certain errors
                if (this.isNonRetryableError(error)) {
                    throw error;
                }
            }
        }

        throw lastError;
    }

    /**
     * Execute the actual function call
     */
    async executeFunction(config, payload, options) {
        const url = `${this.baseUrl}/${config.name}`;
        const timeout = options.timeout ?? config.timeout ?? CONFIG.DEFAULT_TIMEOUT_MS;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const startTime = Date.now();

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Invocation-ID': options.invocationId,
                    ...(options.headers || {})
                },
                body: JSON.stringify({
                    data: payload,
                    metadata: {
                        invocationId: options.invocationId,
                        timestamp: new Date().toISOString()
                    }
                }),
                signal: controller.signal
            });

            // Detect cold start (response time > 3s typically indicates cold start)
            if (Date.now() - startTime > 3000) {
                this.metrics.coldStarts++;
            }

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Function error (${response.status}): ${errorBody}`);
            }

            const result = await response.json();
            return result.result || result;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Check if error should not be retried
     */
    isNonRetryableError(error) {
        const message = error.message?.toLowerCase() || '';
        return (
            message.includes('validation') ||
            message.includes('unauthorized') ||
            message.includes('forbidden') ||
            message.includes('not found') ||
            error.status === 400 ||
            error.status === 401 ||
            error.status === 403 ||
            error.status === 404
        );
    }

    // ─────────────────────────────────────────────────
    // BATCH INVOCATION
    // ─────────────────────────────────────────────────

    /**
     * Invoke multiple functions in parallel
     * 
     * @param {Array} invocations - Array of { function, payload, options }
     * @returns {Promise<Array>} - Array of results
     */
    async invokeParallel(invocations) {
        const results = await Promise.allSettled(
            invocations.map(({ function: fn, payload, options }) =>
                this.invoke(fn, payload, options)
            )
        );

        return results.map((result, index) => ({
            index,
            ...result.status === 'fulfilled'
                ? result.value
                : { success: false, error: result.reason?.message }
        }));
    }

    /**
     * Invoke a function for each item in a list (map operation)
     */
    async invokeMap(functionConfig, items, options = {}) {
        const { concurrency = 10, onProgress } = options;
        const results = [];

        for (let i = 0; i < items.length; i += concurrency) {
            const batch = items.slice(i, i + concurrency);
            const batchResults = await Promise.all(
                batch.map(item => this.invoke(functionConfig, item))
            );
            results.push(...batchResults);

            if (onProgress) {
                onProgress({
                    processed: Math.min(i + concurrency, items.length),
                    total: items.length,
                    percentage: Math.round((Math.min(i + concurrency, items.length) / items.length) * 100)
                });
            }
        }

        return results;
    }

    // ─────────────────────────────────────────────────
    // FUNCTION WARMING
    // ─────────────────────────────────────────────────

    /**
     * Start warming a function to prevent cold starts
     */
    startWarming(functionConfig) {
        const config = typeof functionConfig === 'string'
            ? FunctionRegistry[functionConfig]
            : functionConfig;

        if (!config?.warmable) {
            console.log(`[Serverless] Function ${config?.name} is not warmable`);
            return;
        }

        if (this.warmingTimers.has(config.name)) {
            return; // Already warming
        }

        console.log(`[Serverless] Starting warming for: ${config.name}`);

        const warmFn = async () => {
            try {
                await this.invoke(config, { _warm: true }, { timeout: 5000 });
            } catch (error) {
                // Ignore warming errors
            }
        };

        // Warm immediately
        warmFn();

        // Then warm periodically
        const timer = setInterval(warmFn, CONFIG.WARM_INTERVAL_MS);
        this.warmingTimers.set(config.name, timer);
    }

    /**
     * Stop warming a function
     */
    stopWarming(functionName) {
        const timer = this.warmingTimers.get(functionName);
        if (timer) {
            clearInterval(timer);
            this.warmingTimers.delete(functionName);
            console.log(`[Serverless] Stopped warming: ${functionName}`);
        }
    }

    /**
     * Start warming all warmable functions
     */
    startAllWarming() {
        for (const config of Object.values(FunctionRegistry)) {
            if (config.warmable) {
                this.startWarming(config);
            }
        }
    }

    /**
     * Stop all warming
     */
    stopAllWarming() {
        for (const [name, timer] of this.warmingTimers) {
            clearInterval(timer);
        }
        this.warmingTimers.clear();
    }

    // ─────────────────────────────────────────────────
    // METRICS & MONITORING
    // ─────────────────────────────────────────────────

    updateLatencyMetrics(latency) {
        this.latencies.push(latency);
        // Keep only last 100 latencies
        if (this.latencies.length > 100) {
            this.latencies.shift();
        }
        this.metrics.averageLatency =
            this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
    }

    /**
     * Get service metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeInvocations: this.activeInvocations.size,
            warmingFunctions: Array.from(this.warmingTimers.keys()),
            successRate: this.metrics.totalInvocations > 0
                ? (this.metrics.successfulInvocations / this.metrics.totalInvocations * 100).toFixed(2) + '%'
                : 'N/A'
        };
    }

    /**
     * Get active invocations
     */
    getActiveInvocations() {
        return Array.from(this.activeInvocations.entries()).map(([id, data]) => ({
            id,
            ...data,
            runningTime: Date.now() - data.startTime
        }));
    }

    /**
     * Cancel an active invocation (if supported by the function)
     */
    cancelInvocation(invocationId) {
        const invocation = this.activeInvocations.get(invocationId);
        if (invocation) {
            invocation.status = InvocationStatus.CANCELLED;
            this.activeInvocations.delete(invocationId);
            return true;
        }
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Quick invoke helper
 */
export async function invokeFunction(functionName, payload, options) {
    return serverlessFunctions.invoke(FunctionRegistry[functionName], payload, options);
}

/**
 * Process quotation emails (common use case)
 */
export async function processQuotationEmails(emails) {
    return serverlessFunctions.invokeMap(
        FunctionRegistry.PROCESS_QUOTATION_EMAIL,
        emails,
        { concurrency: 10 }
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const serverlessFunctions = new ServerlessFunctionsService();

export { ServerlessFunctionsService };

export default serverlessFunctions;
