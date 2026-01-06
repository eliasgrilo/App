/**
 * ═══════════════════════════════════════════════════════════════════
 * useInventoryFilters — Inventory Filtering Hook
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Provides search and filter functionality for inventory items.
 * 
 * @module inventory/hooks/useInventoryFilters
 */

import { useState, useMemo, useCallback } from 'react'
import { getStockStatus, type StockStatus } from '../../services/stockService'

type SortField = 'name' | 'stock' | 'value' | 'category' | 'expiry'
type SortDirection = 'asc' | 'desc'

interface InventoryItem {
    id: number
    name: string
    category?: string
    packageQuantity?: number
    packageCount?: number
    pricePerUnit?: number
    expiryDate?: string | null
}

interface FilterState {
    search: string
    category: string
    stockStatus: StockStatus | 'all'
    sortField: SortField
    sortDirection: SortDirection
}

interface InventoryFiltersResult<T extends InventoryItem> {
    /** Filtered and sorted items */
    filteredItems: T[]
    /** Current filter state */
    filters: FilterState
    /** Update search query */
    setSearch: (search: string) => void
    /** Update category filter */
    setCategory: (category: string) => void
    /** Update stock status filter */
    setStockStatus: (status: StockStatus | 'all') => void
    /** Update sort field */
    setSortField: (field: SortField) => void
    /** Toggle sort direction */
    toggleSortDirection: () => void
    /** Reset all filters */
    resetFilters: () => void
    /** Count of active filters */
    activeFilterCount: number
}

const defaultFilters: FilterState = {
    search: '',
    category: 'all',
    stockStatus: 'all',
    sortField: 'name',
    sortDirection: 'asc'
}

/**
 * Hook for inventory filtering and sorting.
 * 
 * @param items - Array of inventory items
 * @returns Filtered items and filter controls
 * 
 * @example
 * const { filteredItems, setSearch, setCategory } = useInventoryFilters(items)
 */
export function useInventoryFilters<T extends InventoryItem>(
    items: T[]
): InventoryFiltersResult<T> {
    const [filters, setFilters] = useState<FilterState>(defaultFilters)

    const filteredItems = useMemo(() => {
        let result = [...items]

        // Search filter
        if (filters.search) {
            const query = filters.search.toLowerCase()
            result = result.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.category?.toLowerCase().includes(query)
            )
        }

        // Category filter
        if (filters.category !== 'all') {
            result = result.filter(item => item.category === filters.category)
        }

        // Stock status filter
        if (filters.stockStatus !== 'all') {
            result = result.filter(item => getStockStatus(item) === filters.stockStatus)
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0
            switch (filters.sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name)
                    break
                case 'stock':
                    const stockA = (a.packageQuantity || 0) * (a.packageCount || 1)
                    const stockB = (b.packageQuantity || 0) * (b.packageCount || 1)
                    comparison = stockA - stockB
                    break
                case 'value':
                    const valueA = (a.packageQuantity || 0) * (a.packageCount || 1) * (a.pricePerUnit || 0)
                    const valueB = (b.packageQuantity || 0) * (b.packageCount || 1) * (b.pricePerUnit || 0)
                    comparison = valueA - valueB
                    break
                case 'category':
                    comparison = (a.category || '').localeCompare(b.category || '')
                    break
                case 'expiry':
                    const expiryA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity
                    const expiryB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity
                    comparison = expiryA - expiryB
                    break
            }
            return filters.sortDirection === 'desc' ? -comparison : comparison
        })

        return result
    }, [items, filters])

    const setSearch = useCallback((search: string) => {
        setFilters(f => ({ ...f, search }))
    }, [])

    const setCategory = useCallback((category: string) => {
        setFilters(f => ({ ...f, category }))
    }, [])

    const setStockStatus = useCallback((stockStatus: StockStatus | 'all') => {
        setFilters(f => ({ ...f, stockStatus }))
    }, [])

    const setSortField = useCallback((sortField: SortField) => {
        setFilters(f => ({ ...f, sortField }))
    }, [])

    const toggleSortDirection = useCallback(() => {
        setFilters(f => ({
            ...f,
            sortDirection: f.sortDirection === 'asc' ? 'desc' : 'asc'
        }))
    }, [])

    const resetFilters = useCallback(() => {
        setFilters(defaultFilters)
    }, [])

    const activeFilterCount = useMemo(() => {
        let count = 0
        if (filters.search) count++
        if (filters.category !== 'all') count++
        if (filters.stockStatus !== 'all') count++
        return count
    }, [filters])

    return {
        filteredItems,
        filters,
        setSearch,
        setCategory,
        setStockStatus,
        setSortField,
        toggleSortDirection,
        resetFilters,
        activeFilterCount
    }
}

export default useInventoryFilters
