// ═══════════════════════════════════════════════════════════════════
// EXPIRATION LEVELS SECTION — Same design as StockLevelsSection
// Monitoring expiration dates with Apple Vision Pro style
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusTile } from './stockLevelsModules'
import { InventoryItem } from '../types'

type ExpirationStatus = 'critical' | 'warning' | 'noDate' | 'expired' | 'ok'

interface ExpirationLevelsSectionProps {
    items: InventoryItem[]
    getTotalQuantity: (item: InventoryItem) => number
    onConfigureItem: (item: InventoryItem) => void
}

const getExpirationStatus = (item: InventoryItem): ExpirationStatus => {
    if (!item.expiryDate) return 'noDate'
    const diffDays = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'expired'
    if (diffDays <= 7) return 'critical'
    if (diffDays <= 30) return 'warning'
    return 'ok'
}

const getDaysUntilExpiration = (date: string): number =>
    Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

const statusColors: Record<ExpirationStatus, string> = {
    critical: '#FF3B30',
    warning: '#FF9F0A',
    noDate: '#8E8E93',
    expired: '#FF3B30',
    ok: '#34C759'
}

// Expiration Item Row - similar to StockItemRow but for expiration
const ExpirationItemRow = ({ item, status, total, unit, onClick }: {
    item: InventoryItem; status: ExpirationStatus; total: number; unit: string; onClick: () => void
}) => {
    const color = statusColors[status]
    const days = item.expiryDate ? getDaysUntilExpiration(item.expiryDate) : null

    // Progress calculation: 30 days = 100%, 0 days = 0%
    let progress = 100
    if (days !== null && days >= 0) {
        progress = Math.max(0, Math.min(100, ((30 - days) / 30) * 100))
    } else if (days !== null && days < 0) {
        progress = 100 // Expired = full bar
    }

    const statusLabels: Record<ExpirationStatus, string> = {
        critical: '≤7 dias',
        warning: '≤30 dias',
        noDate: 'Sem data',
        expired: 'Vencido',
        ok: 'OK'
    }
    const label = statusLabels[status]

    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.003 }}
            whileTap={{ scale: 0.997 }}
            className="group cursor-pointer relative overflow-hidden rounded-xl transition-all duration-200 bg-white/85 dark:bg-zinc-800/60"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.02), 0 2px 8px -2px rgba(0,0,0,0.03)' }}
        >
            <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 100%, ${color}08 0%, transparent 70%)` }}
            />
            <div className="relative z-10 p-3.5 flex items-center gap-4">
                <div className="flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px 1px ${color}25` }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{item.name}</span>
                        <div className="flex items-baseline gap-2 flex-shrink-0">
                            <span className="text-[15px] font-bold tabular-nums" style={{ color }}>
                                {days !== null ? (days < 0 ? `${Math.abs(days)}d atrás` : days === 0 ? 'Hoje' : `${days}d`) : '—'}
                            </span>
                            <span className="text-[10px] font-medium text-zinc-400">{total.toFixed(1)} {unit}</span>
                        </div>
                    </div>

                    {/* Progress bar - same style as StockItemRow */}
                    <div className="mt-2 relative">
                        <div className="h-1 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-700">
                            <motion.div
                                className="h-full rounded-full"
                                style={{
                                    background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
                                    boxShadow: `0 0 10px 1px ${color}40`
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                            />
                        </div>

                        {/* Labels */}
                        <div className="flex justify-between mt-1.5">
                            <span className="text-[9px] text-zinc-400 tabular-nums">
                                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                            </span>
                            <span className="text-[9px] font-medium" style={{ color }}>{label}</span>
                            <span className="text-[9px] text-zinc-400 tabular-nums">{days !== null && days >= 0 ? `${days}d restantes` : ''}</span>
                        </div>
                    </div>
                </div>

                <motion.svg
                    className="w-4 h-4 text-zinc-200 dark:text-zinc-600 flex-shrink-0 transition-all group-hover:text-zinc-400 group-hover:translate-x-0.5"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </motion.svg>
            </div>
        </motion.div>
    )
}

export function ExpirationLevelsSection({ items, getTotalQuantity, onConfigureItem }: ExpirationLevelsSectionProps): React.ReactElement {
    // Smart initial filter
    const initialFilter = useMemo(() => {
        const hasCritical = items.some(i => getExpirationStatus(i) === 'critical')
        const hasExpired = items.some(i => getExpirationStatus(i) === 'expired')
        if (hasCritical) return 'critical'
        if (hasExpired) return 'expired'
        return 'warning'
    }, [items])

    const [filter, setFilter] = useState<string>(initialFilter)
    const [searchQuery, setSearchQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    const tiles = [
        { id: 'critical', label: '≤7 dias', count: items.filter(i => getExpirationStatus(i) === 'critical').length, color: 'red', filter: 'critical' },
        { id: 'warning', label: '≤30 dias', count: items.filter(i => getExpirationStatus(i) === 'warning').length, color: 'orange', filter: 'warning' },
        { id: 'noDate', label: 'Sem data', count: items.filter(i => getExpirationStatus(i) === 'noDate').length, color: 'gray', filter: 'noDate' },
        { id: 'expired', label: 'Vencido', count: items.filter(i => getExpirationStatus(i) === 'expired').length, color: 'red', filter: 'expired' }
    ]

    const filteredItems = items.filter(item => {
        const status = getExpirationStatus(item)
        if (filter === 'critical') return status === 'critical'
        if (filter === 'warning') return status === 'warning'
        if (filter === 'noDate') return status === 'noDate'
        if (filter === 'expired') return status === 'expired'
        return true
    }).filter(item => !searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (!a.expiryDate) return 1
            if (!b.expiryDate) return -1
            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        }).slice(0, 10)

    const trackedCount = items.filter(i => i.expiryDate).length

    return (
        <section className="relative z-10 mb-10">
            {/* Ambient glow background - amber tint */}
            <div className="absolute -inset-4 rounded-[3.5rem] opacity-40 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,149,0,0.15) 0%, transparent 70%)' }} />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
            >
                {/* Main glass container */}
                <div
                    className="relative overflow-hidden rounded-[2.5rem] bg-white/60 dark:bg-black/40"
                    style={{
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.3) inset, 0 25px 50px -12px rgba(0,0,0,0.08), 0 0 80px -20px rgba(255,149,0,0.15)',
                        backdropFilter: 'blur(40px) saturate(180%)'
                    }}
                >
                    {/* Inner light reflection */}
                    <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none dark:hidden"
                        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 40%)' }} />

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Header - Compact Apple style */}
                        <div className="px-7 pt-7 pb-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">Validade</motion.h2>
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-[11px] text-zinc-400 mt-0.5 font-medium">Monitoramento de expiração</motion.p>
                                </div>

                                {/* Search + Badge group */}
                                <div className="flex items-center gap-2">
                                    {/* Expandable search */}
                                    <AnimatePresence mode="wait">
                                        {isFocused ? (
                                            <motion.div
                                                key="input"
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{ width: 180, opacity: 1 }}
                                                exit={{ width: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                                className="relative"
                                            >
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Buscar..."
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    onBlur={() => { if (!searchQuery) setIsFocused(false) }}
                                                    className="w-full pl-3 pr-8 py-1.5 rounded-lg text-[12px] text-zinc-800 dark:text-zinc-200 font-medium bg-white/90 dark:bg-zinc-800 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none border border-zinc-200/60 dark:border-zinc-700 focus:border-amber-200/60"
                                                />
                                                <button onClick={() => { setSearchQuery(''); setIsFocused(false) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <motion.button
                                                key="icon"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setIsFocused(true)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </motion.button>
                                        )}
                                    </AnimatePresence>

                                    {/* Badge */}
                                    <motion.div whileHover={{ scale: 1.03 }} className="px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,149,0,0.06)', boxShadow: '0 0 0 1px rgba(255,149,0,0.08) inset' }}>
                                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{trackedCount}</span>
                                        <span className="text-[9px] text-amber-400 ml-1">rastreados</span>
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                        {/* Status Tiles - Category Card Style */}
                        <div className="px-7 pb-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                {tiles.map((tile, i) => (
                                    <motion.div
                                        key={tile.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.03 + i * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <StatusTile
                                            tile={tile}
                                            isSelected={filter === tile.filter}
                                            onClick={() => setFilter(filter === tile.filter ? 'all' : tile.filter)}
                                            totalItems={items.length}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Items List - Compact */}
                        <div className="px-7 pb-7">
                            <AnimatePresence mode="popLayout">
                                {filteredItems.length > 0 && (
                                    <motion.div className="space-y-2" layout>
                                        {filteredItems.map((item, i) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: i * 0.02, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                            >
                                                <ExpirationItemRow
                                                    item={item}
                                                    status={getExpirationStatus(item)}
                                                    total={getTotalQuantity(item)}
                                                    unit={item.unit}
                                                    onClick={() => onConfigureItem(item)}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    )
}

export default ExpirationLevelsSection
