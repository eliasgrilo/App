/**
 * Real-Time Change Data Capture (CDC) Service
 * 
 * PREMIUM FEATURE #9: Real-Time CDC
 * 
 * Pushes database changes to the UI in real-time via Firestore listeners.
 * Eliminates the need for "Refresh" buttons - changes appear instantly.
 * 
 * Features:
 * - Unified subscription management
 * - Automatic reconnection on network issues
 * - Debounced batch updates for performance
 * - Type-safe change events
 * - Memory-efficient listener cleanup
 * 
 * Architecture:
 * - Firestore onSnapshot for real-time changes
 * - Event-driven callback system
 * - Automatic unsubscribe on component unmount
 * 
 * @module realtimeCDC
 */

import { db } from '../firebase';
import {
    collection,
    doc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// CHANGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const ChangeType = Object.freeze({
    ADDED: 'added',
    MODIFIED: 'modified',
    REMOVED: 'removed'
});

export const EntityType = Object.freeze({
    QUOTATION: 'quotations',
    ORDER: 'orders',
    PRODUCT: 'products',
    SUPPLIER: 'suppliers',
    INVENTORY: 'inventory',
    PRICE_HISTORY: 'priceHistory',
    NOTIFICATION: 'notifications',
    EVENT: 'events'
});

// ═══════════════════════════════════════════════════════════════════════════
// CDC SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class RealtimeCDCService {
    constructor() {
        this.subscriptions = new Map(); // subscriptionId -> unsubscribe function
        this.listeners = new Map();     // entityType -> Set of callbacks
        this.debounceTimers = new Map();
        this.batchedChanges = new Map();

        // Configuration
        this.config = {
            debounceMs: 100,        // Batch changes within this window
            maxBatchSize: 50,       // Max changes per batch
            reconnectDelayMs: 1000, // Delay before reconnection attempt
            maxReconnectAttempts: 5
        };

        // Metrics
        this.metrics = {
            totalSubscriptions: 0,
            activeSubscriptions: 0,
            changesReceived: 0,
            reconnections: 0
        };
    }

    // ─────────────────────────────────────────────────
    // SUBSCRIPTION MANAGEMENT
    // ─────────────────────────────────────────────────

    /**
     * Subscribe to real-time changes for a collection
     * 
     * @param {string} entityType - Entity type from EntityType enum
     * @param {Object} options - Query options
     * @param {Function} callback - Called with changes
     * @returns {string} - Subscription ID for unsubscribing
     */
    subscribe(entityType, options = {}, callback) {
        const subscriptionId = this.generateSubscriptionId(entityType);

        try {
            // Build query
            const collectionRef = collection(db, entityType);
            let queryRef = query(collectionRef);

            // Apply filters
            if (options.where) {
                for (const [field, operator, value] of options.where) {
                    queryRef = query(queryRef, where(field, operator, value));
                }
            }

            // Apply ordering
            if (options.orderBy) {
                queryRef = query(queryRef, orderBy(options.orderBy, options.orderDirection || 'desc'));
            }

            // Apply limit
            if (options.limit) {
                queryRef = query(queryRef, limit(options.limit));
            }

            // Create snapshot listener
            const unsubscribe = onSnapshot(
                queryRef,
                { includeMetadataChanges: options.includeMetadata || false },
                (snapshot) => this.handleSnapshot(subscriptionId, entityType, snapshot, callback),
                (error) => this.handleError(subscriptionId, entityType, error, callback)
            );

            // Store subscription
            this.subscriptions.set(subscriptionId, {
                unsubscribe,
                entityType,
                createdAt: Date.now(),
                options
            });

            this.metrics.totalSubscriptions++;
            this.metrics.activeSubscriptions++;

            console.log(`[CDC] Subscribed to ${entityType}: ${subscriptionId}`);
            return subscriptionId;

        } catch (error) {
            console.error(`[CDC] Subscription error for ${entityType}:`, error);
            throw error;
        }
    }

    /**
     * Subscribe to a single document
     */
    subscribeToDocument(entityType, documentId, callback) {
        const subscriptionId = this.generateSubscriptionId(`${entityType}/${documentId}`);

        try {
            const docRef = doc(db, entityType, documentId);

            const unsubscribe = onSnapshot(
                docRef,
                (snapshot) => {
                    if (snapshot.exists()) {
                        callback({
                            type: ChangeType.MODIFIED,
                            id: snapshot.id,
                            data: snapshot.data(),
                            metadata: snapshot.metadata
                        });
                    } else {
                        callback({
                            type: ChangeType.REMOVED,
                            id: documentId,
                            data: null
                        });
                    }
                    this.metrics.changesReceived++;
                },
                (error) => this.handleError(subscriptionId, entityType, error, callback)
            );

            this.subscriptions.set(subscriptionId, {
                unsubscribe,
                entityType,
                documentId,
                createdAt: Date.now()
            });

            this.metrics.totalSubscriptions++;
            this.metrics.activeSubscriptions++;

            return subscriptionId;

        } catch (error) {
            console.error(`[CDC] Document subscription error:`, error);
            throw error;
        }
    }

    /**
     * Unsubscribe from a subscription
     */
    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);

        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(subscriptionId);
            this.metrics.activeSubscriptions--;
            console.log(`[CDC] Unsubscribed: ${subscriptionId}`);
            return true;
        }

        return false;
    }

    /**
     * Unsubscribe from all subscriptions of a specific entity type
     */
    unsubscribeAll(entityType = null) {
        let count = 0;

        for (const [id, subscription] of this.subscriptions) {
            if (!entityType || subscription.entityType === entityType) {
                subscription.unsubscribe();
                this.subscriptions.delete(id);
                this.metrics.activeSubscriptions--;
                count++;
            }
        }

        console.log(`[CDC] Unsubscribed ${count} subscriptions`);
        return count;
    }

    // ─────────────────────────────────────────────────
    // CHANGE HANDLERS
    // ─────────────────────────────────────────────────

    /**
     * Handle snapshot updates
     */
    handleSnapshot(subscriptionId, entityType, snapshot, callback) {
        const changes = [];

        snapshot.docChanges().forEach((change) => {
            const changeData = {
                type: change.type,
                id: change.doc.id,
                data: change.doc.data(),
                metadata: {
                    hasPendingWrites: snapshot.metadata.hasPendingWrites,
                    fromCache: snapshot.metadata.fromCache
                }
            };

            changes.push(changeData);
            this.metrics.changesReceived++;
        });

        if (changes.length === 0) return;

        // Debounce and batch changes
        this.batchChanges(subscriptionId, changes, callback);
    }

    /**
     * Batch changes with debouncing
     */
    batchChanges(subscriptionId, newChanges, callback) {
        // Get or create batch
        if (!this.batchedChanges.has(subscriptionId)) {
            this.batchedChanges.set(subscriptionId, []);
        }

        const batch = this.batchedChanges.get(subscriptionId);
        batch.push(...newChanges);

        // Limit batch size
        if (batch.length > this.config.maxBatchSize) {
            batch.splice(0, batch.length - this.config.maxBatchSize);
        }

        // Clear existing timer
        if (this.debounceTimers.has(subscriptionId)) {
            clearTimeout(this.debounceTimers.get(subscriptionId));
        }

        // Set new debounce timer
        const timer = setTimeout(() => {
            const finalBatch = this.batchedChanges.get(subscriptionId) || [];
            this.batchedChanges.delete(subscriptionId);
            this.debounceTimers.delete(subscriptionId);

            if (finalBatch.length > 0) {
                callback(finalBatch);
            }
        }, this.config.debounceMs);

        this.debounceTimers.set(subscriptionId, timer);
    }

    /**
     * Handle subscription errors
     */
    handleError(subscriptionId, entityType, error, callback) {
        console.error(`[CDC] Subscription error (${subscriptionId}):`, error);

        // Notify callback of error
        callback({
            error: true,
            message: error.message,
            code: error.code
        });

        // Attempt to reconnect for network errors
        if (error.code === 'unavailable' || error.code === 'cancelled') {
            this.attemptReconnect(subscriptionId, entityType, callback);
        }
    }

    /**
     * Attempt to reconnect a failed subscription
     */
    attemptReconnect(subscriptionId, entityType, callback, attempt = 1) {
        if (attempt > this.config.maxReconnectAttempts) {
            console.error(`[CDC] Max reconnection attempts reached for ${subscriptionId}`);
            return;
        }

        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) return;

        console.log(`[CDC] Reconnection attempt ${attempt} for ${subscriptionId}`);

        setTimeout(() => {
            try {
                // Unsubscribe old
                subscription.unsubscribe();

                // Resubscribe with same options
                const newId = this.subscribe(entityType, subscription.options, callback);

                // Remove old subscription
                this.subscriptions.delete(subscriptionId);

                this.metrics.reconnections++;
                console.log(`[CDC] Reconnected: ${subscriptionId} -> ${newId}`);

            } catch (error) {
                this.attemptReconnect(subscriptionId, entityType, callback, attempt + 1);
            }
        }, this.config.reconnectDelayMs * attempt);
    }

    // ─────────────────────────────────────────────────
    // CONVENIENCE SUBSCRIPTIONS
    // ─────────────────────────────────────────────────

    /**
     * Subscribe to quotation changes
     */
    subscribeToQuotations(callback, options = {}) {
        return this.subscribe(EntityType.QUOTATION, {
            orderBy: 'createdAt',
            orderDirection: 'desc',
            limit: options.limit || 50,
            ...options
        }, callback);
    }

    /**
     * Subscribe to new orders
     */
    subscribeToOrders(callback, options = {}) {
        return this.subscribe(EntityType.ORDER, {
            where: options.status ? [['status', '==', options.status]] : undefined,
            orderBy: 'createdAt',
            orderDirection: 'desc',
            limit: options.limit || 50,
            ...options
        }, callback);
    }

    /**
     * Subscribe to inventory changes
     */
    subscribeToInventory(callback, productId = null) {
        const options = productId
            ? { where: [['productId', '==', productId]] }
            : {};

        return this.subscribe(EntityType.INVENTORY, options, callback);
    }

    /**
     * Subscribe to price changes for a product
     */
    subscribeToPriceChanges(productId, callback) {
        return this.subscribe(EntityType.PRICE_HISTORY, {
            where: [['productId', '==', productId]],
            orderBy: 'timestamp',
            orderDirection: 'desc',
            limit: 20
        }, callback);
    }

    /**
     * Subscribe to notifications for a user
     */
    subscribeToNotifications(userId, callback) {
        return this.subscribe(EntityType.NOTIFICATION, {
            where: [
                ['userId', '==', userId],
                ['read', '==', false]
            ],
            orderBy: 'createdAt',
            orderDirection: 'desc'
        }, callback);
    }

    // ─────────────────────────────────────────────────
    // GLOBAL EVENT LISTENERS
    // ─────────────────────────────────────────────────

    /**
     * Add a global listener for an entity type
     * All changes to that entity type will trigger this listener
     */
    addListener(entityType, callback) {
        if (!this.listeners.has(entityType)) {
            this.listeners.set(entityType, new Set());
        }
        this.listeners.get(entityType).add(callback);
        return () => this.removeListener(entityType, callback);
    }

    /**
     * Remove a global listener
     */
    removeListener(entityType, callback) {
        const listeners = this.listeners.get(entityType);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    /**
     * Notify all global listeners for an entity type
     */
    notifyListeners(entityType, changes) {
        const listeners = this.listeners.get(entityType);
        if (listeners) {
            for (const callback of listeners) {
                try {
                    callback(changes);
                } catch (error) {
                    console.error('[CDC] Listener error:', error);
                }
            }
        }
    }

    // ─────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────

    generateSubscriptionId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }

    /**
     * Get service metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            subscriptionDetails: Array.from(this.subscriptions.entries()).map(([id, sub]) => ({
                id,
                entityType: sub.entityType,
                age: Date.now() - sub.createdAt
            }))
        };
    }

    /**
     * Get active subscription count
     */
    getActiveCount() {
        return this.subscriptions.size;
    }

    /**
     * Cleanup all resources
     */
    cleanup() {
        // Clear all debounce timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
        this.batchedChanges.clear();

        // Unsubscribe all
        this.unsubscribeAll();

        // Clear listeners
        this.listeners.clear();

        console.log('[CDC] Cleanup complete');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOK HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a React-friendly subscription that auto-unsubscribes
 * 
 * Usage in component:
 * useEffect(() => {
 *   return realtimeCDC.createReactSubscription(
 *     EntityType.QUOTATION,
 *     {},
 *     (changes) => setQuotations(prev => applyChanges(prev, changes))
 *   );
 * }, []);
 */
export function createReactSubscription(entityType, options, callback) {
    const subscriptionId = realtimeCDC.subscribe(entityType, options, callback);
    return () => realtimeCDC.unsubscribe(subscriptionId);
}

/**
 * Apply CDC changes to a state array
 */
export function applyChangesToArray(currentArray, changes) {
    let updated = [...currentArray];

    for (const change of changes) {
        switch (change.type) {
            case ChangeType.ADDED:
                // Only add if not already present
                if (!updated.find(item => item.id === change.id)) {
                    updated.unshift({ id: change.id, ...change.data });
                }
                break;

            case ChangeType.MODIFIED:
                updated = updated.map(item =>
                    item.id === change.id
                        ? { id: change.id, ...change.data }
                        : item
                );
                break;

            case ChangeType.REMOVED:
                updated = updated.filter(item => item.id !== change.id);
                break;
        }
    }

    return updated;
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const realtimeCDC = new RealtimeCDCService();

export { RealtimeCDCService };

export default realtimeCDC;
