/**
 * Time Travel Debugger Service
 * 
 * PREMIUM FEATURE #1: Event Sourcing with Time-Travel Debugging
 * 
 * Enables:
 * - Reconstructing state at any point in time
 * - Replaying events to understand sequence of operations
 * - Debugging complex issues by seeing exactly what happened
 * - Creating audit trails for compliance
 * 
 * Works with EventStoreService to provide time-travel capabilities
 * 
 * Created: 2025-12-31 - Quotation Module Reengineering
 */

import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, limit, startAfter, Timestamp } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const EVENTS_COLLECTION = 'eventStore';
const AUDIT_COLLECTION = 'auditLogs';
const DEFAULT_PAGE_SIZE = 50;

// Event categories for filtering
export const EVENT_CATEGORY = {
    QUOTATION: 'quotation',
    ORDER: 'order',
    SYSTEM: 'system',
    USER: 'user'
};

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TIMELINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get timeline of events for a specific entity
 * 
 * @param {string} entityType - 'quotation', 'order', etc.
 * @param {string} entityId - ID of the entity
 * @param {Object} options - Filtering options
 * @returns {Promise<Array>} - Chronological list of events
 */
export async function getEntityTimeline(entityType, entityId, options = {}) {
    const {
        limit: maxResults = DEFAULT_PAGE_SIZE,
        startTime = null,
        endTime = null
    } = options;

    try {
        let q = query(
            collection(db, EVENTS_COLLECTION),
            where('aggregateType', '==', entityType),
            where('aggregateId', '==', entityId),
            orderBy('timestamp', 'asc')
        );

        if (startTime) {
            q = query(q, where('timestamp', '>=', Timestamp.fromDate(new Date(startTime))));
        }

        if (endTime) {
            q = query(q, where('timestamp', '<=', Timestamp.fromDate(new Date(endTime))));
        }

        if (maxResults) {
            q = query(q, limit(maxResults));
        }

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || null
        }));
    } catch (error) {
        console.error('Failed to get entity timeline:', error);
        return [];
    }
}

/**
 * Get global timeline across all entities
 * 
 * @param {Object} options - Filtering and pagination options
 * @returns {Promise<Array>} - List of events
 */
export async function getGlobalTimeline(options = {}) {
    const {
        limit: maxResults = DEFAULT_PAGE_SIZE,
        category = null,
        userId = null,
        startTime = null,
        endTime = null,
        cursor = null
    } = options;

    try {
        let constraints = [orderBy('timestamp', 'desc')];

        if (category) {
            constraints.push(where('category', '==', category));
        }

        if (userId) {
            constraints.push(where('metadata.userId', '==', userId));
        }

        if (startTime) {
            constraints.push(where('timestamp', '>=', Timestamp.fromDate(new Date(startTime))));
        }

        if (endTime) {
            constraints.push(where('timestamp', '<=', Timestamp.fromDate(new Date(endTime))));
        }

        if (cursor) {
            constraints.push(startAfter(cursor));
        }

        constraints.push(limit(maxResults));

        const q = query(collection(db, EVENTS_COLLECTION), ...constraints);
        const snapshot = await getDocs(q);

        const events = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || null
        }));

        return {
            events,
            hasMore: events.length === maxResults,
            nextCursor: snapshot.docs[snapshot.docs.length - 1] || null
        };
    } catch (error) {
        console.error('Failed to get global timeline:', error);
        return { events: [], hasMore: false, nextCursor: null };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE RECONSTRUCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reconstruct entity state at a specific point in time
 * by replaying events up to that timestamp
 * 
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 * @param {Date|string} targetTime - Point in time to reconstruct
 * @returns {Promise<Object>} - Reconstructed state
 */
export async function reconstructStateAtTime(entityType, entityId, targetTime) {
    const targetDate = typeof targetTime === 'string' ? new Date(targetTime) : targetTime;

    // Get all events up to target time
    const events = await getEntityTimeline(entityType, entityId, {
        endTime: targetDate,
        limit: 1000 // Safety limit
    });

    if (events.length === 0) {
        return {
            exists: false,
            state: null,
            message: 'No events found for this entity before the specified time'
        };
    }

    // Replay events to build state
    let state = {};
    const stateHistory = [];

    for (const event of events) {
        const previousState = { ...state };

        // Apply event to state based on event type
        state = applyEvent(state, event);

        stateHistory.push({
            eventId: event.id,
            eventType: event.eventType,
            timestamp: event.timestamp,
            changes: getStateChanges(previousState, state)
        });
    }

    return {
        exists: true,
        state,
        stateHistory,
        eventCount: events.length,
        reconstructedAt: targetDate,
        firstEvent: events[0]?.timestamp,
        lastEvent: events[events.length - 1]?.timestamp
    };
}

/**
 * Apply an event to the current state
 * Returns new state (immutable)
 */
function applyEvent(currentState, event) {
    const { eventType, payload } = event;

    // Clone current state
    const newState = { ...currentState };

    switch (eventType) {
        // Quotation events
        case 'QUOTATION_CREATED':
            return { ...newState, ...payload, status: 'draft', createdAt: event.timestamp };

        case 'QUOTATION_SENT':
            return { ...newState, status: 'pending', sentAt: event.timestamp, ...payload };

        case 'QUOTATION_REPLY_RECEIVED':
            return { ...newState, status: 'replied', replyReceivedAt: event.timestamp, ...payload };

        case 'QUOTATION_ANALYZED':
            return { ...newState, status: 'quoted', analyzedAt: event.timestamp, ...payload };

        case 'QUOTATION_CONFIRMED':
            return { ...newState, status: 'ordered', confirmedAt: event.timestamp, ...payload };

        case 'QUOTATION_DELIVERED':
            return { ...newState, status: 'delivered', deliveredAt: event.timestamp, ...payload };

        case 'QUOTATION_CANCELLED':
            return { ...newState, status: 'cancelled', cancelledAt: event.timestamp, ...payload };

        // Order events
        case 'ORDER_CREATED':
            return { ...newState, ...payload, createdAt: event.timestamp };

        case 'ORDER_CONFIRMED':
            return { ...newState, status: 'confirmed', confirmedAt: event.timestamp, ...payload };

        case 'ORDER_SHIPPED':
            return { ...newState, status: 'shipped', shippedAt: event.timestamp, ...payload };

        case 'ORDER_DELIVERED':
            return { ...newState, status: 'delivered', deliveredAt: event.timestamp, ...payload };

        // Generic status change
        case 'STATUS_CHANGE':
            return { ...newState, status: payload.newStatus, updatedAt: event.timestamp };

        default:
            // For unknown events, merge payload into state
            return { ...newState, ...payload, lastUpdated: event.timestamp };
    }
}

/**
 * Get changes between two states
 */
function getStateChanges(oldState, newState) {
    const changes = {};

    // Find added/changed keys
    for (const key of Object.keys(newState)) {
        if (oldState[key] !== newState[key]) {
            changes[key] = {
                from: oldState[key],
                to: newState[key]
            };
        }
    }

    // Find removed keys
    for (const key of Object.keys(oldState)) {
        if (!(key in newState)) {
            changes[key] = {
                from: oldState[key],
                to: undefined
            };
        }
    }

    return Object.keys(changes).length > 0 ? changes : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT REPLAY (for debugging)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Replay events step-by-step for debugging
 * Returns a generator that yields state after each event
 * 
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @returns {AsyncGenerator<Object>} - Generator yielding states
 */
export async function* replayEvents(entityType, entityId) {
    const events = await getEntityTimeline(entityType, entityId, { limit: 1000 });

    let state = {};

    for (const event of events) {
        state = applyEvent(state, event);

        yield {
            event,
            stateAfterEvent: { ...state },
            timestamp: event.timestamp
        };
    }
}

/**
 * Get state diffs between two points in time
 * Useful for debugging what changed
 * 
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @param {Date} startTime - Start of time range
 * @param {Date} endTime - End of time range
 * @returns {Promise<Object>} - Diff between states
 */
export async function getStateDiff(entityType, entityId, startTime, endTime) {
    const [startState, endState] = await Promise.all([
        reconstructStateAtTime(entityType, entityId, startTime),
        reconstructStateAtTime(entityType, entityId, endTime)
    ]);

    if (!startState.exists && !endState.exists) {
        return {
            hasChanges: false,
            message: 'Entity did not exist in this time range'
        };
    }

    const changes = getStateChanges(
        startState.state || {},
        endState.state || {}
    );

    // Get events in the time range
    const events = await getEntityTimeline(entityType, entityId, {
        startTime,
        endTime
    });

    return {
        hasChanges: changes !== null,
        changes,
        eventCount: events.length,
        events: events.map(e => ({
            type: e.eventType,
            timestamp: e.timestamp
        })),
        startState: startState.state,
        endState: endState.state
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// DEBUGGING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find events matching a pattern
 * Useful for debugging specific scenarios
 */
export async function findEvents(searchOptions = {}) {
    const {
        eventType = null,
        entityType = null,
        userId = null,
        searchText = null,
        startTime = null,
        endTime = null,
        limit: maxResults = 100
    } = searchOptions;

    let constraints = [orderBy('timestamp', 'desc')];

    if (eventType) {
        constraints.push(where('eventType', '==', eventType));
    }

    if (entityType) {
        constraints.push(where('aggregateType', '==', entityType));
    }

    if (userId) {
        constraints.push(where('metadata.userId', '==', userId));
    }

    if (startTime) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(new Date(startTime))));
    }

    if (endTime) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(new Date(endTime))));
    }

    constraints.push(limit(maxResults));

    try {
        const q = query(collection(db, EVENTS_COLLECTION), ...constraints);
        const snapshot = await getDocs(q);

        let events = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || null
        }));

        // Client-side text search if needed
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            events = events.filter(e =>
                JSON.stringify(e).toLowerCase().includes(searchLower)
            );
        }

        return events;
    } catch (error) {
        console.error('Failed to find events:', error);
        return [];
    }
}

/**
 * Get event statistics
 */
export async function getEventStats(timeRange = 'day') {
    const now = new Date();
    let startTime;

    switch (timeRange) {
        case 'hour':
            startTime = new Date(now.getTime() - 60 * 60 * 1000);
            break;
        case 'day':
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case 'week':
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const events = await findEvents({ startTime, limit: 1000 });

    const stats = {
        total: events.length,
        byType: {},
        byEntity: {},
        byHour: {}
    };

    for (const event of events) {
        // By type
        stats.byType[event.eventType] = (stats.byType[event.eventType] || 0) + 1;

        // By entity
        stats.byEntity[event.aggregateType] = (stats.byEntity[event.aggregateType] || 0) + 1;

        // By hour
        if (event.timestamp) {
            const hour = event.timestamp.getHours();
            stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
        }
    }

    return stats;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const TimeTravelDebugger = {
    // Timeline queries
    getEntityTimeline,
    getGlobalTimeline,

    // State reconstruction
    reconstructStateAtTime,
    replayEvents,
    getStateDiff,

    // Search and stats
    findEvents,
    getEventStats,

    // Constants
    EVENT_CATEGORY
};

export default TimeTravelDebugger;
