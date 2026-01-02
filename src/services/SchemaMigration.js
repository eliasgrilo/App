/**
 * Schema Version Migration System
 * 
 * PRODUCTION UTILITY: Automatic data structure versioning and migration
 * 
 * Features:
 * - Version tracking per data store
 * - Migration registry with upgrade/downgrade paths
 * - Automatic backup before migration
 * - Rollback support on failure
 * 
 * @module SchemaMigration
 */

const SCHEMA_VERSION_KEY = 'padoca_schema_versions'
const BACKUP_KEY = 'padoca_migration_backups'
const MAX_BACKUPS = 5

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

const migrations = new Map()

/**
 * Register a migration for a specific store
 * @param {string} storeName - Name of the data store
 * @param {number} version - Target version number
 * @param {Function} up - Upgrade function (oldData) => newData
 * @param {Function} down - Downgrade function (newData) => oldData
 */
export function registerMigration(storeName, version, up, down = null) {
    const key = `${storeName}_v${version}`
    migrations.set(key, { storeName, version, up, down })
    console.log(`📦 Migration registered: ${storeName} v${version}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// VERSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function getSchemaVersions() {
    try {
        const raw = localStorage.getItem(SCHEMA_VERSION_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch {
        return {}
    }
}

function setSchemaVersion(storeName, version) {
    const versions = getSchemaVersions()
    versions[storeName] = {
        version,
        updatedAt: new Date().toISOString()
    }
    localStorage.setItem(SCHEMA_VERSION_KEY, JSON.stringify(versions))
}

function getCurrentVersion(storeName) {
    return getSchemaVersions()[storeName]?.version || 0
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKUP SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

function getBackups() {
    try {
        const raw = localStorage.getItem(BACKUP_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function createBackup(storeName, data) {
    const backups = getBackups()
    const backup = {
        id: `backup_${Date.now()}_${storeName}`,
        storeName,
        data: JSON.stringify(data),
        createdAt: new Date().toISOString(),
        version: getCurrentVersion(storeName)
    }

    backups.unshift(backup)

    // Limit backups to prevent storage bloat
    while (backups.length > MAX_BACKUPS) {
        backups.pop()
    }

    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups))
    console.log(`💾 Backup created: ${backup.id}`)
    return backup.id
}

export function rollback(backupId) {
    const backups = getBackups()
    const backup = backups.find(b => b.id === backupId)

    if (!backup) {
        console.error(`❌ Backup not found: ${backupId}`)
        return false
    }

    try {
        const data = JSON.parse(backup.data)
        const storeKey = `padoca_${backup.storeName}`
        localStorage.setItem(storeKey, JSON.stringify(data))
        setSchemaVersion(backup.storeName, backup.version)
        console.log(`⏪ Rollback complete: ${backup.storeName} → v${backup.version}`)
        return true
    } catch (e) {
        console.error(`❌ Rollback failed:`, e)
        return false
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run all pending migrations for a store
 * @param {string} storeName - Name of the data store
 * @param {number} targetVersion - Target version to migrate to
 * @returns {Object} Migration result
 */
export async function migrateIfNeeded(storeName, targetVersion) {
    const currentVersion = getCurrentVersion(storeName)

    if (currentVersion >= targetVersion) {
        return { migrated: false, fromVersion: currentVersion, toVersion: currentVersion }
    }

    const storeKey = `padoca_${storeName}`
    const rawData = localStorage.getItem(storeKey)

    if (!rawData) {
        // No data to migrate, just set version
        setSchemaVersion(storeName, targetVersion)
        return { migrated: true, fromVersion: 0, toVersion: targetVersion, created: true }
    }

    let data = JSON.parse(rawData)
    const backupId = createBackup(storeName, data)

    const migrationsApplied = []

    try {
        // Apply migrations sequentially
        for (let v = currentVersion + 1; v <= targetVersion; v++) {
            const key = `${storeName}_v${v}`
            const migration = migrations.get(key)

            if (migration) {
                console.log(`🔄 Applying migration: ${storeName} v${v}`)
                data = await migration.up(data)
                migrationsApplied.push(v)
            }
        }

        // Save migrated data
        localStorage.setItem(storeKey, JSON.stringify(data))
        setSchemaVersion(storeName, targetVersion)

        console.log(`✅ Migration complete: ${storeName} v${currentVersion} → v${targetVersion}`)

        return {
            migrated: true,
            fromVersion: currentVersion,
            toVersion: targetVersion,
            migrationsApplied,
            backupId
        }
    } catch (error) {
        console.error(`❌ Migration failed, rolling back:`, error)
        rollback(backupId)
        return {
            migrated: false,
            error: error.message,
            rolledBack: true,
            backupId
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILT-IN MIGRATIONS
// ═══════════════════════════════════════════════════════════════════════════

// Quote store v1 → v2: Add signatureHash index
registerMigration('quote-lifecycle', 2, (data) => {
    if (!data.hashIndex) {
        data.hashIndex = {}
        if (data.quotes) {
            Object.values(data.quotes).forEach(q => {
                if (q.signatureHash) {
                    data.hashIndex[q.signatureHash] = q.id
                }
            })
        }
    }
    return data
})

// Quote store v2 → v3: Normalize status enum
registerMigration('quote-lifecycle', 3, (data) => {
    const statusMap = {
        'pending': 'PENDING',
        'awaiting': 'AWAITING',
        'orders': 'ORDERS',
        'received': 'RECEIVED',
        'completed': 'COMPLETED',
        'cancelled': 'CANCELLED'
    }

    if (data.quotes) {
        Object.values(data.quotes).forEach(q => {
            if (q.status && statusMap[q.status.toLowerCase()]) {
                q.status = statusMap[q.status.toLowerCase()]
            }
        })
    }
    return data
})

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export const SchemaMigration = {
    registerMigration,
    migrateIfNeeded,
    rollback,
    getCurrentVersion,
    getBackups,

    /**
     * Run all registered migrations for all stores
     */
    async runAllMigrations() {
        const results = {}
        const stores = new Set([...migrations.values()].map(m => m.storeName))

        for (const store of stores) {
            const maxVersion = Math.max(
                ...[...migrations.values()]
                    .filter(m => m.storeName === store)
                    .map(m => m.version)
            )
            results[store] = await migrateIfNeeded(store, maxVersion)
        }

        console.log('📦 All migrations complete:', results)
        return results
    },

    /**
     * Get migration status for all stores
     */
    getStatus() {
        const versions = getSchemaVersions()
        const stores = [...new Set([...migrations.values()].map(m => m.storeName))]

        return stores.map(store => {
            const current = versions[store]?.version || 0
            const latest = Math.max(
                0,
                ...[...migrations.values()]
                    .filter(m => m.storeName === store)
                    .map(m => m.version)
            )
            return {
                store,
                currentVersion: current,
                latestVersion: latest,
                needsMigration: current < latest,
                updatedAt: versions[store]?.updatedAt
            }
        })
    }
}

export default SchemaMigration
