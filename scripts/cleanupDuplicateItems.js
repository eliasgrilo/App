#!/usr/bin/env node
/**
 * DUPLICATE QUOTATION ITEM SANITIZATION SCRIPT
 * 
 * THE UNIQUE PROTOCOL - Layer 3: Cleanup
 * 
 * Scans all QuotationItems and merges duplicates:
 * - Groups by (quotationId, productId)
 * - Sums quantities
 * - Deletes excess rows
 * 
 * CRITICAL: Run this BEFORE deploying the UNIQUE constraint in schema.gql
 * 
 * Usage:
 *   node scripts/cleanupDuplicateItems.js          # Dry run (preview)
 *   node scripts/cleanupDuplicateItems.js --live   # Execute changes
 * 
 * @module cleanupDuplicateItems
 * @created 2025-12-31
 */

const admin = require('firebase-admin');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DRY_RUN = !process.argv.includes('--live');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'functions', 'serviceAccountKey.json');

try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    console.log('⚠️ Service account not found, using default credentials...');
    admin.initializeApp();
}

const db = admin.firestore();

// ═══════════════════════════════════════════════════════════════════════════
// METRICS
// ═══════════════════════════════════════════════════════════════════════════

const metrics = {
    totalItemsScanned: 0,
    duplicateGroupsFound: 0,
    itemsMerged: 0,
    itemsDeleted: 0,
    errors: []
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CLEANUP FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function cleanupDuplicateQuotationItems() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  🧹 DUPLICATE QUOTATION ITEM SANITIZATION');
    console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN (preview only)' : '🔴 LIVE (will modify data)'}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    const startTime = Date.now();

    try {
        // Step 1: Fetch all quotation items
        console.log('📋 Step 1: Fetching all quotation items...');
        const itemsSnapshot = await db.collection('quotationItems').get();

        if (itemsSnapshot.empty) {
            console.log('   ✓ No quotation items found. Nothing to clean.\n');
            return metrics;
        }

        metrics.totalItemsScanned = itemsSnapshot.size;
        console.log(`   Found ${metrics.totalItemsScanned} quotation items\n`);

        // Step 2: Group by quotationId + productId
        console.log('📋 Step 2: Grouping by quotation + product...');
        const groups = new Map();

        itemsSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const quotationId = data.quotationId || data.quotation?.id || 'unknown';
            const productId = data.productId || data.product?.id || 'unknown';
            const groupKey = `${quotationId}__${productId}`;

            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push({
                id: docSnap.id,
                quotationId,
                productId,
                requestedQuantity: data.requestedQuantity || 0,
                quotedPrice: data.quotedPrice,
                quotedQuantity: data.quotedQuantity,
                notes: data.notes,
                createdAt: data.createdAt
            });
        });

        console.log(`   Found ${groups.size} unique (quotation, product) combinations\n`);

        // Step 3: Find duplicates
        console.log('📋 Step 3: Identifying duplicates...');
        const duplicateGroups = [];

        groups.forEach((items, groupKey) => {
            if (items.length > 1) {
                duplicateGroups.push({
                    groupKey,
                    items: items.sort((a, b) => {
                        // Sort by createdAt - keep oldest (first created)
                        const dateA = toDate(a.createdAt);
                        const dateB = toDate(b.createdAt);
                        return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
                    })
                });
            }
        });

        metrics.duplicateGroupsFound = duplicateGroups.length;

        if (duplicateGroups.length === 0) {
            console.log('   ✓ No duplicates found! Database is clean.\n');
            return metrics;
        }

        console.log(`   ⚠️ Found ${duplicateGroups.length} groups with duplicates\n`);

        // Step 4: Merge duplicates
        console.log('📋 Step 4: Merging duplicates...');

        for (const group of duplicateGroups) {
            const [primary, ...duplicates] = group.items;

            // Calculate total quantity
            const totalQuantity = group.items.reduce((sum, item) => sum + (item.requestedQuantity || 0), 0);

            // Gather notes from all duplicates
            const allNotes = group.items
                .filter(item => item.notes)
                .map(item => item.notes)
                .join(' | ');

            console.log(`\n   Group: ${group.groupKey}`);
            console.log(`   → Primary: ${primary.id} (qty: ${primary.requestedQuantity})`);
            console.log(`   → Duplicates: ${duplicates.length} items`);
            console.log(`   → Merged quantity: ${totalQuantity}`);

            if (!DRY_RUN) {
                // Update primary item with merged data
                await db.collection('quotationItems').doc(primary.id).update({
                    requestedQuantity: totalQuantity,
                    notes: allNotes || primary.notes,
                    _mergedAt: new Date().toISOString(),
                    _mergedFrom: duplicates.map(d => d.id)
                });
                metrics.itemsMerged++;

                // Delete duplicate items
                const batch = db.batch();
                for (const dupe of duplicates) {
                    batch.delete(db.collection('quotationItems').doc(dupe.id));
                    metrics.itemsDeleted++;
                }
                await batch.commit();

                console.log(`   ✓ Merged into ${primary.id}, deleted ${duplicates.length} duplicates`);
            } else {
                console.log(`   [DRY RUN] Would merge into ${primary.id}, delete ${duplicates.length} duplicates`);
                metrics.itemsMerged++;
                metrics.itemsDeleted += duplicates.length;
            }
        }

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        metrics.errors.push(error.message);
    }

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ✅ CLEANUP COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total items scanned:    ${metrics.totalItemsScanned}`);
    console.log(`  Duplicate groups:       ${metrics.duplicateGroupsFound}`);
    console.log(`  Items merged:           ${metrics.itemsMerged}`);
    console.log(`  Items deleted:          ${metrics.itemsDeleted}`);
    console.log(`  Time elapsed:           ${elapsed}s`);

    if (DRY_RUN) {
        console.log('\n  ⚠️ This was a DRY RUN. No changes were made.');
        console.log('  To execute changes, run: node scripts/cleanupDuplicateItems.js --live');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    return metrics;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value.toDate) return value.toDate(); // Firestore Timestamp
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'number') return new Date(value);
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

cleanupDuplicateQuotationItems()
    .then(metrics => {
        if (metrics.errors.length > 0) {
            console.error('Errors occurred:', metrics.errors);
            process.exit(1);
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
