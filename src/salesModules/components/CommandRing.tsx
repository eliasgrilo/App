/**
 * ═══════════════════════════════════════════════════════════════════
 * COMMAND RING — Apple Watch Activity Ring (Refined)
 * Premium glassmorphism, glow effects, smooth animations
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface CommandRingProps {
    progress: number
    revenue: number
    goal: number
    size?: 'sm' | 'md'
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
    }).format(value)
}

export function CommandRing({ progress, revenue, goal, size = 'md' }: CommandRingProps) {
    const dimensions = size === 'sm' ? { w: 120, r: 45, stroke: 10 } : { w: 180, r: 70, stroke: 12 }
    const circumference = 2 * Math.PI * dimensions.r

    const springProgress = useSpring(0, { stiffness: 40, damping: 15 })
    const strokeDashoffset = useTransform(springProgress, [0, 100], [circumference, 0])

    useEffect(() => {
        springProgress.set(Math.min(progress, 100))
    }, [progress, springProgress])

    const isComplete = progress >= 100
    const gradientId = `ring-gradient-${size}`
    const glowId = `ring-glow-${size}`

    return (
        <div className="relative flex items-center justify-center" style={{ width: dimensions.w, height: dimensions.w }}>
            {/* Ambient glow behind ring */}
            <motion.div
                className={`absolute inset-4 rounded-full blur-2xl ${isComplete
                        ? 'bg-gradient-to-br from-amber-400/30 via-yellow-300/20 to-orange-400/30'
                        : 'bg-gradient-to-br from-emerald-400/20 via-teal-300/15 to-cyan-400/20'
                    }`}
                animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            <svg className="w-full h-full -rotate-90 relative z-10" viewBox={`0 0 ${dimensions.w} ${dimensions.w}`}>
                <defs>
                    {/* Gradient */}
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        {isComplete ? (
                            <>
                                <stop offset="0%" stopColor="#F59E0B" />
                                <stop offset="50%" stopColor="#FBBF24" />
                                <stop offset="100%" stopColor="#F97316" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#10B981" />
                                <stop offset="100%" stopColor="#06B6D4" />
                            </>
                        )}
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Outer decorative ring */}
                <circle
                    cx={dimensions.w / 2}
                    cy={dimensions.w / 2}
                    r={dimensions.r + 8}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-zinc-200/50 dark:text-zinc-700/50"
                />

                {/* Background ring */}
                <circle
                    cx={dimensions.w / 2}
                    cy={dimensions.w / 2}
                    r={dimensions.r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={dimensions.stroke}
                    className="text-zinc-100 dark:text-zinc-800"
                />

                {/* Progress ring with glow */}
                <motion.circle
                    cx={dimensions.w / 2}
                    cy={dimensions.w / 2}
                    r={dimensions.r}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={dimensions.stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset }}
                    filter={`url(#${glowId})`}
                />

                {/* Inner decorative ring */}
                <circle
                    cx={dimensions.w / 2}
                    cy={dimensions.w / 2}
                    r={dimensions.r - 8}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-zinc-200/50 dark:text-zinc-700/50"
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <motion.span
                    className={`font-bold tracking-tight ${isComplete ? 'text-amber-500' : 'text-zinc-900 dark:text-white'
                        } ${size === 'sm' ? 'text-xl' : 'text-3xl'}`}
                    key={Math.round(progress)}
                >
                    {Math.round(progress)}%
                </motion.span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                    da meta
                </span>
            </div>

            {/* Shimmer on complete */}
            {isComplete && (
                <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none z-30"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
            )}
        </div>
    )
}

export default CommandRing
