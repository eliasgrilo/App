import { useMemo, useState } from 'react'
import AddIngredientModal from './components/AddIngredientModal'
import { useCurrency } from './stores/useCurrencyStore'
import { useModal, useToast } from './stores/useUIStore'
import { useAppStore, useIngredients, useSuppliers, useStockMovements } from './stores/useAppStore'
import { Supplier, NewIngredient, IngredientUpdate } from './types'
import {
    StockLevelsSection, ExpirationLevelsSection, MovementRegistry, ItemConfigModal,
    StockMovementModal, CategoryManagementModal, InventoryTable, InventoryDashboard,
    InventoryFilters, InventoryHeader, useNewItemForm, InventoryItem, TAX_RATE, getStock,
    useInventoryState, useInventoryHandlers, useInventoryTotals, useAutoQuotation,
    IngredientDetailModal
} from './inventoryModules'

/**
 * Inventory - Premium inventory management
 * Refactored: Logic extracted to custom hooks
 */
export default function Inventory() {
    const { formatCurrency } = useCurrency()
    const { modal } = useModal()
    const { toast } = useToast()
    const ingredients = useIngredients()
    const storeSuppliers = useSuppliers()
    const movements = useStockMovements()
    const { addIngredient, updateIngredient, deleteStockMovement, addStockMovement } = useAppStore()

    const items = ingredients as unknown as InventoryItem[]
    const suppliers = storeSuppliers as unknown as Supplier[]

    const setItems = (updater: (prev: InventoryItem[]) => InventoryItem[]): void => {
        const newItems = updater(items)
        newItems.forEach((item, i) => {
            if (!items.find(ing => ing.id === item.id)) addIngredient(item as unknown as NewIngredient)
            else if (JSON.stringify(item) !== JSON.stringify(items[i])) updateIngredient(item.id, item as unknown as IngredientUpdate)
        })
    }

    const uiState = useInventoryState()
    const { newItem, setNewItem, supplierSearchQuery, setSupplierSearchQuery } = useNewItemForm(suppliers)
    const { totals, getTotalQuantity, getStockStatus, getItemTotal } = useInventoryTotals({ items, taxRate: TAX_RATE })
    const handlers = useInventoryHandlers({
        items, addIngredient, updateIngredient, deleteStockMovement,
        newItem, setNewItem, setSupplierSearchQuery, setIsAddingItem: uiState.setIsAddingItem,
        setItems, modal, toast
    })

    useAutoQuotation(items)
    const [selectedIngredient, setSelectedIngredient] = useState<InventoryItem | null>(null)

    const filteredItems = useMemo((): InventoryItem[] => {
        let filtered = items
        if (uiState.searchQuery.trim()) {
            const query = uiState.searchQuery.toLowerCase().trim()
            filtered = filtered.filter(item => item.name.toLowerCase().includes(query) || item.subcategory?.toLowerCase().includes(query))
        }
        if (uiState.activeSubcategoryFilter) filtered = filtered.filter(item => item.subcategory === uiState.activeSubcategoryFilter)
        return filtered
    }, [items, uiState.searchQuery, uiState.activeSubcategoryFilter])

    const groupedItems = useMemo(() => uiState.categories.reduce((acc: Record<string, InventoryItem[]>, cat) => {
        const categoryItems = filteredItems.filter(item => item.category === cat)
        if (categoryItems.length > 0) acc[cat] = categoryItems
        return acc
    }, {}), [filteredItems, uiState.categories])

    const handleAddCategory = (name: string) => {
        if (!uiState.categories.includes(name)) { uiState.setCategories(prev => [...prev, name]); handlers.showToast('Categoria adicionada', 'success') }
    }

    const handleRemoveCategory = (cat: string) => modal.confirm({
        title: 'Excluir Categoria', message: `Excluir categoria "${cat}"? Itens serão movidos para "Outros".`, isDangerous: true,
        onConfirm: () => { uiState.setCategories(prev => prev.filter(c => c !== cat)); setItems(prev => prev.map(item => item.category === cat ? { ...item, category: 'Outros' } : item)); handlers.showToast('Categoria removida', 'success') }
    })

    const handleAddSubcategory = (category: string, subcategory: string) => {
        uiState.setSubcategories(prev => ({
            ...prev,
            [category]: [...(prev[category] || []), subcategory]
        }))
        handlers.showToast('Subcategoria adicionada', 'success')
    }

    const handleRemoveSubcategory = (category: string, subcategory: string) => {
        uiState.setSubcategories(prev => ({
            ...prev,
            [category]: (prev[category] || []).filter(s => s !== subcategory)
        }))
        handlers.showToast('Subcategoria removida', 'success')
    }

    const handleSaveMovement = (data: Parameters<typeof addStockMovement>[0]) => {
        addStockMovement(data)
        const item = items.find(i => i.id === data.itemId)
        if (item) updateIngredient(item.id, { packageCount: Math.max(0, data.newStock / (item.packageQuantity || 1)) })
        toast.success('Movimentação salva')
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            <InventoryHeader onScanInvoice={() => alert('📸 Scan Nota - Funcionalidade em desenvolvimento!')} onAddItem={() => uiState.setIsAddingItem(true)} />
            <InventoryDashboard totals={totals} taxRate={TAX_RATE} categories={uiState.categories} formatCurrency={formatCurrency} />
            <AddIngredientModal isOpen={uiState.isAddingItem} onClose={() => uiState.setIsAddingItem(false)} onAdd={handlers.handleAddItem} newItem={newItem} setNewItem={setNewItem} suppliers={suppliers} />
            <InventoryFilters searchQuery={uiState.searchQuery} setSearchQuery={uiState.setSearchQuery} activeSubcategoryFilter={uiState.activeSubcategoryFilter}
                setActiveSubcategoryFilter={uiState.setActiveSubcategoryFilter} subcategories={['None', ...Object.values(uiState.subcategories).flat()]} filteredItemsCount={filteredItems.length}
                onManageCategories={() => uiState.setIsManagingCategories(true)} />
            <InventoryTable groupedItems={groupedItems as any} totals={totals} taxRate={TAX_RATE} subcategories={['None', ...Object.values(uiState.subcategories).flat()]} formatCurrency={formatCurrency}
                getStockStatus={getStockStatus} getTotalQuantity={getTotalQuantity} getItemTotal={getItemTotal}
                handleUpdateItem={handlers.handleUpdateItem} handleDeleteItem={handlers.handleDeleteItem} onAddItem={() => uiState.setIsAddingItem(true)}
                hasActiveFilter={uiState.activeSubcategoryFilter === 'None'} onSelectIngredient={setSelectedIngredient} />
            <StockLevelsSection items={items} getStockStatus={getStockStatus} getTotalQuantity={getTotalQuantity} onConfigureItem={item => uiState.setConfiguringItem(item)} />
            <ExpirationLevelsSection items={items as any} getTotalQuantity={getTotalQuantity as any} onConfigureItem={item => uiState.setConfiguringItem(item as any)} />
            <MovementRegistry movements={movements as any} onRemoveMovement={m => handlers.removeMovement({ id: m.id, itemName: m.itemName })} onAddMovement={() => uiState.setMovementModalOpen(true)} />
            <ItemConfigModal item={uiState.configuringItem} onClose={() => uiState.setConfiguringItem(null)} onUpdateItem={handlers.handleUpdateItem} getStockStatus={getStockStatus} getTotalQuantity={getTotalQuantity} />
            <CategoryManagementModal isOpen={uiState.isManagingCategories} onClose={() => uiState.setIsManagingCategories(false)} categories={uiState.categories} subcategories={uiState.subcategories}
                onAddCategory={handleAddCategory} onRemoveCategory={handleRemoveCategory} onAddSubcategory={handleAddSubcategory} onRemoveSubcategory={handleRemoveSubcategory} />
            <StockMovementModal isOpen={uiState.movementModalOpen} onClose={() => uiState.setMovementModalOpen(false)} items={items as any}
                onSaveMovement={handleSaveMovement} getStock={getStock as any} />
            <IngredientDetailModal ingredient={selectedIngredient} onClose={() => setSelectedIngredient(null)} formatCurrency={formatCurrency} getTotalQuantity={getTotalQuantity} getItemTotal={getItemTotal} />
        </div>
    )
}

export function useInventoryItems() { return useIngredients() }
