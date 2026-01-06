// ═══════════════════════════════════════════════════════════════════
// APPLE CARD — Premium Card Component with Apple-quality aesthetics
// Refactored: 358 → ~50 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { AppleCardProps, RADIUS, PADDING, spring, variantStyles, accentGlowMap, CardHeader, CardMetric, CardFooter, CardStat, CardProgress } from '../appleCardModules'

function AppleCardComponent({ children, radius = 'md', padding = 'md', variant = 'default', hoverEffect = true, accentColor = 'indigo', className = '', onClick, ...props }: AppleCardProps) {
    const baseStyles = `relative overflow-hidden ${RADIUS[radius]} ${PADDING[padding]} transition-all duration-300`

    return (
        <motion.div whileHover={hoverEffect ? { y: -4 } : undefined} whileTap={onClick ? { scale: 0.98 } : undefined} transition={spring}
            className={`group ${baseStyles} ${variantStyles[variant]} ${onClick ? 'cursor-pointer' : ''} ${hoverEffect ? 'hover:shadow-2xl' : ''} ${className}`}
            onClick={onClick} {...props}>
            {hoverEffect && <div className={`absolute -top-1/2 -right-1/2 w-[100%] h-[100%] ${accentGlowMap[accentColor]} blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />}
            <div className="relative z-10">{children}</div>
        </motion.div>
    )
}

const AppleCard = Object.assign(AppleCardComponent, { Header: CardHeader, Metric: CardMetric, Footer: CardFooter, Stat: CardStat, Progress: CardProgress })
export default AppleCard
