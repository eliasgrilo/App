/**
 * Database Hygiene Service - Data Exorcism Protocol
 * 
 * PREMIUM UTILITY: Database Sanitization
 * 
 * Orphan hunt, ghost data cleanup, event stream reconciliation.
 * 
 * @module databaseHygiene
 */

const HygieneAction = Object.freeze({
    ORPHAN_CLEANUP: 'orphan_cleanup',
    GHOST_EVENT: 'ghost_event',
    VACUUM: 'vacuum',
    INDEX_REBUILD: 'index_rebuild',
    COMPENSATING_EVENT: 'compensating_event'
});

class DatabaseHygieneService {
    constructor() {
        this.issues = [];
        this.scripts = [];
        this.metrics = {
            orphansFound: 0,
            orphansCleaned: 0,
            ghostEventsFound: 0,
            compensatingEventsCreated: 0,
            bytesReclaimed: 0
        };
    }

    // ─────────────────────────────────────────────────
    // ORPHAN DETECTION
    // ─────────────────────────────────────────────────

    detectOrphans(config = {}) {
        const parentTableMap = {
            quotation_items: { parent: 'quotations', fk: 'quotation_id' },
            product_prices: { parent: 'products', fk: 'product_id' },
            supplier_contacts: { parent: 'suppliers', fk: 'supplier_id' },
            event_snapshots: { parent: 'events', fk: 'event_id' },
            order_lines: { parent: 'orders', fk: 'order_id' },
            recipe_ingredients: { parent: 'recipes', fk: 'recipe_id' }
        };

        const orphanQueries = [];

        for (const [childTable, { parent, fk }] of Object.entries(parentTableMap)) {
            orphanQueries.push({
                table: childTable,
                sql: `
-- Find orphans in ${childTable}
SELECT c.id, c.${fk}, c.created_at
FROM ${childTable} c
LEFT JOIN ${parent} p ON c.${fk} = p.id
WHERE p.id IS NULL;`,
                cleanupSql: `
-- Delete orphans from ${childTable}
DELETE FROM ${childTable}
WHERE ${fk} NOT IN (SELECT id FROM ${parent});`
            });
        }

        this.scripts.push(...orphanQueries);
        return orphanQueries;
    }

    // ─────────────────────────────────────────────────
    // GHOST EVENT DETECTION (Event Sourcing)
    // ─────────────────────────────────────────────────

    detectGhostEvents() {
        const ghostEventQueries = [
            {
                name: 'Incomplete Sagas',
                description: 'Sagas that started but never completed',
                detectSql: `
-- Find incomplete sagas (started but not completed within 24h)
SELECT 
    saga_id,
    MIN(timestamp) as started_at,
    MAX(timestamp) as last_activity,
    COUNT(*) as event_count,
    ARRAY_AGG(DISTINCT event_type) as event_types
FROM events
WHERE saga_id IS NOT NULL
GROUP BY saga_id
HAVING 
    NOT ('SAGA_COMPLETED' = ANY(ARRAY_AGG(event_type)))
    AND NOT ('SAGA_FAILED' = ANY(ARRAY_AGG(event_type)))
    AND MAX(timestamp) < NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;`,
                compensateSql: `
-- Generate compensating events for stuck sagas
INSERT INTO events (event_type, aggregate_id, saga_id, payload, timestamp, metadata)
SELECT 
    'SAGA_COMPENSATED',
    aggregate_id,
    saga_id,
    jsonb_build_object(
        'reason', 'Automatic compensation - saga timeout',
        'original_events', COUNT(*),
        'compensated_at', NOW()
    ),
    NOW(),
    jsonb_build_object('auto_compensated', true)
FROM events
WHERE saga_id IN (
    SELECT saga_id FROM events
    GROUP BY saga_id
    HAVING 
        NOT ('SAGA_COMPLETED' = ANY(ARRAY_AGG(event_type)))
        AND MAX(timestamp) < NOW() - INTERVAL '24 hours'
)
GROUP BY saga_id, aggregate_id;`
            },
            {
                name: 'Orphaned Outbox Messages',
                description: 'Outbox messages that were never published',
                detectSql: `
-- Find stuck outbox messages
SELECT id, aggregate_id, event_type, created_at, attempts
FROM transactional_outbox
WHERE 
    status = 'pending'
    AND created_at < NOW() - INTERVAL '1 hour'
    AND attempts < 5
ORDER BY created_at;`,
                compensateSql: `
-- Move stuck messages to dead letter queue
UPDATE transactional_outbox
SET 
    status = 'dead_letter',
    updated_at = NOW(),
    error = 'Automatic DLQ - exceeded time threshold'
WHERE 
    status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';`
            }
        ];

        this.scripts.push(...ghostEventQueries.map(q => ({
            type: HygieneAction.GHOST_EVENT,
            ...q
        })));

        return ghostEventQueries;
    }

    // ─────────────────────────────────────────────────
    // VACUUM & OPTIMIZATION
    // ─────────────────────────────────────────────────

    generateVacuumScripts() {
        const vacuumScripts = [
            {
                name: 'Full Vacuum',
                description: 'Reclaim storage from deleted rows',
                sql: `
-- VACUUM FULL (requires table lock - run during maintenance window)
VACUUM (FULL, ANALYZE, VERBOSE) events;
VACUUM (FULL, ANALYZE, VERBOSE) quotations;
VACUUM (FULL, ANALYZE, VERBOSE) products;
VACUUM (FULL, ANALYZE, VERBOSE) transactional_outbox;`
            },
            {
                name: 'Reindex',
                description: 'Rebuild indexes for optimal performance',
                sql: `
-- Rebuild indexes
REINDEX TABLE events;
REINDEX TABLE quotations;
REINDEX TABLE products;

-- Analyze tables for query planner
ANALYZE events;
ANALYZE quotations;
ANALYZE products;`
            },
            {
                name: 'Archive Old Events',
                description: 'Move old events to archive table',
                sql: `
-- Archive events older than 1 year
INSERT INTO events_archive
SELECT * FROM events
WHERE timestamp < NOW() - INTERVAL '1 year';

-- Delete archived events from main table
DELETE FROM events
WHERE id IN (SELECT id FROM events_archive);`
            }
        ];

        this.scripts.push(...vacuumScripts.map(q => ({
            type: HygieneAction.VACUUM,
            ...q
        })));

        return vacuumScripts;
    }

    // ─────────────────────────────────────────────────
    // LOCAL DATABASE (WatermelonDB) CLEANUP
    // ─────────────────────────────────────────────────

    generateLocalDbCleanup() {
        return {
            name: 'WatermelonDB Sync Queue Cleanup',
            description: 'Clear stuck sync records',
            javascript: `
// WatermelonDB Sync Cleanup
async function cleanupSyncQueue(database) {
    const syncQueue = database.collections.get('sync_queue');
    
    // Find stuck records (older than 24h and still pending)
    const stuckRecords = await syncQueue
        .query(
            Q.where('status', 'pending'),
            Q.where('created_at', Q.lt(Date.now() - 24 * 60 * 60 * 1000))
        )
        .fetch();
    
    console.log(\`Found \${stuckRecords.length} stuck sync records\`);
    
    // Mark as failed
    await database.write(async () => {
        for (const record of stuckRecords) {
            await record.update(r => {
                r.status = 'failed';
                r.error = 'Automatic cleanup - exceeded 24h threshold';
            });
        }
    });
    
    return { cleaned: stuckRecords.length };
}`,
            sql: `
-- SQLite cleanup for WatermelonDB
DELETE FROM sync_queue 
WHERE status = 'pending' 
AND created_at < strftime('%s', 'now') - 86400;

-- Vacuum local database
VACUUM;`
        };
    }

    // ─────────────────────────────────────────────────
    // COMPLETE PURGE SCRIPT
    // ─────────────────────────────────────────────────

    generateFullPurgeScript() {
        const script = `
-- ═══════════════════════════════════════════════════════════════════════════
-- DATABASE PURGE SCRIPT - AUTO-QUOTE APPLICATION
-- Generated: ${new Date().toISOString()}
-- WARNING: This script permanently deletes data. Use with caution.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 1: ORPHAN CLEANUP
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove orphaned quotation items
DELETE FROM quotation_items
WHERE quotation_id NOT IN (SELECT id FROM quotations);

-- Remove orphaned product prices
DELETE FROM product_prices
WHERE product_id NOT IN (SELECT id FROM products);

-- Remove orphaned supplier contacts
DELETE FROM supplier_contacts
WHERE supplier_id NOT IN (SELECT id FROM suppliers);

-- Count orphans removed
-- SELECT 'Orphans cleaned' as phase, COUNT(*) as count;

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 2: GHOST EVENT COMPENSATION
-- ─────────────────────────────────────────────────────────────────────────────

-- Move stuck outbox messages to dead letter queue
UPDATE transactional_outbox
SET 
    status = 'dead_letter',
    updated_at = NOW(),
    error = 'Purge script - automatic cleanup'
WHERE 
    status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';

-- Create compensating events for incomplete sagas
INSERT INTO events (event_type, aggregate_id, saga_id, payload, timestamp)
SELECT 
    'SAGA_COMPENSATED',
    aggregate_id,
    saga_id,
    '{"reason": "Purge script compensation"}'::jsonb,
    NOW()
FROM events
WHERE saga_id IS NOT NULL
GROUP BY saga_id, aggregate_id
HAVING 
    NOT bool_or(event_type = 'SAGA_COMPLETED')
    AND NOT bool_or(event_type = 'SAGA_COMPENSATED')
    AND MAX(timestamp) < NOW() - INTERVAL '7 days';

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 3: TEST DATA CLEANUP
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove test data (identified by patterns)
DELETE FROM quotations WHERE supplier_email LIKE '%@test.%' OR supplier_email LIKE '%@example.%';
DELETE FROM products WHERE name LIKE 'TEST_%' OR name LIKE '[TEST]%';
DELETE FROM suppliers WHERE email LIKE '%@test.%' OR name LIKE 'Test Supplier%';

-- Remove events from deleted aggregates
DELETE FROM events
WHERE aggregate_id NOT IN (
    SELECT id FROM quotations
    UNION SELECT id FROM products  
    UNION SELECT id FROM suppliers
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 4: OPTIMIZATION
-- ─────────────────────────────────────────────────────────────────────────────

-- Vacuum and analyze (run separately, outside transaction)
-- VACUUM ANALYZE;

COMMIT;

-- Post-commit optimization (run separately)
-- VACUUM (FULL, ANALYZE) events;
-- VACUUM (FULL, ANALYZE) quotations;
-- REINDEX DATABASE current_database;

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF PURGE SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════
`;

        return script;
    }

    // ─────────────────────────────────────────────────
    // INTEGRITY VERIFICATION
    // ─────────────────────────────────────────────────

    generateIntegrityCheck() {
        return `
-- ═══════════════════════════════════════════════════════════════════════════
-- DATA INTEGRITY CHECK
-- ═══════════════════════════════════════════════════════════════════════════

-- Check Event Store Integrity
SELECT 'Event Store' as component,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT id) THEN 'OK'
        ELSE 'DUPLICATES FOUND'
    END as status,
    COUNT(*) as total_events
FROM events;

-- Check Outbox Integrity
SELECT 'Transactional Outbox' as component,
    status,
    COUNT(*) as count
FROM transactional_outbox
GROUP BY status;

-- Check for orphaned records
SELECT 'Orphan Check' as component,
    (SELECT COUNT(*) FROM quotation_items qi 
     LEFT JOIN quotations q ON qi.quotation_id = q.id 
     WHERE q.id IS NULL) as orphaned_items;

-- Check saga completion rate
SELECT 'Saga Completion' as component,
    ROUND(
        COUNT(*) FILTER (WHERE event_type = 'SAGA_COMPLETED')::numeric / 
        NULLIF(COUNT(DISTINCT saga_id), 0) * 100, 2
    ) as completion_rate_percent
FROM events
WHERE saga_id IS NOT NULL;
`;
    }

    getAllScripts() {
        this.detectOrphans();
        this.detectGhostEvents();
        this.generateVacuumScripts();

        return {
            purgeScript: this.generateFullPurgeScript(),
            integrityCheck: this.generateIntegrityCheck(),
            localDbCleanup: this.generateLocalDbCleanup(),
            individualScripts: this.scripts
        };
    }

    getMetrics() {
        return this.metrics;
    }
}

export const databaseHygiene = new DatabaseHygieneService();
export { HygieneAction, DatabaseHygieneService };
export default databaseHygiene;
