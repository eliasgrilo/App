/**
 * PredictiveInsights Component - Stock Prediction & Analytics
 * Predicts stockouts using historical movement trends
 * Apple 2025 Liquid Glass Design
 */

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HapticService } from '../services/hapticService'

// Format currency
const formatCurrency = (val) => {
    const n = Number(val) || 0
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Urgency levels
const URGENCY = {
    CRITICAL: { label: 'Crítico', color: 'rose', days: 3, icon: '🚨' },
    WARNING: { label: 'Atenção', color: 'amber', days: 7, icon: '⚠️' },
    NORMAL: { label: 'Normal', color: 'emerald', days: 14, icon: '✓' },
    EXCESS: { label: 'Excesso', color: 'violet', days: 999, icon: '📦' }
}

// Calculate consumption rate from movements
function calculateConsumptionRate(movements = [], days = 30) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)

    const recentExits = movements.filter(m => {
        const moveDate = new Date(m.date || m.createdAt).getTime()
        return m.type === 'exit' && moveDate >= cutoff
    })

    const totalExited = recentExits.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)
    const dailyRate = totalExited / days

    return {
        dailyRate,
        weeklyRate: dailyRate * 7,
        monthlyRate: dailyRate * 30,
        totalExits: recentExits.length
    }
}

// Predict stockout date
function predictStockout(currentStock, dailyRate) {
    if (dailyRate <= 0) return { daysUntil: Infinity, date: null }

    const daysUntil = Math.floor(currentStock / dailyRate)
    const date = new Date()
    date.setDate(date.getDate() + daysUntil)

    return { daysUntil, date }
}

// Get urgency level
function getUrgency(daysUntil, minStock = 0, currentStock = 0) {
    if (currentStock > minStock * 3) return URGENCY.EXCESS
    if (daysUntil <= URGENCY.CRITICAL.days) return URGENCY.CRITICAL
    if (daysUntil <= URGENCY.WARNING.days) return URGENCY.WARNING
    return URGENCY.NORMAL
}

// Prediction Card Component
function PredictionCard({ prediction, onRestock, onDismiss }) {
    const urgency = prediction.urgency
    const isExpanded = useState(false)[0]

    const urgencyColors = {
        rose: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        violet: 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400'
    }

    const glowColors = {
        rose: 'shadow-rose-500/20',
        amber: 'shadow-amber-500/20',
        emerald: 'shadow-emerald-500/20',
        violet: 'shadow-violet-500/20'
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[1.5rem] p-5 border border-zinc-200/50 dark:border-white/5 shadow-lg ${prediction.urgency.color === 'rose' ? glowColors.rose : ''}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${urgencyColors[urgency.color]} flex items-center justify-center text-lg`}>
                        {urgency.icon}
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-zinc-900 dark:text-white truncate max-w-[180px]">
                            {prediction.productName}
                        </h4>
                        <p className="text-[10px] font-medium text-zinc-400">{prediction.category}</p>
                    </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full border ${urgencyColors[urgency.color]} text-[10px] font-bold uppercase tracking-wider`}>
                    {urgency.label}
                </div>
            </div>

            {/* Prediction Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Estoque</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{prediction.currentStock}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Consumo/dia</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{prediction.dailyRate.toFixed(1)}</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${urgencyColors[urgency.color]}`}>
                    <p className="text-[8px] font-bold uppercase tracking-widest mb-1">Dias p/ Fim</p>
                    <p className="text-xl font-bold tabular-nums">
                        {prediction.daysUntil === Infinity ? '∞' : prediction.daysUntil}
                    </p>
                </div>
            </div>

            {/* Trend Sparkline */}
            {prediction.trendData && prediction.trendData.length > 1 && (
                <div className="mb-4">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Tendência 30d</p>
                    <div className="h-12 flex items-end gap-0.5">
                        {prediction.trendData.map((val, i) => {
                            const max = Math.max(...prediction.trendData)
                            const height = max > 0 ? (val / max) * 100 : 0
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-t transition-all ${i === prediction.trendData.length - 1
                                            ? `bg-${urgency.color}-500`
                                            : 'bg-zinc-200 dark:bg-zinc-700'
                                        }`}
                                    style={{ height: `${Math.max(4, height)}%` }}
                                />
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Recommendation */}
            <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Recomendação</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {prediction.daysUntil === Infinity
                        ? 'Estoque estável. Sem consumo recente detectado.'
                        : prediction.daysUntil <= 3
                            ? `⚡ Ação urgente! Estoque acaba em ${prediction.daysUntil} dias. Recomendado: +${prediction.suggestedRestock} unidades.`
                            : prediction.daysUntil <= 7
                                ? `📋 Agende reposição. Estoque para ${prediction.daysUntil} dias. Sugestão: +${prediction.suggestedRestock} unidades.`
                                : `✓ Estoque confortável para ${prediction.daysUntil} dias.`
                    }
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        HapticService.trigger('success')
                        onRestock?.(prediction)
                    }}
                    className="flex-1 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-[11px] font-bold uppercase tracking-widest"
                >
                    Criar Pedido
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        HapticService.trigger('selection')
                        onDismiss?.(prediction.productId)
                    }}
                    className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl text-[11px] font-bold uppercase tracking-widest"
                >
                    Ignorar
                </motion.button>
            </div>
        </motion.div>
    )
}

// Summary Stats Card
function SummaryCard({ stats }) {
    return (
        <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Insights Preditivos</h3>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">Análise de Estoque</p>
                </div>
                <div className="px-4 py-1.5 bg-violet-100 dark:bg-violet-500/20 rounded-full">
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase">
                        {stats.totalAnalyzed} produtos
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200/50 dark:border-rose-500/20">
                    <p className="text-[8px] font-bold text-rose-600 dark:text-rose-400 uppercase mb-1">Críticos</p>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">{stats.critical}</p>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200/50 dark:border-amber-500/20">
                    <p className="text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">Atenção</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{stats.warning}</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200/50 dark:border-emerald-500/20">
                    <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Normal</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.normal}</p>
                </div>
                <div className="text-center p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-200/50 dark:border-violet-500/20">
                    <p className="text-[8px] font-bold text-violet-600 dark:text-violet-400 uppercase mb-1">Excesso</p>
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">{stats.excess}</p>
                </div>
            </div>

            {stats.totalRestockValue > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">Investimento Sugerido</span>
                    <span className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
                        {formatCurrency(stats.totalRestockValue)}
                    </span>
                </div>
            )}
        </div>
    )
}

// Main Component
export default function PredictiveInsights({ products = [], movements = [], onCreateOrder, onDismiss }) {
    const [filter, setFilter] = useState('all')
    const [dismissedIds, setDismissedIds] = useState(new Set())

    // Generate predictions for all products
    const predictions = useMemo(() => {
        return products
            .filter(p => !dismissedIds.has(p.id))
            .map(product => {
                // Get movements for this product
                const productMovements = movements.filter(m => m.productId === product.id)

                // Calculate consumption
                const consumption = calculateConsumptionRate(productMovements, 30)

                // Predict stockout
                const stockout = predictStockout(product.currentStock || 0, consumption.dailyRate)

                // Get urgency
                const urgency = getUrgency(stockout.daysUntil, product.minStock, product.currentStock)

                // Calculate suggested restock (2 weeks supply)
                const suggestedRestock = Math.ceil(consumption.dailyRate * 14)

                // Get trend data (daily exits for last 30 days)
                const trendData = Array(30).fill(0)
                productMovements
                    .filter(m => m.type === 'exit')
                    .forEach(m => {
                        const daysAgo = Math.floor((Date.now() - new Date(m.date || m.createdAt).getTime()) / (24 * 60 * 60 * 1000))
                        if (daysAgo >= 0 && daysAgo < 30) {
                            trendData[29 - daysAgo] += Number(m.quantity) || 0
                        }
                    })

                return {
                    productId: product.id,
                    productName: product.name,
                    category: product.category,
                    currentStock: product.currentStock || 0,
                    minStock: product.minStock || 0,
                    currentPrice: product.currentPrice || 0,
                    dailyRate: consumption.dailyRate,
                    weeklyRate: consumption.weeklyRate,
                    monthlyRate: consumption.monthlyRate,
                    daysUntil: stockout.daysUntil,
                    stockoutDate: stockout.date,
                    urgency,
                    suggestedRestock,
                    restockValue: suggestedRestock * (product.currentPrice || 0),
                    trendData,
                    confidence: consumption.totalExits > 5 ? 'Alta' : consumption.totalExits > 2 ? 'Média' : 'Baixa'
                }
            })
            .sort((a, b) => a.daysUntil - b.daysUntil)
    }, [products, movements, dismissedIds])

    // Filter predictions
    const filteredPredictions = useMemo(() => {
        if (filter === 'all') return predictions.filter(p => p.urgency !== URGENCY.EXCESS)
        if (filter === 'critical') return predictions.filter(p => p.urgency === URGENCY.CRITICAL)
        if (filter === 'warning') return predictions.filter(p => p.urgency === URGENCY.WARNING)
        if (filter === 'excess') return predictions.filter(p => p.urgency === URGENCY.EXCESS)
        return predictions
    }, [predictions, filter])

    // Summary stats
    const stats = useMemo(() => ({
        totalAnalyzed: products.length,
        critical: predictions.filter(p => p.urgency === URGENCY.CRITICAL).length,
        warning: predictions.filter(p => p.urgency === URGENCY.WARNING).length,
        normal: predictions.filter(p => p.urgency === URGENCY.NORMAL).length,
        excess: predictions.filter(p => p.urgency === URGENCY.EXCESS).length,
        totalRestockValue: predictions
            .filter(p => p.urgency === URGENCY.CRITICAL || p.urgency === URGENCY.WARNING)
            .reduce((sum, p) => sum + p.restockValue, 0)
    }), [predictions, products.length])

    const handleDismiss = (productId) => {
        setDismissedIds(prev => new Set([...prev, productId]))
        onDismiss?.(productId)
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <SummaryCard stats={stats} />

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {[
                    { id: 'all', label: 'Prioridade' },
                    { id: 'critical', label: 'Críticos', count: stats.critical },
                    { id: 'warning', label: 'Atenção', count: stats.warning },
                    { id: 'excess', label: 'Excesso', count: stats.excess }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            HapticService.trigger('selection')
                            setFilter(tab.id)
                        }}
                        className={`flex-shrink-0 px-5 py-3 min-h-[48px] rounded-full text-sm font-bold tracking-wide transition-all flex items-center gap-2 ${filter === tab.id
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg'
                                : 'bg-white/80 dark:bg-zinc-800/50 backdrop-blur-xl text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/5'
                            }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${filter === tab.id ? 'bg-white/20' : 'bg-zinc-200 dark:bg-zinc-700'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Prediction Cards */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredPredictions.map(prediction => (
                        <PredictionCard
                            key={prediction.productId}
                            prediction={prediction}
                            onRestock={onCreateOrder}
                            onDismiss={handleDismiss}
                        />
                    ))}
                </AnimatePresence>

                {filteredPredictions.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-3xl rounded-[2rem] border border-zinc-200/50 dark:border-white/5"
                    >
                        <span className="text-4xl mb-4 block">✨</span>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                            {filter === 'critical' ? 'Nenhum item crítico' :
                                filter === 'warning' ? 'Nenhum item em atenção' :
                                    'Estoque em dia!'}
                        </h3>
                        <p className="text-sm text-zinc-500">
                            Todos os produtos estão com níveis adequados
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

// Hook for external use
export function usePredictiveInsights(products, movements) {
    return useMemo(() => {
        const predictions = products.map(product => {
            const productMovements = movements.filter(m => m.productId === product.id)
            const consumption = calculateConsumptionRate(productMovements, 30)
            const stockout = predictStockout(product.currentStock || 0, consumption.dailyRate)
            const urgency = getUrgency(stockout.daysUntil, product.minStock, product.currentStock)

            return {
                productId: product.id,
                daysUntil: stockout.daysUntil,
                urgency,
                dailyRate: consumption.dailyRate
            }
        })

        return {
            predictions,
            criticalCount: predictions.filter(p => p.urgency === URGENCY.CRITICAL).length,
            warningCount: predictions.filter(p => p.urgency === URGENCY.WARNING).length
        }
    }, [products, movements])
}
