/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BREAKAGE ANALYSIS CHART — Premium Apple HIG Design
 * 
 * Premium waste/loss visualization featuring:
 * - Animated severity cards with trend indicators
 * - Stacked bar chart with gradient fills
 * - Critical items spotlight with action recommendations
 * - Financial impact dashboard
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle, TrendingDown, ChevronDown, Target, AlertCircle, CheckCircle } from 'lucide-react'
import type { BreakageAnalysis, BreakageData } from '../types'
import { formatCurrency, formatPercent } from '../mockReportsData'
import { GlassCard, AnimatedCurrency, AnimatedPercent, Sparkline, HeroMetricCard, GlowHoverCard, PulseRing, BlurTransition, MagneticHover, ElasticScale, Depth3DCard, ConfettiCelebration, ChartToggle } from './PremiumComponents'

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const SEVERITY_COLORS = {
    critical: { bg: '#FF3B30', light: 'rgba(255, 59, 48, 0.1)' },
    warning: { bg: '#FF9500', light: 'rgba(255, 149, 0, 0.1)' },
    acceptable: { bg: '#34C759', light: 'rgba(52, 199, 89, 0.1)' }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRITICAL ITEM CARD
// ═══════════════════════════════════════════════════════════════════════════════

const CriticalItemCard: React.FC<{ item: BreakageData; rank: number }> = ({ item, rank }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: rank * 0.1 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/30"
    >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold">
            #{rank}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{item.name}</p>
            <p className="text-xs text-red-600">{formatPercent(item.wastePercentage)} desperdiçado</p>
        </div>
        <div className="text-right">
            <p className="text-sm font-bold text-red-600">{formatCurrency(item.lossValue)}</p>
            <p className="text-[10px] text-zinc-500">prejuízo</p>
        </div>
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface BreakageDataPayload {
    name: string
    wastePercentage: number
    sold: number
    produced: number
    wasted: number
    unit: string
    lossValue: number
}

interface TooltipPayloadItem {
    payload: BreakageDataPayload
}

interface ChartTooltipProps {
    active?: boolean
    payload?: TooltipPayloadItem[]
}

const CustomTooltip = ({ active, payload }: ChartTooltipProps) => {
    if (!active || !payload?.[0]) return null
    const data = payload[0].payload

    const severity = data.wastePercentage > 15 ? 'critical' : data.wastePercentage > 10 ? 'warning' : 'acceptable'
    const severityLabel = severity === 'critical' ? 'Crítico' : severity === 'warning' ? 'Atenção' : 'Normal'

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
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{data.name}</p>
                <span className={`
                    px-2 py-0.5 rounded-lg text-[10px] font-bold text-white
                    ${severity === 'critical' ? 'bg-red-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}
                `}>
                    {severityLabel}
                </span>
            </div>

            {/* Visual Breakdown */}
            <div className="mb-3">
                <div className="flex items-center h-5 rounded-lg overflow-hidden">
                    <div className="h-full bg-emerald-500 flex items-center justify-center" style={{ width: `${(data.sold / data.produced) * 100}%` }}>
                        <span className="text-[8px] font-bold text-white">VENDIDO</span>
                    </div>
                    <div className="h-full bg-red-500 flex items-center justify-center" style={{ width: `${data.wastePercentage}%` }}>
                        <span className="text-[8px] font-bold text-white">PERDA</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Produzido</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{data.produced} {data.unit}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 flex items-center gap-1">
                        <div className="w-2 h-2 rounded bg-emerald-500" />
                        Vendido
                    </span>
                    <span className="font-semibold text-emerald-600">{data.sold} {data.unit}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 flex items-center gap-1">
                        <div className="w-2 h-2 rounded bg-red-500" />
                        Desperdiçado
                    </span>
                    <span className="font-semibold text-red-600">{data.wasted} {data.unit} ({formatPercent(data.wastePercentage)})</span>
                </div>
                <div className="flex justify-between pt-2">
                    <span className="text-zinc-500">Prejuízo</span>
                    <span className="text-lg font-black text-red-600">{formatCurrency(data.lossValue)}</span>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const BreakageAnalysisChart: React.FC<{ data: BreakageAnalysis; showTitle?: boolean }> = ({ data, showTitle = true }) => {
    const [showCritical, setShowCritical] = useState(true)

    const chartData = useMemo(() =>
        [...data.items]
            .sort((a, b) => b.wastePercentage - a.wastePercentage)
            .slice(0, 10)
            .map(item => ({
                ...item,
                shortName: item.name.length > 10 ? item.name.substring(0, 8) + '...' : item.name
            })),
        [data.items]
    )

    const criticalItems = data.items.filter(i => i.wastePercentage > 15).slice(0, 5)
    const warningItems = data.items.filter(i => i.wastePercentage > 10 && i.wastePercentage <= 15)
    const acceptableItems = data.items.filter(i => i.wastePercentage <= 10)

    const wasteRate = (data.totals.totalWasted / data.totals.totalProduced) * 100

    return (
        <div className="print:break-inside-avoid">
            {showTitle && (
                <div className="flex items-center gap-3 mb-6 print:mb-4">
                    <div className="
                        w-10 h-10 rounded-2xl
                        bg-gradient-to-br from-rose-500 to-red-600
                        flex items-center justify-center
                        shadow-lg shadow-rose-500/20
                        print:bg-gray-200 print:shadow-none
                    ">
                        <Trash2 className="w-5 h-5 text-white print:text-black" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight print:text-black">
                            Análise de Quebra
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-gray-600">
                            Monitoramento de desperdício e perdas
                        </p>
                    </div>
                </div>
            )}

            {/* Hero Metrics - Ultra Premium */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <GlassCard gradient="red" hover={false} className="col-span-2 p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Prejuízo Total</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-4xl font-black text-red-600 tabular-nums">
                                <AnimatedCurrency value={data.totals.totalLossValue} />
                            </p>
                            <p className="text-sm text-zinc-500 mt-1">{data.totals.totalWasted.toLocaleString('pt-BR')} unidades perdidas</p>
                        </div>
                        <Sparkline
                            data={chartData.map(i => i.lossValue)}
                            color="#EF4444"
                            width={70}
                            height={28}
                        />
                    </div>
                </GlassCard>

                <GlassCard hover={false} className="p-5">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Taxa Geral</p>
                    <p className={`text-3xl font-black tabular-nums ${wasteRate > 10 ? 'text-red-600' : wasteRate > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        <AnimatedPercent value={wasteRate} />
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">de desperdício</p>
                </GlassCard>

                <GlassCard hover={false} className="p-5">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Status</p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex -space-x-1">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-zinc-800 shadow-lg"
                            >
                                {criticalItems.length}
                            </motion.div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.15 }}
                                className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-zinc-800 shadow-lg"
                            >
                                {warningItems.length}
                            </motion.div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-zinc-800 shadow-lg"
                            >
                                {acceptableItems.length}
                            </motion.div>
                        </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">Crítico / Atenção / Ok</p>
                </GlassCard>
            </div>

            {/* Critical Items Spotlight */}
            {criticalItems.length > 0 && (
                <>
                    <button
                        onClick={() => setShowCritical(!showCritical)}
                        className="w-full flex items-center justify-between p-3 mb-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/30 print:hidden"
                    >
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                                {criticalItems.length} Itens Críticos ({'>'} 15% desperdício)
                            </span>
                        </div>
                        <motion.div animate={{ rotate: showCritical ? 180 : 0 }}>
                            <ChevronDown className="w-4 h-4 text-red-600" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {showCritical && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-2 mb-6 print:hidden"
                            >
                                {criticalItems.map((item, idx) => (
                                    <CriticalItemCard key={item.id} item={item} rank={idx + 1} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* Chart */}
            <ChartToggle label="Gráfico de Quebras">
                <div className="h-[300px] print:h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <defs>
                                <linearGradient id="soldGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34C759" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#34C759" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="wastedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FF3B30" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#FF3B30" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                            <XAxis dataKey="shortName" tick={{ fontSize: 10, fill: 'currentColor' }} angle={-45} textAnchor="end" height={60} interval={0} className="text-zinc-500" />
                            <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-zinc-500" />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Legend verticalAlign="top" height={36} formatter={(value) => (
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                    {value === 'sold' ? '✓ Vendido' : '✗ Desperdiçado'}
                                </span>
                            )} />
                            <Bar dataKey="sold" stackId="a" fill="url(#soldGradient)" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="wasted" stackId="a" fill="url(#wastedGradient)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartToggle>

            {/* Print Table */}
            <div className="hidden print:block mt-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-gray-400">
                            <th className="text-left py-2 px-2 font-semibold">Produto</th>
                            <th className="text-right py-2 px-2 font-semibold">Produzido</th>
                            <th className="text-right py-2 px-2 font-semibold">Vendido</th>
                            <th className="text-right py-2 px-2 font-semibold">Desperd.</th>
                            <th className="text-right py-2 px-2 font-semibold">%</th>
                            <th className="text-right py-2 px-2 font-semibold">Prejuízo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, idx) => (
                            <tr key={item.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="py-1.5 px-2">{item.name}</td>
                                <td className="py-1.5 px-2 text-right tabular-nums">{item.produced}</td>
                                <td className="py-1.5 px-2 text-right tabular-nums">{item.sold}</td>
                                <td className="py-1.5 px-2 text-right tabular-nums">{item.wasted}</td>
                                <td className="py-1.5 px-2 text-right tabular-nums font-medium">{formatPercent(item.wastePercentage)}</td>
                                <td className="py-1.5 px-2 text-right tabular-nums font-bold">{formatCurrency(item.lossValue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default BreakageAnalysisChart
