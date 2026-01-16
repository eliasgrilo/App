/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANOMALY INDICATOR — Apple-Style Outlier Detection
 * 
 * Visual indicator for unusual values with:
 * - Pulsing animation for critical anomalies
 * - Tooltip with context
 * - Statistical z-score based detection
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type AnomalySeverity = 'critical' | 'warning' | 'info'

interface AnomalyIndicatorProps {
    value: number
    mean: number
    stdDev: number
    thresholds?: {
        warning: number  // z-score threshold for warning
        critical: number // z-score threshold for critical
    }
    context?: string
    showTooltip?: boolean
    size?: 'sm' | 'md' | 'lg'
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const calculateZScore = (value: number, mean: number, stdDev: number): number => {
    if (stdDev === 0) return 0
    return Math.abs((value - mean) / stdDev)
}

const getSeverity = (
    zScore: number,
    thresholds: { warning: number; critical: number }
): AnomalySeverity | null => {
    if (zScore >= thresholds.critical) return 'critical'
    if (zScore >= thresholds.warning) return 'warning'
    return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEVERITY STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const SEVERITY_STYLES = {
    critical: {
        color: 'bg-red-500',
        ring: 'ring-red-500/30',
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/50',
        icon: AlertCircle
    },
    warning: {
        color: 'bg-amber-500',
        ring: 'ring-amber-500/30',
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        icon: AlertTriangle
    },
    info: {
        color: 'bg-blue-500',
        ring: 'ring-blue-500/30',
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/50',
        icon: Info
    }
}

const SIZE_STYLES = {
    sm: { dot: 'w-2 h-2', icon: 'w-3 h-3', tooltip: 'text-[10px]' },
    md: { dot: 'w-2.5 h-2.5', icon: 'w-4 h-4', tooltip: 'text-xs' },
    lg: { dot: 'w-3 h-3', icon: 'w-5 h-5', tooltip: 'text-sm' }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PULSING DOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const PulsingDot: React.FC<{
    severity: AnomalySeverity
    size: 'sm' | 'md' | 'lg'
}> = ({ severity, size }) => {
    const styles = SEVERITY_STYLES[severity]
    const sizeStyles = SIZE_STYLES[size]

    return (
        <motion.span
            className="relative inline-flex"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
            {/* Outer pulsing ring */}
            {severity === 'critical' && (
                <motion.span
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: 'easeInOut'
                    }}
                    className={`
                        absolute inset-0 rounded-full
                        ${styles.color}
                    `}
                />
            )}

            {/* Main dot */}
            <span className={`
                relative ${sizeStyles.dot} rounded-full
                ${styles.color}
                ${severity === 'critical' ? 'ring-4 ' + styles.ring : ''}
            `} />
        </motion.span>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const AnomalyIndicator: React.FC<AnomalyIndicatorProps> = ({
    value,
    mean,
    stdDev,
    thresholds = { warning: 2, critical: 3 },
    context,
    showTooltip = true,
    size = 'md'
}) => {
    const zScore = calculateZScore(value, mean, stdDev)
    const severity = getSeverity(zScore, thresholds)

    // No anomaly detected
    if (!severity) return null

    const styles = SEVERITY_STYLES[severity]
    const sizeStyles = SIZE_STYLES[size]

    const tooltipText = context ||
        `Valor ${zScore.toFixed(1)}σ ${value > mean ? 'acima' : 'abaixo'} da média`

    return (
        <span className="relative inline-flex items-center ml-1.5 group">
            <PulsingDot severity={severity} size={size} />

            {/* Tooltip */}
            {showTooltip && (
                <span className={`
                    absolute left-full ml-2 top-1/2 -translate-y-1/2
                    opacity-0 group-hover:opacity-100
                    pointer-events-none transition-opacity
                    whitespace-nowrap z-50
                    px-2 py-1 rounded-lg
                    ${styles.bg} ${styles.text}
                    ${sizeStyles.tooltip} font-medium
                    shadow-lg
                `}>
                    {tooltipText}
                </span>
            )}
        </span>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANOMALY BADGE — More prominent version
// ═══════════════════════════════════════════════════════════════════════════════

interface AnomalyBadgeProps {
    severity: AnomalySeverity
    message: string
    className?: string
}

export const AnomalyBadge: React.FC<AnomalyBadgeProps> = ({
    severity,
    message,
    className = ''
}) => {
    const styles = SEVERITY_STYLES[severity]
    const Icon = styles.icon

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
                inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
                ${styles.bg} ${styles.text}
                text-xs font-medium
                ${className}
            `}
        >
            <Icon className="w-3.5 h-3.5" />
            {message}
        </motion.span>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLE ANOMALY DOT — Minimal version
// ═══════════════════════════════════════════════════════════════════════════════

interface SimpleAnomalyDotProps {
    isAnomaly: boolean
    severity?: 'warning' | 'critical'
}

export const SimpleAnomalyDot: React.FC<SimpleAnomalyDotProps> = ({
    isAnomaly,
    severity = 'warning'
}) => {
    if (!isAnomaly) return null

    return (
        <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
                inline-block w-1.5 h-1.5 rounded-full ml-1
                ${severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}
            `}
        />
    )
}

export default AnomalyIndicator
