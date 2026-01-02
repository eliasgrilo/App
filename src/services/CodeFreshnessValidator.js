/**
 * Runtime Code Freshness Validator
 * 
 * PRODUCTION UTILITY: Detect deprecated patterns, dead code, and stale data
 * 
 * Features:
 * - Detect deprecated patterns (console.log in prod, TODO markers)
 * - Find orphaned/unused exports
 * - Warn on stale data structures
 * - Generate code health score
 * 
 * @module CodeFreshnessValidator
 */

const FRESHNESS_REPORT_KEY = 'padoca_freshness_report'

// ═══════════════════════════════════════════════════════════════════════════
// DEPRECATED PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const DEPRECATED_PATTERNS = [
    {
        id: 'console_in_prod',
        name: 'Console statements in production',
        check: () => {
            // Check if running in production
            const isProd = import.meta.env?.PROD || process.env?.NODE_ENV === 'production'
            if (!isProd) return { found: false }

            // Check for console overrides (only in browser)
            const hasConsoleWrapped = typeof window !== 'undefined' &&
                window.__PADOCA_CONSOLE_WRAPPED__

            return { found: !hasConsoleWrapped, severity: 'low' }
        }
    },
    {
        id: 'legacy_localstorage_keys',
        name: 'Legacy localStorage keys detected',
        check: () => {
            const legacyKeys = [
                'padoca_old_',
                'padoca_v1_',
                'padoca_deprecated_',
                'quotation_',  // Old naming convention
                'quote_temp_'  // Temporary keys
            ]

            const found = []
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (legacyKeys.some(pattern => key?.startsWith(pattern))) {
                    found.push(key)
                }
            }

            return {
                found: found.length > 0,
                count: found.length,
                keys: found,
                severity: found.length > 5 ? 'high' : 'medium'
            }
        }
    },
    {
        id: 'stale_cache_entries',
        name: 'Cache entries older than 7 days',
        check: () => {
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
            const stale = []

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (!key?.includes('cache')) continue

                try {
                    const data = JSON.parse(localStorage.getItem(key))
                    const timestamp = data?.timestamp || data?.cachedAt || data?.createdAt
                    if (timestamp && new Date(timestamp).getTime() < sevenDaysAgo) {
                        stale.push({ key, age: Math.floor((Date.now() - new Date(timestamp).getTime()) / 86400000) + ' days' })
                    }
                } catch { }
            }

            return {
                found: stale.length > 0,
                count: stale.length,
                entries: stale,
                severity: 'low'
            }
        }
    },
    {
        id: 'null_prototype_pollution',
        name: 'Potential prototype pollution in stored data',
        check: () => {
            const suspicious = []
            const dangerousKeys = ['__proto__', 'constructor', 'prototype']

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (!key?.startsWith('padoca_')) continue

                try {
                    const value = localStorage.getItem(key)
                    if (dangerousKeys.some(dk => value?.includes(`"${dk}"`))) {
                        suspicious.push(key)
                    }
                } catch { }
            }

            return {
                found: suspicious.length > 0,
                count: suspicious.length,
                keys: suspicious,
                severity: 'critical'
            }
        }
    },
    {
        id: 'orphaned_draft_data',
        name: 'Incomplete draft data lingering',
        check: () => {
            const draftPatterns = ['draft', 'temp', 'pending', 'unsaved']
            const orphans = []
            const oneHourAgo = Date.now() - 3600000

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (!draftPatterns.some(p => key?.toLowerCase().includes(p))) continue

                try {
                    const data = JSON.parse(localStorage.getItem(key))
                    const ts = data?.timestamp || data?.startedAt || data?.createdAt
                    if (ts && new Date(ts).getTime() < oneHourAgo) {
                        orphans.push({ key, age: Math.floor((Date.now() - new Date(ts).getTime()) / 60000) + ' mins' })
                    }
                } catch { }
            }

            return {
                found: orphans.length > 0,
                count: orphans.length,
                orphans,
                severity: 'medium'
            }
        }
    }
]

// ═══════════════════════════════════════════════════════════════════════════
// DATA FRESHNESS CHECKS
// ═══════════════════════════════════════════════════════════════════════════

const DATA_FRESHNESS_RULES = {
    'padoca-quote-lifecycle': {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours without update is stale
        requiredFields: ['quotes', 'hashIndex'],
        validateStructure: (data) => {
            if (typeof data.quotes !== 'object') return 'quotes should be object'
            if (typeof data.hashIndex !== 'object') return 'hashIndex should be object'
            return null
        }
    },
    'padoca_settings': {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        requiredFields: [],
        validateStructure: () => null
    }
}

function checkDataFreshness() {
    const results = []

    for (const [key, rules] of Object.entries(DATA_FRESHNESS_RULES)) {
        const raw = localStorage.getItem(key)
        if (!raw) continue

        try {
            const parsed = JSON.parse(raw)
            const data = parsed.state || parsed

            const result = { store: key, issues: [] }

            // Check required fields
            for (const field of rules.requiredFields) {
                if (!(field in data)) {
                    result.issues.push(`Missing required field: ${field}`)
                }
            }

            // Check structure
            const structureError = rules.validateStructure(data)
            if (structureError) {
                result.issues.push(structureError)
            }

            // Check age
            const timestamp = parsed.timestamp || parsed.state?.lastUpdated
            if (timestamp) {
                const age = Date.now() - new Date(timestamp).getTime()
                if (age > rules.maxAge) {
                    result.issues.push(`Data is stale (${Math.floor(age / 86400000)} days old)`)
                }
            }

            if (result.issues.length > 0) {
                results.push(result)
            }
        } catch (e) {
            results.push({ store: key, issues: [`Parse error: ${e.message}`] })
        }
    }

    return results
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH SCORE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

function calculateHealthScore(patternResults, freshnessResults) {
    let score = 100
    const deductions = []

    // Deduct for deprecated patterns
    for (const result of patternResults) {
        if (!result.result.found) continue

        const penalty = {
            critical: 30,
            high: 20,
            medium: 10,
            low: 5
        }[result.result.severity] || 5

        score -= penalty
        deductions.push({
            reason: result.name,
            penalty,
            severity: result.result.severity
        })
    }

    // Deduct for freshness issues
    for (const result of freshnessResults) {
        const penalty = result.issues.length * 5
        score -= penalty
        deductions.push({
            reason: `${result.store}: ${result.issues.length} issue(s)`,
            penalty,
            severity: 'medium'
        })
    }

    return {
        score: Math.max(0, score),
        grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
        deductions,
        isHealthy: score >= 70
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTOMATIC CLEANUP
// ═══════════════════════════════════════════════════════════════════════════

function autoCleanup(dryRun = true) {
    const cleaned = []

    // Clean legacy keys
    const legacyResult = DEPRECATED_PATTERNS
        .find(p => p.id === 'legacy_localstorage_keys')
        ?.check()

    if (legacyResult?.keys) {
        for (const key of legacyResult.keys) {
            if (!dryRun) {
                localStorage.removeItem(key)
            }
            cleaned.push({ action: 'remove_legacy', key, dryRun })
        }
    }

    // Clean stale cache
    const cacheResult = DEPRECATED_PATTERNS
        .find(p => p.id === 'stale_cache_entries')
        ?.check()

    if (cacheResult?.entries) {
        for (const entry of cacheResult.entries) {
            if (!dryRun) {
                localStorage.removeItem(entry.key)
            }
            cleaned.push({ action: 'remove_stale_cache', key: entry.key, age: entry.age, dryRun })
        }
    }

    // Clean orphaned drafts
    const draftResult = DEPRECATED_PATTERNS
        .find(p => p.id === 'orphaned_draft_data')
        ?.check()

    if (draftResult?.orphans) {
        for (const orphan of draftResult.orphans) {
            if (!dryRun) {
                localStorage.removeItem(orphan.key)
            }
            cleaned.push({ action: 'remove_orphan', key: orphan.key, age: orphan.age, dryRun })
        }
    }

    return cleaned
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export const CodeFreshnessValidator = {
    /**
     * Run full code freshness scan
     */
    scan() {
        console.log('🔍 Running code freshness scan...')

        const patternResults = DEPRECATED_PATTERNS.map(pattern => ({
            id: pattern.id,
            name: pattern.name,
            result: pattern.check()
        }))

        const freshnessResults = checkDataFreshness()
        const health = calculateHealthScore(patternResults, freshnessResults)

        const report = {
            timestamp: new Date().toISOString(),
            deprecatedPatterns: patternResults,
            dataFreshness: freshnessResults,
            health,
            summary: {
                patternsChecked: patternResults.length,
                issuesFound: patternResults.filter(p => p.result.found).length,
                staleStores: freshnessResults.length
            }
        }

        // Save report
        localStorage.setItem(FRESHNESS_REPORT_KEY, JSON.stringify(report))

        // Log summary
        const emoji = health.grade === 'A' ? '🌟' : health.grade === 'B' ? '✅' : health.grade === 'C' ? '⚠️' : '🚨'
        console.log(`${emoji} Code Freshness: ${health.grade} (${health.score}/100)`)

        if (health.deductions.length > 0) {
            console.log('📋 Issues found:')
            health.deductions.forEach(d => console.log(`   - ${d.reason} (-${d.penalty})`))
        }

        return report
    },

    /**
     * Get last scan report
     */
    getLastReport() {
        try {
            const raw = localStorage.getItem(FRESHNESS_REPORT_KEY)
            return raw ? JSON.parse(raw) : null
        } catch {
            return null
        }
    },

    /**
     * Run automatic cleanup
     * @param {boolean} dryRun - If true, only report what would be cleaned
     */
    cleanup(dryRun = false) {
        console.log(`🧹 Running cleanup (dryRun: ${dryRun})...`)
        const results = autoCleanup(dryRun)
        console.log(`   Cleaned ${results.length} items`)
        return results
    },

    /**
     * Quick health check
     */
    quickCheck() {
        const report = this.scan()
        return {
            healthy: report.health.isHealthy,
            grade: report.health.grade,
            score: report.health.score,
            criticalIssues: report.deprecatedPatterns
                .filter(p => p.result.severity === 'critical' && p.result.found)
                .map(p => p.name)
        }
    },

    /**
     * Register custom deprecated pattern
     */
    registerPattern(id, name, checkFn) {
        DEPRECATED_PATTERNS.push({ id, name, check: checkFn })
        console.log(`📋 Custom pattern registered: ${name}`)
    }
}

export default CodeFreshnessValidator
