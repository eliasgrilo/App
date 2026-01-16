/**
 * Sparkline — Mini Trend Chart Component
 * 
 * Renders animated mini trend indicator charts.
 * @author Padoca Engineering Team
 */

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface SparklineProps {
    data: number[]
    color?: string
    width?: number
    height?: number
    showArea?: boolean
    animated?: boolean
}

export const Sparkline: React.FC<SparklineProps> = ({
    data,
    color = '#007AFF',
    width = 80,
    height = 24,
    showArea = true,
    animated = true
}) => {
    const [isVisible, setIsVisible] = useState(!animated)

    useEffect(() => {
        if (animated) {
            const timer = setTimeout(() => setIsVisible(true), 100)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [animated])

    if (data.length < 2) return null

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width
        const y = height - ((value - min) / range) * height
        return `${x},${y}`
    }).join(' ')

    const areaPoints = `0,${height} ${points} ${width},${height}`

    return (
        <svg width={width} height={height} className="overflow-visible">
            {showArea && (
                <motion.polygon
                    points={areaPoints}
                    fill={`${color}20`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isVisible ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                />
            )}
            <motion.polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: isVisible ? 1 : 0, opacity: isVisible ? 1 : 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            {/* End dot */}
            <motion.circle
                cx={width}
                cy={height - (((data[data.length - 1] ?? min) - min) / range) * height}
                r={2.5}
                fill={color}
                initial={{ scale: 0 }}
                animate={{ scale: isVisible ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
            />
        </svg>
    )
}
