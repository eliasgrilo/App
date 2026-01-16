/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MARGIN ANALYSIS CHART — Premium Apple HIG Design
 * 
 * Premium visualization featuring:
 * - Stacked bar chart showing Cost + Margin = Price breakdown
 * - Margin % overlay line for trend visibility
 * - Top 3 / Bottom 3 performer spotlight cards
 * - Animated transitions and micro-interactions
 * - Comprehensive hover insights
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Trophy, Medal, Award, ChevronDown } from 'lucide-react'
import type { MarginAnalysis, MarginItem } from '../types'
import { formatCurrency, formatPercent } from '../mockReportsData'
import { GlassCard, AnimatedCurrency, AnimatedPercent, Sparkline, HeroMetricCard, GlowHoverCard, ConfettiCelebration, PulseRing, BlurTransition, Depth3DCard, MagneticHover, LiveDataIndicator, GradientText, ElasticScale, RevealOnScroll } from './PremiumComponents'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface MarginAnalysisChartProps {
    data: MarginAnalysis
    showTitle?: boolean
}

type ViewMode = 'margin' | 'profit'

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS — Apple Semantic Palette
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
    cost: '#8E8E93',        // Apple Gray
    margin: '#34C759',      // Apple Green
    marginLine: '#007AFF', // Apple Blue
    excellent: '#34C759',
    good: '#007AFF',
    warning: '#FF9500',
    critical: '#FF3B30',
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32'
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMER CARD
// ═══════════════════════════════════════════════════════════════════════════════

const PerformerCard: React.FC<{
    item: MarginItem
    rank: number
    isTop: boolean
}> = ({ item, rank, isTop }) => {
    const medals = [Trophy, Medal, Award]
    const MedalIcon = medals[rank - 1] || Award
    const colors = isTop
        ? ['from-amber-400 to-yellow-500', 'from-zinc-300 to-zinc-400', 'from-amber-600 to-orange-700']
        : ['from-red-500 to-rose-600', 'from-red-400 to-rose-500', 'from-red-300 to-rose-400']

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.1 }}
            className={`
                relative p-4 rounded-2xl border overflow-hidden
                ${isTop
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60 dark:from-emerald-950/30 dark:to-teal-950/30 dark:border-emerald-800/30'
                    : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200/60 dark:from-red-950/30 dark:to-rose-950/30 dark:border-red-800/30'
                }
            `}
        >
            {/* Rank Badge */}
            <div className={`
                absolute top-3 right-3 w-8 h-8 rounded-full
                bg-gradient-to-br ${colors[rank - 1]}
                flex items-center justify-center
                shadow-lg
            `}>
                <span className="text-white text-xs font-bold">#{rank}</span>
            </div>

            <div className="flex items-start gap-3">
                <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${isTop ? 'bg-emerald-500/20' : 'bg-red-500/20'}
                `}>
                    <MedalIcon className={`w-5 h-5 ${isTop ? 'text-emerald-600' : 'text-red-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate pr-8">
                        {item.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {item.category}
                    </p>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400">Margem</p>
                    <p className={`text-lg font-bold ${isTop ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatPercent(item.marginPercent)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400">Lucro Unit.</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">
                        {formatCurrency(item.marginValue)}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface MarginDataPayload {
    name: string
    unitCost: number
    unitPrice: number
    marginPercent: number
    marginValue: number
    unitsSold: number
    totalMargin: number
}

interface TooltipPayloadItem {
    payload: MarginDataPayload
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
                min-w-[240px]
            "
        >
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                {data.name}
            </p>

            {/* Visual Breakdown */}
            <div className="mb-3">
                <div className="flex items-center h-6 rounded-lg overflow-hidden">
                    <div
                        className="h-full bg-zinc-400 flex items-center justify-center"
                        style={{ width: `${(data.unitCost / data.unitPrice) * 100}%` }}
                    >
                        <span className="text-[9px] font-bold text-white px-1">CUSTO</span>
                    </div>
                    <div
                        className="h-full bg-emerald-500 flex items-center justify-center"
                        style={{ width: `${data.marginPercent}%` }}
                    >
                        <span className="text-[9px] font-bold text-white px-1">MARGEM</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Preço de Venda</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(data.unitPrice)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 flex items-center gap-1">
                        <div className="w-2 h-2 rounded bg-zinc-400" />
                        Custo
                    </span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatCurrency(data.unitCost)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 flex items-center gap-1">
                        <div className="w-2 h-2 rounded bg-emerald-500" />
                        Lucro/Unidade
                    </span>
                    <span className="font-bold text-emerald-600">{formatCurrency(data.marginValue)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                    <span className="text-zinc-500">Margem %</span>
                    <span className="text-lg font-black" style={{
                        color: data.marginPercent >= 50 ? COLORS.excellent :
                            data.marginPercent >= 30 ? COLORS.good :
                                data.marginPercent >= 20 ? COLORS.warning : COLORS.critical
                    }}>
                        {formatPercent(data.marginPercent)}
                    </span>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Vendas: {data.unitsSold.toLocaleString('pt-BR')} un</span>
                    <span className="text-sm font-bold text-emerald-600">
                        Lucro Total: {formatCurrency(data.totalMargin)}
                    </span>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const MarginAnalysisChart: React.FC<MarginAnalysisChartProps> = ({ data, showTitle = true }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('margin')
    const [showRanking, setShowRanking] = useState(true)

    // Sort by margin % or total profit
    const sortedItems = useMemo(() => {
        const sorted = [...data.items].sort((a, b) =>
            viewMode === 'margin'
                ? b.marginPercent - a.marginPercent
                : b.totalMargin - a.totalMargin
        )
        return sorted
    }, [data.items, viewMode])

    const chartData = useMemo(() =>
        sortedItems.slice(0, 10).map(item => ({
            ...item,
            shortName: item.name.length > 10 ? item.name.substring(0, 8) + '...' : item.name
        })),
        [sortedItems]
    )

    const top3 = sortedItems.slice(0, 3)
    const bottom3 = [...sortedItems].reverse().slice(0, 3)

    return (
        <BlurTransition>
            <div className="print:break-inside-avoid">
                {showTitle && (
                    <div className="flex items-center justify-between mb-6 print:mb-4">
                        <div className="flex items-center gap-3">
                            <MagneticHover strength={0.05}>
                                <ElasticScale>
                                    <div className="
                                        w-10 h-10 rounded-2xl
                                        bg-gradient-to-br from-emerald-500 to-teal-600
                                        flex items-center justify-center
                                        shadow-lg shadow-emerald-500/20
                                        print:bg-gray-200 print:shadow-none
                                    ">
                                        <DollarSign className="w-5 h-5 text-white print:text-black" />
                                    </div>
                                </ElasticScale>
                            </MagneticHover>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight print:text-black">
                                        <GradientText colors={['#34C759', '#10B981']}>
                                            Margem de Contribuição
                                        </GradientText>
                                    </h3>
                                    <LiveDataIndicator color="#34C759" />
                                </div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-gray-600">
                                    Análise de lucratividade por produto
                                </p>
                            </div>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="inline-flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl print:hidden">
                            {(['margin', 'profit'] as ViewMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`
                                    relative px-3 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200
                                    ${viewMode === mode ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}
                                `}
                                >
                                    {viewMode === mode && (
                                        <motion.div
                                            layoutId="marginModeIndicator"
                                            className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-lg shadow-sm"
                                            transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
                                        />
                                    )}
                                    <span className="relative z-10">
                                        {mode === 'margin' ? '% Margem' : 'R$ Lucro'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hero Metrics - STATE OF THE ART Apple Design */}
                <div className="grid grid-cols-3 gap-4 mb-6 print:gap-2 print:mb-4">
                    <HeroMetricCard
                        label="Lucro Total"
                        value={data.summary.totalMargin}
                        format="currency"
                        color="emerald"
                        icon={<DollarSign className="w-4 h-4" />}
                        sparklineData={sortedItems.slice(0, 7).map(i => i.totalMargin)}
                        subtitle={`de ${formatCurrency(data.summary.totalRevenue)} faturado`}
                        trend={{ value: 12.5, label: 'vs mês anterior' }}
                        celebrated={data.summary.avgMarginPercent > 35}
                    />

                    <HeroMetricCard
                        label="Margem Média"
                        value={data.summary.avgMarginPercent}
                        format="percent"
                        color="blue"
                        sparklineData={sortedItems.slice(0, 7).map(i => i.marginPercent)}
                        subtitle={`${data.items.length} produtos analisados`}
                        celebrated={data.summary.avgMarginPercent > 40}
                    />

                    <GlowHoverCard glowColor="#8E8E93" className="p-5">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Status</p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex -space-x-1">
                                {[
                                    { count: data.summary.excellentCount, color: 'bg-emerald-500', delay: 0.1 },
                                    { count: data.summary.goodCount, color: 'bg-blue-500', delay: 0.15 },
                                    { count: data.summary.warningCount, color: 'bg-amber-500', delay: 0.2 },
                                    { count: data.summary.criticalCount, color: 'bg-red-500', delay: 0.25 }
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            delay: item.delay,
                                            type: 'spring',
                                            stiffness: 260,
                                            damping: 20
                                        }}
                                        className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center text-[11px] font-bold text-white border-2 border-white dark:border-zinc-800 shadow-lg`}
                                    >
                                        {item.count}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2">Excelente / Bom / Atenção / Crítico</p>
                    </GlowHoverCard>
                </div>

                {/* Top/Bottom Performers */}
                <AnimatePresence>
                    {showRanking && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-6 print:hidden"
                        >
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                        Top 3 Performers
                                    </h4>
                                    <div className="space-y-3">
                                        {top3.map((item, idx) => (
                                            <PerformerCard key={item.id} item={item} rank={idx + 1} isTop={true} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        Precisam Atenção
                                    </h4>
                                    <div className="space-y-3">
                                        {bottom3.map((item, idx) => (
                                            <PerformerCard key={item.id} item={item} rank={idx + 1} isTop={false} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toggle Ranking */}
                <button
                    onClick={() => setShowRanking(!showRanking)}
                    className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors print:hidden"
                >
                    <motion.div animate={{ rotate: showRanking ? 180 : 0 }}>
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                    {showRanking ? 'Ocultar Ranking' : 'Mostrar Top/Bottom 3'}
                </button>

                {/* Chart */}
                <div className="h-[320px] print:hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 20, right: 40, left: 20, bottom: 60 }}
                        >
                            <defs>
                                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8E8E93" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#8E8E93" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34C759" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#34C759" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                            <XAxis
                                dataKey="shortName"
                                tick={{ fontSize: 10, fill: 'currentColor' }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                interval={0}
                                className="text-zinc-500"
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 10, fill: 'currentColor' }}
                                tickFormatter={(v) => `R$${v}`}
                                className="text-zinc-500"
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 100]}
                                tick={{ fontSize: 10, fill: 'currentColor' }}
                                tickFormatter={(v) => `${v}%`}
                                className="text-zinc-500"
                            />
                            <ReferenceLine yAxisId="right" y={30} stroke="#FF9500" strokeDasharray="5 5" strokeWidth={1.5} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                formatter={(value) => (
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                        {value === 'unitCost' ? 'Custo' : value === 'marginValue' ? 'Margem' : 'Margem %'}
                                    </span>
                                )}
                            />
                            <Bar yAxisId="left" dataKey="unitCost" stackId="price" fill="url(#costGradient)" radius={[0, 0, 0, 0]} maxBarSize={40} name="unitCost" />
                            <Bar yAxisId="left" dataKey="marginValue" stackId="price" fill="url(#marginGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} name="marginValue" />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="marginPercent"
                                stroke="#007AFF"
                                strokeWidth={2.5}
                                dot={{ fill: '#007AFF', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                name="marginPercent"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Print Table */}
                <div className="hidden print:block mt-4">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-400">
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">#</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Produto</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Preço</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Custo</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Margem %</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Lucro Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedItems.map((item, idx) => (
                                <tr key={item.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                    <td className="py-2 px-3 text-gray-500 font-medium">{idx + 1}</td>
                                    <td className="py-2 px-3 text-gray-900">{item.name}</td>
                                    <td className="py-2 px-3 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-2 px-3 text-right text-gray-700">{formatCurrency(item.unitCost)}</td>
                                    <td className="py-2 px-3 text-right font-medium text-gray-900">{formatPercent(item.marginPercent)}</td>
                                    <td className="py-2 px-3 text-right font-bold text-gray-900">{formatCurrency(item.totalMargin)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </BlurTransition>
    )
}

export default MarginAnalysisChart
