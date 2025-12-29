/**
 * Smart Sourcing Service - Automated Purchase Order System
 * Orchestrates the complete quotation workflow with AI
 * Integrates with Data Connect, Gmail, and Gemini AI
 */

import { GeminiService } from './geminiService';
import { AuditService, createAuditEntry } from './auditService';
import { HapticService } from './hapticService';

// ===================================================================
// QUOTATION STATUS ENUM
// ===================================================================

export const QUOTATION_STATUS = {
    DRAFT: 'draft',           // Initial state, not yet sent
    PENDING: 'pending',       // Email sent, awaiting supplier response
    AWAITING: 'awaiting',     // Reminder sent, still waiting
    QUOTED: 'quoted',         // Supplier responded with quote
    ORDERED: 'ordered',       // Order confirmed by user
    SHIPPED: 'shipped',       // Supplier confirmed shipment
    RECEIVED: 'received',     // Goods received and confirmed
    CANCELLED: 'cancelled',   // Order cancelled
    EXPIRED: 'expired'        // No response, quotation expired
};

// Status colors for UI
export const STATUS_COLORS = {
    [QUOTATION_STATUS.DRAFT]: { bg: 'bg-zinc-500/10', text: 'text-zinc-500', border: 'border-zinc-500/20' },
    [QUOTATION_STATUS.PENDING]: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
    [QUOTATION_STATUS.AWAITING]: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20' },
    [QUOTATION_STATUS.QUOTED]: { bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-500/20' },
    [QUOTATION_STATUS.ORDERED]: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-500/20' },
    [QUOTATION_STATUS.SHIPPED]: { bg: 'bg-sky-500/10', text: 'text-sky-600', border: 'border-sky-500/20' },
    [QUOTATION_STATUS.RECEIVED]: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' },
    [QUOTATION_STATUS.CANCELLED]: { bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-500/20' },
    [QUOTATION_STATUS.EXPIRED]: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' }
};

// Status labels in Portuguese
export const STATUS_LABELS = {
    [QUOTATION_STATUS.DRAFT]: 'Rascunho',
    [QUOTATION_STATUS.PENDING]: 'Aguardando',
    [QUOTATION_STATUS.AWAITING]: 'Aguardando Retorno',
    [QUOTATION_STATUS.QUOTED]: 'Cotado',
    [QUOTATION_STATUS.ORDERED]: 'Pedido',
    [QUOTATION_STATUS.SHIPPED]: 'Enviado',
    [QUOTATION_STATUS.RECEIVED]: 'Recebido',
    [QUOTATION_STATUS.CANCELLED]: 'Cancelado',
    [QUOTATION_STATUS.EXPIRED]: 'Expirado'
};

// ===================================================================
// LOCAL STATE MANAGEMENT (for demo without backend)
// ===================================================================

const LOCAL_STORAGE_KEY = 'padoca_smart_sourcing_quotations';

function loadQuotations() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveQuotations(quotations) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotations));
}

// ===================================================================
// QUOTATION CRUD OPERATIONS
// ===================================================================

/**
 * Create a new quotation request
 * @param {Object} data - Quotation data
 */
export async function createQuotation({
    supplierId,
    supplierName,
    supplierEmail,
    items,
    userId,
    userName
}) {
    const quotation = {
        id: `quot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        supplierId,
        supplierName,
        supplierEmail,
        items: items.map(item => ({
            productId: item.id,
            productName: item.name,
            category: item.category,
            quantityToOrder: item.neededQuantity || item.quantityToOrder,
            unit: item.unit || 'un',
            estimatedUnitPrice: item.currentPrice,
            estimatedTotal: (item.neededQuantity || item.quantityToOrder) * (item.currentPrice || 0),
            // Response fields (filled later)
            quotedUnitPrice: null,
            quotedAvailability: null
        })),
        status: QUOTATION_STATUS.DRAFT,
        estimatedTotal: items.reduce((sum, i) =>
            sum + (i.neededQuantity || i.quantityToOrder || 0) * (i.currentPrice || 0), 0
        ),
        quotedTotal: null,
        deliveryDate: null,
        paymentTerms: null,
        emailThreadId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
        createdByName: userName,
        history: [{
            status: QUOTATION_STATUS.DRAFT,
            timestamp: new Date().toISOString(),
            userId,
            userName,
            action: 'CREATE'
        }]
    };

    // Save to local storage
    const quotations = loadQuotations();
    quotations.unshift(quotation);
    saveQuotations(quotations);

    // Create audit log
    await createAuditEntry({
        entityType: 'Quotation',
        entityId: quotation.id,
        action: 'CREATE',
        newState: quotation,
        userId,
        userName
    });

    HapticService.trigger('success');
    return quotation;
}

/**
 * Get all quotations
 */
export function getQuotations() {
    return loadQuotations();
}

/**
 * Get quotation by ID
 */
export function getQuotationById(id) {
    const quotations = loadQuotations();
    return quotations.find(q => q.id === id);
}

/**
 * Get quotations by status
 */
export function getQuotationsByStatus(status) {
    const quotations = loadQuotations();
    return quotations.filter(q => q.status === status);
}

/**
 * Update quotation status with audit trail
 */
export async function updateQuotationStatus(id, newStatus, metadata = {}, userId, userName) {
    const quotations = loadQuotations();
    const index = quotations.findIndex(q => q.id === id);

    if (index === -1) {
        throw new Error(`Quotation ${id} not found`);
    }

    const oldQuotation = { ...quotations[index] };
    const oldStatus = oldQuotation.status;

    // Update the quotation
    quotations[index] = {
        ...quotations[index],
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...metadata,
        history: [
            ...quotations[index].history,
            {
                status: newStatus,
                previousStatus: oldStatus,
                timestamp: new Date().toISOString(),
                userId,
                userName,
                action: 'STATUS_CHANGE',
                metadata
            }
        ]
    };

    saveQuotations(quotations);

    // Create immutable audit log in PostgreSQL
    await createAuditEntry({
        entityType: 'Quotation',
        entityId: id,
        action: 'STATUS_CHANGE',
        previousState: { status: oldStatus },
        newState: { status: newStatus, ...metadata },
        userId,
        userName
    });

    // Haptic feedback based on status
    if (newStatus === QUOTATION_STATUS.RECEIVED) {
        HapticService.trigger('approval');
    } else if (newStatus === QUOTATION_STATUS.CANCELLED) {
        HapticService.trigger('error');
    } else {
        HapticService.trigger('success');
    }

    return quotations[index];
}

// ===================================================================
// EMAIL WORKFLOW
// ===================================================================

/**
 * Send quotation request email
 */
export async function sendQuotationEmail(quotationId, userId, userName) {
    const quotation = getQuotationById(quotationId);
    if (!quotation) throw new Error('Quotation not found');

    // Generate professional email using Gemini AI
    const emailContent = await GeminiService.generateQuotationEmail({
        supplierName: quotation.supplierName,
        items: quotation.items.map(i => ({
            name: i.productName,
            quantityToOrder: i.quantityToOrder,
            unit: i.unit
        })),
        senderName: userName || 'Equipe Padoca'
    });

    // In production, this would call Gmail API
    console.log('📧 Generated Email:', emailContent);

    // Update status to PENDING
    const updated = await updateQuotationStatus(
        quotationId,
        QUOTATION_STATUS.PENDING,
        {
            emailSentAt: new Date().toISOString(),
            emailSubject: emailContent.subject,
            emailBody: emailContent.body
        },
        userId,
        userName
    );

    return {
        quotation: updated,
        email: emailContent
    };
}

/**
 * Process supplier email response using AI
 */
export async function processSupplierResponse(quotationId, emailBody, userId, userName) {
    const quotation = getQuotationById(quotationId);
    if (!quotation) throw new Error('Quotation not found');

    // Analyze email with Gemini AI
    const analysis = await GeminiService.analyzeSupplierResponse(
        emailBody,
        quotation.items.map(i => ({ name: i.productName }))
    );

    if (!analysis.success) {
        // AI couldn't parse - mark for manual review
        await updateQuotationStatus(
            quotationId,
            QUOTATION_STATUS.AWAITING,
            {
                aiAnalysisError: analysis.error,
                rawSupplierResponse: emailBody,
                needsManualReview: true
            },
            userId,
            userName
        );
        return { success: false, analysis };
    }

    const { data } = analysis;

    // Update quotation with extracted data
    const quotations = loadQuotations();
    const index = quotations.findIndex(q => q.id === quotationId);

    // Update items with quoted prices
    const updatedItems = quotations[index].items.map(item => {
        const quotedItem = data.items?.find(qi =>
            qi.name?.toLowerCase().includes(item.productName?.toLowerCase()) ||
            item.productName?.toLowerCase().includes(qi.name?.toLowerCase())
        );

        return {
            ...item,
            quotedUnitPrice: quotedItem?.unitPrice || item.quotedUnitPrice,
            quotedAvailability: quotedItem?.availableQuantity || item.quotedAvailability
        };
    });

    const quotedTotal = updatedItems.reduce((sum, item) =>
        sum + (item.quantityToOrder * (item.quotedUnitPrice || item.estimatedUnitPrice || 0)), 0
    );

    // Update quotation
    quotations[index] = {
        ...quotations[index],
        items: updatedItems,
        quotedTotal,
        deliveryDate: data.deliveryDate,
        deliveryDays: data.deliveryDays,
        paymentTerms: data.paymentTerms,
        supplierNotes: data.supplierNotes,
        aiAnalysis: data,
        rawSupplierResponse: emailBody,
        responseReceivedAt: new Date().toISOString(),
        status: QUOTATION_STATUS.QUOTED,
        updatedAt: new Date().toISOString(),
        history: [
            ...quotations[index].history,
            {
                status: QUOTATION_STATUS.QUOTED,
                previousStatus: quotations[index].status,
                timestamp: new Date().toISOString(),
                userId,
                userName,
                action: 'AI_RESPONSE_PROCESSED',
                metadata: { aiAnalysis: data }
            }
        ]
    };

    saveQuotations(quotations);

    // Create audit log
    await createAuditEntry({
        entityType: 'Quotation',
        entityId: quotationId,
        action: 'AI_RESPONSE_PROCESSED',
        previousState: { status: quotation.status },
        newState: {
            status: QUOTATION_STATUS.QUOTED,
            quotedTotal,
            deliveryDate: data.deliveryDate,
            aiAnalysis: data
        },
        userId,
        userName
    });

    HapticService.trigger('notification');

    return {
        success: true,
        analysis,
        quotation: quotations[index]
    };
}

/**
 * Confirm order (one-touch)
 */
export async function confirmOrder(quotationId, userId, userName) {
    const quotation = getQuotationById(quotationId);
    if (!quotation) throw new Error('Quotation not found');

    if (quotation.status !== QUOTATION_STATUS.QUOTED) {
        throw new Error('Can only confirm quoted orders');
    }

    // Generate confirmation email
    const confirmationEmail = await GeminiService.generateConfirmationEmail({
        supplierName: quotation.supplierName,
        orderedItems: quotation.items.map(i => ({
            name: i.productName,
            quantity: i.quantityToOrder,
            unit: i.unit,
            unitPrice: i.quotedUnitPrice || i.estimatedUnitPrice
        })),
        deliveryDate: quotation.deliveryDate
    });

    console.log('📧 Confirmation Email:', confirmationEmail);

    // Update status to ORDERED
    const updated = await updateQuotationStatus(
        quotationId,
        QUOTATION_STATUS.ORDERED,
        {
            confirmedAt: new Date().toISOString(),
            confirmedBy: userId,
            confirmedByName: userName,
            confirmationEmailSent: true
        },
        userId,
        userName
    );

    return {
        quotation: updated,
        email: confirmationEmail
    };
}

/**
 * Confirm receipt of goods
 */
export async function confirmReceipt(quotationId, receiptData = {}, userId, userName) {
    const quotation = getQuotationById(quotationId);
    if (!quotation) throw new Error('Quotation not found');

    // Update status to RECEIVED
    const updated = await updateQuotationStatus(
        quotationId,
        QUOTATION_STATUS.RECEIVED,
        {
            receivedAt: new Date().toISOString(),
            receivedBy: userId,
            receivedByName: userName,
            receiptNotes: receiptData.notes,
            invoiceNumber: receiptData.invoiceNumber,
            actualDeliveryDate: new Date().toISOString()
        },
        userId,
        userName
    );

    // Generate thank you email
    const thankYouEmail = await GeminiService.generateConfirmationEmail({
        supplierName: quotation.supplierName,
        orderedItems: quotation.items,
        deliveryDate: new Date().toLocaleDateString('pt-BR')
    });

    console.log('📧 Thank You Email:', thankYouEmail);

    // Create final audit log with complete order details
    await createAuditEntry({
        entityType: 'Quotation',
        entityId: quotationId,
        action: 'ORDER_COMPLETED',
        newState: {
            status: QUOTATION_STATUS.RECEIVED,
            supplierName: quotation.supplierName,
            items: quotation.items.map(i => ({
                product: i.productName,
                quantity: i.quantityToOrder,
                unitPrice: i.quotedUnitPrice,
                total: i.quantityToOrder * (i.quotedUnitPrice || 0)
            })),
            totalValue: quotation.quotedTotal || quotation.estimatedTotal,
            timeline: {
                created: quotation.createdAt,
                sent: quotation.emailSentAt,
                quoted: quotation.responseReceivedAt,
                confirmed: quotation.confirmedAt,
                received: new Date().toISOString()
            }
        },
        userId,
        userName
    });

    return updated;
}

/**
 * Request follow-up on delayed order
 */
export async function requestFollowUp(quotationId, reason, userId, userName) {
    const quotation = getQuotationById(quotationId);
    if (!quotation) throw new Error('Quotation not found');

    const followUpEmail = await GeminiService.generateFollowUpEmail({
        supplierName: quotation.supplierName,
        reason,
        originalDeliveryDate: quotation.deliveryDate
    });

    console.log('📧 Follow-up Email:', followUpEmail);

    // Log the follow-up
    await updateQuotationStatus(
        quotationId,
        QUOTATION_STATUS.AWAITING,
        {
            followUpSentAt: new Date().toISOString(),
            followUpReason: reason
        },
        userId,
        userName
    );

    return {
        quotation: getQuotationById(quotationId),
        email: followUpEmail
    };
}

// ===================================================================
// STOCK MONITORING (for automation trigger)
// ===================================================================

/**
 * Check products that need reorder
 * This would be called by a Cloud Function in production
 */
export function checkLowStockProducts(products, movements, daysBuffer = 14) {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    return products.filter(product => {
        const currentStock = product.currentStock || 0;
        const minStock = product.minStock || 0;

        // Check if below minimum
        if (currentStock > minStock) return false;

        // Calculate daily consumption
        const productMovements = movements.filter(m =>
            m.productId === product.id &&
            m.type === 'exit' &&
            new Date(m.date || m.createdAt).getTime() >= thirtyDaysAgo
        );

        const totalExits = productMovements.reduce((sum, m) =>
            sum + (Number(m.quantity) || 0), 0
        );
        const dailyRate = totalExits / 30;

        // Calculate how much to order
        const maxStock = product.maxStock || (minStock * 3);
        const quantityToOrder = maxStock - currentStock;

        return {
            ...product,
            dailyRate,
            quantityToOrder,
            daysUntilStockout: dailyRate > 0 ? Math.floor(currentStock / dailyRate) : Infinity,
            urgency: currentStock <= minStock * 0.5 ? 'critical' : 'warning'
        };
    });
}

// ===================================================================
// SERVICE EXPORT
// ===================================================================

export const SmartSourcingService = {
    // Status constants
    STATUS: QUOTATION_STATUS,
    STATUS_COLORS,
    STATUS_LABELS,

    // CRUD
    create: createQuotation,
    getAll: getQuotations,
    getById: getQuotationById,
    getByStatus: getQuotationsByStatus,
    updateStatus: updateQuotationStatus,

    // Email workflow
    sendEmail: sendQuotationEmail,
    processResponse: processSupplierResponse,
    confirm: confirmOrder,
    confirmReceipt: confirmReceipt,
    followUp: requestFollowUp,

    // Stock monitoring
    checkLowStock: checkLowStockProducts
};

export default SmartSourcingService;
