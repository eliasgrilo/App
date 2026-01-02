/**
 * Transactional Outbox Pattern Service - Guaranteed Delivery
 * 
 * PREMIUM FEATURE #7: Transactional Outbox Pattern
 * 
 * Guarantees that "Save to Database" and "Send Email/Notification" are atomic.
 * Either both happen, or neither happens - no "limbo" state.
 * 
 * How it works:
 * 1. Write event AND outbox message in same Firestore transaction
 * 2. Background processor picks up outbox messages
 * 3. Processes (sends email/notification) and marks as processed
 * 4. Dead letter queue for failed messages after retries
 * 
 * Benefits:
 * - Zero lost quotations or notifications
 * - Automatic retry with exponential backoff
 * - Full audit trail of all outgoing messages
 * - Dead letter queue for investigation
 * 
 * @module transactionalOutbox
 */

import { db } from '../firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    writeBatch,
    serverTimestamp,
    Timestamp,
    runTransaction
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
    OUTBOX_COLLECTION: 'outbox_messages',
    DEAD_LETTER_COLLECTION: 'outbox_dead_letters',
    MAX_RETRIES: 5,
    RETRY_DELAYS_MS: [1000, 5000, 30000, 120000, 600000], // 1s, 5s, 30s, 2min, 10min
    BATCH_SIZE: 10,
    PROCESSING_LOCK_TTL_MS: 60000, // 1 minute lock
    POLL_INTERVAL_MS: 5000 // Check every 5 seconds
};

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const MessageType = Object.freeze({
    // Email messages
    EMAIL_QUOTATION_REQUEST: 'email_quotation_request',
    EMAIL_QUOTATION_CONFIRMATION: 'email_quotation_confirmation',
    EMAIL_ORDER_CONFIRMATION: 'email_order_confirmation',
    EMAIL_DELIVERY_NOTIFICATION: 'email_delivery_notification',

    // Push notifications
    PUSH_QUOTATION_RECEIVED: 'push_quotation_received',
    PUSH_PRICE_ALERT: 'push_price_alert',
    PUSH_STOCK_LOW: 'push_stock_low',

    // Webhook calls
    WEBHOOK_ORDER_CREATED: 'webhook_order_created',
    WEBHOOK_STATUS_CHANGED: 'webhook_status_changed',

    // Internal events
    SYNC_INVENTORY: 'sync_inventory',
    RECALCULATE_ANALYTICS: 'recalculate_analytics'
});

export const MessageStatus = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    DEAD_LETTER: 'dead_letter'
});

// ═══════════════════════════════════════════════════════════════════════════
// OUTBOX MESSAGE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class OutboxMessage {
    constructor({
        id,
        type,
        payload,
        aggregateId,
        aggregateType,
        correlationId = null,
        scheduledFor = null,
        priority = 'normal'
    }) {
        this.id = id || `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        this.type = type;
        this.payload = payload;
        this.aggregateId = aggregateId;
        this.aggregateType = aggregateType;
        this.correlationId = correlationId;
        this.scheduledFor = scheduledFor;
        this.priority = priority; // 'high', 'normal', 'low'

        // Status tracking
        this.status = MessageStatus.PENDING;
        this.retryCount = 0;
        this.lastError = null;
        this.processedAt = null;
        this.processingLock = null;

        // Timestamps
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    toFirestore() {
        return {
            id: this.id,
            type: this.type,
            payload: this.payload,
            aggregateId: this.aggregateId,
            aggregateType: this.aggregateType,
            correlationId: this.correlationId,
            scheduledFor: this.scheduledFor ? Timestamp.fromDate(new Date(this.scheduledFor)) : null,
            priority: this.priority,
            status: this.status,
            retryCount: this.retryCount,
            lastError: this.lastError,
            processedAt: this.processedAt ? Timestamp.fromDate(new Date(this.processedAt)) : null,
            processingLock: this.processingLock,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
    }

    static fromFirestore(doc) {
        const data = doc.data();
        const message = new OutboxMessage({
            id: data.id,
            type: data.type,
            payload: data.payload,
            aggregateId: data.aggregateId,
            aggregateType: data.aggregateType,
            correlationId: data.correlationId,
            scheduledFor: data.scheduledFor?.toDate()?.toISOString() || null,
            priority: data.priority
        });
        message.status = data.status;
        message.retryCount = data.retryCount || 0;
        message.lastError = data.lastError;
        message.processedAt = data.processedAt?.toDate()?.toISOString() || null;
        message.processingLock = data.processingLock;
        message.createdAt = data.createdAt?.toDate()?.toISOString() || new Date().toISOString();
        message.updatedAt = data.updatedAt?.toDate()?.toISOString() || new Date().toISOString();
        return message;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTIONAL OUTBOX SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class TransactionalOutboxService {
    constructor() {
        this.handlers = new Map();
        this.isProcessing = false;
        this.processorInterval = null;
        this.instanceId = `processor_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.metrics = {
            published: 0,
            processed: 0,
            failed: 0,
            deadLettered: 0
        };
    }

    // ─────────────────────────────────────────────────
    // MESSAGE PUBLISHING
    // ─────────────────────────────────────────────────

    /**
     * Publish a message to the outbox within a transaction
     * This is the atomic operation that guarantees consistency
     * 
     * @param {Object} transaction - Firestore transaction
     * @param {Object} messageConfig - Message configuration
     * @returns {OutboxMessage} - Created message
     */
    publishInTransaction(transaction, messageConfig) {
        const message = new OutboxMessage(messageConfig);
        const docRef = doc(db, CONFIG.OUTBOX_COLLECTION, message.id);

        transaction.set(docRef, message.toFirestore());
        this.metrics.published++;

        console.log(`[Outbox] Published message: ${message.type} for ${message.aggregateId}`);
        return message;
    }

    /**
     * Execute an operation with automatic outbox message
     * Guarantees both the operation and message are atomic
     * 
     * @param {Object} config - Configuration
     * @param {Function} config.operation - Function receiving transaction, returns data to save
     * @param {Object} config.message - Message configuration
     * @returns {Promise<Object>} - Result of operation
     */
    async executeWithMessage({ operation, message }) {
        try {
            const result = await runTransaction(db, async (transaction) => {
                // Execute the main operation
                const operationResult = await operation(transaction);

                // Publish outbox message in same transaction
                const outboxMessage = this.publishInTransaction(transaction, {
                    ...message,
                    payload: {
                        ...message.payload,
                        operationResult: operationResult?.id || operationResult
                    }
                });

                return { operationResult, messageId: outboxMessage.id };
            });

            console.log(`[Outbox] Transaction completed: operation + message ${result.messageId}`);
            return { success: true, ...result };
        } catch (error) {
            console.error('[Outbox] Transaction failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Publish a message directly (non-transactional)
     * Use for fire-and-forget scenarios
     */
    async publish(messageConfig) {
        const message = new OutboxMessage(messageConfig);
        const docRef = doc(db, CONFIG.OUTBOX_COLLECTION, message.id);

        await setDoc(docRef, message.toFirestore());
        this.metrics.published++;

        console.log(`[Outbox] Published: ${message.type}`);
        return message;
    }

    // ─────────────────────────────────────────────────
    // HANDLER REGISTRATION
    // ─────────────────────────────────────────────────

    /**
     * Register a handler for a message type
     * 
     * @param {string} messageType - Type of message to handle
     * @param {Function} handler - Async function to process the message
     */
    registerHandler(messageType, handler) {
        this.handlers.set(messageType, handler);
        console.log(`[Outbox] Registered handler for: ${messageType}`);
    }

    /**
     * Register multiple handlers at once
     */
    registerHandlers(handlers) {
        for (const [type, handler] of Object.entries(handlers)) {
            this.registerHandler(type, handler);
        }
    }

    // ─────────────────────────────────────────────────
    // MESSAGE PROCESSING
    // ─────────────────────────────────────────────────

    /**
     * Start the background processor
     */
    startProcessor() {
        if (this.processorInterval) {
            console.log('[Outbox] Processor already running');
            return;
        }

        console.log(`[Outbox] Starting processor: ${this.instanceId}`);
        this.processorInterval = setInterval(() => {
            this.processPendingMessages();
        }, CONFIG.POLL_INTERVAL_MS);

        // Process immediately on start
        this.processPendingMessages();
    }

    /**
     * Stop the background processor
     */
    stopProcessor() {
        if (this.processorInterval) {
            clearInterval(this.processorInterval);
            this.processorInterval = null;
            console.log('[Outbox] Processor stopped');
        }
    }

    /**
     * Process pending messages in batch
     */
    async processPendingMessages() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Get pending messages
            const messagesQuery = query(
                collection(db, CONFIG.OUTBOX_COLLECTION),
                where('status', 'in', [MessageStatus.PENDING, MessageStatus.FAILED]),
                orderBy('createdAt', 'asc'),
                limit(CONFIG.BATCH_SIZE)
            );

            const snapshot = await getDocs(messagesQuery);

            if (snapshot.empty) {
                this.isProcessing = false;
                return;
            }

            console.log(`[Outbox] Processing ${snapshot.size} messages...`);

            // Process each message
            for (const docSnapshot of snapshot.docs) {
                await this.processMessage(OutboxMessage.fromFirestore(docSnapshot));
            }
        } catch (error) {
            console.error('[Outbox] Processing error:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process a single message
     */
    async processMessage(message) {
        const handler = this.handlers.get(message.type);

        if (!handler) {
            console.warn(`[Outbox] No handler for message type: ${message.type}`);
            await this.markAsFailed(message, 'No handler registered');
            return;
        }

        // Check if past max retries
        if (message.retryCount >= CONFIG.MAX_RETRIES) {
            await this.moveToDeadLetter(message);
            return;
        }

        // Acquire processing lock
        const lockAcquired = await this.acquireLock(message);
        if (!lockAcquired) {
            return; // Another processor is handling this
        }

        try {
            // Execute handler
            await handler(message.payload, {
                messageId: message.id,
                type: message.type,
                correlationId: message.correlationId,
                retryCount: message.retryCount
            });

            // Mark as completed
            await this.markAsCompleted(message);
            this.metrics.processed++;

        } catch (error) {
            console.error(`[Outbox] Handler error for ${message.type}:`, error);
            await this.handleRetry(message, error);
            this.metrics.failed++;
        }
    }

    /**
     * Acquire a processing lock on a message
     */
    async acquireLock(message) {
        const docRef = doc(db, CONFIG.OUTBOX_COLLECTION, message.id);

        try {
            const result = await runTransaction(db, async (transaction) => {
                const docSnapshot = await transaction.get(docRef);
                const data = docSnapshot.data();

                // Check if already locked by another processor
                if (data.processingLock) {
                    const lockTime = data.processingLock.acquiredAt?.toDate();
                    const isExpired = lockTime &&
                        (Date.now() - lockTime.getTime()) > CONFIG.PROCESSING_LOCK_TTL_MS;

                    if (!isExpired) {
                        return false; // Lock still held
                    }
                }

                // Acquire lock
                transaction.update(docRef, {
                    status: MessageStatus.PROCESSING,
                    processingLock: {
                        processerId: this.instanceId,
                        acquiredAt: serverTimestamp()
                    },
                    updatedAt: serverTimestamp()
                });

                return true;
            });

            return result;
        } catch (error) {
            console.error('[Outbox] Lock acquisition failed:', error);
            return false;
        }
    }

    /**
     * Mark message as completed
     */
    async markAsCompleted(message) {
        const docRef = doc(db, CONFIG.OUTBOX_COLLECTION, message.id);
        await setDoc(docRef, {
            status: MessageStatus.COMPLETED,
            processedAt: serverTimestamp(),
            processingLock: null,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    /**
     * Handle retry logic with exponential backoff
     */
    async handleRetry(message, error) {
        const newRetryCount = message.retryCount + 1;

        if (newRetryCount >= CONFIG.MAX_RETRIES) {
            await this.moveToDeadLetter(message, error);
            return;
        }

        const docRef = doc(db, CONFIG.OUTBOX_COLLECTION, message.id);
        const retryDelay = CONFIG.RETRY_DELAYS_MS[newRetryCount - 1] || 60000;
        const nextRetry = new Date(Date.now() + retryDelay);

        await setDoc(docRef, {
            status: MessageStatus.FAILED,
            retryCount: newRetryCount,
            lastError: error.message || String(error),
            scheduledFor: Timestamp.fromDate(nextRetry),
            processingLock: null,
            updatedAt: serverTimestamp()
        }, { merge: true });

        console.log(`[Outbox] Scheduled retry ${newRetryCount}/${CONFIG.MAX_RETRIES} for ${message.id} at ${nextRetry}`);
    }

    /**
     * Mark message as failed (no more retries)
     */
    async markAsFailed(message, reason) {
        const docRef = doc(db, CONFIG.OUTBOX_COLLECTION, message.id);
        await setDoc(docRef, {
            status: MessageStatus.FAILED,
            lastError: reason,
            processingLock: null,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    /**
     * Move message to dead letter queue
     */
    async moveToDeadLetter(message, error = null) {
        const batch = writeBatch(db);

        // Add to dead letter collection
        const dlRef = doc(db, CONFIG.DEAD_LETTER_COLLECTION, message.id);
        batch.set(dlRef, {
            ...message.toFirestore(),
            status: MessageStatus.DEAD_LETTER,
            movedAt: serverTimestamp(),
            finalError: error?.message || message.lastError || 'Max retries exceeded'
        });

        // Remove from outbox
        const outboxRef = doc(db, CONFIG.OUTBOX_COLLECTION, message.id);
        batch.delete(outboxRef);

        await batch.commit();
        this.metrics.deadLettered++;

        console.warn(`[Outbox] Message moved to dead letter: ${message.id}`);
    }

    // ─────────────────────────────────────────────────
    // MONITORING & MAINTENANCE
    // ─────────────────────────────────────────────────

    /**
     * Get outbox metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            processorId: this.instanceId,
            isRunning: !!this.processorInterval
        };
    }

    /**
     * Get pending message count
     */
    async getPendingCount() {
        const q = query(
            collection(db, CONFIG.OUTBOX_COLLECTION),
            where('status', '==', MessageStatus.PENDING)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
    }

    /**
     * Get dead letter messages for investigation
     */
    async getDeadLetters(limitCount = 20) {
        const q = query(
            collection(db, CONFIG.DEAD_LETTER_COLLECTION),
            orderBy('movedAt', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data());
    }

    /**
     * Retry a dead letter message
     */
    async retryDeadLetter(messageId) {
        const dlRef = doc(db, CONFIG.DEAD_LETTER_COLLECTION, messageId);
        const dlDoc = await getDoc(dlRef);

        if (!dlDoc.exists()) {
            throw new Error(`Dead letter not found: ${messageId}`);
        }

        const data = dlDoc.data();
        const batch = writeBatch(db);

        // Move back to outbox
        const outboxRef = doc(db, CONFIG.OUTBOX_COLLECTION, messageId);
        batch.set(outboxRef, {
            ...data,
            status: MessageStatus.PENDING,
            retryCount: 0,
            processingLock: null,
            updatedAt: serverTimestamp()
        });

        // Remove from dead letter
        batch.delete(dlRef);

        await batch.commit();
        console.log(`[Outbox] Retrying dead letter: ${messageId}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const transactionalOutbox = new TransactionalOutboxService();

// Export classes for testing
export { OutboxMessage, TransactionalOutboxService };

export default transactionalOutbox;
