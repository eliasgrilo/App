// ═══════════════════════════════════════════════════════════════════
// APPLE CARD MODULES — Types & Design Tokens
// ═══════════════════════════════════════════════════════════════════

import { ReactNode, MouseEvent } from 'react'
import { HTMLMotionProps } from 'framer-motion'

export type RadiusSize = 'sm' | 'md' | 'lg' | 'xl'
export type PaddingSize = 'sm' | 'md' | 'lg' | 'xl'
export type CardVariant = 'default' | 'glass' | 'solid' | 'gradient'
export type AccentColor = 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose'
export type MetricSize = 'sm' | 'md' | 'lg' | 'xl'
export type MetricColor = 'default' | 'accent'
export type StatColor = 'zinc' | 'indigo' | 'emerald' | 'amber' | 'rose'
export type ProgressColor = 'indigo' | 'emerald' | 'violet' | 'amber' | 'orange' | 'rose'

export interface AppleCardProps extends Omit<HTMLMotionProps<'div'>, 'onClick'> {
    children?: ReactNode; radius?: RadiusSize; padding?: PaddingSize; variant?: CardVariant
    hoverEffect?: boolean; accentColor?: AccentColor; className?: string; onClick?: (e: MouseEvent<HTMLDivElement>) => void
}

export interface CardHeaderProps { title?: string; subtitle?: string; badge?: string; action?: ReactNode; className?: string }
export interface CardMetricProps { value: string | number; label?: string; size?: MetricSize; color?: MetricColor; className?: string }
export interface CardFooterProps { children?: ReactNode; className?: string }
export interface CardStatProps { label: string; value: string | number; color?: StatColor }
export interface CardProgressProps { value: number; label: string; color?: ProgressColor }

export const RADIUS: Record<RadiusSize, string> = { sm: 'rounded-2xl', md: 'rounded-[2rem]', lg: 'rounded-[2.5rem]', xl: 'rounded-[3rem]' }
export const PADDING: Record<PaddingSize, string> = { sm: 'p-4', md: 'p-6', lg: 'p-8 md:p-10', xl: 'p-10 md:p-12' }
export const spring = { type: 'spring' as const, stiffness: 400, damping: 30 }

export const variantStyles: Record<CardVariant, string> = {
    default: 'bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-md hover:shadow-lg',
    glass: 'bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl',
    solid: 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm',
    gradient: 'bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-2xl'
}

export const accentGlowMap: Record<AccentColor, string> = {
    indigo: 'bg-indigo-500/[0.05] dark:bg-indigo-500/[0.08]', emerald: 'bg-emerald-500/[0.05] dark:bg-emerald-500/[0.08]',
    violet: 'bg-violet-500/[0.05] dark:bg-violet-500/[0.08]', amber: 'bg-amber-500/[0.05] dark:bg-amber-500/[0.08]', rose: 'bg-rose-500/[0.05] dark:bg-rose-500/[0.08]'
}

export const statColorMap: Record<StatColor, string> = { zinc: 'text-zinc-800 dark:text-white/90', indigo: 'text-indigo-600 dark:text-indigo-400', emerald: 'text-emerald-600 dark:text-emerald-400', amber: 'text-amber-600 dark:text-amber-400', rose: 'text-rose-600 dark:text-rose-400' }
export const statLabelColorMap: Record<StatColor, string> = { zinc: 'text-zinc-400 dark:text-white/30', indigo: 'text-indigo-500 dark:text-indigo-400', emerald: 'text-emerald-500 dark:text-emerald-400', amber: 'text-amber-500 dark:text-amber-400', rose: 'text-rose-500 dark:text-rose-400' }
export const progressColorMap: Record<ProgressColor, string> = { indigo: 'bg-indigo-500/80', emerald: 'bg-emerald-500/80', violet: 'bg-violet-500/80', amber: 'bg-amber-500/80', orange: 'bg-orange-500/80', rose: 'bg-rose-500/80' }
export const progressTextColorMap: Record<ProgressColor, string> = { indigo: 'text-indigo-500', emerald: 'text-emerald-500', violet: 'text-violet-500', amber: 'text-amber-500', orange: 'text-orange-500', rose: 'text-rose-500' }
export const metricSizeStyles: Record<MetricSize, string> = { sm: 'text-xl md:text-2xl', md: 'text-2xl md:text-3xl', lg: 'text-4xl md:text-5xl', xl: 'text-5xl md:text-7xl' }
export const metricColorStyles: Record<MetricColor, string> = { default: 'text-zinc-900 dark:text-white', accent: 'text-indigo-600 dark:text-indigo-400' }
