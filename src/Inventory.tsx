import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

import { motion, AnimatePresence } from 'framer-motion'
import AddIngredientModal from './components/AddIngredientModal'
import { useCurrency } from './contexts/CurrencyContext'
import { useModal } from './contexts/ModalContext'
import { useToast } from './contexts/ToastContext'
import ModalScrollLock from './components/ModalScrollLock'
import { useAppStore, useIngredients, useSuppliers, useStockMovements } from './stores/useAppStore'
import { Supplier, ID, NewIngredient, IngredientUpdate } from './types'
import {
    ExpiryMonitoringSection, StockLevelsSection, MovementRegistry, ItemConfigModal,
    StockMovementModal, CategoryManagementModal, InventoryTable, InventoryDashboard,
    InventoryFilters, InventoryHeader, useNewItemForm,
    StockStatus, InventoryItem, CategoryByValue, GroupedItems, TotalsType,
    TAX_RATE, DEFAULT_CATEGORIES, DEFAULT_SUBCATEGORIES
} from './inventoryModules'
import { getStockStatus as getStockStatusService, getTotalQuantity as getTotalQuantityService, getCurrentStock } from './services/stockService'

/**
 * Inventory - Premium inventory management with dual quantity tracking
 * Package size × Package count = Total quantity
 */

export default function Inventory() {
    // Global Currency from Context
    const { formatCurrency } = useCurrency()
    const { modal } = useModal()

    // Zustand Store - persistent state
    const ingredients = useIngredients()
    const storeSuppliers = useSuppliers()
    const movements = useStockMovements()
    const { addIngredient, updateIngredient, removeIngredient, deleteStockMovement } = useAppStore()

    // Movement types for display - includes all types from store
    const MOVEMENT_TYPES: Record<string, { label: string; color: string; isOut: boolean }> = {
        entrada: { label: 'Entrada', color: 'emerald', isOut: false },
        saida: { label: 'Saída', color: 'red', isOut: true },
        ajuste: { label: 'Ajuste', color: 'amber', isOut: true },
        producao: { label: 'Produção', color: 'blue', isOut: true },
        perda: { label: 'Perda', color: 'rose', isOut: true }
    }

    // Constants for movement modal
    const UNITS = ['g', 'kg', 'ml', 'L', 'un', 'cx'] as const
    type UnitType = typeof UNITS[number]

    const REASON_BY_TYPE = {
        entrada: ['Sobra de Produção', 'Erro de Contagem', 'Saldo Inicial', 'Bonificação', 'Outro'],
        saida: ['Vencimento', 'Avaria', 'Quebra', 'Roubo / Furto', 'Consumo Interno', 'Erro de Contagem', 'Outro']
    }

    const getStock = (i: InventoryItem) => (i.packageQuantity || 0) * (i.packageCount || 1)
    const addStockMovement = useAppStore(s => s.addStockMovement)

    // Movement modal state
    const [movementModalOpen, setMovementModalOpen] = useState(false)

    const removeMovement = (m: { id: number | string; itemName: string }) => modal.confirm({
        title: 'Excluir Movimentação',
        message: `A movimentação "${m.itemName}" será removida permanentemente.`,
        isDangerous: true,
        onConfirm: () => { deleteStockMovement(String(m.id)); toast.success('Excluído') }
    })

    // Local state for items (derived from store for compatibility)

    const items = ingredients as unknown as InventoryItem[]
    const setItems = (updater: (prev: InventoryItem[]) => InventoryItem[]): void => {
        // Handle both function and direct value updates
        if (typeof updater === 'function') {
            const newItems = updater(items)
            // Sync changes to store
            newItems.forEach((item: InventoryItem, i: number) => {
                if (!items.find((ing: InventoryItem) => ing.id === item.id)) {

                    addIngredient(item as unknown as NewIngredient)
                } else if (JSON.stringify(item) !== JSON.stringify(items[i])) {

                    updateIngredient(item.id, item as unknown as IngredientUpdate)
                }
            })
        }
    }

    const [categories, setCategories] = useState(DEFAULT_CATEGORIES)

    // Tax rate constant
    const taxRate = TAX_RATE
    const [isAddingItem, setIsAddingItem] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState<string | null>('None')

    // Toast from centralized context
    const { toast } = useToast()
    const showToast = useCallback((message: string, type: string = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    // Subcategories from store constant
    const [subcategories, setSubcategories] = useState(DEFAULT_SUBCATEGORIES)

    // Category/Subcategory management modal state
    const [isManagingCategories, setIsManagingCategories] = useState(false)

    // Stock Management state
    const [stockFilter, setStockFilter] = useState('alerts') // 'all' | 'noLimits' | 'alerts' | 'ok'
    const [configuringItem, setConfiguringItem] = useState<InventoryItem | null>(null)



    // Auto-switch filter if no alerts
    useEffect(() => {
        const alertCount = items.filter(item => ['low', 'warning', 'high'].includes(getStockStatus(item))).length
        if (alertCount === 0 && stockFilter === 'alerts') {
            setStockFilter('ok')
        }
    }, [items])

    // ═══════════════════════════════════════════════════════════════
    // AUTO-QUOTATION MONITORING - Stable signature-based approach
    // Prevents infinite loops by only triggering when low-stock signature changes
    // ═══════════════════════════════════════════════════════════════
    const lowStockSignatureRef = useRef('')

    useEffect(() => {
        // Skip on initial empty state
        if (items.length === 0) return

        // Check each item for low stock - trigger if has supplier
        // Exception handling: Items without minStock defined (minStock <= 0) are skipped
        const lowStockItems = items.filter(item => {
            const currentStock = getCurrentStock(item)
            const minStock = item.minStock || 0
            // Guard: Skip items without minStock defined to prevent loop issues with zero-stock items
            if (minStock <= 0) return false
            // Trigger when Estoque_Atual <= Estoque_Minimo
            return currentStock <= minStock && item.supplierId
        })

        // Create a stable signature: sorted IDs + their current stock levels
        const newSignature = lowStockItems
            .map(item => `${item.id}:${getCurrentStock(item)}`)
            .sort()
            .join('|')

        // Only trigger events if the signature actually changed
        if (newSignature === lowStockSignatureRef.current) {
            return // No change, skip event emission
        }

        // Update signature reference
        lowStockSignatureRef.current = newSignature

        if (lowStockItems.length > 0) {
            console.log(`🔔 Auto-Quotation: Found ${lowStockItems.length} item(s) below minimum stock:`,
                lowStockItems.map(i => i.name).join(', '))
        }
    }, [items])

    // Suppliers from Zustand store (persistent)
    const suppliers = storeSuppliers

    // New item form state (encapsulated in hook)
    const { newItem, setNewItem, supplierSearchQuery, setSupplierSearchQuery, showSupplierDropdown, setShowSupplierDropdown, filteredSuppliers, isExactSupplierMatch } = useNewItemForm(suppliers as Supplier[])

    // Note: All data persisted via Zustand store

    // Calculate total quantity for an item (total weight/volume)
    // Use centralized StockService for consistency
    const getTotalQuantity = (item: InventoryItem): number => getTotalQuantityService(item)

    // Stock status indicator - Apple-quality 5-tier system
    // Use centralized StockService for consistency across the app
    const getStockStatus = (item: InventoryItem): StockStatus => {
        const status = getStockStatusService(item)
        // Map to Inventory's existing status names for UI compatibility
        switch (status) {
            case 'critical': return 'low'
            case 'warning': return 'warning'
            case 'excess': return 'high'
            case 'ok': return 'ok'
            default: return 'noLimit'
        }
    }

    // Calculate total value for an item
    // Formula: Nº Pacotes × Preço por Pacote
    const getItemTotal = (item: InventoryItem): number => {
        const packageCount = Number(item.packageCount) || 1
        return packageCount * (Number(item.pricePerUnit) || 0)
    }

    // Calculate totals
    const totals: TotalsType = useMemo(() => {
        const totalValue = items.reduce((sum: number, item: InventoryItem) => sum + getItemTotal(item), 0)
        const itemCount = items.length

        // Group by category
        const byCategory: CategoryByValue = items.reduce((acc: CategoryByValue, item: InventoryItem) => {
            const value = getItemTotal(item)
            acc[item.category] = (acc[item.category] || 0) + value
            return acc
        }, {})

        return {
            totalValue,
            itemCount,
            byCategory,
            taxImpact: totalValue * taxRate,
            grandTotal: totalValue * (1 + taxRate)
        }
    }, [items, taxRate])

    // Add new item
    const handleAddItem = () => {
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
    }

    // Update item
    const handleUpdateItem = (id: ID, field: string, value: string | number): void => {
        setItems((prev: InventoryItem[]) => prev.map((item: InventoryItem) => {
            if (item.id !== id) return item
            return {
                ...item,
                [field]: ['name', 'unit', 'category', 'subcategory', 'purchaseDate'].includes(field)
                    ? value
                    : Number(value) || 0
            }
        }))
    }

    // Delete item
    const handleDeleteItem = (id: ID): void => {
        modal.confirm({
            title: 'Excluir Item',
            message: 'Este item será removido permanentemente do estoque.',
            isDangerous: true,
            onConfirm: () => {
                setItems((prev: InventoryItem[]) => prev.filter((item: InventoryItem) => item.id !== id))
            }
        })
    }

    // Filter items by search and subcategory
    const filteredItems = useMemo((): InventoryItem[] => {
        let filtered = items

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            filtered = filtered.filter((item: InventoryItem) =>
                item.name.toLowerCase().includes(query) ||
                (item.subcategory && item.subcategory.toLowerCase().includes(query))
            )
        }

        // Subcategory filter
        if (activeSubcategoryFilter) {
            filtered = filtered.filter((item: InventoryItem) => item.subcategory === activeSubcategoryFilter)
        }

        return filtered
    }, [items, searchQuery, activeSubcategoryFilter])

    // Group items by category (using filtered items)
    const groupedItems: GroupedItems = useMemo(() => {
        return categories.reduce((acc: GroupedItems, cat: string) => {
            const categoryItems = filteredItems.filter((item: InventoryItem) => item.category === cat)
            if (categoryItems.length > 0) {
                acc[cat] = categoryItems
            }
            return acc
        }, {})
    }, [filteredItems, categories])

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            {/* Ultra-Subtle Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>


            {/* ════════════════════════════════════════════════════════════════ */}
            {/* Header: Identity & Actions */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <InventoryHeader
                onScanInvoice={() => alert('📸 Scan Nota - Funcionalidade em desenvolvimento!')}
                onAddItem={() => setIsAddingItem(true)}
            />

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* Dashboard: Precise & Light */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <InventoryDashboard
                totals={totals}
                taxRate={taxRate}
                categories={categories}
                formatCurrency={formatCurrency}
            />

            {/* Add Item Modal - Apple iOS Settings Design */}
            <AddIngredientModal
                isOpen={isAddingItem}
                onClose={() => setIsAddingItem(false)}
                onAdd={handleAddItem}
                newItem={newItem}
                setNewItem={setNewItem}

                suppliers={suppliers as unknown as Supplier[]}
            />

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* Search & Filters */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <InventoryFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeSubcategoryFilter={activeSubcategoryFilter}
                setActiveSubcategoryFilter={setActiveSubcategoryFilter}
                subcategories={subcategories}
                filteredItemsCount={filteredItems.length}
                onManageCategories={() => setIsManagingCategories(true)}
            />

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* Items by Category - Premium Lists */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <InventoryTable
                groupedItems={groupedItems as any}
                totals={totals}
                taxRate={taxRate}
                subcategories={subcategories}
                formatCurrency={formatCurrency}
                getStockStatus={getStockStatus}
                getTotalQuantity={getTotalQuantity}
                getItemTotal={getItemTotal}
                handleUpdateItem={handleUpdateItem}
                handleDeleteItem={handleDeleteItem}
                onAddItem={() => setIsAddingItem(true)}
            />

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* Movement History List — Protocol Ledger Design */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <MovementRegistry
                movements={movements as any}
                onRemoveMovement={(m) => removeMovement({ id: m.id, itemName: m.itemName })}
                onAddMovement={() => setMovementModalOpen(true)}
            />

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* Stock Levels Section — Apple Vision Pro Design */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <StockLevelsSection
                items={items}
                getStockStatus={getStockStatus}
                getTotalQuantity={getTotalQuantity}
                onConfigureItem={(item: InventoryItem) => setConfiguringItem(item)}
            />

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* VALIDADE — Premium Apple-Level Expiry Monitoring */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <ExpiryMonitoringSection
                items={items}
                onConfigureItem={(item: InventoryItem) => setConfiguringItem(item)}
                getTotalQuantity={getTotalQuantity}
            />


            {/* ════════════════════════════════════════════════════════════════ */}
            {/* Item Configuration Modal */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <ItemConfigModal
                item={configuringItem}
                onClose={() => setConfiguringItem(null)}
                onUpdateItem={handleUpdateItem}
                getStockStatus={getStockStatus}
                getTotalQuantity={getTotalQuantity}
            />


            {/* ════════════════════════════════════════════════════════════════ */}
            {/* Category Management Modal */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <CategoryManagementModal
                isOpen={isManagingCategories}
                onClose={() => setIsManagingCategories(false)}
                categories={categories}
                subcategories={{}}
                onAddCategory={(name) => {
                    if (!categories.includes(name)) {
                        setCategories(prev => [...prev, name])
                        showToast('Categoria adicionada', 'success')
                    }
                }}
                onRemoveCategory={(cat) => {
                    modal.confirm({
                        title: 'Excluir Categoria',
                        message: `Excluir categoria "${cat}"? Itens desta categoria serão movidos para "Outros".`,
                        isDangerous: true,
                        onConfirm: () => {
                            setCategories(prev => prev.filter(c => c !== cat))
                            setItems(prev => prev.map(item => item.category === cat ? { ...item, category: 'Outros' } : item))
                            showToast('Categoria removida', 'success')
                        }
                    })
                }}
                onAddSubcategory={() => { }}
                onRemoveSubcategory={() => { }}
            />

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* Stock Movement Modal */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <StockMovementModal
                isOpen={movementModalOpen}
                onClose={() => setMovementModalOpen(false)}
                items={items as any}
                onSaveMovement={(data) => {
                    addStockMovement(data)
                    const item = items.find(i => i.id === data.itemId)
                    if (item) {
                        updateIngredient(item.id, { packageCount: Math.max(0, data.newStock / (item.packageQuantity || 1)) })
                    }
                    toast.success('Movimentação salva')
                }}
                getStock={getStock as any}
            />

        </div >
    )
}

// Export function to get inventory items (for use in other components)
// Uses Zustand store for persistence and sharing across components
export function useInventoryItems() {
    return useIngredients()
}
