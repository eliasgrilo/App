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
import { ExpiryMonitoringSection, StockLevelsSection, MovementRegistry, ItemConfigModal, StockMovementModal, CategoryManagementModal, InventoryTable } from './inventoryModules'

// ═══ LOCAL TYPE DEFINITIONS ═══
type StockStatus = 'noLimit' | 'critical' | 'warning' | 'excess' | 'ok' | 'low' | 'high'

interface InventoryItem {
    id: number
    name: string
    packageQuantity: number
    packageCount: number
    unit: string
    pricePerUnit: number
    category: string
    subcategory?: string | null
    purchaseDate?: string
    supplierId?: ID | null
    supplierName?: string
    minStock?: number
    maxStock?: number
    criticalStock?: number
    enableAutoQuotation?: boolean
    leadTimeDays?: number
    shelfLifeDays?: number | null
    barcode?: string | null
    expiryDate?: string | null
    createdAt?: string
}

interface NewItemState {
    name: string
    packageQuantity: string
    packageCount: string
    unit: string
    pricePerUnit: string
    category: string
    subcategory: string
    purchaseDate: string
    supplierId: ID | null
    supplierName: string
    minStock: string
    maxStock: string
    enableAutoQuotation: boolean
    leadTimeDays: number
    shelfLifeDays: string
    barcode: string
}

interface CategoryByValue {
    [key: string]: number
}

interface GroupedItems {
    [key: string]: InventoryItem[]
}

interface TotalsType {
    totalValue: number
    itemCount: number
    byCategory: CategoryByValue
    taxImpact: number
    grandTotal: number
}

interface ColorScheme {
    bg: string
    text: string
    shadow: string
    pulse: string
}

// ═══════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════
const StockService = {
    getCurrentStock: (item: InventoryItem): number => (item.packageQuantity || 0) * (item.packageCount || 1),
    getTotalQuantity: (item: InventoryItem): number => (item.packageQuantity || 0) * (item.packageCount || 1),
    getStockLevel: (item: InventoryItem): number => (item.packageQuantity || 0) * (item.packageCount || 1),
    getStockValue: (item: InventoryItem): number => ((item.packageQuantity || 0) * (item.packageCount || 1) * (item.pricePerUnit || 0)),
    getStockStatus: (item: InventoryItem): StockStatus => {
        const currentStock = (item.packageQuantity || 0) * (item.packageCount || 1)
        const minStock = Number(item.minStock) || 0
        const maxStockRaw = Number(item.maxStock) || 0
        const criticalStockRaw = Number(item.criticalStock) || 0

        // Smart automation: Se usuário não definir crítico, assume 25% do mínimo
        // Se usuário não definir máximo, assume 3x o mínimo
        const criticalStock = criticalStockRaw > 0 ? criticalStockRaw : (minStock > 0 ? minStock * 0.25 : 0)
        const maxStock = maxStockRaw > 0 ? maxStockRaw : (minStock > 0 ? minStock * 3 : 0)

        // Sem limite: falta configurar estoque mínimo
        if (minStock <= 0) return 'noLimit'

        // Crítico (Vermelho - "Pânico"): abaixo de 25% do mínimo
        // "Se você não comprar AGORA, a produção vai parar hoje"
        if (currentStock <= criticalStock) return 'critical'

        // Mínimo (Amarelo - "Planejamento"): abaixo do mínimo
        // "Está na hora de fazer pedido ao fornecedor"
        if (currentStock < minStock) return 'warning'

        // Máximo (Evitar desperdício): acima do máximo
        // "Não compre mais que isso"
        if (maxStock > 0 && currentStock > maxStock) return 'excess'

        // Adequado: dentro dos limites
        return 'ok'
    },
    getMinStock: (item: InventoryItem): number => Number(item.minStock) || 0,
    needsReorder: (item: InventoryItem): boolean => {
        const currentStock = (item.packageQuantity || 0) * (item.packageCount || 1)
        const minStock = Number(item.minStock) || 0
        return minStock > 0 && currentStock <= minStock
    },
    getReorderQuantity: (item: InventoryItem): number => {
        const currentStock = (item.packageQuantity || 0) * (item.packageCount || 1)
        const maxStock = Number(item.maxStock) || 0
        const minStock = Number(item.minStock) || 0
        if (maxStock > 0) return Math.max(0, maxStock - currentStock)
        if (minStock > 0) return Math.max(0, minStock * 2 - currentStock)
        return 0
    },
}

// Tax configuration (12% default rate)
const TAX_RATE = 0.12


/**
 * Inventory - Premium inventory management with dual quantity tracking
 * Package size × Package count = Total quantity
 */

// Note: All data persisted via Zustand store

const defaultCategories = ['Ingredientes', 'Embalagens', 'Equipamentos', 'Limpeza']

// Default Subcategories for Ingredientes
const defaultIngredientSubcategories = ['None', 'Embutidos', 'Laticínios', 'Farináceos', 'Temperos', 'Vegetais', 'Produtos de Limpeza', 'Outros Ingredientes']

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

    const [categories, setCategories] = useState(defaultCategories)

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
    const [subcategories, setSubcategories] = useState(defaultIngredientSubcategories)

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
            const currentStock = StockService.getCurrentStock(item)
            const minStock = item.minStock || 0
            // Guard: Skip items without minStock defined to prevent loop issues with zero-stock items
            if (minStock <= 0) return false
            // Trigger when Estoque_Atual <= Estoque_Minimo
            return currentStock <= minStock && item.supplierId
        })

        // Create a stable signature: sorted IDs + their current stock levels
        const newSignature = lowStockItems
            .map(item => `${item.id}:${StockService.getCurrentStock(item)}`)
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
    const [supplierSearchQuery, setSupplierSearchQuery] = useState('')
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)

    // Helper: Check if supplier name matches exactly (same name and word count)
    const isExactSupplierMatch = useCallback((searchTerm: string, supplierName: string): boolean => {
        if (!searchTerm || !supplierName) return false
        const normalizedSearch = searchTerm.trim().toLowerCase()
        const normalizedSupplier = supplierName.trim().toLowerCase()
        // Must be exactly equal AND have same word count
        const searchWords = normalizedSearch.split(/\s+/).filter((w: string) => w.length > 0)
        const supplierWords = normalizedSupplier.split(/\s+/).filter((w: string) => w.length > 0)
        return normalizedSearch === normalizedSupplier && searchWords.length === supplierWords.length
    }, [])

    // Filter suppliers based on search - only show when pattern is found (min 2 chars)
    const filteredSuppliers = useMemo(() => {
        const query = supplierSearchQuery.trim().toLowerCase()
        // Only show suggestions if at least 2 characters are typed
        if (query.length < 2) return []
        return suppliers.filter((s: Supplier) =>
            s.name?.toLowerCase().includes(query)
        ).slice(0, 8)
    }, [suppliers, supplierSearchQuery])

    const [newItem, setNewItem] = useState({
        name: '',
        packageQuantity: '',
        packageCount: '1',
        unit: 'kg',
        pricePerUnit: '',
        category: 'Ingredientes',
        subcategory: 'Outros Ingredientes',
        purchaseDate: new Date().toISOString().split('T')[0],
        supplierId: null,
        supplierName: '',
        minStock: '',
        maxStock: '',
        enableAutoQuotation: false,
        leadTimeDays: 3,
        shelfLifeDays: '',
        barcode: ''
    })

    // Note: All data persisted via Zustand store

    // Calculate total quantity for an item (total weight/volume)
    // Use centralized StockService for consistency
    const getTotalQuantity = (item: InventoryItem): number => StockService.getTotalQuantity(item)

    // Stock status indicator - Apple-quality 5-tier system
    // Use centralized StockService for consistency across the app
    const getStockStatus = (item: InventoryItem): StockStatus => {
        const status = StockService.getStockStatus(item)
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

        setItems(prev => [...prev, item])
        setNewItem({
            name: '',
            packageQuantity: '',
            packageCount: '1',
            unit: 'kg',
            pricePerUnit: '',
            category: 'Ingredientes',
            subcategory: 'Outros Ingredientes',
            purchaseDate: new Date().toISOString().split('T')[0],
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

            {/* Header: Identity & Actions - z-20 to prevent sticky header overlap */}
            <div className="relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Estoque</h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Gestão inteligente de insumos e provisões</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Invoice Scanner Button */}
                    <button
                        onClick={() => alert('📸 Scan Nota - Funcionalidade em desenvolvimento!')}
                        className="flex w-auto px-4 md:px-6 py-3 md:py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all items-center justify-center gap-2 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="hidden md:inline">Scan Nota</span>
                        <span className="md:hidden">Scan</span>
                    </button>

                    <button
                        onClick={() => setIsAddingItem(true)}
                        className="w-full md:w-auto px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group touch-manipulation relative z-30"
                        style={{ minHeight: '44px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Adicionar Insumo
                    </button>
                </div>
            </div>

            {/* Dashboard: Precise & Light */}
            <section className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                {/* Total Value Card: Apple Pro Aesthetic */}
                <div className="md:col-span-2 relative group">
                    <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                        {/* Subtle Apple-style Mesh Gradient (Refined) */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-[250ms]0"></div>

                        <div className="relative">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h3 className="text-[10px] font-bold text-zinc-400 dark:text-emerald-300/60 uppercase tracking-widest cursor-text hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                        Inventory Matrix
                                    </h3>
                                    <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide mt-1">Protocol Status: High Integrity</p>
                                </div>
                                <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live Matrix</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest ml-1">Total Stock Asset Value</span>
                                <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none flex flex-wrap items-baseline gap-2 md:gap-3">
                                    {formatCurrency(totals.grandTotal)}
                                </div>
                            </div>
                        </div>

                        <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100/80 dark:border-white/5">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Net Valuation</span>
                                <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{formatCurrency(totals.totalValue)}</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">Tax Impact ({(taxRate * 100).toFixed(0)}%)</span>
                                <span className="text-2xl md:text-3xl font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">{formatCurrency(totals.taxImpact)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
                    {categories.map((cat, idx) => {
                        const colors = {
                            'Ingredientes': { bg: 'bg-indigo-500/80', text: 'text-indigo-500', shadow: 'shadow-[0_0_8px_rgba(99,102,241,0.4)]', pulse: 'bg-indigo-500' },
                            'Embalagens': { bg: 'bg-orange-500/80', text: 'text-orange-500', shadow: 'shadow-[0_0_8px_rgba(249,115,22,0.4)]', pulse: 'bg-orange-500' },
                            'Utensílios': { bg: 'bg-emerald-500/80', text: 'text-emerald-500', shadow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]', pulse: 'bg-emerald-500' },
                            'Outros': { bg: 'bg-zinc-500/80', text: 'text-zinc-500', shadow: 'shadow-[0_0_8px_rgba(113,113,122,0.4)]', pulse: 'bg-zinc-500' }
                        }
                        const color = colors[cat as keyof typeof colors] || colors['Outros']
                        const value = totals.byCategory[cat] || 0
                        const valueWithTax = value * (1 + taxRate)
                        const allocation = (value / totals.totalValue * 100 || 0).toFixed(0)

                        return (
                            <div key={cat} className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-3xl p-5 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-md hover:shadow-lg transition-all">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${color.pulse} ${color.shadow}`}></div>
                                        <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">{cat}</h3>
                                    </div>
                                    <div className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                                        {formatCurrency(valueWithTax)}
                                    </div>
                                    <div className="text-[9px] font-medium text-zinc-400 tabular-nums">
                                        ({formatCurrency(value)} + {(taxRate * 100).toFixed(0)}% tax)
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-1 px-0.5">
                                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Allocation</span>
                                        <span className={`text-[8px] font-bold ${color.text}`}>{allocation}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${color.bg} transition-all duration-[250ms]0`} style={{ width: `${allocation}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Add Item Modal - Apple iOS Settings Design */}
            <AddIngredientModal
                isOpen={isAddingItem}
                onClose={() => setIsAddingItem(false)}
                onAdd={handleAddItem}
                newItem={newItem}
                setNewItem={setNewItem}

                suppliers={suppliers as unknown as Supplier[]}
            />
            {/* Search Bar - Premium Apple Design */}
            <section className="relative z-10 mb-6">
                <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-5 border border-zinc-200/50 dark:border-white/10 shadow-lg">
                    {/* Search Input */}
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-white/5 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all placeholder:text-zinc-400"
                            placeholder="Buscar produto por nome ou subcategoria..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Subcategory Filter Chips */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        <button
                            onClick={() => setActiveSubcategoryFilter('None')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeSubcategoryFilter === 'None'
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                }`}
                        >
                            None
                        </button>
                        <button
                            onClick={() => setActiveSubcategoryFilter(null)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeSubcategoryFilter === null
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                }`}
                        >
                            Todos
                        </button>
                        {subcategories.filter(sub => sub !== 'None').map(sub => (
                            <button
                                key={sub}
                                onClick={() => setActiveSubcategoryFilter(activeSubcategoryFilter === sub ? null : sub)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeSubcategoryFilter === sub
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                {sub}
                            </button>
                        ))}

                        {/* Settings Button - Opens Category Management Modal */}
                        <button
                            onClick={() => setIsManagingCategories(true)}
                            className="ml-auto w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all touch-manipulation group"
                            title="Gerenciar Categorias"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Active Filters Indicator */}
                    {(searchQuery || activeSubcategoryFilter) && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100/80 dark:border-zinc-800">
                            <span className="text-xs text-zinc-500">
                                {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
                            </span>
                            <button
                                onClick={() => { setSearchQuery(''); setActiveSubcategoryFilter(null); }}
                                className="text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                            >
                                Limpar filtros
                            </button>
                        </div>
                    )}
                </div>
            </section>

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
