/**
 * Optimistic UI Service - Instant Perceived Performance with Data Integrity
 * 
 * PREMIUM FEATURE #3: Immediate UI updates with automatic rollback on failure
 * 
 * Features:
 * - Instant perceived response time (~100ms)
 * - Background Firestore sync
 * - Automatic rollback on sync failure
 * - Conflict detection and user notification
 * - Pending state visualization helpers
 * 
 * Created: 2025-12-31 - Quotation Module Reengineering
 */

import { HapticService } from './hapticService';

// ═══════════════════════════════════════════════════════════════════════════
// OPTIMISTIC UPDATE TRACKING
// ═══════════════════════════════════════════════════════════════════════════

// Map of pending updates: operationId -> { original, optimistic, status, callbacks }
const pendingUpdates = new Map();

// Listeners for state changes
const stateListeners = new Set();

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE STATUS
// ═══════════════════════════════════════════════════════════════════════════

export const OptimisticStatus = Object.freeze({
    PENDING: 'pending',     // Optimistic update applied, sync in progress
    SYNCING: 'syncing',     // Actively syncing to backend
    CONFIRMED: 'confirmed', // Successfully synced
    FAILED: 'failed',       // Sync failed, will rollback
    ROLLED_BACK: 'rolled_back' // Rollback completed
});

// ═══════════════════════════════════════════════════════════════════════════
// OPTIMISTIC UI SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class OptimisticUIService {
    constructor() {
        this.retryAttempts = 3;
        this.retryDelayMs = 1000;
        this.conflictNotificationEnabled = true;
    }

    /**
     * Execute an optimistic update
     * 
     * @param {string} operationId - Unique ID for this operation
     * @param {Object} config - Configuration
     * @param {Object} config.originalState - Current state before update
     * @param {Object} config.optimisticState - Optimistic new state
     * @param {Function} config.applyOptimistic - Function to apply optimistic update to UI
     * @param {Function} config.syncToBackend - Async function to sync to backend
     * @param {Function} config.onConfirm - Called when sync succeeds
     * @param {Function} config.onRollback - Called when sync fails and we rollback
     * @param {Function} config.onConflict - Called when conflict detected
     * @returns {Promise<Object>} Final result with status
     */
    async execute(operationId, config) {
        const {
            originalState,
            optimisticState,
            applyOptimistic,
            syncToBackend,
            onConfirm,
            onRollback,
            onConflict
        } = config;

        const startTime = performance.now();

        // ─────────────────────────────────────────────────────────────────
        // STEP 1: Immediately apply optimistic update (FAST!)
        // ─────────────────────────────────────────────────────────────────
        try {
            applyOptimistic(optimisticState);
            console.log(`⚡ Optimistic update applied in ${(performance.now() - startTime).toFixed(1)}ms`);
        } catch (error) {
            console.error('❌ Failed to apply optimistic update:', error);
            throw error;
        }

        // Track this pending update
        const updateEntry = {
            operationId,
            originalState,
            optimisticState,
            status: OptimisticStatus.PENDING,
            startedAt: Date.now(),
            config
        };
        pendingUpdates.set(operationId, updateEntry);
        this.notifyListeners();

        // Provide haptic feedback for perceived speed
        HapticService.trigger('impactLight');

        // ─────────────────────────────────────────────────────────────────
        // STEP 2: Sync to backend in background (with retry)
        // ─────────────────────────────────────────────────────────────────
        try {
            updateEntry.status = OptimisticStatus.SYNCING;
            this.notifyListeners();

            const result = await this.syncWithRetry(syncToBackend);

            // ─────────────────────────────────────────────────────────────
            // STEP 3a: SUCCESS - Confirm the optimistic update
            // ─────────────────────────────────────────────────────────────
            updateEntry.status = OptimisticStatus.CONFIRMED;
            updateEntry.result = result;
            pendingUpdates.delete(operationId);
            this.notifyListeners();

            console.log(`✅ Optimistic update confirmed: ${operationId}`);
            HapticService.trigger('success');

            if (onConfirm) {
                try {
                    await onConfirm(result);
                } catch (callbackError) {
                    console.warn('⚠️ onConfirm callback failed:', callbackError);
                }
            }

            return {
                status: OptimisticStatus.CONFIRMED,
                result,
                duration: Date.now() - updateEntry.startedAt
            };

        } catch (error) {
            // ─────────────────────────────────────────────────────────────
            // STEP 3b: FAILURE - Rollback the optimistic update
            // ─────────────────────────────────────────────────────────────
            console.error(`❌ Sync failed for ${operationId}:`, error);

            updateEntry.status = OptimisticStatus.FAILED;
            updateEntry.error = error;
            this.notifyListeners();

            // Check for conflict (version mismatch, concurrent edit, etc.)
            const isConflict = this.isConflictError(error);

            if (isConflict && onConflict) {
                console.log(`⚠️ Conflict detected for ${operationId}`);
                try {
                    await onConflict(error, originalState, optimisticState);
                } catch (conflictError) {
                    console.warn('⚠️ onConflict callback failed:', conflictError);
                }
            }

            // Rollback to original state
            await this.rollback(operationId, config.applyOptimistic || applyOptimistic);

            if (onRollback) {
                try {
                    await onRollback(error, originalState);
                } catch (rollbackError) {
                    console.warn('⚠️ onRollback callback failed:', rollbackError);
                }
            }

            return {
                status: OptimisticStatus.ROLLED_BACK,
                error: error.message,
                duration: Date.now() - updateEntry.startedAt,
                wasConflict: isConflict
            };
        }
    }

    /**
     * Sync to backend with exponential backoff retry
     */
    async syncWithRetry(syncFn) {
        let lastError;

        for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
            try {
                return await syncFn();
            } catch (error) {
                lastError = error;

                // Don't retry on client errors (4xx) or conflicts
                if (this.isNonRetryableError(error)) {
                    throw error;
                }

                if (attempt < this.retryAttempts - 1) {
                    const delay = this.retryDelayMs * Math.pow(2, attempt);
                    console.log(`🔄 Retry ${attempt + 1}/${this.retryAttempts} in ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Rollback an optimistic update
     */
    async rollback(operationId, applyFn) {
        const entry = pendingUpdates.get(operationId);
        if (!entry) {
            console.warn(`⚠️ No pending update found for rollback: ${operationId}`);
            return;
        }

        console.log(`🔙 Rolling back: ${operationId}`);
        HapticService.trigger('error');

        try {
            applyFn(entry.originalState);
            entry.status = OptimisticStatus.ROLLED_BACK;
        } catch (error) {
            console.error('❌ Rollback failed:', error);
            // Critical: UI is now inconsistent - should refresh
            this.notifyInconsistentState(operationId);
        }

        pendingUpdates.delete(operationId);
        this.notifyListeners();
    }

    /**
     * Check if error indicates a conflict
     */
    isConflictError(error) {
        const conflictIndicators = [
            'version mismatch',
            'already exists',
            'concurrent modification',
            'out of date',
            'ALREADY_EXISTS',
            'FAILED_PRECONDITION'
        ];

        const message = (error.message || '').toLowerCase();
        const code = error.code || '';

        return conflictIndicators.some(indicator =>
            message.includes(indicator.toLowerCase()) || code.includes(indicator)
        );
    }

    /**
     * Check if error should not be retried
     */
    isNonRetryableError(error) {
        const nonRetryableCodes = [
            'PERMISSION_DENIED',
            'UNAUTHENTICATED',
            'INVALID_ARGUMENT',
            'NOT_FOUND',
            'ALREADY_EXISTS'
        ];

        return nonRetryableCodes.includes(error.code);
    }

    /**
     * Notify user of inconsistent state (requires refresh)
     */
    notifyInconsistentState(operationId) {
        console.error(`🚨 Inconsistent state detected: ${operationId}`);
        // In a real app, you'd show a modal or toast here
        HapticService.trigger('error');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATE OBSERVATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Subscribe to pending update changes
     */
    subscribe(listener) {
        stateListeners.add(listener);
        return () => stateListeners.delete(listener);
    }

    /**
     * Notify all listeners of state change
     */
    notifyListeners() {
        const state = this.getState();
        stateListeners.forEach(listener => {
            try {
                listener(state);
            } catch (error) {
                console.warn('⚠️ Listener error:', error);
            }
        });
    }

    /**
     * Get current pending updates state
     */
    getState() {
        return {
            pendingCount: pendingUpdates.size,
            pending: Array.from(pendingUpdates.entries()).map(([id, entry]) => ({
                id,
                status: entry.status,
                startedAt: entry.startedAt,
                duration: Date.now() - entry.startedAt
            })),
            hasPending: pendingUpdates.size > 0
        };
    }

    /**
     * Check if a specific operation is pending
     */
    isPending(operationId) {
        const entry = pendingUpdates.get(operationId);
        return entry && [OptimisticStatus.PENDING, OptimisticStatus.SYNCING].includes(entry.status);
    }

    /**
     * Get pending status for an entity
     */
    getPendingStatus(entityId) {
        for (const [id, entry] of pendingUpdates.entries()) {
            if (id.includes(entityId)) {
                return entry.status;
            }
        }
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOK HELPER (for component integration)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create optimistic state wrapper for React
 * Usage:
 *   const [items, setItems, optimisticUpdate] = useOptimisticState(initialItems);
 *   
 *   const handleAddItem = async (newItem) => {
 *     await optimisticUpdate(
 *       'add-item',
 *       [...items, { ...newItem, _pending: true }], // optimistic
 *       () => api.addItem(newItem) // sync function
 *     );
 *   };
 */
export function createOptimisticUpdater(setState, getState) {
    return async (operationId, optimisticState, syncFn) => {
        const originalState = getState();

        return optimisticUI.execute(operationId, {
            originalState,
            optimisticState,
            applyOptimistic: setState,
            syncToBackend: syncFn,
            onConfirm: () => {
                // Remove pending flags if present
                if (typeof optimisticState === 'object' && optimisticState !== null) {
                    const confirmed = JSON.parse(JSON.stringify(optimisticState));
                    if (Array.isArray(confirmed)) {
                        confirmed.forEach(item => delete item._pending);
                    } else {
                        delete confirmed._pending;
                    }
                    setState(confirmed);
                }
            },
            onRollback: () => {
                // State already rolled back by service
            }
        });
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// PENDING INDICATOR HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add pending flag to an item (for UI visualization)
 */
export function markAsPending(item) {
    return { ...item, _pending: true, _pendingAt: Date.now() };
}

/**
 * Check if item has pending flag
 */
export function isPendingItem(item) {
    return !!item?._pending;
}

/**
 * Remove pending flag from item
 */
export function confirmItem(item) {
    const { _pending, _pendingAt, ...confirmed } = item;
    return confirmed;
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const optimisticUI = new OptimisticUIService();
export default optimisticUI;
