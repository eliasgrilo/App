// ═══════════════════════════════════════════════════════════════════
// STOCK LEVELS MODULES — Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { InventoryItem, StockStatus, colorStyles, statusColors } from './types'

interface StatusTileProps { tile: { id: string; label: string; subtitle: string; count: number; color: string; filter: string }; isSelected: boolean; onClick: () => void }

export const StatusTile: React.FC<StatusTileProps> = ({ tile, isSelected, onClick }) => {
    const styles = colorStyles[tile.color as keyof typeof colorStyles]
    return (
        <motion.button onClick={onClick} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative p-4 rounded-2xl text-left transition-all duration-[250ms]" style={{ background: styles.bg, border: `1px solid ${styles.border}`, boxShadow: isSelected ? '0 0 0 2px rgba(0, 122, 255, 0.3)' : '0 1px 3px rgba(0,0,0,0.04)' }}>
            {tile.id === 'critical' && tile.count > 0 && <span className="absolute top-3 right-3 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: styles.color }} /><span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: styles.color }} /></span>}
            <span className="block text-3xl font-bold tabular-nums leading-none" style={{ color: styles.color }}>{tile.count}</span>
            <span className="block mt-1.5 text-xs font-semibold" style={{ color: styles.color }}>{tile.label}</span>
            <span className="block mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">{tile.subtitle}</span>
        </motion.button>
    )
}

interface StockItemRowProps { item: InventoryItem; status: StockStatus; total: number; onClick: () => void }

export const StockItemRow: React.FC<StockItemRowProps> = ({ item, status, total, onClick }) => {
    const min = Number(item.minStock) || 0; const max = Number(item.maxStock) || 0
    let progress = 0; if (max > 0) progress = Math.min((total / max) * 100, 100); else if (min > 0) progress = Math.min((total / (min * 2)) * 100, 100)
    const color = statusColors[status] || statusColors.noLimit
    return (
        <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} onClick={onClick} whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }} whileTap={{ scale: 0.995 }} className="cursor-pointer p-3 rounded-xl transition-colors border border-transparent hover:border-zinc-200/80">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{item.name}</span><span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color }}>{total} {item.unit}</span></div>
                    {(min > 0 || max > 0) && <div className="mt-2 h-1 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden"><motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }} /></div>}
                </div>
                <svg className="w-4 h-4 text-zinc-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
        </motion.div>
    )
}
