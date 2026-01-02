#!/usr/bin/env node
/**
 * Cleanup Script - Delete All Quotation and Order Historical Data
 * 
 * This script clears:
 * - All quotations from Firestore
 * - All orders from Firestore
 * - All processed email records
 * - All idempotency keys
 * - All audit logs related to quotations
 * 
 * Run with: node scripts/cleanup-quotation-data.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'functions', 'serviceAccountKey.json');

try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    // Fallback: use application default credentials
    console.log('⚠️ Service account not found, using default credentials...');
    admin.initializeApp();
}

const db = admin.firestore();

// Collections to clean
const COLLECTIONS_TO_DELETE = [
    'quotations',
    'orders',
    'processedEmails',
    'quotationIdempotency',
    'emailIdempotency',
    'quotationLocks'
];

// Audit logs to selectively clean (quotation-related only)
const AUDIT_ENTITY_TYPES = ['quotation', 'order'];

async function deleteCollection(collectionName) {
    console.log(`\n🗑️  Deleting collection: ${collectionName}`);

    try {
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
            console.log(`   ✓ Collection ${collectionName} is already empty`);
            return { collection: collectionName, deleted: 0 };
        }

        const batchSize = 500; // Firestore batch limit
        let totalDeleted = 0;

        // Process in batches
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = db.batch();
            const batchDocs = docs.slice(i, i + batchSize);

            batchDocs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            totalDeleted += batchDocs.length;
            console.log(`   → Deleted ${totalDeleted}/${docs.length} documents`);
        }

        console.log(`   ✓ Deleted ${totalDeleted} documents from ${collectionName}`);
        return { collection: collectionName, deleted: totalDeleted };

    } catch (error) {
        console.error(`   ✗ Error deleting ${collectionName}:`, error.message);
        return { collection: collectionName, deleted: 0, error: error.message };
    }
}

async function deleteQuotationAuditLogs() {
    console.log('\n🗑️  Deleting quotation-related audit logs');

    try {
        let totalDeleted = 0;

        for (const entityType of AUDIT_ENTITY_TYPES) {
            const snapshot = await db.collection('auditLogs')
                .where('entityType', '==', entityType)
                .get();

            if (snapshot.empty) continue;

            const batchSize = 500;
            const docs = snapshot.docs;

            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = db.batch();
                const batchDocs = docs.slice(i, i + batchSize);

                batchDocs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                await batch.commit();
                totalDeleted += batchDocs.length;
            }

            console.log(`   → Deleted ${snapshot.size} ${entityType} audit logs`);
        }

        console.log(`   ✓ Total audit logs deleted: ${totalDeleted}`);
        return { collection: 'auditLogs (quotation-related)', deleted: totalDeleted };

    } catch (error) {
        console.error('   ✗ Error deleting audit logs:', error.message);
        return { collection: 'auditLogs', deleted: 0, error: error.message };
    }
}

async function deleteGmailConfig() {
    console.log('\n🗑️  Resetting Gmail history tracking');

    try {
        // Reset lastHistoryId to force re-processing
        await db.collection('gmailConfig').doc('watchConfig').update({
            lastHistoryId: null,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('   ✓ Gmail history tracking reset');
        return { success: true };

    } catch (error) {
        console.error('   ✗ Error resetting Gmail config:', error.message);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  🧹 QUOTATION DATA CLEANUP SCRIPT');
    console.log('  ⚠️  WARNING: This will permanently delete all quotation');
    console.log('     and order data from Firestore!');
    console.log('═══════════════════════════════════════════════════════════════');

    const startTime = Date.now();
    const results = [];

    // Delete each collection
    for (const collection of COLLECTIONS_TO_DELETE) {
        const result = await deleteCollection(collection);
        results.push(result);
    }

    // Delete quotation-related audit logs
    const auditResult = await deleteQuotationAuditLogs();
    results.push(auditResult);

    // Reset Gmail config
    await deleteGmailConfig();

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalDeleted = results.reduce((sum, r) => sum + (r.deleted || 0), 0);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ✅ CLEANUP COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total documents deleted: ${totalDeleted}`);
    console.log(`  Time elapsed: ${elapsed}s`);
    console.log('');
    console.log('  Next steps:');
    console.log('  1. Clear localStorage in browser: localStorage.clear()');
    console.log('  2. Refresh the app');
    console.log('  3. Orders tab should now be empty');
    console.log('═══════════════════════════════════════════════════════════════');

    process.exit(0);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
