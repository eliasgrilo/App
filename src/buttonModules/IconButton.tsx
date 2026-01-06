// ═══════════════════════════════════════════════════════════════════
// BUTTON MODULES — IconButton Component
// ═══════════════════════════════════════════════════════════════════

import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { IconButtonProps, iconButtonSizes, iconButtonVariants } from './types'

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({ children, variant = 'ghost', size = 'md', className = '', 'aria-label': ariaLabel, ...props }, ref) => (
    // @ts-expect-error - framer-motion type incompatibility
    <motion.button ref={ref} whileTap={{ scale: 0.92 }} transition={{ duration: 0.1 }} aria-label={ariaLabel}
        className={`inline-flex items-center justify-center rounded-xl transition-all duration-[250ms] ease-out focus:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:cursor-not-allowed select-none touch-manipulation ${iconButtonSizes[size] || iconButtonSizes.md} ${iconButtonVariants[variant] || iconButtonVariants.ghost} ${className}`}
        {...props}>{children}</motion.button>
))

IconButton.displayName = 'IconButton'
