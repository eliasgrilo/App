import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'

/**
 * ═══════════════════════════════════════════════════════════════════
 * BUTTON — Apple-quality Button Component
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ TYPES ═══
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type IconPosition = 'left' | 'right'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
    children?: ReactNode
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    disabled?: boolean
    icon?: ReactNode
    iconPosition?: IconPosition
    fullWidth?: boolean
    className?: string
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
    children?: ReactNode
    variant?: 'ghost' | 'primary' | 'danger'
    size?: 'xs' | 'sm' | 'md' | 'lg'
    className?: string
    'aria-label'?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className = '',
    ...props
}, ref) => {

    // Variantes de estilo
    const variants: Record<ButtonVariant, string> = {
        primary: `
            bg-indigo-500 text-white 
            hover:bg-indigo-600 
            active:bg-indigo-700
            focus-visible:ring-indigo-500/30
            shadow-lg shadow-indigo-500/20
            hover:shadow-xl hover:shadow-indigo-500/25
        `,
        secondary: `
            bg-zinc-100 text-zinc-900 
            dark:bg-zinc-800 dark:text-white
            hover:bg-zinc-200 dark:hover:bg-zinc-700
            active:bg-zinc-300 dark:active:bg-zinc-600
            focus-visible:ring-zinc-500/30
            shadow-sm
            hover:shadow-md
        `,
        ghost: `
            bg-transparent text-zinc-600 
            dark:text-zinc-300
            hover:bg-zinc-100 dark:hover:bg-zinc-800
            active:bg-zinc-200 dark:active:bg-zinc-700
            focus-visible:ring-zinc-500/40
        `,
        danger: `
            bg-rose-500 text-white
            hover:bg-rose-600
            active:bg-rose-700
            focus-visible:ring-rose-500/40
        `,
        success: `
            bg-emerald-500 text-white
            hover:bg-emerald-600
            active:bg-emerald-700
            focus-visible:ring-emerald-500/40
        `,
        outline: `
            bg-transparent text-indigo-500 border-2 border-indigo-500
            hover:bg-indigo-50 dark:hover:bg-indigo-950
            active:bg-indigo-100 dark:active:bg-indigo-900
            focus-visible:ring-indigo-500/40
        `
    }

    // Tamanhos
    const sizes: Record<ButtonSize, string> = {
        xs: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg',
        sm: 'px-3 py-2 text-sm gap-2 rounded-xl',
        md: 'px-4 py-2.5 text-[15px] gap-2 rounded-xl',
        lg: 'px-5 py-3 text-base gap-2.5 rounded-2xl',
        xl: 'px-6 py-3.5 text-lg gap-3 rounded-2xl'
    }

    // Ícone de loading
    const LoadingSpinner: React.FC = () => (
        <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="3"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    )

    const isDisabled = disabled || loading

    return (
        // @ts-expect-error - framer-motion type incompatibility
        <motion.button
            ref={ref}
            whileTap={!isDisabled ? { scale: 0.98 } : undefined}
            transition={{ duration: 0.1 }}
            disabled={isDisabled}
            className={`
                inline-flex items-center justify-center
                font-semibold tracking-tight
                transition-all duration-[250ms] ease-out
                focus:outline-none focus-visible:ring-4
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                select-none touch-manipulation
                ${variants[variant] || variants.primary}
                ${sizes[size] || sizes.md}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            {...props}
        >
            {loading && <LoadingSpinner />}
            {!loading && icon && iconPosition === 'left' && icon}
            {children}
            {!loading && icon && iconPosition === 'right' && icon}
        </motion.button>
    )
})

Button.displayName = 'Button'

// IconButton para botões só com ícone
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
    children,
    variant = 'ghost',
    size = 'md',
    className = '',
    'aria-label': ariaLabel,
    ...props
}, ref) => {

    const sizes: Record<string, string> = {
        xs: 'w-7 h-7',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    }

    const variants: Record<string, string> = {
        ghost: `
            text-zinc-500 
            hover:text-zinc-700 hover:bg-zinc-100
            dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800
            focus-visible:ring-zinc-500/40
        `,
        primary: `
            bg-indigo-500 text-white
            hover:bg-indigo-600
            focus-visible:ring-indigo-500/40
        `,
        danger: `
            text-zinc-400 hover:text-rose-500 hover:bg-rose-50
            dark:hover:bg-rose-950
            focus-visible:ring-rose-500/40
        `
    }

    return (
        // @ts-expect-error - framer-motion type incompatibility
        <motion.button
            ref={ref}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.1 }}
            aria-label={ariaLabel}
            className={`
                inline-flex items-center justify-center
                rounded-xl
                transition-all duration-[250ms] ease-out
                focus:outline-none focus-visible:ring-4
                disabled:opacity-50 disabled:cursor-not-allowed
                select-none touch-manipulation
                ${sizes[size] || sizes.md}
                ${variants[variant] || variants.ghost}
                ${className}
            `}
            {...props}
        >
            {children}
        </motion.button>
    )
})

IconButton.displayName = 'IconButton'

export default Button
