/**
 * FIRESTORE DUPLICATE CLEANUP SCRIPT
 * 
 * Execute this script from browser console to permanently remove
 * duplicate quotations from Firestore.
 * 
 * Usage: Open browser DevTools and run:
 *   window.FirestoreCleanup.preview()   // Dry run - see what would be deleted
 *   window.FirestoreCleanup.execute()   // Actually delete duplicates
 */

import { db } from '../firebase';
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy
} from 'firebase/firestore';

/**
 * Generate composite key for duplicate detection
 */
function generateDuplicateKey(quotation) {
    const supplierId = quotation.supplierId || '';
    const supplierEmail = (quotation.supplierEmail || '').toLowerCase();
    const items = (quotation.items || [])
        .map(i => (i.productId || i.id || i.productName || '').toLowerCase())
        .filter(Boolean)
        .sort()
        .join(',');

    // Date-based grouping (same day = potential duplicate)
    const createdDate = quotation.createdAt
        ? new Date(quotation.createdAt.toDate ? quotation.createdAt.toDate() : quotation.createdAt).toISOString().split('T')[0]
        : '';

    return `${supplierId}_${supplierEmail}_${items}_${createdDate}`;
}

/**
 * Find and remove duplicate quotations from Firestore
 * @param {boolean} dryRun - If true, only logs without deleting
 */
async function cleanupDuplicateQuotations(dryRun = true) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🔥 FIRESTORE DUPLICATE CLEANUP: ${dryRun ? 'DRY RUN' : 'LIVE MODE'}`);
    console.log('═══════════════════════════════════════════════════════════════');

    const results = {
        totalQuotations: 0,
        duplicatesFound: 0,
        duplicatesDeleted: 0,
        errors: [],
        details: []
    };

    try {
        // Get all quotations ordered by creation date (newest first)
        const q = query(
            collection(db, 'quotations'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        results.totalQuotations = snapshot.docs.length;

        console.log(`📊 Found ${results.totalQuotations} quotations in Firestore`);

        // Group by composite key
        const seenKeys = new Map();
        const duplicates = [];

        for (const docSnap of snapshot.docs) {
            const data = { id: docSnap.id, ...docSnap.data() };
            const key = generateDuplicateKey(data);

            if (seenKeys.has(key)) {
                // This is a duplicate (older version since we sorted by newest first)
                duplicates.push({
                    id: docSnap.id,
                    key,
                    data,
                    keeperId: seenKeys.get(key).id
                });
            } else {
                seenKeys.set(key, data);
            }
        }

        results.duplicatesFound = duplicates.length;
        console.log(`\n🔍 Found ${duplicates.length} duplicates to remove`);

        // Process duplicates
        for (const duplicate of duplicates) {
            console.log(`\n   ✗ DUPLICATE: ${duplicate.id}`);
            console.log(`     Key: ${duplicate.key}`);
            console.log(`     Keeping: ${duplicate.keeperId}`);
            console.log(`     Supplier: ${duplicate.data.supplierName}`);

            results.details.push({
                deletedId: duplicate.id,
                keptId: duplicate.keeperId,
                supplier: duplicate.data.supplierName,
                key: duplicate.key
            });

            if (!dryRun) {
                try {
                    await deleteDoc(doc(db, 'quotations', duplicate.id));
                    results.duplicatesDeleted++;
                    console.log(`     🗑️ DELETED`);
                } catch (deleteError) {
                    results.errors.push({
                        id: duplicate.id,
                        error: deleteError.message
                    });
                    console.error(`     ❌ DELETE FAILED: ${deleteError.message}`);
                }
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('📊 CLEANUP RESULTS:');
        console.log(`   Total Quotations: ${results.totalQuotations}`);
        console.log(`   Duplicates Found: ${results.duplicatesFound}`);
        console.log(`   Duplicates Deleted: ${results.duplicatesDeleted}`);
        console.log(`   Errors: ${results.errors.length}`);
        console.log('═══════════════════════════════════════════════════════════════');

        return results;

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        results.errors.push({ error: error.message });
        return results;
    }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
    window.FirestoreCleanup = {
        preview: () => cleanupDuplicateQuotations(true),
        execute: () => cleanupDuplicateQuotations(false)
    };

    console.log('🔥 Firestore Cleanup available:');
    console.log('   - window.FirestoreCleanup.preview() - Preview duplicates');
    console.log('   - window.FirestoreCleanup.execute() - Delete duplicates');
}

export default cleanupDuplicateQuotations;
