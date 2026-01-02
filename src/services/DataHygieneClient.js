/**
 * Data Hygiene Client - Zombie Data Purging
 * 
 * PRODUCTION UTILITY: Client-side data sanitization
 * 
 * Purges stale localStorage, orphaned cache, and inconsistent state.
 * 
 * Integrates:
 * - Schema Version Migration System
 * - Data Integrity Audit Trail  
 * - Runtime Code Freshness Validator
 * 
 * @module DataHygieneClient
 */

const STALE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const CACHE_PREFIX = 'padoca_'

export const DataHygieneClient = {
    /**
     * Run complete data hygiene sweep
     * Call on app startup to ensure clean state
     */
    async runHygieneSweep() {
        const results = {
            staleEntriesRemoved: 0,
            orphanedCacheCleared: 0,
            bytesReclaimed: 0,
            duplicatesRemoved: 0,
            schemaMigrations: null,
            freshnessReport: null,
            timestamp: new Date().toISOString()
        }

        try {
            // 0. SCHEMA MIGRATIONS (run first - ensures data structure is up to date)
            try {
                const { SchemaMigration } = await import('./SchemaMigration')
                results.schemaMigrations = await SchemaMigration.runAllMigrations()
                console.log('📦 Schema migrations:', results.schemaMigrations)
            } catch (migrationError) {
                console.warn('⚠️ Schema migration skipped:', migrationError.message)
            }

            // 1. Clear stale localStorage entries
            const staleResult = this.clearStaleLocalStorage()
            results.staleEntriesRemoved = staleResult.removed
            results.bytesReclaimed += staleResult.bytes

            // 2. Purge orphaned IndexedDB cache
            await this.purgeOrphanedCache()

            // 3. Validate and clean state consistency
            this.validateStateConsistency()

            // 4. Clear incomplete drafts
            results.orphanedCacheCleared = this.clearIncompleteDrafts()

            // 5. LAW 3 ENFORCEMENT: Remove duplicate quotation cards
            try {
                const { AtomicQuotationTransitionService } = await import('./AtomicQuotationTransitionService')
                const dupeResult = await AtomicQuotationTransitionService.enforceGlobalUniqueness()
                results.duplicatesRemoved = dupeResult.duplicatesRemoved || 0
                console.log(`🛡️ LAW 3: ${results.duplicatesRemoved} duplicate cards removed`)
            } catch (law3Error) {
                console.warn('⚠️ LAW 3 enforcement skipped:', law3Error.message)
            }

            // 5.5 CLEANUP: Remove duplicate AutoQuoteRequests (especially RECEIVED status)
            // Addresses user bug report: "em recebido ainda tem card duplicado"
            try {
                const { removeDuplicateAutoQuoteRequests } = await import('../utils/removeDuplicateItems')
                const autoQuoteResult = await removeDuplicateAutoQuoteRequests(false) // Live mode
                results.autoQuoteDuplicatesRemoved = autoQuoteResult.duplicatesSoftDeleted || 0
                console.log(`🛡️ AUTO-QUOTE CLEANUP: ${results.autoQuoteDuplicatesRemoved} duplicate RECEIVED cards removed`)
            } catch (autoQuoteError) {
                console.warn('⚠️ Auto-quote cleanup skipped:', autoQuoteError.message)
            }


            // 6. CODE FRESHNESS VALIDATION
            try {
                const { CodeFreshnessValidator } = await import('./CodeFreshnessValidator')
                results.freshnessReport = CodeFreshnessValidator.scan()

                // Auto-cleanup stale data if health is below threshold
                if (results.freshnessReport.health.score < 70) {
                    console.log('🧹 Auto-cleanup triggered due to low health score')
                    CodeFreshnessValidator.cleanup(false) // Actually clean
                }
            } catch (freshnessError) {
                console.warn('⚠️ Code freshness check skipped:', freshnessError.message)
            }

            // 7. AUDIT TRAIL: Record the sweep
            try {
                const { AuditTrail } = await import('./AuditTrail')
                AuditTrail.recordChange('HYGIENE_SWEEP', 'system', 'DataHygieneClient', null, results, {
                    automated: true
                })
            } catch { }

            console.log('🧹 Data hygiene sweep complete:', results)
            return results
        } catch (error) {
            console.error('❌ Data hygiene sweep failed:', error)
            return { ...results, error: error.message }
        }
    },

    /**
     * Clear localStorage entries older than threshold
     */
    clearStaleLocalStorage() {
        let removed = 0
        let bytes = 0
        const now = Date.now()

        // Keys that should be checked for staleness
        const staleableKeys = [
            'padoca_draft_quotation',
            'padoca_temp_',
            'padoca_cache_',
            'padoca_preview_'
        ]

        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (!key) continue

            // Check if key matches staleable patterns
            const isStaleable = staleableKeys.some(pattern => key.startsWith(pattern))
            if (!isStaleable) continue

            try {
                const value = localStorage.getItem(key)
                if (!value) continue

                const data = JSON.parse(value)
                const timestamp = data.timestamp || data.updatedAt || data.createdAt

                if (timestamp) {
                    const age = now - new Date(timestamp).getTime()
                    if (age > STALE_THRESHOLD_MS) {
                        bytes += key.length + value.length
                        localStorage.removeItem(key)
                        removed++
                        console.log(`🗑️ Removed stale entry: ${key}`)
                    }
                }
            } catch (e) {
                // Entry doesn't have parseable timestamp, skip
            }
        }

        return { removed, bytes }
    },

    /**
     * Clear incomplete quotation drafts
     */
    clearIncompleteDrafts() {
        let cleared = 0
        const draftKey = 'padoca_draft_quotation'
        const draft = localStorage.getItem(draftKey)

        if (draft) {
            try {
                const data = JSON.parse(draft)
                // Clear drafts that are incomplete (missing essential fields)
                if (!data.productId || !data.supplierId || !data.quantity) {
                    localStorage.removeItem(draftKey)
                    cleared++
                    console.log('🗑️ Cleared incomplete quotation draft')
                }
            } catch {
                localStorage.removeItem(draftKey)
                cleared++
            }
        }

        return cleared
    },

    /**
     * Purge orphaned IndexedDB cache
     */
    async purgeOrphanedCache() {
        if (!window.indexedDB) return

        try {
            // Check for orphaned cache databases
            const databases = await window.indexedDB.databases?.()
            if (!databases) return

            for (const db of databases) {
                if (db.name?.startsWith('padoca_cache_')) {
                    // Check if cache is still valid
                    const cacheType = db.name.replace('padoca_cache_', '')
                    const isValid = await this.isCacheValid(cacheType)

                    if (!isValid) {
                        window.indexedDB.deleteDatabase(db.name)
                        console.log(`🗑️ Purged orphaned cache: ${db.name}`)
                    }
                }
            }
        } catch (e) {
            console.warn('Cache purge skipped:', e.message)
        }
    },

    /**
     * Check if a cache type is still valid
     */
    async isCacheValid(cacheType) {
        // Simple validation - can be extended based on cache type
        const validCacheTypes = ['products', 'suppliers', 'recipes', 'inventory']
        return validCacheTypes.includes(cacheType)
    },

    /**
     * Validate state consistency between localStorage and expected schema
     */
    validateStateConsistency() {
        const criticalKeys = [
            'padoca_kanban_pro_max',
            'padoca_settings'
        ]

        for (const key of criticalKeys) {
            const value = localStorage.getItem(key)
            if (!value) continue

            try {
                const data = JSON.parse(value)

                // Validate Kanban board structure
                if (key === 'padoca_kanban_pro_max') {
                    if (!data.columns || !Array.isArray(data.columns)) {
                        console.warn(`⚠️ Fixing invalid Kanban structure`)
                        localStorage.setItem(key, JSON.stringify({ columns: [] }))
                    }
                }
            } catch (e) {
                console.warn(`⚠️ Corrupted entry detected: ${key}, resetting...`)
                localStorage.removeItem(key)
            }
        }
    },

    /**
     * Get current storage usage metrics
     */
    getStorageMetrics() {
        let totalSize = 0
        let entryCount = 0
        const entries = {}

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (!key) continue

            const value = localStorage.getItem(key) || ''
            const size = key.length + value.length
            totalSize += size
            entryCount++

            if (key.startsWith(CACHE_PREFIX)) {
                entries[key] = { size, bytes: size * 2 } // UTF-16 encoding
            }
        }

        return {
            totalEntries: entryCount,
            padocaEntries: Object.keys(entries).length,
            totalBytesEstimate: totalSize * 2, // UTF-16
            entries
        }
    },

    /**
     * Emergency purge - clear all Padoca-related data
     * USE WITH CAUTION
     */
    emergencyPurge() {
        let purged = 0

        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key?.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key)
                purged++
            }
        }

        console.log(`🚨 Emergency purge complete: ${purged} entries removed`)
        return { purged }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * React hook for automatic cleanup on component unmount
 * Use in root App component or layout wrappers
 */
export function useDataHygiene() {
    // Note: This is a utility function - import useEffect from 'react' where used
    // Returns a cleanup function that can be called in useEffect
    return {
        cleanup: () => {
            DataHygieneClient.clearStaleLocalStorage()
        },
        runFullSweep: () => DataHygieneClient.runHygieneSweep()
    }
}

/**
 * Cleanup function for manual integration
 * Call this on session end or app unmount
 */
export function cleanupOnUnmount() {
    DataHygieneClient.clearStaleLocalStorage()
    DataHygieneClient.clearIncompleteDrafts()
}

export default DataHygieneClient
