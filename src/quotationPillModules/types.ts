// ═══════════════════════════════════════════════════════════════════
// QUOTATION PILL MODULES — Types & Styles
// ═══════════════════════════════════════════════════════════════════

import { ChangeEvent, ReactNode } from 'react'

export type PillSize = 'sm' | 'md' | 'lg'
export type PillVariant = 'default' | 'success' | 'warning' | 'primary'
export type BadgeType = 'success' | 'warning' | 'error' | 'info' | 'pending'
export type CardVariant = 'default' | 'glass' | 'dark'
export type TextAlign = 'left' | 'center' | 'right'

export interface VariantStyle { base: string; focus: string; glow: string; text: string; placeholder: string }
export interface BadgeStyle { bg: string; text: string; glow: string; dot: string }

export interface PillInputProps {
    value: string | number; onChange: (e: ChangeEvent<HTMLInputElement>) => void
    placeholder?: string; label?: string; suffix?: string; prefix?: string; type?: string
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
    align?: TextAlign; size?: PillSize; variant?: PillVariant; width?: string | number
    disabled?: boolean; glow?: boolean
}

export interface PillSelectorProps { options: string[]; value: string; onChange: (value: string) => void; label?: string; size?: PillSize }
export interface PillStepperProps { value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; label?: string; suffix?: string }
export interface PillToggleProps { on: boolean; onChange: (value: boolean) => void; label?: string; onLabel?: string; offLabel?: string }
export interface PillBadgeProps { type?: BadgeType; label: string; pulse?: boolean; glow?: boolean; size?: PillSize }
export interface PillCardProps { children: ReactNode; className?: string; glow?: boolean; variant?: CardVariant }

export const sizes: Record<PillSize, string> = { sm: 'h-9 text-[14px] px-3.5', md: 'h-11 text-[16px] px-4', lg: 'h-13 text-[18px] px-5' }

export const variants: Record<PillVariant, VariantStyle> = {
    default: { base: 'bg-[#f5f5f7] dark:bg-[#2c2c2e]', focus: 'bg-white dark:bg-[#3a3a3c]', glow: '0 0 0 4px rgba(0,122,255,0.12), 0 0 24px rgba(0,122,255,0.15)', text: 'text-[#1d1d1f] dark:text-white', placeholder: 'placeholder:text-[#86868b]' },
    primary: { base: 'bg-[#007aff]/10 dark:bg-[#007aff]/15', focus: 'bg-[#007aff]/15 dark:bg-[#007aff]/20', glow: '0 0 0 4px rgba(0,122,255,0.2), 0 0 28px rgba(0,122,255,0.25)', text: 'text-[#007aff]', placeholder: 'placeholder:text-[#007aff]/40' },
    success: { base: 'bg-[#34c759]/10 dark:bg-[#34c759]/15', focus: 'bg-[#34c759]/15 dark:bg-[#34c759]/20', glow: '0 0 0 4px rgba(52,199,89,0.2), 0 0 28px rgba(52,199,89,0.25)', text: 'text-[#34c759]', placeholder: 'placeholder:text-[#34c759]/40' },
    warning: { base: 'bg-[#ff9f0a]/10 dark:bg-[#ff9f0a]/15', focus: 'bg-[#ff9f0a]/15 dark:bg-[#ff9f0a]/20', glow: '0 0 0 4px rgba(255,159,10,0.2), 0 0 28px rgba(255,159,10,0.25)', text: 'text-[#ff9f0a]', placeholder: 'placeholder:text-[#ff9f0a]/40' }
}

export const badgeStyles: Record<BadgeType, BadgeStyle> = {
    success: { bg: 'bg-[#34c759]/12', text: 'text-[#34c759]', glow: '0 0 20px rgba(52,199,89,0.35)', dot: 'bg-[#34c759]' },
    warning: { bg: 'bg-[#ff9f0a]/12', text: 'text-[#ff9f0a]', glow: '0 0 20px rgba(255,159,10,0.35)', dot: 'bg-[#ff9f0a]' },
    error: { bg: 'bg-[#ff3b30]/12', text: 'text-[#ff3b30]', glow: '0 0 20px rgba(255,59,48,0.35)', dot: 'bg-[#ff3b30]' },
    pending: { bg: 'bg-[#007aff]/12', text: 'text-[#007aff]', glow: '0 0 20px rgba(0,122,255,0.35)', dot: 'bg-[#007aff]' },
    info: { bg: 'bg-[#8e8e93]/12', text: 'text-[#8e8e93]', glow: '0 0 16px rgba(142,142,147,0.25)', dot: 'bg-[#8e8e93]' }
}

export const cardVariants: Record<CardVariant, string> = {
    default: 'bg-[#f5f5f7] dark:bg-[#2c2c2e]',
    glass: 'bg-white/70 dark:bg-black/50 backdrop-blur-2xl border border-white/20 dark:border-white/10',
    dark: 'bg-[#1d1d1f] dark:bg-[#0a0a0a]'
}
