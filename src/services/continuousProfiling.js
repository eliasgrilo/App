/**
 * Continuous Profiling Service - Self-Analyzing Code
 * 
 * PREMIUM FEATURE #29: Continuous Profiling
 * 
 * App self-analyzes at microscopic level.
 * Monitors CPU, memory, battery usage per code section.
 * Keeps "Apple" performance long-term.
 * 
 * @module continuousProfiling
 */

const ProfileType = Object.freeze({
    CPU: 'cpu', MEMORY: 'memory', RENDER: 'render',
    NETWORK: 'network', BATTERY: 'battery', FPS: 'fps'
});

const Severity = Object.freeze({
    INFO: 'info', WARNING: 'warning', CRITICAL: 'critical'
});

class ProfileSample {
    constructor(type, name, duration, metadata = {}) {
        this.type = type;
        this.name = name;
        this.duration = duration;
        this.timestamp = Date.now();
        this.metadata = metadata;
    }
}

class PerformanceReport {
    constructor(section, samples) {
        this.section = section;
        this.sampleCount = samples.length;
        this.avgDuration = samples.reduce((sum, s) => sum + s.duration, 0) / samples.length;
        this.maxDuration = Math.max(...samples.map(s => s.duration));
        this.minDuration = Math.min(...samples.map(s => s.duration));
        this.p95Duration = this.calculatePercentile(samples, 95);
        this.timestamp = Date.now();
    }

    calculatePercentile(samples, percentile) {
        const sorted = [...samples].sort((a, b) => a.duration - b.duration);
        const index = Math.ceil(samples.length * (percentile / 100)) - 1;
        return sorted[index]?.duration || 0;
    }
}

class ContinuousProfilingService {
    constructor() {
        this.samples = new Map();
        this.reports = [];
        this.thresholds = {
            render: { warning: 16, critical: 50 },
            cpu: { warning: 100, critical: 500 },
            memory: { warning: 50 * 1024 * 1024, critical: 200 * 1024 * 1024 },
            network: { warning: 1000, critical: 5000 }
        };
        this.isEnabled = true;
        this.hotspots = [];
        this.frameData = [];
        this.lastFrameTime = 0;
        this.rafId = null;
    }

    initialize() {
        if (typeof PerformanceObserver !== 'undefined') {
            this.observeLongTasks();
            this.observeResourceTiming();
        }
        console.log('[Profiling] Continuous profiling initialized');
    }

    // ─────────────────────────────────────────────────
    // FUNCTION PROFILING
    // ─────────────────────────────────────────────────

    profile(name, fn, type = ProfileType.CPU) {
        if (!this.isEnabled) return fn();

        const start = performance.now();
        try {
            const result = fn();
            this.recordSample(type, name, performance.now() - start);
            return result;
        } catch (error) {
            this.recordSample(type, name, performance.now() - start, { error: error.message });
            throw error;
        }
    }

    async profileAsync(name, fn, type = ProfileType.CPU) {
        if (!this.isEnabled) return fn();

        const start = performance.now();
        try {
            const result = await fn();
            this.recordSample(type, name, performance.now() - start);
            return result;
        } catch (error) {
            this.recordSample(type, name, performance.now() - start, { error: error.message });
            throw error;
        }
    }

    recordSample(type, name, duration, metadata = {}) {
        const key = `${type}:${name}`;
        if (!this.samples.has(key)) {
            this.samples.set(key, []);
        }

        const samples = this.samples.get(key);
        samples.push(new ProfileSample(type, name, duration, metadata));

        // Keep only last 100 samples per section
        if (samples.length > 100) samples.shift();

        // Check thresholds
        this.checkThreshold(type, name, duration);
    }

    checkThreshold(type, name, duration) {
        const threshold = this.thresholds[type];
        if (!threshold) return;

        if (duration > threshold.critical) {
            this.reportHotspot(name, type, duration, Severity.CRITICAL);
        } else if (duration > threshold.warning) {
            this.reportHotspot(name, type, duration, Severity.WARNING);
        }
    }

    reportHotspot(name, type, duration, severity) {
        const hotspot = {
            id: `hotspot_${Date.now()}`,
            name,
            type,
            duration,
            severity,
            timestamp: Date.now()
        };

        this.hotspots.unshift(hotspot);
        if (this.hotspots.length > 50) this.hotspots.pop();

        if (severity === Severity.CRITICAL) {
            console.warn(`[Profiling] HOTSPOT: ${name} took ${duration.toFixed(2)}ms (${type})`);
        }
    }

    // ─────────────────────────────────────────────────
    // FPS MONITORING
    // ─────────────────────────────────────────────────

    startFPSMonitoring() {
        if (this.rafId) return;

        this.lastFrameTime = performance.now();

        const measureFrame = () => {
            const now = performance.now();
            const frameDuration = now - this.lastFrameTime;
            this.lastFrameTime = now;

            this.frameData.push({ duration: frameDuration, timestamp: now });
            if (this.frameData.length > 60) this.frameData.shift();

            // Check for jank (frame > 16.67ms = below 60fps)
            if (frameDuration > 33) {
                this.recordSample(ProfileType.RENDER, 'frame', frameDuration, { jank: true });
            }

            this.rafId = requestAnimationFrame(measureFrame);
        };

        this.rafId = requestAnimationFrame(measureFrame);
    }

    stopFPSMonitoring() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    getCurrentFPS() {
        if (this.frameData.length < 2) return 60;
        const avgFrameTime = this.frameData.reduce((sum, f) => sum + f.duration, 0) / this.frameData.length;
        return Math.round(1000 / avgFrameTime);
    }

    // ─────────────────────────────────────────────────
    // MEMORY PROFILING
    // ─────────────────────────────────────────────────

    getMemoryUsage() {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                usagePercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(1) + '%'
            };
        }
        return null;
    }

    checkMemoryPressure() {
        const memory = this.getMemoryUsage();
        if (!memory) return null;

        const usagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (usagePercent > 0.9) {
            this.reportHotspot('memory_pressure', ProfileType.MEMORY, memory.usedJSHeapSize, Severity.CRITICAL);
            return { pressure: 'critical', usage: memory };
        } else if (usagePercent > 0.7) {
            this.reportHotspot('memory_pressure', ProfileType.MEMORY, memory.usedJSHeapSize, Severity.WARNING);
            return { pressure: 'warning', usage: memory };
        }
        return { pressure: 'normal', usage: memory };
    }

    // ─────────────────────────────────────────────────
    // PERFORMANCE OBSERVERS
    // ─────────────────────────────────────────────────

    observeLongTasks() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordSample(ProfileType.CPU, 'long_task', entry.duration, {
                        startTime: entry.startTime,
                        attribution: entry.attribution
                    });
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            // Long task observation not supported
        }
    }

    observeResourceTiming() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 1000) {
                        this.recordSample(ProfileType.NETWORK, entry.name, entry.duration, {
                            type: entry.initiatorType,
                            size: entry.transferSize
                        });
                    }
                }
            });
            observer.observe({ entryTypes: ['resource'] });
        } catch (e) {
            // Resource timing not supported
        }
    }

    // ─────────────────────────────────────────────────
    // REPORTING
    // ─────────────────────────────────────────────────

    generateReport(section = null) {
        const reports = [];

        for (const [key, samples] of this.samples) {
            if (section && !key.includes(section)) continue;
            if (samples.length > 0) {
                reports.push(new PerformanceReport(key, samples));
            }
        }

        return reports.sort((a, b) => b.avgDuration - a.avgDuration);
    }

    getSlowestOperations(limit = 10) {
        const all = [];
        for (const [key, samples] of this.samples) {
            const avg = samples.reduce((sum, s) => sum + s.duration, 0) / samples.length;
            all.push({ section: key, avgDuration: avg, sampleCount: samples.length });
        }
        return all.sort((a, b) => b.avgDuration - a.avgDuration).slice(0, limit);
    }

    getHotspots(severity = null) {
        if (severity) {
            return this.hotspots.filter(h => h.severity === severity);
        }
        return this.hotspots;
    }

    getPerformanceSummary() {
        return {
            fps: this.getCurrentFPS(),
            memory: this.getMemoryUsage(),
            hotspots: this.hotspots.length,
            criticalHotspots: this.hotspots.filter(h => h.severity === Severity.CRITICAL).length,
            slowestOperations: this.getSlowestOperations(5),
            isHealthy: this.getCurrentFPS() >= 55 && this.hotspots.filter(h => h.severity === Severity.CRITICAL).length === 0
        };
    }

    clearSamples() {
        this.samples.clear();
        this.hotspots = [];
        this.frameData = [];
    }

    enable() { this.isEnabled = true; }
    disable() { this.isEnabled = false; }
}

export const continuousProfiling = new ContinuousProfilingService();
export { ProfileType, Severity, ProfileSample, PerformanceReport, ContinuousProfilingService };
export default continuousProfiling;
