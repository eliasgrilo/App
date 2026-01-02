/**
 * Distributed Lock Service - Enterprise-Grade Concurrency Control
 * 
 * Implements distributed locking using Firestore for:
 * - Race condition prevention across multiple instances/clients
 * - Optimistic locking with automatic expiry
 * - Heartbeat extension for long-running operations
 * - Retry logic with exponential backoff
 * 
 * Architecture Pattern: Distributed Mutex with TTL
 * 
 * @module DistributedLockService
 * @version 1.0.0
 */

import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    updateDoc,
    serverTimestamp,
    runTransaction,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { EventStoreService, EventType } from './eventStoreService';

// ═══════════════════════════════════════════════════════════════════════════
// LOCK CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
    // Lock TTL (Time To Live) in milliseconds
    lockTTL: 30000, // 30 seconds

    // Heartbeat interval for extending locks
    heartbeatInterval: 10000, // 10 seconds

    // Maximum retry attempts for acquiring lock
    maxRetries: 5,

    // Base delay for retry (exponential backoff)
    retryBaseDelay: 100, // 100ms

    // Maximum delay between retries
    retryMaxDelay: 5000, // 5 seconds

    // Collection name for locks
    collection: 'distributed_locks'
};

// ═══════════════════════════════════════════════════════════════════════════
// LOCK SCOPES - Granular lock types
// ═══════════════════════════════════════════════════════════════════════════

export const LockScope = Object.freeze({
    // Quotation operations
    QUOTATION_CREATE: 'quotation:create',
    QUOTATION_UPDATE: 'quotation:update',
    QUOTATION_CONFIRM: 'quotation:confirm',
    QUOTATION_PROCESS: 'quotation:process',

    // Order operations
    ORDER_CREATE: 'order:create',
    ORDER_UPDATE: 'order:update',
    ORDER_CONFIRM: 'order:confirm',

    // Email operations
    EMAIL_PROCESS: 'email:process',
    EMAIL_SEND: 'email:send',

    // Inventory operations
    INVENTORY_UPDATE: 'inventory:update',
    STOCK_ADJUST: 'stock:adjust',

    // Generic scopes
    ENTITY_MODIFY: 'entity:modify',
    BATCH_OPERATION: 'batch:operation'
});

// ═══════════════════════════════════════════════════════════════════════════
// DISTRIBUTED LOCK CLASS
// ═══════════════════════════════════════════════════════════════════════════

class DistributedLock {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.activeLocks = new Map(); // Track locally held locks
        this.heartbeatIntervals = new Map(); // Track heartbeat intervals
    }

    /**
     * Generate a unique lock holder ID
     * Identifies this instance/client as the lock holder
     */
    generateHolderId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        const tabId = typeof window !== 'undefined' ?
            (window.name || 'tab') : 'server';
        return `holder_${tabId}_${timestamp}_${random}`;
    }

    /**
     * Calculate lock expiry time
     */
    calculateExpiry(ttl = this.config.lockTTL) {
        return new Date(Date.now() + ttl);
    }

    /**
     * Build lock document ID from scope and resource
     * E.g., "quotation:confirm:quot_12345"
     */
    buildLockId(scope, resourceId) {
        return `${scope}:${resourceId}`.replace(/[\/\.]/g, '_');
    }

    /**
     * Acquire a distributed lock
     * 
     * @param {string} scope - Lock scope from LockScope enum
     * @param {string} resourceId - ID of the resource to lock
     * @param {Object} options - Lock options
     * @returns {Promise<Object>} - Lock result with holder ID and release function
     */
    async acquire(scope, resourceId, options = {}) {
        const {
            ttl = this.config.lockTTL,
            retries = this.config.maxRetries,
            metadata = {}
        } = options;

        const lockId = this.buildLockId(scope, resourceId);
        const holderId = this.generateHolderId();

        console.log(`🔒 Attempting to acquire lock: ${lockId}`);

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const acquired = await this.tryAcquire(lockId, holderId, ttl, {
                    scope,
                    resourceId,
                    ...metadata
                });

                if (acquired) {
                    // Start heartbeat to keep lock alive
                    this.startHeartbeat(lockId, holderId);

                    // Track locally
                    this.activeLocks.set(lockId, {
                        holderId,
                        acquiredAt: new Date(),
                        scope,
                        resourceId
                    });

                    // Log event
                    await EventStoreService.append({
                        eventType: EventType.LOCK_ACQUIRED,
                        aggregateId: resourceId,
                        aggregateType: 'Lock',
                        payload: { scope, lockId, holderId, ttl }
                    }).catch(e => console.warn('Lock event failed:', e));

                    console.log(`✅ Lock acquired: ${lockId} (attempt ${attempt + 1})`);

                    return {
                        acquired: true,
                        lockId,
                        holderId,
                        expiresAt: this.calculateExpiry(ttl),
                        release: () => this.release(lockId, holderId)
                    };
                }
            } catch (error) {
                console.warn(`⚠️ Lock attempt ${attempt + 1} failed:`, error.message);
            }

            // Exponential backoff with jitter
            if (attempt < retries) {
                const delay = Math.min(
                    this.config.retryBaseDelay * Math.pow(2, attempt) +
                    Math.random() * 100,
                    this.config.retryMaxDelay
                );
                console.log(`⏳ Retrying lock in ${delay}ms...`);
                await this.sleep(delay);
            }
        }

        console.log(`❌ Failed to acquire lock: ${lockId} after ${retries + 1} attempts`);
        return {
            acquired: false,
            lockId,
            reason: 'Lock held by another process'
        };
    }

    /**
     * Try to acquire lock with atomic transaction
     */
    async tryAcquire(lockId, holderId, ttl, metadata) {
        const lockRef = doc(db, this.config.collection, lockId);

        try {
            const acquired = await runTransaction(db, async (transaction) => {
                const lockDoc = await transaction.get(lockRef);

                if (lockDoc.exists()) {
                    const lockData = lockDoc.data();
                    const expiryDate = lockData.expiresAt?.toDate?.() ||
                        new Date(lockData.expiresAt);

                    // Check if lock is expired
                    if (expiryDate > new Date()) {
                        // Lock still valid and held by someone else
                        console.log(`🔐 Lock held by: ${lockData.holderId}`);
                        return false;
                    }

                    // Lock expired, we can take it
                    console.log(`⌛ Lock expired, taking over from: ${lockData.holderId}`);
                }

                // Set or override the lock
                const newLock = {
                    lockId,
                    holderId,
                    acquiredAt: serverTimestamp(),
                    expiresAt: this.calculateExpiry(ttl),
                    ttl,
                    heartbeatCount: 0,
                    metadata: {
                        ...metadata,
                        userAgent: typeof navigator !== 'undefined' ?
                            navigator.userAgent : 'server'
                    }
                };

                transaction.set(lockRef, newLock);
                return true;
            });

            return acquired;
        } catch (error) {
            console.error('Lock transaction failed:', error);
            return false;
        }
    }

    /**
     * Release a lock
     * 
     * @param {string} lockId - Lock ID
     * @param {string} holderId - Holder ID (must match)
     * @returns {Promise<boolean>} - Whether release was successful
     */
    async release(lockId, holderId) {
        console.log(`🔓 Releasing lock: ${lockId}`);

        // Stop heartbeat
        this.stopHeartbeat(lockId);

        // Remove from local tracking
        this.activeLocks.delete(lockId);

        const lockRef = doc(db, this.config.collection, lockId);

        try {
            const released = await runTransaction(db, async (transaction) => {
                const lockDoc = await transaction.get(lockRef);

                if (!lockDoc.exists()) {
                    console.log('Lock already released');
                    return true;
                }

                const lockData = lockDoc.data();

                // Only release if we're the holder
                if (lockData.holderId !== holderId) {
                    console.warn(`Cannot release lock held by: ${lockData.holderId}`);
                    return false;
                }

                transaction.delete(lockRef);
                return true;
            });

            if (released) {
                console.log(`✅ Lock released: ${lockId}`);

                // Log event (non-blocking)
                EventStoreService.append({
                    eventType: EventType.LOCK_RELEASED,
                    aggregateId: lockId,
                    aggregateType: 'Lock',
                    payload: { lockId, holderId }
                }).catch(e => console.warn('Lock release event failed:', e));
            }

            return released;
        } catch (error) {
            console.error('Lock release failed:', error);
            return false;
        }
    }

    /**
     * Extend lock TTL with heartbeat
     */
    async extend(lockId, holderId, extensionMs = this.config.lockTTL) {
        const lockRef = doc(db, this.config.collection, lockId);

        try {
            const extended = await runTransaction(db, async (transaction) => {
                const lockDoc = await transaction.get(lockRef);

                if (!lockDoc.exists()) {
                    return false;
                }

                const lockData = lockDoc.data();

                if (lockData.holderId !== holderId) {
                    return false;
                }

                transaction.update(lockRef, {
                    expiresAt: this.calculateExpiry(extensionMs),
                    heartbeatCount: (lockData.heartbeatCount || 0) + 1,
                    lastHeartbeat: serverTimestamp()
                });

                return true;
            });

            return extended;
        } catch (error) {
            console.warn('Lock extension failed:', error.message);
            return false;
        }
    }

    /**
     * Start heartbeat to keep lock alive
     */
    startHeartbeat(lockId, holderId) {
        if (this.heartbeatIntervals.has(lockId)) {
            return; // Already running
        }

        const interval = setInterval(async () => {
            const extended = await this.extend(lockId, holderId);
            if (!extended) {
                console.warn(`⚠️ Heartbeat failed for ${lockId}, stopping`);
                this.stopHeartbeat(lockId);
            }
        }, this.config.heartbeatInterval);

        this.heartbeatIntervals.set(lockId, interval);
    }

    /**
     * Stop heartbeat for a lock
     */
    stopHeartbeat(lockId) {
        const interval = this.heartbeatIntervals.get(lockId);
        if (interval) {
            clearInterval(interval);
            this.heartbeatIntervals.delete(lockId);
        }
    }

    /**
     * Check if a resource is locked
     * 
     * @param {string} scope - Lock scope
     * @param {string} resourceId - Resource ID
     * @returns {Promise<Object>} - Lock status
     */
    async isLocked(scope, resourceId) {
        const lockId = this.buildLockId(scope, resourceId);
        const lockRef = doc(db, this.config.collection, lockId);

        try {
            const lockDoc = await getDoc(lockRef);

            if (!lockDoc.exists()) {
                return { locked: false };
            }

            const lockData = lockDoc.data();
            const expiryDate = lockData.expiresAt?.toDate?.() ||
                new Date(lockData.expiresAt);

            if (expiryDate <= new Date()) {
                return { locked: false, expired: true };
            }

            return {
                locked: true,
                holderId: lockData.holderId,
                expiresAt: expiryDate,
                acquiredAt: lockData.acquiredAt?.toDate?.()
            };
        } catch (error) {
            console.error('Lock check failed:', error);
            return { locked: false, error: error.message };
        }
    }

    /**
     * Execute a function with a lock
     * Automatically acquires and releases lock
     * 
     * @param {string} scope - Lock scope
     * @param {string} resourceId - Resource ID
     * @param {Function} fn - Function to execute
     * @param {Object} options - Lock options
     * @returns {Promise<Object>} - Result of function or error
     */
    async withLock(scope, resourceId, fn, options = {}) {
        const lockResult = await this.acquire(scope, resourceId, options);

        if (!lockResult.acquired) {
            return {
                success: false,
                error: 'Could not acquire lock',
                lockId: lockResult.lockId
            };
        }

        try {
            const result = await fn();
            return {
                success: true,
                result,
                lockId: lockResult.lockId
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                lockId: lockResult.lockId
            };
        } finally {
            await lockResult.release();
        }
    }

    /**
     * Force release an abandoned lock (admin only)
     */
    async forceRelease(lockId) {
        console.warn(`⚠️ Force releasing lock: ${lockId}`);

        const lockRef = doc(db, this.config.collection, lockId);

        try {
            await deleteDoc(lockRef);
            this.stopHeartbeat(lockId);
            this.activeLocks.delete(lockId);
            console.log(`✅ Force released: ${lockId}`);
            return true;
        } catch (error) {
            console.error('Force release failed:', error);
            return false;
        }
    }

    /**
     * Clean up expired locks (maintenance)
     */
    async cleanupExpiredLocks() {
        console.log('🧹 Cleaning up expired locks...');

        // Note: This is a simplified version
        // Production would use a Cloud Function with scheduled trigger

        const now = new Date();
        let cleaned = 0;

        for (const [lockId, lockInfo] of this.activeLocks) {
            const lockRef = doc(db, this.config.collection, lockId);
            const lockDoc = await getDoc(lockRef);

            if (lockDoc.exists()) {
                const lockData = lockDoc.data();
                const expiryDate = lockData.expiresAt?.toDate?.() ||
                    new Date(lockData.expiresAt);

                if (expiryDate <= now) {
                    await deleteDoc(lockRef);
                    this.activeLocks.delete(lockId);
                    this.stopHeartbeat(lockId);
                    cleaned++;
                }
            }
        }

        console.log(`🗑️ Cleaned ${cleaned} expired locks`);
        return cleaned;
    }

    /**
     * Release all locks held by this instance
     * Call on shutdown/cleanup
     */
    async releaseAll() {
        console.log('🔓 Releasing all local locks...');

        const releases = [];

        for (const [lockId, lockInfo] of this.activeLocks) {
            releases.push(this.release(lockId, lockInfo.holderId));
        }

        await Promise.allSettled(releases);

        // Clear all heartbeats
        for (const [lockId] of this.heartbeatIntervals) {
            this.stopHeartbeat(lockId);
        }

        console.log(`✅ Released ${releases.length} locks`);
    }

    /**
     * Helper: Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

const distributedLock = new DistributedLock();

// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        distributedLock.releaseAll().catch(console.error);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const DistributedLockService = {
    // Core operations
    acquire: (scope, resourceId, options) =>
        distributedLock.acquire(scope, resourceId, options),
    release: (lockId, holderId) =>
        distributedLock.release(lockId, holderId),
    extend: (lockId, holderId, extensionMs) =>
        distributedLock.extend(lockId, holderId, extensionMs),

    // Query operations
    isLocked: (scope, resourceId) =>
        distributedLock.isLocked(scope, resourceId),

    // Convenience wrapper
    withLock: (scope, resourceId, fn, options) =>
        distributedLock.withLock(scope, resourceId, fn, options),

    // Maintenance
    forceRelease: (lockId) => distributedLock.forceRelease(lockId),
    cleanupExpiredLocks: () => distributedLock.cleanupExpiredLocks(),
    releaseAll: () => distributedLock.releaseAll(),

    // Constants
    LockScope,

    // Configuration
    configure: (config) => {
        Object.assign(distributedLock.config, config);
    }
};

export default DistributedLockService;
