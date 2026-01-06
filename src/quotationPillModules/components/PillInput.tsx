// ═══════════════════════════════════════════════════════════════════
// QUOTATION PILL MODULES — PillInput
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PillInputProps, PillSize, sizes, variants } from '../types'

export const PillInput: React.FC<PillInputProps> = ({ value, onChange, placeholder = '', label, suffix, prefix, type = 'text', inputMode, align = 'center', size = 'md', variant = 'default', width = 'auto', disabled = false, glow = true }) => {
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const v = variants[variant] || variants.default
    const sizeStyles: Record<PillSize, string> = { sm: 'h-9 text-[14px] px-3.5', md: 'h-11 text-[16px] px-4', lg: 'h-13 text-[18px] px-5' }

    return (
        <div className={`flex flex-col gap-1.5 ${width === 'full' ? 'w-full' : 'w-fit'}`}>
            {label && <motion.label className="text-[11px] font-semibold text-[#86868b] dark:text-[#8e8e93] uppercase tracking-widest ml-3"
                animate={{ color: isFocused ? '#007aff' : undefined, letterSpacing: isFocused ? '0.12em' : '0.1em' }} transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}>{label}</motion.label>}
            <motion.div className={`relative flex items-center gap-2 rounded-full overflow-hidden transition-colors duration-[250ms] ${sizeStyles[size]} ${isFocused ? v.focus : v.base} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
                onClick={() => !disabled && inputRef.current?.focus()} whileTap={{ scale: disabled ? 1 : 0.98 }}
                animate={{ scale: isFocused ? 1.02 : 1, boxShadow: isFocused && glow ? v.glow : '0 0 0 0px transparent' }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                {prefix && <motion.span className="text-[14px] font-semibold select-none" animate={{ color: isFocused ? '#007aff' : '#8e8e93', scale: isFocused ? 1.05 : 1 }} transition={{ duration: 0.2 }}>{prefix}</motion.span>}
                <input ref={inputRef} type={type} inputMode={inputMode} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
                    onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                    className={`flex-1 min-w-0 bg-transparent outline-none font-semibold tabular-nums ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} ${v.text} ${v.placeholder} disabled:cursor-not-allowed`}
                    style={{ width: width !== 'full' && width !== 'auto' ? width : undefined }} />
                {suffix && <span className={`text-[13px] font-semibold ${v.text} opacity-50 select-none`}>{suffix}</span>}
                <AnimatePresence>
                    {isFocused && glow && <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 0.6, x: 80 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="absolute inset-y-0 w-12 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
