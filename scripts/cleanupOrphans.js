/**
 * Orphan Cleanup Script
 * 
 * Identifies and purges orphaned child records that have no parent.
 * Run with: node scripts/cleanupOrphans.js [--execute]
 * 
 * By default runs in DRY RUN mode (safe preview).
 * Add --execute flag to actually delete orphans.
 */

const admin = require('firebase-admin');

// Initialize with default credentials (use service account in production)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Parent-child relationships to check
const RELATIONSHIPS = [
    { child: 'quotationItems', parentField: 'quotationId', parent: 'quotations' },
    { child: 'productMovements', parentField: 'productId', parent: 'inventory' },
    { child: 'productNotes', parentField: 'productId', parent: 'inventory' },
    { child: 'recipeIngredients', parentField: 'recipeId', parent: 'recipes' },
    { child: 'recipeInstructions', parentField: 'recipeId', parent: 'recipes' },
    { child: 'purchaseOrderItems', parentField: 'purchaseOrderId', parent: 'purchaseOrders' }
];

async function findOrphans() {
    console.log('🔍 Scanning for orphaned records...\n');

    const orphans = {};
    let totalOrphans = 0;

    for (const rel of RELATIONSHIPS) {
        const { child, parentField, parent } = rel;
        orphans[child] = [];

        try {
            const childSnapshot = await db.collection(child).get();

            if (childSnapshot.empty) {
                console.log(`  ✓ ${child}: 0 records (empty collection)`);
                continue;
            }

            // Build set of parent IDs
            const parentSnapshot = await db.collection(parent).get();
            const parentIds = new Set(parentSnapshot.docs.map(doc => doc.id));

            // Check each child record
            for (const childDoc of childSnapshot.docs) {
                const data = childDoc.data();
                const parentId = data[parentField];

                if (!parentId || !parentIds.has(parentId)) {
                    orphans[child].push({
                        id: childDoc.id,
                        parentId: parentId || 'MISSING',
                        parentCollection: parent,
                        data: {
                            ...data,
                            // Truncate large fields for logging
                            ...(data.content && { content: data.content.substring(0, 50) + '...' }),
                            ...(data.notes && { notes: data.notes.substring(0, 50) + '...' })
                        }
                    });
                    totalOrphans++;
                }
            }

            const orphanCount = orphans[child].length;
            if (orphanCount > 0) {
                console.log(`  ⚠️ ${child}: ${orphanCount} orphan(s) found (parent: ${parent})`);
            } else {
                console.log(`  ✓ ${child}: ${childSnapshot.size} records (all valid)`);
            }
        } catch (error) {
            console.error(`  ❌ ${child}: Error - ${error.message}`);
        }
    }

    console.log(`\n📊 Total orphaned records: ${totalOrphans}`);
    return { orphans, totalOrphans };
}

async function purgeOrphans(orphans, dryRun = true) {
    console.log(`\n${dryRun ? '🔒 DRY RUN' : '🗑️ EXECUTING'} - ${dryRun ? 'No changes will be made' : 'Deleting orphans...'}\n`);

    let deletedCount = 0;
    const batch = db.batch();
    const MAX_BATCH_SIZE = 500; // Firestore limit

    for (const [collection, items] of Object.entries(orphans)) {
        if (items.length === 0) continue;

        console.log(`\n  ${collection}:`);

        for (const item of items) {
            if (deletedCount >= MAX_BATCH_SIZE) {
                console.log(`\n  ⚠️ Batch limit reached. Run script again to continue.`);
                break;
            }

            const ref = db.collection(collection).doc(item.id);

            if (!dryRun) {
                batch.delete(ref);
            }

            console.log(`    ${dryRun ? '[WOULD DELETE]' : '[DELETING]'} ${item.id} (parent: ${item.parentId})`);
            deletedCount++;
        }
    }

    if (!dryRun && deletedCount > 0) {
        try {
            await batch.commit();
            console.log(`\n✅ Successfully deleted ${deletedCount} orphaned records.`);

            // Create audit log entry
            await db.collection('auditLogs').add({
                entityType: 'SYSTEM',
                entityId: 'ORPHAN_CLEANUP',
                action: 'PURGE',
                data: {
                    deletedCount,
                    collections: Object.keys(orphans).filter(k => orphans[k].length > 0),
                    timestamp: new Date().toISOString()
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                userId: 'SYSTEM',
                userName: 'Orphan Cleanup Script'
            });

            console.log('📝 Audit log created.');
        } catch (error) {
            console.error(`❌ Batch commit failed: ${error.message}`);
        }
    } else if (dryRun) {
        console.log(`\n📋 ${deletedCount} records would be deleted.`);
        console.log('   Run with --execute flag to perform actual deletion.');
    } else {
        console.log('\n✓ No orphans to delete.');
    }
}

// Also check for orphaned processedEmails older than TTL
async function cleanupExpiredIdempotencyRecords() {
    console.log('\n🧹 Cleaning up expired idempotency records...');

    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    try {
        const expiredSnapshot = await db.collection('processedEmails')
            .where('ttl', '<', cutoffDate)
            .limit(500)
            .get();

        if (expiredSnapshot.empty) {
            console.log('  ✓ No expired idempotency records found.');
            return;
        }

        const dryRun = !process.argv.includes('--execute');

        if (!dryRun) {
            const batch = db.batch();
            expiredSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`  ✅ Deleted ${expiredSnapshot.size} expired idempotency records.`);
        } else {
            console.log(`  📋 Would delete ${expiredSnapshot.size} expired records (dry run).`);
        }
    } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
    }
}

// Main execution
async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  PADOCA - ORPHAN CLEANUP SCRIPT');
    console.log('═══════════════════════════════════════════════════════\n');

    const dryRun = !process.argv.includes('--execute');

    if (dryRun) {
        console.log('ℹ️  Running in DRY RUN mode (safe preview).');
        console.log('   Add --execute flag to perform actual deletions.\n');
    } else {
        console.log('⚠️  EXECUTE MODE - This will delete orphaned records!\n');
    }

    const { orphans, totalOrphans } = await findOrphans();

    if (totalOrphans > 0) {
        await purgeOrphans(orphans, dryRun);
    }

    await cleanupExpiredIdempotencyRecords();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  CLEANUP COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
