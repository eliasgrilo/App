// ═══════════════════════════════════════════════════════════════════
// MOVEMENT REGISTRY — Protocol Ledger Design
// Refactored: 267 → ~80 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StockMovement, MovementRegistryProps, Period, MovementItem } from './movementModules'

export type { StockMovement }

export function MovementRegistry({ movements, onRemoveMovement, onAddMovement }: MovementRegistryProps): React.ReactElement {
    const [search, setSearch] = useState(''); const [period, setPeriod] = useState<Period>('today'); const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'saida' | 'manual'>('all')

    const filteredMovements = useMemo(() => {
        const now = new Date()
        return movements.filter(m => {
            if (search && !m.itemName.toLowerCase().includes(search.toLowerCase())) return false
            if (typeFilter !== 'all') {
                if (typeFilter === 'manual') {
                    if (!m.isManual) return false
                } else {
                    const mType = m.type?.toLowerCase() === 'in' || m.type?.toLowerCase() === 'entrada' ? 'entrada' : 'saida'
                    if (mType !== typeFilter) return false
                }
            }
            if (period !== 'all') {
                const diff = (now.getTime() - new Date(m.timestamp).getTime()) / (1000 * 60 * 60 * 24)
                if (period === 'today' && diff > 1) return false; if (period === '7d' && diff > 7) return false; if (period === '30d' && diff > 30) return false
            }
            return true
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }, [movements, search, period, typeFilter])

    const grouped = useMemo(() => {
        const groups: Record<string, StockMovement[]> = {}
        filteredMovements.forEach(m => { const date = new Date(m.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); if (!groups[date]) groups[date] = []; groups[date].push(m) })
        return groups
    }, [filteredMovements])

    return (
        <section className="relative z-10 mb-8">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.1 }} className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[3rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
                {/* Header */}
                <div className="p-6 md:p-10 pb-4 md:pb-6">
                    <div className="flex items-start justify-between">
                        <div><span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">PROTOCOL LEDGER</span><h2 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">Movement Registry</h2></div>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{filteredMovements.length} items</span>
                    </div>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 mt-6">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[180px] max-w-sm">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full h-11 pl-11 pr-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[15px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700" />
                        </div>
                        {/* Period Pills */}
                        <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
                            {(['today', '7d', '30d', 'all'] as const).map(p => (
                                <motion.button key={p} onClick={() => setPeriod(p)} whileTap={{ scale: 0.97 }}
                                    className={`relative px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${period === p ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}>
                                    {period === p && (
                                        <motion.div layoutId="movementPeriodPill" className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-sm"
                                            transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                                    )}
                                    <span className="relative z-10">{p === 'all' ? 'Todos' : p === 'today' ? 'Hoje' : p === '7d' ? '7 dias' : '30 dias'}</span>
                                </motion.button>
                            ))}
                        </div>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as 'all' | 'entrada' | 'saida' | 'manual')}
                            className="h-11 px-4 pr-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[13px] font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer outline-none appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}>
                            <option value="all">Todos os tipos</option>
                            <option value="entrada">Entrada</option>
                            <option value="saida">Saída</option>
                            <option value="manual">Manual</option>
                        </select>
                        {/* Settings Button */}
                        <button onClick={onAddMovement}
                            className="ml-auto w-11 h-11 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
                {/* Movement List */}
                <div className="px-6 md:px-10 pb-6 md:pb-10">
                    {Object.keys(grouped).length === 0 ? (
                        <div className="text-center py-12"><div className="w-12 h-12 mx-auto rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3"><svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg></div><p className="text-sm font-medium text-zinc-900 dark:text-white">Nenhuma movimentação</p><p className="text-xs text-zinc-500 mt-1">Movimentações aparecerão aqui</p></div>
                    ) : (
                        <AnimatePresence>{Object.entries(grouped).map(([date, list]) => (
                            <div key={date} className="mb-6 last:mb-0">
                                <div className="flex items-center gap-3 mb-4"><span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{date}</span><div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" /></div>
                                <div className="space-y-3">{list.map(m => <MovementItem key={m.id} movement={m} onRemove={onRemoveMovement} />)}</div>
                            </div>
                        ))}</AnimatePresence>
                    )}
                </div>
            </motion.div>
        </section>
    )
}

export default MovementRegistry
