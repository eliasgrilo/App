/**
 * Quotation Status Utilities
 * 
 * Centralized status mapping and utilities for quotation management.
 * Ensures consistent status handling between Firestore and frontend.
 * 
 * BUG #7 FIX: Re-exporta QUOTATION_STATUS de smartSourcingService
 * para garantir uma única fonte da verdade.
 */

import { QUOTATION_STATUS } from '../services/smartSourcingService';

/**
 * Status constants for quotations
 * Re-exported from smartSourcingService for convenience
 */
export const QUOTATION_STATUSES = {
    PENDING: QUOTATION_STATUS.PENDING,
    SENT: QUOTATION_STATUS.PENDING, // Alias for backwards compatibility
    AWAITING: QUOTATION_STATUS.AWAITING,
    QUOTED: QUOTATION_STATUS.QUOTED,
    CONFIRMED: QUOTATION_STATUS.ORDERED, // Mapping to ORDERED
    DELIVERED: QUOTATION_STATUS.RECEIVED, // Mapping to RECEIVED
    CANCELLED: QUOTATION_STATUS.CANCELLED
};

/**
 * Map Firestore status values to frontend status values
 * Handles various naming conventions and normalizes to frontend format
 * 
 * @param {string} firestoreStatus - Status from Firestore
 * @returns {string} - Normalized frontend status
 */
export function mapFirestoreToFrontend(firestoreStatus) {
    if (!firestoreStatus) return QUOTATION_STATUSES.PENDING;

    const status = firestoreStatus.toLowerCase().trim();

    // Direct mappings
    const statusMap = {
        // Pending/Draft states
        'pending': QUOTATION_STATUSES.PENDING,
        'draft': QUOTATION_STATUSES.PENDING,
        'created': QUOTATION_STATUSES.PENDING,

        // Sent states
        'sent': QUOTATION_STATUSES.SENT,
        'email_sent': QUOTATION_STATUSES.SENT,
        'emailsent': QUOTATION_STATUSES.SENT,

        // Awaiting response states
        'awaiting': QUOTATION_STATUSES.AWAITING,
        'awaiting_response': QUOTATION_STATUSES.AWAITING,
        'awaitingresponse': QUOTATION_STATUSES.AWAITING,
        'waiting': QUOTATION_STATUSES.AWAITING,

        // Quoted states (received supplier quote)
        'quoted': QUOTATION_STATUSES.QUOTED,
        'quote_received': QUOTATION_STATUSES.QUOTED,
        'quotereceived': QUOTATION_STATUSES.QUOTED,
        'replied': QUOTATION_STATUSES.QUOTED,
        'response_received': QUOTATION_STATUSES.QUOTED,

        // Confirmed/Order placed states
        'confirmed': QUOTATION_STATUSES.CONFIRMED,
        'order_placed': QUOTATION_STATUSES.CONFIRMED,
        'orderplaced': QUOTATION_STATUSES.CONFIRMED,
        'accepted': QUOTATION_STATUSES.CONFIRMED,

        // Delivered states
        'delivered': QUOTATION_STATUSES.DELIVERED,
        'completed': QUOTATION_STATUSES.DELIVERED,
        'received': QUOTATION_STATUSES.DELIVERED,
        'closed': QUOTATION_STATUSES.DELIVERED,

        // Cancelled states
        'cancelled': QUOTATION_STATUSES.CANCELLED,
        'canceled': QUOTATION_STATUSES.CANCELLED,
        'rejected': QUOTATION_STATUSES.CANCELLED,
        'expired': QUOTATION_STATUSES.CANCELLED
    };

    return statusMap[status] || QUOTATION_STATUSES.PENDING;
}

/**
 * Map frontend status to Firestore status
 * @param {string} frontendStatus - Status from frontend
 * @returns {string} - Firestore status value
 */
export function mapFrontendToFirestore(frontendStatus) {
    // Firestore uses the same values, just ensure lowercase
    return frontendStatus?.toLowerCase() || 'pending';
}

/**
 * Check if a status represents an active (non-final) quotation
 * Active statuses are those that require user attention or are in progress
 * 
 * @param {string} status - Quotation status
 * @returns {boolean} - True if the status is active
 */
export function isActiveStatus(status) {
    if (!status) return false;

    const normalizedStatus = status.toLowerCase().trim();

    const activeStatuses = [
        QUOTATION_STATUSES.PENDING,
        QUOTATION_STATUSES.SENT,
        QUOTATION_STATUSES.AWAITING,
        QUOTATION_STATUSES.QUOTED,
        QUOTATION_STATUSES.CONFIRMED
    ];

    return activeStatuses.includes(normalizedStatus);
}

/**
 * Check if a status represents a final state
 * @param {string} status - Quotation status
 * @returns {boolean} - True if the status is final
 */
export function isFinalStatus(status) {
    if (!status) return false;

    const normalizedStatus = status.toLowerCase().trim();

    const finalStatuses = [
        QUOTATION_STATUSES.DELIVERED,
        QUOTATION_STATUSES.CANCELLED
    ];

    return finalStatuses.includes(normalizedStatus);
}

/**
 * Get display label for a status
 * @param {string} status - Quotation status
 * @returns {string} - Human-readable status label
 */
export function getStatusLabel(status) {
    if (!status) return 'Pendente';

    const labels = {
        [QUOTATION_STATUSES.PENDING]: 'Pendente',
        [QUOTATION_STATUSES.SENT]: 'Enviado',
        [QUOTATION_STATUSES.AWAITING]: 'Aguardando',
        [QUOTATION_STATUSES.QUOTED]: 'Cotado',
        [QUOTATION_STATUSES.CONFIRMED]: 'Confirmado',
        [QUOTATION_STATUSES.DELIVERED]: 'Entregue',
        [QUOTATION_STATUSES.CANCELLED]: 'Cancelado'
    };

    return labels[status.toLowerCase()] || status;
}

/**
 * Get color class for a status (for UI styling)
 * @param {string} status - Quotation status
 * @returns {string} - CSS color class or color value
 */
export function getStatusColor(status) {
    if (!status) return 'gray';

    const colors = {
        [QUOTATION_STATUSES.PENDING]: 'yellow',
        [QUOTATION_STATUSES.SENT]: 'blue',
        [QUOTATION_STATUSES.AWAITING]: 'orange',
        [QUOTATION_STATUSES.QUOTED]: 'purple',
        [QUOTATION_STATUSES.CONFIRMED]: 'green',
        [QUOTATION_STATUSES.DELIVERED]: 'teal',
        [QUOTATION_STATUSES.CANCELLED]: 'red'
    };

    return colors[status.toLowerCase()] || 'gray';
}

export default {
    QUOTATION_STATUSES,
    mapFirestoreToFrontend,
    mapFrontendToFirestore,
    isActiveStatus,
    isFinalStatus,
    getStatusLabel,
    getStatusColor
};
