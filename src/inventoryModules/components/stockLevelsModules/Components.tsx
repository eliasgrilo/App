// ═══════════════════════════════════════════════════════════════════
// STOCK LEVELS MODULES — Components (True Apple Vision Pro)
// Ultra-refined glassmorphism, glowing indicators, material depth
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { InventoryItem, StockStatus, statusColors, statusLabels } from './types'

interface StatusTileProps {
    tile: { id: string; label: string; count: number; color: string; filter: string }
    isSelected: boolean
    onClick: () => void
    totalItems?: number
}

// Apple-style category card colors
const tileColors = {
    red: {
        bg: 'bg-red-500/80',
        text: 'text-red-500',
        shadow: 'shadow-[0_0_8px_rgba(255,59,48,0.4)]',
        pulse: 'bg-red-500',
        border: 'border-red-200/60',
        selectedBorder: 'border-red-400/60'
    },
    orange: {
        bg: 'bg-orange-500/80',
        text: 'text-orange-500',
        shadow: 'shadow-[0_0_8px_rgba(255,159,10,0.4)]',
        pulse: 'bg-orange-500',
        border: 'border-orange-200/60',
        selectedBorder: 'border-orange-400/60'
    },
    green: {
        bg: 'bg-emerald-500/80',
        text: 'text-emerald-500',
        shadow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]',
        pulse: 'bg-emerald-500',
        border: 'border-emerald-200/60',
        selectedBorder: 'border-emerald-400/60'
    },
    gray: {
        bg: 'bg-zinc-500/80',
        text: 'text-zinc-500',
        shadow: 'shadow-[0_0_8px_rgba(113,113,122,0.4)]',
        pulse: 'bg-zinc-500',
        border: 'border-zinc-200/60',
        selectedBorder: 'border-zinc-400/60'
    }
}

export const StatusTile: React.FC<StatusTileProps> = ({ tile, isSelected, onClick, totalItems = 0 }) => {
    const colors = tileColors[tile.color as keyof typeof tileColors]
    const allocation = totalItems > 0 ? Math.round((tile.count / totalItems) * 100) : 0

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`relative w-full text-left bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-3xl p-5 border ${isSelected ? colors.selectedBorder : 'border-zinc-200/50 dark:border-white/5'} flex flex-col justify-between group shadow-md hover:shadow-lg transition-all duration-300`}
        >
            {/* Header with dot and label */}
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.pulse} ${colors.shadow}`} />
                    <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{tile.label}</h3>
                </div>

                {/* Count */}
                <motion.div
                    className={`text-2xl md:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                    {tile.count}
                </motion.div>

                {/* Subtitle */}
                <div className="text-[9px] font-medium text-zinc-400 tabular-nums">
                    {tile.count === 1 ? 'item' : 'itens'}
                </div>
            </div>

            {/* Status bar - always full with status color */}
            <div className="mt-4">
                <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full w-full ${colors.bg}`}
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                </div>
            </div>
        </motion.button>
    )
}


interface StockItemRowProps { item: InventoryItem; status: StockStatus; total: number; onClick: () => void }

export const StockItemRow: React.FC<StockItemRowProps> = ({ item, status, total, onClick }) => {
    const min = Number(item.minStock) || 0
    const max = Number(item.maxStock) || 0
    let progress = 0
    if (max > 0) progress = Math.min((total / max) * 100, 100)
    else if (min > 0) progress = Math.min((total / (min * 2)) * 100, 100)

    const color = statusColors[status] || statusColors.noLimit
    const label = statusLabels[status] || 'Configurar'
    const hasLimits = min > 0 || max > 0

    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.003 }}
            whileTap={{ scale: 0.997 }}
            className="group cursor-pointer relative overflow-hidden rounded-xl transition-all duration-200 bg-transparent dark:bg-transparent border border-zinc-200/30 dark:border-white/10"
        >
            {/* Hover glow */}
            <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 100%, ${color}08 0%, transparent 70%)` }}
            />

            <div className="relative z-10 p-3.5 flex items-center gap-4">
                {/* Status indicator */}
                <div className="flex-shrink-0">
                    <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: color, boxShadow: `0 0 4px 1px ${color}25` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{item.name}</span>
                        <div className="flex items-baseline gap-1 flex-shrink-0">
                            <span className="text-[15px] font-bold tabular-nums" style={{ color }}>{total.toFixed(1)}</span>
                            <span className="text-[10px] font-medium text-zinc-400">{item.unit}</span>
                        </div>
                    </div>

                    {/* Progress bar - always shown like ExpirationItemRow */}
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
                            <span className="text-[9px] text-zinc-400 tabular-nums">{min > 0 ? `Min ${min}` : ''}</span>
                            <span className="text-[9px] font-medium" style={{ color }}>{label}</span>
                            <span className="text-[9px] text-zinc-400 tabular-nums">{max > 0 ? `Max ${max}` : ''}</span>
                        </div>
                    </div>
                </div>

                {/* Arrow */}
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
