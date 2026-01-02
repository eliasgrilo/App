/**
 * Background Stock Monitor - Automated Low-Stock Detection
 * 
 * State 1: Smart Pending - Creates quotation cards automatically
 * 
 * Monitors inventory and creates AutoQuoteRequests when:
 * - stock <= minStock
 * - supplier.autoRequest === true
 * - No existing active request for product+supplier
 * 
 * Features:
 * - Firestore real-time listener for inventory changes
 * - Strict duplicate prevention via deduplicationKey
 * - Debounced processing to batch multiple updates
 * - Distributed lock to prevent race conditions
 * 
 * @module BackgroundStockMonitor
 * @version 1.0.0
 */

import { db } from '../firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    runTransaction,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { HapticService } from './hapticService';
import { AutoQuoteStateMachine, AutoQuoteState } from './autoQuoteStateMachine';
import { createAuditEntry } from './auditService';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Debounce time for batching multiple product events (3 seconds)
    DEBOUNCE_MS: 3000,

    // Maximum requests per batch
    MAX_BATCH_SIZE: 20,

    // Collection names
    COLLECTION_PRODUCTS: 'products',
    COLLECTION_SUPPLIERS: 'suppliers',
    COLLECTION_AUTO_QUOTE_REQUESTS: 'autoQuoteRequests',
    COLLECTION_DEDUP_LOCKS: 'autoQuoteDedupLocks',

    // Lock TTL (5 minutes)
    LOCK_TTL_MS: 300000,

    // System user for audit trail
    SYSTEM_USER_ID: 'system_background_monitor',
    SYSTEM_USER_NAME: 'Monitor de Estoque'
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

// Pending products awaiting processing (grouped by supplier)
const pendingProducts = new Map();

// Debounce timer
let debounceTimer = null;

// Firestore listener unsubscribe function
let unsubscribeInventory = null;

// Initialization flag
let isMonitoring = false;

// ═══════════════════════════════════════════════════════════════════════════════
// DUPLICATE PREVENTION - Firestore-based
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate deduplication key for product+supplier combo
 * @param {string} productId
 * @param {string} supplierId
 * @returns {string}
 */
function generateDedupKey(productId, supplierId) {
    return `${productId}:${supplierId}`;
}

/**
 * Check if an active request already exists for this product+supplier
 * Active = not in RECEIVED, CANCELLED, or EXPIRED states
 * 
 * @param {string} dedupKey - Deduplication key
 * @returns {Promise<boolean>} - true if duplicate exists
 */
async function hasActiveRequest(dedupKey) {
    try {
        const activeStates = [
            AutoQuoteState.PENDING,
            AutoQuoteState.AWAITING,
            AutoQuoteState.PROCESSING,
            AutoQuoteState.ORDERED
        ];

        const q = query(
            collection(db, CONFIG.COLLECTION_AUTO_QUOTE_REQUESTS),
            where('deduplicationKey', '==', dedupKey),
            where('status', 'in', activeStates),
            where('softDeleted', '==', false)
        );

        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('❌ hasActiveRequest check failed:', error.message);
        // Fail safe: assume duplicate exists to prevent creation
        return true;
    }
}

/**
 * Check if a request was recently received (within cooldown window)
 * This prevents spam creation when stock remains low after receiving goods
 * 
 * @param {string} dedupKey - Deduplication key
 * @returns {Promise<boolean>} - true if recently received (should skip)
 */
async function hasRecentlyReceivedRequest(dedupKey) {
    try {
        // Cooldown window: 7 days after receiving goods
        const cooldownDays = 7;
        const cooldownDate = new Date();
        cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);
        const cooldownISO = cooldownDate.toISOString();

        const q = query(
            collection(db, CONFIG.COLLECTION_AUTO_QUOTE_REQUESTS),
            where('deduplicationKey', '==', dedupKey),
            where('status', '==', AutoQuoteState.RECEIVED),
            where('softDeleted', '==', false)
        );

        const snapshot = await getDocs(q);

        // Check if any received request is within cooldown window
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const receivedAt = data.receivedAt || data.updatedAt || data.createdAt;
            if (receivedAt && receivedAt > cooldownISO) {
                console.log(`⏭️ Recently received (${receivedAt}), skipping ${dedupKey}`);
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('❌ hasRecentlyReceivedRequest check failed:', error.message);
        // Don't block on error, let the main check handle it
        return false;
    }
}

/**
 * Acquire processing lock for a product
 * Prevents race conditions when multiple sources trigger the same product
 */
async function acquireProcessingLock(dedupKey) {
    const lockRef = doc(db, CONFIG.COLLECTION_DEDUP_LOCKS, dedupKey);
    const now = Date.now();

    try {
        const lockDoc = await getDoc(lockRef);

        if (lockDoc.exists()) {
            const lockData = lockDoc.data();
            // Check if lock is still valid
            if (lockData.expiresAt > now) {
                console.log(`🔒 Lock exists for ${dedupKey}`);
                return false;
            }
            // Lock expired, take over
            console.log(`🔓 Taking over expired lock: ${dedupKey}`);
        }

        // Acquire lock
        await setDoc(lockRef, {
            dedupKey,
            acquiredAt: now,
            expiresAt: now + CONFIG.LOCK_TTL_MS,
            acquiredBy: CONFIG.SYSTEM_USER_ID
        });

        return true;
    } catch (error) {
        console.warn(`⚠️ Lock acquisition failed for ${dedupKey}:`, error.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLIER HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get supplier by ID from Firestore or settings
 */
async function getSupplier(supplierId) {
    if (!supplierId) return null;

    try {
        // Try direct Firestore collection first
        const supplierRef = doc(db, CONFIG.COLLECTION_SUPPLIERS, supplierId);
        const supplierDoc = await getDoc(supplierRef);

        if (supplierDoc.exists()) {
            return { id: supplierDoc.id, ...supplierDoc.data() };
        }

        // Fallback: Try settings/suppliers (legacy format)
        const settingsRef = doc(db, 'settings', 'suppliers');
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            const suppliers = data.suppliers || [];
            const supplier = suppliers.find(s => String(s.id) === String(supplierId));
            if (supplier) return supplier;
        }

        return null;
    } catch (error) {
        console.error(`❌ Failed to get supplier ${supplierId}:`, error.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate current stock from product data
 */
function getCurrentStock(product) {
    // Support multiple stock field formats
    if (typeof product.currentStock === 'number') {
        return product.currentStock;
    }
    if (typeof product.stock === 'number') {
        return product.stock;
    }
    // Package-based calculation
    const packageQty = product.packageQuantity || 1;
    const packageCount = product.packageCount || 0;
    return packageQty * packageCount;
}

/**
 * Calculate quantity to order (restock to max)
 */
function getQuantityToOrder(product) {
    const current = getCurrentStock(product);
    const max = product.maxStock || (product.minStock || 0) * 3;
    return Math.max(0, max - current);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-QUOTE REQUEST CREATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new AutoQuoteRequest with all validations
 * Uses Firestore transaction for atomic duplicate check + creation
 */
async function createAutoQuoteRequest(product, supplier) {
    const dedupKey = generateDedupKey(product.id, supplier.id);

    console.log(`📋 Creating AutoQuoteRequest for ${product.name} from ${supplier.name}`);

    // GUARD 1: Acquire processing lock
    const hasLock = await acquireProcessingLock(dedupKey);
    if (!hasLock) {
        console.log(`⏭️ Could not acquire lock for ${dedupKey}`);
        return null;
    }

    // GUARD 1.5: Check for recently received request (prevents spam after delivery)
    const recentlyReceived = await hasRecentlyReceivedRequest(dedupKey);
    if (recentlyReceived) {
        console.log(`⏭️ Recently received, skipping ${product.name}`);
        return null;
    }


    try {
        // Use transaction for atomicity
        const result = await runTransaction(db, async (transaction) => {
            // GUARD 2: Check for existing active request
            const activeStates = [
                AutoQuoteState.PENDING,
                AutoQuoteState.AWAITING,
                AutoQuoteState.PROCESSING,
                AutoQuoteState.ORDERED
            ];

            const existingQuery = query(
                collection(db, CONFIG.COLLECTION_AUTO_QUOTE_REQUESTS),
                where('deduplicationKey', '==', dedupKey),
                where('status', 'in', activeStates)
            );

            // Note: getDocs doesn't work in transactions, use get on specific doc
            // We'll use the dedup key as document ID for uniqueness
            const existingRef = doc(db, CONFIG.COLLECTION_AUTO_QUOTE_REQUESTS, dedupKey);
            const existingDoc = await transaction.get(existingRef);

            if (existingDoc.exists()) {
                const existing = existingDoc.data();
                if (activeStates.includes(existing.status) && !existing.softDeleted) {
                    console.log(`⏭️ Active request already exists: ${existingDoc.id}`);
                    return { isDuplicate: true, existing: { id: existingDoc.id, ...existing } };
                }
            }

            // Create new request using state machine
            const machine = new AutoQuoteStateMachine({
                productId: product.id,
                productName: product.name,
                supplierId: supplier.id,
                supplierName: supplier.name,
                supplierEmail: supplier.email,
                requestedQuantity: getQuantityToOrder(product),
                currentStock: getCurrentStock(product),
                minStock: product.minStock || 0,
                unit: product.unit || 'un',
                createdBy: CONFIG.SYSTEM_USER_ID,
                createdByName: CONFIG.SYSTEM_USER_NAME
            });

            // Override deduplication key and ID
            machine.context.deduplicationKey = dedupKey;
            machine.context.id = `aq_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;

            const requestData = {
                ...machine.toJSON(),
                category: product.category || 'Outros',
                isAutoGenerated: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                syncedAt: serverTimestamp()
            };

            // Write to Firestore using dedupKey as document ID (ensures uniqueness)
            const requestRef = doc(db, CONFIG.COLLECTION_AUTO_QUOTE_REQUESTS, machine.context.id);
            transaction.set(requestRef, requestData);

            return { isDuplicate: false, request: requestData };
        });

        if (result.isDuplicate) {
            return result.existing;
        }

        // Create audit log
        await createAuditEntry({
            entityType: 'AutoQuoteRequest',
            entityId: result.request.id,
            action: 'CREATE',
            newState: {
                productName: product.name,
                supplierName: supplier.name,
                requestedQuantity: result.request.requestedQuantity,
                trigger: 'LOW_STOCK_DETECTED'
            },
            userId: CONFIG.SYSTEM_USER_ID,
            userName: CONFIG.SYSTEM_USER_NAME
        }).catch(err => console.warn('Audit log failed:', err.message));

        console.log(`✅ Created AutoQuoteRequest: ${result.request.id} [REQ-${result.request.requestId}]`);
        HapticService.trigger('notification');

        return result.request;

    } catch (error) {
        console.error(`❌ Failed to create AutoQuoteRequest for ${product.name}:`, error.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Queue a product for processing
 */
function queueProduct(product) {
    const supplierId = product.supplierId;
    if (!supplierId) {
        console.log(`⏭️ Product ${product.name} has no supplier`);
        return;
    }

    if (!pendingProducts.has(supplierId)) {
        pendingProducts.set(supplierId, []);
    }

    // Check if already queued
    const queue = pendingProducts.get(supplierId);
    if (!queue.some(p => p.id === product.id)) {
        queue.push(product);
        console.log(`📥 Queued ${product.name} for supplier ${supplierId}`);
    }

    // Reset debounce timer
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processQueuedProducts, CONFIG.DEBOUNCE_MS);
}

/**
 * Process all queued products
 */
async function processQueuedProducts() {
    if (pendingProducts.size === 0) return;

    console.log(`\n🚀 Processing ${pendingProducts.size} supplier group(s)...`);

    for (const [supplierId, products] of pendingProducts) {
        try {
            // Get supplier details
            const supplier = await getSupplier(supplierId);

            if (!supplier) {
                console.warn(`⚠️ Supplier ${supplierId} not found`);
                continue;
            }

            // GUARD: Check autoRequest flag
            if (supplier.autoRequest === false) {
                console.log(`⏭️ Supplier ${supplier.name} has autoRequest=false`);
                continue;
            }

            // GUARD: Check email
            if (!supplier.email) {
                console.warn(`⚠️ Supplier ${supplier.name} has no email`);
                continue;
            }

            // Process each product
            for (const product of products.slice(0, CONFIG.MAX_BATCH_SIZE)) {
                await createAutoQuoteRequest(product, supplier);
            }

        } catch (error) {
            console.error(`❌ Failed to process supplier ${supplierId}:`, error.message);
        }
    }

    // Clear queue
    pendingProducts.clear();
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY MONITORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if product needs reorder
 */
function needsReorder(product) {
    const currentStock = getCurrentStock(product);
    const minStock = product.minStock || 0;

    // Skip if no minStock defined
    if (minStock <= 0) return false;

    // Skip if auto-quotation explicitly disabled
    if (product.enableAutoQuotation === false) return false;

    // Trigger when current stock <= min stock
    return currentStock <= minStock;
}

/**
 * Handle inventory document change
 */
function handleInventoryChange(change) {
    const product = { id: change.doc.id, ...change.doc.data() };

    if (change.type === 'modified' || change.type === 'added') {
        if (needsReorder(product)) {
            console.log(`📉 Low stock detected: ${product.name} (${getCurrentStock(product)}/${product.minStock || 0})`);
            queueProduct(product);
        }
    }
}

/**
 * Run initial scan of all inventory
 */
async function runInitialScan() {
    console.log('📦 Running initial inventory scan...');

    try {
        // Try 'inventory' collection first (legacy)
        let snapshot = await getDocs(collection(db, 'inventory'));

        // If empty, try 'products' collection
        if (snapshot.empty) {
            snapshot = await getDocs(collection(db, CONFIG.COLLECTION_PRODUCTS));
        }

        let lowStockCount = 0;
        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            if (needsReorder(product)) {
                lowStockCount++;
                queueProduct(product);
            }
        });

        console.log(`✅ Initial scan complete: ${lowStockCount} products need reorder`);

    } catch (error) {
        console.error('❌ Initial scan failed:', error.message);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Start background stock monitoring
 */
export function startMonitoring() {
    if (isMonitoring) {
        console.warn('⚠️ BackgroundStockMonitor already running');
        return;
    }

    console.log('🚀 Starting BackgroundStockMonitor...');

    // Set up real-time listener on inventory
    try {
        const inventoryRef = collection(db, 'inventory');
        unsubscribeInventory = onSnapshot(inventoryRef, (snapshot) => {
            snapshot.docChanges().forEach(handleInventoryChange);
        }, (error) => {
            console.error('❌ Inventory listener error:', error.message);
        });

        isMonitoring = true;
        console.log('✅ BackgroundStockMonitor started');

        // Run initial scan after short delay
        setTimeout(runInitialScan, 2000);

    } catch (error) {
        console.error('❌ Failed to start BackgroundStockMonitor:', error.message);
    }
}

/**
 * Stop background monitoring
 */
export function stopMonitoring() {
    if (!isMonitoring) return;

    if (unsubscribeInventory) {
        unsubscribeInventory();
        unsubscribeInventory = null;
    }

    clearTimeout(debounceTimer);
    pendingProducts.clear();
    isMonitoring = false;

    console.log('✅ BackgroundStockMonitor stopped');
}

/**
 * Manually trigger check for a specific product
 */
export async function checkProduct(productId) {
    try {
        const productRef = doc(db, 'inventory', productId);
        const productDoc = await getDoc(productRef);

        if (!productDoc.exists()) {
            console.warn(`Product ${productId} not found`);
            return null;
        }

        const product = { id: productDoc.id, ...productDoc.data() };

        if (needsReorder(product)) {
            queueProduct(product);
            await processQueuedProducts();
        }

        return product;
    } catch (error) {
        console.error(`Failed to check product ${productId}:`, error.message);
        return null;
    }
}

/**
 * Get monitoring status
 */
export function getStatus() {
    return {
        isMonitoring,
        pendingCount: Array.from(pendingProducts.values()).reduce((sum, arr) => sum + arr.length, 0),
        supplierGroups: pendingProducts.size
    };
}

/**
 * Force process pending queue immediately
 */
export async function flushQueue() {
    clearTimeout(debounceTimer);
    await processQueuedProducts();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const BackgroundStockMonitor = {
    start: startMonitoring,
    stop: stopMonitoring,
    checkProduct,
    getStatus,
    flush: flushQueue,

    // Low-level access for testing
    _needsReorder: needsReorder,
    _getCurrentStock: getCurrentStock,
    _getQuantityToOrder: getQuantityToOrder
};

export default BackgroundStockMonitor;
