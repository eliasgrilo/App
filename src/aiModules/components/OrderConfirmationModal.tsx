// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Order Confirmation Modal Component
// ═══════════════════════════════════════════════════════════════════

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import type { Quotation, QuotationItemData } from '../types'

interface OrderConfirmationModalProps {
    open: boolean
    order: Quotation | null
    onClose: () => void
    onConfirmReceipt: (order: Quotation) => void
}

export function OrderConfirmationModal({ open, order, onClose, onConfirmReceipt }: OrderConfirmationModalProps) {
    if (!order) return null

    // Format the order date
    const formatOrderDate = () => {
        const now = new Date()
        return `Ordem criada em ${now.toLocaleDateString('pt-BR', { month: 'short', day: '2-digit', year: 'numeric' }).replace('.', '')}`
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
                                {/* Document Icon */}
                                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>

                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-white">{order.supplier}</h3>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Confirmada
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-0.5">{formatOrderDate()}</p>
                                </div>
                            </div>

                            {/* Confirm Receipt Button */}
                            <button
                                onClick={() => onConfirmReceipt(order)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Confirmar Recebimento
                            </button>
                        </div>

                        {/* Items Table */}
                        <div className="bg-zinc-950">
                            {/* Table Header */}
                            <div className="grid grid-cols-3 gap-4 px-6 py-3 border-b border-zinc-800 bg-zinc-900/50">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Item</span>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider text-center">Quantidade Solicitada</span>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider text-right">Unidade</span>
                            </div>

                            {/* Table Rows */}
                            <div className="max-h-[300px] overflow-y-auto">
                                {order.items.length > 0 ? (
                                    order.items.map((item: QuotationItemData, idx: number) => (
                                        <div
                                            key={idx}
                                            className={`grid grid-cols-3 gap-4 px-6 py-4 ${idx !== order.items.length - 1 ? 'border-b border-zinc-800/50' : ''
                                                }`}
                                        >
                                            <span className="text-sm font-medium text-zinc-300">{item.name}</span>
                                            <span className="text-sm font-semibold text-white text-center tabular-nums">
                                                {item.requested}kg
                                            </span>
                                            <span className="text-sm text-zinc-400 text-right">kg</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center">
                                        <p className="text-sm text-zinc-500">Nenhum item na ordem</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Close button (optional - can click backdrop) */}
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
