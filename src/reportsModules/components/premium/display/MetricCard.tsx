/**
 * MetricCard — Premium Metric Display Component
 * 
 * Displays metrics with sparklines and trend indicators.
 * @author Padoca Engineering Team
 */

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { GlassCard, GlowHoverCard, ShimmerCard } from './Cards'
import { Sparkline } from '../animation/Sparkline'
import { AnimatedNumber, AnimatedCurrency, AnimatedPercent } from '../animation/AnimatedNumber'
import { ConfettiCelebration } from '../feedback/Celebration'

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC CARD — Premium Metric Display
// ═══════════════════════════════════════════════════════════════════════════════

interface MetricCardProps {
    label: string
    value: number
    format?: 'number' | 'currency' | 'percent'
    trend?: number
    sparklineData?: number[]
    icon?: React.ReactNode
    color?: 'default' | 'emerald' | 'blue' | 'red' | 'amber' | 'purple'
    subtitle?: string
}

const colorToGradient: Record<string, string> = {
    default: 'none',
    emerald: 'emerald',
    blue: 'blue',
    red: 'red',
    amber: 'amber',
    purple: 'purple'
}

const colorToAccent: Record<string, string> = {
    default: 'text-zinc-900 dark:text-white',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    purple: 'text-purple-600 dark:text-purple-400'
}

const colorToSparkline: Record<string, string> = {
    default: '#3B82F6',
    emerald: '#10B981',
    blue: '#3B82F6',
    red: '#EF4444',
    amber: '#F59E0B',
    purple: '#8B5CF6'
}

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    format = 'number',
    trend,
    sparklineData,
    icon,
    color = 'default',
    subtitle
}) => {
    const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus
    const trendColor = trend && trend > 0 ? 'text-emerald-500' : trend && trend < 0 ? 'text-red-500' : 'text-zinc-400'

    return (
        <GlassCard gradient={colorToGradient[color] as any} className="p-5 print:bg-gray-50 print:backdrop-blur-none">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    {icon && <span className={colorToAccent[color]}>{icon}</span>}
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {label}
                    </p>
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                        <TrendIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <p className={`text-3xl font-black ${colorToAccent[color]} tabular-nums`}>
                        {format === 'currency' && <AnimatedCurrency value={value} />}
                        {format === 'percent' && <AnimatedPercent value={value} />}
                        {format === 'number' && <AnimatedNumber value={value} />}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>
                    )}
                </div>
                {sparklineData && sparklineData.length >= 2 && (
                    <Sparkline
                        data={sparklineData}
                        color={colorToSparkline[color]}
                        width={70}
                        height={28}
                    />
                )}
            </div>
        </GlassCard>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO METRIC CARD — Ultimate Premium Metric Display
// ═══════════════════════════════════════════════════════════════════════════════

interface HeroMetricProps {
    label: string
    value: number
    format?: 'currency' | 'percent' | 'number'
    trend?: { value: number; label: string }
    sparklineData?: number[]
    color: 'emerald' | 'blue' | 'red' | 'amber' | 'purple'
    icon?: React.ReactNode
    subtitle?: string
    celebrated?: boolean
}

const heroColors = {
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', glow: '#34C759', sparkline: '#10B981' },
    blue: { text: 'text-blue-600 dark:text-blue-400', glow: '#007AFF', sparkline: '#3B82F6' },
    red: { text: 'text-red-600 dark:text-red-400', glow: '#FF3B30', sparkline: '#EF4444' },
    amber: { text: 'text-amber-600 dark:text-amber-400', glow: '#FF9500', sparkline: '#F59E0B' },
    purple: { text: 'text-purple-600 dark:text-purple-400', glow: '#5856D6', sparkline: '#8B5CF6' }
}

export const HeroMetricCard: React.FC<HeroMetricProps> = ({
    label,
    value,
    format = 'number',
    trend,
    sparklineData,
    color,
    icon,
    subtitle,
    celebrated = false
}) => {
    const colors = heroColors[color]

    return (
        <GlowHoverCard glowColor={colors.glow} className="relative p-5 overflow-hidden">
            <ConfettiCelebration trigger={celebrated} />
            <ShimmerCard className="absolute inset-0 pointer-events-none" shimmerColor={`${colors.glow}30`}>
                <div />
            </ShimmerCard>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {icon && <span className={colors.text}>{icon}</span>}
                        <p className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
                            {label}
                        </p>
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 ${trend.value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {trend.value >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            <span className="text-xs font-medium">{trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%</span>
                        </div>
                    )}
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <p className={`text-xl font-bold tabular-nums tracking-tight ${colors.text}`}>
                            {format === 'currency' && <AnimatedCurrency value={value} />}
                            {format === 'percent' && <AnimatedPercent value={value} />}
                            {format === 'number' && <AnimatedNumber value={value} />}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>
                        )}
                    </div>
                    {sparklineData && sparklineData.length >= 2 && (
                        <Sparkline
                            data={sparklineData}
                            color={colors.sparkline}
                            width={70}
                            height={28}
                        />
                    )}
                </div>
            </div>
        </GlowHoverCard>
    )
}
