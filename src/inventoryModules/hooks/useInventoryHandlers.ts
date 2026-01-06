/**
 * ═══════════════════════════════════════════════════════════════════
 * useInventoryHandlers — CRUD operations for inventory
 * Encapsulates all handler functions from Inventory.tsx
 * ═══════════════════════════════════════════════════════════════════
 */

import { useCallback } from 'react'
import type { InventoryItem } from '../types'
import type { ID, NewIngredient, IngredientUpdate } from '../../types'
import type { NewItemState } from './useNewItemForm'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ModalContextType {
    confirm: (opts: {
        title: string
        message: string
        isDangerous?: boolean
        onConfirm: () => void
    }) => void
}

export interface ToastContextType {
    success: (msg: string) => void
    error: (msg: string) => void
    info: (msg: string) => void
}

export interface UseInventoryHandlersProps {
    items: InventoryItem[]
    addIngredient: (item: NewIngredient) => void
    updateIngredient: (id: ID, update: IngredientUpdate) => void
    deleteStockMovement: (id: string) => void
    newItem: NewItemState
    setNewItem: React.Dispatch<React.SetStateAction<NewItemState>>
    setSupplierSearchQuery: (v: string) => void
    setIsAddingItem: (v: boolean) => void
    setItems: (updater: (prev: InventoryItem[]) => InventoryItem[]) => void
    modal: ModalContextType
    toast: ToastContextType
}

export interface InventoryHandlersReturn {
    handleAddItem: () => void
    handleUpdateItem: (id: ID, field: string, value: string | number) => void
    handleDeleteItem: (id: ID) => void
    removeMovement: (m: { id: number | string; itemName: string }) => void
    showToast: (message: string, type?: string) => void
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useInventoryHandlers({
    items,
    addIngredient,
    updateIngredient,
    deleteStockMovement,
    newItem,
    setNewItem,
    setSupplierSearchQuery,
    setIsAddingItem,
    setItems,
    modal,
    toast
}: UseInventoryHandlersProps): InventoryHandlersReturn {

    /**
     * Show toast notification with type
     */
    const showToast = useCallback((message: string, type: string = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    /**
     * Remove movement with confirmation
     */
    const removeMovement = useCallback((m: { id: number | string; itemName: string }) => {
        modal.confirm({
            title: 'Excluir Movimentação',
            message: `A movimentação "${m.itemName}" será removida permanentemente.`,
            isDangerous: true,
            onConfirm: () => {
                deleteStockMovement(String(m.id))
                toast.success('Excluído')
            }
        })
    }, [modal, deleteStockMovement, toast])

    /**
     * Add new item to inventory
     */
    const handleAddItem = useCallback(() => {
        if (!newItem.name.trim()) return

        const item = {
            id: Date.now(),
            name: newItem.name.trim(),
            packageQuantity: Number(newItem.packageQuantity) || 0,
            packageCount: Number(newItem.packageCount) || 1,
            unit: newItem.unit,
            pricePerUnit: Number(newItem.pricePerUnit) || 0,
            category: newItem.category,
            subcategory: newItem.category === 'Ingredientes' ? newItem.subcategory : null,
            purchaseDate: newItem.purchaseDate,
            supplierId: newItem.supplierId,
            supplierName: newItem.supplierName,
            minStock: Number(newItem.minStock) || 0,
            maxStock: Number(newItem.maxStock) || 0,
            enableAutoQuotation: newItem.enableAutoQuotation || false,
            leadTimeDays: Number(newItem.leadTimeDays) || 3,
            shelfLifeDays: Number(newItem.shelfLifeDays) || null,
            barcode: newItem.barcode?.trim() || null,
            createdAt: new Date().toISOString()
        }

        setItems(prev => [...prev, item as InventoryItem])
        setNewItem({
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
        setSupplierSearchQuery('')
        setIsAddingItem(false)
    }, [newItem, setItems, setNewItem, setSupplierSearchQuery, setIsAddingItem])

    /**
     * Update item field
     */
    const handleUpdateItem = useCallback((id: ID, field: string, value: string | number): void => {
        setItems((prev: InventoryItem[]) => prev.map((item: InventoryItem) => {
            if (item.id !== id) return item
            return {
                ...item,
                [field]: ['name', 'unit', 'category', 'subcategory', 'purchaseDate'].includes(field)
                    ? value
                    : Number(value) || 0
            }
        }))
    }, [setItems])

    /**
     * Delete item with confirmation
     */
    const handleDeleteItem = useCallback((id: ID): void => {
        modal.confirm({
            title: 'Excluir Item',
            message: 'Este item será removido permanentemente do estoque.',
            isDangerous: true,
            onConfirm: () => {
                setItems((prev: InventoryItem[]) => prev.filter((item: InventoryItem) => item.id !== id))
            }
        })
    }, [modal, setItems])

    return {
        handleAddItem,
        handleUpdateItem,
        handleDeleteItem,
        removeMovement,
        showToast
    }
}

export default useInventoryHandlers
