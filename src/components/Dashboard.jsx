import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Dashboard - Apple-Quality KPI Dashboard Component
 * Features: Period comparison, trend indicators, sparklines
 */

// Sparkline Mini-Chart
function Sparkline({ data, height = 32, width = 80, color = '#8b5cf6' }) {
    if (!data || data.length < 2) return <div style={{ width, height }} />

    const values = data.map(d => Number(d) || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * width
        const y = height - ((v - min) / range) * (height - 4) - 2
        return `${x},${y}`
    }).join(' ')

    const trend = values[values.length - 1] > values[0] ? '#10b981' : values[values.length - 1] < values[0] ? '#ef4444' : color
    const gradientId = `spark-${Math.random().toString(36).substr(2, 9)}`
    const areaPoints = `0,${height} ${points} ${width},${height}`

    return (
        <svg width={width} height={height} className="overflow-visible">
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={trend} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={trend} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={areaPoints} fill={`url(#${gradientId})`} />
            <polyline points={points} fill="none" stroke={trend} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={width} cy={height - ((values[values.length - 1] - min) / range) * (height - 4) - 2} r="3" fill={trend} />
        </svg>
    )
}

// Trend Indicator with Arrow
function TrendIndicator({ current, previous, inverse = false }) {
    if (!previous || previous === 0) return null

    const change = ((current - previous) / previous) * 100
    const isPositive = inverse ? change < 0 : change > 0
    const absChange = Math.abs(change).toFixed(1)

    if (Math.abs(change) < 0.5) return null

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPositive
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
        >
            {change > 0 ? '↑' : '↓'} {absChange}%
        </motion.div>
    )
}

// KPI Card Component
function KPICard({ title, value, subtitle, trend, sparklineData, color = 'violet', icon, delay = 0 }) {
    const colorStyles = {
        violet: 'from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/5 border-violet-200/50 dark:border-violet-500/20',
        emerald: 'from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5 border-emerald-200/50 dark:border-emerald-500/20',
        rose: 'from-rose-50 to-pink-50 dark:from-rose-500/10 dark:to-pink-500/5 border-rose-200/50 dark:border-rose-500/20',
        amber: 'from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 border-amber-200/50 dark:border-amber-500/20',
        zinc: 'from-zinc-50 to-slate-50 dark:from-zinc-800 dark:to-slate-800/50 border-zinc-200/50 dark:border-zinc-700/50'
    }

    const textColors = {
        violet: 'text-violet-600 dark:text-violet-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        rose: 'text-rose-600 dark:text-rose-400',
        amber: 'text-amber-600 dark:text-amber-400',
        zinc: 'text-zinc-600 dark:text-zinc-400'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`bg-gradient-to-br ${colorStyles[color]} rounded-3xl p-5 border shadow-sm hover:shadow-lg transition-shadow duration-300`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {icon && <span className="text-lg">{icon}</span>}
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${textColors[color]}`}>
                        {title}
                    </span>
                </div>
                {trend && <TrendIndicator {...trend} />}
            </div>

            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>
                    )}
                </div>
                {sparklineData && sparklineData.length >= 2 && (
                    <Sparkline data={sparklineData} />
                )}
            </div>
        </motion.div>
    )
}

// Period Selector Component
function PeriodSelector({ value, onChange, options }) {
    return (
        <div className="flex gap-1 p-1 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-2xl">
            {options.map(opt => (
                <motion.button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`relative px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-colors ${value === opt.value
                        ? 'text-zinc-900 dark:text-white'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                >
                    {value === opt.value && (
                        <motion.div
                            layoutId="periodSelector"
                            className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-sm"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                </motion.button>
            ))}
        </div>
    )
}

// Main Dashboard Component
export default function Dashboard({
    products = [],
    movements = [],
    period = 'month',
    onPeriodChange
}) {
    const [selectedPeriod, setSelectedPeriod] = useState(period)

    const periodOptions = [
        { value: 'week', label: '7 Dias', days: 7 },
        { value: 'month', label: '30 Dias', days: 30 },
        { value: 'quarter', label: '90 Dias', days: 90 }
    ]

    const handlePeriodChange = (p) => {
        setSelectedPeriod(p)
        onPeriodChange?.(p)
    }

    // Calculate stats for current and previous period
    const stats = useMemo(() => {
        const days = periodOptions.find(p => p.value === selectedPeriod)?.days || 30
        const now = Date.now()
        const currentStart = now - days * 24 * 60 * 60 * 1000
        const previousStart = currentStart - days * 24 * 60 * 60 * 1000

        const filterByPeriod = (items, start, end) =>
            items.filter(m => {
                const t = new Date(m.createdAt).getTime()
                return t >= start && t < end
            })

        const currentMov = filterByPeriod(movements, currentStart, now)
        const previousMov = filterByPeriod(movements, previousStart, currentStart)

        const entries = currentMov.filter(m => m.type === 'entry')
        const exits = currentMov.filter(m => m.type === 'exit')
        const prevEntries = previousMov.filter(m => m.type === 'entry')
        const prevExits = previousMov.filter(m => m.type === 'exit')

        // Total value
        const totalValue = products.reduce((sum, p) => sum + (p.currentStock || 0) * (p.currentPrice || 0), 0)

        // Movement value
        const entryValue = entries.reduce((sum, m) => sum + (m.quantity || 0) * (m.price || 0), 0)
        const exitValue = exits.reduce((sum, m) => sum + (m.quantity || 0) * (m.price || products.find(p => p.id === m.productId)?.currentPrice || 0), 0)

        // Sparkline data (daily aggregation for past period)
        const dailyData = []
        for (let d = days; d >= 0; d--) {
            const dayStart = now - d * 24 * 60 * 60 * 1000
            const dayEnd = dayStart + 24 * 60 * 60 * 1000
            const dayMov = movements.filter(m => {
                const t = new Date(m.createdAt).getTime()
                return t >= dayStart && t < dayEnd
            })
            dailyData.push(dayMov.length)
        }

        return {
            totalProducts: products.length,
            totalValue,
            entries: entries.length,
            exits: exits.length,
            prevEntries: prevEntries.length,
            prevExits: prevExits.length,
            entryValue,
            exitValue,
            totalMovements: currentMov.length,
            prevMovements: previousMov.length,
            dailyMovements: dailyData,
            anomalyCount: products.reduce((sum, p) => sum + (p.anomalies?.length || 0), 0)
        }
    }, [products, movements, selectedPeriod])

    // Use centralized FormatService for consistent CAD formatting
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val || 0)
    }

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Dashboard</h2>
                <PeriodSelector
                    value={selectedPeriod}
                    onChange={handlePeriodChange}
                    options={periodOptions}
                />
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Valor em Estoque"
                    value={formatCurrency(stats.totalValue)}
                    subtitle={`${stats.totalProducts} produtos`}
                    color="violet"
                    icon="💰"
                    delay={0}
                />

                <KPICard
                    title="Entradas"
                    value={`+${stats.entries}`}
                    subtitle={`${formatCurrency(stats.entryValue)} investido`}
                    trend={{ current: stats.entries, previous: stats.prevEntries }}
                    color="emerald"
                    icon="📥"
                    delay={0.05}
                />

                <KPICard
                    title="Saídas"
                    value={`-${stats.exits}`}
                    subtitle={`${formatCurrency(stats.exitValue)} consumido`}
                    trend={{ current: stats.exits, previous: stats.prevExits, inverse: true }}
                    color="rose"
                    icon="📤"
                    delay={0.1}
                />

                <KPICard
                    title="Movimentações"
                    value={stats.totalMovements}
                    sparklineData={stats.dailyMovements}
                    trend={{ current: stats.totalMovements, previous: stats.prevMovements }}
                    color="zinc"
                    icon="📊"
                    delay={0.15}
                />
            </div>

            {/* Alerts Summary */}
            {stats.anomalyCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-500/20"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl animate-pulse">⚠️</span>
                        <div>
                            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                                {stats.anomalyCount} {stats.anomalyCount === 1 ? 'alerta detectado' : 'alertas detectados'}
                            </p>
                            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                                Verifique os produtos com indicadores de anomalia
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export { KPICard, Sparkline, TrendIndicator, PeriodSelector }
