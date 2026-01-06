/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY HOOKS — Unit Tests
 * ═══════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInventoryFilters } from './useInventoryFilters'
import { useExpiryMonitoring } from './useExpiryMonitoring'

// ═══════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════

const createItem = (overrides: Partial<{
    id: number
    name: string
    category: string
    packageQuantity: number
    packageCount: number
    pricePerUnit: number
    expiryDate: string | null
}> = {}) => ({
    id: 1,
    name: 'Test Item',
    category: 'Ingredientes',
    packageQuantity: 25,
    packageCount: 4,
    pricePerUnit: 10,
    expiryDate: null as string | null,
    ...overrides,
})

const mockItems = [
    createItem({ id: 1, name: 'Farinha', category: 'Ingredientes' }),
    createItem({ id: 2, name: 'Açúcar', category: 'Ingredientes' }),
    createItem({ id: 3, name: 'Caixa Pizza', category: 'Embalagens' }),
]

// ═══════════════════════════════════════════════════════════════════
// useInventoryFilters
// ═══════════════════════════════════════════════════════════════════

describe('useInventoryFilters', () => {
    it('returns all items when no filters applied', () => {
        const { result } = renderHook(() => useInventoryFilters(mockItems))
        expect(result.current.filteredItems).toHaveLength(3)
    })

    it('filters by search query', () => {
        const { result } = renderHook(() => useInventoryFilters(mockItems))

        act(() => {
            result.current.setSearch('Farinha')
        })

        expect(result.current.filteredItems).toHaveLength(1)
        expect(result.current.filteredItems[0]!.name).toBe('Farinha')
    })

    it('filters by category', () => {
        const { result } = renderHook(() => useInventoryFilters(mockItems))

        act(() => {
            result.current.setCategory('Embalagens')
        })

        expect(result.current.filteredItems).toHaveLength(1)
        expect(result.current.filteredItems[0]!.name).toBe('Caixa Pizza')
    })

    it('resets filters', () => {
        const { result } = renderHook(() => useInventoryFilters(mockItems))

        act(() => {
            result.current.setSearch('test')
            result.current.setCategory('Embalagens')
        })

        expect(result.current.activeFilterCount).toBe(2)

        act(() => {
            result.current.resetFilters()
        })

        expect(result.current.activeFilterCount).toBe(0)
        expect(result.current.filteredItems).toHaveLength(3)
    })

    it('sorts by name ascending', () => {
        const { result } = renderHook(() => useInventoryFilters(mockItems))

        expect(result.current.filteredItems[0]!.name).toBe('Açúcar')
        expect(result.current.filteredItems[1]!.name).toBe('Caixa Pizza')
        expect(result.current.filteredItems[2]!.name).toBe('Farinha')
    })

    it('toggles sort direction', () => {
        const { result } = renderHook(() => useInventoryFilters(mockItems))

        act(() => {
            result.current.toggleSortDirection()
        })

        expect(result.current.filters.sortDirection).toBe('desc')
        expect(result.current.filteredItems[0]!.name).toBe('Farinha')
    })
})

// ═══════════════════════════════════════════════════════════════════
// useExpiryMonitoring
// ═══════════════════════════════════════════════════════════════════

describe('useExpiryMonitoring', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)

    const nearDate = new Date()
    nearDate.setDate(nearDate.getDate() + 2)

    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 5)

    const itemsWithExpiry = [
        createItem({ id: 1, name: 'OK Item', expiryDate: futureDate.toISOString() }),
        createItem({ id: 2, name: 'Critical Item', expiryDate: nearDate.toISOString() }),
        createItem({ id: 3, name: 'Expired Item', expiryDate: expiredDate.toISOString() }),
        createItem({ id: 4, name: 'No Expiry Item', expiryDate: null }),
    ]

    it('separates items with and without expiry dates', () => {
        const { result } = renderHook(() => useExpiryMonitoring(itemsWithExpiry))

        expect(result.current.itemsWithExpiry).toHaveLength(3)
        expect(result.current.itemsWithoutExpiry).toHaveLength(1)
    })

    it('sorts by urgency (most urgent first)', () => {
        const { result } = renderHook(() => useExpiryMonitoring(itemsWithExpiry))

        expect(result.current.itemsWithExpiry[0]!.item.name).toBe('Expired Item')
        expect(result.current.itemsWithExpiry[1]!.item.name).toBe('Critical Item')
        expect(result.current.itemsWithExpiry[2]!.item.name).toBe('OK Item')
    })

    it('identifies most urgent item', () => {
        const { result } = renderHook(() => useExpiryMonitoring(itemsWithExpiry))

        expect(result.current.mostUrgent?.item.name).toBe('Expired Item')
        expect(result.current.mostUrgent?.expiryData.status).toBe('expired')
    })

    it('calculates stats correctly', () => {
        const { result } = renderHook(() => useExpiryMonitoring(itemsWithExpiry))

        expect(result.current.stats.expiredCount).toBe(1)
        expect(result.current.stats.criticalCount).toBe(1)
        expect(result.current.stats.okCount).toBe(1)
        expect(result.current.stats.noExpiryCount).toBe(1)
        expect(result.current.stats.totalMonitored).toBe(3)
    })

    it('returns null mostUrgent when no items have expiry', () => {
        const noExpiryItems = [
            createItem({ id: 1, expiryDate: null }),
            createItem({ id: 2, expiryDate: null }),
        ]

        const { result } = renderHook(() => useExpiryMonitoring(noExpiryItems))

        expect(result.current.mostUrgent).toBeNull()
        expect(result.current.itemsWithExpiry).toHaveLength(0)
    })
})
