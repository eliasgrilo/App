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
    const isManual = m.isManual === true

    // Colors: Orange for manual, Green for entrada, Rose for saida
    const colors = isManual
        ? { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200/60 dark:border-amber-500/20', bgCard: 'bg-amber-50/30 dark:bg-amber-500/5', text: 'text-amber-600 dark:text-amber-400', pillBorder: 'border-amber-200 dark:border-amber-500/20' }
        : t.isOut
            ? { bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200/60 dark:border-rose-500/20', bgCard: 'bg-rose-50/30 dark:bg-rose-500/5', text: 'text-rose-600 dark:text-rose-400', pillBorder: 'border-rose-200 dark:border-rose-500/20' }
            : { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200/60 dark:border-emerald-500/20', bgCard: 'bg-emerald-50/30 dark:bg-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-400', pillBorder: 'border-emerald-200 dark:border-emerald-500/20' }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 py-3 md:py-2.5 md:items-center group hover:bg-zinc-50 dark:hover:bg-white/[0.02] px-4 rounded-xl transition-all cursor-pointer border ${colors.border} ${colors.bgCard}`}>
            {/* Item Info */}
            <div className="md:col-span-5 flex items-center gap-2.5 min-w-0">
                {isManual ? (
                    // Manual: Subtle amber container with type indicator
                    <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50/80 dark:bg-amber-500/10">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-tight ${t.isOut ? 'bg-rose-100/80 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}`}>
                            {t.label}
                        </span>
                    </div>
                ) : (
                    // Normal: Clean minimal pill
                    <div className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-semibold tracking-tight ${colors.bg} ${colors.text}`}>
                        {t.label}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-zinc-900 dark:text-white truncate leading-snug tracking-tight">{m.itemName}</p>
                    <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 truncate mt-0.5 tracking-normal">{m.reason || t.label}</p>
                </div>
            </div>
            {/* Quantity Pill */}
            <div className="md:col-span-2 flex md:justify-center items-center gap-1.5">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-tight tabular-nums ${colors.bg} ${colors.text}`}>{t.isOut ? '−' : '+'}{m.quantity} {m.unit?.toUpperCase()}</span>
                {/* NF Pill - Apple Style */}
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
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md transition-all text-[10px] font-medium tracking-tight ${invoiceNumber
                                ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                }`}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {invoiceNumber ? `#${invoiceNumber}` : '—'}
                        </button>
                    )
                })()}
            </div>
            {/* Stock Level */}
            <div className="hidden md:flex md:col-span-2 justify-end items-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight tabular-nums bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{m.newStock ?? 0} {m.unit}</span>
            </div>
            {/* Total Value */}
            <div className="hidden md:flex md:col-span-2 justify-end items-center">
                <span className={`text-[15px] font-semibold tracking-tight tabular-nums ${isManual ? 'text-amber-600 dark:text-amber-400' : t.isOut ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{t.isOut ? '−' : '+'}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.quantity)}</span>
            </div>
            {/* Date + Delete */}
            <div className="md:col-span-1 flex justify-end items-center gap-1.5 pt-2 md:pt-0 border-t md:border-0 border-zinc-50 dark:border-white/5">
                <span className="hidden md:block text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums whitespace-nowrap">{new Date(m.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                <button onClick={() => onRemove(m)} className="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
            </div>
        </motion.div>
    )
}

