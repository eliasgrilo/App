/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANIMATED NUMBER — Apple-Style Count-Up Animation
 * 
 * Premium animated number display with:
 * - Spring physics animation (like SF Symbols)
 * - Currency, percentage, and integer formatting
 * - Reduced motion support
 * - Configurable duration and easing
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type NumberFormat = 'currency' | 'percent' | 'integer' | 'decimal'

interface AnimatedNumberProps {
    value: number
    format?: NumberFormat
    duration?: number
    delay?: number
    className?: string
    prefix?: string
    suffix?: string
    decimals?: number
    springConfig?: {
        stiffness?: number
        damping?: number
        mass?: number
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════════════════════

const formatValue = (value: number, format: NumberFormat, decimals: number): string => {
    switch (format) {
        case 'currency':
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value)
        case 'percent':
            return `${value.toFixed(decimals)}%`
        case 'decimal':
            return value.toLocaleString('pt-BR', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            })
        case 'integer':
        default:
            return Math.round(value).toLocaleString('pt-BR')
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
    value,
    format = 'integer',
    duration = 1.2,
    delay = 0,
    className = '',
    prefix = '',
    suffix = '',
    decimals = 1,
    springConfig = {
        stiffness: 100,
        damping: 30,
        mass: 1
    }
}) => {
    const [hasAnimated, setHasAnimated] = useState(false)
    const ref = useRef<HTMLSpanElement>(null)

    // Motion value for the animated number
    const motionValue = useMotionValue(0)

    // Spring physics for Apple-like feel
    const springValue = useSpring(motionValue, {
        stiffness: springConfig.stiffness,
        damping: springConfig.damping,
        mass: springConfig.mass
    })

    // Transform to formatted string
    const displayValue = useTransform(springValue, (latest) =>
        formatValue(latest, format, decimals)
    )

    // Intersection observer for animate-on-scroll
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        if (prefersReducedMotion) {
            motionValue.set(value)
            setHasAnimated(true)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        // Delay then animate
                        setTimeout(() => {
                            motionValue.set(value)
                            setHasAnimated(true)
                        }, delay * 1000)
                    }
                })
            },
            { threshold: 0.1 }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [value, delay, hasAnimated, motionValue])

    // Update when value changes (after initial animation)
    useEffect(() => {
        if (hasAnimated) {
            motionValue.set(value)
        }
    }, [value, hasAnimated, motionValue])

    return (
        <span ref={ref} className={`tabular-nums ${className}`}>
            {prefix}
            <motion.span>{displayValue}</motion.span>
            {suffix}
        </span>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED CURRENCY — Convenience wrapper
// ═══════════════════════════════════════════════════════════════════════════════

export const AnimatedCurrency: React.FC<Omit<AnimatedNumberProps, 'format'>> = (props) => (
    <AnimatedNumber {...props} format="currency" />
)

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED PERCENT — Convenience wrapper
// ═══════════════════════════════════════════════════════════════════════════════

export const AnimatedPercent: React.FC<Omit<AnimatedNumberProps, 'format'>> = (props) => (
    <AnimatedNumber {...props} format="percent" />
)

export default AnimatedNumber
