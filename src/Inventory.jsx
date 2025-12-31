import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import { FirebaseService } from './services/firebaseService'
import { StockService, checkAndEmitReorderEvent } from './services/stockService'
import { useTaxConfig, TaxConfigService } from './services/taxConfigService'
import { formatCurrency } from './services/formatService'
import { HapticService } from './services/hapticService'
import { PriceHistoryService } from './services/priceHistoryService'
import { motion, AnimatePresence } from 'framer-motion'
import InvoiceScanner from './components/InvoiceScanner'

/**
 * Inventory - Premium inventory management with dual quantity tracking
 * Package size × Package count = Total quantity
 */

const STORAGE_KEY = 'padoca_inventory_v2'

const defaultCategories = ['Ingredientes', 'Embalagens', 'Utensílios', 'Outros']

// Default Subcategories for Ingredientes
const defaultIngredientSubcategories = ['None', 'Embutidos', 'Laticínios', 'Farináceos', 'Temperos', 'Vegetais', 'Produtos de Limpeza', 'Outros Ingredientes']

export default function Inventory() {
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) return JSON.parse(saved)

            // Migration: Check old storage
            const oldSaved = localStorage.getItem('padoca_inventory')
            if (oldSaved) {
                const oldItems = JSON.parse(oldSaved)
                // Migrate: old quantity becomes packageQuantity, packageCount = 1
                return oldItems.map(item => ({
                    ...item,
                    packageQuantity: item.quantity || 0,
                    packageCount: 1,
                    quantity: undefined // Remove old field
                }))
            }
            return []
        } catch {
            return []
        }
    })

    const [categories, setCategories] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY + '_categories')
            return saved ? JSON.parse(saved) : defaultCategories
        } catch {
            return defaultCategories
        }
    })

    const [isCloudSynced, setIsCloudSynced] = useState(false)
    const [syncStatus, setSyncStatus] = useState('synced') // 'synced' | 'syncing' | 'error'

    // Cloud Load
    useEffect(() => {
        const loadCloud = async () => {
            try {
                const data = await FirebaseService.getInventory()
                if (data) {
                    if (Array.isArray(data.items)) setItems(data.items)
                    if (Array.isArray(data.categories)) setCategories(data.categories)
                }

                // Load province from cloud settings
                const settings = await FirebaseService.getGlobalSettings()
                if (settings && settings.province) {
                    TaxConfigService.setProvince(settings.province)
                }
            } catch (err) {
                console.warn("Inventory cloud load failed", err)
            } finally {
                setIsCloudSynced(true)
            }
        }
        loadCloud()
    }, [])

    // Dynamic Province-based Tax (from TaxConfigService)
    const taxConfig = useTaxConfig()
    const taxRate = taxConfig.totalRate
    const taxDisplay = taxConfig.displayRate
    const provinceName = taxConfig.name
    const [isAddingItem, setIsAddingItem] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState('None')
    const [confirmModal, setConfirmModal] = useState(null)

    // Premium Toast System
    const [toastMessage, setToastMessage] = useState(null)
    const toastTimeoutRef = useRef(null)
    const showToast = useCallback((message, type = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
        setToastMessage({ message, type })
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500)
    }, [])

    // Custom subcategories state (user can add/edit)
    const [subcategories, setSubcategories] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY + '_subcategories')
            return saved ? JSON.parse(saved) : defaultIngredientSubcategories
        } catch {
            return defaultIngredientSubcategories
        }
    })

    // Category/Subcategory management modal state
    const [isManagingCategories, setIsManagingCategories] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newSubcategoryName, setNewSubcategoryName] = useState('')

    // Stock Management state
    const [stockFilter, setStockFilter] = useState('alerts') // 'all' | 'noLimits' | 'alerts' | 'ok'
    const [stockSearchQuery, setStockSearchQuery] = useState('')
    const [configuringItem, setConfiguringItem] = useState(null)

    // Invoice Scanner state
    const [showInvoiceScanner, setShowInvoiceScanner] = useState(false)
    const [geminiApiKey, setGeminiApiKey] = useState(() => {
        try {
            return localStorage.getItem('padoca_gemini_api_key') || ''
        } catch {
            return ''
        }
    })

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
        // Only run after initial cloud sync to avoid duplicate events
        if (!isCloudSynced) return

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

        // Trigger reorder event for items with supplier configured
        lowStockItems.forEach(item => {
            checkAndEmitReorderEvent(item)
        })
    }, [items, isCloudSynced])

    // Suppliers state
    const [suppliers, setSuppliers] = useState([])
    const [supplierSearchQuery, setSupplierSearchQuery] = useState('')
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)

    // Load suppliers from Firebase
    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const data = await FirebaseService.getSuppliers()
                if (data?.suppliers) {
                    setSuppliers(data.suppliers)
                }
            } catch (e) {
                console.error('Error loading suppliers:', e)
            }
        }
        loadSuppliers()
    }, [])

    // Helper: Check if supplier name matches exactly (same name and word count)
    const isExactSupplierMatch = useCallback((searchTerm, supplierName) => {
        if (!searchTerm || !supplierName) return false
        const normalizedSearch = searchTerm.trim().toLowerCase()
        const normalizedSupplier = supplierName.trim().toLowerCase()
        // Must be exactly equal AND have same word count
        const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 0)
        const supplierWords = normalizedSupplier.split(/\s+/).filter(w => w.length > 0)
        return normalizedSearch === normalizedSupplier && searchWords.length === supplierWords.length
    }, [])

    // Filter suppliers based on search - only show when pattern is found (min 2 chars)
    const filteredSuppliers = useMemo(() => {
        const query = supplierSearchQuery.trim().toLowerCase()
        // Only show suggestions if at least 2 characters are typed
        if (query.length < 2) return []
        return suppliers.filter(s =>
            s.name?.toLowerCase().includes(query) ||
            s.company?.toLowerCase().includes(query)
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
        enableAutoQuotation: false
    })

    // Track if initial load is complete
    const hasInitialLoadRef = useRef(false)

    // Cloud Sync Debounce
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        localStorage.setItem(STORAGE_KEY + '_categories', JSON.stringify(categories))
        localStorage.setItem(STORAGE_KEY + '_subcategories', JSON.stringify(subcategories))

        // Only dispatch event and sync after initial load
        if (!hasInitialLoadRef.current) {
            hasInitialLoadRef.current = true
            return
        }

        // Dispatch custom event for same-tab updates (debounced to prevent loops)
        const eventTimer = setTimeout(() => {
            window.dispatchEvent(new Event('inventory-updated'))
        }, 100)

        if (isCloudSynced) {
            setSyncStatus('syncing')
            const timer = setTimeout(async () => {
                try {
                    const success = await FirebaseService.syncInventory(items, categories)
                    setSyncStatus(success ? 'synced' : 'error')
                } catch (e) {
                    setSyncStatus('error')
                }
            }, 1500) // 1.5s debounce

            return () => {
                clearTimeout(timer)
                clearTimeout(eventTimer)
            }
        }

        return () => clearTimeout(eventTimer)
    }, [items, categories, subcategories, isCloudSynced])

    // Calculate total quantity for an item (total weight/volume)
    // Use centralized StockService for consistency
    const getTotalQuantity = (item) => StockService.getTotalQuantity(item)

    // Stock status indicator - Apple-quality 5-tier system
    // Use centralized StockService for consistency across the app
    const getStockStatus = (item) => {
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
    const getItemTotal = (item) => {
        const packageCount = Number(item.packageCount) || 1
        return packageCount * (Number(item.pricePerUnit) || 0)
    }

    // Calculate totals
    const totals = useMemo(() => {
        const totalValue = items.reduce((sum, item) => sum + getItemTotal(item), 0)
        const itemCount = items.length

        // Group by category
        const byCategory = items.reduce((acc, item) => {
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
            enableAutoQuotation: false
        })
        setSupplierSearchQuery('')
        setIsAddingItem(false)
    }

    // Update item
    const handleUpdateItem = (id, field, value) => {
        setItems(prev => prev.map(item => {
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
    const handleDeleteItem = (id) => {
        setConfirmModal({
            title: 'Excluir Item',
            message: 'Este item será removido permanentemente do estoque.',
            type: 'danger',
            onConfirm: () => {
                setItems(prev => prev.filter(item => item.id !== id))
                setEditingId(null)
                setConfirmModal(null)
            },
            onCancel: () => setConfirmModal(null)
        })
    }

    // Filter items by search and subcategory
    const filteredItems = useMemo(() => {
        let filtered = items

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(query) ||
                (item.subcategory && item.subcategory.toLowerCase().includes(query))
            )
        }

        // Subcategory filter
        if (activeSubcategoryFilter) {
            filtered = filtered.filter(item => item.subcategory === activeSubcategoryFilter)
        }

        return filtered
    }, [items, searchQuery, activeSubcategoryFilter])

    // Group items by category (using filtered items)
    const groupedItems = useMemo(() => {
        return categories.reduce((acc, cat) => {
            const categoryItems = filteredItems.filter(item => item.category === cat)
            if (categoryItems.length > 0) {
                acc[cat] = categoryItems
            }
            return acc
        }, {})
    }, [filteredItems, categories])

    // Tools matching Costs.jsx
    const fileRef = React.useRef(null)

    const exportCSV = () => {
        try {
            const header = ['ID', 'Item', 'Categoria', 'Qtd Pacote', 'Unidade', 'Nº Pacotes', 'Total Qtd', 'Preço/Pacote', 'Valor Total']
            const rows = items.map(item => {
                const totalQty = StockService.getTotalQuantity(item)
                const totalVal = (Number(item.packageCount) || 1) * (Number(item.pricePerUnit) || 0)
                return [
                    item.id,
                    `"${item.name.replace(/"/g, '""')}"`,
                    `"${item.category}"`,
                    item.packageQuantity,
                    item.unit,
                    item.packageCount,
                    totalQty,
                    Number(item.pricePerUnit).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                ]
            })

            const csvContent = "\uFEFF" + [header.join(";"), ...rows.map(e => e.join(";"))].join("\n")
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `padoca_estoque_${new Date().toISOString().split('T')[0]}.csv`
            link.click()
            showToast('Relatório de Estoque exportado!', 'success')
        } catch (e) {
            console.error(e)
            showToast('Erro ao exportar CSV', 'error')
        }
    }

    const exportJSON = () => {
        try {
            const data = JSON.stringify({ version: '2', items, categories }, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `padoca_estoque_backup_${new Date().toISOString().split('T')[0]}.json`
            a.click()
            showToast('Backup de Estoque realizado!', 'success')
        } catch (e) {
            showToast('Erro ao realizar backup', 'error')
        }
    }

    const importJSON = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = evt => {
            try {
                const parsed = JSON.parse(String(evt.target.result || '{}'))
                if (parsed.items && Array.isArray(parsed.items)) {
                    setItems(parsed.items)
                    if (parsed.categories) setCategories(parsed.categories)
                    showToast('Dados de Estoque restaurados!', 'success')
                } else {
                    throw new Error('Formato inválido')
                }
            } catch (err) {
                showToast('Arquivo de backup inválido', 'error')
            }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    const clearAllData = () => {
        setConfirmModal({
            title: 'Limpar Estoque',
            message: 'Atenção: Isso apagará TODO o estoque permanentemente. Esta ação não pode ser desfeita.',
            type: 'danger',
            onConfirm: () => {
                setItems([])
                localStorage.setItem(STORAGE_KEY, '[]')
                setConfirmModal(null)
            },
            onCancel: () => setConfirmModal(null)
        })
    }

    // Handle scanned invoice items
    const handleInvoiceScanned = useCallback(async (scannedItems, metadata) => {
        HapticService.trigger('batchCommit')

        const newItems = scannedItems.map((item, idx) => {
            // Check if this item matches an existing product
            const existingProduct = item.matchedProductId
                ? items.find(i => i.id === item.matchedProductId)
                : null

            if (existingProduct) {
                // Update existing product's price and add to stock
                const updatedPriceHistory = PriceHistoryService.addEntry(existingProduct, {
                    price: item.pricePerUnit,
                    source: 'invoice',
                    supplierId: metadata?.supplierId,
                    supplierName: metadata?.vendor
                })

                return {
                    ...existingProduct,
                    packageCount: (existingProduct.packageCount || 0) + (item.packageCount || 1),
                    pricePerUnit: item.pricePerUnit || existingProduct.pricePerUnit,
                    priceHistory: JSON.stringify(updatedPriceHistory),
                    confidenceScore: item.confidenceScore,
                    aiMetadata: item.aiMetadata,
                    updatedAt: new Date().toISOString()
                }
            } else {
                // Create new item
                return {
                    id: Date.now() + idx,
                    name: item.name,
                    packageQuantity: item.packageQuantity || 1,
                    packageCount: item.packageCount || 1,
                    unit: item.unit || 'un',
                    pricePerUnit: item.pricePerUnit || 0,
                    category: item.category || 'Ingredientes',
                    subcategory: item.subcategory || 'Outros Ingredientes',
                    purchaseDate: new Date().toISOString().split('T')[0],
                    supplierId: metadata?.supplierId || null,
                    supplierName: metadata?.vendor || '',
                    minStock: 0,
                    maxStock: 0,
                    confidenceScore: item.confidenceScore || 0,
                    semanticMapping: item.semanticMapping,
                    aiMetadata: item.aiMetadata,
                    priceHistory: JSON.stringify([{
                        date: new Date().toISOString(),
                        price: item.pricePerUnit || 0,
                        source: 'invoice',
                        supplierName: metadata?.vendor
                    }]),
                    createdAt: new Date().toISOString()
                }
            }
        })

        // Merge new items with existing (update matched, add new)
        const updatedItems = items.map(existingItem => {
            const matchedNew = newItems.find(ni => ni.id === existingItem.id)
            return matchedNew || existingItem
        })

        // Add truly new items (not matched to existing)
        const trulyNewItems = newItems.filter(ni => !items.some(ei => ei.id === ni.id))

        setItems([...updatedItems, ...trulyNewItems])
        setShowInvoiceScanner(false)
        showToast(`${scannedItems.length} itens adicionados ao estoque via IA!`, 'success')
    }, [items, showToast])

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            {/* Ultra-Subtle Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header: Identity & Actions */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Estoque</h1>
                        {/* Sync Status Badge */}
                        <div className={`mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 ${syncStatus === 'syncing'
                            ? 'bg-amber-500/5 border-amber-500/10 text-amber-500 animate-pulse'
                            : syncStatus === 'error'
                                ? 'bg-red-500/5 border-red-500/10 text-red-500'
                                : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80'
                            }`}>
                            <div className={`w-1 h-1 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500' : syncStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                                }`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                {syncStatus === 'syncing' ? 'Cloud Syncing' : syncStatus === 'error' ? 'Sync Error' : 'Cloud Active'}
                            </span>
                        </div>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Gestão inteligente de insumos e provisões</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Invoice Scanner Button */}
                    <button
                        onClick={() => setShowInvoiceScanner(true)}
                        className="hidden md:flex w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all items-center justify-center gap-2 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Scan Nota
                    </button>

                    <button
                        onClick={() => setIsAddingItem(true)}
                        className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
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
                        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

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

                        <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100 dark:border-white/5">
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
                        const color = colors[cat] || colors['Outros']
                        const value = totals.byCategory[cat] || 0
                        const valueWithTax = value * (1 + taxRate)
                        const allocation = (value / totals.totalValue * 100 || 0).toFixed(0)

                        return (
                            <div key={cat} className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-3xl p-5 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all">
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
                                        <div className={`h-full ${color.bg} transition-all duration-1000`} style={{ width: `${allocation}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Add Item Modal - Apple Compact Pill */}
            <AnimatePresence>
                {isAddingItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center p-0 md:p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsAddingItem(false)}
                        />
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: "spring", damping: 32, stiffness: 380 }}
                            className="relative bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl w-full max-w-[380px] rounded-t-[28px] md:rounded-[28px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 flex flex-col overflow-hidden max-h-[85vh] md:max-h-[80vh]"
                            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                        >
                            <ModalScrollLock />

                            {/* Drag Handle - Apple delicate pill */}
                            <div className="md:hidden flex justify-center pt-2 pb-1">
                                <div className="w-8 h-1 rounded-full bg-zinc-300/60 dark:bg-zinc-600/60" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100/80 dark:border-white/5">
                                <div>
                                    <h2 className="text-[17px] font-semibold text-zinc-900 dark:text-white tracking-tight">Novo Item</h2>
                                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Adicionar ao estoque</p>
                                </div>
                                <button
                                    onClick={() => setIsAddingItem(false)}
                                    className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all active:scale-90"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Scrollable Content - Apple Inset Grouped */}
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

                                {/* Basic Info Group */}
                                <div className="bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50 rounded-[14px] overflow-hidden border border-black/5 dark:border-white/5 divide-y divide-zinc-200/50 dark:divide-zinc-700/50">
                                    <div className="flex items-center px-4 py-2.5">
                                        <label className="w-20 text-[13px] text-zinc-500 dark:text-zinc-400 shrink-0">Nome</label>
                                        <input
                                            type="text"
                                            className="flex-1 bg-transparent text-[15px] font-medium text-zinc-900 dark:text-white outline-none placeholder:text-zinc-300 text-right"
                                            placeholder="Obrigatório"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex items-center px-4 py-2.5">
                                        <label className="w-20 text-[13px] text-zinc-500 dark:text-zinc-400 shrink-0">Categoria</label>
                                        <select
                                            className="flex-1 bg-transparent text-[15px] font-medium text-zinc-900 dark:text-white outline-none text-right appearance-none cursor-pointer"
                                            value={newItem.category}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value, subcategory: e.target.value === 'Ingredientes' ? 'Outros Ingredientes' : null }))}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {newItem.category === 'Ingredientes' && (
                                        <div className="flex items-center px-4 py-2.5">
                                            <label className="w-20 text-[13px] text-zinc-500 dark:text-zinc-400 shrink-0">Subcategoria</label>
                                            <select
                                                className="flex-1 bg-transparent text-[15px] font-medium text-zinc-900 dark:text-white outline-none text-right appearance-none cursor-pointer"
                                                value={newItem.subcategory}
                                                onChange={(e) => setNewItem(prev => ({ ...prev, subcategory: e.target.value }))}
                                            >
                                                {subcategories.map(sub => (
                                                    <option key={sub} value={sub}>{sub}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Package Info Group */}
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 px-2 mb-1.5">Embalagem</p>
                                    <div className="bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50 rounded-[14px] overflow-hidden border border-black/5 dark:border-white/5 divide-y divide-zinc-200/50 dark:divide-zinc-700/50">
                                        <div className="flex items-center px-4 py-2.5">
                                            <label className="w-20 text-[13px] text-zinc-500 dark:text-zinc-400 shrink-0">Qtd</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                inputMode="decimal"
                                                className="flex-1 bg-transparent text-[15px] font-medium text-zinc-900 dark:text-white outline-none text-right placeholder:text-zinc-300"
                                                placeholder="25"
                                                value={newItem.packageQuantity}
                                                onChange={(e) => setNewItem(prev => ({ ...prev, packageQuantity: e.target.value }))}
                                            />
                                            <select
                                                className="ml-2 bg-transparent text-[15px] font-medium text-zinc-500 outline-none appearance-none cursor-pointer"
                                                value={newItem.unit}
                                                onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                                            >
                                                <option value="kg">kg</option>
                                                <option value="g">g</option>
                                                <option value="L">L</option>
                                                <option value="ml">ml</option>
                                                <option value="un">un</option>
                                                <option value="cx">cx</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center px-4 py-2.5">
                                            <label className="w-20 text-[13px] text-zinc-500 dark:text-zinc-400 shrink-0">Nº Pacotes</label>
                                            <input
                                                type="number"
                                                min="1"
                                                inputMode="numeric"
                                                className="flex-1 bg-transparent text-[15px] font-medium text-zinc-900 dark:text-white outline-none text-right placeholder:text-zinc-300"
                                                placeholder="1"
                                                value={newItem.packageCount}
                                                onChange={(e) => setNewItem(prev => ({ ...prev, packageCount: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex items-center px-4 py-2.5">
                                            <label className="w-20 text-[13px] text-emerald-500 shrink-0">Preço</label>
                                            <span className="text-emerald-500 text-[15px] font-medium">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                inputMode="decimal"
                                                className="flex-1 bg-transparent text-[15px] font-medium text-zinc-900 dark:text-white outline-none text-right placeholder:text-zinc-300"
                                                placeholder="0.00"
                                                value={newItem.pricePerUnit}
                                                onChange={(e) => setNewItem(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Supplier Group */}
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 px-2 mb-1.5">Fornecedor</p>
                                    <div className="bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50 rounded-[14px] overflow-hidden border border-black/5 dark:border-white/5 relative">
                                        {newItem.supplierId ? (
                                            <div className="flex items-center px-4 py-2.5">
                                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold mr-3">
                                                    {newItem.supplierName?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <span className="flex-1 text-[15px] font-medium text-zinc-900 dark:text-white">{newItem.supplierName}</span>
                                                <button
                                                    onClick={() => { setNewItem(prev => ({ ...prev, supplierId: null, supplierName: '' })); setSupplierSearchQuery('') }}
                                                    className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-rose-500 transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center px-4 py-2.5">
                                                    <input
                                                        type="text"
                                                        className="flex-1 bg-transparent text-[15px] font-medium text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400"
                                                        placeholder="Buscar fornecedor..."
                                                        value={supplierSearchQuery}
                                                        onChange={(e) => {
                                                            const value = e.target.value
                                                            setSupplierSearchQuery(value)
                                                            setShowSupplierDropdown(true)
                                                            const exactMatch = suppliers.find(s => isExactSupplierMatch(value, s.name))
                                                            if (exactMatch) {
                                                                setNewItem(prev => ({ ...prev, supplierId: exactMatch.id, supplierName: exactMatch.name }))
                                                                setSupplierSearchQuery('')
                                                                setShowSupplierDropdown(false)
                                                            }
                                                        }}
                                                        onFocus={() => setShowSupplierDropdown(true)}
                                                    />
                                                </div>
                                                {showSupplierDropdown && filteredSuppliers.length > 0 && (
                                                    <div className="border-t border-zinc-200/50 dark:border-zinc-700/50 max-h-32 overflow-y-auto">
                                                        {filteredSuppliers.map(supplier => (
                                                            <button
                                                                key={supplier.id}
                                                                onClick={() => { setNewItem(prev => ({ ...prev, supplierId: supplier.id, supplierName: supplier.name })); setSupplierSearchQuery(''); setShowSupplierDropdown(false) }}
                                                                className="w-full px-4 py-2.5 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                                                            >
                                                                <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                                    {supplier.name?.charAt(0)?.toUpperCase()}
                                                                </div>
                                                                <span className="text-[14px] text-zinc-900 dark:text-white">{supplier.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Stock Limits Group */}
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider font-semibold text-amber-500 px-2 mb-1.5">Alertas de Estoque</p>
                                    <div className="bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50 rounded-[14px] overflow-hidden border border-black/5 dark:border-white/5 divide-y divide-zinc-200/50 dark:divide-zinc-700/50">
                                        <div className="flex items-center px-4 py-2.5">
                                            <label className="w-20 text-[13px] text-zinc-500 dark:text-zinc-400 shrink-0">Mínimo</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                inputMode="decimal"
                                                className="flex-1 bg-transparent text-[15px] font-medium text-zinc-900 dark:text-white outline-none text-right placeholder:text-zinc-300"
                                                placeholder="0"
                                                value={newItem.minStock}
                                                onChange={(e) => setNewItem(prev => ({ ...prev, minStock: e.target.value }))}
                                            />
                                            <span className="ml-2 text-[13px] text-zinc-400">{newItem.unit}</span>
                                        </div>
                                        <div className="flex items-center px-4 py-2.5">
                                            <label className="w-20 text-[13px] text-zinc-500 dark:text-zinc-400 shrink-0">Máximo</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                inputMode="decimal"
                                                className="flex-1 bg-transparent text-[15px] font-medium text-zinc-900 dark:text-white outline-none text-right placeholder:text-zinc-300"
                                                placeholder="0"
                                                value={newItem.maxStock}
                                                onChange={(e) => setNewItem(prev => ({ ...prev, maxStock: e.target.value }))}
                                            />
                                            <span className="ml-2 text-[13px] text-zinc-400">{newItem.unit}</span>
                                        </div>
                                        {newItem.supplierId && newItem.minStock > 0 && (
                                            <div className="flex items-center justify-between px-4 py-2.5">
                                                <span className="text-[13px] text-zinc-500 dark:text-zinc-400">Cotação Auto</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewItem(prev => ({ ...prev, enableAutoQuotation: !prev.enableAutoQuotation }))}
                                                    className={`relative w-11 h-[26px] rounded-full transition-colors ${newItem.enableAutoQuotation ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                                                >
                                                    <span className={`absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${newItem.enableAutoQuotation ? 'translate-x-[18px]' : ''}`} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mt-1 px-2">Deixe em 0 para desativar alertas</p>
                                </div>

                                {/* Summary - Minimal */}
                                {newItem.packageQuantity && newItem.packageCount && (
                                    <div className="flex items-center justify-between px-2 py-2">
                                        <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Total</span>
                                        <div className="text-right">
                                            <span className="text-[17px] font-semibold text-zinc-900 dark:text-white">
                                                {Number(newItem.packageQuantity) * Number(newItem.packageCount)} {newItem.unit}
                                            </span>
                                            {newItem.pricePerUnit && (
                                                <span className="ml-2 text-[17px] font-semibold text-emerald-500">
                                                    {formatCurrency(Number(newItem.packageCount) * Number(newItem.pricePerUnit))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="px-4 py-3 border-t border-zinc-100/80 dark:border-white/5 flex gap-2">
                                <button
                                    onClick={() => setIsAddingItem(false)}
                                    className="flex-1 py-2.5 rounded-xl font-semibold text-[15px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 active:scale-[0.98] transition-transform"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddItem}
                                    disabled={!newItem.name.trim()}
                                    className="flex-[2] py-2.5 rounded-xl font-semibold text-[15px] text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 active:scale-[0.98] transition-transform disabled:opacity-40"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                    <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            onClick={() => setActiveSubcategoryFilter(null)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeSubcategoryFilter === null
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                }`}
                        >
                            Todos
                        </button>
                        {subcategories.map(sub => (
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
                    </div>

                    {/* Active Filters Indicator */}
                    {(searchQuery || activeSubcategoryFilter) && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
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
            {Object.keys(groupedItems).length > 0 && (
                <div className="space-y-8">
                    {Object.entries(groupedItems).map(([category, categoryItems]) => (
                        <div key={category} className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
                            {/* Category Header */}
                            <div className="px-8 py-6 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between">
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
                                <div className="grid grid-cols-12 gap-6 px-8 py-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/30 dark:bg-white/[0.01]">
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
                                                    {/* Edit Mode - Clean & Minimal */}
                                                    <div className="col-span-2">
                                                        <input
                                                            type="text"
                                                            className="w-full px-3 py-2 -ml-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                                                            value={item.name}
                                                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-16 px-2 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-right text-sm font-medium"
                                                            value={item.packageQuantity}
                                                            onChange={(e) => handleUpdateItem(item.id, 'packageQuantity', e.target.value)}
                                                        />
                                                        <select
                                                            className="w-14 px-1 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-sm font-medium"
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
                                                            className="w-full px-2 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-center text-sm font-medium"
                                                            value={item.packageCount}
                                                            onChange={(e) => handleUpdateItem(item.id, 'packageCount', e.target.value)}
                                                        />
                                                    </div>
                                                    {/* Subcategory Dropdown */}
                                                    {item.category === 'Ingredientes' && (
                                                        <div className="col-span-2">
                                                            <select
                                                                className="w-full px-2 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                                                value={item.subcategory || ''}
                                                                onChange={(e) => handleUpdateItem(item.id, 'subcategory', e.target.value)}
                                                            >
                                                                {subcategories.map(sub => (
                                                                    <option key={sub} value={sub}>{sub}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                    {item.category !== 'Ingredientes' && (
                                                        <div className="col-span-2 text-right">
                                                            <span className="text-sm font-medium text-zinc-400 px-3">
                                                                {getTotalQuantity(item)} {item.unit}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="col-span-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full px-2 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-right text-sm font-medium"
                                                            value={item.pricePerUnit}
                                                            onChange={(e) => handleUpdateItem(item.id, 'pricePerUnit', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-span-3 flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="p-2 rounded-full text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-all"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
                                                            className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-800 dark:text-zinc-100 font-semibold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-zinc-300"
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
                                                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-center font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                                                    value={item.packageQuantity}
                                                                    onChange={(e) => handleUpdateItem(item.id, 'packageQuantity', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Unidade</label>
                                                            <div className="relative">
                                                                <select
                                                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 font-bold text-center appearance-none text-zinc-700 dark:text-zinc-300 focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all"
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
                                                                className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-center font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all"
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
                                                                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-right font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all"
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
                                                                className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none"
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
                                                            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tabular-nums uppercase tracking-wide">
                                                                {getTotalQuantity(item)} {item.unit} em estoque
                                                            </div>
                                                        </div>
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-900 dark:bg-white text-[10px] font-semibold text-white dark:text-zinc-900 shadow-sm ring-1 ring-inset ring-white/10 dark:ring-black/10">
                                                            {item.packageCount} pcts
                                                        </span>
                                                    </div>

                                                    <div className="flex items-end justify-between pt-4 border-t border-dashed border-zinc-100 dark:border-white/5">
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
                            <div className="px-8 py-4 bg-zinc-50/50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total {category}</span>
                                <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{formatCurrency((totals.byCategory[category] || 0) * (1 + taxRate))}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State - Only shown when no items AND filter is not 'None' */}
            {Object.keys(groupedItems).length === 0 && activeSubcategoryFilter !== 'None' && (
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
            )}
            {/* Stock Management - Refined Apple Design */}
            <section className="relative z-10 mt-6 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-2xl p-5 md:p-6 border border-zinc-200/50 dark:border-white/5 shadow-xl shadow-zinc-900/[0.04] dark:shadow-black/20"
                >
                    {/* Header - Clean Apple Typography */}
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">Níveis</h2>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">Monitoramento de estoque</p>
                        </div>
                    </div>

                    {/* True iOS Segmented Control */}
                    <div className="relative mb-6">
                        {/* Track Container */}
                        <div className="relative flex bg-zinc-100/90 dark:bg-zinc-800/90 backdrop-blur-sm p-1 rounded-[10px] overflow-x-auto scrollbar-hide md:overflow-visible">
                            {/* Animated Indicator */}
                            <motion.div
                                className="absolute top-1 bottom-1 bg-white dark:bg-zinc-700 rounded-lg shadow-sm"
                                initial={false}
                                animate={{
                                    width: `calc(${100 / 4}% - 2px)`,
                                    x: `calc(${['alerts', 'ok', 'noLimits', 'all'].indexOf(stockFilter) * 100}% + 1px)`
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />

                            {/* Tab Buttons */}
                            {[
                                { id: 'alerts', label: 'Crítico' },
                                { id: 'ok', label: 'Normal' },
                                { id: 'noLimits', label: 'S/ Limite' },
                                { id: 'all', label: 'Todos' }
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setStockFilter(filter.id)}
                                    className={`
                                        relative flex-1 min-w-[60px] py-2 px-1.5 text-center z-10 transition-colors duration-200
                                        ${stockFilter === filter.id
                                            ? 'text-zinc-900 dark:text-white'
                                            : 'text-zinc-500 dark:text-zinc-400'
                                        }
                                    `}
                                >
                                    <span className="text-[13px] font-semibold tracking-[-0.01em]">
                                        {filter.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search - Refined */}
                    <div className="relative mb-6">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={stockSearchQuery}
                            onChange={(e) => setStockSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-0 text-zinc-900 dark:text-white text-sm font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/20 transition-shadow"
                        />
                    </div>

                    {/* Items List - Premium Cards */}
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto overscroll-contain pr-1 -mr-1">
                        {items
                            .filter(item => {
                                const status = getStockStatus(item)
                                if (stockFilter === 'noLimits') return status === 'noLimit'
                                if (stockFilter === 'alerts') return ['low', 'warning', 'high'].includes(status)
                                if (stockFilter === 'ok') return status === 'ok' || status === 'adequate'
                                return true
                            })
                            .filter(item => {
                                if (!stockSearchQuery.trim()) return true
                                return item.name.toLowerCase().includes(stockSearchQuery.toLowerCase())
                            })
                            .map(item => {
                                const status = getStockStatus(item)
                                const total = getTotalQuantity(item)
                                const min = Number(item.minStock) || 0
                                const max = Number(item.maxStock) || 0

                                let progress = 0
                                if (max > 0) progress = Math.min((total / max) * 100, 100)
                                else if (min > 0) progress = Math.min((total / (min * 2)) * 100, 100)

                                const statusStyles = {
                                    low: { bg: 'bg-rose-50 dark:bg-rose-500/5', accent: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
                                    warning: { bg: 'bg-amber-50 dark:bg-amber-500/5', accent: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
                                    high: { bg: 'bg-violet-50 dark:bg-violet-500/5', accent: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400' },
                                    ok: { bg: 'bg-zinc-50 dark:bg-zinc-800/30', accent: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
                                    adequate: { bg: 'bg-sky-50 dark:bg-sky-500/5', accent: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400' },
                                    noLimit: { bg: 'bg-zinc-50 dark:bg-zinc-800/30', accent: 'bg-zinc-300 dark:bg-zinc-600', text: 'text-zinc-500 dark:text-zinc-400' }
                                }
                                const style = statusStyles[status] || statusStyles.noLimit

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setConfiguringItem(item)}
                                        className={`group p-3.5 rounded-xl ${style.bg} cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${style.accent} flex items-center justify-center shadow-sm`}>
                                                <span className="text-white text-sm font-semibold tabular-nums">{total}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-zinc-900 dark:text-white truncate">{item.name}</h4>
                                                <p className={`text-xs font-medium mt-0.5 ${style.text}`}>
                                                    {total} {item.unit} {min > 0 && `· min ${min}`} {max > 0 && `· max ${max}`}
                                                </p>
                                                {(min > 0 || max > 0) && (
                                                    <div className="mt-2 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                        <div className={`h-full ${style.accent} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                                                    </div>
                                                )}
                                            </div>
                                            <svg className="w-5 h-5 text-zinc-300 group-hover:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )
                            })}
                        {items.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <p className="text-zinc-500 font-medium">Nenhum item</p>
                            </div>
                        )}
                    </div>

                    {/* Footer - Minimalist */}
                    <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <button onClick={() => setIsManagingCategories(true)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            Categorias
                        </button>
                        <div className="flex items-center gap-4">
                            <button onClick={exportCSV} className="text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-colors">Exportar</button>
                            <button onClick={clearAllData} className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors">Limpar</button>
                        </div>
                        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
                    </div>
                </motion.div>
            </section>

            {/* Item Configuration Modal */}
            {configuringItem && createPortal(
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
                    <ModalScrollLock />
                    <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setConfiguringItem(null)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl">
                        {/* Header with Close Button */}
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Configurar Limites</h3>
                            <button
                                onClick={() => setConfiguringItem(null)}
                                className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Item Info */}
                            <div className="text-center mb-6">
                                <div className={`inline-flex w-16 h-16 rounded-2xl items-center justify-center text-2xl font-bold text-white mb-4 ${getStockStatus(configuringItem) === 'low' ? 'bg-gradient-to-br from-rose-500 to-rose-600' : getStockStatus(configuringItem) === 'warning' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : getStockStatus(configuringItem) === 'high' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
                                    {configuringItem.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <h4 className="text-xl font-bold text-zinc-900 dark:text-white">{configuringItem.name}</h4>
                                <p className="text-sm text-zinc-500 mt-1">Estoque atual: <span className="font-bold text-zinc-900 dark:text-white">{getTotalQuantity(configuringItem)} {configuringItem.unit}</span></p>
                            </div>

                            {/* Min/Max Inputs */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Estoque Mínimo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        inputMode="decimal"
                                        className="w-full px-4 py-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-zinc-900 dark:text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                                        placeholder="0"
                                        value={configuringItem.minStock || ''}
                                        onChange={(e) => { handleUpdateItem(configuringItem.id, 'minStock', e.target.value); setConfiguringItem(prev => ({ ...prev, minStock: Number(e.target.value) || 0 })) }}
                                    />
                                    <p className="text-[10px] text-amber-500 text-center mt-1">{configuringItem.unit}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Estoque Máximo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        inputMode="decimal"
                                        className="w-full px-4 py-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-zinc-900 dark:text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                                        placeholder="0"
                                        value={configuringItem.maxStock || ''}
                                        onChange={(e) => { handleUpdateItem(configuringItem.id, 'maxStock', e.target.value); setConfiguringItem(prev => ({ ...prev, maxStock: Number(e.target.value) || 0 })) }}
                                    />
                                    <p className="text-[10px] text-blue-500 text-center mt-1">{configuringItem.unit}</p>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={() => setConfiguringItem(null)}
                                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Salvar Limites
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Category Management Modal */}
            {isManagingCategories && (
                <div className="fixed inset-0 z-[10000] flex items-start md:items-center justify-center p-4 pt-20 md:pt-4">
                    <ModalScrollLock />
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsManagingCategories(false)}
                    ></div>

                    {/* Modal Content */}
                    <div
                        className="relative w-full md:max-w-lg bg-white dark:bg-zinc-900 rounded-2xl md:rounded-[2rem] p-6 pb-8 md:p-8 shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar"
                    >

                        {/* Drag Handle (Mobile only) */}
                        <div className="md:hidden w-full flex justify-center mb-6">
                            <div className="w-12 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700/50"></div>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Gerenciar Categorias</h3>
                            <button
                                onClick={() => setIsManagingCategories(false)}
                                className="w-11 h-11 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors touch-manipulation"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Categories List */}
                        <div className="space-y-4 mb-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Categorias Principais</h4>
                                <div className="space-y-2">
                                    {categories.map((cat, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                                            <span className="font-medium text-indigo-700 dark:text-indigo-300">{cat}</span>
                                            <button
                                                onClick={() => {
                                                    setConfirmModal({
                                                        title: 'Excluir Categoria',
                                                        message: `Excluir categoria "${cat}"? Itens desta categoria serão movidos para "Outros".`,
                                                        type: 'danger',
                                                        onConfirm: () => {
                                                            setCategories(prev => prev.filter(c => c !== cat))
                                                            setItems(prev => prev.map(item => item.category === cat ? { ...item, category: 'Outros' } : item))
                                                            setConfirmModal(null)
                                                            showToast('Categoria removida', 'success')
                                                        },
                                                        onCancel: () => setConfirmModal(null)
                                                    })
                                                }}
                                                className="w-11 h-11 flex items-center justify-center rounded-xl text-indigo-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all touch-manipulation"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Add New Category */}
                            <div className="pt-4 border-t border-indigo-100 dark:border-indigo-800/30">
                                <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">Adicionar Nova Categoria</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-indigo-400"
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
                                        className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    setConfirmModal({
                                        title: 'Restaurar Categorias',
                                        message: 'Deseja restaurar as categorias padrão? Categorias personalizadas serão mantidas se houverem itens nelas, mas a lista principal será resetada.',
                                        type: 'default',
                                        onConfirm: () => {
                                            setCategories(defaultCategories)
                                            setConfirmModal(null)
                                            showToast('Categorias restauradas', 'success')
                                        },
                                        onCancel: () => setConfirmModal(null)
                                    })
                                }}
                                className="w-full py-2 text-indigo-500 dark:text-indigo-400 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:text-indigo-700 dark:hover:text-indigo-300 transition-all"
                            >
                                Restaurar Categorias Padrão
                            </button>
                        </div>

                        {/* Subcategories List */}
                        <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-700">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Subcategorias de Ingredientes</h4>
                                <div className="space-y-2">
                                    {subcategories.map((sub, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{sub}</span>
                                            <button
                                                onClick={() => {
                                                    setConfirmModal({
                                                        title: 'Excluir Subcategoria',
                                                        message: `Deseja excluir a subcategoria "${sub}"?`,
                                                        type: 'danger',
                                                        onConfirm: () => {
                                                            setSubcategories(prev => prev.filter(s => s !== sub))
                                                            setConfirmModal(null)
                                                            showToast('Subcategoria removida', 'success')
                                                        },
                                                        onCancel: () => setConfirmModal(null)
                                                    })
                                                }}
                                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Add New Subcategory */}
                            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700">
                                <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">Adicionar Nova Subcategoria</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-zinc-400"
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
                                        className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Reset to Default */}
                            <div className="pt-4">
                                <button
                                    onClick={() => {
                                        setConfirmModal({
                                            title: 'Restaurar Subcategorias',
                                            message: 'Restaurar subcategorias padrão? Isso removerá todas as subcategorias personalizadas.',
                                            type: 'danger',
                                            onConfirm: () => {
                                                setSubcategories(defaultIngredientSubcategories)
                                                setConfirmModal(null)
                                                showToast('Subcategorias restauradas', 'success')
                                            },
                                            onCancel: () => setConfirmModal(null)
                                        })
                                    }}
                                    className="w-full py-3 text-zinc-500 dark:text-zinc-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
                                >
                                    Restaurar Padrões
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Confirmation Modal - Director Standard */}
            <AnimatePresence>
                {confirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    >
                        <ModalScrollLock />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                            onClick={confirmModal.onCancel}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 mx-auto ${confirmModal.type === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-zinc-100 text-zinc-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 text-center tracking-tight">{confirmModal.title}</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed text-center font-medium">
                                {confirmModal.message}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={confirmModal.onCancel}
                                    className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className={`flex-1 py-3.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all ${confirmModal.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25' : 'bg-zinc-900 dark:bg-white dark:text-zinc-900'}`}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Toast */}
            <AnimatePresence>
                {toastMessage && createPortal(
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[20000] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${toastMessage.type === 'error' ? 'bg-rose-500/90 border-rose-400/20 text-white' :
                            toastMessage.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/20 text-white' :
                                'bg-zinc-900/90 border-white/10 text-white'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${toastMessage.type === 'error' ? 'bg-white animate-pulse' :
                            toastMessage.type === 'success' ? 'bg-white' :
                                'bg-indigo-400'
                            }`} />
                        <span className="text-sm font-semibold tracking-tight">{toastMessage.message}</span>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>

            {/* Invoice Scanner Modal */}
            <AnimatePresence>
                {showInvoiceScanner && (
                    <InvoiceScanner
                        existingProducts={items}
                        onComplete={handleInvoiceScanned}
                        onClose={() => setShowInvoiceScanner(false)}
                        apiKey={geminiApiKey}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

// Export function to get inventory items (for use in other components)
export function useInventoryItems() {
    const [items, setItems] = useState([])

    const loadItems = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed)) {
                    setItems(parsed)
                } else {
                    setItems([])
                }
            } else {
                setItems([])
            }
        } catch (e) {
            console.error("Failed to load inventory items directly:", e)
            setItems([])
        }
    }

    useEffect(() => {
        // Initial load
        loadItems()

        // Listen for storage events (cross-tab)
        const handleStorage = (e) => {
            if (e.key === STORAGE_KEY) {
                loadItems()
            }
        }

        // Listen for custom local events (same-tab)
        const handleLocalUpdate = () => {
            loadItems()
        }

        window.addEventListener('storage', handleStorage)
        window.addEventListener('inventory-updated', handleLocalUpdate) // Custom event listener

        return () => {
            window.removeEventListener('storage', handleStorage)
            window.removeEventListener('inventory-updated', handleLocalUpdate)
        }
    }, [])

    return items
}

function ModalScrollLock() {
    useScrollLock(true)
    return null
}
