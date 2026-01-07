/**
 * ═══════════════════════════════════════════════════════════════════
 * useInventoryState — Centralized UI state management
 * Encapsulates all local state from Inventory.tsx
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState } from 'react'
import type { InventoryItem } from '../types'
import { DEFAULT_CATEGORIES, DEFAULT_SUBCATEGORIES } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface InventoryStateReturn {
    // Modal states
    movementModalOpen: boolean
    setMovementModalOpen: (v: boolean) => void
    isAddingItem: boolean
    setIsAddingItem: (v: boolean) => void
    isManagingCategories: boolean
    setIsManagingCategories: (v: boolean) => void
    configuringItem: InventoryItem | null
    setConfiguringItem: (v: InventoryItem | null) => void

    // Filter states
    searchQuery: string
    setSearchQuery: (v: string) => void
    activeSubcategoryFilter: string | null
    setActiveSubcategoryFilter: (v: string | null) => void
    stockFilter: string
    setStockFilter: (v: string) => void

    // Data states
    categories: string[]
    setCategories: React.Dispatch<React.SetStateAction<string[]>>
    subcategories: Record<string, string[]>
    setSubcategories: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useInventoryState(): InventoryStateReturn {
    // Modal states
    const [movementModalOpen, setMovementModalOpen] = useState(false)
    const [isAddingItem, setIsAddingItem] = useState(false)
    const [isManagingCategories, setIsManagingCategories] = useState(false)
    const [configuringItem, setConfiguringItem] = useState<InventoryItem | null>(null)

    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState<string | null>('None')
    const [stockFilter, setStockFilter] = useState('alerts')

    // Data states (categories/subcategories)
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
    const [subcategories, setSubcategories] = useState(DEFAULT_SUBCATEGORIES)

    return {
        // Modal states
        movementModalOpen,
        setMovementModalOpen,
        isAddingItem,
        setIsAddingItem,
        isManagingCategories,
        setIsManagingCategories,
        configuringItem,
        setConfiguringItem,

        // Filter states
        searchQuery,
        setSearchQuery,
        activeSubcategoryFilter,
        setActiveSubcategoryFilter,
        stockFilter,
        setStockFilter,

        // Data states
        categories,
        setCategories,
        subcategories,
        setSubcategories
    }
}

export default useInventoryState
