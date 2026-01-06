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
import { ExpiryMonitoringSection, StockLevelsSection, MovementRegistry, ItemConfigModal } from './inventoryModules'

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

    // Movement modal states
    const [movementModalOpen, setMovementModalOpen] = useState(false)
    const [movementItemSearch, setMovementItemSearch] = useState('')
    const [showMovementItemResults, setShowMovementItemResults] = useState(false)
    const [movementForm, setMovementForm] = useState({
        type: 'entrada' as 'entrada' | 'saida',
        itemId: 0,
        qty: '',
        unit: 'kg' as UnitType,
        reasonLabel: 'Sobra de Produção',
        reasonNote: ''
    })

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
    const [editingId, setEditingId] = useState<ID | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState<string | null>('None')

    // Toast from centralized context
    const { toast } = useToast()
    const showToast = useCallback((message: string, type: string = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    // Filtered items for modal search
    const modalFilteredItems = useMemo(() => {
        if (!movementItemSearch.trim() || movementItemSearch.trim().length < 2) return []
        const words = movementItemSearch.toLowerCase().split(/\s+/).filter(w => w.length > 0)
        return items.filter(i => {
            const name = i.name.toLowerCase()
            return words.every(word => name.split(/\s+/).some(nameWord => nameWord.startsWith(word)))
        }).slice(0, 6)
    }, [items, movementItemSearch])

    const selectedMovementItem = items.find(i => i.id === movementForm.itemId)

    // Save movement
    const saveMovement = useCallback(() => {
        if (!movementForm.itemId || !movementForm.qty || !movementForm.reasonLabel) {
            toast.error('Preencha todos os campos'); return
        }
        const it = items.find(i => i.id === movementForm.itemId)!
        const q = parseFloat(movementForm.qty)
        const t = MOVEMENT_TYPES[movementForm.type]
        if (!t) { toast.error('Tipo de movimento inválido'); return }
        const prev = getStock(it)
        const next = t.isOut ? prev - q : prev + q
        const fullReason = movementForm.reasonNote ? `${movementForm.reasonLabel} - ${movementForm.reasonNote}` : movementForm.reasonLabel

        addStockMovement({
            itemId: it.id,
            itemName: it.name,
            type: movementForm.type,
            quantity: q,
            unit: movementForm.unit,
            previousStock: prev,
            newStock: next,
            costAtTime: (it.pricePerUnit || 0) * q,
            reason: fullReason
        })
        updateIngredient(it.id, { packageCount: Math.max(0, next / (it.packageQuantity || 1)) })
        toast.success('Movimentação salva')
        setMovementModalOpen(false)
        setMovementForm({ type: 'entrada', itemId: 0, qty: '', unit: 'kg', reasonLabel: 'Sobra de Produção', reasonNote: '' })
        setMovementItemSearch('')
    }, [movementForm, items, addStockMovement, updateIngredient, toast, MOVEMENT_TYPES])

    // Subcategories from store constant
    const [subcategories, setSubcategories] = useState(defaultIngredientSubcategories)

    // Category/Subcategory management modal state
    const [isManagingCategories, setIsManagingCategories] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newSubcategoryName, setNewSubcategoryName] = useState('')

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
                setEditingId(null)
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

            {/* Items by Category - Premium Lists */}
            {
                Object.keys(groupedItems).length > 0 && (
                    <div className="space-y-8">
                        {Object.entries(groupedItems).map(([category, categoryItems]) => (
                            <div key={category} className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
                                {/* Category Header */}
                                <div className="px-8 py-6 border-b border-zinc-100/80 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{category}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                            {formatCurrency((totals.byCategory[category] || 0) * (1 + taxRate))}
                                        </span>
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                                                {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop View - Table */}
                                <div className="hidden md:block">
                                    <div className="grid grid-cols-12 gap-6 px-8 py-4 border-b border-zinc-100/80 dark:border-white/5 bg-zinc-50/30 dark:bg-white/[0.01]">
                                        <div className="col-span-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Item</div>
                                        <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Configuração</div>
                                        <div className="col-span-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Qtd</div>
                                        <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Total Estocado</div>
                                        <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Preço Unitário</div>
                                        <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Valor Total</div>
                                    </div>

                                    <div className="divide-y divide-zinc-100/50 dark:divide-white/5">
                                        {categoryItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="grid grid-cols-12 gap-6 px-8 py-5 items-center hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors duration-300 group"
                                            >
                                                {editingId === item.id ? (
                                                    <>
                                                        {/* Edit Mode - Aligned with View Mode (3+2+1+2+2+2=12) */}
                                                        <div className="col-span-3">
                                                            <input
                                                                type="text"
                                                                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-zinc-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                                                value={item.name}
                                                                onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                                                placeholder="Nome do item"
                                                            />
                                                            {item.category === 'Ingredientes' && (
                                                                <select
                                                                    className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-200/50 dark:border-white/5 text-xs font-medium text-zinc-600 dark:text-zinc-400 outline-none cursor-pointer"
                                                                    value={item.subcategory || ''}
                                                                    onChange={(e) => handleUpdateItem(item.id, 'subcategory', e.target.value)}
                                                                >
                                                                    {subcategories.map(sub => (
                                                                        <option key={sub} value={sub}>{sub}</option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </div>
                                                        <div className="col-span-2 flex items-center gap-1.5">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="flex-1 min-w-0 px-2 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-right text-sm font-medium focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                                                value={item.packageQuantity}
                                                                onChange={(e) => handleUpdateItem(item.id, 'packageQuantity', e.target.value)}
                                                            />
                                                            <select
                                                                className="shrink-0 w-14 px-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-sm font-medium text-zinc-600 dark:text-zinc-400 outline-none cursor-pointer"
                                                                value={item.unit}
                                                                onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                                                            >
                                                                <option value="kg">kg</option>
                                                                <option value="g">g</option>
                                                                <option value="L">L</option>
                                                                <option value="ml">ml</option>
                                                                <option value="un">un</option>
                                                                <option value="cx">cx</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="w-full px-2 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-center text-sm font-semibold focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                                                value={item.packageCount}
                                                                onChange={(e) => handleUpdateItem(item.id, 'packageCount', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-span-2 flex items-center justify-end">
                                                            <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                                {getTotalQuantity(item)} {item.unit}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <div className="relative">
                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">R$</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="w-full pl-8 pr-2 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-right text-sm font-medium focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                                                    value={item.pricePerUnit}
                                                                    onChange={(e) => handleUpdateItem(item.id, 'pricePerUnit', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95"
                                                                title="Salvar"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="p-2 rounded-xl text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-95"
                                                                title="Excluir"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* View Mode */}
                                                        <div className="col-span-3 flex items-center gap-2">
                                                            {/* Stock Level Indicator */}
                                                            {getStockStatus(item) === 'low' && (
                                                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" title="Estoque baixo" />
                                                            )}
                                                            {getStockStatus(item) === 'warning' && (
                                                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" title="Próximo do mínimo" />
                                                            )}
                                                            {getStockStatus(item) === 'high' && (
                                                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]" title="Acima do máximo" />
                                                            )}
                                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">{item.name}</span>
                                                        </div>
                                                        <div className="col-span-2 text-center">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 text-xs font-medium text-zinc-600 dark:text-zinc-400 tabular-nums">
                                                                {item.packageQuantity} {item.unit}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-1 text-center">
                                                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                                                {item.packageCount}×
                                                            </span>
                                                        </div>
                                                        <div className="col-span-2 text-right">
                                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                                                                {getTotalQuantity(item)} {item.unit}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-2 text-right">
                                                            <span className="text-sm text-zinc-600 dark:text-zinc-400">{formatCurrency(item.pricePerUnit)}</span>
                                                        </div>
                                                        <div className="col-span-2 flex items-center justify-end gap-2">
                                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(getItemTotal(item) * (1 + taxRate))}</span>
                                                            <button
                                                                onClick={() => setEditingId(item.id)}
                                                                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Mobile View - Cards Premium */}
                                <div className="md:hidden space-y-3 p-4 bg-zinc-50/50 dark:bg-white/[0.01]">
                                    {categoryItems.map((item) => {
                                        const stockStatus = getStockStatus(item)
                                        const stockBorderClass = stockStatus === 'low' ? 'border-l-4 border-l-rose-500' :
                                            stockStatus === 'warning' ? 'border-l-4 border-l-amber-500' :
                                                stockStatus === 'high' ? 'border-l-4 border-l-blue-500' : ''

                                        return (
                                            <div
                                                key={item.id}
                                                className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border transition-all ${stockBorderClass} ${editingId === item.id
                                                    ? 'border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                                                    : 'border-zinc-200/60 dark:border-white/5 shadow-sm'
                                                    }`}
                                            >
                                                {editingId === item.id ? (
                                                    /* Mobile Edit Mode */
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                                                <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Editando Item</h4>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setEditingId(null)}
                                                                    className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                    className="p-2 rounded-xl text-red-500 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Nome */}
                                                        <div>
                                                            <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Nome</label>
                                                            <input
                                                                type="text"
                                                                className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-zinc-800 dark:text-zinc-100 font-semibold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-zinc-300"
                                                                value={item.name}
                                                                onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Qtd</label>
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        inputMode="decimal"
                                                                        className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-center font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                                                        value={item.packageQuantity}
                                                                        onChange={(e) => handleUpdateItem(item.id, 'packageQuantity', e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Unidade</label>
                                                                <div className="relative">
                                                                    <select
                                                                        className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 font-bold text-center appearance-none text-zinc-700 dark:text-zinc-300 focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                                                        value={item.unit}
                                                                        onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                                                                    >
                                                                        <option value="kg">kg</option>
                                                                        <option value="g">g</option>
                                                                        <option value="L">L</option>
                                                                        <option value="ml">ml</option>
                                                                        <option value="un">un</option>
                                                                        <option value="cx">cx</option>
                                                                    </select>
                                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Price Section - Mobile */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Nº Pcts</label>
                                                                <input
                                                                    type="number"
                                                                    inputMode="numeric"
                                                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-center font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                                                    value={item.packageCount}
                                                                    onChange={(e) => handleUpdateItem(item.id, 'packageCount', e.target.value)}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Preço/Un</label>
                                                                <div className="relative group">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-400 transition-colors text-xs font-bold">R$</span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        inputMode="decimal"
                                                                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-right font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                                                        value={item.pricePerUnit}
                                                                        onChange={(e) => handleUpdateItem(item.id, 'pricePerUnit', e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Subcategory Dropdown - Mobile */}
                                                        {item.category === 'Ingredientes' && (
                                                            <div>
                                                                <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Subcategoria</label>
                                                                <select
                                                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none"
                                                                    value={item.subcategory || ''}
                                                                    onChange={(e) => handleUpdateItem(item.id, 'subcategory', e.target.value)}
                                                                >
                                                                    {subcategories.map(sub => (
                                                                        <option key={sub} value={sub}>{sub}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* Mobile View Mode */
                                                    /* Mobile View Mode - Ultra Premium */
                                                    <div onClick={() => setEditingId(item.id)} className="group cursor-pointer">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div>
                                                                <h4 className="font-semibold text-zinc-800 dark:text-zinc-100 text-[15px] tracking-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.name}</h4>
                                                                <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-white/5 border border-zinc-100/80 dark:border-white/5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tabular-nums uppercase tracking-wide">
                                                                    {getTotalQuantity(item)} {item.unit} em estoque
                                                                </div>
                                                            </div>
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-900 dark:bg-white text-[10px] font-semibold text-white dark:text-zinc-900 shadow-sm ring-1 ring-inset ring-white/10 dark:ring-black/10">
                                                                {item.packageCount} pcts
                                                            </span>
                                                        </div>

                                                        <div className="flex items-end justify-between pt-4 border-t border-dashed border-zinc-100/80 dark:border-white/5">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300 dark:text-zinc-600 mb-0.5">Unitário</span>
                                                                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums">{formatCurrency(item.pricePerUnit)}</span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400 dark:text-indigo-400/80 mb-0.5">Total</span>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-tight tabular-nums">{formatCurrency(getItemTotal(item) * (1 + taxRate))}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Category Footer - Inside the Card */}
                                <div className="px-8 py-4 bg-zinc-50/50 dark:bg-white/[0.02] border-t border-zinc-100/80 dark:border-white/5 flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total {category}</span>
                                    <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{formatCurrency((totals.byCategory[category] || 0) * (1 + taxRate))}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }

            {/* Empty State - Only shown when no items AND filter is not 'None' */}
            {
                Object.keys(groupedItems).length === 0 && activeSubcategoryFilter !== 'None' && (
                    <div className="text-center py-20 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-zinc-50/50 dark:bg-white/[0.01]"></div>
                        <div className="relative z-10">
                            <div className="w-20 h-20 mx-auto bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Estoque Vazio</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm font-medium">Você ainda não tem itens cadastrados no estoque.</p>
                            <button
                                onClick={() => setIsAddingItem(true)}
                                className="button primary"
                            >
                                Adicionar Primeiro Item
                            </button>
                        </div>
                    </div>
                )
            }



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

            {/* Category Management Modal — Premium Responsive Design */}
            {
                createPortal(
                    <AnimatePresence>
                        {isManagingCategories && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[20000] flex items-end md:items-center justify-center"
                            >
                                <ModalScrollLock />
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xl"
                                    onClick={() => setIsManagingCategories(false)}
                                />

                                {/* Modal Content */}
                                <motion.div
                                    initial={{ opacity: 0, y: 100, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 100, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                    className="relative w-full md:max-w-lg md:mx-4 bg-white dark:bg-zinc-900 rounded-t-[2rem] md:rounded-[2rem] shadow-2xl max-h-[85vh] md:max-h-[80vh] flex flex-col overflow-hidden"
                                    style={{
                                        boxShadow: '0 -8px 40px rgba(0,0,0,0.15), 0 32px 80px rgba(0,0,0,0.25)',
                                        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
                                    }}
                                >
                                    {/* Drag Handle (Mobile only) */}
                                    <div className="md:hidden w-full flex justify-center pt-3 pb-2">
                                        <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                                    </div>

                                    {/* Header - Fixed */}
                                    <div className="flex items-center justify-between px-5 md:px-6 py-4 md:pt-6 border-b border-zinc-100/80 dark:border-zinc-800 flex-shrink-0">
                                        <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Gerenciar Categorias</h3>
                                        <button
                                            onClick={() => setIsManagingCategories(false)}
                                            className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors touch-manipulation"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto overscroll-contain px-5 md:px-6 py-4 md:py-6 space-y-6">
                                        {/* Categories Section */}
                                        <div className="space-y-3">
                                            <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">Categorias Principais</h4>
                                            <div className="space-y-2">
                                                {categories.map((cat, idx) => (
                                                    <div key={idx} className="flex items-center justify-between py-3 md:py-2.5 px-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                                                        <span className="font-medium text-indigo-700 dark:text-indigo-300 text-sm md:text-base">{cat}</span>
                                                        <button
                                                            onClick={() => {
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
                                                            className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-indigo-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all touch-manipulation"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Add New Category */}
                                        <div className="pt-4 border-t border-indigo-100 dark:border-indigo-800/30">
                                            <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-3">Adicionar Nova Categoria</h4>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 px-4 py-3 md:py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 text-zinc-900 dark:text-white font-medium text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-indigo-400"
                                                    placeholder="Nome da categoria"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && newCategoryName.trim()) {
                                                            if (!categories.includes(newCategoryName.trim())) {
                                                                setCategories(prev => [...prev, newCategoryName.trim()])
                                                                setNewCategoryName('')
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
                                                            setCategories(prev => [...prev, newCategoryName.trim()])
                                                            setNewCategoryName('')
                                                        }
                                                    }}
                                                    disabled={!newCategoryName.trim()}
                                                    className="w-12 h-12 md:w-11 md:h-11 flex items-center justify-center bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Reset Categories */}
                                        <button
                                            onClick={() => {
                                                modal.confirm({
                                                    title: 'Restaurar Categorias',
                                                    message: 'Deseja restaurar as categorias padrão? Categorias personalizadas serão mantidas se houverem itens nelas, mas a lista principal será resetada.',
                                                    onConfirm: () => {
                                                        setCategories(defaultCategories)
                                                        showToast('Categorias restauradas', 'success')
                                                    }
                                                })
                                            }}
                                            className="w-full py-3 text-indigo-500 dark:text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all touch-manipulation"
                                        >
                                            Restaurar Categorias Padrão
                                        </button>

                                        {/* Divider */}
                                        <div className="border-t border-zinc-200/80 dark:border-zinc-700" />

                                        {/* Subcategories Section */}
                                        <div className="space-y-3">
                                            <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Subcategorias de Ingredientes</h4>
                                            <div className="space-y-2">
                                                {subcategories.filter(sub => sub !== 'None').map((sub, idx) => (
                                                    <div key={idx} className="flex items-center justify-between py-3 md:py-2.5 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700">
                                                        <span className="font-medium text-zinc-700 dark:text-zinc-300 text-sm md:text-base">{sub}</span>
                                                        <button
                                                            onClick={() => {
                                                                modal.confirm({
                                                                    title: 'Excluir Subcategoria',
                                                                    message: `Deseja excluir a subcategoria "${sub}"?`,
                                                                    isDangerous: true,
                                                                    onConfirm: () => {
                                                                        setSubcategories(prev => prev.filter(s => s !== sub))
                                                                        showToast('Subcategoria removida', 'success')
                                                                    }
                                                                })
                                                            }}
                                                            className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all touch-manipulation"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Add New Subcategory */}
                                        <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-700">
                                            <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-3">Adicionar Nova Subcategoria</h4>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 px-4 py-3 md:py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-base md:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-zinc-400"
                                                    placeholder="Nome da subcategoria"
                                                    value={newSubcategoryName}
                                                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && newSubcategoryName.trim()) {
                                                            if (!subcategories.includes(newSubcategoryName.trim())) {
                                                                setSubcategories(prev => [...prev, newSubcategoryName.trim()])
                                                                setNewSubcategoryName('')
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        if (newSubcategoryName.trim() && !subcategories.includes(newSubcategoryName.trim())) {
                                                            setSubcategories(prev => [...prev, newSubcategoryName.trim()])
                                                            setNewSubcategoryName('')
                                                        }
                                                    }}
                                                    disabled={!newSubcategoryName.trim()}
                                                    className="w-12 h-12 md:w-11 md:h-11 flex items-center justify-center bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Reset Subcategories */}
                                        <button
                                            onClick={() => {
                                                modal.confirm({
                                                    title: 'Restaurar Subcategorias',
                                                    message: 'Restaurar subcategorias padrão? Isso removerá todas as subcategorias personalizadas.',
                                                    isDangerous: true,
                                                    onConfirm: () => {
                                                        setSubcategories(defaultIngredientSubcategories)
                                                        showToast('Subcategorias restauradas', 'success')
                                                    }
                                                })
                                            }}
                                            className="w-full py-3 text-zinc-500 dark:text-zinc-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all touch-manipulation"
                                        >
                                            Restaurar Subcategorias Padrão
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }

            {/* Movement Modal */}
            {
                createPortal(
                    <AnimatePresence>
                        {movementModalOpen && (
                            <div className="fixed inset-0 z-[10000] flex items-start justify-center">
                                <ModalScrollLock />
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl"
                                    onClick={() => setMovementModalOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: -50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -50 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                                    className="relative w-full md:max-w-md bg-white dark:bg-zinc-900 md:bg-white/95 md:dark:bg-zinc-900/95 md:backdrop-blur-2xl md:rounded-[24px] shadow-2xl overflow-hidden mt-16 md:mt-20 mx-4 md:mx-0 rounded-2xl"
                                    style={{ marginTop: 'max(calc(env(safe-area-inset-top, 0px) + 60px), 60px)' }}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                                        <div className="w-12" />
                                        <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-white">Nova Movimentação</h3>
                                        <button
                                            onClick={() => setMovementModalOpen(false)}
                                            className="w-12 h-12 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                        >
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 mx-4" />

                                    <div className="px-6 py-6 space-y-5">
                                        {/* Type */}
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Tipo</label>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(MOVEMENT_TYPES).map(([k, v]) => (
                                                    <button
                                                        key={k}
                                                        onClick={() => setMovementForm(f => ({ ...f, type: k as 'entrada' | 'saida', reasonLabel: REASON_BY_TYPE[k as 'entrada' | 'saida'][0] || '', reasonNote: '' }))}
                                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${movementForm.type === k
                                                            ? `bg-${v.color}-50 dark:bg-${v.color}-500/20 text-${v.color}-600 dark:text-${v.color}-400 ring-2 ring-${v.color}-500/30`
                                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                                            }`}
                                                    >
                                                        {v.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Item Search */}
                                        <div className="relative">
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Item</label>
                                            <motion.div
                                                className="relative"
                                                animate={selectedMovementItem ? { scale: [1, 1.02, 1] } : {}}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {selectedMovementItem ? (
                                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                )}
                                                <input
                                                    type="text"
                                                    value={selectedMovementItem ? selectedMovementItem.name : movementItemSearch}
                                                    onChange={e => {
                                                        setMovementItemSearch(e.target.value)
                                                        setMovementForm(f => ({ ...f, itemId: 0 }))
                                                        setShowMovementItemResults(true)
                                                    }}
                                                    onFocus={() => setShowMovementItemResults(true)}
                                                    placeholder="Buscar ingrediente..."
                                                    className={`w-full h-14 pl-12 pr-12 rounded-2xl text-[17px] font-medium placeholder:text-zinc-400 outline-none transition-all ${selectedMovementItem
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                                                        }`}
                                                />
                                                {selectedMovementItem && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMovementForm(f => ({ ...f, itemId: 0 }))
                                                            setMovementItemSearch('')
                                                            setShowMovementItemResults(true)
                                                        }}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500 transition-colors"
                                                    >
                                                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </motion.div>
                                            {/* Dropdown */}
                                            <AnimatePresence>
                                                {showMovementItemResults && !selectedMovementItem && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -8 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden max-h-64 overflow-y-auto"
                                                    >
                                                        {modalFilteredItems.length === 0 ? (
                                                            <div className="px-4 py-6 text-center text-zinc-400 text-sm">Nenhum item encontrado</div>
                                                        ) : (
                                                            modalFilteredItems.map(i => (
                                                                <button
                                                                    key={i.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setMovementForm(f => ({ ...f, itemId: i.id, unit: (i.unit as typeof UNITS[number]) || 'kg' }))
                                                                        setMovementItemSearch('')
                                                                        setShowMovementItemResults(false)
                                                                    }}
                                                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-left"
                                                                >
                                                                    <span className="text-[15px] font-medium text-zinc-800 dark:text-zinc-100">{i.name}</span>
                                                                    <span className="text-xs text-zinc-400">{getStock(i).toFixed(1)} {i.unit}</span>
                                                                </button>
                                                            ))
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            {selectedMovementItem && <p className="text-xs text-zinc-400 mt-2 ml-1">Estoque atual: {getStock(selectedMovementItem).toFixed(2)} {selectedMovementItem.unit}</p>}
                                        </div>

                                        {/* Quantity + Unit */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Quantidade</label>
                                                <input
                                                    type="number"
                                                    value={movementForm.qty}
                                                    onChange={e => setMovementForm(f => ({ ...f, qty: e.target.value }))}
                                                    placeholder="0"
                                                    className="w-full h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[20px] font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-300 outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 tabular-nums"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Unidade</label>
                                                <select
                                                    value={movementForm.unit}
                                                    onChange={e => setMovementForm(f => ({ ...f, unit: e.target.value as typeof UNITS[number] }))}
                                                    className="w-full h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[17px] font-medium text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 cursor-pointer appearance-none"
                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '18px' }}
                                                >
                                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Reason Labels */}
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Motivo</label>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {REASON_BY_TYPE[movementForm.type].map((label: string) => (
                                                    <button
                                                        key={label}
                                                        type="button"
                                                        onClick={() => setMovementForm(f => ({ ...f, reasonLabel: label }))}
                                                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${movementForm.reasonLabel === label
                                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                            }`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                value={movementForm.reasonNote}
                                                onChange={e => setMovementForm(f => ({ ...f, reasonNote: e.target.value }))}
                                                placeholder="Digitar o motivo:"
                                                className="w-full h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Save */}
                                    <div className="px-6 pb-6">
                                        <button
                                            onClick={saveMovement}
                                            className="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            Salvar Movimentação
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }
        </div >
    )
}

// Export function to get inventory items (for use in other components)
// Uses Zustand store for persistence and sharing across components
export function useInventoryItems() {
    return useIngredients()
}
