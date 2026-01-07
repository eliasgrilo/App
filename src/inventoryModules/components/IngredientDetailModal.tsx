// ═══════════════════════════════════════════════════════════════════
// INGREDIENT DETAIL MODAL — Exact Copy from Website
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import type { InventoryItem } from '../types'

interface IngredientDetailModalProps {
    ingredient: InventoryItem | null
    onClose: () => void
    formatCurrency: (value: number) => string
    getTotalQuantity: (item: InventoryItem) => number
    getItemTotal: (item: InventoryItem) => number
}

export function IngredientDetailModal({
    ingredient,
    onClose,
    formatCurrency,
    getTotalQuantity,
    getItemTotal
}: IngredientDetailModalProps): React.ReactElement | null {
    if (!ingredient) return null

    const currentStock = getTotalQuantity(ingredient)
    const totalValue = getItemTotal(ingredient)
    const supplierText = ingredient.supplierName || 'Sem fornecedor'
    const categoryText = ingredient.category || 'Ingredientes'
    const minStock = ingredient.minStock || 0
    const maxStock = ingredient.maxStock || 0

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[20000] flex items-center justify-center p-4"
            >
                <ModalScrollLock />

                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Card - Exact match */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="relative w-full max-w-[400px] bg-white dark:bg-zinc-900 rounded-[28px] shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative px-6 pt-6 pb-4">
                        {/* Close X Button - Apple style with circle background */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 pr-10">{ingredient.name}</h2>
                        <p className="text-sm text-zinc-400 mt-1">{categoryText} • {supplierText}</p>
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-6 space-y-4">
                        {/* Current Stock & Unit Price Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Current Stock - Gray background card */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-5 py-4">
                                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-2">CURRENT STOCK</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{currentStock.toFixed(0)}</span>
                                    <span className="text-base text-zinc-400 font-medium">{ingredient.unit}</span>
                                </div>
                            </div>

                            {/* Unit Price - Gray background card */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-5 py-4">
                                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-2">UNIT PRICE</span>
                                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                    {formatCurrency(ingredient.pricePerUnit)}
                                </span>
                            </div>
                        </div>

                        {/* Total Value - Violet background with GREEN value (Apple reference) */}
                        <div className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl px-5 py-5">
                            <span className="text-[10px] font-semibold text-violet-500 uppercase tracking-widest block mb-2">TOTAL VALUE</span>
                            <span className="text-4xl font-bold text-emerald-500 dark:text-emerald-400 tabular-nums">
                                {formatCurrency(totalValue)}
                            </span>
                        </div>

                        {/* Stock Limits - Gray background with Min/Max */}
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-5 py-4">
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-3">STOCK LIMITS</span>
                            <div className="flex items-center gap-8">
                                <div>
                                    <span className="text-xs font-semibold text-orange-500 block mb-1">Min</span>
                                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{minStock}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-emerald-500 block mb-1">Max</span>
                                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{maxStock}</span>
                                </div>
                            </div>
                        </div>

                        {/* Close Button - Black rounded Apple style */}
                        <button
                            onClick={onClose}
                            className="w-full py-4 mt-2 rounded-2xl text-sm font-bold uppercase tracking-wider text-white bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg"
                        >
                            CLOSE
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

export default IngredientDetailModal
