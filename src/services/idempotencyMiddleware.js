/**
 * Idempotency Middleware Service - Enterprise-Grade Duplicate Prevention
 * 
 * PREMIUM FEATURE #2: Request-level deduplication with crypto hash fingerprinting
 * 
 * Features:
 * - Cryptographic request fingerprinting (SHA-256)
 * - TTL-based cache with Firestore persistence
 * - Automatic retry detection
 * - Race condition prevention with atomic locks
 * - Configurable conflict resolution strategies
 * 
 * Created: 2025-12-31 - Quotation Module Reengineering
 */

import { db } from '../firebase';
import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    serverTimestamp,
    runTransaction
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Default TTL for idempotency keys (2 hours in milliseconds)
    DEFAULT_TTL_MS: 2 * 60 * 60 * 1000,

    // Collection name in Firestore
    COLLECTION_NAME: 'idempotencyKeys',

    // Lock TTL for in-progress operations (5 minutes)
    LOCK_TTL_MS: 5 * 60 * 1000,

    // Conflict resolution strategies
    STRATEGIES: {
        RETURN_CACHED: 'return_cached',        // Return the cached result
        THROW_CONFLICT: 'throw_conflict',      // Throw an error
        EXECUTE_ANYWAY: 'execute_anyway'       // Execute again (dangerous!)
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY CACHE (for immediate duplicate detection)
// ═══════════════════════════════════════════════════════════════════════════

const memoryCache = new Map();
const MAX_CACHE_SIZE = 500;

/**
 * Clean expired entries from memory cache
 */
function cleanMemoryCache() {
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) {
        if (entry.expiresAt < now) {
            memoryCache.delete(key);
        }
    }
}

// Run cleanup every 5 minutes
setInterval(cleanMemoryCache, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════════════
// HASH GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate SHA-256 hash of request data for fingerprinting
 * Works in browser using SubtleCrypto API
 */
async function generateHash(data) {
    const text = JSON.stringify(data, Object.keys(data).sort());
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(text);

    // Use SubtleCrypto for SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

/**
 * Generate idempotency key from operation parameters
 */
async function generateIdempotencyKey(operationType, params) {
    const fingerprint = {
        op: operationType,
        ...params,
        timestamp_window: Math.floor(Date.now() / CONFIG.DEFAULT_TTL_MS) // Time window bucket
    };

    const hash = await generateHash(fingerprint);
    return `idem_${operationType}_${hash.substring(0, 16)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// IDEMPOTENCY MIDDLEWARE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class IdempotencyMiddleware {
    constructor() {
        this.conflictStrategy = CONFIG.STRATEGIES.RETURN_CACHED;
    }

    /**
     * Wrap an async operation with idempotency protection
     * 
     * @param {string} operationType - Type of operation (e.g., 'createOrder', 'confirmQuotation')
     * @param {Object} params - Operation parameters (used for fingerprinting)
     * @param {Function} operation - The async operation to execute
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Operation result or cached result
     */
    async execute(operationType, params, operation, options = {}) {
        const {
            ttlMs = CONFIG.DEFAULT_TTL_MS,
            conflictStrategy = this.conflictStrategy,
            userId = null,
            userName = null
        } = options;

        // Generate idempotency key
        const idempotencyKey = options.key || await generateIdempotencyKey(operationType, params);

        console.log(`🔐 Idempotency check: ${operationType} [${idempotencyKey.substring(0, 24)}...]`);

        // ─────────────────────────────────────────────────────────────────
        // STEP 1: Check in-memory cache (fastest path)
        // ─────────────────────────────────────────────────────────────────
        const memoryCached = memoryCache.get(idempotencyKey);
        if (memoryCached && memoryCached.expiresAt > Date.now()) {
            if (memoryCached.status === 'completed') {
                console.log(`⏭️ Returning cached result (memory): ${idempotencyKey}`);
                return { ...memoryCached.result, fromCache: true, cacheSource: 'memory' };
            }
            if (memoryCached.status === 'processing') {
                // Operation in progress - handle based on strategy
                return this.handleConflict(idempotencyKey, conflictStrategy, memoryCached);
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 2: Check Firestore (persistent cache)
        // ─────────────────────────────────────────────────────────────────
        try {
            const result = await runTransaction(db, async (transaction) => {
                const keyRef = doc(db, CONFIG.COLLECTION_NAME, idempotencyKey);
                const keyDoc = await transaction.get(keyRef);

                if (keyDoc.exists()) {
                    const data = keyDoc.data();

                    // Check if expired
                    if (data.expiresAt && data.expiresAt.toMillis() > Date.now()) {
                        if (data.status === 'completed') {
                            console.log(`⏭️ Returning cached result (Firestore): ${idempotencyKey}`);
                            return { cached: true, result: data.result };
                        }
                        if (data.status === 'processing' &&
                            data.lockExpiresAt &&
                            data.lockExpiresAt.toMillis() > Date.now()) {
                            // Still processing - conflict
                            return { conflict: true, data };
                        }
                        // Lock expired - allow retry
                    }
                }

                // ─────────────────────────────────────────────────────────────
                // STEP 3: Acquire lock and execute operation
                // ─────────────────────────────────────────────────────────────
                const now = Date.now();

                // Set lock
                transaction.set(keyRef, {
                    operationType,
                    params: JSON.stringify(params),
                    status: 'processing',
                    startedAt: serverTimestamp(),
                    lockExpiresAt: new Date(now + CONFIG.LOCK_TTL_MS),
                    expiresAt: new Date(now + ttlMs),
                    userId,
                    userName
                });

                return { execute: true };
            });

            if (result.cached) {
                // Update memory cache
                memoryCache.set(idempotencyKey, {
                    status: 'completed',
                    result: result.result,
                    expiresAt: Date.now() + ttlMs
                });
                return { ...result.result, fromCache: true, cacheSource: 'firestore' };
            }

            if (result.conflict) {
                return this.handleConflict(idempotencyKey, conflictStrategy, result.data);
            }

        } catch (error) {
            console.warn('⚠️ Firestore idempotency check failed, proceeding without:', error.message);
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 4: Execute the operation
        // ─────────────────────────────────────────────────────────────────

        // Update memory cache to 'processing'
        memoryCache.set(idempotencyKey, {
            status: 'processing',
            startedAt: Date.now(),
            expiresAt: Date.now() + ttlMs
        });

        let operationResult;
        let operationError;

        try {
            operationResult = await operation();
        } catch (error) {
            operationError = error;
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 5: Store result (success or failure)
        // ─────────────────────────────────────────────────────────────────
        const finalStatus = operationError ? 'failed' : 'completed';
        const now = Date.now();

        // Update memory cache
        if (memoryCache.size >= MAX_CACHE_SIZE) {
            cleanMemoryCache();
        }
        memoryCache.set(idempotencyKey, {
            status: finalStatus,
            result: operationResult,
            error: operationError?.message,
            expiresAt: now + ttlMs
        });

        // Update Firestore (non-blocking)
        try {
            const keyRef = doc(db, CONFIG.COLLECTION_NAME, idempotencyKey);
            await setDoc(keyRef, {
                status: finalStatus,
                result: operationError ? null : JSON.stringify(operationResult),
                error: operationError?.message || null,
                completedAt: serverTimestamp(),
                expiresAt: new Date(now + ttlMs)
            }, { merge: true });
        } catch (error) {
            console.warn('⚠️ Failed to persist idempotency result:', error.message);
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 6: Return result or throw error
        // ─────────────────────────────────────────────────────────────────
        if (operationError) {
            throw operationError;
        }

        console.log(`✅ Operation completed: ${operationType} [${idempotencyKey.substring(0, 24)}...]`);
        return { ...operationResult, fromCache: false };
    }

    /**
     * Handle conflict based on configured strategy
     */
    handleConflict(key, strategy, cachedData) {
        switch (strategy) {
            case CONFIG.STRATEGIES.RETURN_CACHED:
                console.log(`⚠️ Conflict detected, returning cached: ${key}`);
                if (cachedData.result) {
                    return {
                        ...JSON.parse(cachedData.result),
                        fromCache: true,
                        cacheSource: 'conflict'
                    };
                }
                return { fromCache: true, processing: true, cacheSource: 'conflict' };

            case CONFIG.STRATEGIES.THROW_CONFLICT:
                throw new Error(`Operation in progress: ${key}`);

            case CONFIG.STRATEGIES.EXECUTE_ANYWAY:
                console.warn(`⚠️ Executing despite conflict (dangerous): ${key}`);
                return null; // Continue to execution

            default:
                throw new Error(`Unknown conflict strategy: ${strategy}`);
        }
    }

    /**
     * Manually invalidate an idempotency key
     * Use with caution - allows re-execution of operation
     */
    async invalidate(operationType, params) {
        const key = await generateIdempotencyKey(operationType, params);

        // Remove from memory
        memoryCache.delete(key);

        // Remove from Firestore
        try {
            const keyRef = doc(db, CONFIG.COLLECTION_NAME, key);
            await deleteDoc(keyRef);
            console.log(`🗑️ Invalidated idempotency key: ${key}`);
        } catch (error) {
            console.warn('⚠️ Failed to invalidate from Firestore:', error.message);
        }
    }

    /**
     * Set default conflict resolution strategy
     */
    setConflictStrategy(strategy) {
        if (!Object.values(CONFIG.STRATEGIES).includes(strategy)) {
            throw new Error(`Invalid strategy: ${strategy}`);
        }
        this.conflictStrategy = strategy;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DECORATOR-STYLE WRAPPER FOR COMMON OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create an idempotent version of any async function
 */
export function withIdempotency(operationType, fn, options = {}) {
    return async (...args) => {
        return idempotencyMiddleware.execute(
            operationType,
            { args: JSON.stringify(args) },
            () => fn(...args),
            options
        );
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const idempotencyMiddleware = new IdempotencyMiddleware();
export const IdempotencyStrategies = CONFIG.STRATEGIES;
export default idempotencyMiddleware;
