/**
 * E2E Tests - Cross-Column Duplicate Prevention
 * 
 * Tests the critical bug fix preventing quotation cards from appearing
 * in both "Aguardando" and "Ordens" columns simultaneously.
 * 
 * @module tests/e2e/cross-column-dedup.spec
 * @created 2025-01-01
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QUOTATION_STATUS } from '../../src/services/smartSourcingService'

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const createTestQuotation = (overrides = {}) => ({
    id: `quot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    supplierId: 'supplier_001',
    supplierName: 'Test Supplier',
    supplierEmail: 'test@supplier.com',
    status: QUOTATION_STATUS.PENDING,
    items: [
        { productId: 'prod_001', productName: 'Flour', quantityToOrder: 10, unit: 'kg' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
})

const createTestOrder = (quotationId, overrides = {}) => ({
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    quotationId,
    supplierId: 'supplier_001',
    supplierName: 'Test Supplier',
    status: 'confirmed',
    items: [
        { productId: 'prod_001', productName: 'Flour', quantity: 10, unitPrice: 5.0 }
    ],
    createdAt: new Date().toISOString(),
    ...overrides
})

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-COLUMN FILTERING TESTS (UI Logic)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Cross-Column Duplicate Prevention', () => {
    describe('filteredQuotations Logic', () => {
        /**
         * Simulates the filterQuotations logic from SmartSourcingWorkflow.jsx
         * This is a unit test for the core filtering algorithm
         */
        const filterForPendingTab = (quotations, orders) => {
            const pendingStatuses = [QUOTATION_STATUS.PENDING, QUOTATION_STATUS.AWAITING]

            // Build set of quotation IDs that have orders (core of the fix)
            const quotationIdsWithOrders = new Set(
                orders.map(o => o.quotationId).filter(Boolean)
            )

            // First filter by status
            const statusFiltered = quotations.filter(q => pendingStatuses.includes(q.status))

            // Then apply cross-column uniqueness check
            return statusFiltered.filter(q => {
                if (quotationIdsWithOrders.has(q.id)) return false
                if (q.orderId) return false
                return true
            })
        }

        it('should show quotation in Aguardando when no order exists', () => {
            const quotation = createTestQuotation({ status: QUOTATION_STATUS.PENDING })
            const orders = []

            const result = filterForPendingTab([quotation], orders)

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe(quotation.id)
        })

        it('should HIDE quotation from Aguardando when order exists in orders collection', () => {
            const quotation = createTestQuotation({
                id: 'quot_orphaned',
                status: QUOTATION_STATUS.PENDING  // Status wasn't updated (BUG SCENARIO)
            })
            const order = createTestOrder('quot_orphaned')  // But order exists

            const result = filterForPendingTab([quotation], [order])

            expect(result).toHaveLength(0)  // The bug fix: card should NOT appear in Aguardando
        })

        it('should HIDE quotation from Aguardando when orderId is set on quotation', () => {
            const quotation = createTestQuotation({
                status: QUOTATION_STATUS.AWAITING,
                orderId: 'order_123'  // Has orderId but wrong status
            })
            const orders = []

            const result = filterForPendingTab([quotation], orders)

            expect(result).toHaveLength(0)
        })

        it('should correctly filter when multiple quotations exist', () => {
            // 3 quotations: 1 valid pending, 1 with order, 1 with orderId
            const quotations = [
                createTestQuotation({ id: 'quot_valid', status: QUOTATION_STATUS.PENDING }),
                createTestQuotation({ id: 'quot_has_order', status: QUOTATION_STATUS.PENDING }),
                createTestQuotation({ id: 'quot_has_orderId', status: QUOTATION_STATUS.AWAITING, orderId: 'order_xyz' })
            ]
            const orders = [
                createTestOrder('quot_has_order')
            ]

            const result = filterForPendingTab(quotations, orders)

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('quot_valid')
        })
    })

    describe('tabCounts Consistency', () => {
        const calculatePendingCount = (quotations, orders) => {
            const pendingStatuses = [QUOTATION_STATUS.PENDING, QUOTATION_STATUS.AWAITING]

            const quotationIdsWithOrders = new Set(
                orders.map(o => o.quotationId).filter(Boolean)
            )

            const statusFiltered = quotations.filter(q => pendingStatuses.includes(q.status))
            const crossColumnFiltered = statusFiltered.filter(q =>
                !quotationIdsWithOrders.has(q.id) && !q.orderId
            )

            return crossColumnFiltered.length
        }

        it('should return correct count excluding orphaned quotations', () => {
            const quotations = [
                createTestQuotation({ id: 'quot_1', status: QUOTATION_STATUS.PENDING }),
                createTestQuotation({ id: 'quot_2', status: QUOTATION_STATUS.PENDING }),
                createTestQuotation({ id: 'quot_orphaned', status: QUOTATION_STATUS.PENDING })
            ]
            const orders = [
                createTestOrder('quot_orphaned')
            ]

            const count = calculatePendingCount(quotations, orders)

            expect(count).toBe(2)  // Only 2 valid pending quotations
        })
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// RECONCILIATION TESTS (AtomicQuotationTransitionService Logic)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Column Uniqueness Enforcement', () => {
    describe('enforceColumnUniqueness Logic', () => {
        /**
         * Simulates the enforcementColumnUniqueness detection logic
         */
        const detectOrphanedQuotations = (quotations, orders) => {
            const quotationIdsWithOrders = new Set()
            const ordersByQuotationId = new Map()

            orders.forEach(order => {
                if (order.quotationId) {
                    quotationIdsWithOrders.add(order.quotationId)
                    ordersByQuotationId.set(order.quotationId, order)
                }
            })

            const orphaned = quotations.filter(q => {
                // Skip if already in correct state
                const orderedStates = [QUOTATION_STATUS.ORDERED, QUOTATION_STATUS.RECEIVED, 'ordered', 'received']
                if (orderedStates.includes(q.status)) return false

                // Check if this quotation has an order but wrong status
                return quotationIdsWithOrders.has(q.id)
            })

            return orphaned.map(q => ({
                quotationId: q.id,
                orderId: ordersByQuotationId.get(q.id).id,
                previousStatus: q.status
            }))
        }

        it('should detect orphaned quotations', () => {
            const quotations = [
                createTestQuotation({ id: 'quot_normal', status: QUOTATION_STATUS.PENDING }),
                createTestQuotation({ id: 'quot_orphaned', status: QUOTATION_STATUS.AWAITING }),
                createTestQuotation({ id: 'quot_correct', status: QUOTATION_STATUS.ORDERED, orderId: 'order_3' })
            ]
            const orders = [
                createTestOrder('quot_orphaned', { id: 'order_2' }),
                createTestOrder('quot_correct', { id: 'order_3' })
            ]

            const orphaned = detectOrphanedQuotations(quotations, orders)

            expect(orphaned).toHaveLength(1)
            expect(orphaned[0].quotationId).toBe('quot_orphaned')
            expect(orphaned[0].orderId).toBe('order_2')
            expect(orphaned[0].previousStatus).toBe(QUOTATION_STATUS.AWAITING)
        })

        it('should not flag correctly-ordered quotations', () => {
            const quotations = [
                createTestQuotation({ id: 'quot_1', status: QUOTATION_STATUS.ORDERED, orderId: 'order_1' }),
                createTestQuotation({ id: 'quot_2', status: QUOTATION_STATUS.RECEIVED, orderId: 'order_2' })
            ]
            const orders = [
                createTestOrder('quot_1', { id: 'order_1' }),
                createTestOrder('quot_2', { id: 'order_2' })
            ]

            const orphaned = detectOrphanedQuotations(quotations, orders)

            expect(orphaned).toHaveLength(0)
        })
    })
})
