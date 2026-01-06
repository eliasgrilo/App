import { forwardRef, useState, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

/**
 * ═══════════════════════════════════════════════════════════════════
 * INPUT — Apple-quality Input Component
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ TYPES ═══
type InputVariant = 'default' | 'filled' | 'ghost'
type InputSize = 'sm' | 'md' | 'lg'
type IconPosition = 'left' | 'right'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string
    error?: string
    helper?: string
    icon?: ReactNode
    iconPosition?: IconPosition
    variant?: InputVariant
    size?: InputSize
    fullWidth?: boolean
    containerClassName?: string
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    helper?: string
    rows?: number
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helper,
    icon,
    iconPosition = 'left',
    variant = 'default',
    size = 'md',
    fullWidth = true,
    className = '',
    containerClassName = '',
    ...props
}, ref) => {

    const [isFocused, setIsFocused] = useState(false)

    const sizes: Record<InputSize, string> = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-[15px]',
        lg: 'px-5 py-4 text-base'
    }

    const variants: Record<InputVariant, string> = {
        default: `
            bg-white dark:bg-zinc-900
            border border-zinc-200/80 dark:border-zinc-700/80
            focus:border-indigo-500 dark:focus:border-indigo-500
            focus:ring-4 focus:ring-indigo-500/12
            shadow-sm
        `,
        filled: `
            bg-zinc-100 dark:bg-zinc-800
            border border-transparent
            focus:bg-white dark:focus:bg-zinc-900
            focus:border-indigo-500
            focus:ring-4 focus:ring-indigo-500/12
        `,
        ghost: `
            bg-transparent
            border-b-2 border-zinc-200/80 dark:border-zinc-700/80
            rounded-none
            focus:border-indigo-500
        `
    }

    const hasError = !!error

    return (
        <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
            {/* Label */}
            {label && (
                <label
                    className={`
                        block mb-2 text-sm font-semibold tracking-tight
                        ${hasError
                            ? 'text-rose-500'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }
                    `}
                >
                    {label}
                </label>
            )}

            {/* Input Container */}
            <div className="relative">
                {/* Left Icon */}
                {icon && iconPosition === 'left' && (
                    <div className={`
                        absolute left-3 top-1/2 -translate-y-1/2
                        text-zinc-400 dark:text-zinc-500
                        ${isFocused ? 'text-indigo-500' : ''}
                        transition-colors duration-[250ms]
                    `}>
                        {icon}
                    </div>
                )}

                {/* Input */}
                <input
                    ref={ref}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`
                        w-full rounded-xl
                        font-medium
                        placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                        outline-none
                        transition-all duration-[250ms]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${sizes[size] || sizes.md}
                        ${variants[variant] || variants.default}
                        ${icon && iconPosition === 'left' ? 'pl-10' : ''}
                        ${icon && iconPosition === 'right' ? 'pr-10' : ''}
                        ${hasError
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                            : ''
                        }
                        ${className}
                    `}
                    {...props}
                />

                {/* Right Icon */}
                {icon && iconPosition === 'right' && (
                    <div className={`
                        absolute right-3 top-1/2 -translate-y-1/2
                        text-zinc-400 dark:text-zinc-500
                        ${isFocused ? 'text-indigo-500' : ''}
                        transition-colors duration-[250ms]
                    `}>
                        {icon}
                    </div>
                )}
            </div>

            {/* Error / Helper Text */}
            {(error || helper) && (
                <p className={`
                    mt-2 text-sm
                    ${hasError
                        ? 'text-rose-500'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }
                `}>
                    {error || helper}
                </p>
            )}
        </div>
    )
})

Input.displayName = 'Input'

// Textarea
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
    label,
    error,
    helper,
    rows = 4,
    className = '',
    ...props
}, ref) => {
    const hasError = !!error

    return (
        <div className="w-full">
            {label && (
                <label className={`
                    block mb-2 text-sm font-semibold tracking-tight
                    ${hasError ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'}
                `}>
                    {label}
                </label>
            )}

            <textarea
                ref={ref}
                rows={rows}
                className={`
                    w-full px-4 py-3 text-[15px]
                    rounded-xl
                    bg-white dark:bg-zinc-900
                    border border-zinc-200/80 dark:border-zinc-700/80
                    font-medium
                    placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                    outline-none
                    focus:border-indigo-500 dark:focus:border-indigo-500
                    focus:ring-4 focus:ring-indigo-500/12
                    transition-all duration-[250ms]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    resize-none
                    shadow-sm
                    ${hasError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/12' : ''}
                    ${className}
                `}
                {...props}
            />

            {(error || helper) && (
                <p className={`mt-2 text-sm ${hasError ? 'text-rose-500' : 'text-zinc-500'}`}>
                    {error || helper}
                </p>
            )}
        </div>
    )
})

Textarea.displayName = 'Textarea'

export default Input
