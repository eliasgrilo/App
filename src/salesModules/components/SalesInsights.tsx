/**
 * ═══════════════════════════════════════════════════════════════════
 * SALES INSIGHTS — Smart Insight Cards (Refined)
 * Premium glass cards with gradient borders, icons
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion } from 'framer-motion'

interface Insight {
    id: string
    type: 'success' | 'warning' | 'info'
    title: string
    value?: string
}

interface SalesInsightsProps {
    insights: Insight[]
}

const STYLES = {
    success: {
        gradient: 'from-emerald-500/10 via-emerald-400/5 to-transparent',
        border: 'border-emerald-500/20',
        icon: '✓',
        iconBg: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400'
    },
    warning: {
        gradient: 'from-amber-500/10 via-amber-400/5 to-transparent',
        border: 'border-amber-500/20',
        icon: '!',
        iconBg: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400'
    },
    info: {
        gradient: 'from-blue-500/10 via-blue-400/5 to-transparent',
        border: 'border-blue-500/20',
        icon: 'i',
        iconBg: 'bg-blue-500',
        text: 'text-blue-600 dark:text-blue-400'
    }
}

export function SalesInsights({ insights }: SalesInsightsProps) {
    if (insights.length === 0) return null

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="text-sm"
                >
                    💡
                </motion.span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Insights
                </span>
            </div>

            <div className="space-y-2">
                {insights.map((insight, i) => {
                    const style = STYLES[insight.type]
                    return (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1, ease: [0.32, 0.72, 0, 1] }}
                            className={`relative overflow-hidden flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r ${style.gradient} border ${style.border} backdrop-blur-sm`}
                        >
                            {/* Icon */}
                            <div className={`w-7 h-7 rounded-lg ${style.iconBg} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                                {style.icon}
                            </div>

                            {/* Content */}
                            <span className={`flex-1 text-sm font-medium ${style.text}`}>
                                {insight.title}
                            </span>

                            {/* Value */}
                            {insight.value && (
                                <span className={`text-sm font-bold ${style.text}`}>
                                    {insight.value}
                                </span>
                            )}

                            {/* Subtle decoration */}
                            <div className="absolute top-0 right-0 w-20 h-20 opacity-10 pointer-events-none">
                                <svg viewBox="0 0 80 80" className="w-full h-full">
                                    <circle cx="60" cy="20" r="40" fill="currentColor" className={style.text} />
                                </svg>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

export default SalesInsights
