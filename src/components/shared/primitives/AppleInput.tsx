/**
 * AppleInput — Apple native style input with focus animation
 * Used across modals for text, tel, and email inputs
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { SPRING_BOUNCY } from './animations'

export interface AppleInputProps {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    type?: 'text' | 'tel' | 'email' | 'number'
    align?: 'left' | 'right'
    size?: 'sm' | 'md' | 'lg' | 'full'
    autoFocus?: boolean
    onAction?: () => void
    actionIcon?: React.ReactNode
}

const sizeClasses = {
    sm: 'h-8 px-2.5 text-[14px] min-w-[80px]',
    md: 'h-9 px-3 text-[15px] min-w-[100px]',
    lg: 'h-10 px-3.5 text-[16px] min-w-[120px]',
    full: 'h-11 px-4 text-[15px] w-full',
}

export const AppleInput: React.FC<AppleInputProps> = ({
    value,
    onChange,
    placeholder,
    type = 'text',
    align = 'right',
    size = 'md',
    autoFocus,
    onAction,
    actionIcon
}) => {
    const [isFocused, setIsFocused] = useState(false)

    return (
        <motion.div
            animate={{ scale: isFocused ? 1.02 : 1 }}
            transition={SPRING_BOUNCY}
            className="relative flex items-center gap-2"
        >
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`
                    ${sizeClasses[size]} rounded-lg
                    bg-zinc-100/80 dark:bg-zinc-700/50
                    border-0 outline-none
                    font-medium text-zinc-900 dark:text-white
                    placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                    focus:bg-white dark:focus:bg-zinc-700
                    focus:ring-2 focus:ring-blue-500/40
                    transition-all duration-200
                    ${align === 'right' ? 'text-right' : 'text-left'}
                `}
            />
            {onAction && actionIcon && value && (
                <motion.button
                    type="button"
                    onClick={onAction}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-lg"
                >
                    {actionIcon}
                </motion.button>
            )}
        </motion.div>
    )
}

export default AppleInput
