/**
 * useQuotationFlow - Enterprise-Grade Quotation Management Hook
 * 
 * Combines:
 * - State Machine for validated transitions
 * - Optimistic Updates for instant UI
 * - Analytics tracking
 * - AI predictions
 * 
 * Apple-Quality: Clean API, powerful internals
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { QuotationMachine, QuotationState, QuotationEvent, StateConfig, isFinalState, getStateProgress } from '../services/quotationMachine'
import { useOptimisticList } from '../services/optimisticService'
import { SupplierAnalyticsService } from '../services/supplierAnalyticsService'
import { SupplierPredictorService } from '../services/supplierPredictorService'
import FirebaseService from '../services/firebaseService'
import { HapticService } from '../services/hapticService'

// Haptic mapping for state transitions (Apple HIG)
const TRANSITION_HAPTICS = {
    [QuotationEvent.SEND]: 'impactMedium',
    [QuotationEvent.RECEIVE_REPLY]: 'notification',
    [QuotationEvent.ANALYZE]: 'success',
    [QuotationEvent.CONFIRM]: 'approval',
    [QuotationEvent.DELIVER]: 'success',
    [QuotationEvent.CANCEL]: 'warning',
    [QuotationEvent.EXPIRE]: 'warning',
    [QuotationEvent.RESET]: 'impactLight'
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════════════════════

const QUOTATIONS_STORAGE_KEY = 'padoca_sent_emails'

function loadQuotations() {
    try {
        return JSON.parse(localStorage.getItem(QUOTATIONS_STORAGE_KEY) || '[]')
    } catch { return [] }
}

function saveQuotations(quotations) {
    localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(quotations))
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════

export const useQuotationFlow = (options = {}) => {
    const {
        suppliers = [],
        inventory = [],
        onStateChange,
        enableFirestore = true
    } = options

    // Initialize with stored quotations
    const initialQuotations = useMemo(() => loadQuotations(), [])

    // Optimistic list for instant UI updates
    const {
        list: quotations,
        setList: setQuotations,
        addOptimistic,
        updateOptimistic,
        removeOptimistic,
        hasPendingOps,
        rollback
    } = useOptimisticList(initialQuotations)

    // Machine instances cache
    const machinesRef = useRef(new Map())

    // ═══════════════════════════════════════════════════════════════════════
    // MACHINE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get or create state machine for a quotation
     */
    const getMachine = useCallback((quotationId) => {
        if (machinesRef.current.has(quotationId)) {
            return machinesRef.current.get(quotationId)
        }

        const quotation = quotations.find(q => q.id === quotationId)
        if (!quotation) return null

        const machine = QuotationMachine.fromJSON(quotation)
        machinesRef.current.set(quotationId, machine)
        return machine
    }, [quotations])

    /**
     * Execute a state transition with optimistic update
     */
    const transition = useCallback(async (quotationId, event, payload = {}) => {
        const machine = getMachine(quotationId)
        if (!machine) {
            return { success: false, error: 'Cotação não encontrada' }
        }

        // Check if transition is valid
        const canTransition = machine.canTransition(event, payload)
        if (!canTransition.valid) {
            return { success: false, error: canTransition.error }
        }

        // Execute transition
        const result = machine.send(event, payload)
        if (!result.success) {
            HapticService.trigger('error')
            return result
        }

        // Apple HIG: Haptic feedback on successful state change
        const hapticType = TRANSITION_HAPTICS[event] || 'selection'
        HapticService.trigger(hapticType)

        // Optimistic update
        const updatedQuotation = machine.toJSON()

        await updateOptimistic(
            `Transition ${event}`,
            quotationId,
            () => updatedQuotation,
            async () => {
                // Persist
                const current = loadQuotations()
                const updated = current.map(q =>
                    q.id === quotationId ? updatedQuotation : q
                )
                saveQuotations(updated)

                // Sync to Firestore
                if (enableFirestore) {
                    try {
                        await FirebaseService.updateQuotation?.(quotationId, updatedQuotation)
                    } catch (e) {
                        console.error('❌ Firestore sync failed:', e)
                        // Emit event for monitoring/retry - allows external error tracking
                        window.dispatchEvent(new CustomEvent('firestore-sync-error', {
                            detail: {
                                quotationId,
                                error: e.message || 'Unknown error',
                                timestamp: Date.now(),
                                operation: 'update'
                            }
                        }))
                    }
                }

                return updatedQuotation
            }
        )

        // Notify callback
        onStateChange?.(quotationId, result.snapshot)

        return result
    }, [getMachine, updateOptimistic, enableFirestore, onStateChange])

    // ═══════════════════════════════════════════════════════════════════════
    // CRUD OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Create a new quotation
     */
    const createQuotation = useCallback(async ({
        supplierId,
        supplierName,
        supplierEmail,
        items
    }) => {
        const machine = new QuotationMachine({
            supplierId,
            supplierName,
            supplierEmail,
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                quantityToOrder: item.quantityToOrder || item.neededQuantity,
                unit: item.unit,
                currentPrice: item.currentPrice
            }))
        })

        const quotation = machine.toJSON()

        await addOptimistic(
            quotation,
            async (q) => {
                const current = loadQuotations()
                saveQuotations([q, ...current])

                if (enableFirestore) {
                    try {
                        await FirebaseService.addQuotation?.(q)
                    } catch (e) {
                        console.warn('Firestore sync failed:', e)
                    }
                }

                return q
            }
        )

        machinesRef.current.set(quotation.id, machine)
        return quotation
    }, [addOptimistic, enableFirestore])

    /**
     * Delete a quotation (items return to pending)
     */
    const deleteQuotation = useCallback(async (quotationId) => {
        await removeOptimistic(
            quotationId,
            async () => {
                const current = loadQuotations()
                saveQuotations(current.filter(q => q.id !== quotationId))

                if (enableFirestore) {
                    try {
                        await FirebaseService.deleteQuotation?.(quotationId)
                    } catch (e) {
                        console.warn('Firestore delete failed:', e)
                    }
                }
            }
        )

        machinesRef.current.delete(quotationId)
        return { success: true }
    }, [removeOptimistic, enableFirestore])

    // ═══════════════════════════════════════════════════════════════════════
    // CONVENIENCE METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Send a quotation (draft → sent)
     */
    const sendQuotation = useCallback(async (quotationId, emailPayload) => {
        return transition(quotationId, QuotationEvent.SEND, emailPayload)
    }, [transition])

    /**
     * Record supplier reply (sent → replied)
     */
    const recordReply = useCallback(async (quotationId, emailBody, from) => {
        return transition(quotationId, QuotationEvent.RECEIVE_REPLY, { emailBody, from })
    }, [transition])

    /**
     * Analyze reply with AI (replied → quoted)
     */
    const analyzeReply = useCallback(async (quotationId, analysisResult) => {
        return transition(quotationId, QuotationEvent.ANALYZE, analysisResult)
    }, [transition])

    /**
     * Confirm order (quoted → confirmed)
     */
    const confirmOrder = useCallback(async (quotationId) => {
        return transition(quotationId, QuotationEvent.CONFIRM)
    }, [transition])

    /**
     * Mark as delivered (confirmed → delivered)
     */
    const markDelivered = useCallback(async (quotationId, deliveryPayload) => {
        return transition(quotationId, QuotationEvent.DELIVER, deliveryPayload)
    }, [transition])

    /**
     * Cancel quotation
     */
    const cancelQuotation = useCallback(async (quotationId, reason) => {
        return transition(quotationId, QuotationEvent.CANCEL, { reason })
    }, [transition])

    // ═══════════════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get quotations by status(es)
     */
    const getByStatus = useCallback((status) => {
        const statuses = Array.isArray(status) ? status : [status]
        return quotations.filter(q => statuses.includes(q.status))
    }, [quotations])

    /**
     * Get quotations by supplier
     */
    const getBySupplier = useCallback((supplierId) => {
        return quotations.filter(q => q.supplierId === supplierId)
    }, [quotations])

    /**
     * Get active quotations (not final state)
     */
    const activeQuotations = useMemo(() => {
        return quotations.filter(q => !isFinalState(q.status))
    }, [quotations])

    /**
     * Get counts by status
     */
    const statusCounts = useMemo(() => {
        const counts = {}
        Object.values(QuotationState).forEach(state => {
            counts[state] = quotations.filter(q => q.status === state).length
        })
        return counts
    }, [quotations])

    // ═══════════════════════════════════════════════════════════════════════
    // AI & ANALYTICS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get AI insight report
     */
    const getAIInsights = useCallback(() => {
        return SupplierPredictorService.generateInsightReport(inventory, suppliers)
    }, [inventory, suppliers])

    /**
     * Get supplier analytics
     */
    const getSupplierAnalytics = useCallback((supplierId) => {
        return SupplierAnalyticsService.getSupplierAnalytics(supplierId, suppliers)
    }, [suppliers])

    /**
     * Get all suppliers ranked
     */
    const getSupplierRanking = useCallback(() => {
        return SupplierAnalyticsService.getAllSuppliersAnalytics(suppliers)
    }, [suppliers])

    /**
     * Get best supplier for item
     */
    const getBestSupplierForItem = useCallback((itemId) => {
        return SupplierPredictorService.getBestSupplierForItem(itemId, suppliers)
    }, [suppliers])

    /**
     * Get price anomalies
     */
    const getPriceAnomalies = useCallback(() => {
        return SupplierPredictorService.getPriceAnomalies()
    }, [])

    /**
     * Get restock recommendations
     */
    const getRestockRecommendations = useCallback(() => {
        return SupplierPredictorService.getRestockRecommendations(inventory, suppliers)
    }, [inventory, suppliers])

    // ═══════════════════════════════════════════════════════════════════════
    // SYNC
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Sync with localStorage
     */
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === QUOTATIONS_STORAGE_KEY) {
                setQuotations(JSON.parse(e.newValue || '[]'))
            }
        }
        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
    }, [setQuotations])

    // ═══════════════════════════════════════════════════════════════════════
    // RETURN
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // State
        quotations,
        statusCounts,
        activeQuotations,
        hasPendingOps,

        // CRUD
        createQuotation,
        deleteQuotation,

        // Transitions
        transition,
        sendQuotation,
        recordReply,
        analyzeReply,
        confirmOrder,
        markDelivered,
        cancelQuotation,

        // Queries
        getByStatus,
        getBySupplier,
        getMachine,

        // AI & Analytics
        getAIInsights,
        getSupplierAnalytics,
        getSupplierRanking,
        getBestSupplierForItem,
        getPriceAnomalies,
        getRestockRecommendations,

        // Utils
        rollback,

        // Constants
        QuotationState,
        QuotationEvent,
        StateConfig,
        getStateProgress
    }
}

export default useQuotationFlow
