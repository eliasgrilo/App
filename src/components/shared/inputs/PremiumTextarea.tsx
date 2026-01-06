// ═══════════════════════════════════════════════════════════════════
// SHARED INPUTS — PremiumTextarea (Unified)
// Animated textarea with focus glow
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { motion } from 'framer-motion'

export interface PremiumTextareaProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    placeholder?: string
    rows?: number
}

export function PremiumTextarea({ value, onChange, placeholder, rows = 3 }: PremiumTextareaProps) {
    const [focused, setFocused] = useState(false)

    return (
        <motion.div
            animate={{ boxShadow: focused ? '0 0 0 4px rgba(0,122,255,0.12), 0 0 20px rgba(0,122,255,0.1)' : '0 0 0 0px rgba(0,122,255,0)' }}
            style={{ borderRadius: 14 }}
        >
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={`w-full px-4 py-3 text-[17px] font-medium bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[14px] text-[#1d1d1f] dark:text-white placeholder:text-[#aeaeb2] outline-none transition-colors duration-[250ms] resize-none ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}`}
            />
        </motion.div>
    )
}
