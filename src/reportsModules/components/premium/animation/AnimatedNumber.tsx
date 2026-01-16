/**
 * AnimatedNumber — Count-up Effect Components
 * 
 * Animated number display with count-up effects for various formats.
 * @author Padoca Engineering Team
 */

import React, { useEffect, useState } from 'react'
import { useSpring, useTransform } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED NUMBER — Base Count-up Effect
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedNumberProps {
    value: number
    duration?: number
    formatFn?: (n: number) => string
    className?: string
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
    value,
    duration = 1,
    formatFn = (n) => n.toLocaleString('pt-BR'),
    className = ''
}) => {
    const springValue = useSpring(0, {
        stiffness: 50,
        damping: 20,
        duration: duration * 1000
    })
    const displayValue = useTransform(springValue, (latest) => formatFn(Math.round(latest)))
    const [display, setDisplay] = useState(formatFn(0))

    useEffect(() => {
        springValue.set(value)
        const unsubscribe = displayValue.on('change', (v) => setDisplay(v))
        return () => unsubscribe()
    }, [value, springValue, displayValue])

    return <span className={className}>{display}</span>
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED CURRENCY — Count-up for Money
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedCurrencyProps {
    value: number
    duration?: number
    className?: string
}

export const AnimatedCurrency: React.FC<AnimatedCurrencyProps> = ({
    value,
    duration = 1.2,
    className = ''
}) => {
    return (
        <AnimatedNumber
            value={value}
            duration={duration}
            formatFn={(n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            className={className}
        />
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED CURRENCY COMPACT — Apple-style abbreviated (R$ 125K, R$ 1.5M)
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedCurrencyCompactProps {
    value: number
    duration?: number
    className?: string
}

const formatCurrencyCompactFn = (value: number): string => {
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''

    if (absValue >= 1_000_000) {
        return `${sign}R$ ${(absValue / 1_000_000).toFixed(1).replace('.', ',')}M`
    }
    if (absValue >= 10_000) {
        return `${sign}R$ ${Math.round(absValue / 1_000)}K`
    }
    if (absValue >= 1_000) {
        return `${sign}R$ ${(absValue / 1_000).toFixed(1).replace('.', ',')}K`
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value)
}

export const AnimatedCurrencyCompact: React.FC<AnimatedCurrencyCompactProps> = ({
    value,
    duration = 1.2,
    className = ''
}) => {
    return (
        <AnimatedNumber
            value={value}
            duration={duration}
            formatFn={formatCurrencyCompactFn}
            className={className}
        />
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED PERCENT — Count-up for Percentages
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedPercentProps {
    value: number
    duration?: number
    className?: string
    decimals?: number
}

export const AnimatedPercent: React.FC<AnimatedPercentProps> = ({
    value,
    duration = 0.8,
    className = '',
    decimals = 1
}) => {
    return (
        <AnimatedNumber
            value={value}
            duration={duration}
            formatFn={(n) => `${n.toFixed(decimals)}%`}
            className={className}
        />
    )
}
