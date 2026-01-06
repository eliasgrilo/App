// ═══════════════════════════════════════════════════════════════════
// METRIC CARD — Animated Metric Display Component
// Refactored: 368 → ~70 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { MetricCardProps, accentMap, AnimatedNumber, MetricGrid, MetricHero } from '../metricCardModules'

function MetricCardComponent({ title, value, subtitle, accentColor = 'indigo', progress, progressLabel, formatFn, animated = true, compact = false, className = '', onClick }: MetricCardProps) {
    const accent = accentMap[accentColor]

    return (
        <motion.div whileHover={{ y: -4 }} whileTap={onClick ? { scale: 0.98 } : undefined} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] ${compact ? 'p-4' : 'p-6'} border border-zinc-200/50 dark:border-white/10 flex flex-col justify-between group shadow-md hover:shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}>
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${accent.dot} ${accent.dotGlow}`} />
                    <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">{title}</h3>
                </div>
                <div className={`${compact ? 'text-2xl' : 'text-3xl'} font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight`}>
                    {animated && typeof value === 'number' ? <AnimatedNumber value={value} formatFn={formatFn as ((value: number) => string) | undefined} /> : formatFn ? formatFn(value) : value}
                </div>
                {subtitle && <p className="text-[9px] text-zinc-400 mt-1 font-medium">{subtitle}</p>}
            </div>
            {progress !== undefined && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-1.5 px-0.5">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{progressLabel || 'Progress'}</span>
                        <span className={`text-[8px] font-bold ${accent.text}`}>{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div className={`h-full ${accent.progress}`} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                    </div>
                </div>
            )}
        </motion.div>
    )
}

const MetricCard = Object.assign(MetricCardComponent, { Grid: MetricGrid, Hero: MetricHero })
export default MetricCard
