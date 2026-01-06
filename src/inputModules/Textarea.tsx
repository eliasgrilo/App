// ═══════════════════════════════════════════════════════════════════
// INPUT MODULES — Textarea Component
// ═══════════════════════════════════════════════════════════════════

import { forwardRef } from 'react'
import { TextareaProps } from './types'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, helper, rows = 4, className = '', ...props }, ref) => {
    const hasError = !!error
    return (
        <div className="w-full">
            {label && <label className={`block mb-2 text-sm font-semibold tracking-tight ${hasError ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'}`}>{label}</label>}
            <textarea ref={ref} rows={rows} className={`w-full px-4 py-3 text-[15px] rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/12 transition-all duration-[250ms] disabled:opacity-50 disabled:cursor-not-allowed resize-none shadow-sm ${hasError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/12' : ''} ${className}`} {...props} />
            {(error || helper) && <p className={`mt-2 text-sm ${hasError ? 'text-rose-500' : 'text-zinc-500'}`}>{error || helper}</p>}
        </div>
    )
})

Textarea.displayName = 'Textarea'
