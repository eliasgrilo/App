/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PREMIUM SUMMARY CARD — Apple-Style KPI Display
 * 
 * Premium KPI card with:
 * - Animated number count-up
 * - Comparison badge vs previous period
 * - Sparkline trend
 * - Hover micro-animations
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion } from 'framer-motion'
import { AnimatedNumber, AnimatedCurrency, AnimatedPercent } from './AnimatedNumber'
import { Sparkline } from './Sparkline'
import { ComparisonBadge } from './ComparisonBadge'
import { LucideIcon } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type ValueFormat = 'currency' | 'percent' | 'integer' | 'decimal'

interface PremiumSummaryCardProps {
    title: string
    value: number
    previousValue?: number
    format?: ValueFormat
    icon?: LucideIcon
    iconColor?: string
    trend?: number[]
    trendLabels?: string[]
    subtitle?: string
    className?: string
    size?: 'sm' | 'md' | 'lg'
    inverted?: boolean  // For metrics where lower is better
    delay?: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIZE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const SIZE_CONFIG = {
    sm: {
        padding: 'p-3',
        titleSize: 'text-[10px]',
        valueSize: 'text-lg',
        iconSize: 'w-8 h-8',
        iconInner: 'w-4 h-4',
        sparklineSize: { width: 48, height: 16 },
        gap: 'gap-1'
    },
    md: {
        padding: 'p-4',
        titleSize: 'text-xs',
        valueSize: 'text-2xl',
        iconSize: 'w-10 h-10',
        iconInner: 'w-5 h-5',
        sparklineSize: { width: 64, height: 20 },
        gap: 'gap-1.5'
    },
    lg: {
        padding: 'p-5',
        titleSize: 'text-sm',
        valueSize: 'text-3xl',
        iconSize: 'w-12 h-12',
        iconInner: 'w-6 h-6',
        sparklineSize: { width: 80, height: 24 },
        gap: 'gap-2'
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const PremiumSummaryCard: React.FC<PremiumSummaryCardProps> = ({
    title,
    value,
    previousValue,
    format = 'integer',
    icon: Icon,
    iconColor = 'from-blue-500 to-indigo-600',
    trend,
    trendLabels,
    subtitle,
    className = '',
    size = 'md',
    inverted = false,
    delay = 0
}) => {
    const config = SIZE_CONFIG[size]

    // Render the animated value based on format
    const renderValue = () => {
        const commonProps = {
            value,
            delay,
            className: `font-bold ${config.valueSize} text-zinc-900 dark:text-white`
        }

        switch (format) {
            case 'currency':
                return <AnimatedCurrency {...commonProps} />
            case 'percent':
                return <AnimatedPercent {...commonProps} decimals={1} />
            case 'decimal':
                return <AnimatedNumber {...commonProps} format="decimal" decimals={1} />
            case 'integer':
            default:
                return <AnimatedNumber {...commonProps} format="integer" />
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                delay: delay * 0.1,
                duration: 0.4,
                type: 'spring',
                stiffness: 100
            }}
            whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 }
            }}
            className={`
                ${config.padding} rounded-2xl
                bg-white dark:bg-zinc-900
                border border-zinc-200/60 dark:border-zinc-800
                shadow-sm hover:shadow-md
                transition-shadow duration-300
                ${className}
            `}
        >
            <div className="flex items-start justify-between mb-2">
                <div className={`flex flex-col ${config.gap}`}>
                    {/* Title */}
                    <span className={`
                        ${config.titleSize} font-semibold uppercase tracking-wide
                        text-zinc-500 dark:text-zinc-400
                    `}>
                        {title}
                    </span>

                    {/* Value with comparison */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {renderValue()}

                        {previousValue !== undefined && (
                            <ComparisonBadge
                                current={value}
                                previous={previousValue}
                                inverted={inverted}
                                size={size === 'lg' ? 'md' : 'sm'}
                            />
                        )}
                    </div>

                    {/* Subtitle */}
                    {subtitle && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            {subtitle}
                        </span>
                    )}
                </div>

                {/* Icon */}
                {Icon && (
                    <div className={`
                        ${config.iconSize} rounded-xl
                        bg-gradient-to-br ${iconColor}
                        flex items-center justify-center
                        shadow-lg shadow-blue-500/20
                    `}>
                        <Icon className={`${config.iconInner} text-white`} />
                    </div>
                )}
            </div>

            {/* Sparkline */}
            {trend && trend.length > 1 && (
                <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Sparkline
                        data={trend}
                        width={config.sparklineSize.width}
                        height={config.sparklineSize.height}
                        labels={trendLabels}
                        color="auto"
                    />
                </div>
            )}
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY CARDS GRID — Layout helper
// ═══════════════════════════════════════════════════════════════════════════════

interface SummaryCardsGridProps {
    children: React.ReactNode
    columns?: 2 | 3 | 4
    className?: string
}

export const SummaryCardsGrid: React.FC<SummaryCardsGridProps> = ({
    children,
    columns = 4,
    className = ''
}) => {
    const gridCols = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4'
    }

    return (
        <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
            {children}
        </div>
    )
}

export default PremiumSummaryCard
