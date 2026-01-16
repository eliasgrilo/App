/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PRODUCTION EFFICIENCY CHART — Premium Apple HIG Design
 * 
 * Premium OEE visualization featuring:
 * - Efficiency score gauge/ring
 * - Animated status breakdown cards
 * - Hourly output trend line
 * - Product efficiency ranking with defect rates
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Clock, AlertCircle, CheckCircle2, TrendingUp, ChevronDown, Target } from 'lucide-react'
import type { ProductionEfficiency } from '../types'
import { formatPercent } from '../mockReportsData'
import { GlassCard, AnimatedPercent, AnimatedNumber, ProgressRing, HeroMetricCard, GlowHoverCard, BlurTransition, WaveBackground, MagneticHover, ElasticScale, Depth3DCard, ConfettiCelebration, PulseRing } from './PremiumComponents'

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const EFFICIENCY_COLORS = {
    optimal: '#34C759',
    good: '#007AFF',
    needs_improvement: '#FF9500',
    critical: '#FF3B30'
}

// ═══════════════════════════════════════════════════════════════════════════════
// EFFICIENCY RING
// ═══════════════════════════════════════════════════════════════════════════════

const EfficiencyRing: React.FC<{ value: number }> = ({ value }) => {
    const radius = 60
    const circumference = 2 * Math.PI * radius
    const progress = (value / 120) * circumference // Max 120%
    const color = value >= 100 ? EFFICIENCY_COLORS.optimal : value >= 85 ? EFFICIENCY_COLORS.good : value >= 70 ? EFFICIENCY_COLORS.needs_improvement : EFFICIENCY_COLORS.critical

    return (
        <div className="relative w-36 h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-700" strokeWidth="10" />
                <motion.circle
                    cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-black text-zinc-900 dark:text-white">{value.toFixed(0)}%</p>
                <p className="text-xs text-zinc-500">eficiência</p>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface ProductionDataPayload {
    name: string
    standardTime: number
    actualTime: number
    efficiency: number
    efficiencyLevel: 'optimal' | 'good' | 'needs_improvement' | 'critical'
    defectRate: number
}

interface TooltipPayloadItem {
    payload: ProductionDataPayload
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
                min-w-[200px]
            "
        >
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">{data.name}</p>
            <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Tempo Padrão</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{data.standardTime} min</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Tempo Real</span>
                    <span className={`font-semibold ${data.actualTime <= data.standardTime ? 'text-emerald-600' : 'text-amber-600'}`}>{data.actualTime} min</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Eficiência</span>
                    <span className="font-bold" style={{ color: EFFICIENCY_COLORS[data.efficiencyLevel as keyof typeof EFFICIENCY_COLORS] }}>
                        {formatPercent(data.efficiency)}
                    </span>
                </div>
                <div className="flex justify-between pt-1">
                    <span className="text-zinc-500">Taxa Defeito</span>
                    <span className={`font-semibold ${data.defectRate > 5 ? 'text-red-600' : data.defectRate > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatPercent(data.defectRate)}
                    </span>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const ProductionEfficiencyChart: React.FC<{ data: ProductionEfficiency; showTitle?: boolean }> = ({ data, showTitle = true }) => {
    const [showHourly, setShowHourly] = useState(true)

    const chartData = data.items.map(item => ({
        ...item,
        shortName: item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name
    }))

    return (
        <BlurTransition>
            <div className="print:break-inside-avoid relative">
                {/* Confetti for excellent efficiency */}
                <ConfettiCelebration trigger={data.summary.avgEfficiency > 95} />

                {showTitle && (
                    <div className="flex items-center gap-3 mb-6 print:mb-4">
                        <MagneticHover strength={0.05}>
                            <ElasticScale scale={1.03}>
                                <div className="
                                w-10 h-10 rounded-2xl
                                bg-gradient-to-br from-amber-500 to-orange-600
                                flex items-center justify-center
                                shadow-lg shadow-amber-500/20
                                print:bg-gray-200 print:shadow-none
                            ">
                                    <Zap className="w-5 h-5 text-white print:text-black" />
                                </div>
                            </ElasticScale>
                        </MagneticHover>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight print:text-black">
                                    Eficiência de Produção
                                </h3>
                                {data.summary.avgEfficiency > 95 && (
                                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 animate-pulse">
                                        EXCELENTE ⚡
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-gray-600">
                                OEE simplificado — Tempo padrão vs real
                            </p>
                        </div>
                    </div>
                )}

                {/* Hero Dashboard with Ring - STATE OF THE ART */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <Depth3DCard>
                        <GlowHoverCard glowColor="#FF9500" className="col-span-2 p-5 flex items-center gap-6">
                            <ProgressRing
                                value={data.summary.avgEfficiency}
                                size={90}
                                strokeWidth={10}
                                color={data.summary.avgEfficiency >= 95 ? '#34C759' : data.summary.avgEfficiency >= 85 ? '#007AFF' : data.summary.avgEfficiency >= 70 ? '#FF9500' : '#FF3B30'}
                            />
                            <div>
                                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Eficiência Média</p>
                                <p className="text-sm text-zinc-500 mt-2">
                                    <AnimatedNumber value={data.summary.totalUnitsProduced} /> unidades produzidas
                                </p>
                                <p className="text-sm text-zinc-500">
                                    Taxa defeito: <span className={data.summary.avgDefectRate > 5 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                                        <AnimatedPercent value={data.summary.avgDefectRate} />
                                    </span>
                                </p>
                            </div>
                        </GlowHoverCard>
                    </Depth3DCard>
                    <HeroMetricCard
                        label="Ótimo/Bom"
                        value={data.summary.optimalCount + data.summary.goodCount}
                        format="number"
                        color="emerald"
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        subtitle="≥ 85% eficiência"
                        celebrated={data.summary.avgEfficiency > 90}
                    />

                    <HeroMetricCard
                        label="Precisa Melhorar"
                        value={data.summary.needsImprovementCount + data.summary.criticalCount}
                        format="number"
                        color="red"
                        icon={<AlertCircle className="w-4 h-4" />}
                        subtitle="< 85% eficiência"
                    />
                </div>

                {/* Efficiency Chart */}
                <div className="h-[280px] print:hidden mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <defs>
                                <linearGradient id="optimalGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34C759" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#34C759" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="goodGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#007AFF" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#007AFF" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="improvementGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FF9500" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#FF9500" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="criticalEffGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FF3B30" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#FF3B30" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                            <XAxis dataKey="shortName" tick={{ fontSize: 10, fill: 'currentColor' }} angle={-45} textAnchor="end" height={60} interval={0} className="text-zinc-500" />
                            <YAxis domain={[0, 120]} tick={{ fontSize: 10, fill: 'currentColor' }} tickFormatter={(v) => `${v}%`} className="text-zinc-500" />
                            <ReferenceLine y={100} stroke="#34C759" strokeDasharray="5 5" strokeWidth={2} label={{ value: '100% Meta', position: 'right', fill: '#34C759', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="efficiency" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                {chartData.map((entry, index) => {
                                    const gradient = entry.efficiencyLevel === 'optimal' ? 'url(#optimalGradient)'
                                        : entry.efficiencyLevel === 'good' ? 'url(#goodGradient)'
                                            : entry.efficiencyLevel === 'needs_improvement' ? 'url(#improvementGradient)'
                                                : 'url(#criticalEffGradient)'
                                    return <Cell key={`cell-${index}`} fill={gradient} />
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Hourly Output */}
                <button
                    onClick={() => setShowHourly(!showHourly)}
                    className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors print:hidden"
                >
                    <motion.div animate={{ rotate: showHourly ? 180 : 0 }}>
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                    {showHourly ? 'Ocultar Produção/Hora' : 'Mostrar Produção/Hora'}
                </button>

                <AnimatePresence>
                    {showHourly && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="print:hidden"
                        >
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Produção por Hora
                            </h4>
                            <div className="h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.hourlyOutput} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
                                        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-zinc-500" />
                                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-zinc-500" />
                                        <Tooltip cursor={{ stroke: 'rgba(0,0,0,0.1)' }} />
                                        <Line type="monotone" dataKey="units" stroke="#007AFF" strokeWidth={2.5} dot={{ r: 4, fill: '#007AFF', stroke: '#fff', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </BlurTransition>
    )
}

export default ProductionEfficiencyChart
