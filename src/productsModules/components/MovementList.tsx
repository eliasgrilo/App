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
                    {/* Date Divider - Protocol Ledger Style */}
                    <div className="px-6 md:px-8 py-4 flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600" />
                            <span className="text-[13px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-[0.12em]">{date}</span>
                        </div>
                        <div className="flex-1 h-[2px] bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent dark:from-zinc-700 dark:via-zinc-800 dark:to-transparent rounded-full" />
                    </div>

                    {/* Apple-Style Column Headers */}
                    <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-200/40 dark:border-zinc-800/40 px-6 md:px-8 py-3">
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="shrink-0 w-[52px]">
                                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em] select-none">Tipo</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em] select-none">Item</span>
                            </div>
                            <div className="text-right w-[72px]">
                                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em] select-none">Quantidade</span>
                            </div>
                            <div className="w-28 text-right hidden md:block">
                                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em] select-none">Valor Unit.</span>
                            </div>
                            <div className="w-20 text-right hidden md:block">
                                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em] select-none">Estoque</span>
                            </div>
                            <div className="w-24 text-right hidden md:block">
                                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em] select-none">Valor Total</span>
                            </div>
                            <div className="w-10" /> {/* Delete button spacer */}
                        </div>
                    </div>

                    <div className="divide-y divide-zinc-100/50 dark:divide-white/5">
                        {list.map(m => {
                            const t = TYPES[m.type as SimpleMovementType] || { label: m.type, color: 'zinc', isOut: true }
                            return (
                                <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="group px-6 md:px-8 py-5 flex items-center gap-4 md:gap-6 hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                    {/* Apple-Style Type Badge with Icon */}
                                    <div className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${t.isOut
                                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                        : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                        {/* Icon SVG */}
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            {t.isOut ? (
                                                // Saída - Up Arrow
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                                            ) : (
                                                // Entrada - Down Arrow
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l7-7m-7 7l-7-7" />
                                            )}
                                        </svg>
                                        <span>{t.label}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 truncate">{m.itemName}</p>
                                            {/* Invoice Icon - Apple Style */}
                                            {(() => {
                                                const notesText = m.notes || ''
                                                const invoiceMatch = notesText.match(/nNF[:\s]*([0-9]+)/i) || notesText.match(/^([0-9]+)$/)
                                                const invoiceNumber = invoiceMatch && invoiceMatch[1] ? invoiceMatch[1].replace(/^0+/, '') || '0' : null
                                                return (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (invoiceNumber) {
                                                                alert(`📄 Nota Fiscal #${invoiceNumber}\n\nVisualização completa em desenvolvimento.`)
                                                            } else {
                                                                alert('📄 Nota fiscal não vinculada\n\nEsta movimentação não possui NF-e associada.')
                                                            }
                                                        }}
                                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all duration-200 text-[9px] font-medium ${invoiceNumber
                                                            ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/25'
                                                            : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                            }`}
                                                        title={invoiceNumber ? `NF #${invoiceNumber}` : 'Sem nota fiscal'}
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <span className="hidden md:inline">{invoiceNumber ? `#${invoiceNumber}` : '—'}</span>
                                                    </button>
                                                )
                                            })()}
                                        </div>
                                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                                            {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            {m.reason && <> · {m.reason}</>}
                                        </p>
                                    </div>
                                    <div className={`text-right ${t.isOut ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        <span className="text-lg font-semibold tabular-nums">{t.isOut ? '−' : '+'}{m.quantity}</span>
                                        <span className="text-xs ml-1 opacity-60">{m.unit}</span>
                                    </div>
                                    {/* Valor Unitário - Minimal Refinement */}
                                    <div className="w-28 text-right hidden md:block">
                                        <span className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 tabular-nums tracking-tight">
                                            {m.costAtTime && m.quantity ? formatCurrency(m.costAtTime / m.quantity) : '—'}
                                        </span>
                                    </div>
                                    <div className="w-20 text-right text-zinc-500 hidden md:block">
                                        <span className="text-sm tabular-nums">{m.newStock.toFixed(1)}</span>
                                        <span className="text-xs ml-1 opacity-60">{m.unit}</span>
                                    </div>
                                    <div className="w-24 text-right hidden md:block">
                                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
                                            {m.costAtTime ? formatCurrency(m.costAtTime) : '—'}
                                        </span>
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
