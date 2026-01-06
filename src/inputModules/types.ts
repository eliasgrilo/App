// ═══════════════════════════════════════════════════════════════════
// INPUT MODULES — Types & Styles
// ═══════════════════════════════════════════════════════════════════

import { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

export type InputVariant = 'default' | 'filled' | 'ghost'
export type InputSize = 'sm' | 'md' | 'lg'
export type IconPosition = 'left' | 'right'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string; error?: string; helper?: string; icon?: ReactNode; iconPosition?: IconPosition
    variant?: InputVariant; size?: InputSize; fullWidth?: boolean; containerClassName?: string
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string; error?: string; helper?: string; rows?: number
}

export const inputSizes: Record<InputSize, string> = { sm: 'px-3 py-2 text-sm', md: 'px-4 py-3 text-[15px]', lg: 'px-5 py-4 text-base' }

export const inputVariants: Record<InputVariant, string> = {
    default: 'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/12 shadow-sm',
    filled: 'bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/12',
    ghost: 'bg-transparent border-b-2 border-zinc-200/80 dark:border-zinc-700/80 rounded-none focus:border-indigo-500'
}
