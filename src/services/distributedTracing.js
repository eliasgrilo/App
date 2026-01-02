/**
 * Distributed Tracing Service - OpenTelemetry Integration
 * 
 * PREMIUM FEATURE #14: Distributed Tracing
 * 
 * X-Ray vision for requests as they travel through microservices.
 * Shows exactly where slowdowns occur.
 * 
 * Features:
 * - Trace propagation across services
 * - Span timing and hierarchy
 * - Error attribution
 * - Performance bottleneck detection
 * 
 * @module distributedTracing
 */

// ═══════════════════════════════════════════════════════════════════════════
// SPAN TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const SpanKind = Object.freeze({
    INTERNAL: 'internal',
    SERVER: 'server',
    CLIENT: 'client',
    PRODUCER: 'producer',
    CONSUMER: 'consumer'
});

export const SpanStatus = Object.freeze({
    OK: 'ok',
    ERROR: 'error',
    UNSET: 'unset'
});

// ═══════════════════════════════════════════════════════════════════════════
// SPAN CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Span {
    constructor({
        traceId,
        spanId,
        parentSpanId = null,
        name,
        kind = SpanKind.INTERNAL,
        attributes = {}
    }) {
        this.traceId = traceId;
        this.spanId = spanId;
        this.parentSpanId = parentSpanId;
        this.name = name;
        this.kind = kind;
        this.attributes = { ...attributes };
        this.events = [];
        this.links = [];
        this.status = { code: SpanStatus.UNSET };
        this.startTime = performance.now();
        this.endTime = null;
        this.ended = false;
    }

    /**
     * Add an attribute to the span
     */
    setAttribute(key, value) {
        this.attributes[key] = value;
        return this;
    }

    /**
     * Add multiple attributes
     */
    setAttributes(attributes) {
        Object.assign(this.attributes, attributes);
        return this;
    }

    /**
     * Add an event (like a log) to the span
     */
    addEvent(name, attributes = {}) {
        this.events.push({
            name,
            timestamp: performance.now(),
            attributes
        });
        return this;
    }

    /**
     * Set the span status
     */
    setStatus(code, message = '') {
        this.status = { code, message };
        return this;
    }

    /**
     * Record an exception
     */
    recordException(error) {
        this.addEvent('exception', {
            'exception.type': error.name || 'Error',
            'exception.message': error.message,
            'exception.stacktrace': error.stack
        });
        this.setStatus(SpanStatus.ERROR, error.message);
        return this;
    }

    /**
     * End the span
     */
    end() {
        if (this.ended) return;
        this.endTime = performance.now();
        this.ended = true;
        this.duration = this.endTime - this.startTime;
    }

    /**
     * Get duration in milliseconds
     */
    getDuration() {
        if (!this.ended) {
            return performance.now() - this.startTime;
        }
        return this.duration;
    }

    /**
     * Convert to OpenTelemetry format
     */
    toOTLP() {
        return {
            traceId: this.traceId,
            spanId: this.spanId,
            parentSpanId: this.parentSpanId,
            name: this.name,
            kind: this.kind,
            startTimeUnixNano: Math.floor(this.startTime * 1000000),
            endTimeUnixNano: this.endTime ? Math.floor(this.endTime * 1000000) : null,
            attributes: Object.entries(this.attributes).map(([key, value]) => ({
                key,
                value: { stringValue: String(value) }
            })),
            events: this.events.map(e => ({
                timeUnixNano: Math.floor(e.timestamp * 1000000),
                name: e.name,
                attributes: Object.entries(e.attributes).map(([key, value]) => ({
                    key,
                    value: { stringValue: String(value) }
                }))
            })),
            status: this.status
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Trace {
    constructor(traceId) {
        this.traceId = traceId;
        this.spans = new Map();
        this.startTime = Date.now();
    }

    addSpan(span) {
        this.spans.set(span.spanId, span);
    }

    getSpan(spanId) {
        return this.spans.get(spanId);
    }

    getRootSpan() {
        for (const span of this.spans.values()) {
            if (!span.parentSpanId) return span;
        }
        return null;
    }

    getDuration() {
        const root = this.getRootSpan();
        return root ? root.getDuration() : 0;
    }

    /**
     * Build span hierarchy for visualization
     */
    buildHierarchy() {
        const hierarchy = [];
        const spansByParent = new Map();

        // Group by parent
        for (const span of this.spans.values()) {
            const parentId = span.parentSpanId || 'root';
            if (!spansByParent.has(parentId)) {
                spansByParent.set(parentId, []);
            }
            spansByParent.get(parentId).push(span);
        }

        // Build tree
        const buildNode = (span, depth = 0) => ({
            span,
            depth,
            children: (spansByParent.get(span.spanId) || [])
                .map(child => buildNode(child, depth + 1))
        });

        const rootSpans = spansByParent.get('root') || [];
        return rootSpans.map(span => buildNode(span));
    }

    /**
     * Get waterfall view data
     */
    toWaterfall() {
        const root = this.getRootSpan();
        if (!root) return [];

        const baseTime = root.startTime;
        const totalDuration = root.getDuration();

        return Array.from(this.spans.values()).map(span => ({
            spanId: span.spanId,
            name: span.name,
            startOffset: span.startTime - baseTime,
            duration: span.getDuration(),
            percentStart: ((span.startTime - baseTime) / totalDuration) * 100,
            percentWidth: (span.getDuration() / totalDuration) * 100,
            status: span.status.code,
            hasError: span.status.code === SpanStatus.ERROR
        }));
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DISTRIBUTED TRACING SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class DistributedTracingService {
    constructor() {
        this.traces = new Map();
        this.activeSpans = new Map(); // spanId -> span
        this.spanStack = []; // Current span stack for context
        this.config = {
            serviceName: 'padoca-pizza-web',
            serviceVersion: '1.0.0',
            samplingRate: 1.0, // 100% sampling
            maxTraces: 100,
            exportEnabled: false,
            exportEndpoint: null
        };
        this.metrics = {
            totalTraces: 0,
            totalSpans: 0,
            errors: 0,
            averageDuration: 0
        };
        this.durations = [];
    }

    /**
     * Configure the tracing service
     */
    configure(options) {
        Object.assign(this.config, options);
    }

    /**
     * Generate a new trace ID
     */
    generateTraceId() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate a new span ID
     */
    generateSpanId() {
        const bytes = new Uint8Array(8);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Start a new trace
     */
    startTrace(name, attributes = {}) {
        // Sampling decision
        if (Math.random() > this.config.samplingRate) {
            return null;
        }

        const traceId = this.generateTraceId();
        const trace = new Trace(traceId);
        this.traces.set(traceId, trace);
        this.metrics.totalTraces++;

        // Create root span
        return this.startSpan(name, {
            traceId,
            kind: SpanKind.SERVER,
            attributes: {
                'service.name': this.config.serviceName,
                'service.version': this.config.serviceVersion,
                ...attributes
            }
        });
    }

    /**
     * Start a new span (optionally within existing trace)
     */
    startSpan(name, options = {}) {
        const traceId = options.traceId || this.getCurrentTraceId() || this.generateTraceId();
        const parentSpanId = options.parentSpanId || this.getCurrentSpanId();

        const span = new Span({
            traceId,
            spanId: this.generateSpanId(),
            parentSpanId,
            name,
            kind: options.kind || SpanKind.INTERNAL,
            attributes: options.attributes || {}
        });

        // Ensure trace exists
        if (!this.traces.has(traceId)) {
            this.traces.set(traceId, new Trace(traceId));
        }

        const trace = this.traces.get(traceId);
        trace.addSpan(span); with

        this.activeSpans.set(span.spanId, span);
        this.spanStack.push(span);
        this.metrics.totalSpans++;

        return span;
    }

    /**
     * End a span
     */
    endSpan(span) {
        if (!span || span.ended) return;

        span.end();
        this.activeSpans.delete(span.spanId);

        // Remove from stack
        const index = this.spanStack.indexOf(span);
        if (index !== -1) {
            this.spanStack.splice(index, 1);
        }

        // Update metrics
        this.durations.push(span.getDuration());
        if (this.durations.length > 1000) this.durations.shift();
        this.metrics.averageDuration =
            this.durations.reduce((a, b) => a + b, 0) / this.durations.length;

        if (span.status.code === SpanStatus.ERROR) {
            this.metrics.errors++;
        }

        // Export if enabled
        if (this.config.exportEnabled) {
            this.exportSpan(span);
        }

        // Cleanup old traces
        this.cleanupOldTraces();
    }

    /**
     * Get current trace ID from context
     */
    getCurrentTraceId() {
        const currentSpan = this.spanStack[this.spanStack.length - 1];
        return currentSpan?.traceId;
    }

    /**
     * Get current span ID from context
     */
    getCurrentSpanId() {
        const currentSpan = this.spanStack[this.spanStack.length - 1];
        return currentSpan?.spanId;
    }

    /**
     * Trace a function execution
     */
    async traceAsync(name, fn, options = {}) {
        const span = this.startSpan(name, options);
        try {
            const result = await fn(span);
            span.setStatus(SpanStatus.OK);
            return result;
        } catch (error) {
            span.recordException(error);
            throw error;
        } finally {
            this.endSpan(span);
        }
    }

    /**
     * Trace synchronous function
     */
    traceSync(name, fn, options = {}) {
        const span = this.startSpan(name, options);
        try {
            const result = fn(span);
            span.setStatus(SpanStatus.OK);
            return result;
        } catch (error) {
            span.recordException(error);
            throw error;
        } finally {
            this.endSpan(span);
        }
    }

    /**
     * Create a traced fetch wrapper
     */
    tracedFetch(url, options = {}) {
        return this.traceAsync(`HTTP ${options.method || 'GET'} ${new URL(url).pathname}`, async (span) => {
            span.setAttributes({
                'http.method': options.method || 'GET',
                'http.url': url
            });

            const start = performance.now();
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'x-trace-id': span.traceId,
                    'x-span-id': span.spanId
                }
            });

            span.setAttributes({
                'http.status_code': response.status,
                'http.response_time_ms': performance.now() - start
            });

            if (!response.ok) {
                span.setStatus(SpanStatus.ERROR, `HTTP ${response.status}`);
            }

            return response;
        }, { kind: SpanKind.CLIENT });
    }

    /**
     * Get trace by ID
     */
    getTrace(traceId) {
        return this.traces.get(traceId);
    }

    /**
     * Get recent traces
     */
    getRecentTraces(limit = 20) {
        return Array.from(this.traces.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit)
            .map(trace => ({
                traceId: trace.traceId,
                spanCount: trace.spans.size,
                duration: trace.getDuration(),
                startTime: new Date(trace.startTime).toISOString(),
                rootSpan: trace.getRootSpan()?.name
            }));
    }

    /**
     * Get slowest operations
     */
    getSlowestOperations(limit = 10) {
        const operations = new Map();

        for (const trace of this.traces.values()) {
            for (const span of trace.spans.values()) {
                if (!span.ended) continue;

                const key = span.name;
                const current = operations.get(key) || { name: key, count: 0, totalDuration: 0, maxDuration: 0 };
                current.count++;
                current.totalDuration += span.getDuration();
                current.maxDuration = Math.max(current.maxDuration, span.getDuration());
                current.avgDuration = current.totalDuration / current.count;
                operations.set(key, current);
            }
        }

        return Array.from(operations.values())
            .sort((a, b) => b.avgDuration - a.avgDuration)
            .slice(0, limit);
    }

    /**
     * Export span to collector
     */
    async exportSpan(span) {
        if (!this.config.exportEndpoint) return;

        try {
            await fetch(this.config.exportEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spans: [span.toOTLP()] })
            });
        } catch (error) {
            console.warn('[Tracing] Export failed:', error);
        }
    }

    /**
     * Cleanup old traces
     */
    cleanupOldTraces() {
        if (this.traces.size <= this.config.maxTraces) return;

        // Remove oldest traces
        const sorted = Array.from(this.traces.entries())
            .sort(([, a], [, b]) => a.startTime - b.startTime);

        const toRemove = sorted.slice(0, this.traces.size - this.config.maxTraces);
        for (const [traceId] of toRemove) {
            this.traces.delete(traceId);
        }
    }

    /**
     * Get service metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeTraces: this.traces.size,
            activeSpans: this.activeSpans.size,
            config: {
                serviceName: this.config.serviceName,
                samplingRate: this.config.samplingRate
            }
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const distributedTracing = new DistributedTracingService();

export { Span, Trace, DistributedTracingService };

export default distributedTracing;
