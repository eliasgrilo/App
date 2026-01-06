// ═══════════════════════════════════════════════════════════════════
// BUTTON — Apple-quality Button Component
// Refactored: 221 → ~50 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { ButtonProps, buttonVariants, buttonSizes } from '../buttonModules'

const LoadingSpinner: React.FC = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
)

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ children, variant = 'primary', size = 'md', loading = false, disabled = false, icon, iconPosition = 'left', fullWidth = false, className = '', ...props }, ref) => {
    const isDisabled = disabled || loading
    return (
        // @ts-expect-error - framer-motion type incompatibility
        <motion.button ref={ref} whileTap={!isDisabled ? { scale: 0.98 } : undefined} transition={{ duration: 0.1 }} disabled={isDisabled}
            className={`inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-[250ms] ease-out focus:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none touch-manipulation ${buttonVariants[variant] || buttonVariants.primary} ${buttonSizes[size] || buttonSizes.md} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}>
            {loading && <LoadingSpinner />}
            {!loading && icon && iconPosition === 'left' && icon}
            {children}
            {!loading && icon && iconPosition === 'right' && icon}
        </motion.button>
    )
})

Button.displayName = 'Button'

export { IconButton } from '../buttonModules'
export type { ButtonProps, IconButtonProps, ButtonVariant, ButtonSize, IconPosition } from '../buttonModules'
export default Button
