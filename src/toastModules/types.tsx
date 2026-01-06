// ═══════════════════════════════════════════════════════════════════
// TOAST MODULES — Types & Constants
// ═══════════════════════════════════════════════════════════════════

import React from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading'

export interface ToastAction { label: string; onClick?: () => void }
export interface ToastData { id: number; message: string; title?: string; type: ToastType; action?: ToastAction; duration: number }
export interface ToastOptions { message?: string; title?: string; type?: ToastType; action?: ToastAction; duration?: number }
export interface PromiseMessages { loading?: string; success?: string; error?: string }

export interface ToastMethods {
    success: (message: string, options?: Partial<ToastOptions>) => number
    error: (message: string, options?: Partial<ToastOptions>) => number
    info: (message: string, options?: Partial<ToastOptions>) => number
    warning: (message: string, options?: Partial<ToastOptions>) => number
    loading: (message: string, options?: Partial<ToastOptions>) => number
    promise: <T>(promise: Promise<T>, messages: PromiseMessages) => Promise<T>
}

export interface ToastAPI {
    show: (options: ToastOptions | string) => number; dismiss: (id: number) => void; dismissAll: () => void
    success: (message: string, options?: Partial<ToastOptions>) => number; error: (message: string, options?: Partial<ToastOptions>) => number
    info: (message: string, options?: Partial<ToastOptions>) => number; warning: (message: string, options?: Partial<ToastOptions>) => number
    loading: (message: string, options?: Partial<ToastOptions>) => number; promise: <T>(promise: Promise<T>, messages: PromiseMessages) => Promise<T>
    toast: ToastMethods
}

export interface ToastStyle { bg: string; border: string; text: string; icon: string; progress: string }

export const HapticService = {
    light: (): void => { if ('vibrate' in navigator) navigator.vibrate(10) },
    medium: (): void => { if ('vibrate' in navigator) navigator.vibrate(25) },
    success: (): void => { if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]) },
    error: (): void => { if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]) }
}

export const ToastIcons: Record<ToastType, React.ReactElement> = {
    success: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" /><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M8 12l2.5 2.5L16 9" /></svg>,
    error: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" /><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" /></svg>,
    info: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" /><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M12 16v-4M12 8h.01" /></svg>,
    warning: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fillOpacity="0.15" d="M12 2L2 20h20L12 2z" /><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 9v4M12 17h.01" /></svg>,
    loading: <svg className="w-[18px] h-[18px] animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" /><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" /></svg>
}

export const getToastStyles = (type: ToastType): ToastStyle => {
    const styles: Record<ToastType, ToastStyle> = {
        success: { bg: 'bg-emerald-50/95 dark:bg-emerald-950/95', border: 'border-emerald-200/50 dark:border-emerald-800/50', text: 'text-emerald-900 dark:text-emerald-100', icon: 'text-emerald-500', progress: 'bg-emerald-500' },
        error: { bg: 'bg-rose-50/95 dark:bg-rose-950/95', border: 'border-rose-200/50 dark:border-rose-800/50', text: 'text-rose-900 dark:text-rose-100', icon: 'text-rose-500', progress: 'bg-rose-500' },
        info: { bg: 'bg-blue-50/95 dark:bg-blue-950/95', border: 'border-blue-200/50 dark:border-blue-800/50', text: 'text-blue-900 dark:text-blue-100', icon: 'text-blue-500', progress: 'bg-blue-500' },
        warning: { bg: 'bg-amber-50/95 dark:bg-amber-950/95', border: 'border-amber-200/50 dark:border-amber-800/50', text: 'text-amber-900 dark:text-amber-100', icon: 'text-amber-500', progress: 'bg-amber-500' },
        loading: { bg: 'bg-zinc-50/95 dark:bg-zinc-900/95', border: 'border-zinc-200/50 dark:border-zinc-700/50', text: 'text-zinc-900 dark:text-zinc-100', icon: 'text-indigo-500', progress: 'bg-indigo-500' }
    }
    return styles[type]
}
