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
            if (search && search.trim().length >= 3) {
                const normalizedSearch = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
                const normalizedName = m.itemName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

                // Split into words
                const queryWords = normalizedSearch.split(/\s+/).filter(w => w.length > 0)
                const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 0)

                // Query words must be <= name words (allows partial matching)
                if (queryWords.length > nameWords.length) return false

                // Each query word must START the corresponding name word in sequence
                if (!queryWords.every((qWord, idx) => nameWords[idx]?.startsWith(qWord) ?? false)) return false
            }
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
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        filteredMovements.forEach(m => {
            const date = new Date(m.timestamp)
            let label: string
            if (date.toDateString() === today.toDateString()) {
                label = 'HOJE'
            } else if (date.toDateString() === yesterday.toDateString()) {
                label = 'ONTEM'
            } else {
                label = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).toUpperCase()
            }
            if (!groups[label]) groups[label] = []
            groups[label]!.push(m)
        })
        return groups
    }, [filteredMovements])

    // Get sorted date keys (HOJE first, then ONTEM, then chronologically)
    const sortedDateKeys = useMemo(() => {
        const keys = Object.keys(grouped)
        return keys.sort((a, b) => {
            if (a === 'HOJE') return -1
            if (b === 'HOJE') return 1
            if (a === 'ONTEM') return -1
            if (b === 'ONTEM') return 1
            return 0
        })
    }, [grouped])

    return (
        <section className="relative z-10 mb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="
                    relative 
                    bg-white/80 dark:bg-zinc-950/80 
                    backdrop-blur-3xl backdrop-saturate-150
                    rounded-[48px]
                    border border-zinc-200/40 dark:border-zinc-700/40
                    overflow-hidden
                "
                style={{
                    boxShadow: `
                        0 8px 24px rgba(0,0,0,0.06),
                        0 24px 48px rgba(0,0,0,0.08),
                        0 48px 96px rgba(0,0,0,0.1)
                    `
                }}
            >
                {/* Ambient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] via-transparent to-indigo-500/[0.02]" />

                {/* Header - BREATHING ROOM */}
                <div className="relative p-10 md:p-12 pb-6 md:pb-8">
                    <div className="flex items-start justify-between mb-8">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-[0.2em]">
                                PROTOCOL LEDGER
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                Movement Registry
                            </h2>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50 backdrop-blur-xl border border-zinc-200/30 dark:border-zinc-700/30">
                            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                {filteredMovements.length} {filteredMovements.length === 1 ? 'item' : 'itens'}
                            </span>
                        </div>
                    </div>

                    {/* Filters - LARGER TOUCH TARGETS */}
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[240px] max-w-lg">
                            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar movimentação..."
                                className="
                                    w-full h-14 pl-14 pr-5 
                                    rounded-2xl 
                                    bg-white/80 dark:bg-zinc-900/80 
                                    backdrop-blur-xl
                                    border-2 border-zinc-200/50 dark:border-zinc-700/50
                                    text-[16px] text-zinc-900 dark:text-zinc-100 
                                    placeholder:text-zinc-400 
                                    outline-none 
                                    focus:border-violet-500/50
                                    transition-all duration-200
                                    shadow-sm
                                "
                            />
                        </div>

                        {/* Period Pills - BIGGER */}
                        <div className="inline-flex gap-1.5 bg-zinc-100/80 dark:bg-zinc-800/50 p-2 rounded-2xl border border-zinc-200/30 dark:border-zinc-700/30 backdrop-blur-xl">
                            {(['today', '7d', '30d', 'all'] as const).map(p => (
                                <motion.button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`
                                        relative px-6 py-3 rounded-xl 
                                        text-[14px] font-bold 
                                        transition-all duration-200
                                        ${period === p
                                            ? 'text-zinc-900 dark:text-white'
                                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                        }
                                    `}
                                >
                                    {period === p && (
                                        <motion.div
                                            layoutId="periodIndicator"
                                            className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-lg"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10">
                                        {p === 'all' ? 'Todos' : p === 'today' ? 'Hoje' : p === '7d' ? '7d' : '30d'}
                                    </span>
                                </motion.button>
                            ))}
                        </div>

                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value as 'all' | 'entrada' | 'saida' | 'manual')}
                            className="
                                h-14 px-6 pr-12 
                                bg-white/80 dark:bg-zinc-900/80 
                                backdrop-blur-xl
                                border-2 border-zinc-200/50 dark:border-zinc-700/50
                                rounded-2xl 
                                text-[14px] font-bold 
                                text-zinc-700 dark:text-zinc-200 
                                cursor-pointer 
                                outline-none 
                                appearance-none
                                shadow-sm
                                hover:border-zinc-300 dark:hover:border-zinc-600
                                transition-all duration-200
                            "
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 16px center',
                                backgroundSize: '20px'
                            }}
                        >
                            <option value="all">Todos</option>
                            <option value="entrada">Entrada</option>
                            <option value="saida">Saída</option>
                            <option value="manual">Manual</option>
                        </select>

                        {/* Add Button - PROMINENT */}
                        <motion.button
                            onClick={onAddMovement}
                            whileHover={{ scale: 1.08, rotate: 90 }}
                            whileTap={{ scale: 0.92 }}
                            className="
                                ml-auto w-14 h-14 
                                flex items-center justify-center 
                                bg-gradient-to-br from-violet-500 to-indigo-600
                                rounded-2xl 
                                text-white
                                transition-all duration-200
                            "
                            style={{
                                boxShadow: `
                                    0 8px 16px rgba(139, 92, 246, 0.3),
                                    0 4px 8px rgba(0,0,0,0.1)
                                `
                            }}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </motion.button>
                    </div>
                </div>

                {/* Movement List - MASSIVE SPACING */}
                <div className="px-10 md:px-12 pb-12 pt-4">
                    {filteredMovements.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Nenhuma movimentação</h3>
                            <p className="text-[15px] text-zinc-500 dark:text-zinc-400">As movimentações aparecerão aqui</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {sortedDateKeys.map(dateLabel => (
                                <div key={dateLabel}>
                                    {/* Date Divider - REFINED */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-4 mb-6"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600" />
                                            <span className="text-[13px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-[0.12em]">
                                                {dateLabel}
                                            </span>
                                        </div>
                                        <div className="flex-1 h-[2px] bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent dark:from-zinc-700 dark:via-zinc-800 dark:to-transparent rounded-full" />
                                    </motion.div>

                                    {/* Cards - GENEROUS 24px GAPS */}
                                    <AnimatePresence mode="popLayout">
                                        <div className="space-y-6">
                                            {(grouped[dateLabel] ?? []).map(m => <MovementItem key={m.id} movement={m} onRemove={onRemoveMovement} />)}
                                        </div>
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </section>
    )
}

export default MovementRegistry
