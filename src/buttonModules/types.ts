// ═══════════════════════════════════════════════════════════════════
// BUTTON MODULES — Types & Styles
// ═══════════════════════════════════════════════════════════════════

import { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type IconPosition = 'left' | 'right'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
    children?: ReactNode; variant?: ButtonVariant; size?: ButtonSize; loading?: boolean
    disabled?: boolean; icon?: ReactNode; iconPosition?: IconPosition; fullWidth?: boolean; className?: string
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
    children?: ReactNode; variant?: 'ghost' | 'primary' | 'danger'; size?: 'xs' | 'sm' | 'md' | 'lg'
    className?: string; 'aria-label'?: string
}

export const buttonVariants: Record<ButtonVariant, string> = {
    primary: 'bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700 focus-visible:ring-indigo-500/30 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/25',
    secondary: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 dark:active:bg-zinc-600 focus-visible:ring-zinc-500/30 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 focus-visible:ring-zinc-500/40',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 focus-visible:ring-rose-500/40',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 focus-visible:ring-emerald-500/40',
    outline: 'bg-transparent text-indigo-500 border-2 border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 active:bg-indigo-100 dark:active:bg-indigo-900 focus-visible:ring-indigo-500/40'
}

export const buttonSizes: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg', sm: 'px-3 py-2 text-sm gap-2 rounded-xl', md: 'px-4 py-2.5 text-[15px] gap-2 rounded-xl',
    lg: 'px-5 py-3 text-base gap-2.5 rounded-2xl', xl: 'px-6 py-3.5 text-lg gap-3 rounded-2xl'
}

export const iconButtonSizes: Record<string, string> = { xs: 'w-7 h-7', sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }

export const iconButtonVariants: Record<string, string> = {
    ghost: 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 focus-visible:ring-zinc-500/40',
    primary: 'bg-indigo-500 text-white hover:bg-indigo-600 focus-visible:ring-indigo-500/40',
    danger: 'text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 focus-visible:ring-rose-500/40'
}
