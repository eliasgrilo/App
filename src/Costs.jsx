import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import { FirebaseService } from './services/firebaseService'
import { motion, AnimatePresence } from 'framer-motion'

export default function Costs() {
    const [costs, setCosts] = useState([])
    const [categories, setCategories] = useState(['Maquinário', 'Insumos', 'Operacional', 'Marketing', 'Impostos', 'Outros'])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [confirmModal, setConfirmModal] = useState(null)

    // Category Edit Mode
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
    const [newCatName, setNewCatName] = useState('')

    const [dashboardTitle, setDashboardTitle] = useState('Global Investment Matrix')
    const [isEditingTitle, setIsEditingTitle] = useState(false)

    const [taxRate, setTaxRate] = useState(0.13)
    const [isEditingTax, setIsEditingTax] = useState(false)

    // Premium Toast System
    const [toastMessage, setToastMessage] = useState(null)
    const toastTimeoutRef = useRef(null)
    const showToast = useCallback((message, type = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
        setToastMessage({ message, type })
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500)
    }, [])

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        quantity: 1,
        category: 'Maquinário',
        type: 'Variável', // 'Fixo' or 'Variável'
        link: '',
        date: new Date().toISOString().split('T')[0]
    })

    const fileRef = useRef(null)

    // Persistence
    useEffect(() => {
        try {
            const savedCosts = localStorage.getItem('padoca_costs_v1')
            const savedCats = localStorage.getItem('padoca_costs_categories')
            const savedTitle = localStorage.getItem('padoca_costs_title')
            const savedTax = localStorage.getItem('padoca_global_tax')

            let loadedCosts = savedCosts ? JSON.parse(savedCosts) : []
            let loadedCats = savedCats ? JSON.parse(savedCats) : null
            if (savedTitle) setDashboardTitle(savedTitle)
            if (savedTax) setTaxRate(Number(savedTax))

            // Migration: Pessoal -> Maquinário
            if (loadedCats) {
                loadedCats = loadedCats.map(c => c === 'Pessoal' ? 'Maquinário' : c)
                setCategories(loadedCats)
            }
            if (loadedCosts) {
                loadedCosts = loadedCosts.map(item => ({
                    ...item,
                    category: item.category === 'Pessoal' ? 'Maquinário' : item.category
                }))
                setCosts(loadedCosts)
            }
        } catch (e) {
            console.error("Load failed", e)
        }
    }, [])

    // Cloud Load
    const [isCloudSynced, setIsCloudSynced] = useState(false)
    useEffect(() => {
        const loadCloud = async () => {
            try {
                const data = await FirebaseService.getCosts()
                if (data) {
                    if (data.costs) setCosts(data.costs)
                    if (data.categories) setCategories(data.categories)
                }

                const settings = await FirebaseService.getGlobalSettings()
                if (settings && settings.taxRate !== undefined) {
                    setTaxRate(settings.taxRate)
                    localStorage.setItem('padoca_global_tax', settings.taxRate.toString())
                }
            } catch (err) {
                console.warn("Costs cloud load failed")
            } finally {
                setIsCloudSynced(true)
            }
        }
        loadCloud()
    }, [])

    // Reliability Fix: Always sync with localStorage when state changes
    useEffect(() => {
        localStorage.setItem('padoca_costs_v1', JSON.stringify(costs))
        // Cloud Sync (Only if loaded)
        if (isCloudSynced) {
            FirebaseService.syncCosts(costs, categories)
        }
    }, [costs, categories, isCloudSynced])

    useEffect(() => {
        localStorage.setItem('padoca_costs_categories', JSON.stringify(categories))
    }, [categories])

    useEffect(() => {
        localStorage.setItem('padoca_costs_title', dashboardTitle)
    }, [dashboardTitle])

    useEffect(() => {
        localStorage.setItem('padoca_global_tax', taxRate.toString())
        if (isCloudSynced) {
            FirebaseService.syncGlobalSettings({ taxRate })
        }
        // Dispatch event for other tabs
        window.dispatchEvent(new CustomEvent('global-settings-updated', { detail: { taxRate } }))
    }, [taxRate, isCloudSynced])

    // Helpers
    const formatCurrency = (val) => {
        const n = Number(val) || 0
        return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .replace(/^/, '$ ')
    }

    const totals = useMemo(() => {
        const subtotal = costs.reduce((acc, curr) => {
            const qty = Number(curr.quantity) || 1
            const val = (Number(curr.amount) || 0) * qty
            acc.total += val
            if (curr.type === 'Fixo') acc.fixed += val
            else acc.variable += val
            return acc
        }, { total: 0, fixed: 0, variable: 0 })

        const hst = subtotal.total * taxRate
        return {
            ...subtotal,
            hst,
            grandTotal: subtotal.total + hst
        }
    }, [costs])

    const groupedCosts = useMemo(() => {
        return categories.reduce((acc, cat) => {
            const items = costs.filter(c => c.category === cat)
            if (items.length > 0) acc[cat] = items
            return acc
        }, {})
    }, [costs, categories])

    // Actions
    const handleSave = (e) => {
        e.preventDefault()
        if (!formData.description || !formData.amount) return

        // Ensure category exists or default to first
        const safeCat = categories.includes(formData.category) ? formData.category : categories[0]
        const payload = {
            ...formData,
            category: safeCat,
            amount: Number(formData.amount),
            quantity: Number(formData.quantity) || 1
        }

        if (editingId) {
            setCosts(prev => prev.map(c => c.id === editingId ? { ...payload, id: editingId } : c))
        } else {
            setCosts(prev => [...prev, { ...payload, id: Date.now().toString() }])
        }
        closeModal()
    }

    const deleteCost = (id) => {
        setConfirmModal({
            title: 'Excluir Despesa',
            message: 'Esta despesa será removida permanentemente do sistema.',
            type: 'danger',
            onConfirm: () => {
                setCosts(prev => prev.filter(c => c.id !== id))
                showToast('Despesa removida com sucesso.')
                setConfirmModal(null)
            },
            onCancel: () => setConfirmModal(null)
        })
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingId(null)
        setFormData({
            description: '',
            amount: '',
            quantity: 1,
            category: 'Maquinário',
            type: 'Variável',
            link: '',
            date: new Date().toISOString().split('T')[0]
        })
    }

    const openEdit = (cost) => {
        setFormData({
            description: cost.description || '',
            amount: cost.amount || '',
            quantity: cost.quantity || 1,
            category: cost.category || categories[0],
            type: cost.type || 'Variável',
            link: cost.link || '',
            date: cost.date || new Date().toISOString().split('T')[0]
        })
        setEditingId(cost.id)
        setIsModalOpen(true)
    }

    // Category Manager
    const addCategory = () => {
        if (!newCatName) return
        if (!categories.includes(newCatName)) {
            setCategories(prev => [...prev, newCatName])
            showToast('Categoria adicionada.')
        }
        setNewCatName('')
    }
    const removeCategory = (cat) => {
        setConfirmModal({
            title: 'Remover Categoria',
            message: `A categoria "${cat}" será removida permanentemente.`,
            type: 'danger',
            onConfirm: () => {
                setCategories(prev => prev.filter(c => c !== cat))
                showToast('Categoria removida.')
                setConfirmModal(null)
            },
            onCancel: () => setConfirmModal(null)
        })
    }

    // Tools
    const exportCSV = () => {
        try {
            const header = ['ID', 'Data', 'Descrição', 'Qtd', 'Vlr Unit', 'Total', 'Categoria', 'Tipo', 'Link']
            const rows = costs.map(c => {
                const qty = Number(c.quantity) || 1
                const unitPrice = Number(c.amount) || 0
                const total = qty * unitPrice
                return [
                    c.id,
                    c.date || '-',
                    `"${c.description.replace(/"/g, '""')}"`,
                    qty,
                    unitPrice.toFixed(2).replace('.', ','),
                    total.toFixed(2).replace('.', ','),
                    `"${c.category}"`,
                    c.type,
                    `"${c.link || ''}"`
                ]
            })

            const csvContent = "\uFEFF" + [header.join(";"), ...rows.map(e => e.join(";"))].join("\n")
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `padoca_financeiro_${new Date().toISOString().split('T')[0]}.csv`
            link.click()
            showToast('Relatório Excel exportado!')
        } catch (e) {
            showToast('Erro ao exportar CSV')
        }
    }

    const exportJSON = () => {
        try {
            const data = JSON.stringify({ version: '1', costs, categories }, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `padoca_backup_${new Date().toISOString().split('T')[0]}.json`
            a.click()
            showToast('Backup realizado com sucesso!')
        } catch (e) {
            showToast('Erro ao realizar backup')
        }
    }

    const importJSON = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = evt => {
            try {
                const parsed = JSON.parse(String(evt.target.result || '{}'))
                if (parsed.costs && Array.isArray(parsed.costs)) {
                    setCosts(parsed.costs)
                    if (parsed.categories) setCategories(parsed.categories)
                    showToast('Dados financeiros restaurados!')
                } else {
                    throw new Error('Formato inválido')
                }
            } catch (err) {
                showToast('Arquivo de backup inválido')
            }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    const clearAllData = () => {
        setConfirmModal({
            title: 'Apagar Todos os Dados',
            message: 'Atenção: Isso apagará TODOS os dados financeiros permanentemente. Esta ação não pode ser desfeita.',
            type: 'danger',
            onConfirm: () => {
                setCosts([])
                localStorage.removeItem('padoca_costs_v1')
                showToast('Banco de dados limpo.')
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
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Financeiro</h1>
                        {/* Sync Status Badge */}
                        <div className={`mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80`}>
                            <div className={`w-1 h-1 rounded-full bg-emerald-500`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                Cloud Active
                            </span>
                        </div>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Controle de investimentos e fluxo de capital</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    Adicionar Despesa
                </button>
            </div>

            {/* Dashboard: Precise & Light */}
            <section className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                {/* Total Investment Card: Apple Pro Aesthetic */}
                <div className="md:col-span-2 relative group">
                    <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                        {/* Subtle Apple-style Mesh Gradient (Refined) */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                        <div className="relative">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <div className="flex items-center gap-2 mb-1 group/title">
                                        {isEditingTitle ? (
                                            <input
                                                className="bg-zinc-100 dark:bg-zinc-900/50 border-none text-base md:text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest outline-none px-3 py-2 rounded-xl"
                                                value={dashboardTitle}
                                                onChange={(e) => setDashboardTitle(e.target.value)}
                                                onBlur={() => setIsEditingTitle(false)}
                                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                                                autoFocus
                                            />
                                        ) : (
                                            <h3
                                                className="text-[10px] font-bold text-zinc-400 dark:text-indigo-300/60 uppercase tracking-widest cursor-text hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                onClick={() => setIsEditingTitle(true)}
                                            >
                                                {dashboardTitle}
                                            </h3>
                                        )}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-zinc-300 opacity-0 group-hover/title:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </div>
                                    <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide">Protocol Status: High Integrity</p>
                                </div>
                                <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live Matrix</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest ml-1">Total Capital Assets</span>
                                <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none flex flex-wrap items-baseline gap-2 md:gap-3">
                                    {formatCurrency(totals.grandTotal)}
                                </div>
                            </div>
                        </div>

                        <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100 dark:border-white/5">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Net Liquidity</span>
                                <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{formatCurrency(totals.total)}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 group/tax">
                                <div className="flex items-center gap-2">
                                    {isEditingTax ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                className="w-16 bg-zinc-100 dark:bg-zinc-900/50 border-none text-[10px] font-bold text-indigo-500 uppercase tracking-widest outline-none px-2 py-1 rounded-lg"
                                                type="number"
                                                step="0.01"
                                                value={taxRate * 100}
                                                onChange={(e) => setTaxRate(Number(e.target.value) / 100)}
                                                onBlur={() => setIsEditingTax(false)}
                                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTax(false)}
                                                autoFocus
                                            />
                                            <span className="text-[10px] font-bold text-indigo-500">%</span>
                                        </div>
                                    ) : (
                                        <span
                                            className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest cursor-text hover:text-indigo-700 transition-colors"
                                            onClick={() => setIsEditingTax(true)}
                                        >
                                            Tax Impact ({(taxRate * 100).toFixed(0)}%)
                                        </span>
                                    )}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-indigo-300 opacity-0 group-hover/tax:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </div>
                                <span className="text-2xl md:text-3xl font-semibold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">{formatCurrency(totals.hst)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
                            <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">Custo Fixo</h3>
                        </div>
                        <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                            {formatCurrency(totals.fixed)}
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Allocation</span>
                            <span className="text-[8px] font-bold text-indigo-500">{((totals.fixed / totals.total * 100) || 0).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500/80 transition-all duration-1000" style={{ width: `${(totals.fixed / totals.total * 100) || 0}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>
                            <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">Variável</h3>
                        </div>
                        <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                            {formatCurrency(totals.variable)}
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Variance</span>
                            <span className="text-[8px] font-bold text-orange-500">{((totals.variable / totals.total * 100) || 0).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500/80 transition-all duration-1000" style={{ width: `${(totals.variable / totals.total * 100) || 0}%` }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ledger: Asset Management Console */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[3rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
                <div className="p-6 md:p-10 pb-4 md:pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
                    <div>
                        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Protocol Ledger</h2>
                        <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">Capital Asset History</h3>
                    </div>
                </div>

                <div className="px-6 md:px-10 pb-6 md:pb-10">
                    {/* Header: Minimal & Precise - Hidden on Mobile */}
                    <div className="hidden md:grid grid-cols-12 gap-8 py-4 border-b border-zinc-100 dark:border-white/5 px-4 mb-4">
                        <div className="col-span-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Identity & Description</div>
                        <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center">Unit Profile</div>
                        <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Net Value</div>
                        <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Valor Bruto</div>
                        <div className="col-span-2"></div>
                    </div>

                    <div className="space-y-6">
                        {costs.length === 0 ? (
                            <div className="py-32 text-center flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-white/5 flex items-center justify-center border border-zinc-100 dark:border-white/10 opacity-40">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7c0-1.1.9-2 2-2h12a2 2 0 012 2M4 7h16" /></svg>
                                </div>
                                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">System IDLE — Awaiting Input</p>
                            </div>
                        ) : (
                            Object.entries(groupedCosts).map(([category, items]) => (
                                <div key={category} className="space-y-2">
                                    {/* Category ID Tag */}
                                    <div className="flex items-center gap-4 py-2 px-4 mb-2">
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{category}</span>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-500/10 to-transparent"></div>
                                    </div>

                                    <div className="space-y-3 md:space-y-1">
                                        {items.map(cost => (
                                            <div key={cost.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-8 py-5 md:items-center group hover:bg-zinc-50 dark:hover:bg-white/[0.02] px-4 rounded-2xl md:rounded-[1.5rem] transition-all cursor-default border border-zinc-100 dark:border-white/5 md:border-transparent">
                                                <div className="md:col-span-4 flex items-start md:items-center gap-4">
                                                    <div className={`mt-1.5 md:mt-0 w-2 h-2 rounded-full shrink-0 ${cost.type === 'Fixo' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                                                    <div className="flex flex-col text-ellipsis overflow-hidden">
                                                        <span className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight leading-tight mb-1 truncate">
                                                            {cost.description}
                                                        </span>
                                                        <div className="flex items-center gap-3 opacity-60">
                                                            <span className="text-[9px] font-bold text-zinc-400 tabular-nums uppercase">{cost.date}</span>
                                                            {cost.link && (
                                                                <a href={cost.link} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-1">
                                                                    Doc →
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 flex md:justify-center">
                                                    <span className="inline-flex px-3 py-1 bg-zinc-50 dark:bg-white/5 rounded-full border border-zinc-100 dark:border-white/10 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter tabular-nums">
                                                        {cost.quantity} unit • {cost.type.slice(0, 1)}
                                                    </span>
                                                </div>

                                                <div className="md:col-span-2 flex flex-row md:flex-col justify-between items-center md:items-end">
                                                    <div className="text-base md:text-lg font-semibold text-zinc-900 dark:text-white tracking-tight tabular-nums">
                                                        {formatCurrency((Number(cost.amount) || 0) * (Number(cost.quantity) || 1))}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {formatCurrency(cost.amount)} / item
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 flex flex-row md:flex-col justify-between items-center md:items-end">
                                                    <div className="text-base md:text-lg font-bold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">
                                                        {formatCurrency(((Number(cost.amount) || 0) * (Number(cost.quantity) || 1)) * (1 + taxRate))}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-indigo-500/50 uppercase tracking-tighter md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Incluindo Imposto
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 flex justify-end gap-2 md:gap-1 md:opacity-0 group-hover:opacity-100 transition-all pt-2 md:pt-0 border-t md:border-0 border-zinc-50 dark:border-white/5">
                                                    <button onClick={() => openEdit(cost)} className="flex-1 md:flex-none py-2.5 md:p-2.5 flex justify-center items-center text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-all">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        <span className="md:hidden ml-2 text-[10px] font-bold uppercase tracking-widest">Edit</span>
                                                    </button>
                                                    <button onClick={() => deleteCost(cost.id)} className="flex-1 md:flex-none py-2.5 md:p-2.5 flex justify-center items-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        <span className="md:hidden ml-2 text-[10px] font-bold uppercase tracking-widest">Delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Utility Grid: System Controls */}
            <section className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group shadow-xl transition-all hover:shadow-2xl">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-50 dark:bg-white/5 rounded-[1rem] md:rounded-[1.25rem] border border-zinc-100 dark:border-white/10 flex items-center justify-center transition-all group-hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <div>
                            <h2 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Export Channel</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-semibold tracking-tight leading-none">Generate CSV Matrix Report</p>
                        </div>
                    </div>
                    <button onClick={exportCSV} className="w-full sm:w-auto px-6 py-4 md:py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest shadow-lg active:scale-90 transition-all">Execute</button>
                </div>

                <div className="bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">System Integrity</h2>
                        <button onClick={clearAllData} className="text-[9px] font-bold text-red-500/60 hover:text-red-600 uppercase tracking-widest transition-colors">Terminate All</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button onClick={exportJSON} className="py-4 md:py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">Export JSON</button>
                        <button onClick={() => fileRef.current?.click()} className="py-4 md:py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">Import Protocol</button>
                        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
                    </div>
                </div>
            </section>

            {/* Modal: Ultra-Compact Apple Pro Interface */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
                    >
                        {/* Minimal Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm"
                            onClick={closeModal}
                        />

                        {/* Compact Modal Content - List Based */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0.5 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative bg-zinc-100 dark:bg-zinc-900 w-full max-w-sm rounded-t-[2.5rem] md:rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.2)] border-t border-white/20 dark:border-white/5 flex flex-col overflow-hidden max-h-[85vh] md:max-h-[80vh]"
                            style={{
                                marginTop: 'max(calc(env(safe-area-inset-top, 0px) + 60px), 60px)'
                            }}
                        >

                            {/* Minimal Drag Handle */}
                            <ModalScrollLock />
                            <div className="md:hidden w-full flex justify-center pt-4 pb-1 shrink-0">
                                <div className="w-8 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800"></div>
                            </div>

                            {/* Compact Header */}
                            <div className="px-6 py-4 flex justify-between items-center shrink-0">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    {editingId ? 'Editar Despesa' : 'Nova Despesa'}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="w-11 h-11 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90 touch-manipulation"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar flex-1 pb-10">
                                {isCategoryManagerOpen ? (
                                    <div className="space-y-4 px-4 animate-fade-in">
                                        <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden">
                                            {categories.map((cat, idx) => (
                                                <div key={cat} className={`flex justify-between items-center py-3 px-4 ${idx !== categories.length - 1 ? 'border-b border-zinc-100 dark:border-white/5' : ''}`}>
                                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cat}</span>
                                                    <button onClick={() => removeCategory(cat)} className="w-11 h-11 flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl touch-manipulation transition-all">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                className="flex-1 bg-white dark:bg-zinc-800/50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none placeholder:text-zinc-400 dark:text-white"
                                                placeholder="Nova categoria..."
                                                value={newCatName}
                                                onChange={e => setNewCatName(e.target.value)}
                                            />
                                            <button className="h-12 w-12 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-xl font-bold flex items-center justify-center touch-manipulation active:scale-95 transition-transform" onClick={addCategory}>+</button>
                                        </div>
                                        <button onClick={() => setIsCategoryManagerOpen(false)} className="w-full py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest transition-all touch-manipulation hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">Pronto</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSave} className="space-y-6 px-4 animate-fade-in">
                                        {/* System Style List Group */}
                                        <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden">
                                            <div className="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                                                <label className="w-24 text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Nome</label>
                                                <input
                                                    className="flex-1 bg-transparent border-none py-1 text-sm font-semibold text-zinc-800 dark:text-white outline-none placeholder:text-zinc-300"
                                                    autoFocus value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Mixer, Aluguel..."
                                                />
                                            </div>
                                            <div className="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                                                <label className="w-24 text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Link</label>
                                                <input
                                                    className="flex-1 bg-transparent border-none py-1 text-sm font-medium text-indigo-500/80 outline-none placeholder:text-zinc-300 italic"
                                                    type="url" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} placeholder="Opcional..."
                                                />
                                            </div>
                                            <div className="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                                                <label className="w-24 text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Quantidade</label>
                                                <input
                                                    className="flex-1 bg-transparent border-none py-1 text-sm font-bold text-zinc-800 dark:text-white outline-none"
                                                    type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex items-center px-4 py-3">
                                                <label className="w-24 text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Preço Un.</label>
                                                <div className="flex items-center flex-1">
                                                    <span className="text-[10px] font-bold text-indigo-500 mr-1">$</span>
                                                    <input
                                                        className="w-full bg-transparent border-none py-1 text-sm font-bold text-zinc-800 dark:text-white outline-none"
                                                        type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Segmented Control - Thinner */}
                                        <div className="px-1">
                                            <div className="p-1 bg-zinc-200 dark:bg-black/40 rounded-xl flex gap-1 relative shadow-inner">
                                                {['Fixo', 'Variável'].map(type => (
                                                    <button
                                                        key={type} type="button" onClick={() => setFormData({ ...formData, type })}
                                                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${formData.type === type
                                                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                                                            : 'text-zinc-400'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Category Grid - Compact Tags */}
                                        <div className="space-y-3 px-1">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Categoria</label>
                                                <button type="button" onClick={() => setIsCategoryManagerOpen(true)} className="text-[9px] font-bold text-indigo-500 uppercase">Ajustar</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat} type="button" onClick={() => setFormData({ ...formData, category: cat })}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight transition-all border ${formData.category === cat
                                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-md'
                                                            : 'bg-white dark:bg-zinc-800/50 text-zinc-400 border-zinc-200 dark:border-white/5'
                                                            }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="flex flex-col gap-2 pt-2">
                                            <button
                                                type="submit"
                                                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                            >
                                                Salvar Despesa
                                            </button>
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="w-full py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                )}
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
            {/* Premium Confirmation Modal */}
            {/* Premium Confirmation Modal - Director Standard */}
            <AnimatePresence>
                {confirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    >
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
                                    {confirmModal.type === 'danger' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    )}
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
        </div >
    )
}

function ModalScrollLock() {
    useScrollLock(true)
    return null
}
