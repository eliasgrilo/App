/**
 * Duplicate Item Cleanup Utility
 * 
 * "LEI SUPREMA" DE UNICIDADE
 * 
 * Purges duplicate items based on composite key:
 * - [quotationId + productId/SKU] OR
 * - [supplierId + externalReference]
 * 
 * Rules:
 * - Before any INSERT, CHECK if item exists
 * - If exists: UPDATE (quantity/price)
 * - If new: INSERT
 * 
 * @module utils/removeDuplicateItems
 */

import { db } from '../firebase';
import {
    collection,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
    query,
    where,
    updateDoc
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSITE KEY GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate composite key for duplicate detection
 * Format: quotationId_productId
 */
export function generateItemCompositeKey(quotationId, productId) {
    if (!quotationId || !productId) {
        return null;
    }
    return `${quotationId}_${productId}`.toLowerCase();
}

/**
 * Generate supplier composite key
 * Format: supplierId_externalReference
 */
export function generateSupplierCompositeKey(supplierId, externalReference) {
    if (!supplierId || !externalReference) {
        return null;
    }
    return `${supplierId}_${externalReference}`.toLowerCase();
}

// ═══════════════════════════════════════════════════════════════════════════
// DUPLICATE CHECK (BEFORE INSERT)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if an item already exists in an order
 * @param {string} quotationId - Quotation ID
 * @param {string} productId - Product/SKU ID
 * @returns {Promise<Object|null>} Existing item or null
 */
export async function checkDuplicateItem(quotationId, productId) {
    const compositeKey = generateItemCompositeKey(quotationId, productId);
    if (!compositeKey) {
        return null;
    }

    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('quotationId', '==', quotationId));
        const snapshot = await getDocs(q);

        for (const orderDoc of snapshot.docs) {
            const orderData = orderDoc.data();
            const existingItem = orderData.items?.find(item =>
                item.productId === productId || item.id === productId
            );

            if (existingItem) {
                console.log(`🔍 Duplicate found: ${compositeKey} in order ${orderDoc.id}`);
                return {
                    orderId: orderDoc.id,
                    item: existingItem,
                    compositeKey
                };
            }
        }

        return null;
    } catch (error) {
        console.error('❌ Duplicate check failed:', error);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP: REMOVE EXISTING DUPLICATES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Scan all orders and remove duplicate items
 * Keeps the most recent entry based on createdAt/updatedAt
 * 
 * @param {boolean} dryRun - If true, only logs without deleting
 * @returns {Promise<Object>} Cleanup results
 */
export async function removeDuplicateItems(dryRun = true) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🧹 DUPLICATE CLEANUP: ${dryRun ? 'DRY RUN' : 'LIVE MODE'}`);
    console.log('═══════════════════════════════════════════════════════════════');

    const results = {
        totalOrders: 0,
        duplicatesFound: 0,
        duplicatesRemoved: 0,
        errors: [],
        details: []
    };

    try {
        const ordersRef = collection(db, 'orders');
        const snapshot = await getDocs(ordersRef);
        results.totalOrders = snapshot.docs.length;

        // Group orders by quotationId
        const ordersByQuotation = new Map();

        for (const orderDoc of snapshot.docs) {
            const order = { id: orderDoc.id, ...orderDoc.data() };
            const quotationId = order.quotationId;

            if (!quotationId) continue;

            if (!ordersByQuotation.has(quotationId)) {
                ordersByQuotation.set(quotationId, []);
            }
            ordersByQuotation.get(quotationId).push(order);
        }

        // Find and handle duplicates
        for (const [quotationId, orders] of ordersByQuotation) {
            if (orders.length <= 1) continue;

            // Sort by createdAt DESC (keep most recent)
            orders.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.confirmedAt || 0);
                const dateB = new Date(b.createdAt || b.confirmedAt || 0);
                return dateB - dateA; // DESC
            });

            const [keeper, ...duplicates] = orders;

            console.log(`\n📋 Quotation ${quotationId}:`);
            console.log(`   ✓ KEEPING: ${keeper.id} (created: ${keeper.createdAt})`);

            for (const duplicate of duplicates) {
                results.duplicatesFound++;
                console.log(`   ✗ DUPLICATE: ${duplicate.id} (created: ${duplicate.createdAt})`);

                results.details.push({
                    quotationId,
                    keptOrderId: keeper.id,
                    removedOrderId: duplicate.id,
                    removedAt: new Date().toISOString()
                });

                if (!dryRun) {
                    try {
                        await deleteDoc(doc(db, 'orders', duplicate.id));
                        results.duplicatesRemoved++;
                        console.log(`   🗑️ DELETED: ${duplicate.id}`);
                    } catch (deleteError) {
                        results.errors.push({
                            orderId: duplicate.id,
                            error: deleteError.message
                        });
                        console.error(`   ❌ DELETE FAILED: ${deleteError.message}`);
                    }
                }
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('📊 CLEANUP RESULTS:');
        console.log(`   Total Orders Scanned: ${results.totalOrders}`);
        console.log(`   Duplicates Found: ${results.duplicatesFound}`);
        console.log(`   Duplicates Removed: ${results.duplicatesRemoved}`);
        console.log(`   Errors: ${results.errors.length}`);
        console.log('═══════════════════════════════════════════════════════════════');

        return results;

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        results.errors.push({ error: error.message });
        return results;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// UPSERT LOGIC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * UPSERT item into order
 * - If item exists: UPDATE quantity/price
 * - If item is new: INSERT
 * 
 * @param {string} orderId - Order ID
 * @param {Object} newItem - Item to upsert
 * @returns {Promise<Object>} Result with action taken
 */
export async function upsertOrderItem(orderId, newItem) {
    const { productId, quantityOrdered, quotedUnitPrice } = newItem;

    if (!orderId || !productId) {
        throw new Error('UPSERT_FAILED: Missing orderId or productId');
    }

    try {
        const orderRef = doc(db, 'orders', orderId);
        // BUG #1 FIX: Usar getDoc direto em vez de getDocs com query
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            throw new Error(`UPSERT_FAILED: Order ${orderId} not found`);
        }

        const orderData = orderSnap.data();
        const existingItems = orderData.items || [];

        const existingIndex = existingItems.findIndex(item =>
            item.productId === productId || item.id === productId
        );

        let action;
        let updatedItems;

        if (existingIndex >= 0) {
            // UPDATE existing item
            action = 'UPDATE';
            updatedItems = [...existingItems];
            updatedItems[existingIndex] = {
                ...updatedItems[existingIndex],
                quantityOrdered: quantityOrdered || updatedItems[existingIndex].quantityOrdered,
                quotedUnitPrice: quotedUnitPrice ?? updatedItems[existingIndex].quotedUnitPrice,
                updatedAt: new Date().toISOString()
            };
            console.log(`🔄 UPSERT UPDATE: Item ${productId} in order ${orderId}`);
        } else {
            // INSERT new item
            action = 'INSERT';
            updatedItems = [...existingItems, {
                ...newItem,
                createdAt: new Date().toISOString()
            }];
            console.log(`➕ UPSERT INSERT: Item ${productId} in order ${orderId}`);
        }

        // BUG #12 FIX: Usar updateDoc direto (batch era overhead desnecessário para operação única)
        await updateDoc(orderRef, {
            items: updatedItems,
            updatedAt: new Date().toISOString()
        });

        return {
            success: true,
            action,
            productId,
            orderId
        };

    } catch (error) {
        console.error('❌ UPSERT failed:', error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP: REMOVE DUPLICATE AUTO-QUOTE REQUESTS (USER BUG FIX)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Scan all AutoQuoteRequests and remove duplicates based on:
 * - Same product_id + supplier_id in RECEIVED status
 * - Keeps the oldest entry (first received)
 * 
 * @param {boolean} dryRun - If true, only logs without deleting
 * @returns {Promise<Object>} Cleanup results
 */
export async function removeDuplicateAutoQuoteRequests(dryRun = true) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🧹 AUTO-QUOTE DUPLICATE CLEANUP: ${dryRun ? 'DRY RUN' : 'LIVE MODE'}`);
    console.log('═══════════════════════════════════════════════════════════════');

    const results = {
        totalRequests: 0,
        duplicatesFound: 0,
        duplicatesSoftDeleted: 0,
        errors: [],
        details: []
    };

    try {
        const requestsRef = collection(db, 'autoQuoteRequests');
        const snapshot = await getDocs(requestsRef);
        results.totalRequests = snapshot.docs.length;

        // Group by product_id + supplier_id for RECEIVED status
        const receivedByKey = new Map();
        const allByKey = new Map();

        for (const docSnap of snapshot.docs) {
            const request = { id: docSnap.id, ...docSnap.data() };

            // Skip already soft-deleted
            if (request.softDeleted) continue;

            const productId = request.product_id || request.productId;
            const supplierId = request.supplier_id || request.supplierId;

            if (!productId || !supplierId) continue;

            const key = `${productId}:${supplierId}`;

            // Track all requests by key
            if (!allByKey.has(key)) {
                allByKey.set(key, []);
            }
            allByKey.get(key).push(request);

            // Specifically track RECEIVED status
            if (request.status === 'RECEIVED' || request.status === 'received') {
                if (!receivedByKey.has(key)) {
                    receivedByKey.set(key, []);
                }
                receivedByKey.get(key).push(request);
            }
        }

        // Find and handle duplicates in RECEIVED status
        console.log('\n📋 RECEIVED STATUS DUPLICATES:');
        for (const [key, requests] of receivedByKey) {
            if (requests.length <= 1) continue;

            // Sort by receivedAt/createdAt ASC (keep oldest)
            requests.sort((a, b) => {
                const dateA = new Date(a.receivedAt || a.createdAt || 0);
                const dateB = new Date(b.receivedAt || b.createdAt || 0);
                return dateA - dateB; // ASC (oldest first)
            });

            const [keeper, ...duplicates] = requests;

            console.log(`\n   🔑 Key: ${key}`);
            console.log(`   ✓ KEEPING: ${keeper.id} (received: ${keeper.receivedAt || keeper.createdAt})`);

            for (const duplicate of duplicates) {
                results.duplicatesFound++;
                console.log(`   ✗ DUPLICATE: ${duplicate.id} (received: ${duplicate.receivedAt || duplicate.createdAt})`);

                results.details.push({
                    key,
                    keptRequestId: keeper.id,
                    removedRequestId: duplicate.id,
                    removedAt: new Date().toISOString(),
                    reason: 'DUPLICATE_RECEIVED_STATUS'
                });

                if (!dryRun) {
                    try {
                        const updateRef = doc(db, 'autoQuoteRequests', duplicate.id);
                        // BUG #5 FIX: Usar updateDoc já importado (era dynamic import dentro de loop)
                        await updateDoc(updateRef, {
                            softDeleted: true,
                            deletedAt: new Date().toISOString(),
                            deletedReason: 'Duplicate cleanup - kept oldest received record'
                        });
                        results.duplicatesSoftDeleted++;
                        console.log(`   🗑️ SOFT DELETED: ${duplicate.id}`);
                    } catch (deleteError) {
                        results.errors.push({
                            requestId: duplicate.id,
                            error: deleteError.message
                        });
                        console.error(`   ❌ DELETE FAILED: ${deleteError.message}`);
                    }
                }
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('📊 AUTO-QUOTE CLEANUP RESULTS:');
        console.log(`   Total Requests Scanned: ${results.totalRequests}`);
        console.log(`   Duplicates Found: ${results.duplicatesFound}`);
        console.log(`   Duplicates Soft-Deleted: ${results.duplicatesSoftDeleted}`);
        console.log(`   Errors: ${results.errors.length}`);
        console.log('═══════════════════════════════════════════════════════════════');

        return results;

    } catch (error) {
        console.error('❌ Auto-quote cleanup failed:', error);
        results.errors.push({ error: error.message });
        return results;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// WINDOW EXPOSURE FOR DEBUGGING
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.DuplicateCleanup = {
        // Order duplicates
        preview: () => removeDuplicateItems(true),   // Dry run
        execute: () => removeDuplicateItems(false),  // Live mode
        checkItem: checkDuplicateItem,
        upsert: upsertOrderItem,

        // AutoQuoteRequest duplicates (NEW - fixes RECEIVED status duplicates)
        previewAutoQuotes: () => removeDuplicateAutoQuoteRequests(true),   // Dry run
        executeAutoQuotes: () => removeDuplicateAutoQuoteRequests(false),  // Live mode
    };

    console.log('🧹 Duplicate Cleanup available:');
    console.log('   - window.DuplicateCleanup.preview() - Preview order duplicates');
    console.log('   - window.DuplicateCleanup.execute() - Remove order duplicates');
    console.log('   - window.DuplicateCleanup.previewAutoQuotes() - Preview auto-quote duplicates');
    console.log('   - window.DuplicateCleanup.executeAutoQuotes() - Remove auto-quote duplicates');
    console.log('   - window.DuplicateCleanup.checkItem(quotationId, productId) - Check specific item');
}

export default {
    generateItemCompositeKey,
    generateSupplierCompositeKey,
    checkDuplicateItem,
    removeDuplicateItems,
    removeDuplicateAutoQuoteRequests,
    upsertOrderItem
};
