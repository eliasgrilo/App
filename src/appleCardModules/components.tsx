// ═══════════════════════════════════════════════════════════════════
// APPLE CARD MODULES — Compound Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { CardHeaderProps, CardMetricProps, CardFooterProps, CardStatProps, CardProgressProps, metricSizeStyles, metricColorStyles, statColorMap, statLabelColorMap, progressColorMap, progressTextColorMap } from './types'

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, badge, action, className = '' }) => (
    <div className={`flex justify-between items-start mb-6 ${className}`}>
        <div>
            {badge && <div className="flex items-center gap-2 mb-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" /><span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{badge}</span></div>}
            {title && <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{title}</h3>}
            {subtitle && <p className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium tracking-wide">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
)

export const CardMetric: React.FC<CardMetricProps> = ({ value, label, size = 'lg', color = 'default', className = '' }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        {label && <span className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest">{label}</span>}
        <div className={`${metricSizeStyles[size]} ${metricColorStyles[color]} font-semibold tracking-tighter tabular-nums leading-none`}>{value}</div>
    </div>
)

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
    <div className={`relative flex gap-6 md:gap-12 mt-8 pt-6 border-t border-zinc-100/80 dark:border-white/5 ${className}`}>{children}</div>
)

export const CardStat: React.FC<CardStatProps> = ({ label, value, color = 'zinc' }) => (
    <div className="flex flex-col gap-1.5">
        <span className={`text-[9px] font-bold ${statLabelColorMap[color]} uppercase tracking-widest`}>{label}</span>
        <span className={`text-2xl md:text-3xl font-semibold ${statColorMap[color]} tracking-tight tabular-nums`}>{value}</span>
    </div>
)

export const CardProgress: React.FC<CardProgressProps> = ({ value, label, color = 'indigo' }) => (
    <div className="mt-6">
        <div className="flex justify-between items-center mb-1.5 px-0.5">
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
            <span className={`text-[8px] font-bold ${progressTextColorMap[color]}`}>{value}%</span>
        </div>
        <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div className={`h-full ${progressColorMap[color]}`} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
        </div>
    </div>
)
