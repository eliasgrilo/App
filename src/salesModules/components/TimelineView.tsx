/**
 * ═══════════════════════════════════════════════════════════════════
 * TIMELINE VIEW — Visual Order Timeline (Refined)
 * Premium visual with gradient bars, glowing current time
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion } from 'framer-motion'
import type { Order } from '../types'

interface TimelineViewProps {
    orders: Order[]
}

export function TimelineView({ orders }: TimelineViewProps) {
    const hours = Array.from({ length: 15 }, (_, i) => i + 8)
    const currentHour = new Date().getHours()

    const hourlyCount: Record<number, number> = {}
    const hourlyRevenue: Record<number, number> = {}
    orders.forEach(o => {
        const hour = o.createdAt.getHours()
        hourlyCount[hour] = (hourlyCount[hour] || 0) + 1
        hourlyRevenue[hour] = (hourlyRevenue[hour] || 0) + o.total
    })

    const maxCount = Math.max(...Object.values(hourlyCount), 1)

    return (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)] p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Timeline
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    Hoje
                </span>
            </div>

            {/* Timeline bars */}
            <div className="relative h-24">
                {/* Background grid */}
                <div className="absolute inset-0 flex justify-between opacity-30">
                    {hours.map((_, i) => (
                        <div key={i} className="w-px bg-zinc-200 dark:bg-zinc-700" />
                    ))}
                </div>

                {/* Bars */}
                <div className="relative h-full flex items-end justify-between gap-1">
                    {hours.map((hour, i) => {
                        const count = hourlyCount[hour] || 0
                        const height = count > 0 ? Math.max((count / maxCount) * 100, 15) : 4
                        const isCurrent = hour === currentHour
                        const isPast = hour < currentHour

                        return (
                            <div key={hour} className="flex-1 flex flex-col items-center group">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: i * 0.02, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                    className={`w-full rounded-t-lg relative overflow-hidden ${isCurrent
                                            ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                                            : count > 0
                                                ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                                                : isPast
                                                    ? 'bg-zinc-200 dark:bg-zinc-700'
                                                    : 'bg-zinc-100 dark:bg-zinc-800'
                                        }`}
                                    style={isCurrent || count > 0 ? {
                                        boxShadow: isCurrent
                                            ? '0 0 12px rgba(59, 130, 246, 0.4)'
                                            : '0 0 8px rgba(16, 185, 129, 0.3)'
                                    } : {}}
                                >
                                    {/* Shimmer */}
                                    {(isCurrent || count > 0) && (
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent"
                                            initial={{ y: '100%' }}
                                            animate={{ y: '-100%' }}
                                            transition={{ duration: 1.5, delay: i * 0.05 }}
                                        />
                                    )}
                                </motion.div>

                                {/* Tooltip */}
                                {count > 0 && (
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 scale-90 group-hover:scale-100">
                                        <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap shadow-xl">
                                            {count} pedido{count > 1 ? 's' : ''}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Hour labels */}
            <div className="flex justify-between mt-2">
                {hours.filter((_, i) => i % 3 === 0).map(hour => (
                    <span
                        key={hour}
                        className={`text-[10px] tabular-nums ${hour === currentHour
                                ? 'text-blue-500 font-semibold'
                                : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                    >
                        {hour}h
                    </span>
                ))}
            </div>
        </div>
    )
}

export default TimelineView
