/**
 * Clear Quotation Data Script
 * 
 * Clears all quotation-related data from Firestore for a fresh start.
 * Run with: node scripts/clearQuotationData.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase config (same as in the app)
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'padoca-96688',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(collectionName) {
    console.log(`🗑️ Clearing ${collectionName}...`);
    try {
        const snapshot = await getDocs(collection(db, collectionName));
        let deleted = 0;

        for (const docSnap of snapshot.docs) {
            await deleteDoc(doc(db, collectionName, docSnap.id));
            deleted++;
        }

        console.log(`   ✅ Deleted ${deleted} documents from ${collectionName}`);
        return deleted;
    } catch (error) {
        console.error(`   ❌ Error clearing ${collectionName}:`, error.message);
        return 0;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🧹 Quotation Data Reset Script');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    const collectionsToClean = [
        'quotations',
        'quotationIdempotency',
        'quotationProcessingLocks',
        'processedEmails',
        'orders'
    ];

    let totalDeleted = 0;

    for (const col of collectionsToClean) {
        totalDeleted += await clearCollection(col);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Complete! Deleted ${totalDeleted} total documents.`);
    console.log('═══════════════════════════════════════════════════');

    // Also clear localStorage key for quotations
    console.log('');
    console.log('💡 Remember to also clear localStorage in browser:');
    console.log('   localStorage.removeItem("padoca_sent_emails")');

    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
