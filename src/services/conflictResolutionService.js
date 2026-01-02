/**
 * Conflict Resolution Service
 * 
 * PREMIUM FEATURE #2: Optimistic UI with Conflict Resolution
 * 
 * Implements:
 * - Version vectors for conflict detection
 * - 3-way merge for concurrent edits
 * - Real-time sync status indicators
 * - Automatic conflict resolution where possible
 * - Manual resolution UI for complex conflicts
 * 
 * Created: 2025-12-31 - Quotation Module Reengineering
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const SYNC_STATUS = {
    SYNCED: 'synced',
    PENDING: 'pending',
    SYNCING: 'syncing',
    CONFLICT: 'conflict',
    ERROR: 'error'
};

export const CONFLICT_TYPE = {
    CONCURRENT_EDIT: 'concurrent_edit',
    FIELD_CONFLICT: 'field_conflict',
    DELETED_REMOTELY: 'deleted_remotely',
    VERSION_MISMATCH: 'version_mismatch'
};

export const RESOLUTION_STRATEGY = {
    KEEP_LOCAL: 'keep_local',
    KEEP_REMOTE: 'keep_remote',
    MERGE: 'merge',
    MANUAL: 'manual'
};

// ═══════════════════════════════════════════════════════════════════════════
// CRDTs - Conflict-free Replicated Data Types
// ═══════════════════════════════════════════════════════════════════════════
// These data structures converge automatically across devices without conflicts

/**
 * G-Counter (Grow-only Counter)
 * 
 * Use cases:
 * - Page views, click counts
 * - Total items added (not removed)
 * 
 * Properties:
 * - Only grows (increment operation)
 * - Eventually consistent across all replicas
 * - No conflicts possible
 */
export const GCounter = {
    /**
     * Create a new G-Counter
     * @param {string} deviceId - Device identifier
     * @returns {Object} - Counter state
     */
    create: (deviceId) => ({ [deviceId]: 0 }),

    /**
     * Increment the counter
     * @param {Object} counter - Current counter state
     * @param {string} deviceId - Device making the change
     * @param {number} amount - Amount to increment (default: 1)
     * @returns {Object} - New counter state
     */
    increment: (counter, deviceId, amount = 1) => ({
        ...counter,
        [deviceId]: (counter[deviceId] || 0) + Math.max(0, amount)
    }),

    /**
     * Get the total value
     * @param {Object} counter - Counter state
     * @returns {number} - Sum of all device counts
     */
    value: (counter) => Object.values(counter || {}).reduce((a, b) => a + b, 0),

    /**
     * Merge two counters (takes max of each device)
     * @param {Object} c1 - First counter
     * @param {Object} c2 - Second counter
     * @returns {Object} - Merged counter
     */
    merge: (c1, c2) => {
        const merged = { ...(c1 || {}) };
        for (const [device, count] of Object.entries(c2 || {})) {
            merged[device] = Math.max(merged[device] || 0, count);
        }
        return merged;
    }
};

/**
 * PN-Counter (Positive-Negative Counter)
 * 
 * Use cases:
 * - Inventory stock levels
 * - Cart quantities
 * - Any value that can increase AND decrease
 * 
 * Properties:
 * - Can increment and decrement
 * - Maintains two G-Counters internally (positive, negative)
 * - Value = positive - negative
 */
export const PNCounter = {
    /**
     * Create a new PN-Counter
     * @param {string} deviceId - Device identifier
     * @param {number} initialValue - Optional starting value
     * @returns {Object} - Counter state with p (positive) and n (negative) G-Counters
     */
    create: (deviceId, initialValue = 0) => ({
        p: { [deviceId]: Math.max(0, initialValue) },
        n: { [deviceId]: Math.max(0, -initialValue) }
    }),

    /**
     * Increment the counter
     */
    increment: (counter, deviceId, amount = 1) => ({
        p: GCounter.increment(counter.p || {}, deviceId, amount),
        n: counter.n || {}
    }),

    /**
     * Decrement the counter
     */
    decrement: (counter, deviceId, amount = 1) => ({
        p: counter.p || {},
        n: GCounter.increment(counter.n || {}, deviceId, amount)
    }),

    /**
     * Get the current value
     */
    value: (counter) => GCounter.value(counter?.p || {}) - GCounter.value(counter?.n || {}),

    /**
     * Merge two PN-Counters
     */
    merge: (c1, c2) => ({
        p: GCounter.merge(c1?.p || {}, c2?.p || {}),
        n: GCounter.merge(c1?.n || {}, c2?.n || {})
    })
};

/**
 * LWW-Register (Last-Writer-Wins Register)
 * 
 * Use cases:
 * - Single-value fields (name, email, status)
 * - Settings, preferences
 * 
 * Properties:
 * - Stores a single value with timestamp
 * - Latest timestamp wins on merge
 * - Simple but effective for most use cases
 */
export const LWWRegister = {
    /**
     * Create a new LWW-Register
     * @param {any} value - Initial value
     * @param {number} timestamp - Optional timestamp (defaults to now)
     * @returns {Object} - Register state
     */
    create: (value, timestamp = Date.now()) => ({ value, timestamp }),

    /**
     * Set a new value
     */
    set: (value, timestamp = Date.now()) => ({ value, timestamp }),

    /**
     * Get the current value
     */
    value: (register) => register?.value,

    /**
     * Merge two registers (latest timestamp wins)
     */
    merge: (r1, r2) => {
        if (!r1) return r2;
        if (!r2) return r1;
        return (r1.timestamp || 0) >= (r2.timestamp || 0) ? r1 : r2;
    }
};

/**
 * LWW-Map (Last-Writer-Wins Map/Object)
 * 
 * Use cases:
 * - Document/object with multiple fields
 * - Each field is an independent LWW-Register
 * 
 * Properties:
 * - Each key can be updated independently
 * - Conflicts resolved per-field by timestamp
 */
export const LWWMap = {
    /**
     * Create a new LWW-Map
     * @param {Object} values - Initial key-value pairs
     * @param {number} timestamp - Optional timestamp
     * @returns {Object} - Map state (each key is an LWW-Register)
     */
    create: (values = {}, timestamp = Date.now()) => {
        const state = {};
        for (const [key, value] of Object.entries(values)) {
            state[key] = LWWRegister.create(value, timestamp);
        }
        return state;
    },

    /**
     * Set a key's value
     */
    set: (map, key, value, timestamp = Date.now()) => ({
        ...(map || {}),
        [key]: LWWRegister.set(value, timestamp)
    }),

    /**
     * Get all current values
     */
    values: (map) => {
        const result = {};
        for (const [key, register] of Object.entries(map || {})) {
            result[key] = LWWRegister.value(register);
        }
        return result;
    },

    /**
     * Get a specific key's value
     */
    get: (map, key) => LWWRegister.value((map || {})[key]),

    /**
     * Merge two maps (each key merged independently)
     */
    merge: (m1, m2) => {
        const allKeys = new Set([
            ...Object.keys(m1 || {}),
            ...Object.keys(m2 || {})
        ]);

        const merged = {};
        for (const key of allKeys) {
            merged[key] = LWWRegister.merge(m1?.[key], m2?.[key]);
        }
        return merged;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// VERSION VECTOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create initial version vector for a new entity
 */
export function createVersionVector(deviceId) {
    return {
        [deviceId]: 1
    };
}

/**
 * Increment version vector for a device
 */
export function incrementVersion(vector, deviceId) {
    return {
        ...vector,
        [deviceId]: (vector[deviceId] || 0) + 1
    };
}

/**
 * Compare two version vectors
 * Returns: 'equal', 'greater', 'less', 'concurrent'
 */
export function compareVersions(v1, v2) {
    const allKeys = new Set([...Object.keys(v1 || {}), ...Object.keys(v2 || {})]);

    let v1Greater = false;
    let v2Greater = false;

    for (const key of allKeys) {
        const val1 = (v1 || {})[key] || 0;
        const val2 = (v2 || {})[key] || 0;

        if (val1 > val2) v1Greater = true;
        if (val2 > val1) v2Greater = true;
    }

    if (!v1Greater && !v2Greater) return 'equal';
    if (v1Greater && !v2Greater) return 'greater';
    if (!v1Greater && v2Greater) return 'less';
    return 'concurrent'; // Both are greater in different components = conflict
}

/**
 * Merge version vectors (take max of each component)
 */
export function mergeVersions(v1, v2) {
    const merged = { ...(v1 || {}) };

    for (const [key, val] of Object.entries(v2 || {})) {
        merged[key] = Math.max(merged[key] || 0, val);
    }

    return merged;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFLICT DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect conflicts between local and remote states
 * 
 * @param {Object} localState - Local version with version vector
 * @param {Object} remoteState - Remote version with version vector
 * @returns {Object} - Conflict detection result
 */
export function detectConflict(localState, remoteState) {
    // No conflict if identical
    if (JSON.stringify(localState) === JSON.stringify(remoteState)) {
        return { hasConflict: false };
    }

    // Check version vectors
    const versionComparison = compareVersions(
        localState?._version,
        remoteState?._version
    );

    if (versionComparison === 'equal') {
        return { hasConflict: false };
    }

    if (versionComparison === 'less') {
        // Remote is newer - no conflict, just update local
        return {
            hasConflict: false,
            action: 'update_local',
            remoteIsNewer: true
        };
    }

    if (versionComparison === 'greater') {
        // Local is newer - push to remote
        return {
            hasConflict: false,
            action: 'update_remote',
            localIsNewer: true
        };
    }

    // Concurrent - actual conflict!
    const conflictingFields = findConflictingFields(localState, remoteState);

    return {
        hasConflict: true,
        type: CONFLICT_TYPE.CONCURRENT_EDIT,
        conflictingFields,
        localVersion: localState?._version,
        remoteVersion: remoteState?._version,
        canAutoResolve: canAutoResolve(conflictingFields)
    };
}

/**
 * Find fields that differ between two states
 */
function findConflictingFields(local, remote) {
    const conflicts = [];
    const allKeys = new Set([
        ...Object.keys(local || {}),
        ...Object.keys(remote || {})
    ]);

    // Ignore metadata fields
    const ignoreFields = ['_version', '_lastSync', 'updatedAt', 'syncedAt'];

    for (const key of allKeys) {
        if (ignoreFields.includes(key)) continue;

        const localValue = local?.[key];
        const remoteValue = remote?.[key];

        if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
            conflicts.push({
                field: key,
                localValue,
                remoteValue,
                conflictType: getFieldConflictType(localValue, remoteValue)
            });
        }
    }

    return conflicts;
}

/**
 * Determine type of field conflict
 */
function getFieldConflictType(local, remote) {
    if (local === undefined) return 'added_remote';
    if (remote === undefined) return 'added_local';
    if (typeof local !== typeof remote) return 'type_change';
    if (Array.isArray(local) && Array.isArray(remote)) return 'array_conflict';
    if (typeof local === 'object') return 'object_conflict';
    return 'value_conflict';
}

/**
 * Check if conflicts can be auto-resolved
 */
function canAutoResolve(conflictingFields) {
    // Can auto-resolve if all conflicts are in non-critical fields
    const criticalFields = ['status', 'quotedTotal', 'items', 'orderId', 'confirmedAt'];

    return conflictingFields.every(c => !criticalFields.includes(c.field));
}

// ═══════════════════════════════════════════════════════════════════════════
// THREE-WAY MERGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Perform three-way merge using common ancestor
 * 
 * @param {Object} base - Common ancestor state
 * @param {Object} local - Local changes
 * @param {Object} remote - Remote changes
 * @returns {Object} - Merged result or conflict details
 */
export function threeWayMerge(base, local, remote) {
    const merged = { ...base };
    const unresolvedConflicts = [];
    const appliedChanges = [];

    const allKeys = new Set([
        ...Object.keys(base || {}),
        ...Object.keys(local || {}),
        ...Object.keys(remote || {})
    ]);

    // Skip metadata fields
    const skipFields = ['_version', '_lastSync', 'id'];

    for (const key of allKeys) {
        if (skipFields.includes(key)) continue;

        const baseValue = base?.[key];
        const localValue = local?.[key];
        const remoteValue = remote?.[key];

        const localChanged = JSON.stringify(baseValue) !== JSON.stringify(localValue);
        const remoteChanged = JSON.stringify(baseValue) !== JSON.stringify(remoteValue);

        if (!localChanged && !remoteChanged) {
            // No changes - keep base
            merged[key] = baseValue;
        } else if (localChanged && !remoteChanged) {
            // Only local changed - take local
            merged[key] = localValue;
            appliedChanges.push({ field: key, source: 'local' });
        } else if (!localChanged && remoteChanged) {
            // Only remote changed - take remote
            merged[key] = remoteValue;
            appliedChanges.push({ field: key, source: 'remote' });
        } else if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
            // Both changed to same value - no conflict
            merged[key] = localValue;
            appliedChanges.push({ field: key, source: 'both_same' });
        } else {
            // Both changed to different values - conflict!
            unresolvedConflicts.push({
                field: key,
                baseValue,
                localValue,
                remoteValue
            });
        }
    }

    // Merge version vectors
    merged._version = mergeVersions(
        local?._version || {},
        remote?._version || {}
    );

    if (unresolvedConflicts.length > 0) {
        return {
            success: false,
            merged,
            unresolvedConflicts,
            appliedChanges,
            needsManualResolution: true
        };
    }

    return {
        success: true,
        merged,
        appliedChanges
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTIMISTIC UPDATE MANAGER
// ═══════════════════════════════════════════════════════════════════════════

// In-memory queue of pending updates
const pendingUpdates = new Map();
const syncStatus = new Map();

/**
 * Apply optimistic update locally
 * Returns rollback function
 */
export function applyOptimisticUpdate(entityId, changes, deviceId) {
    const updateId = `${entityId}_${Date.now()}`;

    const update = {
        id: updateId,
        entityId,
        changes,
        appliedAt: Date.now(),
        deviceId,
        status: SYNC_STATUS.PENDING
    };

    pendingUpdates.set(updateId, update);
    syncStatus.set(entityId, SYNC_STATUS.PENDING);

    // Return rollback function
    return () => {
        pendingUpdates.delete(updateId);
        // Note: Actual rollback would need to restore previous state
        console.log(`Rolled back update ${updateId}`);
    };
}

/**
 * Sync pending updates to Firestore
 */
export async function syncPendingUpdates(collectionName, deviceId) {
    const results = [];

    for (const [updateId, update] of pendingUpdates.entries()) {
        try {
            syncStatus.set(update.entityId, SYNC_STATUS.SYNCING);

            const result = await syncSingleUpdate(
                collectionName,
                update.entityId,
                update.changes,
                deviceId
            );

            if (result.success) {
                pendingUpdates.delete(updateId);
                syncStatus.set(update.entityId, SYNC_STATUS.SYNCED);
                results.push({ updateId, success: true });
            } else if (result.hasConflict) {
                syncStatus.set(update.entityId, SYNC_STATUS.CONFLICT);
                results.push({
                    updateId,
                    success: false,
                    conflict: result.conflict
                });
            }
        } catch (error) {
            syncStatus.set(update.entityId, SYNC_STATUS.ERROR);
            results.push({ updateId, success: false, error: error.message });
        }
    }

    return results;
}

/**
 * Sync a single update with conflict detection
 */
async function syncSingleUpdate(collectionName, entityId, changes, deviceId) {
    return runTransaction(db, async (transaction) => {
        const docRef = doc(db, collectionName, entityId);
        const snapshot = await transaction.get(docRef);

        if (!snapshot.exists()) {
            // Document was deleted remotely
            return {
                success: false,
                hasConflict: true,
                conflict: {
                    type: CONFLICT_TYPE.DELETED_REMOTELY,
                    message: 'Document was deleted by another user'
                }
            };
        }

        const remoteData = snapshot.data();
        const localVersion = changes._version || {};

        // Check for conflicts
        const versionCheck = compareVersions(localVersion, remoteData._version || {});

        if (versionCheck === 'concurrent') {
            return {
                success: false,
                hasConflict: true,
                conflict: {
                    type: CONFLICT_TYPE.VERSION_MISMATCH,
                    localVersion,
                    remoteVersion: remoteData._version,
                    remoteData
                }
            };
        }

        // No conflict - apply update
        const newVersion = incrementVersion(
            mergeVersions(localVersion, remoteData._version || {}),
            deviceId
        );

        const updateData = {
            ...changes,
            _version: newVersion,
            _lastSync: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        transaction.update(docRef, updateData);

        return { success: true, newVersion };
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC STATUS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get sync status for an entity
 */
export function getSyncStatus(entityId) {
    return syncStatus.get(entityId) || SYNC_STATUS.SYNCED;
}

/**
 * Get all pending updates
 */
export function getPendingUpdates() {
    return Array.from(pendingUpdates.values());
}

/**
 * Clear all pending updates (use with caution)
 */
export function clearPendingUpdates() {
    pendingUpdates.clear();
}

/**
 * Get global sync state
 */
export function getGlobalSyncState() {
    const statuses = Array.from(syncStatus.values());

    if (statuses.includes(SYNC_STATUS.CONFLICT)) {
        return { status: SYNC_STATUS.CONFLICT, message: 'Conflitos pendentes' };
    }

    if (statuses.includes(SYNC_STATUS.ERROR)) {
        return { status: SYNC_STATUS.ERROR, message: 'Erro de sincronização' };
    }

    if (statuses.includes(SYNC_STATUS.SYNCING)) {
        return { status: SYNC_STATUS.SYNCING, message: 'Sincronizando...' };
    }

    if (statuses.includes(SYNC_STATUS.PENDING)) {
        return {
            status: SYNC_STATUS.PENDING,
            message: `${pendingUpdates.size} alteração(ões) pendente(s)`
        };
    }

    return { status: SYNC_STATUS.SYNCED, message: 'Sincronizado' };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFLICT RESOLUTION UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resolve conflict by keeping local version
 */
export async function resolveKeepLocal(collectionName, entityId, localData, deviceId) {
    const docRef = doc(db, collectionName, entityId);

    // Force-update with new version
    const newVersion = incrementVersion(localData._version || {}, deviceId);
    newVersion[`force_${Date.now()}`] = 1; // Ensure we're ahead of remote

    await setDoc(docRef, {
        ...localData,
        _version: newVersion,
        _resolvedAt: serverTimestamp(),
        _resolvedBy: deviceId,
        _resolutionStrategy: RESOLUTION_STRATEGY.KEEP_LOCAL
    }, { merge: true });

    syncStatus.set(entityId, SYNC_STATUS.SYNCED);
    return { success: true };
}

/**
 * Resolve conflict by accepting remote version
 */
export async function resolveKeepRemote(collectionName, entityId) {
    // Just clear local pending updates - remote is already correct
    for (const [updateId, update] of pendingUpdates.entries()) {
        if (update.entityId === entityId) {
            pendingUpdates.delete(updateId);
        }
    }

    syncStatus.set(entityId, SYNC_STATUS.SYNCED);
    return { success: true };
}

/**
 * Resolve conflict with manual merge result
 */
export async function resolveWithMerge(collectionName, entityId, mergedData, deviceId) {
    const docRef = doc(db, collectionName, entityId);

    // Get current remote version
    const snapshot = await getDoc(docRef);
    const remoteVersion = snapshot.exists() ? snapshot.data()._version || {} : {};

    // Create new version that supersedes both
    const newVersion = mergeVersions(mergedData._version || {}, remoteVersion);
    newVersion[deviceId] = (newVersion[deviceId] || 0) + 1;

    await setDoc(docRef, {
        ...mergedData,
        _version: newVersion,
        _resolvedAt: serverTimestamp(),
        _resolvedBy: deviceId,
        _resolutionStrategy: RESOLUTION_STRATEGY.MERGE
    }, { merge: true });

    // Clear pending updates for this entity
    for (const [updateId, update] of pendingUpdates.entries()) {
        if (update.entityId === entityId) {
            pendingUpdates.delete(updateId);
        }
    }

    syncStatus.set(entityId, SYNC_STATUS.SYNCED);
    return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const ConflictResolutionService = {
    // CRDTs - Conflict-free Replicated Data Types
    GCounter,
    PNCounter,
    LWWRegister,
    LWWMap,

    // Version vectors
    createVersionVector,
    incrementVersion,
    compareVersions,
    mergeVersions,

    // Conflict detection
    detectConflict,
    threeWayMerge,

    // Optimistic updates
    applyOptimisticUpdate,
    syncPendingUpdates,

    // Status management
    getSyncStatus,
    getPendingUpdates,
    clearPendingUpdates,
    getGlobalSyncState,

    // Resolution
    resolveKeepLocal,
    resolveKeepRemote,
    resolveWithMerge,

    // Constants
    SYNC_STATUS,
    CONFLICT_TYPE,
    RESOLUTION_STRATEGY
};

export default ConflictResolutionService;
