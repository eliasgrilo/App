// ═══════════════════════════════════════════════════════════════════
// MOVEMENT ITEM — REFINED APPLE ELEGANCE
// True Apple: Delicate, Subtle, Precise
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { StockMovement, MOVEMENT_TYPES } from './types'

interface MovementItemProps { movement: StockMovement; onRemove: (m: StockMovement) => void }

export const MovementItem: React.FC<MovementItemProps> = ({ movement: m, onRemove }) => {
    const rawType = (m.type || '').toLowerCase().trim()
    const isEntrada = rawType === 'entrada' || rawType === 'in' || rawType === 'compra' || rawType === 'recebimento' || rawType.includes('entrada')
    const t = MOVEMENT_TYPES[isEntrada ? 'entrada' : 'saida']!
    const isManual = m.isManual === true

    // Refined, Muted Colors - Apple Style
    const colors = isManual
        ? {
            bg: 'bg-amber-50 dark:bg-amber-950/20',
            text: 'text-amber-700 dark:text-amber-400',
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconText: 'text-amber-600 dark:text-amber-500'
        }
        : t.isOut
            ? {
                bg: 'bg-rose-50 dark:bg-rose-950/20',
                text: 'text-rose-700 dark:text-rose-400',
                iconBg: 'bg-rose-100 dark:bg-rose-900/30',
                iconText: 'text-rose-600 dark:text-rose-500'
            }
            : {
                bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                text: 'text-emerald-700 dark:text-emerald-400',
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                iconText: 'text-emerald-600 dark:text-emerald-500'
            }

    const notesText = m.notes || ''
    const invoiceMatch = notesText.match(/nNF[:\s]*([0-9]+)/i) || notesText.match(/^([0-9]+)$/)
    const invoiceNumber = invoiceMatch && invoiceMatch[1] ? invoiceMatch[1].replace(/^0+/, '') || '0' : null

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="group"
        >
            <div className="
                bg-white dark:bg-zinc-900 
                rounded-2xl 
                border border-zinc-200/60 dark:border-zinc-700/60
                p-4
                transition-all duration-200
                hover:border-zinc-300 dark:hover:border-zinc-600
                hover:shadow-sm
            ">
                <div className="flex items-center gap-3">
                    {/* Delicate Icon */}
                    <div className={`w-9 h-9 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
                        {isManual ? (
                            <svg className={`w-4 h-4 ${colors.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        ) : t.isOut ? (
                            <svg className={`w-4 h-4 ${colors.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        ) : (
                            <svg className={`w-4 h-4 ${colors.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                        )}
                    </div>

                    {/* Item Info - Refined Typography */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-white leading-tight truncate">
                                {m.itemName}
                            </h4>
                            <span className={`text-[11px] font-medium ${colors.text}`}>
                                {t.isOut ? '−' : '+'}{m.quantity} {m.unit}
                            </span>
                        </div>
                        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {m.reason || t.label}
                        </p>
                    </div>

                    {/* Right Side - Compact */}
                    <div className="flex items-center gap-2">
                        {/* Invoice Icon - RESTORED */}
                        {invoiceNumber && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    alert(`📄 Nota Fiscal #${invoiceNumber}\n\nVisualização completa em desenvolvimento.`)
                                }}
                                className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                                title={`NF #${invoiceNumber}`}
                            >
                                <svg className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </button>
                        )}

                        {/* Value - Elegant */}
                        <div className="text-right">
                            <div className={`text-[17px] font-semibold tabular-nums ${colors.text}`}>
                                {t.isOut ? '−' : '+'}
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(m.quantity)}
                            </div>
                            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                                {new Date(m.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </div>
                        </div>

                        {/* Delete - Subtle */}
                        <button
                            onClick={() => onRemove(m)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
