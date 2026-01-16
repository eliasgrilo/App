/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SPARKLINE — Apple-Style Mini Trend Chart
 * 
 * Inline mini-chart showing 7-day trend with:
 * - SVG-based crisp rendering
 * - Gradient fill with Apple colors
 * - Hover tooltip with values
 * - Responsive sizing
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type TrendDirection = 'up' | 'down' | 'stable'

interface SparklineProps {
    data: number[]
    width?: number
    height?: number
    strokeWidth?: number
    showTooltip?: boolean
    showArea?: boolean
    color?: 'auto' | 'green' | 'red' | 'blue' | 'neutral'
    className?: string
    labels?: string[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS — Apple Official Semantic Palette (HIG Compliant)
// Reference: https://developer.apple.com/design/human-interface-guidelines/color
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
    green: { stroke: '#34C759', fill: 'rgba(52, 199, 89, 0.12)' },   // Apple Green
    red: { stroke: '#FF3B30', fill: 'rgba(255, 59, 48, 0.12)' },     // Apple Red
    blue: { stroke: '#007AFF', fill: 'rgba(0, 122, 255, 0.12)' },    // Apple Blue
    neutral: { stroke: '#86868b', fill: 'rgba(134, 134, 139, 0.08)' } // Apple Secondary Label
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const getTrend = (data: number[]): TrendDirection => {
    if (data.length < 2) return 'stable'
    const first = data[0]!
    const last = data[data.length - 1]!
    const change = ((last - first) / first) * 100
    if (change > 2) return 'up'
    if (change < -2) return 'down'
    return 'stable'
}

const getAutoColor = (trend: TrendDirection) => {
    if (trend === 'up') return COLORS.green
    if (trend === 'down') return COLORS.red
    return COLORS.neutral
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const Sparkline: React.FC<SparklineProps> = ({
    data,
    width = 80,
    height = 24,
    strokeWidth = 1.5,
    showTooltip = true,
    showArea = true,
    color = 'auto',
    className = '',
    labels = []
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    // Calculate path data
    const { path, areaPath, points, colors, trend, min, max } = useMemo(() => {
        if (data.length < 2) {
            return {
                path: '',
                areaPath: '',
                points: [],
                colors: COLORS.neutral,
                trend: 'stable' as TrendDirection,
                min: 0,
                max: 0
            }
        }

        const minVal = Math.min(...data)
        const maxVal = Math.max(...data)
        const range = maxVal - minVal || 1

        // Padding
        const padding = 2
        const chartWidth = width - padding * 2
        const chartHeight = height - padding * 2

        // Calculate points
        const pts = data.map((value, i) => ({
            x: padding + (i / (data.length - 1)) * chartWidth,
            y: padding + chartHeight - ((value - minVal) / range) * chartHeight,
            value
        }))

        // Build SVG path (smooth curve)
        let d = `M ${pts[0]!.x} ${pts[0]!.y}`

        for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1]!
            const curr = pts[i]!
            const cpx = (prev.x + curr.x) / 2
            d += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`
            if (i === pts.length - 1) {
                d += ` T ${curr.x} ${curr.y}`
            }
        }

        // Simple line path as fallback
        const simplePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

        // Area path (line + close)
        const areaP = `${simplePath} L ${pts[pts.length - 1]!.x} ${height - padding} L ${pts[0]!.x} ${height - padding} Z`

        const t = getTrend(data)
        const c = color === 'auto' ? getAutoColor(t) : COLORS[color]

        return {
            path: simplePath,
            areaPath: areaP,
            points: pts,
            colors: c,
            trend: t,
            min: minVal,
            max: maxVal
        }
    }, [data, width, height, color])

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!showTooltip || points.length === 0) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left

        // Find closest point
        let closest = 0
        let closestDist = Infinity
        points.forEach((p, i) => {
            const dist = Math.abs(p.x - x)
            if (dist < closestDist) {
                closestDist = dist
                closest = i
            }
        })

        setHoveredIndex(closest)
        setMousePos({ x: e.clientX, y: e.clientY })
    }

    if (data.length < 2) {
        return (
            <div
                className={`flex items-center justify-center text-xs text-zinc-400 ${className}`}
                style={{ width, height }}
            >
                —
            </div>
        )
    }

    return (
        <div className={`relative inline-block ${className}`}>
            <svg
                width={width}
                height={height}
                className="cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredIndex(null)}
            >
                {/* Gradient definition */}
                <defs>
                    <linearGradient id={`sparkline-gradient-${data.join('-').slice(0, 20)}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={colors.stroke} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area fill */}
                {showArea && (
                    <motion.path
                        d={areaPath}
                        fill={`url(#sparkline-gradient-${data.join('-').slice(0, 20)})`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    />
                )}

                {/* Line */}
                <motion.path
                    d={path}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />

                {/* Hover dot */}
                {hoveredIndex !== null && points[hoveredIndex] && (
                    <motion.circle
                        cx={points[hoveredIndex].x}
                        cy={points[hoveredIndex].y}
                        r={3}
                        fill={colors.stroke}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    />
                )}

                {/* End dot */}
                <circle
                    cx={points[points.length - 1]?.x || 0}
                    cy={points[points.length - 1]?.y || 0}
                    r={2}
                    fill={colors.stroke}
                />
            </svg>

            {/* Tooltip */}
            {showTooltip && hoveredIndex !== null && points[hoveredIndex] && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="
                        fixed z-50 pointer-events-none
                        bg-white dark:bg-zinc-900 
                        border border-zinc-200 dark:border-zinc-700
                        rounded-lg px-2 py-1 shadow-lg
                        text-xs font-medium text-zinc-900 dark:text-white
                    "
                    style={{
                        left: mousePos.x + 10,
                        top: mousePos.y - 30
                    }}
                >
                    {labels[hoveredIndex] ? `${labels[hoveredIndex]}: ` : ''}
                    {points[hoveredIndex].value.toLocaleString('pt-BR')}
                </motion.div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREND SPARKLINE — Shows trend with indicator
// ═══════════════════════════════════════════════════════════════════════════════

interface TrendSparklineProps extends SparklineProps {
    showTrendIndicator?: boolean
}

export const TrendSparkline: React.FC<TrendSparklineProps> = ({
    showTrendIndicator = true,
    ...props
}) => {
    const trend = useMemo(() => getTrend(props.data), [props.data])
    const change = useMemo(() => {
        if (props.data.length < 2) return 0
        const first = props.data[0]!
        const last = props.data[props.data.length - 1]!
        return ((last - first) / first) * 100
    }, [props.data])

    return (
        <div className="flex items-center gap-2">
            <Sparkline {...props} />
            {showTrendIndicator && (
                <span className={`
                    text-xs font-medium tabular-nums
                    ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-zinc-500'}
                `}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                    {Math.abs(change).toFixed(1)}%
                </span>
            )}
        </div>
    )
}

export default Sparkline
