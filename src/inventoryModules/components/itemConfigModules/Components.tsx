// ═══════════════════════════════════════════════════════════════════
// ITEM CONFIG MODULES — Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { InventoryItem, getGradient, getShadow, StockStatus } from './types'

interface ItemBadgeProps { item: InventoryItem; total: number; status: StockStatus }

export const ItemBadge: React.FC<ItemBadgeProps> = ({ item, total, status }) => (
    <div className="text-center mb-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex w-[72px] h-[72px] rounded-[22px] items-center justify-center text-3xl font-bold text-white mb-4" style={{ background: getGradient(status), boxShadow: getShadow(status) }}>{total}</motion.div>
        <h4 className="text-xl font-bold text-zinc-900 dark:text-white">{item.name}</h4>
        <p className="text-sm text-zinc-400 mt-1">Estoque atual: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{total} {item.unit}</span></p>
    </div>
)

interface LimitInputsProps { item: InventoryItem; onChange: (field: keyof InventoryItem, value: string) => void }

export const LimitInputs: React.FC<LimitInputsProps> = ({ item, onChange }) => {
    const itemId = `limit-${item.id}`
    return (
        <div className="grid grid-cols-3 gap-3 mb-6">
            <div><label htmlFor={`${itemId}-critical`} className="block text-[10px] font-bold text-red-400 uppercase tracking-[0.15em] mb-2 ml-1">Crítico</label><input id={`${itemId}-critical`} type="number" step="0.01" className="w-full px-3 py-[14px] rounded-2xl text-zinc-900 dark:text-white text-center text-xl font-bold focus:outline-none bg-red-500/[0.08] dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30" placeholder="0" value={item.criticalStock || ''} onChange={e => onChange('criticalStock', e.target.value)} /><p className="text-[10px] text-red-500/80 text-center mt-1.5 font-semibold">{item.unit}</p></div>
            <div><label htmlFor={`${itemId}-min`} className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2 ml-1">Mínimo</label><input id={`${itemId}-min`} type="number" step="0.01" className="w-full px-4 py-[18px] rounded-2xl text-zinc-900 dark:text-white text-center text-2xl font-bold focus:outline-none bg-amber-500/[0.08] dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/30" placeholder="0" value={item.minStock || ''} onChange={e => onChange('minStock', e.target.value)} /><p className="text-[10px] text-amber-500/80 text-center mt-1.5 font-semibold">{item.unit}</p></div>
            <div><label htmlFor={`${itemId}-max`} className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2 ml-1">Máximo</label><input id={`${itemId}-max`} type="number" step="0.01" className="w-full px-4 py-[18px] rounded-2xl text-zinc-900 dark:text-white text-center text-2xl font-bold focus:outline-none bg-blue-500/[0.08] dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30" placeholder="0" value={item.maxStock || ''} onChange={e => onChange('maxStock', e.target.value)} /><p className="text-[10px] text-blue-500/80 text-center mt-1.5 font-semibold">{item.unit}</p></div>
        </div>
    )
}
