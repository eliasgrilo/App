/**
 * Status Indicators — Visual Status Components
 * 
 * Components for showing status, progress, and indicators.
 * @author Padoca Engineering Team
 */

import React from 'react'
import { motion } from 'framer-motion'
import { AnimatedPercent } from '../animation/AnimatedNumber'

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS BADGE — Animated Status Indicator
// ═══════════════════════════════════════════════════════════════════════════════

interface StatusBadgeProps {
    status: 'success' | 'warning' | 'error' | 'info'
    label: string
    pulse?: boolean
}

const statusColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, pulse = false }) => (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-white/20 dark:border-white/[0.08]">
        <span className="relative flex h-2 w-2">
            {pulse && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusColors[status]} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColors[status]}`} />
        </span>
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
    </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS RING — Circular Progress Indicator
// ═══════════════════════════════════════════════════════════════════════════════

interface ProgressRingProps {
    value: number
    max?: number
    size?: number
    strokeWidth?: number
    color?: string
    showValue?: boolean
    label?: string
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    value,
    max = 100,
    size = 80,
    strokeWidth = 8,
    color = '#007AFF',
    showValue = true,
    label
}) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const progress = Math.min(value / max, 1)

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    className="text-zinc-200 dark:text-zinc-700"
                    strokeWidth={strokeWidth}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - (progress * circumference) }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </svg>
            {showValue && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-zinc-900 dark:text-white">
                        <AnimatedPercent value={value} decimals={0} />
                    </span>
                    {label && <span className="text-[9px] text-zinc-500">{label}</span>}
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PULSE RING — Pulsing Animation for Critical Items
// ═══════════════════════════════════════════════════════════════════════════════

interface PulseRingProps {
    color?: string
    size?: number
    className?: string
}

export const PulseRing: React.FC<PulseRingProps> = ({
    color = '#FF3B30',
    size = 12,
    className = ''
}) => (
    <span className={`relative inline-flex ${className}`}>
        <motion.span
            className="absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.5, 1.5], opacity: [0.75, 0, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
        />
        <span
            className="relative inline-flex rounded-full"
            style={{ width: size, height: size, backgroundColor: color }}
        />
    </span>
)

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE DATA INDICATOR — Real-time Pulsing Dot
// ═══════════════════════════════════════════════════════════════════════════════

interface LiveDataIndicatorProps {
    color?: string
    label?: string
}

export const LiveDataIndicator: React.FC<LiveDataIndicatorProps> = ({
    color = '#34C759',
    label = 'Ao vivo'
}) => (
    <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
            <motion.span
                className="absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: color }}
                animate={{ scale: [1, 1.5], opacity: [0.75, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
            />
            <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: color }}
            />
        </span>
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
)
