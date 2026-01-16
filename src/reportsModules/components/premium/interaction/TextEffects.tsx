/**
 * Text Effects — Animated Text Components
 * 
 * Gradient and animated text effects.
 * @author Padoca Engineering Team
 */

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT TEXT — Apple-Style Gradient Text
// ═══════════════════════════════════════════════════════════════════════════════

interface GradientTextProps {
    children: React.ReactNode
    colors?: string[]
    className?: string
}

export const GradientText: React.FC<GradientTextProps> = ({
    children,
    colors = ['#007AFF', '#5856D6'],
    className = ''
}) => (
    <span
        className={`bg-clip-text text-transparent ${className}`}
        style={{
            backgroundImage: `linear-gradient(135deg, ${colors.join(', ')})`
        }}
    >
        {children}
    </span>
)

// ═══════════════════════════════════════════════════════════════════════════════
// NUMBER FLASH — Micro-animation on Value Change
// ═══════════════════════════════════════════════════════════════════════════════

interface NumberFlashProps {
    value: number
    className?: string
}

export const NumberFlash: React.FC<NumberFlashProps> = ({
    value,
    className = ''
}) => {
    const [flash, setFlash] = useState(false)
    const prevValue = useRef(value)

    useEffect(() => {
        if (value !== prevValue.current) {
            setFlash(true)
            prevValue.current = value
            const timer = setTimeout(() => setFlash(false), 300)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [value])

    return (
        <motion.span
            animate={{
                scale: flash ? [1, 1.1, 1] : 1,
                color: flash ? ['', '#34C759', ''] : ''
            }}
            transition={{ duration: 0.3 }}
            className={className}
        >
            {value.toLocaleString('pt-BR')}
        </motion.span>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VARIABLE WEIGHT TEXT — Hover-animated font weight
// ═══════════════════════════════════════════════════════════════════════════════

interface VariableWeightTextProps {
    children: string
    baseWeight?: number
    hoverWeight?: number
    className?: string
}

export const VariableWeightText: React.FC<VariableWeightTextProps> = ({
    children,
    baseWeight = 400,
    hoverWeight = 700,
    className = ''
}) => {
    return (
        <motion.span
            className={className}
            style={{ fontWeight: baseWeight }}
            whileHover={{ fontWeight: hoverWeight }}
            transition={{ duration: 0.3 }}
        >
            {children}
        </motion.span>
    )
}
