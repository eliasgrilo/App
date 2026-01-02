/**
 * Quotation Deduplication Service
 * 
 * Centralized service to prevent duplicate quotations and orders
 * from appearing in the UI. Ensures data consistency across all views.
 */

/**
 * Generate multiple keys for robust duplicate detection
 * Returns an array of possible keys to check
 * @param {Object} quotation - The quotation object
 * @returns {Array<string>} - Array of possible unique identifiers
 */
function generateAllPossibleKeys(quotation) {
    const keys = [];

    // Key 1: firestoreId
    if (quotation.firestoreId) {
        keys.push(`fid:${quotation.firestoreId}`);
    }

    // Key 2: id
    if (quotation.id) {
        keys.push(`id:${quotation.id}`);
    }

    // Key 3: Supplier + items combination (normalized)
    const supplierId = quotation.supplierId || quotation.to || '';
    const itemIds = (quotation.items || [])
        .map(i => (i.id || i.productId || i.name || '').toLowerCase())
        .filter(Boolean)
        .sort()
        .join(',');
    if (supplierId && itemIds) {
        keys.push(`comp:${supplierId}_${itemIds}`);
    }

    // Key 4: Supplier email + date (for same-day quotes)
    const email = (quotation.to || quotation.supplierEmail || '').toLowerCase();
    const dateStr = quotation.sentAt ? new Date(quotation.sentAt).toISOString().split('T')[0] : '';
    if (email && dateStr) {
        keys.push(`email_date:${email}_${dateStr}`);
    }

    return keys;
}

/**
 * NUCLEAR DEDUPLICATION - Zero tolerance for duplicates
 * Uses multiple composite keys to catch ALL possible duplicates
 * 
 * @param {Array} quotations - Array of quotation objects
 * @param {Object} options - Deduplication options
 * @param {string} options.prioritize - 'newest' or 'oldest' for duplicate resolution
 * @param {boolean} options.debug - Enable debug logging
 * @returns {Array} - Deduplicated array of quotations
 */
function deduplicate(quotations, options = {}) {
    const { prioritize = 'newest', debug = false } = options;

    if (!Array.isArray(quotations)) {
        if (debug) console.warn('[DeduplicationService] Invalid input: not an array');
        return [];
    }

    // Map to track seen keys -> quotation
    const seenKeys = new Map();
    const result = [];
    let duplicateCount = 0;

    for (const quotation of quotations) {
        const allKeys = generateAllPossibleKeys(quotation);

        // Check if ANY of this quotation's keys have been seen
        let existingQuotation = null;
        let matchedKey = null;

        for (const key of allKeys) {
            if (seenKeys.has(key)) {
                existingQuotation = seenKeys.get(key);
                matchedKey = key;
                break;
            }
        }

        if (existingQuotation) {
            // Duplicate found - decide which to keep
            duplicateCount++;
            const existingDate = new Date(existingQuotation.sentAt || existingQuotation.createdAt || 0).getTime();
            const currentDate = new Date(quotation.sentAt || quotation.createdAt || 0).getTime();

            const shouldReplace = prioritize === 'newest'
                ? currentDate > existingDate
                : currentDate < existingDate;

            if (shouldReplace) {
                // Remove old from result and add new
                const oldIndex = result.findIndex(q => q === existingQuotation);
                if (oldIndex >= 0) {
                    result.splice(oldIndex, 1);
                }
                result.push(quotation);

                // Update all keys to point to new quotation
                for (const key of allKeys) {
                    seenKeys.set(key, quotation);
                }

                if (debug) {
                    console.log(`[DeduplicationService] REPLACED: ${matchedKey} (newer)`);
                }
            } else {
                if (debug) {
                    console.log(`[DeduplicationService] SKIPPED: ${matchedKey} (older)`);
                }
            }
        } else {
            // New quotation - add it and register all its keys
            result.push(quotation);
            for (const key of allKeys) {
                seenKeys.set(key, quotation);
            }
        }
    }

    if (debug && duplicateCount > 0) {
        console.log(`[DeduplicationService] 🧹 REMOVED ${duplicateCount} duplicates from ${quotations.length} items → ${result.length} unique`);
    }

    return result;
}

/**
 * Get active orders by merging quotation emails and Firestore orders
 * @param {Array} deduplicatedEmails - Already deduplicated email array
 * @param {Array} firestoreOrders - Orders from Firestore
 * @param {Object} options - Options for processing
 * @returns {Array} - Merged and deduplicated orders
 */
function getActiveOrders(deduplicatedEmails, firestoreOrders, options = {}) {
    const { debug = false } = options;

    // Filter emails that are orders (confirmed or delivered status)
    const emailOrders = (deduplicatedEmails || []).filter(email =>
        email.status === 'confirmed' || email.status === 'delivered'
    );

    // Create a map of existing order IDs
    const orderIds = new Set();
    const result = [];

    // Add email orders first
    for (const order of emailOrders) {
        const orderId = order.orderId || order.firestoreId || order.id;
        if (orderId && !orderIds.has(orderId)) {
            orderIds.add(orderId);
            result.push(order);
        } else if (!orderId) {
            // Order without ID - add it anyway
            result.push(order);
        }
    }

    // Add Firestore orders that aren't already included
    for (const order of (firestoreOrders || [])) {
        const orderId = order.id || order.orderId;
        if (orderId && !orderIds.has(orderId)) {
            orderIds.add(orderId);
            // Convert Firestore order to email format
            result.push({
                id: order.id,
                orderId: order.id,
                supplierName: order.supplierName,
                supplierId: order.supplierId,
                to: order.supplierEmail,
                status: order.status || 'confirmed',
                items: order.items || [],
                quotedValue: order.totalAmount || order.quotedTotal,
                expectedDelivery: order.deliveryDate,
                confirmedAt: order.confirmedAt || order.createdAt,
                sentAt: order.createdAt,
                firestoreData: order
            });
        }
    }

    if (debug) {
        console.log(`[DeduplicationService] Active orders: ${result.length} (${emailOrders.length} from emails, ${firestoreOrders?.length || 0} from Firestore)`);
    }

    // Sort by most recent first
    result.sort((a, b) => {
        const dateA = new Date(a.confirmedAt || a.sentAt || 0).getTime();
        const dateB = new Date(b.confirmedAt || b.sentAt || 0).getTime();
        return dateB - dateA;
    });

    return result;
}

/**
 * Export the service with all methods
 */
export const quotationDeduplicationService = {
    generateQuotationKey,
    deduplicate,
    getActiveOrders
};

export default quotationDeduplicationService;
