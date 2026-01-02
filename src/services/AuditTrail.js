/**
 * Data Integrity Audit Trail
 * 
 * PRODUCTION UTILITY: Complete mutation tracking and anomaly detection
 * 
 * Features:
 * - Record every state change with before/after diff
 * - Timestamp and context for each mutation
 * - Anomaly detection for suspicious patterns
 * - Exportable audit log for compliance
 * 
 * @module AuditTrail
 */

const AUDIT_LOG_KEY = 'padoca_audit_trail'
const MAX_ENTRIES = 500
const ANOMALY_THRESHOLD = 10 // Actions per minute threshold

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT ENTRY TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} AuditEntry
 * @property {string} id - Unique entry ID
 * @property {string} action - Action type (CREATE, UPDATE, DELETE, TRANSITION)
 * @property {string} entityType - Type of entity affected
 * @property {string} entityId - ID of affected entity
 * @property {Object} before - State before change (null for CREATE)
 * @property {Object} after - State after change (null for DELETE)
 * @property {string} timestamp - ISO timestamp
 * @property {Object} context - Additional context (user, session, etc.)
 * @property {boolean} suspicious - Flag for anomaly detection
 */

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getAuditLog() {
    try {
        const raw = localStorage.getItem(AUDIT_LOG_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function saveAuditLog(entries) {
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(entries))
}

// ═══════════════════════════════════════════════════════════════════════════
// DIFF CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

function calculateDiff(before, after) {
    if (!before) return { type: 'CREATE', changes: after }
    if (!after) return { type: 'DELETE', removed: before }

    const changes = {}
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

    for (const key of allKeys) {
        const oldVal = before[key]
        const newVal = after[key]

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes[key] = { from: oldVal, to: newVal }
        }
    }

    return { type: 'UPDATE', changes }
}

// ═══════════════════════════════════════════════════════════════════════════
// ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════════════════

function detectAnomalies(entries) {
    const oneMinuteAgo = Date.now() - 60000
    const recentEntries = entries.filter(e =>
        new Date(e.timestamp).getTime() > oneMinuteAgo
    )

    const anomalies = {
        rapidActions: false,
        deletionSpree: false,
        duplicateActions: false,
        suspiciousPatterns: []
    }

    // Check for rapid-fire actions
    if (recentEntries.length > ANOMALY_THRESHOLD) {
        anomalies.rapidActions = true
        anomalies.suspiciousPatterns.push(`${recentEntries.length} actions in last minute (threshold: ${ANOMALY_THRESHOLD})`)
    }

    // Check for deletion spree
    const recentDeletes = recentEntries.filter(e => e.action === 'DELETE').length
    if (recentDeletes > 5) {
        anomalies.deletionSpree = true
        anomalies.suspiciousPatterns.push(`${recentDeletes} deletions in last minute`)
    }

    // Check for duplicate actions (same entity, same action, rapid succession)
    const actionGroups = new Map()
    for (const entry of recentEntries) {
        const key = `${entry.entityType}_${entry.entityId}_${entry.action}`
        actionGroups.set(key, (actionGroups.get(key) || 0) + 1)
    }

    for (const [key, count] of actionGroups) {
        if (count >= 3) {
            anomalies.duplicateActions = true
            anomalies.suspiciousPatterns.push(`Duplicate action detected: ${key} (${count}x)`)
        }
    }

    return anomalies
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE AUDIT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Record a state change to the audit trail
 * @param {string} action - Action type
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity identifier
 * @param {Object} before - State before change
 * @param {Object} after - State after change
 * @param {Object} context - Additional context
 * @returns {AuditEntry} The created audit entry
 */
export function recordChange(action, entityType, entityId, before, after, context = {}) {
    const entries = getAuditLog()
    const diff = calculateDiff(before, after)

    const entry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        entityType,
        entityId,
        before: before ? { ...before } : null,
        after: after ? { ...after } : null,
        diff,
        timestamp: new Date().toISOString(),
        context: {
            sessionId: window.__PADOCA_SESSION_ID__ || 'unknown',
            userAgent: navigator.userAgent.slice(0, 100),
            ...context
        },
        suspicious: false
    }

    // Check for anomalies
    const anomalies = detectAnomalies([...entries, entry])
    entry.suspicious = anomalies.rapidActions || anomalies.deletionSpree || anomalies.duplicateActions

    if (entry.suspicious) {
        console.warn('🚨 AUDIT: Suspicious activity detected:', anomalies.suspiciousPatterns)
    }

    // Add entry and trim old entries
    entries.unshift(entry)
    while (entries.length > MAX_ENTRIES) {
        entries.pop()
    }

    saveAuditLog(entries)

    // Log for debugging
    const emoji = { CREATE: '✨', UPDATE: '📝', DELETE: '🗑️', TRANSITION: '🔄' }[action] || '📋'
    console.log(`${emoji} AUDIT: ${action} ${entityType}#${entityId}`)

    return entry
}

/**
 * Get audit history for a specific entity
 * @param {string} entityId - Entity to get history for
 * @returns {AuditEntry[]} History entries
 */
export function getHistory(entityId) {
    return getAuditLog().filter(e => e.entityId === entityId)
}

/**
 * Get all suspicious entries
 * @returns {AuditEntry[]} Suspicious entries
 */
export function getSuspiciousEntries() {
    return getAuditLog().filter(e => e.suspicious)
}

/**
 * Export audit log for compliance/backup
 * @returns {Object} Exportable audit data
 */
export function exportAuditLog() {
    const entries = getAuditLog()
    return {
        exportedAt: new Date().toISOString(),
        totalEntries: entries.length,
        suspiciousCount: entries.filter(e => e.suspicious).length,
        dateRange: entries.length > 0 ? {
            oldest: entries[entries.length - 1].timestamp,
            newest: entries[0].timestamp
        } : null,
        entries
    }
}

/**
 * Clear audit log (use with caution)
 */
export function clearAuditLog() {
    const backup = exportAuditLog()
    console.warn('🚨 AUDIT LOG CLEARED. Backup:', backup)
    localStorage.removeItem(AUDIT_LOG_KEY)
    return backup
}

// ═══════════════════════════════════════════════════════════════════════════
// ZUSTAND MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Zustand middleware to automatically record all state changes
 * @example
 * const useStore = create(withAuditTrail((set, get) => ({ ... }), 'quotes'))
 */
export function withAuditTrail(config, entityType) {
    return (set, get, api) => {
        const auditedSet = (partial, replace) => {
            const before = get()
            set(partial, replace)
            const after = get()

            // Only record if state actually changed
            if (JSON.stringify(before) !== JSON.stringify(after)) {
                recordChange('UPDATE', entityType, 'store', before, after, {
                    middleware: true
                })
            }
        }

        return config(auditedSet, get, api)
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export const AuditTrail = {
    recordChange,
    getHistory,
    getSuspiciousEntries,
    exportAuditLog,
    clearAuditLog,
    withAuditTrail,

    /**
     * Get audit summary statistics
     */
    getStats() {
        const entries = getAuditLog()
        const actions = { CREATE: 0, UPDATE: 0, DELETE: 0, TRANSITION: 0 }
        const entityTypes = {}

        for (const entry of entries) {
            actions[entry.action] = (actions[entry.action] || 0) + 1
            entityTypes[entry.entityType] = (entityTypes[entry.entityType] || 0) + 1
        }

        return {
            totalEntries: entries.length,
            maxEntries: MAX_ENTRIES,
            suspiciousCount: entries.filter(e => e.suspicious).length,
            byAction: actions,
            byEntityType: entityTypes,
            oldestEntry: entries[entries.length - 1]?.timestamp,
            newestEntry: entries[0]?.timestamp
        }
    },

    /**
     * Run anomaly detection on current log
     */
    detectAnomalies() {
        return detectAnomalies(getAuditLog())
    }
}

export default AuditTrail
