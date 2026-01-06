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
    onOpenForm: () => void
}

export function ProductsFilters({
    search, setSearch, period, setPeriod, typeFilter, setTypeFilter, onOpenForm
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

                {/* Settings Button */}
                <button onClick={onOpenForm}
                    className="ml-auto w-11 h-11 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
