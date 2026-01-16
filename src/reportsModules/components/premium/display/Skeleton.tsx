/**
 * Skeleton Components — Premium Loading States
 * 
 * Loading placeholder components with shimmer animations.
 * @author Padoca Engineering Team
 */

import React from 'react'
import { motion } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON — Base Loading Placeholder
// ═══════════════════════════════════════════════════════════════════════════════

interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circle' | 'rect'
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
    const baseClasses = 'animate-pulse bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:200%_100%]'
    const variantClasses = {
        text: 'h-4 rounded',
        circle: 'rounded-full',
        rect: 'rounded-xl'
    }

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON WAVE — Loading Skeleton with Wave Animation
// ═══════════════════════════════════════════════════════════════════════════════

interface SkeletonWaveProps {
    width?: string | number
    height?: string | number
    borderRadius?: string | number
    className?: string
}

export const SkeletonWave: React.FC<SkeletonWaveProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    className = ''
}) => (
    <div
        className={`relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 ${className}`}
        style={{ width, height, borderRadius }}
    >
        <motion.div
            className="absolute inset-0"
            style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                backgroundSize: '200% 100%'
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
    </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC CARD SKELETON — Skeleton for MetricCard
// ═══════════════════════════════════════════════════════════════════════════════

export const MetricCardSkeleton: React.FC = () => (
    <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/[0.08]">
        <Skeleton className="h-3 w-20 mb-3" variant="text" />
        <Skeleton className="h-8 w-32 mb-2" variant="text" />
        <Skeleton className="h-6 w-16" variant="rect" />
    </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// CHART LOADING SKELETON — Premium Loading State for Charts
// ═══════════════════════════════════════════════════════════════════════════════

interface ChartLoadingSkeletonProps {
    type?: 'bar' | 'line' | 'pie'
    height?: number
}

export const ChartLoadingSkeleton: React.FC<ChartLoadingSkeletonProps> = ({
    type = 'bar',
    height = 280
}) => (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900/50" style={{ height }}>
        <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {type === 'bar' && (
            <div className="flex items-end justify-around h-full p-6 gap-3">
                {[0.6, 0.8, 0.5, 0.9, 0.7, 0.4, 0.75].map((h, i) => (
                    <motion.div
                        key={i}
                        className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-t-lg"
                        initial={{ height: 0 }}
                        animate={{ height: `${h * 100}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                    />
                ))}
            </div>
        )}

        {type === 'line' && (
            <svg className="w-full h-full p-6" viewBox="0 0 400 200">
                <motion.path
                    d="M 20 150 Q 100 50, 200 100 T 380 80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    className="text-zinc-200 dark:text-zinc-700"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />
            </svg>
        )}
    </div>
)
