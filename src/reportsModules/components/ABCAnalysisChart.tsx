/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ABC ANALYSIS CHART — Premium Apple HIG Design
 * 
 * Premium Pareto/Curva ABC visualization featuring:
 * - Animated class breakdown cards with sparklines
 * - Interactive combo chart with gradient bars + cumulative line
 * - Top cost drivers spotlight
 * - Insights panel with actionable recommendations
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Package, AlertTriangle, ChevronDown, Target, Lightbulb } from 'lucide-react'
import type { ABCAnalysis, ABCItem } from '../types'
import { formatCurrency, formatPercent } from '../mockReportsData'
import { GlassCard, AnimatedCurrency, Sparkline, HeroMetricCard, GlowHoverCard, AnimatedNumber, BlurTransition, Depth3DCard, MagneticHover, ElasticScale } from './PremiumComponents'

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const CLASS_COLORS = {
    A: { bg: '#FF3B30', light: 'rgba(255, 59, 48, 0.1)', gradient: 'from-red-500 to-rose-600' },
    B: { bg: '#FF9500', light: 'rgba(255, 149, 0, 0.1)', gradient: 'from-amber-500 to-orange-600' },
    C: { bg: '#34C759', light: 'rgba(52, 199, 89, 0.1)', gradient: 'from-emerald-500 to-green-600' }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS CARD
// ═══════════════════════════════════════════════════════════════════════════════

const ClassCard: React.FC<{
    classification: 'A' | 'B' | 'C'
    data: { count: number; value: number; percentage: number }
    items: ABCItem[]
    totalValue: number
}> = ({ classification, data, items, totalValue }) => {
    const classItems = items.filter(i => i.classification === classification).slice(0, 3)
    const colors = CLASS_COLORS[classification]

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                relative rounded-2xl p-5 border overflow-hidden
                ${classification === 'A'
                    ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200/60 dark:from-red-950/30 dark:to-rose-950/30 dark:border-red-800/30'
                    : classification === 'B'
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800/30'
                        : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/60 dark:from-emerald-950/30 dark:to-green-950/30 dark:border-emerald-800/30'
                }
            `}
        >
            {/* Class Badge */}
            <div className={`
                absolute top-4 right-4 w-10 h-10 rounded-xl
                bg-gradient-to-br ${colors.gradient}
                flex items-center justify-center
                shadow-lg
            `}>
                <span className="text-white text-lg font-black">{classification}</span>
            </div>

            <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Classe {classification} — {classification === 'A' ? 'Crítica' : classification === 'B' ? 'Importante' : 'Rotina'}
                </p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">
                    {formatCurrency(data.value)}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {data.count} itens • {formatPercent(data.percentage)} do total
                </p>
            </div>

            {/* Mini Progress */}
            <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-4">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-r ${colors.gradient}`}
                />
            </div>

            {/* Top Items */}
            <div className="space-y-2">
                {classItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400 truncate mr-2">
                            {idx + 1}. {item.name}
                        </span>
                        <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">
                            {formatCurrency(item.totalCost)}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface ABCDataPayload {
    name: string
    classification: 'A' | 'B' | 'C'
    totalCost: number
    percentage: number
    cumulativePercentage: number
}

interface TooltipPayloadItem {
    payload: ABCDataPayload
}

interface ChartTooltipProps {
    active?: boolean
    payload?: TooltipPayloadItem[]
}

const CustomTooltip = ({ active, payload }: ChartTooltipProps) => {
    if (!active || !payload?.[0]) return null
    const data = payload[0].payload

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
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {data.name}
                </p>
                <span className={`
                    px-2 py-0.5 rounded-lg text-[10px] font-bold text-white
                    ${data.classification === 'A' ? 'bg-red-500' : data.classification === 'B' ? 'bg-amber-500' : 'bg-emerald-500'}
                `}>
                    CLASSE {data.classification}
                </span>
            </div>

            <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Custo Total</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(data.totalCost)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Participação</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatPercent(data.percentage)}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Acumulado</span>
                    <span className="font-black text-blue-600">{formatPercent(data.cumulativePercentage)}</span>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHTS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const InsightsPanel: React.FC<{ data: ABCAnalysis }> = ({ data }) => {
    const classAItems = data.items.filter(i => i.classification === 'A')
    const highImpactItem = classAItems[0]

    return (
        <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800/30">
            <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">Insights</span>
            </div>
            <div className="space-y-2">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-red-600">{classAItems.length} itens Classe A</span> representam {formatPercent(data.totals.classA.percentage)} do custo total
                </p>
                {highImpactItem && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        <span className="font-semibold">{highImpactItem.name}</span> é o maior custo individual: {formatCurrency(highImpactItem.totalCost)}
                    </p>
                )}
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    💡 Foque negociação de preços nos itens Classe A para máximo impacto
                </p>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const ABCAnalysisChart: React.FC<{ data: ABCAnalysis; showTitle?: boolean }> = ({ data, showTitle = true }) => {
    const [showDetails, setShowDetails] = useState(true)

    const chartData = useMemo(() =>
        data.items.slice(0, 12).map(item => ({
            ...item,
            shortName: item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name
        })),
        [data.items]
    )

    return (
        <BlurTransition>
            <div className="print:break-inside-avoid">
                {showTitle && (
                    <div className="flex items-center gap-3 mb-6 print:mb-4">
                        <MagneticHover strength={0.05}>
                            <ElasticScale scale={1.03}>
                                <div className="
                                w-10 h-10 rounded-2xl
                                bg-gradient-to-br from-indigo-500 to-purple-600
                                flex items-center justify-center
                                shadow-lg shadow-indigo-500/20
                                print:bg-gray-200 print:shadow-none
                            ">
                                    <TrendingUp className="w-5 h-5 text-white print:text-black" />
                                </div>
                            </ElasticScale>
                        </MagneticHover>
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight print:text-black">
                                Curva ABC de Insumos
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-gray-600">
                                Análise Pareto — 80/20 de custos
                            </p>
                        </div>
                    </div>
                )}

                {/* Hero Metric - STATE OF THE ART */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <HeroMetricCard
                        label="Custo Total de Insumos"
                        value={data.totalValue}
                        format="currency"
                        color="purple"
                        icon={<Package className="w-4 h-4" />}
                        sparklineData={data.items.slice(0, 10).map(i => i.totalCost)}
                        subtitle={`${data.items.length} itens analisados`}
                        trend={{ value: -3.2, label: 'vs mês anterior' }}
                    />

                    <GlowHoverCard glowColor="#8B5CF6" className="p-5 flex items-center justify-around">
                        {(['A', 'B', 'C'] as const).map((classification, i) => {
                            const classData = data.totals[`class${classification}` as keyof typeof data.totals]
                            const colors = { A: '#34C759', B: '#007AFF', C: '#8E8E93' }
                            return (
                                <motion.div
                                    key={classification}
                                    initial={{ scale: 0, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.1, type: 'spring' }}
                                    className="text-center"
                                >
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-2 shadow-lg"
                                        style={{ backgroundColor: colors[classification] }}
                                    >
                                        {classification}
                                    </div>
                                    <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
                                        <AnimatedNumber value={(classData as { percentage: number }).percentage * 100} />%
                                    </p>
                                    <p className="text-[10px] text-zinc-500 uppercase">dos custos</p>
                                </motion.div>
                            )
                        })}
                    </GlowHoverCard>
                </div>

                {/* Class Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6 print:gap-2 print:mb-4">
                    <ClassCard classification="A" data={data.totals.classA} items={data.items} totalValue={data.totalValue} />
                    <ClassCard classification="B" data={data.totals.classB} items={data.items} totalValue={data.totalValue} />
                    <ClassCard classification="C" data={data.totals.classC} items={data.items} totalValue={data.totalValue} />
                </div>

                {/* Insights */}
                <div className="mb-6 print:hidden">
                    <InsightsPanel data={data} />
                </div>

                {/* Toggle Details */}
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors print:hidden"
                >
                    <motion.div animate={{ rotate: showDetails ? 180 : 0 }}>
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                    {showDetails ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
                </button>

                {/* Chart */}
                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="h-[320px] print:h-[240px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 60 }}>
                                    <defs>
                                        <linearGradient id="barGradientA" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FF3B30" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#FF3B30" stopOpacity={0.6} />
                                        </linearGradient>
                                        <linearGradient id="barGradientB" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FF9500" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#FF9500" stopOpacity={0.6} />
                                        </linearGradient>
                                        <linearGradient id="barGradientC" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34C759" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#34C759" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                                    <XAxis dataKey="shortName" tick={{ fontSize: 10, fill: 'currentColor' }} angle={-45} textAnchor="end" height={60} interval={0} className="text-zinc-500" />
                                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'currentColor' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} className="text-zinc-500" />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: 'currentColor' }} tickFormatter={(v) => `${v}%`} className="text-zinc-500" />
                                    <ReferenceLine yAxisId="right" y={80} stroke="#5856D6" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: '80%', position: 'right', fill: '#5856D6', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Legend verticalAlign="top" height={36} formatter={(value) => (
                                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                            {value === 'totalCost' ? 'Custo' : 'Acumulado %'}
                                        </span>
                                    )} />
                                    <Bar yAxisId="left" dataKey="totalCost" name="totalCost" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`url(#barGradient${entry.classification})`} />
                                        ))}
                                    </Bar>
                                    <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" name="cumulativePercentage" stroke="#5856D6" strokeWidth={2.5} dot={{ fill: '#5856D6', r: 4 }} activeDot={{ r: 6 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Print Table */}
                <div className="hidden print:block mt-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-gray-400">
                                <th className="text-left py-2 px-2 font-semibold">#</th>
                                <th className="text-left py-2 px-2 font-semibold">Item</th>
                                <th className="text-right py-2 px-2 font-semibold">Custo</th>
                                <th className="text-right py-2 px-2 font-semibold">%</th>
                                <th className="text-center py-2 px-2 font-semibold">Classe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item, idx) => (
                                <tr key={item.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                    <td className="py-1.5 px-2 text-gray-500">{idx + 1}</td>
                                    <td className="py-1.5 px-2">{item.name}</td>
                                    <td className="py-1.5 px-2 text-right tabular-nums">{formatCurrency(item.totalCost)}</td>
                                    <td className="py-1.5 px-2 text-right tabular-nums">{formatPercent(item.percentage)}</td>
                                    <td className="py-1.5 px-2 text-center font-bold">{item.classification}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </BlurTransition>
    )
}

export default ABCAnalysisChart
