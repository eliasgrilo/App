/**
 * Multi-Agent Orchestrator Service - Enterprise Swarm Architecture
 * 
 * PREMIUM FEATURE #5: Multi-Agent Orchestration
 * 
 * Implements a swarm of specialized micro-agents that work in parallel:
 * - EmailAgent: Parses incoming supplier emails
 * - PriceAgent: Analyzes price changes and trends
 * - StockAgent: Monitors inventory levels
 * - NegotiatorAgent: Handles supplier negotiations
 * - ValidatorAgent: Validates data integrity
 * 
 * Architecture principles:
 * - Each agent is independent and stateless
 * - Agents can run in parallel for maximum efficiency
 * - Results are aggregated with conflict resolution
 * - Failed agents don't block the entire workflow
 * 
 * @module multiAgentOrchestrator
 */

import { eventStore } from './eventStoreService';
import { vectorEmbedding } from './vectorEmbeddingService';

// ═══════════════════════════════════════════════════════════════════════════
// AGENT TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const AgentType = Object.freeze({
    EMAIL_PARSER: 'email_parser',
    PRICE_ANALYZER: 'price_analyzer',
    STOCK_CHECKER: 'stock_checker',
    NEGOTIATOR: 'negotiator',
    VALIDATOR: 'validator',
    PRODUCT_MATCHER: 'product_matcher',
    SUPPLIER_SCORER: 'supplier_scorer'
});

export const AgentStatus = Object.freeze({
    IDLE: 'idle',
    RUNNING: 'running',
    SUCCESS: 'success',
    FAILED: 'failed',
    TIMEOUT: 'timeout'
});

// ═══════════════════════════════════════════════════════════════════════════
// AGENT BASE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class BaseAgent {
    constructor(type, config = {}) {
        this.type = type;
        this.id = `agent_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.status = AgentStatus.IDLE;
        this.config = {
            timeout: 30000, // 30 second default timeout
            retries: 2,
            ...config
        };
        this.metrics = {
            executionCount: 0,
            successCount: 0,
            averageExecutionTime: 0
        };
    }

    // Execute the agent's task with timeout and retry logic
    async execute(task, context = {}) {
        const startTime = Date.now();
        this.status = AgentStatus.RUNNING;
        this.metrics.executionCount++;

        let lastError;
        for (let attempt = 0; attempt <= this.config.retries; attempt++) {
            try {
                const result = await Promise.race([
                    this.process(task, context),
                    this.timeoutPromise()
                ]);

                this.status = AgentStatus.SUCCESS;
                this.metrics.successCount++;
                this.updateAverageTime(Date.now() - startTime);

                return {
                    agentId: this.id,
                    agentType: this.type,
                    status: 'success',
                    result,
                    executionTime: Date.now() - startTime,
                    attempt: attempt + 1
                };
            } catch (error) {
                lastError = error;
                if (error.message === 'TIMEOUT') {
                    this.status = AgentStatus.TIMEOUT;
                } else {
                    this.status = AgentStatus.FAILED;
                }

                // Wait before retry (exponential backoff)
                if (attempt < this.config.retries) {
                    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
                }
            }
        }

        return {
            agentId: this.id,
            agentType: this.type,
            status: 'failed',
            error: lastError?.message || 'Unknown error',
            executionTime: Date.now() - startTime
        };
    }

    // Abstract method - must be implemented by each agent
    async process(task, context) {
        throw new Error('Agent.process() must be implemented by subclass');
    }

    timeoutPromise() {
        return new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), this.config.timeout)
        );
    }

    updateAverageTime(newTime) {
        const n = this.metrics.successCount;
        this.metrics.averageExecutionTime =
            ((this.metrics.averageExecutionTime * (n - 1)) + newTime) / n;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIALIZED AGENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Email Parser Agent
 * Extracts structured data from supplier emails
 */
class EmailParserAgent extends BaseAgent {
    constructor(config = {}) {
        super(AgentType.EMAIL_PARSER, config);
    }

    async process(task, context) {
        const { emailContent, senderInfo } = task;

        // Extract key information using patterns
        const extracted = {
            products: this.extractProducts(emailContent),
            prices: this.extractPrices(emailContent),
            dates: this.extractDates(emailContent),
            quantities: this.extractQuantities(emailContent),
            supplier: senderInfo?.name || this.extractSupplier(emailContent)
        };

        return {
            extracted,
            confidence: this.calculateConfidence(extracted),
            rawContent: emailContent.substring(0, 500) // First 500 chars for reference
        };
    }

    extractProducts(content) {
        // Product extraction patterns
        const productPatterns = [
            /(?:produto|item|material)[:\s]*([^\n,]+)/gi,
            /(\d+(?:\.\d+)?\s*(?:kg|g|un|lt|ml)\s+[^\n,]+)/gi
        ];

        const products = [];
        for (const pattern of productPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                products.push(match[1]?.trim());
            }
        }
        return [...new Set(products.filter(Boolean))];
    }

    extractPrices(content) {
        const pricePattern = /R\$\s*(\d+[.,]\d{2})/g;
        const prices = [];
        const matches = content.matchAll(pricePattern);
        for (const match of matches) {
            prices.push(parseFloat(match[1].replace(',', '.')));
        }
        return prices;
    }

    extractDates(content) {
        const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;
        const dates = [];
        const matches = content.matchAll(datePattern);
        for (const match of matches) {
            dates.push(match[1]);
        }
        return dates;
    }

    extractQuantities(content) {
        const qtyPattern = /(\d+(?:[.,]\d+)?)\s*(kg|g|un|unidade|lt|ml|cx|caixa)/gi;
        const quantities = [];
        const matches = content.matchAll(qtyPattern);
        for (const match of matches) {
            quantities.push({
                value: parseFloat(match[1].replace(',', '.')),
                unit: match[2].toLowerCase()
            });
        }
        return quantities;
    }

    extractSupplier(content) {
        // Try to find company names
        const supplierPatterns = [
            /(?:de|from|empresa)[:\s]*([A-Z][a-zA-Z\s]+(?:Ltda|LTDA|S\.?A\.?|ME|EPP)?)/,
            /^([A-Z][a-zA-Z\s]+(?:Ltda|LTDA|S\.?A\.?|ME|EPP))/m
        ];

        for (const pattern of supplierPatterns) {
            const match = content.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
    }

    calculateConfidence(extracted) {
        let score = 0;
        if (extracted.products.length > 0) score += 0.3;
        if (extracted.prices.length > 0) score += 0.25;
        if (extracted.dates.length > 0) score += 0.15;
        if (extracted.quantities.length > 0) score += 0.15;
        if (extracted.supplier) score += 0.15;
        return Math.min(score, 1);
    }
}

/**
 * Price Analyzer Agent
 * Analyzes price trends and detects anomalies
 */
class PriceAnalyzerAgent extends BaseAgent {
    constructor(config = {}) {
        super(AgentType.PRICE_ANALYZER, config);
    }

    async process(task, context) {
        const { currentPrice, productId, historicalPrices = [] } = task;

        // Calculate statistics
        const stats = this.calculateStats(historicalPrices);
        const priceChange = this.calculatePriceChange(currentPrice, stats.average);
        const isAnomaly = this.detectAnomaly(currentPrice, stats);
        const trend = this.determineTrend(historicalPrices);

        return {
            currentPrice,
            stats,
            priceChange,
            isAnomaly,
            trend,
            recommendation: this.generateRecommendation(priceChange, isAnomaly, trend)
        };
    }

    calculateStats(prices) {
        if (!prices.length) return { average: 0, min: 0, max: 0, stdDev: 0 };

        const sum = prices.reduce((a, b) => a + b, 0);
        const average = sum / prices.length;
        const min = Math.min(...prices);
        const max = Math.max(...prices);

        const squareDiffs = prices.map(p => Math.pow(p - average, 2));
        const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / prices.length);

        return { average, min, max, stdDev };
    }

    calculatePriceChange(current, average) {
        if (!average) return 0;
        return ((current - average) / average) * 100;
    }

    detectAnomaly(current, stats) {
        if (!stats.stdDev) return false;
        // Price is anomaly if more than 2 standard deviations from mean
        return Math.abs(current - stats.average) > (2 * stats.stdDev);
    }

    determineTrend(prices) {
        if (prices.length < 3) return 'insufficient_data';

        const recent = prices.slice(-5);
        let upCount = 0, downCount = 0;

        for (let i = 1; i < recent.length; i++) {
            if (recent[i] > recent[i - 1]) upCount++;
            else if (recent[i] < recent[i - 1]) downCount++;
        }

        if (upCount > downCount + 1) return 'rising';
        if (downCount > upCount + 1) return 'falling';
        return 'stable';
    }

    generateRecommendation(changePercent, isAnomaly, trend) {
        if (isAnomaly && changePercent > 0) return 'REVIEW_BEFORE_ACCEPT';
        if (trend === 'falling' && changePercent < -5) return 'NEGOTIATE_FURTHER';
        if (trend === 'rising' && changePercent < 5) return 'ACCEPT_QUICKLY';
        return 'STANDARD_REVIEW';
    }
}

/**
 * Stock Checker Agent
 * Monitors inventory levels and predicts needs
 */
class StockCheckerAgent extends BaseAgent {
    constructor(config = {}) {
        super(AgentType.STOCK_CHECKER, config);
    }

    async process(task, context) {
        const { productId, currentStock, dailyUsage, minimumStock, leadTime = 3 } = task;

        const daysUntilStockout = dailyUsage > 0 ? currentStock / dailyUsage : Infinity;
        const reorderPoint = (dailyUsage * leadTime) + minimumStock;
        const needsReorder = currentStock <= reorderPoint;
        const urgency = this.calculateUrgency(daysUntilStockout, leadTime);

        return {
            productId,
            currentStock,
            daysUntilStockout: Math.round(daysUntilStockout),
            reorderPoint,
            needsReorder,
            urgency,
            suggestedQuantity: this.calculateSuggestedOrder(dailyUsage, leadTime, minimumStock)
        };
    }

    calculateUrgency(daysUntilStockout, leadTime) {
        if (daysUntilStockout <= leadTime) return 'CRITICAL';
        if (daysUntilStockout <= leadTime * 1.5) return 'HIGH';
        if (daysUntilStockout <= leadTime * 2) return 'MEDIUM';
        return 'LOW';
    }

    calculateSuggestedOrder(dailyUsage, leadTime, minimumStock) {
        // Order for 2 weeks + lead time + safety stock
        return Math.ceil((dailyUsage * 14) + (dailyUsage * leadTime) + minimumStock);
    }
}

/**
 * Product Matcher Agent
 * Uses vector embeddings to match products semantically
 */
class ProductMatcherAgent extends BaseAgent {
    constructor(config = {}) {
        super(AgentType.PRODUCT_MATCHER, { timeout: 45000, ...config });
    }

    async process(task, context) {
        const { productName, productList = [], threshold = 0.75 } = task;

        if (!vectorEmbedding.isReady()) {
            return { matches: [], message: 'Vector embedding service not ready' };
        }

        try {
            // Find similar products using semantic search
            const results = await vectorEmbedding.findSimilarProducts(productName, null);

            const matches = results
                .filter(r => r.similarity >= threshold)
                .map(r => ({
                    id: r.entityId,
                    text: r.text,
                    similarity: r.similarity,
                    level: r.level
                }));

            return {
                query: productName,
                matches,
                bestMatch: matches[0] || null,
                confidence: matches[0]?.similarity || 0
            };
        } catch (error) {
            return {
                query: productName,
                matches: [],
                error: error.message
            };
        }
    }
}

/**
 * Validator Agent
 * Validates data integrity using rule engine
 */
class ValidatorAgent extends BaseAgent {
    constructor(config = {}) {
        super(AgentType.VALIDATOR, config);
    }

    async process(task, context) {
        const { data, rules = 'quotation' } = task;
        const validationRules = this.getRulesForType(rules);

        const results = [];
        let isValid = true;

        for (const [field, validator] of Object.entries(validationRules)) {
            const value = data[field];
            const result = validator(value, data);

            results.push({
                field,
                value,
                valid: result.valid,
                message: result.message
            });

            if (!result.valid && result.severity === 'error') {
                isValid = false;
            }
        }

        return {
            isValid,
            results,
            errorCount: results.filter(r => !r.valid).length,
            summary: this.generateSummary(results)
        };
    }

    getRulesForType(type) {
        const rules = {
            quotation: {
                price: (v) => ({
                    valid: typeof v === 'number' && v > 0,
                    message: v > 0 ? 'Valid' : 'Price must be positive',
                    severity: 'error'
                }),
                quantity: (v) => ({
                    valid: Number.isInteger(v) && v > 0,
                    message: v > 0 ? 'Valid' : 'Quantity must be positive integer',
                    severity: 'error'
                }),
                supplierId: (v) => ({
                    valid: typeof v === 'string' && v.length > 0,
                    message: v ? 'Valid' : 'Supplier is required',
                    severity: 'error'
                }),
                expirationDate: (v) => ({
                    valid: !v || new Date(v) > new Date(),
                    message: new Date(v) > new Date() ? 'Valid' : 'Date must be in future',
                    severity: 'warning'
                })
            },
            order: {
                items: (v) => ({
                    valid: Array.isArray(v) && v.length > 0,
                    message: v?.length ? 'Valid' : 'Order must have items',
                    severity: 'error'
                }),
                totalAmount: (v, data) => {
                    const calculatedTotal = (data.items || []).reduce(
                        (sum, item) => sum + (item.price * item.quantity), 0
                    );
                    return {
                        valid: Math.abs(v - calculatedTotal) < 0.01,
                        message: Math.abs(v - calculatedTotal) < 0.01 ? 'Valid' : 'Total mismatch',
                        severity: 'error'
                    };
                }
            }
        };
        return rules[type] || rules.quotation;
    }

    generateSummary(results) {
        const errors = results.filter(r => !r.valid);
        if (errors.length === 0) return 'All validations passed';
        return `${errors.length} validation(s) failed: ${errors.map(e => e.field).join(', ')}`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR CLASS
// ═══════════════════════════════════════════════════════════════════════════

class AgentOrchestrator {
    constructor() {
        this.agents = new Map();
        this.taskHistory = [];
        this.registerDefaultAgents();
    }

    registerDefaultAgents() {
        this.registerAgent(new EmailParserAgent());
        this.registerAgent(new PriceAnalyzerAgent());
        this.registerAgent(new StockCheckerAgent());
        this.registerAgent(new ProductMatcherAgent());
        this.registerAgent(new ValidatorAgent());
    }

    registerAgent(agent) {
        this.agents.set(agent.type, agent);
    }

    getAgent(type) {
        return this.agents.get(type);
    }

    /**
     * Execute a swarm of agents in parallel
     * 
     * @param {Object} masterTask - The main task containing data for all agents
     * @param {string[]} agentTypes - Which agents to involve
     * @param {Object} context - Shared context for all agents
     * @returns {Promise<Object>} Aggregated results from all agents
     */
    async executeSwarm(masterTask, agentTypes, context = {}) {
        const startTime = Date.now();
        const correlationId = `swarm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        // Log swarm start event
        await this.logEvent('SWARM_STARTED', {
            correlationId,
            agentTypes,
            taskPreview: JSON.stringify(masterTask).substring(0, 200)
        });

        // Execute all agents in parallel
        const agentPromises = agentTypes.map(type => {
            const agent = this.agents.get(type);
            if (!agent) {
                return Promise.resolve({
                    agentType: type,
                    status: 'failed',
                    error: `Agent ${type} not found`
                });
            }

            const agentTask = this.extractTaskForAgent(masterTask, type);
            return agent.execute(agentTask, context);
        });

        // Wait for all agents to complete (don't fail-fast)
        const results = await Promise.allSettled(agentPromises);

        // Process results
        const aggregated = this.aggregateResults(results.map((r, i) => ({
            type: agentTypes[i],
            result: r.status === 'fulfilled' ? r.value : { status: 'failed', error: r.reason }
        })));

        const totalTime = Date.now() - startTime;

        // Log swarm completion
        await this.logEvent('SWARM_COMPLETED', {
            correlationId,
            executionTime: totalTime,
            successCount: aggregated.successful.length,
            failureCount: aggregated.failed.length
        });

        // Store in history
        this.taskHistory.push({
            correlationId,
            timestamp: new Date().toISOString(),
            agentTypes,
            results: aggregated,
            executionTime: totalTime
        });

        return {
            correlationId,
            executionTime: totalTime,
            ...aggregated
        };
    }

    /**
     * Route a single task to the most appropriate agent
     */
    async routeToAgent(task) {
        const agentType = this.inferAgentType(task);
        const agent = this.agents.get(agentType);

        if (!agent) {
            throw new Error(`No agent found for task type: ${task.type || 'unknown'}`);
        }

        return agent.execute(task, {});
    }

    /**
     * Extract agent-specific task from master task
     */
    extractTaskForAgent(masterTask, agentType) {
        // Each agent gets a subset of the master task
        const extractors = {
            [AgentType.EMAIL_PARSER]: () => ({
                emailContent: masterTask.emailContent || masterTask.content,
                senderInfo: masterTask.sender || masterTask.senderInfo
            }),
            [AgentType.PRICE_ANALYZER]: () => ({
                currentPrice: masterTask.price ?? masterTask.currentPrice,
                productId: masterTask.productId,
                historicalPrices: masterTask.priceHistory || []
            }),
            [AgentType.STOCK_CHECKER]: () => ({
                productId: masterTask.productId,
                currentStock: masterTask.stock || masterTask.currentStock,
                dailyUsage: masterTask.dailyUsage || 0,
                minimumStock: masterTask.minimumStock || 0
            }),
            [AgentType.PRODUCT_MATCHER]: () => ({
                productName: masterTask.productName || masterTask.name,
                productList: masterTask.products || []
            }),
            [AgentType.VALIDATOR]: () => ({
                data: masterTask.data || masterTask,
                rules: masterTask.validationRules || 'quotation'
            })
        };

        const extractor = extractors[agentType];
        return extractor ? extractor() : masterTask;
    }

    /**
     * Aggregate results from multiple agents
     */
    aggregateResults(agentResults) {
        const successful = [];
        const failed = [];
        const combined = {};

        for (const { type, result } of agentResults) {
            if (result.status === 'success') {
                successful.push({ type, result: result.result });
                combined[type] = result.result;
            } else {
                failed.push({ type, error: result.error });
            }
        }

        // Resolve conflicts if multiple agents return overlapping data
        const resolved = this.resolveConflicts(combined);

        return {
            successful,
            failed,
            combined: resolved,
            hasFailures: failed.length > 0,
            allSucceeded: failed.length === 0
        };
    }

    /**
     * Resolve conflicts when multiple agents return overlapping data
     */
    resolveConflicts(combined) {
        // Priority-based conflict resolution
        // Validator > PriceAnalyzer > StockChecker > EmailParser
        const resolved = { ...combined };

        // If validator says data is invalid, flag it
        if (combined[AgentType.VALIDATOR]?.isValid === false) {
            resolved._validationFailed = true;
            resolved._validationErrors = combined[AgentType.VALIDATOR].results.filter(r => !r.valid);
        }

        // Merge price analysis with email extracted prices
        if (combined[AgentType.EMAIL_PARSER]?.extracted?.prices &&
            combined[AgentType.PRICE_ANALYZER]) {
            resolved._priceReconciliation = {
                extracted: combined[AgentType.EMAIL_PARSER].extracted.prices,
                analyzed: combined[AgentType.PRICE_ANALYZER].currentPrice,
                match: combined[AgentType.EMAIL_PARSER].extracted.prices.includes(
                    combined[AgentType.PRICE_ANALYZER].currentPrice
                )
            };
        }

        return resolved;
    }

    /**
     * Infer the best agent type for a given task
     */
    inferAgentType(task) {
        if (task.emailContent || task.content?.includes('@')) return AgentType.EMAIL_PARSER;
        if (task.price || task.currentPrice) return AgentType.PRICE_ANALYZER;
        if (task.stock || task.currentStock) return AgentType.STOCK_CHECKER;
        if (task.productName || task.matchQuery) return AgentType.PRODUCT_MATCHER;
        if (task.validate || task.data) return AgentType.VALIDATOR;
        return AgentType.VALIDATOR; // Default to validation
    }

    /**
     * Log orchestrator events to event store
     */
    async logEvent(eventType, payload) {
        try {
            if (eventStore) {
                await eventStore.append({
                    eventType: `ORCHESTRATOR_${eventType}`,
                    aggregateType: 'orchestrator',
                    aggregateId: 'main',
                    payload
                });
            }
        } catch (error) {
            console.warn('[Orchestrator] Failed to log event:', error.message);
        }
    }

    /**
     * Get orchestrator metrics
     */
    getMetrics() {
        const agentMetrics = {};
        for (const [type, agent] of this.agents) {
            agentMetrics[type] = { ...agent.metrics };
        }

        return {
            totalSwarms: this.taskHistory.length,
            averageSwarmTime: this.taskHistory.length > 0
                ? this.taskHistory.reduce((sum, t) => sum + t.executionTime, 0) / this.taskHistory.length
                : 0,
            agentMetrics,
            recentTasks: this.taskHistory.slice(-10)
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const agentOrchestrator = new AgentOrchestrator();

// Export individual agent classes for custom instantiation
export {
    BaseAgent,
    EmailParserAgent,
    PriceAnalyzerAgent,
    StockCheckerAgent,
    ProductMatcherAgent,
    ValidatorAgent
};

export default agentOrchestrator;
