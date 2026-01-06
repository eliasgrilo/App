import React, { useState, useRef, ChangeEvent, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * QuotationPill - Premium Apple Pill Input System
 */

// ═══ TYPES ═══
type PillSize = 'sm' | 'md' | 'lg'
type PillVariant = 'default' | 'success' | 'warning' | 'primary'
type BadgeType = 'success' | 'warning' | 'error' | 'info' | 'pending'
type CardVariant = 'default' | 'glass' | 'dark'
type TextAlign = 'left' | 'center' | 'right'

interface VariantStyle {
    base: string
    focus: string
    glow: string
    text: string
    placeholder: string
}

interface BadgeStyle {
    bg: string
    text: string
    glow: string
    dot: string
}

interface PillInputProps {
    value: string | number
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    label?: string
    suffix?: string
    prefix?: string
    type?: string
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
    align?: TextAlign
    size?: PillSize
    variant?: PillVariant
    width?: string | number
    disabled?: boolean
    glow?: boolean
}

interface PillSelectorProps {
    options: string[]
    value: string
    onChange: (value: string) => void
    label?: string
    size?: PillSize
}

interface PillStepperProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    label?: string
    suffix?: string
}

interface PillToggleProps {
    on: boolean
    onChange: (value: boolean) => void
    label?: string
    onLabel?: string
    offLabel?: string
}

interface PillBadgeProps {
    type?: BadgeType
    label: string
    pulse?: boolean
    glow?: boolean
    size?: PillSize
}

interface PillCardProps {
    children: ReactNode
    className?: string
    glow?: boolean
    variant?: CardVariant
}

// ─────────────────────────────────────────────
// PillInput - Premium Input in Pill Format
// ─────────────────────────────────────────────
export const PillInput: React.FC<PillInputProps> = ({
    value,
    onChange,
    placeholder = '',
    label,
    suffix,
    prefix,
    type = 'text',
    inputMode,
    align = 'center',
    size = 'md',
    variant = 'default',
    width = 'auto',
    disabled = false,
    glow = true
}) => {
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const sizes: Record<PillSize, string> = {
        sm: 'h-9 text-[14px] px-3.5',
        md: 'h-11 text-[16px] px-4',
        lg: 'h-13 text-[18px] px-5'
    }

    const variants: Record<PillVariant, VariantStyle> = {
        default: {
            base: 'bg-[#f5f5f7] dark:bg-[#2c2c2e]',
            focus: 'bg-white dark:bg-[#3a3a3c]',
            glow: '0 0 0 4px rgba(0,122,255,0.12), 0 0 24px rgba(0,122,255,0.15)',
            text: 'text-[#1d1d1f] dark:text-white',
            placeholder: 'placeholder:text-[#86868b]'
        },
        primary: {
            base: 'bg-[#007aff]/10 dark:bg-[#007aff]/15',
            focus: 'bg-[#007aff]/15 dark:bg-[#007aff]/20',
            glow: '0 0 0 4px rgba(0,122,255,0.2), 0 0 28px rgba(0,122,255,0.25)',
            text: 'text-[#007aff]',
            placeholder: 'placeholder:text-[#007aff]/40'
        },
        success: {
            base: 'bg-[#34c759]/10 dark:bg-[#34c759]/15',
            focus: 'bg-[#34c759]/15 dark:bg-[#34c759]/20',
            glow: '0 0 0 4px rgba(52,199,89,0.2), 0 0 28px rgba(52,199,89,0.25)',
            text: 'text-[#34c759]',
            placeholder: 'placeholder:text-[#34c759]/40'
        },
        warning: {
            base: 'bg-[#ff9f0a]/10 dark:bg-[#ff9f0a]/15',
            focus: 'bg-[#ff9f0a]/15 dark:bg-[#ff9f0a]/20',
            glow: '0 0 0 4px rgba(255,159,10,0.2), 0 0 28px rgba(255,159,10,0.25)',
            text: 'text-[#ff9f0a]',
            placeholder: 'placeholder:text-[#ff9f0a]/40'
        }
    }

    const v = variants[variant] || variants.default

    return (
        <div className={`flex flex-col gap-1.5 ${width === 'full' ? 'w-full' : 'w-fit'}`}>
            {/* Label with focus animation */}
            {label && (
                <motion.label
                    className="text-[11px] font-semibold text-[#86868b] dark:text-[#8e8e93] uppercase tracking-widest ml-3"
                    animate={{
                        color: isFocused ? '#007aff' : undefined,
                        letterSpacing: isFocused ? '0.12em' : '0.1em'
                    }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {label}
                </motion.label>
            )}

            {/* Pill Container */}
            <motion.div
                className={`
                    relative flex items-center gap-2
                    rounded-full overflow-hidden
                    transition-colors duration-[250ms]
                    ${sizes[size]}
                    ${isFocused ? v.focus : v.base}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
                `}
                onClick={() => !disabled && inputRef.current?.focus()}
                whileTap={{ scale: disabled ? 1 : 0.98 }}
                animate={{
                    scale: isFocused ? 1.02 : 1,
                    boxShadow: isFocused && glow ? v.glow : '0 0 0 0px transparent'
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                {/* Prefix */}
                {prefix && (
                    <motion.span
                        className={`text-[14px] font-semibold select-none`}
                        animate={{
                            color: isFocused ? '#007aff' : '#8e8e93',
                            scale: isFocused ? 1.05 : 1
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        {prefix}
                    </motion.span>
                )}

                {/* Input */}
                <input
                    ref={inputRef}
                    type={type}
                    inputMode={inputMode}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`
                        flex-1 min-w-0 bg-transparent outline-none
                        font-semibold tabular-nums
                        ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}
                        ${v.text} ${v.placeholder}
                        disabled:cursor-not-allowed
                    `}
                    style={{ width: width !== 'full' && width !== 'auto' ? width : undefined }}
                />

                {/* Suffix */}
                {suffix && (
                    <span className={`text-[13px] font-semibold ${v.text} opacity-50 select-none`}>
                        {suffix}
                    </span>
                )}

                {/* Focus Shine Effect */}
                <AnimatePresence>
                    {isFocused && glow && (
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 0.6, x: 80 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="absolute inset-y-0 w-12 pointer-events-none"
                            style={{
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
                            }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

// ─────────────────────────────────────────────
// PillSelector - Segmented Control in Pill Format
// ─────────────────────────────────────────────
export const PillSelector: React.FC<PillSelectorProps> = ({
    options = [],
    value,
    onChange,
    label,
    size = 'md'
}) => {
    const sizes: Record<PillSize, string> = {
        sm: 'h-8 text-[12px]',
        md: 'h-9 text-[13px]',
        lg: 'h-11 text-[15px]'
    }

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <span className="text-[11px] font-semibold text-[#86868b] dark:text-[#8e8e93] uppercase tracking-widest ml-3">
                    {label}
                </span>
            )}
            <div className="flex gap-1 p-1 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-full">
                {options.map((opt) => {
                    const isActive = value === opt
                    return (
                        <motion.button
                            key={opt}
                            type="button"
                            onClick={() => onChange(opt)}
                            className={`
                                relative px-3.5 ${sizes[size]} rounded-full
                                font-semibold transition-colors z-10
                                ${isActive
                                    ? 'text-white'
                                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                                }
                            `}
                            whileTap={{ scale: 0.95 }}
                        >
                            {/* Active Background */}
                            {isActive && (
                                <motion.div
                                    layoutId="pillSelector"
                                    className="absolute inset-0 bg-[#007aff] rounded-full"
                                    style={{
                                        boxShadow: '0 2px 8px rgba(0,122,255,0.4)'
                                    }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{opt}</span>
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// PillStepper - Premium Stepper +/- in Pill Format
// ─────────────────────────────────────────────
export const PillStepper: React.FC<PillStepperProps> = ({
    value = 1,
    onChange,
    min = 0,
    max = 99,
    step = 1,
    label,
    suffix
}) => {
    const canDecrement = value > min
    const canIncrement = value < max

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <span className="text-[11px] font-semibold text-[#86868b] dark:text-[#8e8e93] uppercase tracking-widest ml-3">
                    {label}
                </span>
            )}
            <div className="flex items-center gap-3 px-3 h-11 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-full">
                {/* Decrement */}
                <motion.button
                    type="button"
                    onClick={() => canDecrement && onChange(Math.max(min, value - step))}
                    disabled={!canDecrement}
                    className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        font-bold text-[20px] leading-none
                        transition-all
                        ${canDecrement
                            ? 'bg-[#007aff] text-white'
                            : 'bg-[#e5e5e7] dark:bg-[#3a3a3c] text-[#c7c7cc]'
                        }
                    `}
                    style={{
                        boxShadow: canDecrement ? '0 2px 8px rgba(0,122,255,0.35)' : 'none'
                    }}
                    whileTap={{ scale: canDecrement ? 0.88 : 1 }}
                    whileHover={{ scale: canDecrement ? 1.08 : 1 }}
                >
                    −
                </motion.button>

                {/* Value with animation */}
                <div className="flex items-baseline gap-1 min-w-[56px] justify-center">
                    <motion.span
                        key={value}
                        initial={{ opacity: 0, y: -12, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="text-[22px] font-bold text-[#1d1d1f] dark:text-white tabular-nums"
                        style={{ fontFamily: '-apple-system, SF Pro Display, system-ui' }}
                    >
                        {value}
                    </motion.span>
                    {suffix && (
                        <span className="text-[13px] text-[#86868b] font-semibold">
                            {suffix}
                        </span>
                    )}
                </div>

                {/* Increment */}
                <motion.button
                    type="button"
                    onClick={() => canIncrement && onChange(Math.min(max, value + step))}
                    disabled={!canIncrement}
                    className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        font-bold text-[20px] leading-none
                        transition-all
                        ${canIncrement
                            ? 'bg-[#007aff] text-white'
                            : 'bg-[#e5e5e7] dark:bg-[#3a3a3c] text-[#c7c7cc]'
                        }
                    `}
                    style={{
                        boxShadow: canIncrement ? '0 2px 8px rgba(0,122,255,0.35)' : 'none'
                    }}
                    whileTap={{ scale: canIncrement ? 0.88 : 1 }}
                    whileHover={{ scale: canIncrement ? 1.08 : 1 }}
                >
                    +
                </motion.button>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// PillToggle - Premium Toggle in Pill Format
// ─────────────────────────────────────────────
export const PillToggle: React.FC<PillToggleProps> = ({
    on = false,
    onChange,
    label,
    onLabel = 'On',
    offLabel = 'Off'
}) => {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <span className="text-[11px] font-semibold text-[#86868b] dark:text-[#8e8e93] uppercase tracking-widest ml-3">
                    {label}
                </span>
            )}
            <motion.button
                type="button"
                onClick={() => onChange(!on)}
                className={`
                    relative h-11 rounded-full px-1 flex items-center
                    transition-colors duration-300
                    ${on
                        ? 'bg-[#34c759]'
                        : 'bg-[#e5e5e7] dark:bg-[#3a3a3c]'
                    }
                `}
                style={{
                    width: '84px',
                    boxShadow: on ? '0 4px 16px rgba(52,199,89,0.35)' : 'none'
                }}
                whileTap={{ scale: 0.97 }}
            >
                {/* Labels */}
                <motion.span
                    className="absolute left-3 text-[10px] font-bold uppercase tracking-wider"
                    animate={{
                        opacity: on ? 1 : 0,
                        x: on ? 0 : -5
                    }}
                    style={{ color: 'white' }}
                >
                    {onLabel}
                </motion.span>
                <motion.span
                    className="absolute right-3 text-[10px] font-bold uppercase tracking-wider text-[#86868b]"
                    animate={{
                        opacity: !on ? 1 : 0,
                        x: !on ? 0 : 5
                    }}
                >
                    {offLabel}
                </motion.span>

                {/* Knob */}
                <motion.div
                    className="w-9 h-9 bg-white rounded-full flex items-center justify-center"
                    animate={{ x: on ? 42 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    style={{
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                >
                    {/* Checkmark / Dash */}
                    <motion.svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        animate={{
                            opacity: 1
                        }}
                    >
                        {on ? (
                            <motion.path
                                d="M2 7L5.5 10.5L12 4"
                                stroke="#34c759"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                fill="none"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                            />
                        ) : (
                            <path
                                d="M3 7H11"
                                stroke="#c7c7cc"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        )}
                    </motion.svg>
                </motion.div>
            </motion.button>
        </div>
    )
}

// ─────────────────────────────────────────────
// PillBadge - Status Badge in Pill Format
// ─────────────────────────────────────────────
export const PillBadge: React.FC<PillBadgeProps> = ({
    type = 'info',
    label,
    pulse = false,
    glow = true,
    size = 'md'
}) => {
    const styles: Record<BadgeType, BadgeStyle> = {
        success: {
            bg: 'bg-[#34c759]/12',
            text: 'text-[#34c759]',
            glow: '0 0 20px rgba(52,199,89,0.35)',
            dot: 'bg-[#34c759]'
        },
        warning: {
            bg: 'bg-[#ff9f0a]/12',
            text: 'text-[#ff9f0a]',
            glow: '0 0 20px rgba(255,159,10,0.35)',
            dot: 'bg-[#ff9f0a]'
        },
        error: {
            bg: 'bg-[#ff3b30]/12',
            text: 'text-[#ff3b30]',
            glow: '0 0 20px rgba(255,59,48,0.35)',
            dot: 'bg-[#ff3b30]'
        },
        pending: {
            bg: 'bg-[#007aff]/12',
            text: 'text-[#007aff]',
            glow: '0 0 20px rgba(0,122,255,0.35)',
            dot: 'bg-[#007aff]'
        },
        info: {
            bg: 'bg-[#8e8e93]/12',
            text: 'text-[#8e8e93]',
            glow: '0 0 16px rgba(142,142,147,0.25)',
            dot: 'bg-[#8e8e93]'
        }
    }

    const sizes: Record<PillSize, string> = {
        sm: 'px-2.5 py-1 text-[9px] gap-1.5',
        md: 'px-3 py-1.5 text-[10px] gap-2',
        lg: 'px-4 py-2 text-[12px] gap-2'
    }

    const s = styles[type] || styles.info

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
                inline-flex items-center 
                rounded-full 
                ${sizes[size]}
                ${s.bg}
                backdrop-blur-sm
            `}
            style={{
                boxShadow: glow ? s.glow : 'none'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            {/* Status dot with pulse */}
            <span className="relative flex h-2 w-2">
                {pulse && (
                    <motion.span
                        className={`absolute inline-flex h-full w-full rounded-full ${s.dot}`}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.8, 0, 0.8]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${s.dot}`} />
            </span>

            <span className={`font-bold uppercase tracking-wider ${s.text}`}>
                {label}
            </span>
        </motion.div>
    )
}

// ─────────────────────────────────────────────
// PillCard - Container Card in Pill Format
// ─────────────────────────────────────────────
export const PillCard: React.FC<PillCardProps> = ({
    children,
    className = '',
    glow = false,
    variant = 'default'
}) => {
    const variants: Record<CardVariant, string> = {
        default: 'bg-[#f5f5f7] dark:bg-[#2c2c2e]',
        glass: 'bg-white/70 dark:bg-black/50 backdrop-blur-2xl border border-white/20 dark:border-white/10',
        dark: 'bg-[#1d1d1f] dark:bg-[#0a0a0a]'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                rounded-[24px] p-5
                ${variants[variant]}
                ${className}
            `}
            style={{
                boxShadow: glow
                    ? '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)'
                    : 'none'
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            {children}
        </motion.div>
    )
}

// Default export
export default PillBadge
