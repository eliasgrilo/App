// ═══════════════════════════════════════════════════════════════════
// SHARED INPUTS — NameInput (Unified)
// Premium name input with subtle focus animation
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { motion } from 'framer-motion'

export interface NameInputProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    autoFocus?: boolean
}

export function NameInput({ value, onChange, placeholder, autoFocus }: NameInputProps) {
    const [focused, setFocused] = useState(false)

    return (
        <motion.div
            className="relative"
            animate={{ backgroundColor: focused ? 'rgba(0,122,255,0.02)' : 'transparent' }}
            transition={{ duration: 0.2 }}
        >
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoFocus={autoFocus}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full h-[52px] px-4 text-[17px] font-medium bg-transparent text-[#1d1d1f] dark:text-white placeholder:text-[#aeaeb2] outline-none transition-all duration-[250ms]"
            />
        </motion.div>
    )
}
