/**
 * Products - Movimentações de Estoque
 * Apple-inspired design with motion animations
 */

import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useInventoryItems } from './Inventory'
import { useCurrency } from './contexts/CurrencyContext'
import { useToast } from './contexts/ToastContext'
import { useModal } from './contexts/ModalContext'
import ModalScrollLock from './components/ModalScrollLock'
import { useAppStore, useStockMovements, type StockMovement, type MovementType, type ReasonCode } from './stores/useAppStore'
import type { Ingredient } from './types'

const TYPES: Record<'entrada' | 'saida', { label: string; color: string; isOut: boolean }> = {
    entrada: { label: 'Entrada', color: 'emerald', isOut: false },
    saida: { label: 'Saída', color: 'red', isOut: true }
}

type SimpleMovementType = 'entrada' | 'saida'

const REASONS: Record<ReasonCode, string> = { expired: 'Vencido', damaged: 'Danificado', theft: 'Furto', count_error: 'Erro contagem', other: 'Outro' }

const UNITS = ['g', 'kg', 'ml', 'L', 'un', 'cx'] as const
type UnitType = typeof UNITS[number]

const REASON_BY_TYPE: Record<SimpleMovementType, string[]> = {
    entrada: ['Sobra de Produção', 'Erro de Contagem', 'Saldo Inicial', 'Bonificação', 'Outro'],
    saida: ['Vencimento', 'Avaria', 'Quebra', 'Roubo / Furto', 'Consumo Interno', 'Erro de Contagem', 'Outro']
}

const getStock = (i: Ingredient) => (i.packageQuantity || 0) * (i.packageCount || 1)

const getDateLabel = (ts: string): string => {
    const d = new Date(ts), now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (dt.getTime() === today.getTime()) return 'Hoje'
    if (dt.getTime() === today.getTime() - 86400000) return 'Ontem'
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export default function Products() {
    const { formatCurrency } = useCurrency()
    const { modal } = useModal()
    const { toast } = useToast()
    const items = useInventoryItems()
    const movements = useStockMovements()
    const add = useAppStore(s => s.addStockMovement)
    const del = useAppStore(s => s.deleteStockMovement)
    const upd = useAppStore(s => s.updateIngredient)

    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [itemSearch, setItemSearch] = useState('')
    const [showItemResults, setShowItemResults] = useState(false)
    const [period, setPeriod] = useState<'all' | 'today' | '7d' | '30d'>('all')
    const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all')
    const [form, setForm] = useState({ type: 'entrada' as SimpleMovementType, itemId: 0, qty: '', unit: 'kg' as UnitType, reasonLabel: 'Sobra de Produção', reasonNote: '', code: 'other' as ReasonCode })

    const filteredItems = useMemo(() => {
        // Only show results when user types at least 2 characters (Apple Spotlight style)
        if (!itemSearch.trim() || itemSearch.trim().length < 2) return []
        const words = itemSearch.toLowerCase().split(/\s+/).filter(w => w.length > 0)
        return items.filter(i => {
            const name = i.name.toLowerCase()
            return words.every(word => name.split(/\s+/).some(nameWord => nameWord.startsWith(word)))
        }).slice(0, 6)
    }, [items, itemSearch])

    const filtered = useMemo(() => {
        let r = movements
        if (search) r = r.filter(m => m.itemName.toLowerCase().includes(search.toLowerCase()))
        if (typeFilter !== 'all') r = r.filter(m => m.type === typeFilter)
        if (period !== 'all') {
            const now = new Date(); now.setHours(0, 0, 0, 0)
            const days = period === 'today' ? 0 : period === '7d' ? 7 : 30
            const cut = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
            r = r.filter(m => new Date(m.timestamp) >= cut)
        }
        return r
    }, [movements, search, typeFilter, period])

    const grouped = useMemo(() => {
        const g: Record<string, StockMovement[]> = {}
        filtered.forEach(m => { const k = getDateLabel(m.timestamp); (g[k] = g[k] || []).push(m) })
        return g
    }, [filtered])

    const totals = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        return {
            total: movements.length,
            today: movements.filter(m => new Date(m.timestamp) >= today).length,
            entradas: movements.filter(m => m.type === 'entrada').length,
            saidas: movements.filter(m => ['saida', 'producao', 'perda'].includes(m.type)).length
        }
    }, [movements])

    const selectedItem = items.find(i => i.id === form.itemId)

    const save = useCallback(() => {
        if (!form.itemId || !form.qty || !form.reasonLabel) { toast.error('Preencha todos os campos'); return }
        const it = items.find(i => i.id === form.itemId)!
        const q = parseFloat(form.qty), t = TYPES[form.type], prev = getStock(it), next = t.isOut ? prev - q : prev + q
        const fullReason = form.reasonNote ? `${form.reasonLabel} - ${form.reasonNote}` : form.reasonLabel
        add({ itemId: it.id, itemName: it.name, type: form.type, quantity: q, unit: form.unit, previousStock: prev, newStock: next, costAtTime: (it.pricePerUnit || 0) * q, reason: fullReason })
        upd(it.id, { packageCount: Math.max(0, next / (it.packageQuantity || 1)) })
        toast.success('Movimentação salva')
        setOpen(false)
        setForm({ type: 'entrada', itemId: 0, qty: '', unit: 'kg', reasonLabel: 'Sobra de Produção', reasonNote: '', code: 'other' })
        setItemSearch('')
    }, [form, items, add, upd, toast])

    const remove = (m: StockMovement) => modal.confirm({ title: 'Excluir Movimentação', message: `A movimentação "${m.itemName}" será removida permanentemente.`, isDangerous: true, onConfirm: () => { del(m.id); toast.success('Excluído') } })

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Movimentações</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium mt-1">Histórico e controle de estoque</p>
                </div>
            </div>

            {/* List with Filters */}
            <div className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden">
                {/* Filters */}
                <div className="px-6 md:px-8 py-4 border-b border-zinc-100/80 dark:border-white/5">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[180px] max-w-sm">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full h-11 pl-11 pr-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[15px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700"
                            />
                        </div>

                        {/* Period Pills with animation */}
                        <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
                            {(['all', 'today', '7d', '30d'] as const).map(p => (
                                <motion.button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`relative px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${period === p ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {period === p && (
                                        <motion.div
                                            layoutId="periodPill"
                                            className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-sm"
                                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <span className="relative z-10">{p === 'all' ? 'Todos' : p === 'today' ? 'Hoje' : p === '7d' ? '7 dias' : '30 dias'}</span>
                                </motion.button>
                            ))}
                        </div>

                        {/* Type */}
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value as MovementType | 'all')}
                            className="h-11 px-4 pr-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[13px] font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer outline-none appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                        >
                            <option value="all">Todos os tipos</option>
                            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        {/* Settings Button - Opens New Movement Modal */}
                        <button
                            onClick={() => setOpen(true)}
                            className="ml-auto w-11 h-11 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Items */}
                {Object.keys(grouped).length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 mx-auto bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                            <svg className="h-10 w-10 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Nenhuma Movimentação</h3>
                        <p className="text-zinc-500 text-sm">Comece registrando sua primeira movimentação</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([date, list]) => (
                        <div key={date}>
                            <div className="px-6 md:px-8 py-4 bg-zinc-50/50 dark:bg-white/[0.01] border-b border-zinc-100/80 dark:border-white/5">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{date}</span>
                            </div>
                            <div className="divide-y divide-zinc-100/50 dark:divide-white/5">
                                {list.map(m => {
                                    const t = TYPES[m.type as SimpleMovementType] || { label: m.type, color: 'zinc', isOut: true }
                                    return (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group px-6 md:px-8 py-5 flex items-center gap-4 md:gap-6 hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <div className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-${t.color}-50 dark:bg-${t.color}-500/10 text-${t.color}-600 dark:text-${t.color}-400`}>
                                                {t.label}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 truncate">{m.itemName}</p>
                                                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                                                    {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    {m.reason && <> · {m.reason}</>}
                                                </p>
                                            </div>
                                            <div className={`text-right ${t.isOut ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                <span className="text-lg font-semibold tabular-nums">{t.isOut ? '−' : '+'}{m.quantity}</span>
                                                <span className="text-xs ml-1 opacity-60">{m.unit}</span>
                                            </div>
                                            <div className="w-20 text-right text-zinc-500 hidden md:block">
                                                <span className="text-sm tabular-nums">{m.newStock.toFixed(1)}</span>
                                            </div>
                                            <div className="w-24 text-right text-zinc-400 text-sm hidden md:block tabular-nums">
                                                {m.costAtTime ? formatCurrency(m.costAtTime) : '—'}
                                            </div>
                                            <button
                                                onClick={() => remove(m)}
                                                className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {createPortal(
                <AnimatePresence>
                    {open && (
                        <div className="fixed inset-0 z-[10000] flex items-start justify-center">
                            <ModalScrollLock />
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl"
                                onClick={() => setOpen(false)}
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
                                        onClick={() => setOpen(false)}
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
                                            {Object.entries(TYPES).map(([k, v]) => (
                                                <button
                                                    key={k}
                                                    onClick={() => setForm(f => ({ ...f, type: k as SimpleMovementType, reasonLabel: REASON_BY_TYPE[k as SimpleMovementType][0] || '', reasonNote: '' }))}
                                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${form.type === k
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
                                            animate={selectedItem ? { scale: [1, 1.02, 1] } : {}}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {selectedItem ? (
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
                                                value={selectedItem ? selectedItem.name : itemSearch}
                                                onChange={e => {
                                                    setItemSearch(e.target.value)
                                                    setForm(f => ({ ...f, itemId: 0 }))
                                                    setShowItemResults(true)
                                                }}
                                                onFocus={() => setShowItemResults(true)}
                                                placeholder="Buscar ingrediente..."
                                                className={`w-full h-14 pl-12 pr-12 rounded-2xl text-[17px] font-medium placeholder:text-zinc-400 outline-none transition-all ${selectedItem
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                                                    }`}
                                            />
                                            {selectedItem && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setForm(f => ({ ...f, itemId: 0 }))
                                                        setItemSearch('')
                                                        setShowItemResults(true)
                                                    }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500 transition-colors"
                                                >
                                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </motion.div>
                                        {/* Dropdown Results */}
                                        <AnimatePresence>
                                            {showItemResults && !selectedItem && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -8 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden max-h-64 overflow-y-auto"
                                                >
                                                    {filteredItems.length === 0 ? (
                                                        <div className="px-4 py-6 text-center text-zinc-400 text-sm">Nenhum item encontrado</div>
                                                    ) : (
                                                        filteredItems.map(i => (
                                                            <button
                                                                key={i.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setForm(f => ({ ...f, itemId: i.id, unit: (i.unit as UnitType) || 'kg' }))
                                                                    setItemSearch('')
                                                                    setShowItemResults(false)
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
                                        {selectedItem && <p className="text-xs text-zinc-400 mt-2 ml-1">Estoque atual: {getStock(selectedItem).toFixed(2)} {selectedItem.unit}</p>}
                                    </div>

                                    {/* Quantity + Unit */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Quantidade</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={form.qty}
                                                onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                                                placeholder="0"
                                                className="flex-1 h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[17px] text-zinc-900 dark:text-white font-medium outline-none text-center tabular-nums"
                                            />
                                            <select
                                                value={form.unit}
                                                onChange={e => setForm(f => ({ ...f, unit: e.target.value as UnitType }))}
                                                className="w-20 h-14 px-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[15px] text-zinc-700 dark:text-zinc-200 font-semibold text-center outline-none cursor-pointer"
                                            >
                                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Motivo</label>
                                        {/* Contextual labels based on type */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {REASON_BY_TYPE[form.type].map(label => (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, reasonLabel: label }))}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.reasonLabel === label
                                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                        {/* Always show text input for additional notes */}
                                        <input
                                            type="text"
                                            value={form.reasonNote}
                                            onChange={e => setForm(f => ({ ...f, reasonNote: e.target.value }))}
                                            placeholder="Digitar o motivo:"
                                            className="w-full h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[17px] text-zinc-900 dark:text-white font-medium placeholder:text-zinc-400 outline-none"
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setOpen(false)} className="flex-1 h-14 rounded-2xl font-semibold text-[17px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98]">
                                            Cancelar
                                        </button>
                                        <button onClick={save} className="flex-[1.5] h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[17px] hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-lg">
                                            Salvar
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                    }
                </AnimatePresence >,
                document.body
            )}
        </div >
    )
}
