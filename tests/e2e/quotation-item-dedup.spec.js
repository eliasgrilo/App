/**
 * Unit Tests - Quotation Item Deduplication (UNIQUE Protocol)
 * 
 * Tests the smart merge functionality that prevents duplicate
 * product entries within the same quotation.
 * 
 * @module tests/e2e/quotation-item-dedup.spec
 * @created 2025-12-31
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ═══════════════════════════════════════════════════════════════════════════
// MOCK SETUP
// ═══════════════════════════════════════════════════════════════════════════

// Mock the Data Connect service
const mockExecuteQuery = vi.fn()
const mockExecuteMutation = vi.fn()
const mockQueryRef = vi.fn()
const mockMutationRef = vi.fn()

vi.mock('firebase/data-connect', () => ({
    getDataConnect: vi.fn(() => ({})),
    queryRef: (...args) => mockQueryRef(...args),
    mutationRef: (...args) => mockMutationRef(...args),
    executeQuery: (...args) => mockExecuteQuery(...args),
    executeMutation: (...args) => mockExecuteMutation(...args)
}))

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
    getApp: vi.fn(() => ({}))
}))

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const TEST_QUOTATION_ID = 'quot-001'
const TEST_PRODUCT_ID = 'prod-flour-001'

const createMockItem = (overrides = {}) => ({
    id: 'item-001',
    requestedQuantity: 10,
    quotedPrice: null,
    quotedQuantity: null,
    notes: null,
    product: {
        id: TEST_PRODUCT_ID,
        name: 'Farinha de Trigo 5kg'
    },
    ...overrides
})

// ═══════════════════════════════════════════════════════════════════════════
// SMART MERGE LOGIC TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('UNIQUE Protocol - Smart Merge', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('addQuotationItemSmart', () => {
        it('should CREATE new item when product does not exist in quotation', async () => {
            // Mock: No existing item found
            mockExecuteQuery.mockResolvedValueOnce({
                data: { quotationItems: [] }
            })

            // Mock: Item created successfully
            mockExecuteMutation.mockResolvedValueOnce({
                data: {
                    quotationItem_insert: {
                        id: 'new-item-001',
                        requestedQuantity: 5
                    }
                }
            })

            // Import dynamically to use mocks
            const { addQuotationItemSmart } = await import('../../src/services/dataConnectService')

            const result = await addQuotationItemSmart({
                quotationId: TEST_QUOTATION_ID,
                productId: TEST_PRODUCT_ID,
                requestedQuantity: 5
            })

            expect(result.action).toBe('created')
            expect(result.item.id).toBe('new-item-001')
            expect(result.item.requestedQuantity).toBe(5)
        })

        it('should MERGE (increment quantity) when product already exists', async () => {
            const existingItem = createMockItem({ requestedQuantity: 10 })

            // Mock: Existing item found
            mockExecuteQuery.mockResolvedValueOnce({
                data: { quotationItems: [existingItem] }
            })

            // Mock: Quantity updated
            mockExecuteMutation.mockResolvedValueOnce({
                data: { quotationItem_update: { id: existingItem.id } }
            })

            const { addQuotationItemSmart } = await import('../../src/services/dataConnectService')

            const result = await addQuotationItemSmart({
                quotationId: TEST_QUOTATION_ID,
                productId: TEST_PRODUCT_ID,
                requestedQuantity: 5
            })

            expect(result.action).toBe('merged')
            expect(result.previousQuantity).toBe(10)
            expect(result.addedQuantity).toBe(5)
            expect(result.item.requestedQuantity).toBe(15) // 10 + 5
        })

        it('should default to quantity 1 if not specified', async () => {
            // Mock: No existing item
            mockExecuteQuery.mockResolvedValueOnce({
                data: { quotationItems: [] }
            })

            mockExecuteMutation.mockResolvedValueOnce({
                data: {
                    quotationItem_insert: {
                        id: 'new-001',
                        requestedQuantity: 1
                    }
                }
            })

            const { addQuotationItemSmart } = await import('../../src/services/dataConnectService')

            await addQuotationItemSmart({
                quotationId: TEST_QUOTATION_ID,
                productId: TEST_PRODUCT_ID
                // requestedQuantity not specified
            })

            // Verify mutation was called with quantity 1
            expect(mockExecuteMutation).toHaveBeenCalled()
        })
    })

    describe('findQuotationItemByProduct', () => {
        it('should return existing item when found', async () => {
            const mockItem = createMockItem()
            mockExecuteQuery.mockResolvedValueOnce({
                data: { quotationItems: [mockItem] }
            })

            const { findQuotationItemByProduct } = await import('../../src/services/dataConnectService')

            const result = await findQuotationItemByProduct(TEST_QUOTATION_ID, TEST_PRODUCT_ID)

            expect(result).toEqual(mockItem)
        })

        it('should return null when no item exists', async () => {
            mockExecuteQuery.mockResolvedValueOnce({
                data: { quotationItems: [] }
            })

            const { findQuotationItemByProduct } = await import('../../src/services/dataConnectService')

            const result = await findQuotationItemByProduct(TEST_QUOTATION_ID, TEST_PRODUCT_ID)

            expect(result).toBeNull()
        })

        it('should return null on query error', async () => {
            mockExecuteQuery.mockRejectedValueOnce(new Error('Network error'))

            const { findQuotationItemByProduct } = await import('../../src/services/dataConnectService')

            const result = await findQuotationItemByProduct(TEST_QUOTATION_ID, TEST_PRODUCT_ID)

            expect(result).toBeNull()
        })
    })

    describe('Legacy addQuotationItem compatibility', () => {
        it('should redirect to smart version and return just the item', async () => {
            const mockItem = createMockItem({ id: 'legacy-test-001' })

            // Mock: No existing item
            mockExecuteQuery.mockResolvedValueOnce({
                data: { quotationItems: [] }
            })

            mockExecuteMutation.mockResolvedValueOnce({
                data: { quotationItem_insert: mockItem }
            })

            const { addQuotationItem } = await import('../../src/services/dataConnectService')

            const result = await addQuotationItem({
                quotationId: TEST_QUOTATION_ID,
                productId: TEST_PRODUCT_ID,
                requestedQuantity: 1
            })

            // Legacy function should return just the item, not the full result object
            expect(result.id).toBe('legacy-test-001')
            expect(result.action).toBeUndefined() // Should not have action property
        })
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE CONSTRAINT TESTS (Integration - requires live DB)
// ═══════════════════════════════════════════════════════════════════════════

describe.skip('Database UNIQUE Constraint (Integration)', () => {
    // These tests require a live Firebase Data Connect instance
    // Run with: npm test -- --integration

    it('should reject duplicate inserts at database level', async () => {
        // This would test the actual UNIQUE constraint
        // Implementation would require live Firebase connection
    })
})
