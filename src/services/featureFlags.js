/**
 * Feature Flags Service - LaunchDarkly Pattern
 * 
 * PREMIUM FEATURE #16: Feature Flags
 * 
 * Remote control switches for features - release to 5%, instant kill switch.
 * 
 * @module featureFlags
 */

// ═══════════════════════════════════════════════════════════════════════════
// FLAG TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const FlagType = Object.freeze({
    BOOLEAN: 'boolean',
    STRING: 'string',
    NUMBER: 'number',
    JSON: 'json'
});

// ═══════════════════════════════════════════════════════════════════════════
// FLAG CLASS
// ═══════════════════════════════════════════════════════════════════════════

class FeatureFlag {
    constructor({
        key,
        name,
        description = '',
        type = FlagType.BOOLEAN,
        defaultValue,
        variations = [],
        rules = [],
        percentageRollout = null,
        enabled = true
    }) {
        this.key = key;
        this.name = name;
        this.description = description;
        this.type = type;
        this.defaultValue = defaultValue;
        this.variations = variations.length > 0 ? variations : [defaultValue];
        this.rules = rules;
        this.percentageRollout = percentageRollout;
        this.enabled = enabled;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }

    evaluate(context = {}) {
        if (!this.enabled) {
            return { value: this.defaultValue, reason: 'FLAG_DISABLED' };
        }

        // Check rules
        for (const rule of this.rules) {
            if (this.matchesRule(rule, context)) {
                return { value: rule.value, reason: 'RULE_MATCH', ruleId: rule.id };
            }
        }

        // Check percentage rollout
        if (this.percentageRollout !== null) {
            const hash = this.hashUser(context.userId || 'anonymous');
            const bucket = hash % 100;
            if (bucket < this.percentageRollout) {
                return { value: this.variations[1] || true, reason: 'PERCENTAGE_ROLLOUT' };
            }
            return { value: this.variations[0] || this.defaultValue, reason: 'PERCENTAGE_FALLBACK' };
        }

        return { value: this.defaultValue, reason: 'DEFAULT' };
    }

    matchesRule(rule, context) {
        for (const condition of rule.conditions || []) {
            const contextValue = context[condition.attribute];
            if (!this.matchesCondition(condition, contextValue)) {
                return false;
            }
        }
        return true;
    }

    matchesCondition(condition, value) {
        switch (condition.operator) {
            case 'equals': return value === condition.value;
            case 'notEquals': return value !== condition.value;
            case 'contains': return String(value).includes(condition.value);
            case 'in': return condition.values?.includes(value);
            case 'notIn': return !condition.values?.includes(value);
            case 'greaterThan': return value > condition.value;
            case 'lessThan': return value < condition.value;
            case 'regex': return new RegExp(condition.value).test(value);
            default: return false;
        }
    }

    hashUser(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class FeatureFlagsService {
    constructor() {
        this.flags = new Map();
        this.context = {};
        this.evaluationHistory = [];
        this.listeners = new Map();
        this.syncInterval = null;
    }

    initialize(initialContext = {}) {
        this.context = initialContext;
        this.registerDefaultFlags();
        console.log('[FeatureFlags] Initialized');
    }

    registerDefaultFlags() {
        // AI Features
        this.register({
            key: 'ai_negotiation',
            name: 'AI Negotiation Engine',
            description: 'New AI-powered negotiation suggestions',
            defaultValue: false,
            percentageRollout: 5 // 5% of users
        });

        this.register({
            key: 'ai_price_prediction',
            name: 'AI Price Prediction',
            defaultValue: true
        });

        this.register({
            key: 'semantic_search',
            name: 'Semantic Product Search',
            defaultValue: true
        });

        // UI Features
        this.register({
            key: 'new_dashboard',
            name: 'New Dashboard Design',
            defaultValue: false,
            percentageRollout: 10
        });

        this.register({
            key: 'dark_mode',
            name: 'Dark Mode',
            defaultValue: true
        });

        this.register({
            key: 'glassmorphism_ui',
            name: 'Glassmorphism UI',
            defaultValue: true
        });

        // Performance Features
        this.register({
            key: 'optimistic_updates',
            name: 'Optimistic UI Updates',
            defaultValue: true
        });

        this.register({
            key: 'real_time_sync',
            name: 'Real-time Data Sync',
            defaultValue: true
        });

        // Beta Features
        this.register({
            key: 'multi_agent_orchestration',
            name: 'Multi-Agent AI Orchestration',
            defaultValue: false,
            rules: [{
                id: 'beta_users',
                conditions: [{ attribute: 'isBetaTester', operator: 'equals', value: true }],
                value: true
            }]
        });

        this.register({
            key: 'advanced_analytics',
            name: 'Advanced Analytics Dashboard',
            defaultValue: false,
            rules: [{
                id: 'manager_only',
                conditions: [{ attribute: 'role', operator: 'in', values: ['manager', 'admin'] }],
                value: true
            }]
        });
    }

    register(config) {
        const flag = new FeatureFlag(config);
        this.flags.set(flag.key, flag);
        return flag;
    }

    // ─────────────────────────────────────────────────
    // FLAG EVALUATION
    // ─────────────────────────────────────────────────

    isEnabled(flagKey, contextOverride = {}) {
        const result = this.evaluate(flagKey, contextOverride);
        return result.value === true;
    }

    evaluate(flagKey, contextOverride = {}) {
        const flag = this.flags.get(flagKey);
        if (!flag) {
            console.warn(`[FeatureFlags] Unknown flag: ${flagKey}`);
            return { value: false, reason: 'FLAG_NOT_FOUND' };
        }

        const fullContext = { ...this.context, ...contextOverride };
        const result = flag.evaluate(fullContext);

        // Log evaluation
        this.evaluationHistory.push({
            flagKey,
            result: result.value,
            reason: result.reason,
            timestamp: Date.now()
        });

        if (this.evaluationHistory.length > 1000) {
            this.evaluationHistory.shift();
        }

        return result;
    }

    getValue(flagKey, contextOverride = {}) {
        return this.evaluate(flagKey, contextOverride).value;
    }

    // ─────────────────────────────────────────────────
    // FLAG MANAGEMENT
    // ─────────────────────────────────────────────────

    setEnabled(flagKey, enabled) {
        const flag = this.flags.get(flagKey);
        if (flag) {
            flag.enabled = enabled;
            flag.updatedAt = Date.now();
            this.notifyListeners(flagKey);
            console.log(`[FeatureFlags] ${flagKey} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    setPercentage(flagKey, percentage) {
        const flag = this.flags.get(flagKey);
        if (flag) {
            flag.percentageRollout = Math.min(100, Math.max(0, percentage));
            flag.updatedAt = Date.now();
            this.notifyListeners(flagKey);
        }
    }

    updateContext(newContext) {
        this.context = { ...this.context, ...newContext };
    }

    // ─────────────────────────────────────────────────
    // LISTENERS
    // ─────────────────────────────────────────────────

    subscribe(flagKey, callback) {
        if (!this.listeners.has(flagKey)) {
            this.listeners.set(flagKey, new Set());
        }
        this.listeners.get(flagKey).add(callback);
        return () => this.listeners.get(flagKey)?.delete(callback);
    }

    notifyListeners(flagKey) {
        const listeners = this.listeners.get(flagKey);
        if (listeners) {
            const result = this.evaluate(flagKey);
            for (const callback of listeners) {
                try { callback(result.value); } catch (e) { console.error(e); }
            }
        }
    }

    // ─────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────

    getAllFlags() {
        return Array.from(this.flags.values()).map(f => ({
            key: f.key,
            name: f.name,
            enabled: f.enabled,
            percentageRollout: f.percentageRollout,
            rulesCount: f.rules.length
        }));
    }

    getMetrics() {
        const recent = this.evaluationHistory.slice(-100);
        const byFlag = {};

        for (const eval_ of recent) {
            if (!byFlag[eval_.flagKey]) {
                byFlag[eval_.flagKey] = { true: 0, false: 0 };
            }
            byFlag[eval_.flagKey][eval_.result]++;
        }

        return {
            totalFlags: this.flags.size,
            totalEvaluations: this.evaluationHistory.length,
            evaluationsByFlag: byFlag
        };
    }

    // Kill switch - instantly disable a flag
    killSwitch(flagKey) {
        this.setEnabled(flagKey, false);
        console.warn(`[FeatureFlags] KILL SWITCH activated for: ${flagKey}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOK HELPER
// ═══════════════════════════════════════════════════════════════════════════

export function useFeatureFlag(flagKey) {
    // Returns the current flag value (for use with React useState)
    const result = featureFlags.evaluate(flagKey);
    return result.value;
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const featureFlags = new FeatureFlagsService();
export { FeatureFlag, FeatureFlagsService };
export default featureFlags;
