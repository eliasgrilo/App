/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COMPARISON BADGE — Apple-Style Period Comparison
 * 
 * Shows change vs previous period with:
 * - Green/red color coding
 * - Percentage and absolute change
 * - Arrow indicators
 * - Animated entrance
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ComparisonBadgeProps {
    current: number
    previous: number
    format?: 'percent' | 'absolute' | 'both'
    inverted?: boolean  // For metrics where lower is better (like waste)
    size?: 'sm' | 'md' | 'lg'
    showIcon?: boolean
    className?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const ComparisonBadge: React.FC<ComparisonBadgeProps> = ({
    current,
    previous,
    format = 'percent',
    inverted = false,
    size = 'md',
    showIcon = true,
    className = ''
}) => {
    // Calculate change
    const absoluteChange = current - previous
    const percentChange = previous !== 0 ? ((current - previous) / previous) * 100 : 0

    // Determine if change is positive (considering inverted)
    const isPositive = inverted ? absoluteChange < 0 : absoluteChange > 0
    const isNeutral = Math.abs(percentChange) < 0.5

    // Format display value
    const formatValue = () => {
        const absPercent = Math.abs(percentChange)
        const absValue = Math.abs(absoluteChange)

        switch (format) {
            case 'absolute':
                return absValue.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
            case 'both':
                return `${absPercent.toFixed(1)}% (${absValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})`
            case 'percent':
            default:
                return `${absPercent.toFixed(1)}%`
        }
    }

    // Size styles
    const sizeStyles = {
        sm: {
            padding: 'px-1.5 py-0.5',
            text: 'text-[10px]',
            icon: 'w-2.5 h-2.5',
            gap: 'gap-0.5'
        },
        md: {
            padding: 'px-2 py-1',
            text: 'text-xs',
            icon: 'w-3 h-3',
            gap: 'gap-1'
        },
        lg: {
            padding: 'px-2.5 py-1.5',
            text: 'text-sm',
            icon: 'w-4 h-4',
            gap: 'gap-1.5'
        }
    }

    const styles = sizeStyles[size]

    // Color classes
    const colorClasses = isNeutral
        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
        : isPositive
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400'

    // Icon component
    const IconComponent = isNeutral
        ? Minus
        : isPositive
            ? TrendingUp
            : TrendingDown

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`
                inline-flex items-center ${styles.gap} ${styles.padding}
                rounded-full font-medium ${styles.text}
                ${colorClasses}
                ${className}
            `}
        >
            {showIcon && <IconComponent className={styles.icon} />}
            <span className="tabular-nums">
                {!isNeutral && (isPositive ? '+' : '-')}
                {formatValue()}
            </span>
        </motion.span>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE COMPARISON — For table cells
// ═══════════════════════════════════════════════════════════════════════════════

interface InlineComparisonProps {
    current: number
    previous: number
    inverted?: boolean
}

export const InlineComparison: React.FC<InlineComparisonProps> = ({
    current,
    previous,
    inverted = false
}) => {
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0
    const isPositive = inverted ? change < 0 : change > 0
    const isNeutral = Math.abs(change) < 0.5

    return (
        <span className={`
            text-xs font-medium ml-1 tabular-nums
            ${isNeutral ? 'text-zinc-400' : isPositive ? 'text-emerald-600' : 'text-red-600'}
        `}>
            {isNeutral ? '→' : isPositive ? '↑' : '↓'}
            {Math.abs(change).toFixed(1)}%
        </span>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARISON INDICATOR — Minimal dot indicator
// ═══════════════════════════════════════════════════════════════════════════════

interface ComparisonIndicatorProps {
    current: number
    previous: number
    inverted?: boolean
}

export const ComparisonIndicator: React.FC<ComparisonIndicatorProps> = ({
    current,
    previous,
    inverted = false
}) => {
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0
    const isPositive = inverted ? change < 0 : change > 0
    const isNeutral = Math.abs(change) < 0.5

    return (
        <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
                inline-block w-2 h-2 rounded-full ml-1
                ${isNeutral ? 'bg-zinc-300' : isPositive ? 'bg-emerald-500' : 'bg-red-500'}
            `}
            title={`${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs período anterior`}
        />
    )
}

export default ComparisonBadge
