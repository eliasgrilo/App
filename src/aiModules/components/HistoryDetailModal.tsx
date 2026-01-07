// ═══════════════════════════════════════════════════════════════════
// AI MODULE — History Detail Modal Component
// ═══════════════════════════════════════════════════════════════════

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import type { HistoryQuotation, QuotationItemData } from '../types'

interface HistoryDetailModalProps {
    open: boolean
    quotation: HistoryQuotation | null
    onClose: () => void
    onMarkReceived?: (quotation: HistoryQuotation) => void
}

export function HistoryDetailModal({ open, quotation, onClose, onMarkReceived }: HistoryDetailModalProps) {
    if (!quotation) return null

    const isReceived = quotation.status === 'recebido'

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <ModalScrollLock />

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                        className="relative w-full max-w-2xl bg-zinc-900 rounded-[24px] shadow-2xl overflow-hidden border border-zinc-800"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                                    ${isReceived
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-white dark:bg-zinc-800 border border-zinc-700 text-zinc-200'
                                    }`}>
                                    {isReceived ? (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : quotation.supplierInitial}
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-white">{quotation.supplier}</h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">{quotation.supplierEmail}</p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider
                                ${isReceived
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                {isReceived ? (
                                    <>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Recebido
                                    </>
                                ) : 'Sem Resposta'}
                            </span>
                        </div>

                        {/* Date/Time Info */}
                        <div className="px-6 py-3 bg-zinc-900/50 border-b border-zinc-800">
                            <div className="flex items-center gap-4 text-sm text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                    <span>{quotation.timestamp}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{quotation.time}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-zinc-950">
                            {/* Table Header */}
                            <div className="grid grid-cols-3 gap-4 px-6 py-3 border-b border-zinc-800 bg-zinc-900/50">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Item</span>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider text-center">Estoque</span>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider text-right">Quantidade Solicitada</span>
                            </div>

                            {/* Table Rows */}
                            <div className="max-h-[300px] overflow-y-auto">
                                {quotation.items.length > 0 ? (
                                    quotation.items.map((item: QuotationItemData, idx: number) => (
                                        <div
                                            key={idx}
                                            className={`grid grid-cols-3 gap-4 px-6 py-4 ${idx !== quotation.items.length - 1 ? 'border-b border-zinc-800/50' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {isReceived && (
                                                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                <span className="text-sm font-medium text-zinc-300">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-zinc-500 text-center tabular-nums">
                                                {item.current}kg
                                            </span>
                                            <span className={`text-sm font-semibold text-right tabular-nums ${isReceived ? 'text-emerald-400' : 'text-amber-400'
                                                }`}>
                                                +{item.requested}kg
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center">
                                        <p className="text-sm text-zinc-500">Nenhum item registrado</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        {!isReceived && onMarkReceived && (
                            <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
                                <button
                                    onClick={() => {
                                        onMarkReceived(quotation)
                                        onClose()
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Marcar como Recebido
                                </button>
                            </div>
                        )}

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
