// ═══════════════════════════════════════════════════════════════════
// MOVEMENT REGISTRY MODULES — Movement Item Component
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { StockMovement, MOVEMENT_TYPES } from './types'

interface MovementItemProps { movement: StockMovement; onRemove: (m: StockMovement) => void }

export const MovementItem: React.FC<MovementItemProps> = ({ movement: m, onRemove }) => {
    const rawType = (m.type || '').toLowerCase().trim()
    const isEntrada = rawType === 'entrada' || rawType === 'in' || rawType === 'compra' || rawType === 'recebimento' || rawType.includes('entrada')
    const t = MOVEMENT_TYPES[isEntrada ? 'entrada' : 'saida']!

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-8 py-5 md:items-center group hover:bg-zinc-50 dark:hover:bg-white/[0.02] px-4 rounded-2xl md:rounded-[1.5rem] transition-all cursor-pointer border ${t.isOut ? 'border-rose-200/60 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/5' : 'border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5'}`}>
            {/* Item Info */}
            <div className="md:col-span-5 flex items-start md:items-center gap-4 min-w-0">
                <div className={`shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${t.isOut ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>{t.label}</div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <p className="text-sm md:text-base font-semibold text-zinc-900 dark:text-white truncate">{m.itemName}</p>
                        <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
                            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {new Date(m.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} · {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate mt-0.5">{m.reason || t.label}</p>
                </div>
            </div>
            {/* Quantity Pill */}
            <div className="md:col-span-2 flex md:justify-center items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-tighter tabular-nums ${t.isOut ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>{t.isOut ? '−' : '+'}{m.quantity} {m.unit?.toUpperCase()}</span>
            </div>
            {/* Stock Level */}
            <div className="hidden md:flex md:col-span-2 justify-end items-center"><span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-semibold tabular-nums bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">{m.newStock ?? 0} {m.unit}</span></div>
            {/* Total Value */}
            <div className="hidden md:flex md:col-span-2 justify-end items-center gap-2">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter md:opacity-0 group-hover:opacity-100 transition-opacity">TOTAL</span>
                <span className={`text-base md:text-lg font-bold tracking-tight tabular-nums ${t.isOut ? 'text-rose-600 dark:text-rose-400' : 'text-violet-600 dark:text-violet-400'}`}>{t.isOut ? '−' : '+'}{new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(m.quantity)}</span>
            </div>
            {/* Delete */}
            <div className="md:col-span-1 flex justify-end gap-2 md:gap-1 md:opacity-0 group-hover:opacity-100 transition-all pt-2 md:pt-0 border-t md:border-0 border-zinc-50 dark:border-white/5">
                <button onClick={() => onRemove(m)} className="p-2 rounded-xl text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
            </div>
        </motion.div>
    )
}
