import React from 'react'
import { motion } from 'framer-motion'

/**
 * ForecastCard - Apple-Quality Stock Forecast Component
 * Features: Stockout prediction, restock suggestions, trend analysis
 */

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : '-'

// Trend Badge
function TrendBadge({ trend }) {
    const configs = {
        increasing: { label: 'Consumo ↑', color: 'rose', icon: '📈' },
        decreasing: { label: 'Consumo ↓', color: 'emerald', icon: '📉' },
        stable: { label: 'Estável', color: 'zinc', icon: '📊' }
    }
    const config = configs[trend] || configs.stable

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ${config.color === 'rose' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600' :
                config.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' :
                    'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
            }`}>
            <span>{config.icon}</span>
            {config.label}
        </div>
    )
}

// Confidence Badge
function ConfidenceBadge({ confidence }) {
    const colors = {
        high: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20',
        medium: 'text-amber-600 bg-amber-100 dark:bg-amber-500/20',
        low: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-700'
    }

    return (
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${colors[confidence] || colors.low}`}>
            {confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Média' : 'Baixa'} confiança
        </span>
    )
}

// Urgency Indicator
function UrgencyIndicator({ daysUntilStockout }) {
    if (daysUntilStockout === Infinity) {
        return (
            <div className="text-center py-4">
                <span className="text-3xl mb-2 block">✨</span>
                <p className="text-sm font-medium text-zinc-500">Sem previsão de fim</p>
            </div>
        )
    }

    const isUrgent = daysUntilStockout <= 3
    const isCritical = daysUntilStockout <= 7

    return (
        <div className={`text-center py-4 px-5 rounded-2xl ${isUrgent ? 'bg-rose-50 dark:bg-rose-500/10' :
                isCritical ? 'bg-amber-50 dark:bg-amber-500/10' :
                    'bg-zinc-50 dark:bg-zinc-800/50'
            }`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Estoque acaba em
            </p>
            <p className={`text-4xl font-bold tabular-nums ${isUrgent ? 'text-rose-600' :
                    isCritical ? 'text-amber-600' :
                        'text-zinc-900 dark:text-white'
                }`}>
                {daysUntilStockout}
                <span className="text-lg font-medium text-zinc-400 ml-1">dias</span>
            </p>
            {isUrgent && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-rose-600 font-medium mt-2 animate-pulse"
                >
                    ⚠️ Reposição urgente!
                </motion.p>
            )}
        </div>
    )
}

// Projection Chart
function ProjectionChart({ projection, height = 60 }) {
    if (!projection || projection.length < 2) return null

    const width = 200
    const padding = 8
    const maxStock = Math.max(...projection.map(p => p.stock))
    const chartHeight = height - padding * 2
    const chartWidth = width - padding * 2

    const points = projection.map((p, i) => ({
        x: padding + (i / (projection.length - 1)) * chartWidth,
        y: padding + chartHeight - (p.stock / (maxStock || 1)) * chartHeight
    }))

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

    return (
        <div className="mt-4">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Projeção de Estoque</p>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                <defs>
                    <linearGradient id="projGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
                    fill="url(#projGradient)"
                />
                <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
                {projection.filter((_, i) => i === 0 || i === projection.length - 1).map((p, i) => {
                    const pt = i === 0 ? points[0] : points[points.length - 1]
                    return (
                        <g key={i}>
                            <circle cx={pt.x} cy={pt.y} r="4" fill="#8b5cf6" />
                            <text x={pt.x} y={height - 2} textAnchor={i === 0 ? 'start' : 'end'} className="text-[8px] fill-zinc-400">
                                {formatDate(p.date)}
                            </text>
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}

// Main Component
export default function ForecastCard({ forecast, product }) {
    if (!forecast) return null

    const {
        dailyConsumption,
        daysUntilStockout,
        restock,
        suggestedOrderQty,
        trend,
        projection,
        confidence,
        unit
    } = forecast

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 p-5 shadow-sm"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-white truncate">
                        {product?.name || 'Previsão'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                        <TrendBadge trend={trend} />
                        <ConfidenceBadge confidence={confidence} />
                    </div>
                </div>
            </div>

            {/* Urgency */}
            <UrgencyIndicator daysUntilStockout={daysUntilStockout} />

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Consumo/dia</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                        {dailyConsumption?.toFixed(1) || '0'} {unit}
                    </p>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase">Sugerido</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                        +{suggestedOrderQty || 0} {unit}
                    </p>
                </div>
                <div className="text-center p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl">
                    <p className="text-[9px] font-bold text-violet-600 uppercase">Repor em</p>
                    <p className="text-sm font-bold text-violet-700 dark:text-violet-300">
                        {restock?.daysUntil > 0 ? `${restock.daysUntil}d` : 'Agora!'}
                    </p>
                </div>
            </div>

            {/* Projection Chart */}
            <ProjectionChart projection={projection} />

            {/* Restock Alert */}
            {restock?.urgent && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-200 dark:border-rose-500/20"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl animate-pulse">🚨</span>
                        <div>
                            <p className="text-sm font-bold text-rose-700 dark:text-rose-300">Reposição Urgente</p>
                            <p className="text-xs text-rose-600/70">Faça o pedido imediatamente para evitar ruptura</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}

export { TrendBadge, ConfidenceBadge, UrgencyIndicator, ProjectionChart }
