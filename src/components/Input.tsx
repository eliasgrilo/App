// ═══════════════════════════════════════════════════════════════════
// INPUT — Apple-quality Input Component
// Refactored: 224 → ~60 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import { forwardRef, useState } from 'react'
import { InputProps, inputSizes, inputVariants } from '../inputModules'

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, helper, icon, iconPosition = 'left', variant = 'default', size = 'md', fullWidth = true, className = '', containerClassName = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const hasError = !!error

    return (
        <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
            {label && <label className={`block mb-2 text-sm font-semibold tracking-tight ${hasError ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'}`}>{label}</label>}
            <div className="relative">
                {icon && iconPosition === 'left' && <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 ${isFocused ? 'text-indigo-500' : ''} transition-colors duration-[250ms]`}>{icon}</div>}
                <input ref={ref} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                    className={`w-full rounded-xl font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all duration-[250ms] disabled:opacity-50 disabled:cursor-not-allowed ${inputSizes[size] || inputSizes.md} ${inputVariants[variant] || inputVariants.default} ${icon && iconPosition === 'left' ? 'pl-10' : ''} ${icon && iconPosition === 'right' ? 'pr-10' : ''} ${hasError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
                    {...props} />
                {icon && iconPosition === 'right' && <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 ${isFocused ? 'text-indigo-500' : ''} transition-colors duration-[250ms]`}>{icon}</div>}
            </div>
            {(error || helper) && <p className={`mt-2 text-sm ${hasError ? 'text-rose-500' : 'text-zinc-500 dark:text-zinc-400'}`}>{error || helper}</p>}
        </div>
    )
})

Input.displayName = 'Input'

export { Textarea } from '../inputModules'
export type { InputProps, TextareaProps, InputVariant, InputSize, IconPosition } from '../inputModules'
export default Input
