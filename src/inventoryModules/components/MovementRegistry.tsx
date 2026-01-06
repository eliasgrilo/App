// ═══════════════════════════════════════════════════════════════════
// MOVEMENT REGISTRY — Protocol Ledger Design
// Refactored: 267 → ~80 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StockMovement, MovementRegistryProps, Period, MovementItem } from './movementModules'

export type { StockMovement }

export function MovementRegistry({ movements, onRemoveMovement, onAddMovement }: MovementRegistryProps): React.ReactElement {
    const [search, setSearch] = useState(''); const [period, setPeriod] = useState<Period>('all')

    const filteredMovements = useMemo(() => {
        const now = new Date()
        return movements.filter(m => {
            if (search && !m.itemName.toLowerCase().includes(search.toLowerCase())) return false
            if (period !== 'all') {
                const diff = (now.getTime() - new Date(m.timestamp).getTime()) / (1000 * 60 * 60 * 24)
                if (period === 'today' && diff > 1) return false; if (period === '7d' && diff > 7) return false; if (period === '30d' && diff > 30) return false
            }
            return true
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }, [movements, search, period])

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
                        <div className="flex items-center gap-4">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{filteredMovements.length} items</span>
                            <button onClick={onAddMovement} className="w-10 h-10 flex items-center justify-center bg-violet-50 dark:bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></button>
                        </div>
                    </div>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 mt-6">
                        <div className="relative flex-1 min-w-[180px] max-w-xs"><svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full h-9 pl-10 pr-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30" /></div>
                        <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full">{(['all', 'today', '7d', '30d'] as const).map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${period === p ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>{p === 'all' ? 'Todos' : p === 'today' ? 'Hoje' : p}</button>)}</div>
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
