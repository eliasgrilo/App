/**
 * GlassCard — Glassmorphism Wrapper Component
 * 
 * Premium glass effect card with gradient options.
 * @author Padoca Engineering Team
 */

import React from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
    children: React.ReactNode
    className?: string
    hover?: boolean
    gradient?: 'none' | 'emerald' | 'blue' | 'red' | 'amber' | 'purple'
}

const gradientClasses = {
    none: 'bg-white/80 dark:bg-zinc-900/80',
    emerald: 'bg-gradient-to-br from-emerald-50/90 to-teal-50/90 dark:from-emerald-950/50 dark:to-teal-950/50',
    blue: 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 dark:from-blue-950/50 dark:to-indigo-950/50',
    red: 'bg-gradient-to-br from-red-50/90 to-rose-50/90 dark:from-red-950/50 dark:to-rose-950/50',
    amber: 'bg-gradient-to-br from-amber-50/90 to-orange-50/90 dark:from-amber-950/50 dark:to-orange-950/50',
    purple: 'bg-gradient-to-br from-purple-50/90 to-violet-50/90 dark:from-purple-950/50 dark:to-violet-950/50'
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    hover = true,
    gradient = 'none'
}) => (
    <motion.div
        whileHover={hover ? { scale: 1.005 } : undefined}
        transition={{ duration: 0.15 }}
        className={`
            ${gradientClasses[gradient]}
            backdrop-blur-sm
            border border-white/20 dark:border-white/[0.08]
            rounded-2xl
            shadow-md
            ${hover ? 'cursor-pointer' : ''}
            ${className}
        `}
    >
        {children}
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// GLOW HOVER CARD — Card with Glow Effect on Hover
// ═══════════════════════════════════════════════════════════════════════════════

interface GlowHoverCardProps {
    children: React.ReactNode
    className?: string
    glowColor?: string
}

export const GlowHoverCard: React.FC<GlowHoverCardProps> = ({
    children,
    className = '',
    glowColor = '#007AFF'
}) => (
    <motion.div
        whileHover={{
            boxShadow: `0 0 16px ${glowColor}30`,
            scale: 1.01
        }}
        transition={{ duration: 0.15 }}
        className={`
            relative rounded-2xl
            bg-white/80 dark:bg-zinc-900/80
            backdrop-blur-sm
            border border-white/20 dark:border-white/[0.08]
            shadow-md
            ${className}
        `}
    >
        {children}
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// SHIMMER CARD — Animated Shine Border Effect
// ═══════════════════════════════════════════════════════════════════════════════

interface ShimmerCardProps {
    children: React.ReactNode
    className?: string
    shimmerColor?: string
}

export const ShimmerCard: React.FC<ShimmerCardProps> = ({
    children,
    className = '',
    shimmerColor = 'rgba(255,255,255,0.4)'
}) => (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
        <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
                background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut'
            }}
        />
        {children}
    </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// PARALLAX CARD — Layered Shadows with Depth
// ═══════════════════════════════════════════════════════════════════════════════

interface ParallaxCardProps {
    children: React.ReactNode
    className?: string
}

export const ParallaxCard: React.FC<ParallaxCardProps> = ({
    children,
    className = ''
}) => (
    <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className={`
            relative rounded-2xl
            bg-white dark:bg-zinc-900
            shadow-md hover:shadow-lg
            transition-shadow duration-150
            ${className}
        `}
    >
        {children}
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// DEPTH 3D CARD — Simple Card (3D disabled for performance)
// ═══════════════════════════════════════════════════════════════════════════════

interface Depth3DCardProps {
    children: React.ReactNode
    className?: string
    depth?: number
}

export const Depth3DCard: React.FC<Depth3DCardProps> = ({
    children,
    className = ''
}) => (
    <div
        className={`
            relative rounded-2xl
            bg-white/90 dark:bg-zinc-900/90
            border border-white/20 dark:border-white/[0.08]
            shadow-lg
            ${className}
        `}
    >
        {children}
    </div>
)
