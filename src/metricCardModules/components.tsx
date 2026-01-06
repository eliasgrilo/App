// ═══════════════════════════════════════════════════════════════════
// METRIC CARD MODULES — Sub-Components
// AnimatedNumber, StatusDot, MetricGrid, MetricHero
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { AnimatedNumberProps, StatusDotProps, MetricGridProps, MetricHeroProps, statusColors, statusGlows } from './types'

// AnimatedNumber
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, formatFn, duration = 1 }) => {
    const springValue = useSpring(0, { stiffness: 100, damping: 30, duration: duration * 1000 })
    const display = useTransform(springValue, (latest: number) => formatFn ? formatFn(latest) : Math.round(latest).toLocaleString())
    useEffect(() => { springValue.set(value) }, [value, springValue])
    return <motion.span>{display}</motion.span>
}

// StatusDot
export const StatusDot: React.FC<StatusDotProps> = ({ status = 'active', pulse = false }) => (
    <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status]} ${statusGlows[status]} ${pulse ? 'animate-pulse' : ''}`} />
)

// MetricGrid
export const MetricGrid: React.FC<MetricGridProps> = ({ children, cols = 4, className = '' }) => (
    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-3 md:gap-4 ${className}`}>{children}</div>
)

// MetricHero
export const MetricHero: React.FC<MetricHeroProps> = ({ title, badge, value, subtitle, stats = [], formatFn, className = '' }) => (
    <div className={`relative group md:col-span-2 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl ${className}`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative">
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h3 className="text-[10px] font-bold text-zinc-400 dark:text-indigo-300/60 uppercase tracking-widest mb-1">{title}</h3>
                    {subtitle && <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide">{subtitle}</p>}
                </div>
                {badge && <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">{badge}</span></div>}
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest ml-1">Total</span>
                <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none">{formatFn ? formatFn(value) : value}</div>
            </div>
        </div>
        {stats.length > 0 && (
            <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100/80 dark:border-white/5">
                {stats.map((stat, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                        <span className={`text-[9px] font-bold ${stat.color || 'text-zinc-400 dark:text-white/30'} uppercase tracking-widest`}>{stat.label}</span>
                        <span className={`text-2xl md:text-3xl font-semibold ${stat.valueColor || 'text-zinc-800 dark:text-white/90'} tracking-tight tabular-nums`}>{stat.formatFn ? stat.formatFn(stat.value) : stat.value}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
)
