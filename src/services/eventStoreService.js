/**
 * Event Store Service - Enterprise-Grade Event Sourcing
 * 
 * Implements immutable event storage with complete audit trail.
 * Events are APPEND-ONLY - never modified or deleted.
 * State can be reconstructed by replaying events.
 * 
 * Architecture Pattern: CQRS + Event Sourcing
 * - Commands produce events
 * - Events are stored immutably
 * - State is derived from event replay
 * 
 * @module EventStoreService
 * @version 1.0.0
 */

import {
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPES - All possible domain events
// ═══════════════════════════════════════════════════════════════════════════

export const EventType = Object.freeze({
    // Quotation Lifecycle Events
    QUOTATION_CREATED: 'QUOTATION_CREATED',
    QUOTATION_SENT: 'QUOTATION_SENT',
    QUOTATION_REPLY_RECEIVED: 'QUOTATION_REPLY_RECEIVED',
    QUOTATION_ANALYZED: 'QUOTATION_ANALYZED',
    QUOTATION_CONFIRMED: 'QUOTATION_CONFIRMED',
    QUOTATION_DELIVERED: 'QUOTATION_DELIVERED',
    QUOTATION_CANCELLED: 'QUOTATION_CANCELLED',
    QUOTATION_EXPIRED: 'QUOTATION_EXPIRED',
    QUOTATION_RESET: 'QUOTATION_RESET',

    // Order Lifecycle Events
    ORDER_CREATED: 'ORDER_CREATED',
    ORDER_CONFIRMED: 'ORDER_CONFIRMED',
    ORDER_SHIPPED: 'ORDER_SHIPPED',
    ORDER_DELIVERED: 'ORDER_DELIVERED',
    ORDER_CANCELLED: 'ORDER_CANCELLED',

    // Price Events
    PRICE_QUOTED: 'PRICE_QUOTED',
    PRICE_ACCEPTED: 'PRICE_ACCEPTED',
    PRICE_REJECTED: 'PRICE_REJECTED',

    // System Events
    SYSTEM_ERROR: 'SYSTEM_ERROR',
    SYSTEM_RECOVERY: 'SYSTEM_RECOVERY',
    LOCK_ACQUIRED: 'LOCK_ACQUIRED',
    LOCK_RELEASED: 'LOCK_RELEASED'
});

// ═══════════════════════════════════════════════════════════════════════════
// EVENT SCHEMA - Version control for event structure
// ═══════════════════════════════════════════════════════════════════════════

const CURRENT_SCHEMA_VERSION = 1;

/**
 * Event schema definition for validation
 */
const EventSchema = {
    version: CURRENT_SCHEMA_VERSION,
    requiredFields: ['eventId', 'eventType', 'aggregateId', 'aggregateType', 'timestamp', 'version'],
    optionalFields: ['payload', 'metadata', 'correlationId', 'causationId']
};

// ═══════════════════════════════════════════════════════════════════════════
// EVENT STORE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class EventStore {
    constructor() {
        this.collectionName = 'events';
        this.snapshotsCollection = 'event_snapshots';
    }

    /**
     * Generate a unique event ID
     * Format: evt_{timestamp}_{random}
     */
    generateEventId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        return `evt_${timestamp}_${random}`;
    }

    /**
     * Generate a correlation ID for distributed tracing
     * Used to track related events across services
     */
    generateCorrelationId() {
        return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Append an event to the event store (IMMUTABLE)
     * 
     * @param {Object} event - Event to store
     * @param {string} event.eventType - Type of event from EventType enum
     * @param {string} event.aggregateId - ID of the aggregate (e.g., quotation ID)
     * @param {string} event.aggregateType - Type of aggregate (e.g., 'Quotation')
     * @param {Object} event.payload - Event payload data
     * @param {Object} event.metadata - Optional metadata (user, IP, etc.)
     * @param {string} event.correlationId - Optional correlation ID for tracing
     * @param {string} event.causationId - Optional ID of the event that caused this one
     * @returns {Promise<Object>} - Stored event with generated fields
     */
    async append(event) {
        const {
            eventType,
            aggregateId,
            aggregateType,
            payload = {},
            metadata = {},
            correlationId = null,
            causationId = null
        } = event;

        // Validate required fields
        if (!eventType || !aggregateId || !aggregateType) {
            throw new Error('Event requires eventType, aggregateId, and aggregateType');
        }

        // Validate event type
        if (!Object.values(EventType).includes(eventType)) {
            console.warn(`Unknown event type: ${eventType}`);
        }

        // Get current version for this aggregate
        const version = await this.getNextVersion(aggregateId, aggregateType);

        // Build immutable event record
        const eventRecord = {
            // Core event identity
            eventId: this.generateEventId(),
            eventType,
            schemaVersion: CURRENT_SCHEMA_VERSION,

            // Aggregate reference
            aggregateId,
            aggregateType,
            version,

            // Timing
            timestamp: serverTimestamp(),
            clientTimestamp: new Date().toISOString(),

            // Payload (domain-specific data)
            payload: this.sanitizePayload(payload),

            // Metadata (cross-cutting concerns)
            metadata: {
                ...metadata,
                source: metadata.source || 'frontend',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
                environment: process.env.NODE_ENV || 'development'
            },

            // Distributed tracing
            correlationId: correlationId || this.generateCorrelationId(),
            causationId: causationId || null,

            // Immutability marker
            createdAt: serverTimestamp(),
            immutable: true
        };

        try {
            const docRef = await addDoc(collection(db, this.collectionName), eventRecord);

            console.log(`📝 Event stored: ${eventType} for ${aggregateType}#${aggregateId} (v${version})`);

            return {
                ...eventRecord,
                id: docRef.id,
                timestamp: new Date().toISOString() // Return client timestamp for immediate use
            };
        } catch (error) {
            console.error('❌ Failed to store event:', error);
            throw new Error(`Event store append failed: ${error.message}`);
        }
    }

    /**
     * Append multiple events atomically
     * All events succeed or all fail
     * 
     * @param {Array} events - Array of events to store
     * @returns {Promise<Array>} - Array of stored events
     */
    async appendBatch(events) {
        if (!events || events.length === 0) {
            return [];
        }

        const batch = writeBatch(db);
        const storedEvents = [];
        const correlationId = this.generateCorrelationId();

        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const version = await this.getNextVersion(event.aggregateId, event.aggregateType);

            const eventRecord = {
                eventId: this.generateEventId(),
                eventType: event.eventType,
                schemaVersion: CURRENT_SCHEMA_VERSION,
                aggregateId: event.aggregateId,
                aggregateType: event.aggregateType,
                version: version + i, // Increment for each event in batch
                timestamp: serverTimestamp(),
                clientTimestamp: new Date().toISOString(),
                payload: this.sanitizePayload(event.payload || {}),
                metadata: event.metadata || {},
                correlationId: event.correlationId || correlationId,
                causationId: i === 0 ? event.causationId : storedEvents[i - 1]?.eventId,
                createdAt: serverTimestamp(),
                immutable: true
            };

            const docRef = doc(collection(db, this.collectionName));
            batch.set(docRef, eventRecord);
            storedEvents.push({ ...eventRecord, id: docRef.id });
        }

        try {
            await batch.commit();
            console.log(`📝 Batch stored: ${events.length} events`);
            return storedEvents;
        } catch (error) {
            console.error('❌ Batch append failed:', error);
            throw new Error(`Batch append failed: ${error.message}`);
        }
    }

    /**
     * Get the next version number for an aggregate
     * Ensures monotonically increasing versions
     * 
     * @param {string} aggregateId - Aggregate ID
     * @param {string} aggregateType - Aggregate type
     * @returns {Promise<number>} - Next version number
     */
    async getNextVersion(aggregateId, aggregateType) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('aggregateId', '==', aggregateId),
                where('aggregateType', '==', aggregateType),
                orderBy('version', 'desc'),
                limit(1)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return 1;
            }

            const lastEvent = snapshot.docs[0].data();
            return (lastEvent.version || 0) + 1;
        } catch (error) {
            // If query fails (e.g., no index), start at 1
            console.warn('Version query failed, starting at 1:', error.message);
            return 1;
        }
    }

    /**
     * Get all events for an aggregate (for state replay)
     * 
     * @param {string} aggregateId - Aggregate ID
     * @param {string} aggregateType - Aggregate type
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Ordered events
     */
    async getEvents(aggregateId, aggregateType, options = {}) {
        const { fromVersion = 0, toVersion = null, limit: maxResults = 1000 } = options;

        try {
            let q = query(
                collection(db, this.collectionName),
                where('aggregateId', '==', aggregateId),
                where('aggregateType', '==', aggregateType),
                where('version', '>', fromVersion),
                orderBy('version', 'asc'),
                limit(maxResults)
            );

            const snapshot = await getDocs(q);
            const events = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                if (!toVersion || data.version <= toVersion) {
                    events.push({
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp?.toDate?.() || data.clientTimestamp
                    });
                }
            });

            return events;
        } catch (error) {
            console.error('❌ Failed to get events:', error);
            return [];
        }
    }

    /**
     * Replay events to reconstruct state
     * 
     * @param {string} aggregateId - Aggregate ID
     * @param {string} aggregateType - Aggregate type
     * @param {Function} reducer - Function to apply events to state
     * @param {Object} initialState - Initial state
     * @returns {Promise<Object>} - Reconstructed state
     */
    async replayEvents(aggregateId, aggregateType, reducer, initialState = {}) {
        const events = await this.getEvents(aggregateId, aggregateType);

        let state = { ...initialState };

        for (const event of events) {
            state = reducer(state, event);
        }

        console.log(`🔄 Replayed ${events.length} events for ${aggregateType}#${aggregateId}`);

        return {
            state,
            version: events.length > 0 ? events[events.length - 1].version : 0,
            eventCount: events.length
        };
    }

    /**
     * Create a snapshot for faster state loading
     * Snapshots are ALSO immutable - new snapshots replace old ones
     * 
     * @param {string} aggregateId - Aggregate ID
     * @param {string} aggregateType - Aggregate type
     * @param {Object} state - Current state to snapshot
     * @param {number} version - Event version this snapshot represents
     */
    async createSnapshot(aggregateId, aggregateType, state, version) {
        const snapshotId = `${aggregateType}_${aggregateId}`;

        const snapshot = {
            aggregateId,
            aggregateType,
            state: this.sanitizePayload(state),
            version,
            createdAt: serverTimestamp(),
            clientTimestamp: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, this.snapshotsCollection), snapshot);
            console.log(`📸 Snapshot created for ${aggregateType}#${aggregateId} at v${version}`);
        } catch (error) {
            console.warn('Snapshot creation failed:', error.message);
        }
    }

    /**
     * Get latest snapshot for faster loading
     * 
     * @param {string} aggregateId - Aggregate ID
     * @param {string} aggregateType - Aggregate type
     * @returns {Promise<Object|null>} - Latest snapshot or null
     */
    async getLatestSnapshot(aggregateId, aggregateType) {
        try {
            const q = query(
                collection(db, this.snapshotsCollection),
                where('aggregateId', '==', aggregateId),
                where('aggregateType', '==', aggregateType),
                orderBy('version', 'desc'),
                limit(1)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return null;
            }

            const data = snapshot.docs[0].data();
            return {
                id: snapshot.docs[0].id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.clientTimestamp
            };
        } catch (error) {
            console.warn('Snapshot query failed:', error.message);
            return null;
        }
    }

    /**
     * Load state with snapshot optimization
     * Uses snapshot if available, then replays only newer events
     * 
     * @param {string} aggregateId - Aggregate ID
     * @param {string} aggregateType - Aggregate type
     * @param {Function} reducer - Event reducer function
     * @param {Object} initialState - Initial state
     * @returns {Promise<Object>} - Current state
     */
    async loadState(aggregateId, aggregateType, reducer, initialState = {}) {
        // Try to load from snapshot first
        const snapshot = await this.getLatestSnapshot(aggregateId, aggregateType);

        if (snapshot) {
            // Replay only events after snapshot
            const events = await this.getEvents(aggregateId, aggregateType, {
                fromVersion: snapshot.version
            });

            let state = snapshot.state;
            for (const event of events) {
                state = reducer(state, event);
            }

            console.log(`⚡ Loaded from snapshot v${snapshot.version} + ${events.length} events`);

            return {
                state,
                version: events.length > 0 ? events[events.length - 1].version : snapshot.version,
                fromSnapshot: true
            };
        }

        // No snapshot, full replay
        return this.replayEvents(aggregateId, aggregateType, reducer, initialState);
    }

    /**
     * Sanitize payload to prevent Firestore issues
     * Removes undefined values, converts Dates, handles nested objects
     */
    sanitizePayload(obj) {
        if (obj === null || obj === undefined) return null;
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => this.sanitizePayload(item));
        if (obj instanceof Date) return obj.toISOString();

        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                cleaned[key] = this.sanitizePayload(value);
            }
        }
        return cleaned;
    }

    /**
     * Get events by correlation ID (distributed tracing)
     * 
     * @param {string} correlationId - Correlation ID
     * @returns {Promise<Array>} - Related events
     */
    async getEventsByCorrelation(correlationId) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('correlationId', '==', correlationId),
                orderBy('timestamp', 'asc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Correlation query failed:', error);
            return [];
        }
    }

    /**
     * Get recent events for monitoring/debugging
     * 
     * @param {number} count - Number of events to fetch
     * @param {string} eventType - Optional filter by event type
     * @returns {Promise<Array>} - Recent events
     */
    async getRecentEvents(count = 50, eventType = null) {
        try {
            let q;
            if (eventType) {
                q = query(
                    collection(db, this.collectionName),
                    where('eventType', '==', eventType),
                    orderBy('timestamp', 'desc'),
                    limit(count)
                );
            } else {
                q = query(
                    collection(db, this.collectionName),
                    orderBy('timestamp', 'desc'),
                    limit(count)
                );
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate?.() || doc.data().clientTimestamp
            }));
        } catch (error) {
            console.error('Recent events query failed:', error);
            return [];
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTATION EVENT REDUCERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reducer for Quotation aggregate
 * Applies events to build current state
 */
export const quotationReducer = (state, event) => {
    const { eventType, payload } = event;

    switch (eventType) {
        case EventType.QUOTATION_CREATED:
            return {
                ...state,
                id: event.aggregateId,
                status: 'draft',
                supplierId: payload.supplierId,
                supplierName: payload.supplierName,
                supplierEmail: payload.supplierEmail,
                items: payload.items || [],
                createdAt: event.clientTimestamp,
                version: event.version
            };

        case EventType.QUOTATION_SENT:
            return {
                ...state,
                status: 'sent',
                sentAt: event.clientTimestamp,
                emailSubject: payload.subject,
                emailBody: payload.body,
                version: event.version
            };

        case EventType.QUOTATION_REPLY_RECEIVED:
            return {
                ...state,
                status: 'replied',
                repliedAt: event.clientTimestamp,
                replyBody: payload.emailBody,
                replyFrom: payload.from,
                version: event.version
            };

        case EventType.QUOTATION_ANALYZED:
            return {
                ...state,
                status: 'quoted',
                analyzedAt: event.clientTimestamp,
                quotedItems: payload.quotedItems,
                quotedTotal: payload.quotedTotal,
                deliveryDate: payload.deliveryDate,
                paymentTerms: payload.paymentTerms,
                version: event.version
            };

        case EventType.QUOTATION_CONFIRMED:
            return {
                ...state,
                status: 'confirmed',
                confirmedAt: event.clientTimestamp,
                orderId: payload.orderId,
                version: event.version
            };

        case EventType.QUOTATION_DELIVERED:
            return {
                ...state,
                status: 'delivered',
                deliveredAt: event.clientTimestamp,
                deliveryNotes: payload.notes,
                invoiceNumber: payload.invoiceNumber,
                version: event.version
            };

        case EventType.QUOTATION_CANCELLED:
            return {
                ...state,
                status: 'cancelled',
                cancelledAt: event.clientTimestamp,
                cancellationReason: payload.reason,
                version: event.version
            };

        case EventType.QUOTATION_EXPIRED:
            return {
                ...state,
                status: 'expired',
                expiredAt: event.clientTimestamp,
                version: event.version
            };

        default:
            return { ...state, version: event.version };
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const eventStore = new EventStore();

export const EventStoreService = {
    // Core operations
    append: (event) => eventStore.append(event),
    appendBatch: (events) => eventStore.appendBatch(events),

    // Query operations
    getEvents: (aggregateId, aggregateType, options) =>
        eventStore.getEvents(aggregateId, aggregateType, options),
    getEventsByCorrelation: (correlationId) =>
        eventStore.getEventsByCorrelation(correlationId),
    getRecentEvents: (count, eventType) =>
        eventStore.getRecentEvents(count, eventType),

    // State reconstruction
    replayEvents: (aggregateId, aggregateType, reducer, initialState) =>
        eventStore.replayEvents(aggregateId, aggregateType, reducer, initialState),
    loadState: (aggregateId, aggregateType, reducer, initialState) =>
        eventStore.loadState(aggregateId, aggregateType, reducer, initialState),

    // Snapshots
    createSnapshot: (aggregateId, aggregateType, state, version) =>
        eventStore.createSnapshot(aggregateId, aggregateType, state, version),
    getLatestSnapshot: (aggregateId, aggregateType) =>
        eventStore.getLatestSnapshot(aggregateId, aggregateType),

    // Utilities
    generateCorrelationId: () => eventStore.generateCorrelationId(),
    generateEventId: () => eventStore.generateEventId(),

    // Constants
    EventType,
    quotationReducer
};

export default EventStoreService;
