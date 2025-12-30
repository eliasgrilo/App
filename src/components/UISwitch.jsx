import React from 'react'
import { motion } from 'framer-motion'
import { HapticService } from '../services/hapticService'

/**
 * UISwitch - iOS-style Toggle Switch
 * Apple HIG compliant with spring animation and haptic feedback
 */
export default function UISwitch({
    checked = false,
    onChange,
    disabled = false,
    size = 'default' // 'small' | 'default' | 'large'
}) {
    const handleToggle = () => {
        if (disabled) return
        HapticService.trigger('selection')
        onChange?.(!checked)
    }

    const sizes = {
        small: { track: 'w-10 h-6', thumb: 'w-4 h-4', translate: 16 },
        default: { track: 'w-12 h-7', thumb: 'w-5 h-5', translate: 20 },
        large: { track: 'w-14 h-8', thumb: 'w-6 h-6', translate: 24 }
    }

    const s = sizes[size] || sizes.default

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={handleToggle}
            disabled={disabled}
            className={`
                relative inline-flex items-center shrink-0 cursor-pointer
                rounded-full p-1 transition-colors duration-200
                ${checked
                    ? 'bg-emerald-500'
                    : 'bg-zinc-200 dark:bg-zinc-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${s.track}
                touch-manipulation
            `}
        >
            <motion.span
                animate={{ x: checked ? s.translate : 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30
                }}
                className={`
                    ${s.thumb}
                    bg-white rounded-full shadow-lg
                    ring-0 pointer-events-none
                `}
                style={{
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.1)'
                }}
            />
        </button>
    )
}
