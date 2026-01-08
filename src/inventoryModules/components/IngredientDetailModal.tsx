// ═══════════════════════════════════════════════════════════════════
// INGREDIENT DETAIL MODAL — Exact Copy from Website
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import type { InventoryItem } from '../types'
import { useStockMovements } from '../../stores'

type DetailTab = 'item' | 'precos' | 'movimentacoes'
type MovementPeriod = 'all' | 'today' | '7d' | '30d'

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
    const [activeTab, setActiveTab] = useState<DetailTab>('item')
    const [movementPeriod, setMovementPeriod] = useState<MovementPeriod>('all')
    const allMovements = useStockMovements()

    // Early return BEFORE createPortal - matching pattern from working modals
    if (!ingredient) return null

    // Filter movements for this specific ingredient
    const ingredientMovements = allMovements.filter(m => m.itemId === ingredient.id || m.itemName === ingredient.name)

    // Apply period filter
    const movements = ingredientMovements.filter(m => {
        if (movementPeriod === 'all') return true
        const date = new Date(m.timestamp)
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        if (movementPeriod === 'today') return date >= startOfToday
        if (movementPeriod === '7d') {
            const sevenDaysAgo = new Date(startOfToday)
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            return date >= sevenDaysAgo
        }
        if (movementPeriod === '30d') {
            const thirtyDaysAgo = new Date(startOfToday)
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            return date >= thirtyDaysAgo
        }
        return true
    })

    const periodOptions: { key: MovementPeriod; label: string }[] = [
        { key: 'all', label: 'Todos' },
        { key: 'today', label: 'Hoje' },
        { key: '7d', label: '7 dias' },
        { key: '30d', label: '30 dias' }
    ]

    const currentStock = getTotalQuantity(ingredient)
    const totalValue = getItemTotal(ingredient)
    const supplierText = ingredient.supplierName || 'Sem fornecedor'
    const categoryText = ingredient.category || 'Ingredientes'
    const minStock = ingredient.minStock || 0
    const maxStock = ingredient.maxStock || 0

    const tabs: { key: DetailTab; label: string }[] = [
        { key: 'item', label: 'Item' },
        { key: 'precos', label: 'Preços' },
        { key: 'movimentacoes', label: 'Movimentações' }
    ]

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

                {/* Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="relative w-full max-w-[400px] bg-white dark:bg-zinc-900 rounded-[28px] shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative px-6 pt-6 pb-4">
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 pr-10">{ingredient.name}</h2>
                        <p className="text-sm text-zinc-400 mt-1">{categoryText} • {supplierText}</p>

                        {/* Pill Tabs */}
                        <div className="flex gap-1 mt-4 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${activeTab === tab.key
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'item' && (
                                <motion.div
                                    key="item"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-4"
                                >
                                    {/* Current Stock & Unit Price Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-5 py-4">
                                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-2">ESTOQUE</span>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{currentStock.toFixed(0)}</span>
                                                <span className="text-base text-zinc-400 font-medium">{ingredient.unit}</span>
                                            </div>
                                        </div>
                                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-5 py-4">
                                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-2">PREÇO UNIT</span>
                                            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                                {formatCurrency(ingredient.pricePerUnit)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Total Value */}
                                    <div className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl px-5 py-5">
                                        <span className="text-[10px] font-semibold text-violet-500 uppercase tracking-widest block mb-2">VALOR TOTAL</span>
                                        <span className="text-4xl font-bold text-emerald-500 dark:text-emerald-400 tabular-nums">
                                            {formatCurrency(totalValue)}
                                        </span>
                                    </div>

                                    {/* Stock Limits */}
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-5 py-4">
                                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-3">LIMITES DE ESTOQUE</span>
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
                                </motion.div>
                            )}

                            {activeTab === 'precos' && (() => {
                                // Extract price history from entrada movements
                                const priceHistory = ingredientMovements
                                    .filter(m => {
                                        const rawType = (m.type || '').toLowerCase()
                                        return rawType === 'entrada' || rawType === 'in' || rawType.includes('entrada')
                                    })
                                    .filter(m => m.costAtTime && m.quantity)
                                    .map(m => {
                                        // Extract supplier from reason (e.g., "Compra Fornecedor Moinho" -> "Moinho")
                                        const reasonText = m.reason || ''
                                        let supplier = ''
                                        if (reasonText.toLowerCase().includes('fornecedor')) {
                                            supplier = reasonText.split('Fornecedor').pop()?.trim() || ''
                                        } else if (reasonText.toLowerCase().includes('compra')) {
                                            supplier = reasonText.replace(/compra/i, '').trim()
                                        } else {
                                            supplier = reasonText
                                        }

                                        // Extract invoice number from notes (simulating <nNF> from XML)
                                        // Remove leading zeros: "000012345" -> "12345"
                                        const notesText = m.notes || ''
                                        const invoiceMatch = notesText.match(/nNF[:\s]*([0-9]+)/i) || notesText.match(/^([0-9]+)$/)
                                        const invoiceNumber = invoiceMatch
                                            ? invoiceMatch[1].replace(/^0+/, '') || '0'
                                            : null

                                        return {
                                            id: m.id,
                                            date: new Date(m.timestamp),
                                            unitPrice: (m.costAtTime || 0) / (m.quantity || 1),
                                            totalCost: m.costAtTime || 0,
                                            quantity: m.quantity,
                                            unit: m.unit || ingredient.unit,
                                            reason: m.reason,
                                            supplier: supplier || 'Fornecedor',
                                            invoiceNumber
                                        }
                                    })
                                    .sort((a, b) => b.date.getTime() - a.date.getTime())

                                // Calculate price variation
                                const currentPrice = ingredient.pricePerUnit
                                const lastHistoryPrice = priceHistory[0]?.unitPrice
                                const previousPrice = priceHistory[1]?.unitPrice || lastHistoryPrice
                                const priceChange = previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0
                                const avgPrice = priceHistory.length > 0
                                    ? priceHistory.reduce((sum, p) => sum + p.unitPrice, 0) / priceHistory.length
                                    : currentPrice

                                return (
                                    <motion.div
                                        key="precos"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.15 }}
                                        className="space-y-4"
                                    >
                                        {/* Current Price Card */}
                                        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/10 rounded-2xl px-5 py-5">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="text-[10px] font-semibold text-violet-500 uppercase tracking-widest block mb-2">PREÇO ATUAL</span>
                                                    <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                                        {formatCurrency(currentPrice)}
                                                    </span>
                                                    <span className="text-sm text-zinc-400 font-medium ml-1">/{ingredient.unit}</span>
                                                </div>
                                                {priceChange !== 0 && (
                                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${priceChange > 0
                                                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                        }`}>
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            {priceChange > 0 ? (
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                                            ) : (
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                            )}
                                                        </svg>
                                                        {Math.abs(priceChange).toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price Stats */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">CUSTO MÉDIO</span>
                                                    <span className="text-[8px] text-zinc-400 dark:text-zinc-500">({priceHistory.length} compras)</span>
                                                </div>
                                                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                                    {formatCurrency(avgPrice)}
                                                </span>
                                            </div>
                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
                                                <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1">COMPRAS</span>
                                                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                                    {priceHistory.length}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price History Timeline */}
                                        {priceHistory.length === 0 ? (
                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-5 py-6 text-center">
                                                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                                                    </svg>
                                                </div>
                                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sem histórico de compras</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-3">HISTÓRICO DE COMPRAS</span>
                                                <div className="max-h-[160px] overflow-y-auto -mx-1 px-1">
                                                    <div className="relative">
                                                        {/* Timeline line */}
                                                        <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-violet-200 via-violet-200 to-transparent dark:from-violet-700/50 dark:via-violet-700/50" />

                                                        <div className="space-y-0.5">
                                                            {priceHistory.slice(0, 10).map((entry, idx) => {
                                                                const prevEntry = priceHistory[idx + 1]
                                                                const priceDiff = prevEntry ? ((entry.unitPrice - prevEntry.unitPrice) / prevEntry.unitPrice) * 100 : 0

                                                                return (
                                                                    <motion.div
                                                                        key={entry.id}
                                                                        initial={{ opacity: 0, x: -8 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: idx * 0.04, duration: 0.2 }}
                                                                        className="relative flex items-center gap-3 py-2 group"
                                                                    >
                                                                        {/* Timeline dot */}
                                                                        <div className="relative z-10 w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-500/15 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                                                                            <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                                                                        </div>

                                                                        {/* Content */}
                                                                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <div>
                                                                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                                                                        {formatCurrency(entry.unitPrice)}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-zinc-400 ml-1">/{entry.unit}</span>
                                                                                    {priceDiff !== 0 && (
                                                                                        <span className={`ml-2 text-[10px] font-medium ${priceDiff > 0 ? 'text-rose-500' : 'text-emerald-500'
                                                                                            }`}>
                                                                                            {priceDiff > 0 ? '↑' : '↓'}{Math.abs(priceDiff).toFixed(0)}%
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {/* Invoice Pill - Apple Style */}
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        if (entry.invoiceNumber) {
                                                                                            alert(`📄 Nota Fiscal #${entry.invoiceNumber}\n\nVisualização completa em desenvolvimento.`)
                                                                                        } else {
                                                                                            alert('📄 Nota fiscal não vinculada\n\nEsta compra não possui NF-e associada.')
                                                                                        }
                                                                                    }}
                                                                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all duration-200 text-[9px] font-medium ${entry.invoiceNumber
                                                                                        ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/25'
                                                                                        : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                                                        }`}
                                                                                >
                                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                    </svg>
                                                                                    {entry.invoiceNumber ? `#${entry.invoiceNumber}` : '—'}
                                                                                </button>
                                                                            </div>
                                                                            <div className="text-right shrink-0">
                                                                                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">
                                                                                    {entry.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                                                </span>
                                                                                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[80px]">
                                                                                    {entry.supplier}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>

                                                    {priceHistory.length > 10 && (
                                                        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 py-2 mt-1">
                                                            +{priceHistory.length - 10} compras anteriores
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                        }
                                    </motion.div>
                                )
                            })()}

                            {activeTab === 'movimentacoes' && (
                                <motion.div
                                    key="movimentacoes"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {/* Period Filter */}
                                    <div className="flex gap-1 mb-4 p-0.5 bg-zinc-100/60 dark:bg-zinc-800/60 rounded-xl">
                                        {periodOptions.map((option) => (
                                            <button
                                                key={option.key}
                                                onClick={() => setMovementPeriod(option.key)}
                                                className={`flex-1 px-2 py-1.5 text-[10px] font-semibold rounded-lg transition-all duration-150 ${movementPeriod === option.key
                                                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Movement Ledger - Apple Style */}
                                    {movements.length === 0 ? (
                                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-5 py-8 text-center">
                                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Sem movimentações</p>
                                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                                {movementPeriod === 'all' ? 'Nenhum registro encontrado' : `Nenhum registro ${movementPeriod === 'today' ? 'hoje' : `nos últimos ${movementPeriod}`}`}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="max-h-[280px] overflow-y-auto -mx-1 px-1">
                                            <div className="relative">
                                                {/* Timeline connector line */}
                                                <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-zinc-200 via-zinc-200 to-transparent dark:from-zinc-700 dark:via-zinc-700" />

                                                {/* Movement entries */}
                                                <div className="space-y-1">
                                                    {movements.slice(0, 20).map((m, idx) => {
                                                        const rawType = (m.type || '').toLowerCase()
                                                        const isEntrada = rawType === 'entrada' || rawType === 'in' || rawType.includes('entrada')

                                                        return (
                                                            <motion.div
                                                                key={m.id}
                                                                initial={{ opacity: 0, x: -8 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: idx * 0.03, duration: 0.2 }}
                                                                className="relative flex items-start gap-3 py-2.5 group"
                                                            >
                                                                {/* Timeline dot */}
                                                                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isEntrada
                                                                    ? 'bg-emerald-50 dark:bg-emerald-500/15'
                                                                    : 'bg-rose-50 dark:bg-rose-500/15'
                                                                    }`}>
                                                                    <svg
                                                                        className={`w-4 h-4 ${isEntrada ? 'text-emerald-500' : 'text-rose-500'}`}
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                        strokeWidth={2.5}
                                                                    >
                                                                        {isEntrada ? (
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4" />
                                                                        ) : (
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m0 0l4 4m-4-4L8 8" />
                                                                        )}
                                                                    </svg>
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 min-w-0 pt-1">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`text-sm font-semibold tabular-nums ${isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                                                }`}>
                                                                                {isEntrada ? '+' : '−'}{m.quantity} {m.unit || ingredient.unit}
                                                                            </span>
                                                                            {/* NF Pill - Apple Style */}
                                                                            {(() => {
                                                                                const notesText = m.notes || ''
                                                                                const invoiceMatch = notesText.match(/nNF[:\s]*([0-9]+)/i) || notesText.match(/^([0-9]+)$/)
                                                                                const invoiceNumber = invoiceMatch ? invoiceMatch[1].replace(/^0+/, '') || '0' : null
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
                                                                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-all duration-200 text-[8px] font-medium ${invoiceNumber
                                                                                            ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/25'
                                                                                            : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                                                            }`}
                                                                                    >
                                                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                        </svg>
                                                                                        {invoiceNumber ? `#${invoiceNumber}` : '—'}
                                                                                    </button>
                                                                                )
                                                                            })()}
                                                                        </div>
                                                                        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">
                                                                            {new Date(m.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                                        </span>
                                                                    </div>
                                                                    {m.reason && (
                                                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                                                            {m.reason}
                                                                        </p>
                                                                    )}
                                                                    {m.newStock !== undefined && (
                                                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                                                            Estoque: {m.newStock} {m.unit || ingredient.unit}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {movements.length > 20 && (
                                                <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 py-2 mt-2">
                                                    +{movements.length - 20} movimentações anteriores
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="w-full h-12 mt-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[15px] font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-lg transition-all active:scale-[0.98]"
                        >
                            Fechar
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence >,
        document.body
    )
}

export default IngredientDetailModal

