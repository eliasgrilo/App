// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Received Items Modal Component
// ═══════════════════════════════════════════════════════════════════

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import type { Quotation, QuotationItemData } from '../types'

interface ReceivedItemsModalProps {
    open: boolean
    order: Quotation | null
    onClose: () => void
}

export function ReceivedItemsModal({ open, order, onClose }: ReceivedItemsModalProps) {
    if (!order) return null

    // Format the received date
    const formatReceivedDate = () => {
        const now = new Date()
        return `Recebido em ${now.toLocaleDateString('pt-BR', { month: 'short', day: '2-digit', year: 'numeric' }).replace('.', '')}`
    }

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
                                {/* Checkmark Icon */}
                                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-white">{order.supplier}</h3>
                                    <p className="text-xs text-emerald-400 mt-0.5">{formatReceivedDate()}</p>
                                </div>
                            </div>

                            {/* Received Status Badge */}
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Recebido
                            </span>
                        </div>

                        {/* Items Table */}
                        <div className="bg-zinc-950">
                            {/* Table Header */}
                            <div className="grid grid-cols-2 gap-4 px-6 py-3 border-b border-zinc-800 bg-zinc-900/50">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Item Recebido</span>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider text-right">Quantidade</span>
                            </div>

                            {/* Table Rows */}
                            <div className="max-h-[300px] overflow-y-auto">
                                {order.items.length > 0 ? (
                                    order.items.map((item: QuotationItemData, idx: number) => (
                                        <div
                                            key={idx}
                                            className={`grid grid-cols-2 gap-4 px-6 py-4 ${idx !== order.items.length - 1 ? 'border-b border-zinc-800/50' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Checkmark for each item */}
                                                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-sm font-medium text-zinc-300">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-emerald-400 text-right tabular-nums">
                                                {item.requested}kg
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center">
                                        <p className="text-sm text-zinc-500">Nenhum item recebido</p>
                                    </div>
                                )}
                            </div>
                        </div>

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
