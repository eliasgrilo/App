import React, { forwardRef, ReactNode, MouseEventHandler, HTMLAttributes } from 'react'
import { motion } from 'framer-motion'

/**
 * ═══════════════════════════════════════════════════════════════════
 * CARD — Apple-quality Card Component
 * ═══════════════════════════════════════════════════════════════════
 */

type CardVariant = 'default' | 'elevated' | 'glass' | 'outline' | 'ghost'
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    variant?: CardVariant
    interactive?: boolean
    padding?: CardPadding
    className?: string
    onClick?: MouseEventHandler<HTMLDivElement>
}

interface SubComponentProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    className?: string
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
    children,
    variant = 'default',
    interactive = false,
    padding = 'md',
    className = '',
    onClick,
    ...props
}, ref) => {

    const variants: Record<CardVariant, string> = {
        default: `
            bg-white dark:bg-zinc-900
            border border-zinc-200/60 dark:border-white/5
            shadow-sm dark:shadow-none
        `,
        elevated: `
            bg-white dark:bg-zinc-900
            border border-zinc-200/60 dark:border-white/5
            shadow-md dark:shadow-none
        `,
        glass: `
            bg-white/80 dark:bg-zinc-900/80
            backdrop-blur-xl
            border border-white/20 dark:border-white/10
        `,
        outline: `
            bg-transparent
            border-2 border-zinc-200/80 dark:border-zinc-700
        `,
        ghost: `
            bg-zinc-50 dark:bg-zinc-800/50
            border border-transparent
        `
    }

    const paddings: Record<CardPadding, string> = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8'
    }

    const interactiveStyles = interactive ? `
        cursor-pointer
        hover:shadow-lg hover:-translate-y-0.5
        active:shadow-md active:translate-y-0
        transition-all duration-[250ms]
    ` : ''

    const Component = interactive ? motion.div : 'div'
    const motionProps = interactive ? {
        whileHover: { y: -2 },
        whileTap: { y: 0, scale: 0.995 },
        transition: { duration: 0.15 }
    } : {}

    return (
        // @ts-expect-error - framer-motion type incompatibility with conditional component
        <Component
            ref={ref}
            onClick={onClick}
            className={`
                rounded-2xl
                ${variants[variant] || variants.default}
                ${paddings[padding] || paddings.md}
                ${interactiveStyles}
                ${className}
            `}
            {...motionProps}
            {...props}
        >
            {children}
        </Component>
    )
})

Card.displayName = 'Card'

export const CardHeader: React.FC<SubComponentProps> = ({ children, className = '', ...props }) => (
    <div
        className={`flex items-center justify-between mb-4 ${className}`}
        {...props}
    >
        {children}
    </div>
)

export const CardTitle: React.FC<SubComponentProps> = ({ children, className = '', ...props }) => (
    <h3
        className={`text-lg font-bold text-zinc-900 dark:text-white ${className}`}
        {...props}
    >
        {children}
    </h3>
)

export const CardDescription: React.FC<SubComponentProps> = ({ children, className = '', ...props }) => (
    <p
        className={`text-sm text-zinc-500 dark:text-zinc-400 ${className}`}
        {...props}
    >
        {children}
    </p>
)

export const CardFooter: React.FC<SubComponentProps> = ({ children, className = '', ...props }) => (
    <div
        className={`flex items-center gap-3 mt-4 pt-4 border-t border-zinc-100/80 dark:border-zinc-800 ${className}`}
        {...props}
    >
        {children}
    </div>
)

export default Card
