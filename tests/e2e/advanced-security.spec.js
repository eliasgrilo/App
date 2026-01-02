/**
 * Advanced Security Features - Unit Tests
 * 
 * Tests for:
 * - Schema Migration System
 * - Data Integrity Audit Trail
 * - Code Freshness Validator
 * 
 * @module tests/e2e/advanced-security.spec
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ═══════════════════════════════════════════════════════════════════════════
// MOCK SETUP
// ═══════════════════════════════════════════════════════════════════════════

let mockLocalStorage = {}

beforeEach(() => {
    mockLocalStorage = {}
    vi.stubGlobal('localStorage', {
        getItem: (key) => mockLocalStorage[key] || null,
        setItem: (key, value) => { mockLocalStorage[key] = value },
        removeItem: (key) => { delete mockLocalStorage[key] },
        key: (i) => Object.keys(mockLocalStorage)[i],
        get length() { return Object.keys(mockLocalStorage).length },
        clear: () => { mockLocalStorage = {} }
    })

    vi.stubGlobal('navigator', { userAgent: 'test-agent' })
})

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA MIGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Schema Migration System', () => {
    it('should register migrations and track versions', async () => {
        const { registerMigration, SchemaMigration } = await import('../../src/services/SchemaMigration')

        registerMigration('test-store', 1, (data) => ({ ...data, v1: true }))

        expect(SchemaMigration.getCurrentVersion('test-store')).toBe(0)
    })

    it('should create backup before migration', async () => {
        const { migrateIfNeeded, getBackups } = await import('../../src/services/SchemaMigration')

        // Setup test data
        mockLocalStorage['padoca_test-store'] = JSON.stringify({ oldData: true })

        const result = await migrateIfNeeded('test-store', 1)

        expect(result.migrated).toBe(true)
        expect(result.backupId).toBeDefined()
    })

    it('should rollback on migration failure', async () => {
        const { registerMigration, migrateIfNeeded, rollback } = await import('../../src/services/SchemaMigration')

        // Register a failing migration
        registerMigration('fail-store', 99, () => { throw new Error('Migration failed!') })

        mockLocalStorage['padoca_fail-store'] = JSON.stringify({ original: true })

        const result = await migrateIfNeeded('fail-store', 99)

        expect(result.migrated).toBe(false)
        expect(result.rolledBack).toBe(true)
    })

    it('should get migration status for all stores', async () => {
        const { SchemaMigration } = await import('../../src/services/SchemaMigration')

        const status = SchemaMigration.getStatus()

        expect(Array.isArray(status)).toBe(true)
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT TRAIL TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Data Integrity Audit Trail', () => {
    it('should record state changes', async () => {
        const { recordChange, getHistory } = await import('../../src/services/AuditTrail')

        const before = { count: 1 }
        const after = { count: 2 }

        const entry = recordChange('UPDATE', 'counter', 'test-entity', before, after)

        expect(entry.action).toBe('UPDATE')
        expect(entry.entityType).toBe('counter')
        expect(entry.before.count).toBe(1)
        expect(entry.after.count).toBe(2)
        expect(entry.diff.changes.count).toEqual({ from: 1, to: 2 })
    })

    it('should detect anomalies for rapid actions', async () => {
        const { recordChange, AuditTrail } = await import('../../src/services/AuditTrail')

        // Record many actions rapidly
        for (let i = 0; i < 15; i++) {
            recordChange('UPDATE', 'test', `entity-${i}`, { v: i }, { v: i + 1 })
        }

        const anomalies = AuditTrail.detectAnomalies()

        expect(anomalies.rapidActions).toBe(true)
    })

    it('should export audit log with statistics', async () => {
        const { recordChange, exportAuditLog } = await import('../../src/services/AuditTrail')

        recordChange('CREATE', 'item', 'item-1', null, { name: 'Test' })

        const exported = exportAuditLog()

        expect(exported.totalEntries).toBeGreaterThan(0)
        expect(exported.entries.length).toBeGreaterThan(0)
    })

    it('should get stats summary', async () => {
        const { AuditTrail } = await import('../../src/services/AuditTrail')

        const stats = AuditTrail.getStats()

        expect(stats).toHaveProperty('totalEntries')
        expect(stats).toHaveProperty('byAction')
        expect(stats).toHaveProperty('byEntityType')
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// CODE FRESHNESS VALIDATOR TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Code Freshness Validator', () => {
    it('should scan for deprecated patterns', async () => {
        const { CodeFreshnessValidator } = await import('../../src/services/CodeFreshnessValidator')

        const report = CodeFreshnessValidator.scan()

        expect(report).toHaveProperty('deprecatedPatterns')
        expect(report).toHaveProperty('health')
        expect(report.health).toHaveProperty('score')
        expect(report.health).toHaveProperty('grade')
    })

    it('should detect legacy localStorage keys', async () => {
        // Add some legacy keys
        mockLocalStorage['padoca_old_data'] = '{"test": true}'
        mockLocalStorage['padoca_v1_settings'] = '{"old": true}'

        const { CodeFreshnessValidator } = await import('../../src/services/CodeFreshnessValidator')

        const report = CodeFreshnessValidator.scan()
        const legacyPattern = report.deprecatedPatterns.find(p => p.id === 'legacy_localstorage_keys')

        expect(legacyPattern.result.found).toBe(true)
        expect(legacyPattern.result.count).toBe(2)
    })

    it('should calculate health score', async () => {
        const { CodeFreshnessValidator } = await import('../../src/services/CodeFreshnessValidator')

        const report = CodeFreshnessValidator.scan()

        expect(report.health.score).toBeGreaterThanOrEqual(0)
        expect(report.health.score).toBeLessThanOrEqual(100)
        expect(['A', 'B', 'C', 'D', 'F']).toContain(report.health.grade)
    })

    it('should run cleanup in dry-run mode', async () => {
        mockLocalStorage['padoca_old_legacy'] = '{"x": 1}'

        const { CodeFreshnessValidator } = await import('../../src/services/CodeFreshnessValidator')

        const cleaned = CodeFreshnessValidator.cleanup(true) // dry run

        // Data should still exist in dry-run
        expect(mockLocalStorage['padoca_old_legacy']).toBeDefined()
    })

    it('should provide quick health check', async () => {
        const { CodeFreshnessValidator } = await import('../../src/services/CodeFreshnessValidator')

        const quick = CodeFreshnessValidator.quickCheck()

        expect(quick).toHaveProperty('healthy')
        expect(quick).toHaveProperty('grade')
        expect(quick).toHaveProperty('score')
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('DataHygieneClient Integration', () => {
    it('should run full hygiene sweep with all features', async () => {
        const { DataHygieneClient } = await import('../../src/services/DataHygieneClient')

        const results = await DataHygieneClient.runHygieneSweep()

        expect(results).toHaveProperty('timestamp')
        expect(results).toHaveProperty('schemaMigrations')
        expect(results).toHaveProperty('freshnessReport')
    })
})
