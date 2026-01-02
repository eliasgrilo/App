/**
 * Cleanup Historical Data Script
 * 
 * Deletes ALL historical data from:
 * - quotations
 * - orders  
 * - auditLogs
 * - processedEmails
 * - quotationIdempotency
 * - emailIdempotency
 * 
 * RUN: node scripts/cleanupHistoricalData.js
 * 
 * WARNING: This is destructive and cannot be undone!
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp({
    credential: applicationDefault(),
    projectId: 'padoca-96688'
});

const db = getFirestore();

const COLLECTIONS_TO_CLEAR = [
    'quotations',
    'orders',
    'auditLogs',
    'processedEmails',
    'quotationIdempotency',
    'emailIdempotency'
];

async function deleteCollection(collectionPath, batchSize = 100) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    let totalDeleted = 0;

    while (true) {
        const snapshot = await query.get();

        if (snapshot.empty) {
            console.log(`✅ ${collectionPath}: ${totalDeleted} documentos deletados`);
            return totalDeleted;
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        totalDeleted += snapshot.size;

        console.log(`   ${collectionPath}: ${totalDeleted} deletados...`);
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🗑️  LIMPEZA DE DADOS HISTÓRICOS - Padoca Pizza');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!');
    console.log('');

    const startTime = Date.now();
    let totalDocuments = 0;

    for (const collection of COLLECTIONS_TO_CLEAR) {
        console.log(`📋 Limpando collection: ${collection}`);
        try {
            const deleted = await deleteCollection(collection);
            totalDocuments += deleted;
        } catch (error) {
            if (error.code === 5) { // NOT_FOUND
                console.log(`   ${collection}: Collection não existe (OK)`);
            } else {
                console.error(`❌ Erro ao limpar ${collection}:`, error.message);
            }
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ LIMPEZA CONCLUÍDA`);
    console.log(`   📊 Total: ${totalDocuments} documentos deletados`);
    console.log(`   ⏱️  Tempo: ${duration}s`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('💡 Próximos passos:');
    console.log('   1. Limpar localStorage no browser (DevTools > Application > Clear)');
    console.log('   2. Reiniciar o app');
    console.log('');

    process.exit(0);
}

main().catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
