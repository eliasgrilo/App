/**
 * KPICard — Hero KPI Display Component
 * 
 * Premium animated KPI card with comparison support.
 * @author Padoca Engineering Team
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { MagneticHover, ElasticScale } from './premium'

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 }

interface KPICardProps {
    title: string
    value: string
    change: number
    icon: React.ReactNode
    color: string
    delay?: number
    previousValue?: string | null
    comparisonLabel?: string
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    change,
    icon,
    color,
    delay = 0,
    previousValue,
    comparisonLabel = 'vs mês ant.'
}) => {
    const isPositive = change >= 0

    return (
        <MagneticHover strength={0.05}>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay }}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="
                    relative overflow-hidden
                    bg-white dark:bg-[#1c1c1e]
                    rounded-[24px]
                    p-6
                    border border-black/[0.04] dark:border-white/[0.06]
                    shadow-[0_4px_24px_rgba(0,0,0,0.06)]
                    hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]
                    transition-all duration-300
                    cursor-pointer
                    group
                "
            >
                {/* Animated Gradient Accent */}
                <motion.div
                    className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${color}`}
                    style={{ borderRadius: '24px 24px 0 0' }}
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: delay + 0.2, duration: 0.6, ease: 'easeOut' }}
                />

                {/* Icon with Elastic Scale */}
                <ElasticScale scale={1.03}>
                    <div className={`
                        w-12 h-12 rounded-[14px] mb-4
                        bg-gradient-to-br ${color}
                        flex items-center justify-center
                        shadow-lg
                        transition-transform duration-300
                    `}>
                        {icon}
                    </div>
                </ElasticScale>

                {/* Title */}
                <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.04em] mb-1">
                    {title}
                </p>

                {/* Value with Animation */}
                <motion.h3
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: delay + 0.1 }}
                    className="text-[32px] font-bold text-[#1d1d1f] dark:text-white tracking-[-0.02em] mb-2"
                >
                    {value}
                </motion.h3>

                {/* Previous Value (when comparison is active) */}
                {previousValue && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] text-[#86868b] mb-1"
                    >
                        Anterior: {previousValue}
                    </motion.p>
                )}

                {/* Change Indicator with Pop Animation */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: delay + 0.2 }}
                    className={`
                        inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                        ${isPositive
                            ? 'bg-[#34C759]/10 text-[#34C759]'
                            : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                        }
                    `}
                >
                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span className="text-[13px] font-semibold">{Math.abs(change).toFixed(1)}%</span>
                    <span className="text-[11px] opacity-70">{comparisonLabel}</span>
                </motion.div>
            </motion.div>
        </MagneticHover>
    )
}
