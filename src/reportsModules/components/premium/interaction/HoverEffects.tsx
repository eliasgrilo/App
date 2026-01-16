/**
 * Hover Effects — Interactive Hover Components
 * 
 * Components for mouse interaction effects.
 * @author Padoca Engineering Team
 */

import React from 'react'
import { motion } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// MAGNETIC HOVER — DISABLED FOR PERFORMANCE (renders as simple wrapper)
// ═══════════════════════════════════════════════════════════════════════════════

interface MagneticHoverProps {
    children: React.ReactNode
    strength?: number
    className?: string
}

export const MagneticHover: React.FC<MagneticHoverProps> = ({
    children,
    className = ''
}) => (
    <div className={className}>
        {children}
    </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// ELASTIC SCALE — Bouncy Scale on Hover
// ═══════════════════════════════════════════════════════════════════════════════

interface ElasticScaleProps {
    children: React.ReactNode
    scale?: number
    className?: string
}

export const ElasticScale: React.FC<ElasticScaleProps> = ({
    children,
    scale = 1.02,
    className = ''
}) => (
    <motion.div
        whileHover={{ scale }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className={className}
    >
        {children}
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// HAPTIC BUTTON — Scale Bounce on Press (Visual Haptic)
// ═══════════════════════════════════════════════════════════════════════════════

interface HapticButtonProps {
    children: React.ReactNode
    onClick?: () => void
    className?: string
}

export const HapticButton: React.FC<HapticButtonProps> = ({
    children,
    onClick,
    className = ''
}) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`
            focus:outline-none
            focus:ring-2 focus:ring-blue-500/50
            focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900
            rounded-xl
            ${className}
        `}
    >
        {children}
    </motion.button>
)

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS RING — Accessible Focus State
// ═══════════════════════════════════════════════════════════════════════════════

export const FocusRing: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = ''
}) => (
    <div className={`
        focus-within:ring-2 focus-within:ring-blue-500/50
        focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-zinc-900
        rounded-2xl
        ${className}
    `}>
        {children}
    </div>
)
