/**
 * Advanced Effects — Complex Visual Components
 * 
 * Gradient borders, animated backgrounds, and advanced effects.
 * @author Padoca Engineering Team
 */

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT BORDER — Animated Gradient Border Effect
// ═══════════════════════════════════════════════════════════════════════════════

interface GradientBorderProps {
    children: React.ReactNode
    className?: string
    colors?: string[]
}

export const GradientBorder: React.FC<GradientBorderProps> = ({
    children,
    className = '',
    colors = ['#007AFF', '#5856D6', '#FF2D55', '#FF9500', '#007AFF']
}) => (
    <div className={`relative p-[2px] rounded-2xl overflow-hidden ${className}`}>
        <motion.div
            className="absolute inset-0"
            style={{
                background: `linear-gradient(90deg, ${colors.join(', ')})`,
                backgroundSize: '200% 100%'
            }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <div className="relative bg-white dark:bg-zinc-900 rounded-[14px] h-full">
            {children}
        </div>
    </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED GRADIENT — Moving Color Background
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedGradientProps {
    colors?: string[]
    className?: string
    children?: React.ReactNode
}

export const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
    colors = ['#007AFF', '#5856D6', '#FF2D55', '#FF9500'],
    className = '',
    children
}) => (
    <motion.div
        className={`relative overflow-hidden ${className}`}
        style={{
            background: `linear-gradient(-45deg, ${colors.join(', ')})`,
            backgroundSize: '400% 400%'
        }}
        animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear'
        }}
    >
        {children}
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// WAVE BACKGROUND — Animated Wave Pattern
// ═══════════════════════════════════════════════════════════════════════════════

export const WaveBackground: React.FC<{ color?: string }> = ({
    color = '#007AFF'
}) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.svg
            className="absolute bottom-0 w-full h-24"
            viewBox="0 0 1440 120"
            initial={{ y: 10 }}
            animate={{ y: [10, 0, 10] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
            <path
                fill={`${color}20`}
                d="M0,60 C320,100 440,20 720,50 C1000,80 1120,30 1440,60 L1440,120 L0,120 Z"
            />
        </motion.svg>
    </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// SCROLL PARALLAX — 60fps scroll-linked parallax effect
// ═══════════════════════════════════════════════════════════════════════════════

interface ScrollParallaxProps {
    children: React.ReactNode
    speed?: number
    className?: string
}

export const ScrollParallax: React.FC<ScrollParallaxProps> = ({
    children,
    speed = 0.3,
    className = ''
}) => {
    const ref = useRef<HTMLDivElement>(null)
    const [offset, setOffset] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect()
                const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
                setOffset(scrollProgress * 100 * speed)
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [speed])

    return (
        <div ref={ref} className={`will-change-transform ${className}`}>
            <motion.div
                style={{ y: offset }}
                transition={{ type: 'tween', duration: 0 }}
            >
                {children}
            </motion.div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DARK MODE TRANSITION — Smooth color morphing
// ═══════════════════════════════════════════════════════════════════════════════

interface DarkModeTransitionProps {
    children: React.ReactNode
    className?: string
}

export const DarkModeTransition: React.FC<DarkModeTransitionProps> = ({
    children,
    className = ''
}) => {
    return (
        <motion.div
            className={`transition-colors duration-700 ease-in-out ${className}`}
            initial={false}
            animate={{}}
            transition={{ duration: 0.7 }}
        >
            {children}
        </motion.div>
    )
}
