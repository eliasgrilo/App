/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEMAND FORECAST CHART — Premium Apple HIG Design
 * 
 * Premium forecast visualization featuring:
 * - Accuracy score dashboard with trend indicators
 * - Forecast vs Actual area chart comparison
 * - Product accuracy ranking
 * - Prediction confidence bands
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, TrendingUp, TrendingDown, Minus, CheckCircle, ChevronDown, AlertCircle } from 'lucide-react'
import type { DemandForecast, ForecastItem } from '../types'
import { formatPercent } from '../mockReportsData'
import { GlassCard, AnimatedPercent, AnimatedNumber, Sparkline, HeroMetricCard, GlowHoverCard, BlurTransition, GradientBorder, MagneticHover, ElasticScale, Depth3DCard, ConfettiCelebration } from './PremiumComponents'

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
    forecast: '#007AFF',
    actual: '#34C759',
    high: '#34C759',
    medium: '#FF9500',
    low: '#FF3B30'
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCURACY CARD
// ═══════════════════════════════════════════════════════════════════════════════

const AccuracyCard: React.FC<{ item: ForecastItem; rank: number }> = ({ item, rank }) => {
    const TrendIcon = item.trend === 'up' ? TrendingUp : item.trend === 'down' ? TrendingDown : Minus
    const trendColor = item.trend === 'up' ? 'text-emerald-500' : item.trend === 'down' ? 'text-red-500' : 'text-zinc-400'
    const accuracyColor = item.accuracyLevel === 'high' ? 'text-emerald-600' : item.accuracyLevel === 'medium' ? 'text-amber-600' : 'text-red-600'
    const bgColor = item.accuracyLevel === 'high' ? 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30'
        : item.accuracyLevel === 'medium' ? 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30'
            : 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30'

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: rank * 0.05 }}
            className={`p-4 rounded-xl bg-gradient-to-br ${bgColor} border border-zinc-200/60 dark:border-zinc-700/30`}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate mr-2">{item.name}</p>
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p className={`text-2xl font-black ${accuracyColor}`}>{formatPercent(item.accuracy)}</p>
                    <p className="text-[10px] text-zinc-500">precisão</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{item.forecastedDemand}</p>
                    <p className="text-[10px] text-zinc-500">previsto</p>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface ForecastTooltipPayloadItem {
    value: number
    dataKey: string
    payload: Record<string, unknown>
}

interface ChartTooltipProps {
    active?: boolean
    payload?: ForecastTooltipPayloadItem[]
    label?: string
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null

    const forecast = payload[0]?.value
    const actual = payload[1]?.value
    const variance = actual && forecast ? ((actual - forecast) / forecast * 100) : 0

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="
                bg-white/95 dark:bg-zinc-900/95
                backdrop-blur-xl
                border border-zinc-200/60 dark:border-white/[0.08]
                rounded-2xl p-4 shadow-xl
                min-w-[200px]
            "
        >
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">{label}</p>
            <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1.5 text-zinc-500">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Previsão
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{forecast?.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1.5 text-zinc-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        Realizado
                    </span>
                    <span className="font-semibold text-emerald-600">{actual?.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                    <span className="text-zinc-500">Variação</span>
                    <span className={`font-bold ${Math.abs(variance) <= 5 ? 'text-emerald-600' : Math.abs(variance) <= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                        {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                    </span>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const DemandForecastChart: React.FC<{ data: DemandForecast; showTitle?: boolean }> = ({ data, showTitle = true }) => {
    const [showProducts, setShowProducts] = useState(true)

    const accuracyLevel = data.summary.overallAccuracy >= 90 ? 'Excelente' : data.summary.overallAccuracy >= 80 ? 'Bom' : data.summary.overallAccuracy >= 70 ? 'Regular' : 'Baixa'
    const accuracyColor = data.summary.overallAccuracy >= 90 ? 'text-emerald-600' : data.summary.overallAccuracy >= 80 ? 'text-blue-600' : data.summary.overallAccuracy >= 70 ? 'text-amber-600' : 'text-red-600'

    const topPerformers = useMemo(() =>
        [...data.items].sort((a, b) => b.accuracy - a.accuracy).slice(0, 4),
        [data.items]
    )
    const needsAttention = useMemo(() =>
        data.items.filter(i => i.accuracyLevel === 'low').slice(0, 4),
        [data.items]
    )

    return (
        <div className="print:break-inside-avoid">
            {showTitle && (
                <div className="flex items-center gap-3 mb-6 print:mb-4">
                    <div className="
                        w-10 h-10 rounded-2xl
                        bg-gradient-to-br from-blue-500 to-indigo-600
                        flex items-center justify-center
                        shadow-lg shadow-blue-500/20
                        print:bg-gray-200 print:shadow-none
                    ">
                        <Target className="w-5 h-5 text-white print:text-black" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight print:text-black">
                            Previsão de Demanda
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-gray-600">
                            Forecast vs Real — Precisão do modelo
                        </p>
                    </div>
                </div>
            )}

            {/* Hero Dashboard - STATE OF THE ART */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <HeroMetricCard
                    label="Precisão Geral"
                    value={data.summary.overallAccuracy}
                    format="percent"
                    color="blue"
                    icon={<CheckCircle className="w-4 h-4" />}
                    sparklineData={data.items.slice(0, 8).map(i => i.accuracy)}
                    subtitle={accuracyLevel}
                    celebrated={data.summary.overallAccuracy > 90}
                />

                <HeroMetricCard
                    label="Em Alta"
                    value={data.summary.upTrendCount}
                    format="number"
                    color="emerald"
                    icon={<TrendingUp className="w-4 h-4" />}
                    subtitle="produtos"
                />

                <HeroMetricCard
                    label="Em Queda"
                    value={data.summary.downTrendCount}
                    format="number"
                    color="red"
                    icon={<TrendingDown className="w-4 h-4" />}
                    subtitle="produtos"
                />

                <GlowHoverCard glowColor="#8E8E93" className="p-5">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Nível de Precisão</p>
                    <div className="flex items-center gap-2">
                        {['high', 'medium', 'low'].map((level, i) => {
                            const count = data.items.filter(item => item.accuracyLevel === level).length
                            const colors = { high: 'bg-emerald-500', medium: 'bg-blue-500', low: 'bg-red-500' }
                            const labels = { high: 'Alto', medium: 'Médio', low: 'Baixo' }
                            return (
                                <motion.div
                                    key={level}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1 + i * 0.05, type: 'spring' }}
                                    className="text-center flex-1"
                                >
                                    <div className={`h-8 ${colors[level as keyof typeof colors]} rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                                        {count}
                                    </div>
                                    <p className="text-[9px] text-zinc-500 uppercase mt-1">{labels[level as keyof typeof labels]}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </GlowHoverCard>
            </div>

            {/* Weekly Trend Chart */}
            <div className="h-[280px] mb-6 print:hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.weeklyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34C759" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-zinc-500" />
                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-zinc-500" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Legend verticalAlign="top" height={36} formatter={(value) => (
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                {value === 'forecast' ? '⋯ Previsão' : '━ Realizado'}
                            </span>
                        )} />
                        <Area type="monotone" dataKey="forecast" stroke="#007AFF" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" />
                        <Area type="monotone" dataKey="actual" stroke="#34C759" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActual)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Product Accuracy */}
            <button
                onClick={() => setShowProducts(!showProducts)}
                className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors print:hidden"
            >
                <motion.div animate={{ rotate: showProducts ? 180 : 0 }}>
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
                {showProducts ? 'Ocultar Produtos' : 'Mostrar Precisão por Produto'}
            </button>

            <AnimatePresence>
                {showProducts && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="grid grid-cols-2 gap-4 print:hidden"
                    >
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                Top Precisão
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {topPerformers.map((item, idx) => (
                                    <AccuracyCard key={item.id} item={item} rank={idx} />
                                ))}
                            </div>
                        </div>
                        {needsAttention.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    Precisam Revisão
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {needsAttention.map((item, idx) => (
                                        <AccuracyCard key={item.id} item={item} rank={idx} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default DemandForecastChart
