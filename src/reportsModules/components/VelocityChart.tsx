/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VELOCITY CHART — Premium Apple HIG Design
 * 
 * Premium stock turnover visualization featuring:
 * - Animated expiry risk alerts with countdown
 * - Dual view mode (expiry risk vs turnover rate)
 * - Product velocity ranking
 * - Smart stock recommendations
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle, Zap, Archive, ChevronDown, TrendingUp, TrendingDown, Timer } from 'lucide-react'
import type { VelocityAnalysis, VelocityItem } from '../types'
import { GlassCard, AnimatedNumber, Sparkline, HeroMetricCard, GlowHoverCard, PulseRing, BlurTransition, MagneticHover, ElasticScale, Depth3DCard, ConfettiCelebration, StaggeredList, AnimatedGradient } from './PremiumComponents'

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_COLORS = {
    critical: '#FF3B30',
    warning: '#FF9500',
    healthy: '#34C759',
    slow: '#5856D6'
}

type ViewMode = 'expiry' | 'turnover'

// ═══════════════════════════════════════════════════════════════════════════════
// EXPIRY ALERT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const ExpiryAlertCard: React.FC<{ item: VelocityItem; rank: number }> = ({ item, rank }) => {
    const urgency = item.daysRemaining <= 2 ? 'critical' : item.daysRemaining <= 5 ? 'warning' : 'healthy'
    const bgColor = urgency === 'critical' ? 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30'
        : urgency === 'warning' ? 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30'
            : 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30'
    const borderColor = urgency === 'critical' ? 'border-red-200/60 dark:border-red-800/30'
        : urgency === 'warning' ? 'border-amber-200/60 dark:border-amber-800/30'
            : 'border-emerald-200/60 dark:border-emerald-800/30'
    const textColor = urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-amber-600' : 'text-emerald-600'

    return (
        <Depth3DCard>
            <MagneticHover strength={0.05}>
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rank * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br ${bgColor} border ${borderColor} cursor-pointer group relative overflow-hidden`}
                >
                    {/* Countdown Badge */}
                    <ElasticScale scale={1.03}>
                        <div className="relative">
                            {urgency === 'critical' && (
                                <div className="absolute -top-1 -right-1">
                                    <PulseRing color="#FF3B30" size={8} />
                                </div>
                            )}
                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${urgency === 'critical' ? 'bg-red-500 shadow-lg shadow-red-500/30' : urgency === 'warning' ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-emerald-500 shadow-lg shadow-emerald-500/30'}`}>
                                <motion.span
                                    className="text-white text-lg font-black"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: rank * 0.05 + 0.1, type: 'spring', stiffness: 400, damping: 25 }}
                                >
                                    {item.daysRemaining}
                                </motion.span>
                                <span className="text-white text-[8px] font-medium -mt-1">DIAS</span>
                            </div>
                        </div>
                    </ElasticScale>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-zinc-500">{item.currentStock} {item.unit} em estoque</p>
                    </div>
                    <div className="text-right">
                        <motion.p
                            className={`text-lg font-bold ${textColor}`}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: rank * 0.08 + 0.3 }}
                        >
                            {item.turnoverRate.toFixed(1)}x
                        </motion.p>
                        <p className="text-[10px] text-zinc-500">giro/mês</p>
                    </div>
                </motion.div>
            </MagneticHover>
        </Depth3DCard>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface VelocityDataPayload {
    name: string
    currentStock: number
    unit: string
    daysRemaining: number
    turnoverRate: number
    avgDailySales: number
    expiryRisk?: boolean
    expiryDate?: string
}

interface TooltipPayloadItem {
    payload: VelocityDataPayload
}

interface ChartTooltipProps {
    active?: boolean
    payload?: TooltipPayloadItem[]
}

const CustomTooltip = ({ active, payload }: ChartTooltipProps) => {
    if (!active || !payload?.[0]) return null
    const item = payload[0].payload

    const urgency = item.daysRemaining <= 2 ? 'Crítico' : item.daysRemaining <= 5 ? 'Atenção' : 'Normal'
    const urgencyColor = item.daysRemaining <= 2 ? 'bg-red-500' : item.daysRemaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'

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
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{item.name}</p>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold text-white ${urgencyColor}`}>
                    {urgency}
                </span>
            </div>

            <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Estoque Atual</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{item.currentStock ?? 0} {item.unit ?? 'un'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Dias Restantes</span>
                    <span className={`font-bold ${(item.daysRemaining ?? 0) <= 2 ? 'text-red-600' : (item.daysRemaining ?? 0) <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {item.daysRemaining ?? 0} dias
                    </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Giro Mensal</span>
                    <span className={`font-semibold ${(item.turnoverRate ?? 0) < 1 ? 'text-purple-600' : 'text-emerald-600'}`}>
                        {(item.turnoverRate ?? 0).toFixed(1)}x
                    </span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Venda Média/Dia</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{(item.avgDailySales ?? 0).toFixed(1)} {item.unit ?? 'un'}</span>
                </div>
            </div>

            {item.expiryRisk && item.expiryDate && (
                <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs text-red-600 font-medium">
                        Vence: {new Date(item.expiryDate).toLocaleDateString('pt-BR')}
                    </span>
                </div>
            )}
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const VelocityChart: React.FC<{ data: VelocityAnalysis; showTitle?: boolean }> = ({ data, showTitle = true }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('expiry')
    const [showAlerts, setShowAlerts] = useState(true)

    const chartData = useMemo(() => {
        const sorted = viewMode === 'expiry'
            ? [...data.items].filter(i => i.daysRemaining <= 10 || i.expiryRisk).sort((a, b) => a.daysRemaining - b.daysRemaining)
            : [...data.items].sort((a, b) => b.turnoverRate - a.turnoverRate)
        return sorted.slice(0, 10).map(item => ({
            ...item,
            shortName: item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name,
            displayValue: viewMode === 'expiry' ? item.daysRemaining : item.turnoverRate
        }))
    }, [data.items, viewMode])

    const expiryRiskItems = data.items.filter(i => i.daysRemaining <= 5).slice(0, 5)
    const criticalCount = data.items.filter(i => i.daysRemaining <= 2).length
    const warningCount = data.items.filter(i => i.daysRemaining > 2 && i.daysRemaining <= 5).length
    const slowMovers = data.items.filter(i => i.turnoverRate < 1).length

    return (
        <div className="print:break-inside-avoid">
            {showTitle && (
                <div className="flex items-center justify-between mb-6 print:mb-4">
                    <div className="flex items-center gap-3">
                        <div className="
                            w-10 h-10 rounded-2xl
                            bg-gradient-to-br from-violet-500 to-purple-600
                            flex items-center justify-center
                            shadow-lg shadow-violet-500/20
                            print:bg-gray-200 print:shadow-none
                        ">
                            <Zap className="w-5 h-5 text-white print:text-black" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight print:text-black">
                                Giro de Estoque
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-gray-600">
                                Velocidade e risco de vencimento
                            </p>
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="inline-flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl print:hidden">
                        {(['expiry', 'turnover'] as ViewMode[]).map((mode) => (
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
                                        layoutId="velocityModeIndicator"
                                        className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-lg shadow-sm"
                                        transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-1.5">
                                    {mode === 'expiry' ? <Timer className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                                    {mode === 'expiry' ? 'Vencimento' : 'Giro'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Hero Metrics - STATE OF THE ART */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <HeroMetricCard
                    label="Crítico"
                    value={criticalCount}
                    format="number"
                    color="red"
                    icon={<AlertTriangle className="w-4 h-4" />}
                    subtitle="≤ 2 dias"
                />

                <HeroMetricCard
                    label="Atenção"
                    value={warningCount}
                    format="number"
                    color="amber"
                    icon={<Clock className="w-4 h-4" />}
                    subtitle="3-5 dias"
                />

                <HeroMetricCard
                    label="Baixo Giro"
                    value={slowMovers}
                    format="number"
                    color="purple"
                    icon={<Archive className="w-4 h-4" />}
                    subtitle="< 1x/mês"
                />

                <HeroMetricCard
                    label="Giro Médio"
                    value={data.summary.avgTurnoverRate}
                    format="number"
                    color="emerald"
                    icon={<Zap className="w-4 h-4" />}
                    sparklineData={data.items.slice(0, 8).map(i => i.turnoverRate)}
                    subtitle="por mês"
                    celebrated={data.summary.avgTurnoverRate > 3}
                />
            </div>

            {/* Expiry Alerts */}
            {expiryRiskItems.length > 0 && (
                <>
                    <button
                        onClick={() => setShowAlerts(!showAlerts)}
                        className="w-full flex items-center justify-between p-3 mb-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/30 print:hidden"
                    >
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                                {expiryRiskItems.length} Itens com Risco de Vencimento
                            </span>
                        </div>
                        <motion.div animate={{ rotate: showAlerts ? 180 : 0 }}>
                            <ChevronDown className="w-4 h-4 text-red-600" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {showAlerts && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-2 mb-6 print:hidden"
                            >
                                {expiryRiskItems.map((item, idx) => (
                                    <ExpiryAlertCard key={item.id} item={item} rank={idx + 1} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* Chart */}
            <div className="h-[300px] print:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <defs>
                            <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FF3B30" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#FF3B30" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FF9500" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#FF9500" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="healthyGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34C759" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#34C759" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="slowGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#5856D6" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#5856D6" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                        <XAxis dataKey="shortName" tick={{ fontSize: 10, fill: 'currentColor' }} angle={-45} textAnchor="end" height={60} interval={0} className="text-zinc-500" />
                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} tickFormatter={(v) => viewMode === 'expiry' ? `${v}d` : `${v}x`} className="text-zinc-500" />
                        {viewMode === 'expiry' && <ReferenceLine y={5} stroke="#FF9500" strokeDasharray="5 5" strokeWidth={1.5} />}
                        {viewMode === 'turnover' && <ReferenceLine y={1} stroke="#5856D6" strokeDasharray="5 5" strokeWidth={1.5} />}
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="displayValue" radius={[6, 6, 0, 0]} maxBarSize={40}>
                            {chartData.map((entry, index) => {
                                let fill = 'url(#healthyGradient)'
                                if (viewMode === 'expiry') {
                                    if (entry.daysRemaining <= 2) fill = 'url(#criticalGradient)'
                                    else if (entry.daysRemaining <= 5) fill = 'url(#warningGradient)'
                                } else {
                                    if (entry.turnoverRate < 1) fill = 'url(#slowGradient)'
                                }
                                return <Cell key={`cell-${index}`} fill={fill} />
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default VelocityChart
