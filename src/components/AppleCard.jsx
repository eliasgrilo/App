/**
 * AppleCard - Premium Card Component with Apple-quality aesthetics
 * 
 * Features:
 * - Glassmorphism effect
 * - Mesh gradient hover
 * - Multi-layer shadows
 * - Spring animations
 * - Border radius customization
 */

import React from 'react'
import { motion } from 'framer-motion'

// Design tokens
const RADIUS = {
    sm: 'rounded-2xl',      // 16px
    md: 'rounded-[2rem]',   // 32px  
    lg: 'rounded-[2.5rem]', // 40px
    xl: 'rounded-[3rem]'    // 48px
}

const PADDING = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8 md:p-10',
    xl: 'p-10 md:p-12'
}

// Spring animation config (Apple-like)
const spring = {
    type: 'spring',
    stiffness: 400,
    damping: 30
}

export default function AppleCard({
    children,
    radius = 'md',
    padding = 'md',
    variant = 'default', // 'default' | 'glass' | 'solid' | 'gradient'
    hoverEffect = true,
    accentColor = 'indigo', // 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose'
    className = '',
    onClick,
    ...props
}) {
    // Base styles
    const baseStyles = `
        relative overflow-hidden
        ${RADIUS[radius]}
        ${PADDING[padding]}
        transition-all duration-300
    `

    // Variant styles
    const variantStyles = {
        default: `
            bg-white dark:bg-zinc-950
            border border-zinc-200/50 dark:border-white/10
            shadow-lg
        `,
        glass: `
            bg-white/60 dark:bg-zinc-900/60
            backdrop-blur-xl
            border border-white/20 dark:border-white/10
            shadow-xl
        `,
        solid: `
            bg-zinc-50 dark:bg-zinc-900
            border border-zinc-200 dark:border-zinc-800
            shadow-sm
        `,
        gradient: `
            bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950
            border border-zinc-200/50 dark:border-white/10
            shadow-2xl
        `
    }

    // Accent color for mesh gradient
    const accentMap = {
        indigo: 'bg-indigo-500/[0.05] dark:bg-indigo-500/[0.08]',
        emerald: 'bg-emerald-500/[0.05] dark:bg-emerald-500/[0.08]',
        violet: 'bg-violet-500/[0.05] dark:bg-violet-500/[0.08]',
        amber: 'bg-amber-500/[0.05] dark:bg-amber-500/[0.08]',
        rose: 'bg-rose-500/[0.05] dark:bg-rose-500/[0.08]'
    }

    return (
        <motion.div
            whileHover={hoverEffect ? { y: -4 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            transition={spring}
            className={`
                group
                ${baseStyles}
                ${variantStyles[variant]}
                ${onClick ? 'cursor-pointer' : ''}
                ${hoverEffect ? 'hover:shadow-2xl' : ''}
                ${className}
            `}
            onClick={onClick}
            {...props}
        >
            {/* Mesh Gradient Hover Effect */}
            {hoverEffect && (
                <div
                    className={`
                        absolute -top-1/2 -right-1/2 w-[100%] h-[100%]
                        ${accentMap[accentColor]}
                        blur-[80px] rounded-full
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-700
                        pointer-events-none
                    `}
                />
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Compound Components
// ─────────────────────────────────────────────────────────────────

AppleCard.Header = function CardHeader({
    title,
    subtitle,
    badge,
    action,
    className = ''
}) {
    return (
        <div className={`flex justify-between items-start mb-6 ${className}`}>
            <div>
                {badge && (
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                            {badge}
                        </span>
                    </div>
                )}
                {title && (
                    <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                        {title}
                    </h3>
                )}
                {subtitle && (
                    <p className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium tracking-wide">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && (
                <div className="shrink-0">
                    {action}
                </div>
            )}
        </div>
    )
}

AppleCard.Metric = function CardMetric({
    value,
    label,
    size = 'lg', // 'sm' | 'md' | 'lg' | 'xl'
    color = 'default', // 'default' | 'accent'
    className = ''
}) {
    const sizeStyles = {
        sm: 'text-xl md:text-2xl',
        md: 'text-2xl md:text-3xl',
        lg: 'text-4xl md:text-5xl',
        xl: 'text-5xl md:text-7xl'
    }

    const colorStyles = {
        default: 'text-zinc-900 dark:text-white',
        accent: 'text-indigo-600 dark:text-indigo-400'
    }

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && (
                <span className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest">
                    {label}
                </span>
            )}
            <div className={`
                ${sizeStyles[size]}
                ${colorStyles[color]}
                font-semibold tracking-tighter tabular-nums leading-none
            `}>
                {value}
            </div>
        </div>
    )
}

AppleCard.Footer = function CardFooter({
    children,
    className = ''
}) {
    return (
        <div className={`
            relative flex gap-6 md:gap-12 mt-8 pt-6
            border-t border-zinc-100 dark:border-white/5
            ${className}
        `}>
            {children}
        </div>
    )
}

AppleCard.Stat = function CardStat({
    label,
    value,
    color = 'zinc' // 'zinc' | 'indigo' | 'emerald' | 'amber' | 'rose'
}) {
    const colorMap = {
        zinc: 'text-zinc-800 dark:text-white/90',
        indigo: 'text-indigo-600 dark:text-indigo-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        amber: 'text-amber-600 dark:text-amber-400',
        rose: 'text-rose-600 dark:text-rose-400'
    }

    const labelColorMap = {
        zinc: 'text-zinc-400 dark:text-white/30',
        indigo: 'text-indigo-500 dark:text-indigo-400',
        emerald: 'text-emerald-500 dark:text-emerald-400',
        amber: 'text-amber-500 dark:text-amber-400',
        rose: 'text-rose-500 dark:text-rose-400'
    }

    return (
        <div className="flex flex-col gap-1.5">
            <span className={`text-[9px] font-bold ${labelColorMap[color]} uppercase tracking-widest`}>
                {label}
            </span>
            <span className={`text-2xl md:text-3xl font-semibold ${colorMap[color]} tracking-tight tabular-nums`}>
                {value}
            </span>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Progress Bar Sub-component
// ─────────────────────────────────────────────────────────────────

AppleCard.Progress = function CardProgress({
    value,
    label,
    color = 'indigo'
}) {
    const colorMap = {
        indigo: 'bg-indigo-500/80',
        emerald: 'bg-emerald-500/80',
        violet: 'bg-violet-500/80',
        amber: 'bg-amber-500/80',
        orange: 'bg-orange-500/80',
        rose: 'bg-rose-500/80'
    }

    const textColorMap = {
        indigo: 'text-indigo-500',
        emerald: 'text-emerald-500',
        violet: 'text-violet-500',
        amber: 'text-amber-500',
        orange: 'text-orange-500',
        rose: 'text-rose-500'
    }

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-1.5 px-0.5">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                    {label}
                </span>
                <span className={`text-[8px] font-bold ${textColorMap[color]}`}>
                    {value}%
                </span>
            </div>
            <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full ${colorMap[color]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
        </div>
    )
}
