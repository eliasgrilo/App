/**
 * ═══════════════════════════════════════════════════════════════════
 * USE NEW ITEM FORM — Hook for managing new item form state
 * Encapsulates form state, validation, and supplier search
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState, useMemo, useCallback } from 'react'
import { Supplier } from '../../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface NewItemState {
    name: string
    packageQuantity: string
    packageCount: string
    unit: string
    pricePerUnit: string
    category: string
    subcategory: string
    purchaseDate: string
    supplierId: string | null
    supplierName: string
    minStock: string
    maxStock: string
    enableAutoQuotation: boolean
    leadTimeDays: number
    shelfLifeDays: string
    barcode: string
}

interface UseNewItemFormReturn {
    newItem: NewItemState
    setNewItem: React.Dispatch<React.SetStateAction<NewItemState>>
    supplierSearchQuery: string
    setSupplierSearchQuery: (query: string) => void
    showSupplierDropdown: boolean
    setShowSupplierDropdown: (show: boolean) => void
    filteredSuppliers: Supplier[]
    isExactSupplierMatch: (searchTerm: string, supplierName: string) => boolean
    resetForm: () => void
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

const createDefaultNewItem = (): NewItemState => ({
    name: '',
    packageQuantity: '',
    packageCount: '1',
    unit: 'kg',
    pricePerUnit: '',
    category: 'Ingredientes',
    subcategory: 'Outros Ingredientes',
    purchaseDate: new Date().toISOString().split('T')[0] || '',
    supplierId: null,
    supplierName: '',
    minStock: '',
    maxStock: '',
    enableAutoQuotation: false,
    leadTimeDays: 3,
    shelfLifeDays: '',
    barcode: ''
})

export function useNewItemForm(suppliers: Supplier[]): UseNewItemFormReturn {
    const [newItem, setNewItem] = useState<NewItemState>(createDefaultNewItem())
    const [supplierSearchQuery, setSupplierSearchQuery] = useState('')
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)

    // Helper: Check if supplier name matches exactly
    const isExactSupplierMatch = useCallback((searchTerm: string, supplierName: string): boolean => {
        if (!searchTerm || !supplierName) return false
        const normalizedSearch = searchTerm.trim().toLowerCase()
        const normalizedSupplier = supplierName.trim().toLowerCase()
        const searchWords = normalizedSearch.split(/\s+/).filter((w: string) => w.length > 0)
        const supplierWords = normalizedSupplier.split(/\s+/).filter((w: string) => w.length > 0)
        return normalizedSearch === normalizedSupplier && searchWords.length === supplierWords.length
    }, [])

    // Filter suppliers based on search
    const filteredSuppliers = useMemo(() => {
        const query = supplierSearchQuery.trim().toLowerCase()
        if (query.length < 2) return []
        return suppliers.filter((s: Supplier) =>
            s.name?.toLowerCase().includes(query)
        ).slice(0, 8)
    }, [suppliers, supplierSearchQuery])

    // Reset form to defaults
    const resetForm = useCallback(() => {
        setNewItem(createDefaultNewItem())
        setSupplierSearchQuery('')
        setShowSupplierDropdown(false)
    }, [])

    return {
        newItem,
        setNewItem,
        supplierSearchQuery,
        setSupplierSearchQuery,
        showSupplierDropdown,
        setShowSupplierDropdown,
        filteredSuppliers,
        isExactSupplierMatch,
        resetForm
    }
}

export default useNewItemForm
