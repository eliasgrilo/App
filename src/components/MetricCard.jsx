/**
 * MetricCard - Animated Metric Display Component
 * 
 * Features:
 * - Animated counter with spring physics
 * - Status indicator dot
 * - Progress bar
 * - Hover micro-interactions
 * - Compact and expanded variants
 */

import React, { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────
// Animated Number Component
// ─────────────────────────────────────────────────────────────────

function AnimatedNumber({ value, formatFn, duration = 1 }) {
    const spring = useSpring(0, {
        stiffness: 100,
        damping: 30,
        duration: duration * 1000
    })

    const display = useTransform(spring, (latest) => {
        if (formatFn) return formatFn(latest)
        return Math.round(latest).toLocaleString()
    })

    useEffect(() => {
        spring.set(value)
    }, [value, spring])

    return <motion.span>{display}</motion.span>
}

// ─────────────────────────────────────────────────────────────────
// Status Indicator
// ─────────────────────────────────────────────────────────────────

function StatusDot({ status = 'active', pulse = false }) {
    const colors = {
        active: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-rose-500',
        inactive: 'bg-zinc-400'
    }

    const glows = {
        active: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]',
        warning: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]',
        danger: 'shadow-[0_0_8px_rgba(244,63,94,0.4)]',
        inactive: ''
    }

    return (
        <div className={`
            w-1.5 h-1.5 rounded-full
            ${colors[status]}
            ${glows[status]}
            ${pulse ? 'animate-pulse' : ''}
        `} />
    )
}

// ─────────────────────────────────────────────────────────────────
// Main MetricCard Component
// ─────────────────────────────────────────────────────────────────

export default function MetricCard({
    title,
    value,
    subtitle,
    status = 'active',
    accentColor = 'indigo', // 'indigo' | 'emerald' | 'violet' | 'amber' | 'orange' | 'rose'
    progress,
    progressLabel,
    formatFn,
    animated = true,
    compact = false,
    className = '',
    onClick
}) {
    // Accent color map
    const accentMap = {
        indigo: {
            dot: 'bg-indigo-500',
            dotGlow: 'shadow-[0_0_8px_rgba(99,102,241,0.4)]',
            text: 'text-indigo-500',
            progress: 'bg-indigo-500/80'
        },
        emerald: {
            dot: 'bg-emerald-500',
            dotGlow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]',
            text: 'text-emerald-500',
            progress: 'bg-emerald-500/80'
        },
        violet: {
            dot: 'bg-violet-500',
            dotGlow: 'shadow-[0_0_8px_rgba(139,92,246,0.4)]',
            text: 'text-violet-500',
            progress: 'bg-violet-500/80'
        },
        amber: {
            dot: 'bg-amber-500',
            dotGlow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]',
            text: 'text-amber-500',
            progress: 'bg-amber-500/80'
        },
        orange: {
            dot: 'bg-orange-500',
            dotGlow: 'shadow-[0_0_8px_rgba(249,115,22,0.4)]',
            text: 'text-orange-500',
            progress: 'bg-orange-500/80'
        },
        rose: {
            dot: 'bg-rose-500',
            dotGlow: 'shadow-[0_0_8px_rgba(244,63,94,0.4)]',
            text: 'text-rose-500',
            progress: 'bg-rose-500/80'
        }
    }

    const accent = accentMap[accentColor]

    return (
        <motion.div
            whileHover={{ y: -4 }}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`
                bg-white/80 dark:bg-zinc-900/60 
                backdrop-blur-3xl 
                rounded-[2rem] 
                ${compact ? 'p-4' : 'p-6'}
                border border-zinc-200/50 dark:border-white/5 
                flex flex-col justify-between 
                group shadow-sm hover:shadow-md 
                transition-all
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${accent.dot} ${accent.dotGlow}`} />
                    <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">
                        {title}
                    </h3>
                </div>

                {/* Value */}
                <div className={`
                    ${compact ? 'text-2xl' : 'text-3xl'} 
                    font-semibold text-zinc-900 dark:text-zinc-100 
                    tabular-nums tracking-tight
                `}>
                    {animated && typeof value === 'number' ? (
                        <AnimatedNumber value={value} formatFn={formatFn} />
                    ) : (
                        formatFn ? formatFn(value) : value
                    )}
                </div>

                {/* Subtitle */}
                {subtitle && (
                    <p className="text-[9px] text-zinc-400 mt-1 font-medium">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Progress Bar */}
            {progress !== undefined && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-1.5 px-0.5">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                            {progressLabel || 'Progress'}
                        </span>
                        <span className={`text-[8px] font-bold ${accent.text}`}>
                            {progress}%
                        </span>
                    </div>
                    <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${accent.progress}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Compound: Metric Grid
// ─────────────────────────────────────────────────────────────────

MetricCard.Grid = function MetricGrid({ children, cols = 4, className = '' }) {
    return (
        <div className={`
            grid grid-cols-1 md:grid-cols-${cols} 
            gap-3 md:gap-4
            ${className}
        `}>
            {children}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Compound: Large Hero Metric
// ─────────────────────────────────────────────────────────────────

MetricCard.Hero = function MetricHero({
    title,
    badge,
    value,
    subtitle,
    stats = [],
    formatFn,
    className = ''
}) {
    return (
        <div className={`
            relative group
            md:col-span-2
            bg-white dark:bg-zinc-950 
            rounded-[2rem] md:rounded-[2.5rem] 
            p-6 md:p-10 
            border border-zinc-200/50 dark:border-white/10 
            shadow-xl overflow-hidden 
            flex flex-col justify-between 
            transition-all duration-500 hover:shadow-2xl
            ${className}
        `}>
            {/* Mesh Gradient Hover Effect */}
            <div className="
                absolute top-0 right-0 w-80 h-80 
                bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] 
                blur-[100px] rounded-full 
                -translate-y-1/2 translate-x-1/2 
                opacity-0 group-hover:opacity-100 
                transition-opacity duration-1000
                pointer-events-none
            " />

            <div className="relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h3 className="text-[10px] font-bold text-zinc-400 dark:text-indigo-300/60 uppercase tracking-widest mb-1">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {badge && (
                        <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">
                                {badge}
                            </span>
                        </div>
                    )}
                </div>

                {/* Main Value */}
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest ml-1">
                        Total
                    </span>
                    <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none">
                        {formatFn ? formatFn(value) : value}
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            {stats.length > 0 && (
                <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100 dark:border-white/5">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5">
                            <span className={`text-[9px] font-bold ${stat.color || 'text-zinc-400 dark:text-white/30'} uppercase tracking-widest`}>
                                {stat.label}
                            </span>
                            <span className={`text-2xl md:text-3xl font-semibold ${stat.valueColor || 'text-zinc-800 dark:text-white/90'} tracking-tight tabular-nums`}>
                                {stat.formatFn ? stat.formatFn(stat.value) : stat.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
