// ═══════════════════════════════════════════════════════════════════
// SHARED INPUTS — SmartInput (Unified)
// Premium input with focus glow animation - Apple Design Language
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export interface SmartInputProps {
    value: string
    onChange: (e: { target: { value: string } }) => void
    placeholder?: string
    type?: string
    inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none'
    align?: 'left' | 'right'
    format?: 'number' | 'integer' | 'currency' | string
    formatter?: (val: string) => string
    suffix?: string
    prefix?: string
    width?: string
    fullWidth?: boolean
    autoFocus?: boolean
}

export function SmartInput({
    value, onChange, placeholder, type = 'text', inputMode, align = 'right',
    format, formatter, suffix, prefix, width = 'w-24', fullWidth = false, autoFocus = false
}: SmartInputProps) {
    const [focused, setFocused] = useState(false)
    const [localValue, setLocalValue] = useState(value)

    useEffect(() => { setLocalValue(value) }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value
        // Apply formatter if provided
        if (formatter) val = formatter(val)
        // Apply format rules
        else if (format === 'integer') val = val.replace(/\D/g, '')
        else if (format === 'number' || format === 'currency') {
            val = val.replace(/[^\d.]/g, '')
            const parts = val.split('.')
            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
        }
        setLocalValue(val)
        onChange({ target: { value: val } })
    }

    return (
        <motion.div
            className={`relative flex items-center gap-1.5 ${fullWidth ? 'flex-1' : ''}`}
            animate={{ scale: focused ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {prefix && <motion.span className="text-[17px] font-medium" animate={{ color: focused ? '#007aff' : '#8e8e93' }}>{prefix}</motion.span>}
            <motion.div
                animate={{ boxShadow: focused ? '0 0 0 4px rgba(0,122,255,0.15), 0 0 20px rgba(0,122,255,0.1)' : '0 0 0 0px rgba(0,122,255,0)' }}
                style={{ borderRadius: 10 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <input
                    type={type}
                    inputMode={inputMode}
                    value={localValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`${width} h-[36px] px-3 text-[17px] font-medium tabular-nums bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px] text-[#007aff] placeholder:text-[#aeaeb2] outline-none transition-colors duration-[250ms] ${align === 'right' ? 'text-right' : 'text-left'} ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}`}
                />
            </motion.div>
            {suffix && <motion.span className="text-[15px] font-medium" animate={{ color: focused ? '#007aff' : '#8e8e93' }}>{suffix}</motion.span>}
        </motion.div>
    )
}
