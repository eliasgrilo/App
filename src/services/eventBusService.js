/**
 * Event Bus Service - Unified Event System with CQRS Pattern
 * 
 * PREMIUM FEATURE #1: Centralized event handling for quotation/order lifecycle
 * 
 * Features:
 * - Publish/Subscribe pattern for decoupled components
 * - Event sourcing with Firestore persistence
 * - Automatic retry with exponential backoff
 * - Dead-letter queue for failed events
 * - Full audit trail for compliance
 * 
 * Created: 2025-12-31 - Quotation Module Reengineering
 */

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, limit } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPES - All quotation/order lifecycle events
// ═══════════════════════════════════════════════════════════════════════════

export const EventType = Object.freeze({
    // Quotation Events
    QUOTATION_CREATED: 'quotation.created',
    QUOTATION_SENT: 'quotation.sent',
    QUOTATION_REPLY_RECEIVED: 'quotation.reply_received',
    QUOTATION_ANALYZED: 'quotation.analyzed',
    QUOTATION_CANCELLED: 'quotation.cancelled',
    QUOTATION_EXPIRED: 'quotation.expired',

    // Order Events
    ORDER_CREATED: 'order.created',
    ORDER_CONFIRMED: 'order.confirmed',
    ORDER_SHIPPED: 'order.shipped',
    ORDER_DELIVERED: 'order.delivered',
    ORDER_CANCELLED: 'order.cancelled',

    // Stock Events
    STOCK_LOW: 'stock.low',
    STOCK_REPLENISHED: 'stock.replenished',

    // Email Events
    EMAIL_SENT: 'email.sent',
    EMAIL_FAILED: 'email.failed',
    EMAIL_REPLY_DETECTED: 'email.reply_detected'
});

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY SUBSCRIBER REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

const subscribers = new Map();
const eventHistory = [];
const MAX_HISTORY_SIZE = 100;

// ═══════════════════════════════════════════════════════════════════════════
// EVENT CLASS
// ═══════════════════════════════════════════════════════════════════════════

class DomainEvent {
    constructor(type, payload, metadata = {}) {
        this.id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        this.payload = payload;
        this.metadata = {
            timestamp: new Date().toISOString(),
            version: 1,
            source: 'frontend',
            correlationId: metadata.correlationId || this.id,
            causationId: metadata.causationId || null,
            userId: metadata.userId || null,
            userName: metadata.userName || null,
            ...metadata
        };
        this.processed = false;
        this.retryCount = 0;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            payload: this.payload,
            metadata: this.metadata,
            processed: this.processed,
            retryCount: this.retryCount
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT BUS CLASS
// ═══════════════════════════════════════════════════════════════════════════

class EventBusService {
    constructor() {
        this.isInitialized = false;
        this.persistEvents = true; // Toggle for Firestore persistence
    }

    /**
     * Subscribe to an event type
     * @param {string} eventType - Event type to listen for (or '*' for all)
     * @param {Function} handler - Async handler function
     * @returns {Function} Unsubscribe function
     */
    subscribe(eventType, handler) {
        if (!subscribers.has(eventType)) {
            subscribers.set(eventType, new Set());
        }
        subscribers.get(eventType).add(handler);

        console.log(`🔔 Subscribed to: ${eventType}`);

        // Return unsubscribe function
        return () => {
            const handlers = subscribers.get(eventType);
            if (handlers) {
                handlers.delete(handler);
                console.log(`🔕 Unsubscribed from: ${eventType}`);
            }
        };
    }

    /**
     * Publish an event to all subscribers
     * @param {string} eventType - Event type
     * @param {Object} payload - Event payload
     * @param {Object} metadata - Optional metadata
     * @returns {Promise<DomainEvent>} Published event
     */
    async publish(eventType, payload, metadata = {}) {
        const event = new DomainEvent(eventType, payload, metadata);

        console.log(`📤 Publishing event: ${eventType}`, { id: event.id });

        // Add to in-memory history (circular buffer)
        eventHistory.push(event);
        if (eventHistory.length > MAX_HISTORY_SIZE) {
            eventHistory.shift();
        }

        // Persist to Firestore (non-blocking)
        if (this.persistEvents) {
            this.persistEvent(event).catch(err =>
                console.warn('⚠️ Event persistence failed:', err.message)
            );
        }

        // Notify all subscribers
        await this.notifySubscribers(event);

        return event;
    }

    /**
     * Notify all subscribers of an event
     */
    async notifySubscribers(event) {
        const handlers = [
            ...(subscribers.get(event.type) || []),
            ...(subscribers.get('*') || []) // Wildcard subscribers
        ];

        const results = await Promise.allSettled(
            handlers.map(handler => this.executeHandler(handler, event))
        );

        // Log any failures
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            console.warn(`⚠️ ${failures.length} handler(s) failed for ${event.type}`);

            // Add to dead-letter queue if all retries failed
            if (event.retryCount >= 3) {
                await this.addToDeadLetterQueue(event, failures);
            }
        }

        event.processed = failures.length === 0;
    }

    /**
     * Execute a handler with retry logic
     */
    async executeHandler(handler, event, retryCount = 0) {
        const MAX_RETRIES = 3;
        const BASE_DELAY = 100; // ms

        try {
            await handler(event);
        } catch (error) {
            if (retryCount < MAX_RETRIES) {
                const delay = BASE_DELAY * Math.pow(2, retryCount);
                console.log(`🔄 Retrying handler in ${delay}ms (attempt ${retryCount + 1})`);

                await new Promise(resolve => setTimeout(resolve, delay));
                event.retryCount = retryCount + 1;
                return this.executeHandler(handler, event, retryCount + 1);
            }
            throw error;
        }
    }

    /**
     * Persist event to Firestore for audit trail
     */
    async persistEvent(event) {
        try {
            const eventsRef = collection(db, 'events');
            await addDoc(eventsRef, {
                ...event.toJSON(),
                persistedAt: serverTimestamp()
            });
            console.log(`💾 Event persisted: ${event.id}`);
        } catch (error) {
            console.error('❌ Event persistence failed:', error);
            throw error;
        }
    }

    /**
     * Add failed event to dead-letter queue
     */
    async addToDeadLetterQueue(event, failures) {
        try {
            const dlqRef = collection(db, 'eventDeadLetterQueue');
            await addDoc(dlqRef, {
                event: event.toJSON(),
                failures: failures.map(f => ({
                    reason: f.reason?.message || 'Unknown error',
                    stack: f.reason?.stack
                })),
                addedAt: serverTimestamp()
            });
            console.log(`☠️ Event added to DLQ: ${event.id}`);
        } catch (error) {
            console.error('❌ Failed to add to DLQ:', error);
        }
    }

    /**
     * Get recent events from history
     */
    getRecentEvents(count = 10) {
        return eventHistory.slice(-count);
    }

    /**
     * Get events by correlation ID (for tracing)
     */
    async getEventsByCorrelationId(correlationId) {
        try {
            const eventsRef = collection(db, 'events');
            const q = query(
                eventsRef,
                where('metadata.correlationId', '==', correlationId),
                orderBy('metadata.timestamp', 'asc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('❌ Failed to get events by correlation:', error);
            return [];
        }
    }

    /**
     * Get events for an entity (quotation/order)
     */
    async getEntityEvents(entityType, entityId, limitCount = 50) {
        try {
            const eventsRef = collection(db, 'events');
            const q = query(
                eventsRef,
                where('payload.entityType', '==', entityType),
                where('payload.entityId', '==', entityId),
                orderBy('metadata.timestamp', 'desc'),
                limit(limitCount)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('❌ Failed to get entity events:', error);
            return [];
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Helper: Publish quotation event
 */
export function publishQuotationEvent(eventType, quotationId, payload, userId, userName) {
    return eventBus.publish(eventType, {
        entityType: 'quotation',
        entityId: quotationId,
        ...payload
    }, { userId, userName });
}

/**
 * Helper: Publish order event
 */
export function publishOrderEvent(eventType, orderId, payload, userId, userName) {
    return eventBus.publish(eventType, {
        entityType: 'order',
        entityId: orderId,
        ...payload
    }, { userId, userName });
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const eventBus = new EventBusService();
export default eventBus;
