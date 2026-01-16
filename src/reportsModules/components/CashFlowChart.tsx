/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CASH FLOW CHART — Premium Apple HIG Design
 * 
 * Premium financial visualization featuring:
 * - Animated balance trajectory with projection
 * - Inflow/Outflow waterfall comparison
 * - Category breakdown with progress rings
 * - Financial health score dashboard
 * - Smart alerts and recommendations
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo } from 'react'
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Calendar, PiggyBank, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type { CashFlowAnalysis } from '../types'
import { formatCurrency, formatPercent } from '../mockReportsData'
import { GlassCard, AnimatedCurrency, AnimatedPercent, Sparkline, AnimatedNumber, HeroMetricCard, GlowHoverCard, BlurTransition, ParallaxCard, MagneticHover, ElasticScale, Depth3DCard, ConfettiCelebration, RevealOnScroll } from './PremiumComponents'

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
    inflow: '#34C759',
    outflow: '#FF3B30',
    balance: '#007AFF',
    positive: '#34C759',
    negative: '#FF3B30',
    neutral: '#8E8E93'
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY BREAKDOWN
// ═══════════════════════════════════════════════════════════════════════════════

const CategoryBreakdown: React.FC<{
    title: string
    categories: Array<{ category: string; amount: number; percentage: number }>
    color: string
    icon: React.ReactNode
}> = ({ title, categories, color, icon }) => (
    <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/30">
        <div className="flex items-center gap-2 mb-4">
            {icon}
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</span>
        </div>
        <div className="space-y-3">
            {categories.slice(0, 4).map((cat, idx) => (
                <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-600 dark:text-zinc-400 truncate mr-2">{cat.category}</span>
                        <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.percentage}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                        />
                    </div>
                </div>
            ))}
        </div>
    </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface TooltipPayloadEntry {
    name: string
    value: number
    color: string
    dataKey: string
    payload: Record<string, unknown>
}

interface ChartTooltipProps {
    active?: boolean
    payload?: TooltipPayloadEntry[]
    label?: string
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="
                bg-white/95 dark:bg-zinc-900/95
                backdrop-blur-xl
                border border-zinc-200/60 dark:border-white/[0.08]
                rounded-2xl p-4 shadow-xl
                min-w-[220px]
            "
        >
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">{label}</p>
            <div className="space-y-2">
                {payload.map((entry: TooltipPayloadEntry, index: number) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 text-zinc-600">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name === 'inflows' ? 'Entradas' : entry.name === 'outflows' ? 'Saídas' : 'Saldo'}
                        </span>
                        <span className={`font-bold ${entry.name === 'inflows' ? 'text-emerald-600' : entry.name === 'outflows' ? 'text-red-600' : 'text-blue-600'}`}>
                            {formatCurrency(Math.abs(entry.value))}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const CashFlowChart: React.FC<{ data: CashFlowAnalysis; showTitle?: boolean }> = ({ data, showTitle = true }) => {
    const [showDetails, setShowDetails] = useState(true)

    const netFlow = data.summary.totalInflows - data.summary.totalOutflows
    const flowRatio = (data.summary.totalInflows / data.summary.totalOutflows) * 100
    const healthScore = flowRatio >= 120 ? 'Excelente' : flowRatio >= 100 ? 'Bom' : flowRatio >= 80 ? 'Atenção' : 'Crítico'
    const healthColor = flowRatio >= 120 ? 'text-emerald-600' : flowRatio >= 100 ? 'text-blue-600' : flowRatio >= 80 ? 'text-amber-600' : 'text-red-600'

    return (
        <div className="print:break-inside-avoid">
            {showTitle && (
                <div className="flex items-center gap-3 mb-6 print:mb-4">
                    <div className="
                        w-10 h-10 rounded-2xl
                        bg-gradient-to-br from-cyan-500 to-blue-600
                        flex items-center justify-center
                        shadow-lg shadow-cyan-500/20
                        print:bg-gray-200 print:shadow-none
                    ">
                        <Wallet className="w-5 h-5 text-white print:text-black" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight print:text-black">
                            Fluxo de Caixa
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-gray-600">
                            Análise de entradas, saídas e projeção
                        </p>
                    </div>
                </div>
            )}

            {/* Hero Dashboard - STATE OF THE ART */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <HeroMetricCard
                    label="Saldo Atual"
                    value={data.summary.currentBalance}
                    format="currency"
                    color="blue"
                    icon={<Wallet className="w-4 h-4" />}
                    sparklineData={data.periods.map(p => p.balance)}
                    trend={{
                        value: ((data.summary.projectedBalance - data.summary.currentBalance) / data.summary.currentBalance) * 100,
                        label: 'projeção'
                    }}
                    celebrated={netFlow > 10000}
                />

                <HeroMetricCard
                    label="Entradas"
                    value={data.summary.totalInflows}
                    format="currency"
                    color="emerald"
                    icon={<TrendingUp className="w-4 h-4" />}
                    celebrated={data.summary.totalInflows > data.summary.totalOutflows * 1.2}
                />

                <HeroMetricCard
                    label="Saídas"
                    value={data.summary.totalOutflows}
                    format="currency"
                    color="red"
                    icon={<TrendingDown className="w-4 h-4" />}
                />

                <GlowHoverCard glowColor={netFlow >= 0 ? '#34C759' : '#FF3B30'} className="p-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Fluxo Líquido</p>
                    <p className={`text-2xl font-black tabular-nums ${netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {netFlow >= 0 ? '+' : ''}<AnimatedCurrency value={netFlow} />
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="text-center">
                            <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
                                <AnimatedNumber value={data.summary.daysOfCoverage} />
                            </p>
                            <p className="text-[9px] text-zinc-500 uppercase">dias cobertura</p>
                        </div>
                        <div className="text-center">
                            <p className={`text-lg font-bold ${healthColor}`}>{healthScore}</p>
                            <p className="text-[9px] text-zinc-500 uppercase">saúde</p>
                        </div>
                    </div>
                </GlowHoverCard>
            </div>

            {/* Toggle Details */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors print:hidden"
            >
                <motion.div animate={{ rotate: showDetails ? 180 : 0 }}>
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
                {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
            </button>

            {/* Chart & Categories */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        {/* Chart */}
                        <div className="h-[280px] mb-6 print:hidden">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data.periods} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34C759" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#34C759" stopOpacity={0.6} />
                                        </linearGradient>
                                        <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FF3B30" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#FF3B30" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-zinc-500" />
                                    <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-zinc-500" />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Legend verticalAlign="top" height={36} formatter={(value) => (
                                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                            {value === 'inflows' ? '↑ Entradas' : value === 'outflows' ? '↓ Saídas' : '━ Saldo'}
                                        </span>
                                    )} />
                                    <Bar dataKey="inflows" fill="url(#inflowGradient)" radius={[6, 6, 0, 0]} maxBarSize={35} />
                                    <Bar dataKey="outflows" fill="url(#outflowGradient)" radius={[6, 6, 0, 0]} maxBarSize={35} />
                                    <Line type="monotone" dataKey="balance" stroke={COLORS.balance} strokeWidth={3} dot={{ r: 5, fill: COLORS.balance, stroke: '#fff', strokeWidth: 2 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Category Breakdown */}
                        <div className="grid grid-cols-2 gap-4 print:gap-2">
                            <CategoryBreakdown
                                title="Composição Entradas"
                                categories={data.categories.inflows}
                                color={COLORS.inflow}
                                icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
                            />
                            <CategoryBreakdown
                                title="Composição Saídas"
                                categories={data.categories.outflows}
                                color={COLORS.outflow}
                                icon={<TrendingDown className="w-4 h-4 text-red-600" />}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alerts */}
            {data.summary.alerts.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 print:bg-gray-50 print:border-gray-300">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                Alertas Financeiros
                            </p>
                            <ul className="mt-2 space-y-1">
                                {data.summary.alerts.map((alert, idx) => (
                                    <li key={idx} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                                        {alert}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CashFlowChart
