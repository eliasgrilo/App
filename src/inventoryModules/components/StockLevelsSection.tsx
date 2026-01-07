// ═══════════════════════════════════════════════════════════════════
// STOCK LEVELS SECTION — True Apple Vision Pro Experience
// Ultra-premium glassmorphism, material depth, glowing elements
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StockLevelsSectionProps, StatusTile, StockItemRow } from './stockLevelsModules'

export function StockLevelsSection({ items, getStockStatus, getTotalQuantity, onConfigureItem }: StockLevelsSectionProps): React.ReactElement {
    // Smart initial filter: Critical if any critical items, otherwise MinStock
    const initialFilter = useMemo(() => {
        const hasCritical = items.some(i => getStockStatus(i) === 'low')
        return hasCritical ? 'critical' : 'minStock'
    }, [items, getStockStatus])

    const [stockFilter, setStockFilter] = useState<string>(initialFilter)
    const [stockSearchQuery, setStockSearchQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    const tiles = [
        { id: 'critical', label: 'Crítico', count: items.filter(i => getStockStatus(i) === 'low').length, color: 'red', filter: 'critical' },
        { id: 'minStock', label: 'Baixo', count: items.filter(i => getStockStatus(i) === 'warning').length, color: 'orange', filter: 'minStock' },
        { id: 'maxStock', label: 'Excesso', count: items.filter(i => getStockStatus(i) === 'high').length, color: 'green', filter: 'maxStock' },
        { id: 'noLimit', label: 'Configurar', count: items.filter(i => getStockStatus(i) === 'noLimit').length, color: 'gray', filter: 'noLimits' }
    ]

    const filteredItems = items.filter(item => {
        const status = getStockStatus(item)
        if (stockFilter === 'noLimits') return status === 'noLimit'
        if (stockFilter === 'critical') return status === 'low'
        if (stockFilter === 'minStock') return status === 'warning'
        if (stockFilter === 'maxStock') return status === 'high'
        return true
    }).filter(item => !stockSearchQuery.trim() || item.name.toLowerCase().includes(stockSearchQuery.toLowerCase())).slice(0, 10)

    return (
        <section className="relative z-10 mb-10">
            {/* Ambient glow background */}
            <div className="absolute -inset-4 rounded-[3.5rem] opacity-40 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
            >
                {/* Main glass container */}
                <div
                    className="relative overflow-hidden rounded-[2.5rem] bg-white/95 dark:bg-black"
                    style={{
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.5) inset, 0 25px 50px -12px rgba(0,0,0,0.08), 0 0 80px -20px rgba(99,102,241,0.15)',
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
                                    <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">Níveis</motion.h2>
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-[11px] text-zinc-400 mt-0.5 font-medium">Monitoramento inteligente</motion.p>
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
                                                    value={stockSearchQuery}
                                                    onChange={e => setStockSearchQuery(e.target.value)}
                                                    onBlur={() => { if (!stockSearchQuery) setIsFocused(false) }}
                                                    className="w-full pl-3 pr-8 py-1.5 rounded-lg text-[12px] text-zinc-800 dark:text-zinc-200 font-medium bg-white/90 dark:bg-zinc-800 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none border border-zinc-200/60 dark:border-zinc-700 focus:border-indigo-200/60"
                                                />
                                                <button onClick={() => { setStockSearchQuery(''); setIsFocused(false) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500">
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
                                    <motion.div whileHover={{ scale: 1.03 }} className="px-3 py-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.06)', boxShadow: '0 0 0 1px rgba(99,102,241,0.08) inset' }}>
                                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">{items.length}</span>
                                        <span className="text-[9px] text-indigo-400 ml-1">itens</span>
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
                                            isSelected={stockFilter === tile.filter}
                                            onClick={() => setStockFilter(stockFilter === tile.filter ? 'all' : tile.filter)}
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
                                                <StockItemRow
                                                    item={item}
                                                    status={getStockStatus(item)}
                                                    total={getTotalQuantity(item)}
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

export default StockLevelsSection
