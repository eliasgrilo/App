// ═══════════════════════════════════════════════════════════════════
// EXPIRY MONITORING MODULES — Hero Card Component
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { ItemWithExpiry, InventoryItem } from './types'

interface HeroCardProps { item: ItemWithExpiry; getTotalQuantity: (item: InventoryItem) => number; onConfigureItem: (item: InventoryItem) => void; circumference: number }

export const HeroCard: React.FC<HeroCardProps> = ({ item, getTotalQuantity, onConfigureItem, circumference }) => (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }} className="relative p-6 rounded-3xl overflow-hidden cursor-pointer group"
        style={{ background: `linear-gradient(135deg, ${item.expiryData.color}15 0%, ${item.expiryData.color}05 100%)`, border: `1px solid ${item.expiryData.color}20` }} onClick={() => onConfigureItem(item)}>
        {item.expiryData.status === 'expired' && <div className="absolute inset-0 animate-pulse" style={{ background: `${item.expiryData.color}10` }} />}
        <div className="relative flex items-center gap-6">
            {/* Circular Progress Ring */}
            <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-700" strokeWidth="6" />
                    <motion.circle cx="50" cy="50" r="45" fill="none" stroke={item.expiryData.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference - (item.expiryData.progress / 100) * circumference }} transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span className="text-3xl font-bold tabular-nums" style={{ color: item.expiryData.color }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}>{item.expiryData.days < 0 ? Math.abs(item.expiryData.days) : item.expiryData.days}</motion.span>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{item.expiryData.days < 0 ? 'dias vencido' : 'dias'}</span>
                </div>
            </div>
            {/* Item details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: `${item.expiryData.color}20`, color: item.expiryData.color }}>{item.expiryData.label}</span></div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white truncate mb-1 group-hover:text-opacity-80 transition-all">{item.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Vence em <span className="font-semibold" style={{ color: item.expiryData.color }}>{item.expiryData.expiry.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                <div className="flex items-center gap-4 mt-3"><div className="text-xs text-zinc-400"><span className="font-semibold text-zinc-600 dark:text-zinc-300">{getTotalQuantity(item)}</span> {item.unit} em estoque</div></div>
            </div>
            <motion.div className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" whileHover={{ scale: 1.1 }}><svg className="w-5 h-5 text-zinc-600 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></motion.div>
        </div>
    </motion.div>
)
