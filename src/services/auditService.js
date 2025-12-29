/**
 * Audit Service
 * Provides automatic audit logging for all mutations
 * Ensures fiscal compliance with complete audit trail
 */

import { getDataConnectInstance } from './dataConnectService';
import { mutationRef, executeMutation, queryRef, executeQuery } from 'firebase/data-connect';

// ===================================================================
// AUDIT LOG CREATION
// ===================================================================

/**
 * Create an audit log entry
 * @param {Object} options - Audit entry options
 * @param {string} options.entityType - Type of entity (Product, Recipe, Cost, etc.)
 * @param {string} options.entityId - ID of the entity
 * @param {string} options.action - Action type (CREATE, UPDATE, DELETE, MOVEMENT, ADJUSTMENT, APPROVAL)
 * @param {Object} options.previousState - Previous state of the entity (for UPDATE/DELETE)
 * @param {Object} options.newState - New state of the entity (for CREATE/UPDATE)
 * @param {string} options.userId - User ID who performed the action
 * @param {string} options.userName - User name who performed the action
 * @returns {Promise<Object>} - Created audit log entry
 */
export async function createAuditEntry({
    entityType,
    entityId,
    action,
    previousState = null,
    newState = null,
    userId = null,
    userName = null
}) {
    const dc = getDataConnectInstance();
    if (!dc) {
        console.error('Data Connect not initialized for audit logging');
        return null;
    }

    // Calculate diff between states
    const diff = previousState && newState
        ? JSON.stringify(calculateDiff(previousState, newState))
        : null;

    try {
        const result = await executeMutation(mutationRef(dc, 'CreateAuditLog'), {
            entityType,
            entityId: String(entityId),
            action,
            previousState: previousState ? JSON.stringify(previousState) : null,
            newState: newState ? JSON.stringify(newState) : null,
            diff,
            userId,
            userName,
            ipAddress: await getClientIP(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
        });

        console.log(`Audit log created: ${action} on ${entityType}#${entityId}`);
        return result.data.auditLog_insert;
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit failure shouldn't block the main operation
        // But log to console for monitoring
        return null;
    }
}

/**
 * Calculate diff between two states
 * @param {Object} oldState - Previous state
 * @param {Object} newState - New state
 * @returns {Object} - Object containing changed fields with old/new values
 */
function calculateDiff(oldState, newState) {
    const diff = {};
    const oldObj = typeof oldState === 'object' ? oldState : {};
    const newObj = typeof newState === 'object' ? newState : {};
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
        // Skip internal/meta fields
        if (key.startsWith('_') || key === 'updatedAt' || key === 'createdAt') {
            continue;
        }

        const oldVal = oldObj[key];
        const newVal = newObj[key];

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            diff[key] = {
                old: oldVal !== undefined ? oldVal : null,
                new: newVal !== undefined ? newVal : null
            };
        }
    }

    return diff;
}

/**
 * Get client IP address
 * Uses external service for approximation
 * @returns {Promise<string>} - Client IP or 'unknown'
 */
async function getClientIP() {
    try {
        // Only attempt in browser environment
        if (typeof window === 'undefined') {
            return 'server';
        }

        const response = await fetch('https://api.ipify.org?format=json', {
            signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        const data = await response.json();
        return data.ip;
    } catch {
        return 'unknown';
    }
}

// ===================================================================
// AUDIT WRAPPER FOR MUTATIONS
// ===================================================================

/**
 * Create a wrapper that automatically adds audit logging to mutations
 * @param {string} entityType - Type of entity
 * @returns {Object} - Object with create, update, delete methods
 */
export function withAudit(entityType) {
    return {
        /**
         * Create with audit logging
         */
        async create(mutationName, data, userId, userName) {
            const dc = getDataConnectInstance();
            if (!dc) throw new Error('Data Connect not initialized');

            // Execute the create mutation
            const result = await executeMutation(mutationRef(dc, mutationName), data);

            // Get the created entity ID (convention: {entityType}_insert)
            const insertKey = Object.keys(result.data).find(k => k.includes('_insert'));
            const entityId = result.data[insertKey]?.id;

            // Create audit entry
            await createAuditEntry({
                entityType,
                entityId,
                action: 'CREATE',
                newState: data,
                userId,
                userName
            });

            return result;
        },

        /**
         * Update with audit logging
         */
        async update(mutationName, id, oldData, newData, userId, userName) {
            const dc = getDataConnectInstance();
            if (!dc) throw new Error('Data Connect not initialized');

            // Execute the update mutation
            const result = await executeMutation(mutationRef(dc, mutationName), { id, ...newData });

            // Create audit entry with diff
            await createAuditEntry({
                entityType,
                entityId: id,
                action: 'UPDATE',
                previousState: oldData,
                newState: { ...oldData, ...newData },
                userId,
                userName
            });

            return result;
        },

        /**
         * Delete with audit logging (log BEFORE deletion)
         */
        async delete(mutationName, id, currentData, userId, userName) {
            const dc = getDataConnectInstance();
            if (!dc) throw new Error('Data Connect not initialized');

            // Create audit entry BEFORE deletion
            await createAuditEntry({
                entityType,
                entityId: id,
                action: 'DELETE',
                previousState: currentData,
                userId,
                userName
            });

            // Execute the delete mutation
            return await executeMutation(mutationRef(dc, mutationName), { id });
        },

        /**
         * Record a movement/adjustment
         */
        async movement(entityId, movementData, userId, userName) {
            await createAuditEntry({
                entityType,
                entityId,
                action: 'MOVEMENT',
                newState: movementData,
                userId,
                userName
            });
        },

        /**
         * Record an approval action
         */
        async approval(entityId, approvalData, userId, userName) {
            await createAuditEntry({
                entityType,
                entityId,
                action: 'APPROVAL',
                newState: approvalData,
                userId,
                userName
            });
        }
    };
}

// ===================================================================
// AUDIT QUERIES
// ===================================================================

/**
 * Get audit trail for a specific entity
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of audit log entries
 */
export async function getAuditTrail(entityType, entityId, options = {}) {
    const dc = getDataConnectInstance();
    if (!dc) return [];

    try {
        const result = await executeQuery(queryRef(dc, 'ListAuditLogs'), {
            entityType,
            entityId,
            limit: options.limit || 100
        });
        return result.data.auditLogs || [];
    } catch (error) {
        console.error('Failed to fetch audit trail:', error);
        return [];
    }
}

/**
 * Get complete audit report for fiscal compliance
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Array of audit log entries
 */
export async function getAuditReport(startDate, endDate) {
    const dc = getDataConnectInstance();
    if (!dc) return [];

    try {
        const result = await executeQuery(queryRef(dc, 'GetAuditTrail'), {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
        return result.data.auditLogs || [];
    } catch (error) {
        console.error('Failed to fetch audit report:', error);
        return [];
    }
}

/**
 * Get audit logs by user
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of entries
 * @returns {Promise<Array>} - Array of audit log entries
 */
export async function getAuditLogsByUser(userId, limit = 50) {
    const dc = getDataConnectInstance();
    if (!dc) return [];

    try {
        const result = await executeQuery(queryRef(dc, 'ListAuditLogsByUser'), {
            userId,
            limit
        });
        return result.data.auditLogs || [];
    } catch (error) {
        console.error('Failed to fetch user audit logs:', error);
        return [];
    }
}

/**
 * Export audit data as CSV for fiscal reporting
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<string>} - CSV string
 */
export async function exportAuditCSV(startDate, endDate) {
    const logs = await getAuditReport(startDate, endDate);

    const headers = [
        'ID',
        'Data/Hora',
        'Tipo Entidade',
        'ID Entidade',
        'Ação',
        'Usuário ID',
        'Usuário Nome',
        'Estado Anterior',
        'Novo Estado'
    ];

    const rows = logs.map(log => [
        log.id,
        new Date(log.createdAt).toLocaleString('pt-BR'),
        log.entityType,
        log.entityId,
        log.action,
        log.userId || '',
        log.userName || '',
        log.previousState || '',
        log.newState || ''
    ]);

    const csv = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    return csv;
}

// ===================================================================
// PRE-CONFIGURED ENTITY AUDITORS
// ===================================================================

export const ProductAudit = withAudit('Product');
export const RecipeAudit = withAudit('Recipe');
export const CostAudit = withAudit('Cost');
export const SupplierAudit = withAudit('Supplier');
export const QuotationAudit = withAudit('Quotation');
export const FileAudit = withAudit('File');
export const MovementAudit = withAudit('ProductMovement');

// ===================================================================
// SERVICE EXPORT
// ===================================================================

export const AuditService = {
    // Core functions
    createAuditEntry,
    withAudit,

    // Query functions
    getAuditTrail,
    getAuditReport,
    getAuditLogsByUser,
    exportAuditCSV,

    // Pre-configured auditors
    Product: ProductAudit,
    Recipe: RecipeAudit,
    Cost: CostAudit,
    Supplier: SupplierAudit,
    Quotation: QuotationAudit,
    File: FileAudit,
    Movement: MovementAudit
};

export default AuditService;
