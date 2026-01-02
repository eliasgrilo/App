/**
 * Triple-Entry Accounting Service
 * 
 * PREMIUM FEATURE #21: Triple-Entry Accounting
 * 
 * Evolution of 500 years of accounting.
 * Third cryptographic ledger shared between parties - no reconciliation needed.
 * 
 * @module tripleEntryAccounting
 */

const EntryType = Object.freeze({
    DEBIT: 'debit', CREDIT: 'credit', RECEIPT: 'receipt'
});

const TransactionStatus = Object.freeze({
    PENDING: 'pending', CONFIRMED: 'confirmed', DISPUTED: 'disputed', SETTLED: 'settled'
});

class LedgerEntry {
    constructor(config) {
        this.id = config.id || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        this.transactionId = config.transactionId;
        this.type = config.type;
        this.amount = config.amount;
        this.currency = config.currency || 'BRL';
        this.account = config.account;
        this.counterparty = config.counterparty;
        this.description = config.description;
        this.timestamp = Date.now();
        this.hash = null;
        this.previousHash = config.previousHash || '0';
        this.signature = null;
    }

    async computeHash() {
        const data = `${this.transactionId}|${this.type}|${this.amount}|${this.account}|${this.counterparty}|${this.timestamp}|${this.previousHash}`;
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
        this.hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        return this.hash;
    }
}

class Transaction {
    constructor(config) {
        this.id = config.id || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        this.partyA = config.partyA;
        this.partyB = config.partyB;
        this.amount = config.amount;
        this.currency = config.currency || 'BRL';
        this.description = config.description;
        this.status = TransactionStatus.PENDING;
        this.entries = { partyA: null, partyB: null, shared: null };
        this.createdAt = Date.now();
        this.confirmedAt = null;
        this.metadata = config.metadata || {};
    }
}

class TripleEntryAccountingService {
    constructor() {
        this.transactions = new Map();
        this.ledgers = { local: [], shared: [] };
        this.lastHash = '0';
        this.initialized = false;
    }

    initialize(partyId) {
        this.partyId = partyId;
        this.initialized = true;
        console.log('[TripleEntry] Initialized for party:', partyId);
    }

    async createTransaction(config) {
        const transaction = new Transaction({
            ...config,
            partyA: this.partyId,
        });

        // Create debit entry for party A (us)
        const debitEntry = new LedgerEntry({
            transactionId: transaction.id,
            type: EntryType.DEBIT,
            amount: transaction.amount,
            currency: transaction.currency,
            account: `${this.partyId}:payables`,
            counterparty: transaction.partyB,
            description: `Payment to ${transaction.partyB}: ${transaction.description}`,
            previousHash: this.lastHash
        });
        await debitEntry.computeHash();

        // Create credit entry for party B
        const creditEntry = new LedgerEntry({
            transactionId: transaction.id,
            type: EntryType.CREDIT,
            amount: transaction.amount,
            currency: transaction.currency,
            account: `${transaction.partyB}:receivables`,
            counterparty: this.partyId,
            description: `Receipt from ${this.partyId}: ${transaction.description}`,
            previousHash: debitEntry.hash
        });
        await creditEntry.computeHash();

        // Create shared receipt (the third entry)
        const receiptEntry = new LedgerEntry({
            transactionId: transaction.id,
            type: EntryType.RECEIPT,
            amount: transaction.amount,
            currency: transaction.currency,
            account: 'shared:verified',
            counterparty: `${this.partyId}<>${transaction.partyB}`,
            description: `Verified: ${transaction.description}`,
            previousHash: creditEntry.hash
        });
        await receiptEntry.computeHash();

        transaction.entries = { partyA: debitEntry, partyB: creditEntry, shared: receiptEntry };
        this.transactions.set(transaction.id, transaction);
        this.ledgers.local.push(debitEntry);
        this.ledgers.shared.push(receiptEntry);
        this.lastHash = receiptEntry.hash;

        return transaction;
    }

    async confirmTransaction(transactionId, partyBSignature) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) throw new Error(`Transaction not found: ${transactionId}`);

        transaction.entries.shared.signature = partyBSignature;
        transaction.status = TransactionStatus.CONFIRMED;
        transaction.confirmedAt = Date.now();

        return { confirmed: true, receipt: transaction.entries.shared };
    }

    async verifyTransaction(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) return { valid: false, error: 'Transaction not found' };

        const { partyA, partyB, shared } = transaction.entries;

        // Verify hash chain
        const expectedPartyBHash = await this.recomputeHash(partyB, partyA.hash);
        const expectedSharedHash = await this.recomputeHash(shared, partyB.hash);

        const valid = partyB.hash === expectedPartyBHash && shared.hash === expectedSharedHash;

        return {
            valid,
            entries: { debit: partyA.hash, credit: partyB.hash, receipt: shared.hash },
            chainIntegrity: valid
        };
    }

    async recomputeHash(entry, expectedPreviousHash) {
        const temp = new LedgerEntry({
            transactionId: entry.transactionId,
            type: entry.type,
            amount: entry.amount,
            currency: entry.currency,
            account: entry.account,
            counterparty: entry.counterparty,
            description: entry.description,
            previousHash: expectedPreviousHash
        });
        temp.timestamp = entry.timestamp;
        await temp.computeHash();
        return temp.hash;
    }

    getTransaction(transactionId) {
        return this.transactions.get(transactionId);
    }

    getBalance(account) {
        let balance = 0;
        for (const entry of this.ledgers.local) {
            if (entry.account === account) {
                balance += entry.type === EntryType.CREDIT ? entry.amount : -entry.amount;
            }
        }
        return balance;
    }

    getAuditTrail(transactionId = null) {
        if (transactionId) {
            const txn = this.transactions.get(transactionId);
            if (!txn) return null;
            return {
                transaction: { id: txn.id, amount: txn.amount, status: txn.status },
                entries: [txn.entries.partyA, txn.entries.partyB, txn.entries.shared].map(e => ({
                    type: e.type, amount: e.amount, hash: e.hash?.substring(0, 16) + '...'
                }))
            };
        }
        return this.ledgers.shared.map(e => ({
            transactionId: e.transactionId, type: e.type, amount: e.amount,
            hash: e.hash?.substring(0, 16) + '...', timestamp: new Date(e.timestamp).toISOString()
        }));
    }

    reconcile(counterpartyLedger) {
        const discrepancies = [];
        for (const entry of this.ledgers.shared) {
            const match = counterpartyLedger.find(e => e.transactionId === entry.transactionId);
            if (!match || match.hash !== entry.hash) {
                discrepancies.push({ transactionId: entry.transactionId, ours: entry.hash, theirs: match?.hash });
            }
        }
        return { reconciled: discrepancies.length === 0, discrepancies };
    }

    getMetrics() {
        const transactions = Array.from(this.transactions.values());
        return {
            totalTransactions: transactions.length,
            confirmed: transactions.filter(t => t.status === TransactionStatus.CONFIRMED).length,
            pending: transactions.filter(t => t.status === TransactionStatus.PENDING).length,
            totalVolume: transactions.reduce((sum, t) => sum + t.amount, 0),
            ledgerEntries: this.ledgers.local.length + this.ledgers.shared.length
        };
    }
}

export const tripleEntryAccounting = new TripleEntryAccountingService();
export { EntryType, TransactionStatus, LedgerEntry, Transaction, TripleEntryAccountingService };
export default tripleEntryAccounting;
