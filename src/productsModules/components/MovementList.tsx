// ═══════════════════════════════════════════════════════════════════
// PRODUCTS MODULE — Movement List Component
// ═══════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import type { StockMovement } from '../../stores/useAppStore'
import { TYPES, type SimpleMovementType } from '../types'

interface MovementListProps {
    grouped: Record<string, StockMovement[]>
    formatCurrency: (val: number) => string
    onRemove: (m: StockMovement) => void
}

export function MovementList({ grouped, formatCurrency, onRemove }: MovementListProps) {
    if (Object.keys(grouped).length === 0) {
        return (
            <div className="py-20 text-center">
                <div className="w-20 h-20 mx-auto bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                    <svg className="h-10 w-10 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Nenhuma Movimentação</h3>
                <p className="text-zinc-500 text-sm">Comece registrando sua primeira movimentação</p>
            </div>
        )
    }

    return (
        <>
            {Object.entries(grouped).map(([date, list]) => (
                <div key={date}>
                    <div className="px-6 md:px-8 py-4 bg-zinc-50/50 dark:bg-white/[0.01] border-b border-zinc-100/80 dark:border-white/5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{date}</span>
                    </div>
                    <div className="divide-y divide-zinc-100/50 dark:divide-white/5">
                        {list.map(m => {
                            const t = TYPES[m.type as SimpleMovementType] || { label: m.type, color: 'zinc', isOut: true }
                            return (
                                <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="group px-6 md:px-8 py-5 flex items-center gap-4 md:gap-6 hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                    <div className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-${t.color}-50 dark:bg-${t.color}-500/10 text-${t.color}-600 dark:text-${t.color}-400`}>
                                        {t.label}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 truncate">{m.itemName}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                                            {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            {m.reason && <> · {m.reason}</>}
                                        </p>
                                    </div>
                                    <div className={`text-right ${t.isOut ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        <span className="text-lg font-semibold tabular-nums">{t.isOut ? '−' : '+'}{m.quantity}</span>
                                        <span className="text-xs ml-1 opacity-60">{m.unit}</span>
                                    </div>
                                    <div className="w-20 text-right text-zinc-500 hidden md:block">
                                        <span className="text-sm tabular-nums">{m.newStock.toFixed(1)}</span>
                                    </div>
                                    <div className="w-24 text-right text-zinc-400 text-sm hidden md:block tabular-nums">
                                        {m.costAtTime ? formatCurrency(m.costAtTime) : '—'}
                                    </div>
                                    <button onClick={() => onRemove(m)}
                                        className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </>
    )
}
