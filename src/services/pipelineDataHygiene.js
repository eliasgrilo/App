/**
 * Pipeline Data Hygiene - Atomic Integrity Enforcement
 * 
 * "LEI SUPREMA" DE UNICIDADE
 * 
 * Combines:
 * 1. Pre-INSERT duplicate checks
 * 2. One-time cleanup of existing duplicates
 * 3. UPSERT logic for graceful handling
 * 
 * @module services/pipelineDataHygiene
 * @created 2025-12-31
 */

import { db } from '../firebase';
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    writeBatch,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSITE KEY GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate composite key for order deduplication
 * Format: quotationId_supplierId
 */
export function generateOrderCompositeKey(quotationId, supplierId) {
    if (!quotationId || !supplierId) {
        return null;
    }
    return `order_${quotationId}_${supplierId}`.toLowerCase();
}

/**
 * Generate composite key for item-level deduplication
 * Format: quotationId_productId
 */
export function generateItemCompositeKey(quotationId, productId) {
    if (!quotationId || !productId) {
        return null;
    }
    return `item_${quotationId}_${productId}`.toLowerCase();
}

// ═══════════════════════════════════════════════════════════════════════════
// PRE-INSERT UNIQUENESS ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if an order already exists for the given quotation
 * MUST be called BEFORE any order INSERT operation
 * 
 * @param {string} quotationId - Quotation ID
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} { hasDuplicate: boolean, existingOrderId?: string }
 */
export async function enforceUniqueConstraint(quotationId, supplierId) {
    const compositeKey = generateOrderCompositeKey(quotationId, supplierId);

    console.log(`🔍 Checking uniqueness constraint: ${compositeKey}`);

    if (!compositeKey) {
        console.warn('⚠️ Invalid composite key - missing quotationId or supplierId');
        return { hasDuplicate: false, reason: 'invalid_key' };
    }

    try {
        // Check by quotationId first (most common lookup)
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('quotationId', '==', quotationId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const existingOrder = snapshot.docs[0];
            console.log(`🔒 DUPLICATE DETECTED: Order ${existingOrder.id} exists for quotation ${quotationId}`);
            return {
                hasDuplicate: true,
                existingOrderId: existingOrder.id,
                existingOrder: { id: existingOrder.id, ...existingOrder.data() }
            };
        }

        // Also check by deterministic order ID pattern
        const expectedOrderId = `order_${quotationId.replace('quot_', '').replace('aq_', '')}`;
        const directRef = doc(db, 'orders', expectedOrderId);
        const directSnap = await getDoc(directRef);

        if (directSnap.exists()) {
            console.log(`🔒 DUPLICATE DETECTED: Order ${expectedOrderId} exists (direct ID match)`);
            return {
                hasDuplicate: true,
                existingOrderId: expectedOrderId,
                existingOrder: { id: expectedOrderId, ...directSnap.data() }
            };
        }

        console.log(`✓ Uniqueness check passed: No existing order for ${quotationId}`);
        return { hasDuplicate: false };

    } catch (error) {
        console.error('❌ Uniqueness check failed:', error);
        // On error, return false to allow creation (Firestore transaction will catch true duplicates)
        return { hasDuplicate: false, error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DUPLICATE CLEANUP (ONE-TIME UTILITY)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Purge existing duplicate orders
 * Keeps the most recent order per quotationId, deletes others
 * 
 * @param {boolean} dryRun - If true, only logs without deleting
 * @returns {Promise<Object>} Cleanup results
 */
export async function purgeExistingDuplicates(dryRun = true) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🧹 DUPLICATE ORDER CLEANUP: ${dryRun ? 'DRY RUN (preview)' : 'LIVE MODE'}`);
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
            const quotationId = order.quotationId || order.sourceQuotationId;

            if (!quotationId) continue;

            if (!ordersByQuotation.has(quotationId)) {
                ordersByQuotation.set(quotationId, []);
            }
            ordersByQuotation.get(quotationId).push(order);
        }

        // Process duplicates
        const batch = writeBatch(db);
        let batchCount = 0;

        for (const [quotationId, orders] of ordersByQuotation) {
            if (orders.length <= 1) continue;

            // Sort by createdAt DESC (keep most recent)
            orders.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.confirmedAt || 0);
                const dateB = new Date(b.createdAt || b.confirmedAt || 0);
                return dateB - dateA;
            });

            const [keeper, ...duplicates] = orders;

            console.log(`\n📋 Quotation ${quotationId}:`);
            console.log(`   ✓ KEEPING: ${keeper.id} (${keeper.createdAt})`);

            for (const duplicate of duplicates) {
                results.duplicatesFound++;
                console.log(`   ✗ DUPLICATE: ${duplicate.id} (${duplicate.createdAt})`);

                results.details.push({
                    quotationId,
                    keptOrderId: keeper.id,
                    removedOrderId: duplicate.id,
                    action: dryRun ? 'would_remove' : 'removed'
                });

                if (!dryRun) {
                    batch.delete(doc(db, 'orders', duplicate.id));
                    batchCount++;

                    // Firestore batch limit is 500
                    if (batchCount >= 450) {
                        await batch.commit();
                        console.log(`   ⚡ Committed batch of ${batchCount} deletions`);
                        batchCount = 0;
                    }
                }
            }
        }

        // Commit remaining batch
        if (!dryRun && batchCount > 0) {
            await batch.commit();
            results.duplicatesRemoved = results.duplicatesFound;
            console.log(`   ⚡ Committed final batch of ${batchCount} deletions`);
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('📊 CLEANUP RESULTS:');
        console.log(`   Total Orders Scanned: ${results.totalOrders}`);
        console.log(`   Duplicates Found: ${results.duplicatesFound}`);
        console.log(`   Duplicates Removed: ${results.duplicatesRemoved}`);
        console.log('═══════════════════════════════════════════════════════════════');

        return results;

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        results.errors.push({ error: error.message });
        return results;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTATION DUPLICATE CLEANUP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Purge duplicate quotations (same supplier + items within 24h)
 * 
 * @param {boolean} dryRun - If true, only logs without deleting
 */
export async function purgeQuotationDuplicates(dryRun = true) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🧹 QUOTATION DUPLICATE CLEANUP: ${dryRun ? 'DRY RUN' : 'LIVE MODE'}`);
    console.log('═══════════════════════════════════════════════════════════════');

    const results = {
        totalQuotations: 0,
        duplicatesFound: 0,
        duplicatesRemoved: 0
    };

    try {
        const quotationsRef = collection(db, 'quotations');
        const snapshot = await getDocs(quotationsRef);
        results.totalQuotations = snapshot.docs.length;

        // Group by supplier + item fingerprint
        const grouped = new Map();

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const supplierId = data.supplierId || data.supplierEmail || 'unknown';
            const itemIds = (data.items || [])
                .map(i => i.productId || i.id || i.name)
                .filter(Boolean)
                .sort()
                .join('_');

            const key = `${supplierId}__${itemIds}`;

            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push({
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || 0)
            });
        });

        // Find and remove duplicates
        const batch = writeBatch(db);
        let batchCount = 0;

        for (const [key, quotations] of grouped) {
            if (quotations.length <= 1) continue;

            // Sort by createdAt DESC
            quotations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const [newest, ...duplicates] = quotations;
            const newestTime = new Date(newest.createdAt).getTime();

            for (const dup of duplicates) {
                const dupTime = new Date(dup.createdAt).getTime();
                const hoursDiff = (newestTime - dupTime) / (1000 * 60 * 60);

                // Only remove if within 24 hours (same request session)
                if (hoursDiff < 24) {
                    results.duplicatesFound++;
                    console.log(`   ✗ Duplicate: ${dup.id} (${hoursDiff.toFixed(1)}h older than ${newest.id})`);

                    if (!dryRun) {
                        batch.delete(doc(db, 'quotations', dup.id));
                        batchCount++;

                        if (batchCount >= 450) {
                            await batch.commit();
                            batchCount = 0;
                        }
                    }
                }
            }
        }

        if (!dryRun && batchCount > 0) {
            await batch.commit();
            results.duplicatesRemoved = results.duplicatesFound;
        }

        console.log(`📊 Quotation Cleanup: ${results.duplicatesFound} duplicates ${dryRun ? 'found' : 'removed'}`);
        return results;

    } catch (error) {
        console.error('❌ Quotation cleanup failed:', error);
        return { ...results, error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL HYGIENE SWEEP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run complete data hygiene sweep
 * Cleans both orders and quotations
 * 
 * @param {boolean} dryRun - If true, only previews changes
 */
export async function runFullHygiene(dryRun = true) {
    console.log('\n🚀 RUNNING FULL PIPELINE DATA HYGIENE');
    console.log(`   Mode: ${dryRun ? 'PREVIEW (no changes)' : 'LIVE (will modify data)'}\n`);

    const orderResults = await purgeExistingDuplicates(dryRun);
    const quotationResults = await purgeQuotationDuplicates(dryRun);

    const summary = {
        orders: orderResults,
        quotations: quotationResults,
        timestamp: new Date().toISOString(),
        mode: dryRun ? 'preview' : 'live'
    };

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 FULL HYGIENE SUMMARY:');
    console.log(`   Order duplicates: ${orderResults.duplicatesFound}`);
    console.log(`   Quotation duplicates: ${quotationResults.duplicatesFound}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    return summary;
}

// ═══════════════════════════════════════════════════════════════════════════
// WINDOW EXPOSURE FOR DEBUGGING
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.PipelineHygiene = {
        preview: () => runFullHygiene(true),
        execute: () => runFullHygiene(false),
        previewOrders: () => purgeExistingDuplicates(true),
        executeOrders: () => purgeExistingDuplicates(false),
        previewQuotations: () => purgeQuotationDuplicates(true),
        executeQuotations: () => purgeQuotationDuplicates(false),
        checkUnique: enforceUniqueConstraint
    };

    console.log('🔧 PipelineHygiene exposed to window:');
    console.log('   - window.PipelineHygiene.preview() - Preview all cleanups');
    console.log('   - window.PipelineHygiene.execute() - Run all cleanups');
    console.log('   - window.PipelineHygiene.checkUnique(quotationId, supplierId)');
}

export default {
    enforceUniqueConstraint,
    purgeExistingDuplicates,
    purgeQuotationDuplicates,
    runFullHygiene,
    generateOrderCompositeKey,
    generateItemCompositeKey
};
