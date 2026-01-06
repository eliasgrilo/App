// ═══════════════════════════════════════════════════════════════════
// SHARED INPUTS — Toggle (Unified)
// iOS-style toggle switch with spring animation
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'

const CheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

export interface ToggleProps {
    on: boolean
    onChange: (value: boolean) => void
    label?: string
}

export function Toggle({ on, onChange, label = "Alternar opção" }: ToggleProps) {
    return (
        <motion.button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            onClick={() => onChange(!on)}
            className={`relative w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-300 ${on ? 'bg-[#34c759]' : 'bg-[#e9e9eb] dark:bg-[#39393d]'}`}
            whileTap={{ scale: 0.95 }}
            style={{ boxShadow: on ? '0 2px 12px rgba(52,199,89,0.4)' : 'none' }}
        >
            <motion.div
                className="w-[27px] h-[27px] bg-white rounded-full shadow-md flex items-center justify-center"
                animate={{ x: on ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
                <motion.div
                    className="text-[#34c759]"
                    animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }}
                >
                    <CheckIcon />
                </motion.div>
            </motion.div>
        </motion.button>
    )
}
