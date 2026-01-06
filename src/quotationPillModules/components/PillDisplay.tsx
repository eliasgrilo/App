// ═══════════════════════════════════════════════════════════════════
// QUOTATION PILL MODULES — PillBadge, PillCard
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { PillBadgeProps, PillCardProps, PillSize, BadgeType, badgeStyles, cardVariants } from '../types'

export const PillBadge: React.FC<PillBadgeProps> = ({ type = 'info', label, pulse = false, glow = true, size = 'md' }) => {
    const sizes: Record<PillSize, string> = { sm: 'px-2.5 py-1 text-[9px] gap-1.5', md: 'px-3 py-1.5 text-[10px] gap-2', lg: 'px-4 py-2 text-[12px] gap-2' }
    const s = badgeStyles[type] || badgeStyles.info

    return (
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center rounded-full ${sizes[size]} ${s.bg} backdrop-blur-sm`}
            style={{ boxShadow: glow ? s.glow : 'none' }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
            <span className="relative flex h-2 w-2">
                {pulse && <motion.span className={`absolute inline-flex h-full w-full rounded-full ${s.dot}`}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${s.dot}`} />
            </span>
            <span className={`font-bold uppercase tracking-wider ${s.text}`}>{label}</span>
        </motion.div>
    )
}

export const PillCard: React.FC<PillCardProps> = ({ children, className = '', glow = false, variant = 'default' }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-[24px] p-5 ${cardVariants[variant]} ${className}`}
            style={{ boxShadow: glow ? '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' : 'none' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}>{children}</motion.div>
    )
}
