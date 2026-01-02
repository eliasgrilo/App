/**
 * Circuit Breaker Service - Enterprise-Grade Fault Tolerance
 * 
 * Implements the Circuit Breaker pattern to prevent cascade failures
 * when calling external services or unreliable dependencies.
 * 
 * State Machine:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failure threshold exceeded, requests fail immediately
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 * 
 * Architecture Pattern: Circuit Breaker
 * - Prevents repeated calls to failing services
 * - Allows system to gracefully degrade
 * - Auto-recovery with health checks
 * 
 * @module CircuitBreakerService
 * @version 1.0.0
 */

import { EventStoreService } from './eventStoreService';

// ═══════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER STATES
// ═══════════════════════════════════════════════════════════════════════════

export const CircuitState = Object.freeze({
    CLOSED: 'closed',       // Normal operation
    OPEN: 'open',           // Circuit tripped, fast-fail
    HALF_OPEN: 'half_open'  // Testing recovery
});

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
    // Number of failures before opening circuit
    failureThreshold: 5,

    // Percentage of failures to trip (alternative to count)
    failureRateThreshold: 0.5, // 50%

    // Time window for counting failures (ms)
    failureWindow: 60000, // 1 minute

    // Time to wait before testing recovery (ms)
    resetTimeout: 30000, // 30 seconds

    // Number of successful calls in half-open to close circuit
    successThreshold: 3,

    // Request timeout (ms)
    timeout: 10000, // 10 seconds

    // Enable automatic recovery testing
    autoRecovery: true,

    // Health check interval when open (ms)
    healthCheckInterval: 10000 // 10 seconds
};

// ═══════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class CircuitBreaker {
    constructor(name, config = {}) {
        this.name = name;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.state = CircuitState.CLOSED;

        // Failure tracking
        this.failures = [];
        this.successes = 0;
        this.consecutiveSuccesses = 0;

        // Timing
        this.lastFailureTime = null;
        this.openedAt = null;
        this.lastStateChange = new Date().toISOString();

        // Metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rejectedRequests: 0,
            timeouts: 0,
            stateChanges: 0
        };

        // Health check
        this.healthCheckTimer = null;
        this.healthCheckFunction = null;

        console.log(`⚡ Circuit Breaker created: ${name}`);
    }

    /**
     * Execute a function through the circuit breaker
     * @param {Function} fn - Function to execute (async)
     * @param {*} fallback - Fallback value or function if circuit is open
     * @returns {Promise<*>} - Result or fallback
     */
    async execute(fn, fallback = null) {
        this.metrics.totalRequests++;

        // Check circuit state
        if (this.state === CircuitState.OPEN) {
            // Check if we should transition to half-open
            if (this.shouldAttemptReset()) {
                this.transitionTo(CircuitState.HALF_OPEN);
            } else {
                this.metrics.rejectedRequests++;
                console.log(`🔴 Circuit OPEN: ${this.name} - Request rejected`);
                return this.handleFallback(fallback, new Error('Circuit is open'));
            }
        }

        try {
            // Execute with timeout
            const result = await this.executeWithTimeout(fn);

            // Record success
            this.onSuccess();

            return result;

        } catch (error) {
            // Record failure
            this.onFailure(error);

            // Return fallback if provided
            if (fallback !== null) {
                return this.handleFallback(fallback, error);
            }

            throw error;
        }
    }

    /**
     * Execute function with timeout
     */
    async executeWithTimeout(fn) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.metrics.timeouts++;
                reject(new Error(`Timeout after ${this.config.timeout}ms`));
            }, this.config.timeout);

            try {
                const result = await fn();
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /**
     * Handle successful execution
     */
    onSuccess() {
        this.metrics.successfulRequests++;
        this.consecutiveSuccesses++;

        if (this.state === CircuitState.HALF_OPEN) {
            console.log(`🟡 Half-open success: ${this.consecutiveSuccesses}/${this.config.successThreshold}`);

            if (this.consecutiveSuccesses >= this.config.successThreshold) {
                this.transitionTo(CircuitState.CLOSED);
            }
        }

        // Clear old failures outside the window
        this.cleanupFailures();
    }

    /**
     * Handle failed execution
     */
    onFailure(error) {
        this.metrics.failedRequests++;
        this.consecutiveSuccesses = 0;
        this.lastFailureTime = Date.now();

        // Record failure
        this.failures.push({
            timestamp: Date.now(),
            error: error.message
        });

        console.log(`❌ Circuit failure: ${this.name} - ${error.message}`);

        // Check if we should open the circuit
        if (this.state === CircuitState.CLOSED) {
            if (this.shouldTrip()) {
                this.transitionTo(CircuitState.OPEN);
            }
        } else if (this.state === CircuitState.HALF_OPEN) {
            // Single failure in half-open state reopens the circuit
            this.transitionTo(CircuitState.OPEN);
        }

        // Clean up old failures
        this.cleanupFailures();
    }

    /**
     * Check if circuit should trip to OPEN
     */
    shouldTrip() {
        const recentFailures = this.getRecentFailures();

        // Check absolute threshold
        if (recentFailures.length >= this.config.failureThreshold) {
            console.log(`⚠️ Failure threshold reached: ${recentFailures.length}/${this.config.failureThreshold}`);
            return true;
        }

        // Check failure rate
        if (this.metrics.totalRequests >= 10) { // Need minimum requests
            const failureRate = this.metrics.failedRequests / this.metrics.totalRequests;
            if (failureRate >= this.config.failureRateThreshold) {
                console.log(`⚠️ Failure rate threshold reached: ${(failureRate * 100).toFixed(1)}%`);
                return true;
            }
        }

        return false;
    }

    /**
     * Check if we should attempt to reset (close) the circuit
     */
    shouldAttemptReset() {
        if (!this.openedAt) return false;
        return Date.now() - this.openedAt >= this.config.resetTimeout;
    }

    /**
     * Get failures within the time window
     */
    getRecentFailures() {
        const windowStart = Date.now() - this.config.failureWindow;
        return this.failures.filter(f => f.timestamp >= windowStart);
    }

    /**
     * Clean up old failures outside the window
     */
    cleanupFailures() {
        const windowStart = Date.now() - this.config.failureWindow;
        this.failures = this.failures.filter(f => f.timestamp >= windowStart);
    }

    /**
     * Transition to a new state
     */
    transitionTo(newState) {
        const previousState = this.state;
        this.state = newState;
        this.lastStateChange = new Date().toISOString();
        this.metrics.stateChanges++;

        console.log(`🔄 Circuit ${this.name}: ${previousState} → ${newState}`);

        if (newState === CircuitState.OPEN) {
            this.openedAt = Date.now();
            this.consecutiveSuccesses = 0;

            // Start health check if configured
            if (this.config.autoRecovery && this.healthCheckFunction) {
                this.startHealthCheck();
            }
        } else if (newState === CircuitState.CLOSED) {
            this.openedAt = null;
            this.failures = [];
            this.stopHealthCheck();
        } else if (newState === CircuitState.HALF_OPEN) {
            this.consecutiveSuccesses = 0;
            this.stopHealthCheck();
        }

        // Emit state change event
        this.emitStateChange(previousState, newState);
    }

    /**
     * Handle fallback
     */
    handleFallback(fallback, error) {
        if (typeof fallback === 'function') {
            return fallback(error);
        }
        return fallback;
    }

    /**
     * Set health check function for auto-recovery
     */
    setHealthCheck(fn) {
        this.healthCheckFunction = fn;
    }

    /**
     * Start periodic health checks when circuit is open
     */
    startHealthCheck() {
        if (this.healthCheckTimer) return;

        console.log(`🏥 Starting health checks for: ${this.name}`);

        this.healthCheckTimer = setInterval(async () => {
            if (this.state !== CircuitState.OPEN) {
                this.stopHealthCheck();
                return;
            }

            try {
                console.log(`🔍 Health check: ${this.name}`);
                await this.healthCheckFunction();

                // Health check passed, try half-open
                console.log(`✅ Health check passed: ${this.name}`);
                this.transitionTo(CircuitState.HALF_OPEN);

            } catch (error) {
                console.log(`❌ Health check failed: ${this.name} - ${error.message}`);
                // Stay open, reset timer
                this.openedAt = Date.now();
            }
        }, this.config.healthCheckInterval);
    }

    /**
     * Stop health checks
     */
    stopHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
    }

    /**
     * Emit state change event
     */
    async emitStateChange(previousState, newState) {
        try {
            await EventStoreService.append({
                eventType: 'CIRCUIT_STATE_CHANGED',
                aggregateId: this.name,
                aggregateType: 'CircuitBreaker',
                payload: {
                    previousState,
                    newState,
                    metrics: this.getMetrics(),
                    recentFailures: this.getRecentFailures().length
                }
            });
        } catch (e) {
            console.warn('Circuit breaker event emission failed:', e.message);
        }
    }

    /**
     * Get current circuit metrics
     */
    getMetrics() {
        return {
            name: this.name,
            state: this.state,
            ...this.metrics,
            recentFailures: this.getRecentFailures().length,
            consecutiveSuccesses: this.consecutiveSuccesses,
            openedAt: this.openedAt ? new Date(this.openedAt).toISOString() : null,
            lastStateChange: this.lastStateChange,
            successRate: this.metrics.totalRequests > 0
                ? ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Force circuit state (for testing/admin)
     */
    forceState(state) {
        console.warn(`⚠️ Forcing circuit ${this.name} to: ${state}`);
        this.transitionTo(state);
    }

    /**
     * Reset circuit to initial state
     */
    reset() {
        this.state = CircuitState.CLOSED;
        this.failures = [];
        this.consecutiveSuccesses = 0;
        this.openedAt = null;
        this.stopHealthCheck();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rejectedRequests: 0,
            timeouts: 0,
            stateChanges: 0
        };
        console.log(`🔄 Circuit ${this.name} reset`);
    }

    /**
     * Dispose circuit breaker
     */
    dispose() {
        this.stopHealthCheck();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

class CircuitBreakerRegistry {
    constructor() {
        this.breakers = new Map();
    }

    /**
     * Get or create a circuit breaker
     */
    get(name, config = {}) {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker(name, config));
        }
        return this.breakers.get(name);
    }

    /**
     * Check if breaker exists
     */
    has(name) {
        return this.breakers.has(name);
    }

    /**
     * Get all breakers
     */
    getAll() {
        return Array.from(this.breakers.values());
    }

    /**
     * Get all metrics
     */
    getAllMetrics() {
        return this.getAll().map(b => b.getMetrics());
    }

    /**
     * Remove a breaker
     */
    remove(name) {
        const breaker = this.breakers.get(name);
        if (breaker) {
            breaker.dispose();
            this.breakers.delete(name);
        }
    }

    /**
     * Reset all breakers
     */
    resetAll() {
        for (const breaker of this.breakers.values()) {
            breaker.reset();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

const registry = new CircuitBreakerRegistry();

// ═══════════════════════════════════════════════════════════════════════════
// PRE-CONFIGURED CIRCUIT BREAKERS
// ═══════════════════════════════════════════════════════════════════════════

// Gmail API Circuit Breaker
export const GmailCircuit = registry.get('gmail-api', {
    failureThreshold: 3,
    resetTimeout: 60000, // 1 minute
    timeout: 15000 // 15 seconds
});

// Gemini AI Circuit Breaker
export const GeminiCircuit = registry.get('gemini-ai', {
    failureThreshold: 5,
    resetTimeout: 30000,
    timeout: 30000 // 30 seconds for AI
});

// Firebase Circuit Breaker  
export const FirebaseCircuit = registry.get('firebase', {
    failureThreshold: 10, // More tolerant
    resetTimeout: 10000,
    timeout: 5000
});

// ═══════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const CircuitBreakerService = {
    // Factory methods
    create: (name, config) => new CircuitBreaker(name, config),
    get: (name, config) => registry.get(name, config),

    // Pre-configured breakers
    gmail: GmailCircuit,
    gemini: GeminiCircuit,
    firebase: FirebaseCircuit,

    // Convenience wrapper
    execute: async (breakerName, fn, fallback = null, config = {}) => {
        const breaker = registry.get(breakerName, config);
        return breaker.execute(fn, fallback);
    },

    // Registry operations
    getAllMetrics: () => registry.getAllMetrics(),
    resetAll: () => registry.resetAll(),

    // States enum
    State: CircuitState
};

export default CircuitBreakerService;
