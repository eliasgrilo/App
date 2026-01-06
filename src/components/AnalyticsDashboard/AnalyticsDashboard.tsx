// ═══════════════════════════════════════════════════════════════════
// ANALYTICS DASHBOARD CARD — Visual metrics with Sparklines
// ═══════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkline } from '../Sparkline'
import { useAnalyticsStore } from '../../stores/useAnalyticsStore'

interface MetricCardProps {
    title: string
    value: string | number
    subtitle?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    sparklineData?: number[]
    color?: 'indigo' | 'emerald' | 'amber' | 'rose'
    icon?: React.ReactNode
}

const colorClasses = {
    indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-500/10',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-200/50 dark:border-indigo-500/20',
        sparkline: '#6366f1',
        gradient: 'from-indigo-500 to-violet-500'
    },
    emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200/50 dark:border-emerald-500/20',
        sparkline: '#10b981',
        gradient: 'from-emerald-500 to-teal-500'
    },
    amber: {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200/50 dark:border-amber-500/20',
        sparkline: '#f59e0b',
        gradient: 'from-amber-500 to-orange-500'
    },
    rose: {
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-200/50 dark:border-rose-500/20',
        sparkline: '#f43f5e',
        gradient: 'from-rose-500 to-pink-500'
    }
}

function MetricCard({ title, value, subtitle, trend, trendValue, sparklineData, color = 'indigo', icon }: MetricCardProps) {
    const colors = colorClasses[color]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={`relative bg-white dark:bg-zinc-950 rounded-[1.5rem] p-5 border ${colors.border} shadow-lg hover:shadow-xl transition-all group overflow-hidden`}
        >
            {/* Background Gradient on Hover */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-[0.03] dark:opacity-[0.07] blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity duration-500`} />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {icon && (
                            <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text}`}>
                                {icon}
                            </div>
                        )}
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{title}</span>
                    </div>
                    {trend && trendValue && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                trend === 'down' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                            }`}>
                            {trend === 'up' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                            {trend === 'down' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
                            {trendValue}
                        </div>
                    )}
                </div>

                {/* Value */}
                <div className="flex items-end justify-between">
                    <div>
                        <div className={`text-2xl font-bold ${colors.text} tabular-nums tracking-tight`}>{value}</div>
                        {subtitle && <p className="text-[11px] text-zinc-400 mt-0.5">{subtitle}</p>}
                    </div>

                    {/* Sparkline */}
                    {sparklineData && sparklineData.length >= 2 && (
                        <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                            <Sparkline
                                data={sparklineData}
                                width={80}
                                height={32}
                                color={colors.sparkline}
                                strokeWidth={2}
                            />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

export function AnalyticsDashboard() {
    const dailyMetrics = useAnalyticsStore(state => state.dailyMetrics)
    const getWeeklyTrend = useAnalyticsStore(state => state.getWeeklyTrend)

    const weeklyTrend = useMemo(() => getWeeklyTrend(), [getWeeklyTrend])

    // Generate sample data for visualization
    const costTrend = useMemo(() =>
        dailyMetrics.length > 0
            ? dailyMetrics.slice(-7).map(m => m.totalIngredientCost)
            : [100, 120, 95, 140, 110, 130, 125],
        [dailyMetrics])

    const stockTrend = useMemo(() =>
        dailyMetrics.length > 0
            ? dailyMetrics.slice(-7).map(m => m.stockValue)
            : [500, 480, 520, 490, 510, 530, 525],
        [dailyMetrics])

    const recipesTrend = useMemo(() =>
        dailyMetrics.length > 0
            ? dailyMetrics.slice(-7).map(m => m.recipesCreated)
            : [2, 3, 1, 4, 2, 3, 5],
        [dailyMetrics])

    const salesTrend = useMemo(() =>
        dailyMetrics.length > 0
            ? dailyMetrics.slice(-7).map(m => m.totalProductsSold)
            : [45, 52, 48, 61, 55, 58, 63],
        [dailyMetrics])

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Analytics</h3>
                    <p className="text-xs text-zinc-400">Visão geral dos últimos 7 dias</p>
                </div>
                <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Live</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Custo Ingredientes"
                    value={`R$ ${costTrend.reduce((a, b) => a + b, 0).toLocaleString('pt-BR')}`}
                    subtitle="Total semanal"
                    trend={weeklyTrend.direction}
                    trendValue={`${weeklyTrend.percentChange.toFixed(1)}%`}
                    sparklineData={costTrend}
                    color="indigo"
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />

                <MetricCard
                    title="Valor em Estoque"
                    value={`R$ ${stockTrend[stockTrend.length - 1]?.toLocaleString('pt-BR') || '0'}`}
                    subtitle="Valor atual"
                    trend={stockTrend[stockTrend.length - 1]! > stockTrend[stockTrend.length - 2]! ? 'up' : 'down'}
                    trendValue={`${Math.abs(((stockTrend[stockTrend.length - 1]! - stockTrend[stockTrend.length - 2]!) / stockTrend[stockTrend.length - 2]!) * 100).toFixed(1)}%`}
                    sparklineData={stockTrend}
                    color="emerald"
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                />

                <MetricCard
                    title="Receitas Criadas"
                    value={recipesTrend.reduce((a, b) => a + b, 0)}
                    subtitle="Esta semana"
                    sparklineData={recipesTrend}
                    color="amber"
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />

                <MetricCard
                    title="Produtos Vendidos"
                    value={salesTrend.reduce((a, b) => a + b, 0)}
                    subtitle="Esta semana"
                    trend="up"
                    trendValue="+12%"
                    sparklineData={salesTrend}
                    color="rose"
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                />
            </div>
        </div>
    )
}

export default AnalyticsDashboard
