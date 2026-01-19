// ═══════════════════════════════════════════════════════════════════
// PRODUCTS MODULE — Filters Component
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MovementType } from '../../stores/useAppStore'
import { TYPES, type PeriodFilter } from '../types'

interface ProductsFiltersProps {
    search: string
    setSearch: (val: string) => void
    period: PeriodFilter
    setPeriod: (val: PeriodFilter) => void
    typeFilter: MovementType | 'all'
    setTypeFilter: (val: MovementType | 'all') => void
    customStartDate?: string
    customEndDate?: string
    onCustomDateChange?: (start: string, end: string) => void
}

export function ProductsFilters({
    search, setSearch, period, setPeriod, typeFilter, setTypeFilter,
    customStartDate, customEndDate, onCustomDateChange
}: ProductsFiltersProps) {
    const [localStartDate, setLocalStartDate] = useState<string>(customStartDate ?? '')
    const [localEndDate, setLocalEndDate] = useState<string>(customEndDate ?? '')

    // Sync with props when they change
    useEffect(() => {
        if (customStartDate) setLocalStartDate(customStartDate)
        if (customEndDate) setLocalEndDate(customEndDate)
    }, [customStartDate, customEndDate])

    const handlePeriodClick = (p: PeriodFilter) => {
        setPeriod(p)
        if (p === 'custom' && onCustomDateChange && !localStartDate) {
            // Set default to today
            const today: string = new Date().toISOString().split('T')[0]!
            setLocalStartDate(today)
            setLocalEndDate(today)
            onCustomDateChange(today, today)
        }
    }

    const handleDateChange = (start: string, end: string) => {
        setLocalStartDate(start)
        setLocalEndDate(end)
        if (onCustomDateChange) {
            onCustomDateChange(start, end)
        }
    }

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
                    {(['all', 'today', '7d', '30d', 'custom'] as const).map(p => (
                        <motion.button key={p} onClick={() => handlePeriodClick(p)} whileTap={{ scale: 0.97 }}
                            className={`relative px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${period === p ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}>
                            {period === p && (
                                <motion.div layoutId="periodPill" className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-sm"
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                            )}
                            <span className="relative z-10">
                                {p === 'all' ? 'Todos' : p === 'today' ? 'Hoje' : p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : 'Personalizado'}
                            </span>
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

            {/* Custom Date Inputs - Premium Apple Design */}
            <AnimatePresence>
                {period === 'custom' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 md:px-8">
                            <div className="bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-900/50 dark:to-zinc-800/30 rounded-2xl p-4 border border-zinc-200/60 dark:border-zinc-700/40 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-[0.08em]">
                                        Período Personalizado
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Start Date */}
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em] mb-2 select-none">
                                            Data Inicial
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={localStartDate}
                                                onChange={e => handleDateChange(e.target.value, localEndDate)}
                                                className="
                                                    w-full h-11 px-4 pr-10
                                                    rounded-xl
                                                    bg-white dark:bg-zinc-900
                                                    border-2 border-zinc-200 dark:border-zinc-700
                                                    text-[14px] font-medium text-zinc-800 dark:text-zinc-200
                                                    outline-none
                                                    transition-all duration-200
                                                    focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10
                                                    hover:border-zinc-300 dark:hover:border-zinc-600
                                                    shadow-sm
                                                "
                                                style={{
                                                    colorScheme: 'light dark'
                                                }}
                                            />
                                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* End Date */}
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em] mb-2 select-none">
                                            Data Final
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={localEndDate}
                                                onChange={e => handleDateChange(localStartDate, e.target.value)}
                                                className="
                                                    w-full h-11 px-4 pr-10
                                                    rounded-xl
                                                    bg-white dark:bg-zinc-900
                                                    border-2 border-zinc-200 dark:border-zinc-700
                                                    text-[14px] font-medium text-zinc-800 dark:text-zinc-200
                                                    outline-none
                                                    transition-all duration-200
                                                    focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10
                                                    hover:border-zinc-300 dark:hover:border-zinc-600
                                                    shadow-sm
                                                "
                                                style={{
                                                    colorScheme: 'light dark'
                                                }}
                                            />
                                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
