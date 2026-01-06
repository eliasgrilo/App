// ═══════════════════════════════════════════════════════════════════
// SPARKLINE CHART — Mini performance chart
// ═══════════════════════════════════════════════════════════════════

import React from 'react'

interface SparklineProps {
    data: number[]
    width?: number
    height?: number
    color?: string
    gradientColor?: string
    strokeWidth?: number
    showDots?: boolean
}

export function Sparkline({
    data,
    width = 100,
    height = 32,
    color = '#6366f1',
    gradientColor,
    strokeWidth = 2,
    showDots = false,
}: SparklineProps) {
    const effectiveGradientColor = gradientColor ?? color

    if (data.length < 2) return null

    const padding = 4
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth
        const y = padding + (1 - (value - min) / range) * chartHeight
        return { x, y }
    })

    const pathData = points
        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ')

    // Create smooth curve path
    const lastPoint = points[points.length - 1]
    const areaPath = lastPoint
        ? `${pathData} L ${lastPoint.x} ${height - padding} L ${padding} ${height - padding} Z`
        : pathData

    const gradientId = `sparkline-gradient-${Math.random().toString(36).slice(2)}`

    return (
        <svg width={width} height={height} className="overflow-visible">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={effectiveGradientColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={effectiveGradientColor} stopOpacity={0} />
                </linearGradient>
            </defs>

            {/* Area fill */}
            <path
                d={areaPath}
                fill={`url(#${gradientId})`}
            />

            {/* Line */}
            <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Dots */}
            {showDots && points.map((point, i) => (
                <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r={3}
                    fill="white"
                    stroke={color}
                    strokeWidth={1.5}
                />
            ))}

            {/* Last point highlight */}
            {lastPoint && (
                <circle
                    cx={lastPoint.x}
                    cy={lastPoint.y}
                    r={4}
                    fill={color}
                />
            )}
        </svg>
    )
}

// Preset trend indicators
export function TrendSparkline({ data, trend }: { data: number[]; trend: 'up' | 'down' | 'neutral' }) {
    const colors = {
        up: '#10b981',
        down: '#ef4444',
        neutral: '#71717a'
    }

    return <Sparkline data={data} color={colors[trend]} />
}

export default Sparkline
