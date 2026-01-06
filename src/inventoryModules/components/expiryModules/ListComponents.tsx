// ═══════════════════════════════════════════════════════════════════
// EXPIRY MONITORING MODULES — Timeline & Stats Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { ItemWithExpiry, InventoryItem } from './types'

interface QuickStatsProps { expiredCount: number; criticalCount: number; warningCount: number; okCount: number; totalItems: number }

export const QuickStats: React.FC<QuickStatsProps> = ({ expiredCount, criticalCount, warningCount, okCount, totalItems }) => (
    <div className="px-8 py-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
                {[{ label: 'Vencidos', count: expiredCount, color: '#FF3B30' }, { label: 'Crítico', count: criticalCount, color: '#FF3B30' }, { label: 'Atenção', count: warningCount, color: '#FF9500' }, { label: 'OK', count: okCount, color: '#34C759' }].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} /><span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</span><span className="text-sm font-bold tabular-nums" style={{ color: stat.count > 0 ? stat.color : undefined }}>{stat.count}</span></div>
                ))}
            </div>
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">{totalItems} itens monitorados</span>
        </div>
    </div>
)

interface TimelineProps { items: ItemWithExpiry[]; onConfigureItem: (item: InventoryItem) => void }

export const Timeline: React.FC<TimelineProps> = ({ items, onConfigureItem }) => (
    <div className="px-8 pb-8 pt-4">
        <div className="flex items-center gap-2 mb-4"><h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Próximos Vencimentos</h4><div className="flex-1 h-px bg-gradient-to-r from-zinc-200 dark:from-zinc-700 to-transparent" /></div>
        <div className="space-y-2">
            {items.map((item, index) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.1 }} onClick={() => onConfigureItem(item)} className="group flex items-center gap-4 p-3 -mx-2 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                    <div className="relative flex flex-col items-center" style={{ width: '20px' }}><div className="w-3 h-3 rounded-full ring-4 ring-white dark:ring-zinc-900" style={{ backgroundColor: item.expiryData.color }} />{index < items.length - 1 && <div className="absolute top-4 w-0.5 h-8 bg-zinc-100 dark:bg-zinc-800" />}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-zinc-900 dark:text-white truncate group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">{item.name}</p></div>
                    <div className="flex items-center gap-2"><span className="text-sm font-bold tabular-nums" style={{ color: item.expiryData.color }}>{item.expiryData.days < 0 ? `−${Math.abs(item.expiryData.days)}` : item.expiryData.days}d</span><svg className="w-4 h-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></div>
                </motion.div>
            ))}
        </div>
    </div>
)

interface NoExpiryHintProps { count: number }

export const NoExpiryHint: React.FC<NoExpiryHintProps> = ({ count }) => (
    <div className="mx-8 mb-8 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center"><svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></div>
            <div><p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{count} itens sem validade</p><p className="text-xs text-zinc-400 dark:text-zinc-500">Clique em um item para adicionar data</p></div>
        </div>
    </div>
)
