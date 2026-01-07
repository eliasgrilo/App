// ═══════════════════════════════════════════════════════════════════
// PRODUCTS MODULE — Filters Component
// ═══════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import type { MovementType } from '../../stores/useAppStore'
import { TYPES, type PeriodFilter } from '../types'

interface ProductsFiltersProps {
    search: string
    setSearch: (val: string) => void
    period: PeriodFilter
    setPeriod: (val: PeriodFilter) => void
    typeFilter: MovementType | 'all'
    setTypeFilter: (val: MovementType | 'all') => void
}

export function ProductsFilters({
    search, setSearch, period, setPeriod, typeFilter, setTypeFilter
}: ProductsFiltersProps) {
    return (
        <div className="px-6 md:px-8 py-4 border-b border-zinc-100/80 dark:border-white/5">
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                        className="w-full h-11 pl-11 pr-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[15px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700" />
                </div>

                {/* Period Pills */}
                <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
                    {(['all', 'today', '7d', '30d'] as const).map(p => (
                        <motion.button key={p} onClick={() => setPeriod(p)} whileTap={{ scale: 0.97 }}
                            className={`relative px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${period === p ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}>
                            {period === p && (
                                <motion.div layoutId="periodPill" className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-sm"
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                            )}
                            <span className="relative z-10">{p === 'all' ? 'Todos' : p === 'today' ? 'Hoje' : p === '7d' ? '7 dias' : '30 dias'}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Type Select */}
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as MovementType | 'all')}
                    className="h-11 px-4 pr-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[13px] font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer outline-none appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}>
                    <option value="all">Todos os tipos</option>
                    {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>
        </div>
    )
}
