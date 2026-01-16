/**
 * GlassCard — Apple premium glassmorphic container
 * Used across modals, forms, and card components
 */

import React from 'react'
import { motion } from 'framer-motion'
import { SPRING_BOUNCY } from './animations'

export interface GlassCardProps {
    children: React.ReactNode
    className?: string
    hoverable?: boolean
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverable = false }) => (
    <motion.div
        whileHover={hoverable ? { scale: 1.01, y: -1 } : undefined}
        transition={SPRING_BOUNCY}
        className={`
            relative overflow-visible rounded-2xl
            bg-white/70 dark:bg-zinc-800/50
            backdrop-blur-xl backdrop-saturate-150
            border border-white/50 dark:border-zinc-700/50
            shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_4px_16px_-4px_rgba(0,0,0,0.1)]
            dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]
            ${className}
        `}
    >
        {children}
    </motion.div>
)

export default GlassCard
