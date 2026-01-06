/**
 * ═══════════════════════════════════════════════════════════════════
 * STOCK LEVELS SECTION — Apple Vision Pro Design
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface InventoryItem {
    id: number
    name: string
    packageQuantity: number
    packageCount: number
    unit: string
    pricePerUnit: number
    category: string
    minStock?: number
    maxStock?: number
    criticalStock?: number
}

type StockStatus = 'noLimit' | 'critical' | 'warning' | 'excess' | 'ok' | 'low' | 'high'

interface StockLevelsSectionProps {
    items: InventoryItem[]
    getStockStatus: (item: InventoryItem) => StockStatus
    getTotalQuantity: (item: InventoryItem) => number
    onConfigureItem: (item: InventoryItem) => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function StockLevelsSection({
    items,
    getStockStatus,
    getTotalQuantity,
    onConfigureItem
}: StockLevelsSectionProps): React.ReactElement {
    const [stockFilter, setStockFilter] = useState<string>('all')
    const [stockSearchQuery, setStockSearchQuery] = useState('')

    const criticalItems = items.filter(item => getStockStatus(item) === 'low')
    const minStockItems = items.filter(item => getStockStatus(item) === 'warning')
    const maxStockItems = items.filter(item => getStockStatus(item) === 'high')
    const noLimitItems = items.filter(item => getStockStatus(item) === 'noLimit')

    const tiles = [
        { id: 'critical', label: 'Estoque Crítico', subtitle: 'Pânico - Comprar AGORA', count: criticalItems.length, color: 'red', filter: 'critical' },
        { id: 'minStock', label: 'Estoque Mínimo', subtitle: 'Planejamento - Fazer pedido', count: minStockItems.length, color: 'orange', filter: 'minStock' },
        { id: 'maxStock', label: 'Estoque Máximo', subtitle: 'Evitar Desperdício', count: maxStockItems.length, color: 'green', filter: 'maxStock' },
        { id: 'noLimit', label: 'Sem Limite', subtitle: 'Configurar estoque mínimo', count: noLimitItems.length, color: 'gray', filter: 'noLimits' }
    ]

    const colorStyles = {
        red: { bg: 'rgba(255, 59, 48, 0.08)', border: 'rgba(255, 59, 48, 0.2)', color: '#FF3B30' },
        orange: { bg: 'rgba(255, 149, 0, 0.08)', border: 'rgba(255, 149, 0, 0.2)', color: '#FF9500' },
        green: { bg: 'rgba(52, 199, 89, 0.08)', border: 'rgba(52, 199, 89, 0.2)', color: '#34C759' },
        gray: { bg: 'rgba(142, 142, 147, 0.08)', border: 'rgba(142, 142, 147, 0.2)', color: '#8E8E93' }
    }

    const statusColors: Record<string, string> = {
        low: '#FF3B30',
        warning: '#FF9500',
        high: '#5856D6',
        ok: '#34C759',
        adequate: '#34C759',
        noLimit: '#8E8E93'
    }

    const filteredItems = items
        .filter(item => {
            const status = getStockStatus(item)
            if (stockFilter === 'noLimits') return status === 'noLimit'
            if (stockFilter === 'critical') return status === 'low'
            if (stockFilter === 'minStock') return status === 'warning'
            if (stockFilter === 'maxStock') return status === 'high'
            return true
        })
        .filter(item => {
            if (!stockSearchQuery.trim()) return true
            return item.name.toLowerCase().includes(stockSearchQuery.toLowerCase())
        })
        .slice(0, 8)

    return (
        <section className="relative z-10 mb-8">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 shadow-sm overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Níveis</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Monitoramento de estoque</p>
                        </div>
                        <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 tabular-nums">{items.length} itens</span>
                        </div>
                    </div>
                </div>

                {/* Status Grid */}
                <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {tiles.map((tile) => {
                            const styles = colorStyles[tile.color as keyof typeof colorStyles]
                            const isSelected = stockFilter === tile.filter

                            return (
                                <motion.button
                                    key={tile.id}
                                    onClick={() => setStockFilter(stockFilter === tile.filter ? 'all' : tile.filter)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative p-4 rounded-2xl text-left transition-all duration-[250ms]"
                                    style={{
                                        background: styles.bg,
                                        border: `1px solid ${styles.border}`,
                                        boxShadow: isSelected ? '0 0 0 2px rgba(0, 122, 255, 0.3)' : '0 1px 3px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    {tile.id === 'critical' && tile.count > 0 && (
                                        <span className="absolute top-3 right-3 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: styles.color }} />
                                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: styles.color }} />
                                        </span>
                                    )}
                                    <span className="block text-3xl font-bold tabular-nums leading-none" style={{ color: styles.color }}>{tile.count}</span>
                                    <span className="block mt-1.5 text-xs font-semibold" style={{ color: styles.color }}>{tile.label}</span>
                                    <span className="block mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">{tile.subtitle}</span>
                                </motion.button>
                            )
                        })}
                    </div>
                </div>

                {/* Search */}
                <div className="px-6 pb-4">
                    <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar item..."
                            value={stockSearchQuery}
                            onChange={(e) => setStockSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 border border-transparent focus:border-zinc-300"
                        />
                    </div>
                </div>

                {/* Items List */}
                <div className="px-6 pb-4 max-h-[360px] overflow-y-auto">
                    <div className="space-y-2">
                        {filteredItems.map((item) => {
                            const status = getStockStatus(item)
                            const total = getTotalQuantity(item)
                            const min = Number(item.minStock) || 0
                            const max = Number(item.maxStock) || 0
                            let progress = 0
                            if (max > 0) progress = Math.min((total / max) * 100, 100)
                            else if (min > 0) progress = Math.min((total / (min * 2)) * 100, 100)
                            const color = statusColors[status] || statusColors.noLimit

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => onConfigureItem(item)}
                                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                                    whileTap={{ scale: 0.995 }}
                                    className="cursor-pointer p-3 rounded-xl transition-colors border border-transparent hover:border-zinc-200/80"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{item.name}</span>
                                                <span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color }}>{total} {item.unit}</span>
                                            </div>
                                            {(min > 0 || max > 0) && (
                                                <div className="mt-2 h-1 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: color }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <svg className="w-4 h-4 text-zinc-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {items.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <p className="text-sm text-zinc-500">Nenhum item encontrado</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </section>
    )
}

export default StockLevelsSection
