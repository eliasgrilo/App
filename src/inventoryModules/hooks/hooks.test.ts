/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY HOOKS — Unit Tests
 * ═══════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInventoryFilters } from './useInventoryFilters'

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
}> = {}) => ({
    id: 1,
    name: 'Test Item',
    category: 'Ingredientes',
    packageQuantity: 25,
    packageCount: 4,
    pricePerUnit: 10,
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
