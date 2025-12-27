import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import { FirebaseService } from './services/firebaseService'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Inventory - Premium inventory management with dual quantity tracking
 * Package size × Package count = Total quantity
 */

const STORAGE_KEY = 'padoca_inventory_v2'

const defaultCategories = ['Ingredientes', 'Embalagens', 'Utensílios', 'Outros']

// Default Subcategories for Ingredientes
const defaultIngredientSubcategories = ['Embutidos', 'Laticínios', 'Farináceos', 'Temperos', 'Vegetais', 'Produtos de Limpeza', 'Outros Ingredientes']

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

                const settings = await FirebaseService.getGlobalSettings()
                if (settings && settings.taxRate !== undefined) {
                    setTaxRate(settings.taxRate)
                }
            } catch (err) {
                console.warn("Inventory cloud load failed", err)
            } finally {
                setIsCloudSynced(true)
            }
        }
        loadCloud()
    }, [])

    const [taxRate, setTaxRate] = useState(() => {
        const saved = localStorage.getItem('padoca_global_tax')
        return saved ? Number(saved) : 0.13
    })

    useEffect(() => {
        const handleSettingsUpdate = (e) => {
            if (e.detail && e.detail.taxRate !== undefined) {
                setTaxRate(e.detail.taxRate)
            }
        }
        window.addEventListener('global-settings-updated', handleSettingsUpdate)
        return () => window.removeEventListener('global-settings-updated', handleSettingsUpdate)
    }, [])
    const [isAddingItem, setIsAddingItem] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState(null)
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

    const [newItem, setNewItem] = useState({
        name: '',
        packageQuantity: '',
        packageCount: '1',
        unit: 'kg',
        pricePerUnit: '',
        category: 'Ingredientes',
        subcategory: 'Outros Ingredientes',
        purchaseDate: new Date().toISOString().split('T')[0]
    })

    // Cloud Sync Debounce
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        localStorage.setItem(STORAGE_KEY + '_categories', JSON.stringify(categories))
        localStorage.setItem(STORAGE_KEY + '_subcategories', JSON.stringify(subcategories))

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

            return () => clearTimeout(timer)
        }

        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new Event('inventory-updated'))
    }, [items, categories, subcategories, isCloudSynced])

    // Calculate total quantity for an item (total weight/volume)
    const getTotalQuantity = (item) => {
        return (Number(item.packageQuantity) || 0) * (Number(item.packageCount) || 1)
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

    // Format currency (Canadian Dollars)
    const formatCurrency = (val) => {
        const n = Number(val) || 0
        return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .replace(/^/, '$ ')
    }

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
            purchaseDate: new Date().toISOString().split('T')[0]
        })
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
                const totalQty = (Number(item.packageQuantity) || 0) * (Number(item.packageCount) || 1)
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

                <button
                    onClick={() => setIsAddingItem(true)}
                    className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    Adicionar Insumo
                </button>
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
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
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

            {/* Add Item Modal - Premium Bottom Sheet */}
            {isAddingItem && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                    <ModalScrollLock />
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsAddingItem(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative w-full md:max-w-2xl bg-white dark:bg-zinc-900 rounded-t-[2rem] md:rounded-[2rem] p-6 pb-8 md:p-8 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">

                        {/* Drag Handle (Mobile only) */}
                        <div className="md:hidden w-full flex justify-center mb-6">
                            <div className="w-12 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700/50"></div>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Novo Item</h3>
                            <button
                                onClick={() => setIsAddingItem(false)}
                                className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5">
                            {/* Name */}
                            <div className="sm:col-span-2 lg:col-span-12">
                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Nome do Item</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white font-semibold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-300"
                                    placeholder="Ex: Farinha de Trigo"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                                    autoFocus
                                />
                            </div>

                            {/* Package Details Section */}
                            <div className="lg:col-span-12 grid grid-cols-2 gap-4">
                                {/* Package Quantity */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Qtd/Pacote</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            inputMode="decimal"
                                            className="w-full px-4 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white text-right font-bold text-lg focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-300"
                                            placeholder="25"
                                            value={newItem.packageQuantity}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, packageQuantity: e.target.value }))}
                                        />
                                        <select
                                            className="w-24 px-2 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white font-bold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/20 transition-all text-center appearance-none"
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
                                </div>

                                {/* Package Count */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Nº Pacotes</label>
                                    <input
                                        type="number"
                                        min="1"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        className="w-full px-4 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white text-right font-bold text-lg focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-300"
                                        placeholder="1"
                                        value={newItem.packageCount}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, packageCount: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Price Section */}
                            <div className="lg:col-span-6">
                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Preço por Pacote</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-medium">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        inputMode="decimal"
                                        className="w-full pl-8 pr-4 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white text-right font-bold text-lg focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-300"
                                        placeholder="0.00"
                                        value={newItem.pricePerUnit}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div className={newItem.category === 'Ingredientes' ? 'lg:col-span-6' : 'lg:col-span-12'}>
                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Categoria</label>
                                <select
                                    className="w-full px-4 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white font-bold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none"
                                    value={newItem.category}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value, subcategory: e.target.value === 'Ingredientes' ? 'Outros Ingredientes' : null }))}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subcategory (only for Ingredientes) */}
                            {newItem.category === 'Ingredientes' && (
                                <div className="lg:col-span-6">
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Subcategoria</label>
                                    <select
                                        className="w-full px-4 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white font-bold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none"
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

                        {/* Total Preview */}
                        {newItem.packageQuantity && newItem.packageCount && (
                            <div className="mt-6 p-5 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Resumo</div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                                            {Number(newItem.packageQuantity) * Number(newItem.packageCount)} {newItem.unit} Total
                                        </div>
                                        {newItem.pricePerUnit && (
                                            <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-1 tracking-tight tabular-nums">
                                                {formatCurrency(Number(newItem.packageCount) * Number(newItem.pricePerUnit))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-8 safe-area-bottom">
                            <button
                                onClick={() => setIsAddingItem(false)}
                                className="flex-1 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddItem}
                                disabled={!newItem.name.trim()}
                                className="flex-[2] px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 shadow-lg shadow-zinc-900/10 hover:shadow-xl hover:shadow-zinc-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                Adicionar ao Estoque
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
            {Object.keys(groupedItems).length > 0 ? (
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
                                                    <div className="col-span-3">
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
                                {categoryItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border transition-all ${editingId === item.id
                                            ? 'border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                                            : 'border-zinc-200/60 dark:border-white/5 shadow-sm'
                                            }`}
                                    >
                                        {editingId === item.id ? (
                                            /* Mobile Edit Mode */
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse"></div>
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
                                ))}
                            </div>

                            {/* Category Footer - Inside the Card */}
                            <div className="px-8 py-4 bg-zinc-50/50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total {category}</span>
                                <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{formatCurrency((totals.byCategory[category] || 0) * (1 + taxRate))}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State Premium */
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
            {/* System Controls */}
            <section className="relative z-10 mt-8">
                <div className="bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">System Integrity</h2>
                        <button onClick={clearAllData} className="text-[9px] font-bold text-red-500/60 hover:text-red-600 uppercase tracking-widest transition-colors">Terminate All</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <button onClick={exportCSV} className="py-4 md:py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">Export CSV</button>
                        <button onClick={exportJSON} className="py-4 md:py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">Export JSON</button>
                        <button onClick={() => fileRef.current?.click()} className="py-4 md:py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">Import Protocol</button>
                        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
                    </div>
                    {/* Category Management */}
                    <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
                        <h3 className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-4">Category Management</h3>
                        <button
                            onClick={() => setIsManagingCategories(true)}
                            className="w-full py-4 md:py-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Gerenciar Categorias e Subcategorias
                        </button>
                    </div>
                </div>
            </section>

            {/* Category Management Modal */}
            {isManagingCategories && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                    <ModalScrollLock />
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsManagingCategories(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative w-full md:max-w-lg bg-white dark:bg-zinc-900 rounded-t-[2rem] md:rounded-[2rem] p-6 pb-8 md:p-8 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">

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
