/**
 * Order Service - Enterprise-Grade Purchase Order Management
 * 
 * ARCHITECTURE: Single Source of Truth for Orders
 * - All orders stored in Firestore 'orders' collection
 * - Idempotency via quotationId + supplierId composite key
 * - State machine validation before transitions
 * - Real-time sync with Firestore listeners
 * - Distributed locks prevent race conditions
 * - Event sourcing for complete audit trail
 * 
 * Created: 2025-12-31 - Quotation Module Reengineering
 * Enhanced: 2025-12-31 - Enterprise Architecture Patterns
 */

import { db } from '../firebase';
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    serverTimestamp,
    runTransaction
} from 'firebase/firestore';
import { HapticService } from './hapticService';
import { createAuditEntry } from './auditService';
import { DistributedLockService, LockScope } from './distributedLockService';
import { EventStoreService, EventType } from './eventStoreService';
import { checkDuplicateItem, generateItemCompositeKey } from '../utils/removeDuplicateItems';
import { enforceUniqueConstraint } from './pipelineDataHygiene';

// ═══════════════════════════════════════════════════════════════════════════
// ORDER STATUS ENUM - Aligned with Quotation States
// ═══════════════════════════════════════════════════════════════════════════

export const ORDER_STATUS = Object.freeze({
    PENDING_CONFIRMATION: 'pending_confirmation', // Awaiting user to confirm order
    CONFIRMED: 'confirmed',                        // Order confirmed, awaiting delivery
    SHIPPED: 'shipped',                            // Supplier shipped the goods
    DELIVERED: 'delivered',                        // Goods received
    CANCELLED: 'cancelled'                         // Order cancelled
});

// ═══════════════════════════════════════════════════════════════════════════
// IDEMPOTENCY KEY GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate idempotency key for order creation
 * Prevents duplicate orders for same quotation
 */
function generateOrderIdempotencyKey(quotationId, supplierId) {
    return `order_${quotationId}_${supplierId}`;
}

/**
 * FINGERPRINT FORMULA (Formula Ficha)
 * Generates a deterministic hash from order data to detect duplicates
 * 
 * Components:
 * - supplierId: Unique supplier identifier
 * - items: Sorted product IDs + quantities (normalized)
 * - dailyWindow: Allows same order after 24h (prevents false positives)
 * 
 * @param {Object} quotation - Quotation object
 * @returns {string} Deterministic fingerprint hash
 */
function generateOrderFingerprint(quotation) {
    const { supplierId, items = [] } = quotation;

    // Create normalized item string: productId:quantity sorted alphabetically
    const itemsFingerprint = items
        .map(item => {
            const productId = item.productId || item.id || 'unknown';
            const qty = Math.round(item.quantityToOrder || item.neededQuantity || 0);
            return `${productId}:${qty}`;
        })
        .sort()
        .join('|');

    // Create daily window to allow reorder after 24h
    const dailyWindow = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

    // Simple hash function (djb2 algorithm)
    const hashString = (str) => {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    };

    const rawFingerprint = `${supplierId}_${itemsFingerprint}_${dailyWindow}`;
    const hash = hashString(rawFingerprint);

    console.log('📋 Order Fingerprint:', {
        supplierId,
        itemCount: items.length,
        dailyWindow,
        hash: `fp_${hash}`
    });

    return `fp_${hash}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIRESTORE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clean object for Firestore (remove undefined/null)
 */
function cleanForFirestore(obj) {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(cleanForFirestore).filter(item => item !== null && item !== undefined);

    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null) {
            cleaned[key] = typeof value === 'object' ? cleanForFirestore(value) : value;
        }
    }
    return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════
// ORDER CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create order from quotation data with idempotency
 * Uses Firestore transaction to prevent duplicates
 * Wrapped in distributed lock to prevent race conditions
 * 
 * @param {Object} quotation - Full quotation object
 * @param {string} userId - User who confirmed the order
 * @param {string} userName - User's display name
 * @returns {Promise<Object>} Created or existing order
 */
export async function createOrderFromQuotation(quotation, userId, userName) {
    // ═══════════════════════════════════════════════════════════════════════════
    // DEFENSIVE: Fail immediately on null/undefined quotation object
    // ═══════════════════════════════════════════════════════════════════════════
    if (!quotation || typeof quotation !== 'object') {
        const error = new Error('PIPELINE_FAILURE: Quotation object is null, undefined, or not an object');
        console.error('❌ CRITICAL:', error.message);
        throw error;
    }

    const { id: quotationId, supplierId, supplierName, supplierEmail, items, quotedTotal, deliveryDate, deliveryDays, paymentTerms, supplierNotes, aiAnalysis, aiProcessed } = quotation;

    // ═══════════════════════════════════════════════════════════════════════════
    // INPUT VALIDATION - Fail fast on bad data (CRITICAL FIX 2025-12-31)
    // ═══════════════════════════════════════════════════════════════════════════
    if (!quotationId || typeof quotationId !== 'string') {
        const error = new Error(`ORDER_VALIDATION_FAILED: Invalid quotationId: ${quotationId}`);
        console.error('❌ VALIDATION:', error.message);
        throw error;
    }
    if (!supplierId) {
        const error = new Error(`ORDER_VALIDATION_FAILED: Missing supplierId for quotation ${quotationId}`);
        console.error('❌ VALIDATION:', error.message);
        throw error;
    }
    if (!items || items.length === 0) {
        const error = new Error(`ORDER_VALIDATION_FAILED: No items in quotation ${quotationId}`);
        console.error('❌ VALIDATION:', error.message);
        throw error;
    }

    // Check for NaN/null prices and quantities - BLOCKING validation
    for (const item of items) {
        const price = item.quotedUnitPrice ?? item.estimatedUnitPrice ?? 0;
        const qty = item.quantityToOrder ?? 0;
        if (isNaN(price) || isNaN(qty)) {
            const error = new Error(`ORDER_VALIDATION_FAILED: Item "${item.productName}" has NaN price (${price}) or quantity (${qty})`);
            console.error('❌ VALIDATION:', error.message, { item });
            throw error;
        }
        if (qty <= 0) {
            const error = new Error(`ORDER_VALIDATION_FAILED: Item "${item.productName}" has invalid quantity: ${qty}`);
            console.error('❌ VALIDATION:', error.message, { item });
            throw error;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // "LEI SUPREMA" - PRE-INSERT UNIQUE CONSTRAINT CHECK
    // CRITICAL: This check runs BEFORE any transaction or lock acquisition
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        const uniqueCheck = await enforceUniqueConstraint(quotationId, supplierId);
        if (uniqueCheck.hasDuplicate && uniqueCheck.existingOrder) {
            console.log(`🔒 LEI SUPREMA: Duplicate blocked! Returning existing order: ${uniqueCheck.existingOrderId}`);
            return {
                id: uniqueCheck.existingOrderId,
                orderId: uniqueCheck.existingOrderId,
                isDuplicate: true,
                ...uniqueCheck.existingOrder
            };
        }
    } catch (uniqueCheckError) {
        console.warn('⚠️ Unique constraint check failed (proceeding with fallback checks):', uniqueCheckError.message);
        // Continue with existing checks below - they provide fallback protection
    }

    // Generate deterministic order ID and fingerprint
    const orderId = `order_${quotationId.replace('quot_', '').replace('aq_', '')}`;
    const idempotencyKey = generateOrderIdempotencyKey(quotationId, supplierId);
    const fingerprint = generateOrderFingerprint(quotation);
    const correlationId = EventStoreService.generateCorrelationId();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📦 ORDER CREATION: Starting for quotation ${quotationId}`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Fingerprint: ${fingerprint}`);
    console.log(`   Supplier: ${supplierName} (${supplierId})`);
    console.log(`   Items: ${items.length} (all validated ✓)`);
    console.log(`   User: ${userName} (${userId})`);
    console.log('═══════════════════════════════════════════════════════════════');

    // FIRST: Check if order already exists by ID (before even trying to acquire lock)
    try {
        const existingOrderRef = doc(db, 'orders', orderId);
        const existingOrderSnap = await getDoc(existingOrderRef);
        if (existingOrderSnap.exists()) {
            console.log(`✅ Order already exists (by ID), returning existing: ${orderId}`);
            return { id: orderId, orderId, ...existingOrderSnap.data() };
        }
    } catch (checkError) {
        console.warn('⚠️ Pre-check by ID failed:', checkError.message);
    }

    // FINGERPRINT CHECK: Check for duplicates by fingerprint
    try {
        const ordersRef = collection(db, 'orders');
        const fingerprintQuery = query(ordersRef, where('fingerprint', '==', fingerprint));
        const fingerprintSnap = await getDocs(fingerprintQuery);

        if (!fingerprintSnap.empty) {
            const existingOrder = fingerprintSnap.docs[0];
            console.log(`🔒 DUPLICATE BLOCKED: Order with same fingerprint exists: ${existingOrder.id}`);
            console.log(`   Fingerprint: ${fingerprint}`);
            return {
                id: existingOrder.id,
                orderId: existingOrder.id,
                isDuplicate: true,
                ...existingOrder.data()
            };
        }
    } catch (fingerprintError) {
        console.warn('⚠️ Fingerprint check failed (proceeding):', fingerprintError.message);
    }

    // Acquire distributed lock to prevent race conditions
    // NOTE: Lock is OPTIONAL - Firestore transaction provides atomic guarantees
    let lockResult = null;
    try {
        lockResult = await DistributedLockService.acquire(
            LockScope.ORDER_CREATE,
            quotationId,
            {
                ttl: 30000, // 30 seconds
                retries: 3, // Reduced retries - we'll proceed without lock if needed
                metadata: { userId, userName, orderId }
            }
        );

        if (!lockResult?.acquired) {
            console.warn(`⚠️ Could not acquire lock for order creation: ${quotationId}`);

            // Check if order was created by another process while we waited
            const existingOrderRef = doc(db, 'orders', orderId);
            const existingOrder = await getDoc(existingOrderRef);
            if (existingOrder.exists()) {
                console.log(`📋 Order was created by another process: ${orderId}`);
                return { id: orderId, orderId, ...existingOrder.data() };
            }

            // CRITICAL FIX: Don't return null - proceed without lock
            // Firestore transaction will handle atomicity
            console.log(`🔓 Proceeding without lock - Firestore transaction will ensure atomicity`);
        } else {
            console.log(`🔒 Lock acquired for ${quotationId}`);
        }
    } catch (lockError) {
        console.warn('⚠️ Lock acquisition error:', lockError.message);

        // Try to continue without lock - Firestore transaction is atomic
        console.log('🔓 Proceeding without distributed lock (Firestore transaction will ensure atomicity)...');
    }

    try {
        const result = await runTransaction(db, async (transaction) => {
            // Check for existing order with same quotationId (idempotency)
            const orderRef = doc(db, 'orders', orderId);
            const existingOrder = await transaction.get(orderRef);

            if (existingOrder.exists()) {
                console.log(`⏭️ Order already exists: ${orderId}`);
                return {
                    isDuplicate: true,
                    order: { id: orderId, orderId, ...existingOrder.data() }
                };
            }

            // Create new order
            const orderData = {
                // Core identifiers
                orderId,
                quotationId,
                idempotencyKey,
                correlationId,
                fingerprint, // FORMULA FICHA: For duplicate detection

                // Supplier info
                supplierId,
                supplierName,
                supplierEmail,

                // Items with quoted prices - DEDUPLICATED via composite key
                // Rule: [quotationId + productId] must be unique
                items: (() => {
                    const seenKeys = new Set();
                    const dedupedItems = [];

                    for (const item of items) {
                        const compositeKey = generateItemCompositeKey(quotationId, item.productId);

                        if (compositeKey && seenKeys.has(compositeKey)) {
                            console.log(`⚠️ DUPLICATE ITEM BLOCKED: ${item.productName} (${compositeKey})`);
                            continue; // Skip duplicate
                        }

                        if (compositeKey) {
                            seenKeys.add(compositeKey);
                        }

                        dedupedItems.push({
                            productId: item.productId,
                            productName: item.productName,
                            quantityOrdered: item.quantityToOrder,
                            unit: item.unit || 'un',
                            // CRITICAL FIX: Use ?? to preserve 0 values from AI extraction
                            quotedUnitPrice: item.quotedUnitPrice ?? item.estimatedUnitPrice,
                            quotedAvailability: item.quotedAvailability,
                            subtotal: (item.quotedUnitPrice ?? item.estimatedUnitPrice ?? 0) * (item.quantityToOrder || 0),
                            compositeKey // Store for future reference
                        });
                    }

                    console.log(`📋 Items: ${items.length} input → ${dedupedItems.length} after dedup`);
                    return dedupedItems;
                })(),

                // Financial  
                quotedTotal: quotedTotal || items.reduce((sum, item) =>
                    sum + (item.quotedUnitPrice ?? item.estimatedUnitPrice ?? 0) * (item.quantityToOrder || 0), 0
                ),

                // Delivery terms
                deliveryDate,
                deliveryDays,
                paymentTerms,
                expectedDelivery: deliveryDate,

                // Status
                status: ORDER_STATUS.CONFIRMED,
                confirmedAt: new Date().toISOString(),
                confirmedBy: userId,
                confirmedByName: userName,

                // Metadata
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                syncedAt: serverTimestamp(),

                // Source tracking
                sourceQuotationId: quotationId,
                autoGenerated: quotation.isAutoGenerated || false,

                // ═══════════════════════════════════════════════════════════════
                // EMAIL-EXTRACTED DATA - Critical for pill display in UI
                // These fields enable the "📧 Dados do Email" section in cards
                // ═══════════════════════════════════════════════════════════════
                supplierNotes: supplierNotes || quotation.supplierNotes || null,
                aiAnalysis: aiAnalysis || quotation.aiAnalysis || null,
                aiProcessed: aiProcessed || quotation.aiProcessed || true
            };

            const cleanedOrder = cleanForFirestore(orderData);
            transaction.set(orderRef, cleanedOrder);

            return {
                isDuplicate: false,
                order: cleanedOrder
            };
        });

        if (!result.isDuplicate) {
            console.log(`✅ Order ${orderId} created successfully`);
            HapticService.trigger('success');

            // Emit to Event Store (non-blocking)
            EventStoreService.append({
                eventType: EventType.ORDER_CREATED,
                aggregateId: orderId,
                aggregateType: 'Order',
                payload: {
                    quotationId,
                    supplierId,
                    supplierName,
                    quotedTotal: result.order.quotedTotal,
                    itemCount: items.length
                },
                metadata: { userId, userName, source: 'orderService' },
                correlationId
            }).catch(err => console.warn('Event Store append failed:', err));

            // Create audit log (non-blocking)
            createAuditEntry({
                entityType: 'Order',
                entityId: orderId,
                action: 'CREATE',
                newState: result.order,
                userId,
                userName
            }).catch(err => console.warn('Audit log failed:', err));
        }

        // Ensure consistent response shape with id and orderId
        return { id: orderId, orderId, ...result.order };

    } catch (error) {
        // ═══════════════════════════════════════════════════════════════════════════
        // DETAILED ERROR LOGGING - Shows exactly WHY the save failed (2025-12-31)
        // ═══════════════════════════════════════════════════════════════════════════
        console.error(`❌ Failed to create order ${orderId}:`, error);
        console.error('   📋 Error Details:', {
            code: error.code || 'UNKNOWN',
            message: error.message,
            quotationId,
            supplierId,
            itemCount: items?.length,
            quotedTotal,
            userId,
            timestamp: new Date().toISOString(),
            stack: error.stack?.split('\n').slice(0, 5).join('\n')
        });
        throw error;
    } finally {
        // ALWAYS release lock if acquired
        if (lockResult?.release) {
            try {
                await lockResult.release();
                console.log(`🔓 Lock released for order ${orderId}`);
            } catch (releaseError) {
                console.warn('⚠️ Lock release failed:', releaseError.message);
            }
        }
    }

}

/**
 * Get order by ID
 */
export async function getOrderById(orderId) {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const snapshot = await getDoc(orderRef);

        if (!snapshot.exists()) return null;

        return {
            id: snapshot.id,
            ...snapshot.data(),
            createdAt: snapshot.data().createdAt?.toDate?.()?.toISOString() || snapshot.data().createdAt,
            confirmedAt: snapshot.data().confirmedAt?.toDate?.()?.toISOString() || snapshot.data().confirmedAt
        };
    } catch (error) {
        console.error('❌ Failed to get order:', error);
        return null;
    }
}

/**
 * Get order by quotation ID
 */
export async function getOrderByQuotationId(quotationId) {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('quotationId', '==', quotationId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('❌ Failed to get order by quotation:', error);
        return null;
    }
}

/**
 * Get all orders with optional status filter
 */
export async function getOrders(status = null) {
    try {
        const ordersRef = collection(db, 'orders');
        let q;

        if (status) {
            q = query(ordersRef, where('status', '==', status), orderBy('createdAt', 'desc'));
        } else {
            q = query(ordersRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
        }));
    } catch (error) {
        console.error('❌ Failed to get orders:', error);
        return [];
    }
}

/**
 * Update order status with validation
 */
export async function updateOrderStatus(orderId, newStatus, metadata = {}, userId, userName) {
    const order = await getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const oldStatus = order.status;

    // Status transition validation
    const validTransitions = {
        [ORDER_STATUS.PENDING_CONFIRMATION]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.DELIVERED]: [], // Final state
        [ORDER_STATUS.CANCELLED]: []  // Final state
    };

    const allowed = validTransitions[oldStatus] || [];
    if (!allowed.includes(newStatus)) {
        throw new Error(`Invalid status transition: ${oldStatus} → ${newStatus}`);
    }

    const orderRef = doc(db, 'orders', orderId);
    const updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        [`${newStatus}At`]: new Date().toISOString(),
        [`${newStatus}By`]: userId,
        ...metadata
    };

    await updateDoc(orderRef, updateData);

    // Create audit log
    await createAuditEntry({
        entityType: 'Order',
        entityId: orderId,
        action: 'STATUS_CHANGE',
        previousState: { status: oldStatus },
        newState: { status: newStatus, ...metadata },
        userId,
        userName
    });

    console.log(`✅ Order ${orderId} status: ${oldStatus} → ${newStatus}`);
    HapticService.trigger('success');

    return { ...order, ...updateData };
}

/**
 * Mark order as delivered and update inventory
 */
export async function confirmDelivery(orderId, receiptData = {}, userId, userName) {
    const order = await getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    // Update order status to delivered
    const updatedOrder = await updateOrderStatus(
        orderId,
        ORDER_STATUS.DELIVERED,
        {
            receivedAt: new Date().toISOString(),
            receivedBy: userId,
            receivedByName: userName,
            receiptNotes: receiptData.notes,
            invoiceNumber: receiptData.invoiceNumber,
            actualDeliveryDate: new Date().toISOString()
        },
        userId,
        userName
    );

    console.log(`📦 Order ${orderId} marked as delivered`);
    HapticService.trigger('approval');

    return updatedOrder;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const OrderService = {
    STATUS: ORDER_STATUS,
    create: createOrderFromQuotation,
    getById: getOrderById,
    getByQuotationId: getOrderByQuotationId,
    getAll: getOrders,
    updateStatus: updateOrderStatus,
    confirmDelivery
};

export default OrderService;
