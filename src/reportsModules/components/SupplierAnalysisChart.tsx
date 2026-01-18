/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SUPPLIER ANALYSIS CHART — Premium Apple HIG Design
 * 
 * Premium supplier visualization featuring:
 * - Supplier scorecard with rating badges
 * - Quality score bar chart
 * - Dependency risk alerts
 * - Performance breakdown by category
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, Star, AlertTriangle, Clock, ShieldCheck, ChevronDown, Award } from 'lucide-react'
import type { SupplierAnalysis, SupplierItem } from '../types'
import { formatCurrency, formatPercent } from '../mockReportsData'
import { GlassCard, AnimatedCurrency, AnimatedNumber, HeroMetricCard, GlowHoverCard, BlurTransition, Depth3DCard, FloatingTooltip, MagneticHover, ElasticScale, ConfettiCelebration, PulseRing, ChartToggle } from './PremiumComponents'
import { SupplierAvatar } from '../../components/SupplierAvatar'
import { useSuppliers } from '../../stores/useAppStore'

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const RATING_COLORS = {
    A: '#34C759',
    B: '#007AFF',
    C: '#FF9500',
    D: '#FF3B30'
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLIER CARD
// ═══════════════════════════════════════════════════════════════════════════════

const SupplierCard: React.FC<{ supplier: SupplierItem; rank: number }> = ({ supplier, rank }) => {
    const ratingColor = RATING_COLORS[supplier.overallRating]
    const bgGradient = supplier.overallRating === 'A' ? 'from-emerald-50 to-green-50 dark:from-emerald-950/30'
        : supplier.overallRating === 'B' ? 'from-blue-50 to-indigo-50 dark:from-blue-950/30'
            : supplier.overallRating === 'C' ? 'from-amber-50 to-orange-50 dark:from-amber-950/30'
                : 'from-red-50 to-rose-50 dark:from-red-950/30'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.1 }}
            className={`relative p-4 rounded-xl bg-gradient-to-br ${bgGradient} border border-zinc-200/60 dark:border-zinc-700/30`}
        >
            {/* Rating Badge */}
            <div
                className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black"
                style={{ backgroundColor: ratingColor }}
            >
                {supplier.overallRating}
            </div>

            <div className="flex items-center gap-3 mb-3">
                <SupplierAvatar
                    name={supplier.name}
                    image={supplier.image}
                    size="md"
                />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white pr-10 truncate">{supplier.name}</p>
                    <p className="text-xs text-zinc-500">{supplier.category}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{supplier.qualityScore.toFixed(1)}</p>
                    <p className="text-[9px] text-zinc-500 uppercase">Qualidade</p>
                </div>
                <div>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{formatPercent(supplier.onTimeDeliveryRate)}</p>
                    <p className="text-[9px] text-zinc-500 uppercase">Pontualidade</p>
                </div>
                <div>
                    <p className={`text-lg font-bold ${supplier.dependencyRisk >= 75 ? 'text-red-600' : 'text-zinc-900 dark:text-white'}`}>
                        {formatPercent(supplier.dependencyRisk)}
                    </p>
                    <p className="text-[9px] text-zinc-500 uppercase">Dependência</p>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface SupplierDataPayload {
    name: string
    category: string
    overallRating: 'A' | 'B' | 'C' | 'D'
    totalPurchases: number
    qualityScore: number
    onTimeDeliveryRate: number
    avgDeliveryTime: number
    dependencyRisk: number
}

interface TooltipPayloadItem {
    payload: SupplierDataPayload
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
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{data.name}</p>
                    <p className="text-xs text-zinc-500">{data.category}</p>
                </div>
                <span
                    className="px-2 py-0.5 rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: RATING_COLORS[data.overallRating as keyof typeof RATING_COLORS] }}
                >
                    Rating {data.overallRating}
                </span>
            </div>

            <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Total Compras</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(data.totalPurchases)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Qualidade</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{data.qualityScore.toFixed(1)}/10</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Pontualidade</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{formatPercent(data.onTimeDeliveryRate)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Tempo Entrega</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{data.avgDeliveryTime.toFixed(1)} dias</span>
                </div>
                <div className="flex justify-between pt-1">
                    <span className="text-zinc-500">Dependência</span>
                    <span className={`font-bold ${data.dependencyRisk >= 75 ? 'text-red-600' : 'text-zinc-900 dark:text-white'}`}>
                        {formatPercent(data.dependencyRisk)}
                    </span>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const SupplierAnalysisChart: React.FC<{ data: SupplierAnalysis; showTitle?: boolean }> = ({ data: _data, showTitle = true }) => {
    const [showCards, setShowCards] = useState(true)

    // Use real suppliers from store - this generates report data WITH ACTUAL IMAGES
    const storeSuppliers = useSuppliers()

    // Generate supplier analysis directly from store suppliers (with their real images)
    const data = useMemo(() => {
        if (storeSuppliers.length === 0) return _data // Fallback to passed data if no suppliers

        const items: SupplierItem[] = storeSuppliers.map((supplier, index) => {
            const qualityScore = 7 + Math.random() * 3
            const onTimeRate = 75 + Math.random() * 25
            const dependencyRisk = Math.random() * 100

            let overallRating: 'A' | 'B' | 'C' | 'D' = 'C'
            if (qualityScore >= 8.5 && onTimeRate >= 90) overallRating = 'A'
            else if (qualityScore >= 7.5 && onTimeRate >= 80) overallRating = 'B'
            else if (qualityScore < 7 || onTimeRate < 70) overallRating = 'D'

            return {
                id: typeof supplier.id === 'number' ? supplier.id : index + 1,
                name: supplier.name,
                category: typeof supplier.category === 'string' ? supplier.category : 'Geral',
                totalPurchases: 5000 + Math.random() * 20000,
                avgDeliveryTime: 1 + Math.random() * 4,
                onTimeDeliveryRate: onTimeRate,
                qualityScore,
                priceCompetitiveness: -15 + Math.random() * 30,
                dependencyRisk,
                overallRating,
                image: supplier.image // ACTUAL IMAGE FROM STORE
            }
        })

        return {
            items,
            summary: {
                totalSuppliers: items.length,
                totalSpend: items.reduce((s, i) => s + i.totalPurchases, 0),
                avgDeliveryTime: items.reduce((s, i) => s + i.avgDeliveryTime, 0) / items.length,
                avgOnTimeRate: items.reduce((s, i) => s + i.onTimeDeliveryRate, 0) / items.length,
                avgQualityScore: items.reduce((s, i) => s + i.qualityScore, 0) / items.length,
                ratingACount: items.filter(i => i.overallRating === 'A').length,
                ratingBCount: items.filter(i => i.overallRating === 'B').length,
                ratingCCount: items.filter(i => i.overallRating === 'C').length,
                ratingDCount: items.filter(i => i.overallRating === 'D').length,
                highDependencyCount: items.filter(i => i.dependencyRisk >= 75).length
            }
        }
    }, [_data, storeSuppliers])

    const chartData = data.items.map(item => ({
        ...item,
        shortName: item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name
    }))

    const topRated = data.items.filter(s => s.overallRating === 'A').slice(0, 3)
    const highDependency = data.items.filter(s => s.dependencyRisk >= 75)

    return (
        <div className="print:break-inside-avoid">
            {showTitle && (
                <div className="flex items-center gap-3 mb-6 print:mb-4">
                    <div className="
                        w-10 h-10 rounded-2xl
                        bg-gradient-to-br from-purple-500 to-violet-600
                        flex items-center justify-center
                        shadow-lg shadow-purple-500/20
                        print:bg-gray-200 print:shadow-none
                    ">
                        <Truck className="w-5 h-5 text-white print:text-black" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight print:text-black">
                            Análise de Fornecedores
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-gray-600">
                            Performance, qualidade e risco
                        </p>
                    </div>
                </div>
            )}

            {/* Hero Metrics - STATE OF THE ART */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <HeroMetricCard
                    label="Total Gasto"
                    value={data.summary.totalSpend}
                    format="currency"
                    color="purple"
                    icon={<Truck className="w-4 h-4" />}
                    trend={{ value: -5.2, label: 'vs mês anterior' }}
                />

                <GlowHoverCard glowColor="#F59E0B" className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Qualidade Média</p>
                    </div>
                    <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums">
                        <AnimatedNumber value={data.summary.avgQualityScore * 10} />/10
                    </p>
                </GlowHoverCard>

                <GlowHoverCard glowColor="#8E8E93" className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Entrega Média</p>
                    </div>
                    <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums">
                        <AnimatedNumber value={data.summary.avgDeliveryTime * 10} /> dias
                    </p>
                </GlowHoverCard>

                <GlowHoverCard glowColor="#5856D6" className="p-5">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Ratings</p>
                    <div className="flex items-center gap-1">
                        {(['A', 'B', 'C', 'D'] as const).map((rating, i) => (
                            <motion.div
                                key={rating}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg"
                                style={{ backgroundColor: RATING_COLORS[rating] }}
                            >
                                {data.summary[`rating${rating}Count` as keyof typeof data.summary]}
                            </motion.div>
                        ))}
                    </div>
                </GlowHoverCard>
            </div>

            {/* High Dependency Alert */}
            {highDependency.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                Alerta de Dependência
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                {highDependency.length} fornecedor(es) com dependência {'>'} 75%. Considere diversificar.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {highDependency.map(s => (
                                    <span key={s.id} className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-xs font-medium text-amber-800 dark:text-amber-200">
                                        {s.name} ({formatPercent(s.dependencyRisk)})
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Cards */}
            <button
                onClick={() => setShowCards(!showCards)}
                className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors print:hidden"
            >
                <motion.div animate={{ rotate: showCards ? 180 : 0 }}>
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
                {showCards ? 'Ocultar Cards' : 'Mostrar Fornecedores'}
            </button>

            {/* Supplier Cards */}
            <AnimatePresence>
                {showCards && topRated.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6 print:hidden"
                    >
                        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-emerald-600" />
                            Top Fornecedores (Rating A)
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            {topRated.map((supplier, idx) => (
                                <SupplierCard key={supplier.id} supplier={supplier} rank={idx} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chart */}
            <ChartToggle label="Gráfico de Fornecedores">
                <div className="h-[280px] print:h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <defs>
                                <linearGradient id="ratingAGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34C759" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#34C759" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="ratingBGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#007AFF" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#007AFF" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="ratingCGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FF9500" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#FF9500" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="ratingDGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FF3B30" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#FF3B30" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                            <XAxis dataKey="shortName" tick={{ fontSize: 10, fill: 'currentColor' }} angle={-45} textAnchor="end" height={60} interval={0} className="text-zinc-500" />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-zinc-500" />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="qualityScore" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`url(#rating${entry.overallRating}Gradient)`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartToggle>

            {/* ═══ PRINT-ONLY SECTION ═══ */}
            <div className="hidden print:block mt-6">
                <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                        <p className="text-xl font-bold text-black">{data.summary.totalSuppliers}</p>
                        <p className="text-xs text-gray-600">Total Fornecedores</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-black">{data.summary.avgQualityScore.toFixed(1)}</p>
                        <p className="text-xs text-gray-600">Qualidade Média</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-green-600">{data.summary.ratingACount}</p>
                        <p className="text-xs text-gray-600">Rating A</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-red-600">{data.summary.highDependencyCount}</p>
                        <p className="text-xs text-gray-600">Alta Dependência</p>
                    </div>
                </div>
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="text-left p-2 border border-gray-200 font-semibold">Fornecedor</th>
                            <th className="text-left p-2 border border-gray-200 font-semibold">Categoria</th>
                            <th className="text-center p-2 border border-gray-200 font-semibold">Rating</th>
                            <th className="text-right p-2 border border-gray-200 font-semibold">Qualidade</th>
                            <th className="text-right p-2 border border-gray-200 font-semibold">Pontualidade</th>
                            <th className="text-right p-2 border border-gray-200 font-semibold">Dependência</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map(item => (
                            <tr key={item.id} className={item.overallRating === 'D' ? 'bg-red-50' : item.dependencyRisk >= 75 ? 'bg-amber-50' : ''}>
                                <td className="p-2 border border-gray-200 font-medium text-black">{item.name}</td>
                                <td className="p-2 border border-gray-200 text-gray-700">{item.category}</td>
                                <td className="p-2 border border-gray-200 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.overallRating === 'A' ? 'bg-green-500 text-white' :
                                            item.overallRating === 'B' ? 'bg-blue-500 text-white' :
                                                item.overallRating === 'C' ? 'bg-amber-500 text-white' :
                                                    'bg-red-500 text-white'
                                        }`}>
                                        {item.overallRating}
                                    </span>
                                </td>
                                <td className="p-2 border border-gray-200 text-right">{item.qualityScore.toFixed(1)}/10</td>
                                <td className="p-2 border border-gray-200 text-right">{item.onTimeDeliveryRate.toFixed(1)}%</td>
                                <td className={`p-2 border border-gray-200 text-right ${item.dependencyRisk >= 75 ? 'text-red-600 font-semibold' : ''}`}>
                                    {item.dependencyRisk.toFixed(0)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default SupplierAnalysisChart
