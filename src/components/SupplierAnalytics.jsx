import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * SupplierAnalytics - Apple-Quality Supplier Analysis Component
 * Features: Spending, frequency, reliability score, last delivery
 */

// Currency formatting - CAD (Canadian Dollar)
const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val || 0)
}

const timeAgo = (dateStr) => {
    if (!dateStr) return '-'
    const now = new Date()
    const date = new Date(dateStr)
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 7) return `${days}d atrás`
    if (days < 30) return `${Math.floor(days / 7)}sem`
    return `${Math.floor(days / 30)}mês`
}

// Reliability Score Badge
function ReliabilityBadge({ score }) {
    const getColor = () => {
        if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
        if (score >= 60) return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
        return 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
    }

    const getLabel = () => {
        if (score >= 80) return 'Excelente'
        if (score >= 60) return 'Bom'
        return 'Baixo'
    }

    return (
        <div className={`px-2.5 py-1 rounded-lg ${getColor()}`}>
            <span className="text-[10px] font-bold uppercase tracking-wide">{getLabel()}</span>
        </div>
    )
}

// Sparkline - Apple-Quality Mini Chart
function Sparkline({ data = [], color = 'violet', height = 24, width = 80 }) {
    if (!data || data.length < 2) return null

    const values = data.map(d => typeof d === 'number' ? d : d.value || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    // Generate SVG path points
    const points = values.map((val, i) => {
        const x = (i / (values.length - 1)) * width
        const y = height - ((val - min) / range) * (height - 4) - 2
        return `${x},${y}`
    }).join(' ')

    // Determine trend
    const trend = values[values.length - 1] > values[0] ? 'up' :
        values[values.length - 1] < values[0] ? 'down' : 'stable'

    const colorMap = {
        violet: { stroke: '#8B5CF6', fill: 'rgba(139, 92, 246, 0.1)' },
        emerald: { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.1)' },
        amber: { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.1)' },
        rose: { stroke: '#F43F5E', fill: 'rgba(244, 63, 94, 0.1)' }
    }

    const colors = colorMap[color] || colorMap.violet

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
        >
            <svg width={width} height={height} className="overflow-visible">
                {/* Fill area */}
                <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    d={`M0,${height} L${points} L${width},${height} Z`}
                    fill={colors.fill}
                />
                {/* Line */}
                <motion.polyline
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    points={points}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* End dot */}
                <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: 'spring' }}
                    cx={width}
                    cy={height - ((values[values.length - 1] - min) / range) * (height - 4) - 2}
                    r="2.5"
                    fill={colors.stroke}
                />
            </svg>
            {/* Trend indicator */}
            <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-[8px]">
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </span>
        </motion.div>
    )
}

// Loading Skeleton - Apple-Quality Loading State
function LoadingSkeleton({ className = '' }) {
    return (
        <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`bg-zinc-200 dark:bg-zinc-700 rounded ${className}`}
        />
    )
}

// Progress Bar
function ProgressBar({ value, max, color = 'violet' }) {
    const pct = Math.min(100, (value / max) * 100)
    const colorClasses = {
        violet: 'from-violet-500 to-indigo-500',
        emerald: 'from-emerald-500 to-teal-500',
        amber: 'from-amber-500 to-orange-500'
    }

    return (
        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full`}
            />
        </div>
    )
}

// Metric Card
function MetricCard({ label, value, subtext, color = 'zinc' }) {
    const colorClasses = {
        violet: 'text-violet-600 dark:text-violet-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        amber: 'text-amber-600 dark:text-amber-400',
        zinc: 'text-zinc-600 dark:text-zinc-300'
    }

    return (
        <div className="text-center p-3 bg-white dark:bg-zinc-900 rounded-xl">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-sm font-bold tabular-nums ${colorClasses[color]}`}>{value}</p>
            {subtext && <p className="text-[9px] text-zinc-400 mt-0.5">{subtext}</p>}
        </div>
    )
}

// Supplier Card
function SupplierCard({ supplier, rank, maxValue }) {
    const pct = ((supplier.totalValue / maxValue) * 100).toFixed(0)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.05 }}
            className="bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl p-4 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-violet-500/20">
                    #{rank + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-white truncate">
                        {supplier.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                        {supplier.productCount} produtos • {supplier.movementCount} entregas
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
                        {formatCurrency(supplier.totalValue)}
                    </p>
                    <ReliabilityBadge score={supplier.reliabilityScore} />
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                <MetricCard
                    label="Frequência"
                    value={`${supplier.frequencyScore}%`}
                    color="violet"
                />
                <MetricCard
                    label="30 Dias"
                    value={supplier.recentMovements}
                    subtext="entregas"
                    color="emerald"
                />
                <MetricCard
                    label="Média"
                    value={formatCurrency(supplier.avgOrderValue)}
                    color="amber"
                />
                <MetricCard
                    label="Última"
                    value={timeAgo(supplier.lastDelivery)}
                    color="zinc"
                />
            </div>

            {/* Sparkline Trend - Weekly value history */}
            {supplier.weeklyTrend && supplier.weeklyTrend.length >= 2 && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-white/50 dark:bg-zinc-900/50 rounded-xl">
                    <div className="flex-1">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                            Tendência 30 Dias
                        </p>
                        <Sparkline data={supplier.weeklyTrend} color="violet" width={100} height={24} />
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <ProgressBar value={supplier.totalValue} max={maxValue} color="violet" />
            <p className="text-[10px] text-zinc-400 mt-2 text-right">{pct}% do total</p>
        </motion.div>
    )
}

// Main Component
export default function SupplierAnalytics({ products = [], movements = [] }) {
    const supplierStats = useMemo(() => {
        const suppliers = {}
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

        // Aggregate by supplier
        products.forEach(product => {
            const name = product.supplier || 'Sem Fornecedor'
            if (!suppliers[name]) {
                suppliers[name] = {
                    name,
                    productCount: 0,
                    movementCount: 0,
                    totalValue: 0,
                    recentMovements: 0,
                    lastDelivery: null,
                    avgOrderValue: 0,
                    orderValues: []
                }
            }

            suppliers[name].productCount++

            const productMovements = movements.filter(m => m.productId === product.id && m.type === 'entry')
            productMovements.forEach(m => {
                suppliers[name].movementCount++
                const value = (m.quantity || 0) * (m.price || product.currentPrice || 0)
                suppliers[name].totalValue += value
                suppliers[name].orderValues.push(value)

                const movDate = new Date(m.createdAt).getTime()
                if (movDate > thirtyDaysAgo) {
                    suppliers[name].recentMovements++
                }
                if (!suppliers[name].lastDelivery || movDate > new Date(suppliers[name].lastDelivery).getTime()) {
                    suppliers[name].lastDelivery = m.createdAt
                }
            })
        })

        // Calculate scores
        const maxMovements = Math.max(...Object.values(suppliers).map(s => s.recentMovements), 1)

        return Object.values(suppliers)
            .map(s => ({
                ...s,
                avgOrderValue: s.orderValues.length > 0
                    ? s.orderValues.reduce((a, b) => a + b, 0) / s.orderValues.length
                    : 0,
                frequencyScore: Math.round((s.recentMovements / maxMovements) * 100),
                reliabilityScore: Math.min(100, Math.round(
                    (s.recentMovements / maxMovements) * 50 + // Frequency contribution
                    (s.movementCount > 10 ? 30 : s.movementCount * 3) + // History contribution
                    (s.lastDelivery && Date.now() - new Date(s.lastDelivery).getTime() < 7 * 24 * 60 * 60 * 1000 ? 20 : 0) // Recency bonus
                )),
                // Generate weekly trend from recent order values (last 4 weeks)
                weeklyTrend: s.orderValues.length >= 2
                    ? s.orderValues.slice(-8).reduce((acc, val, i, arr) => {
                        // Group into 4 periods
                        const periodSize = Math.ceil(arr.length / 4)
                        const periodIdx = Math.floor(i / periodSize)
                        if (!acc[periodIdx]) acc[periodIdx] = 0
                        acc[periodIdx] += val
                        return acc
                    }, []).filter(v => v > 0)
                    : []
            }))
            .filter(s => s.movementCount > 0)
            .sort((a, b) => b.totalValue - a.totalValue)
    }, [products, movements])

    if (supplierStats.length === 0) {
        return (
            <div className="text-center py-12">
                <span className="text-4xl mb-3 block">📦</span>
                <p className="text-sm text-zinc-400">Nenhum fornecedor encontrado</p>
                <p className="text-xs text-zinc-400 mt-1">Adicione produtos com fornecedores para ver análises</p>
            </div>
        )
    }

    const maxValue = supplierStats[0]?.totalValue || 1
    const totalSpent = supplierStats.reduce((sum, s) => sum + s.totalValue, 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Análise de Fornecedores</h3>
                    <p className="text-xs text-zinc-400">Últimos 30 dias</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-zinc-400">Total investido</p>
                    <p className="text-xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                        {formatCurrency(totalSpent)}
                    </p>
                </div>
            </div>

            {/* Supplier List */}
            <div className="space-y-3">
                {supplierStats.slice(0, 5).map((supplier, i) => (
                    <SupplierCard
                        key={supplier.name}
                        supplier={supplier}
                        rank={i}
                        maxValue={maxValue}
                    />
                ))}
            </div>

            {supplierStats.length > 5 && (
                <p className="text-center text-xs text-zinc-400">
                    e mais {supplierStats.length - 5} fornecedores
                </p>
            )}
        </div>
    )
}

export { SupplierCard, MetricCard, ReliabilityBadge, Sparkline, LoadingSkeleton }
