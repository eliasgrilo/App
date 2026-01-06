/**
 * Shared modal form components
 */

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ModalIcons, iconGradients, shadowColors } from './ModalIcons'

// Format phone number as (XX) XXXXX-XXXX
export const formatPhone = (value: string): string => {
    if (!value) return ''
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return `(${numbers}`
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

// Validate email format
export const isValidEmail = (email: string | null | undefined): boolean | null => {
    if (!email) return null
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
}

// Format file size
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Section with gradient icon and spring animation
interface SectionProps {
    icon: React.ReactNode
    iconKey: string
    title: string
    children: React.ReactNode
    footer?: string
    delay?: number
    expandable?: boolean
    defaultExpanded?: boolean
}

export const Section = ({ icon, iconKey, title, children, footer, delay = 0, expandable = false, defaultExpanded = true }: SectionProps): React.ReactElement => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    return (
        <motion.section
            className="mb-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: delay * 0.06 }}
        >
            <motion.button
                onClick={expandable ? () => setIsExpanded(!isExpanded) : undefined}
                className={`w-full flex items-center gap-3 mb-2.5 px-4 ${expandable ? 'cursor-pointer' : 'cursor-default'}`}
                whileTap={expandable ? { scale: 0.99 } : {}}
            >
                <motion.div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white"
                    style={{
                        background: iconGradients[iconKey] || iconGradients.identification,
                        boxShadow: `0 4px 12px ${shadowColors[iconKey] || 'rgba(0,0,0,0.2)'}`
                    }}
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                    {icon}
                </motion.div>
                <span className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight flex-1 text-left">
                    {title}
                </span>
                {expandable && (
                    <motion.div
                        className="text-[#c7c7cc]"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {ModalIcons.chevronDown}
                    </motion.div>
                )}
            </motion.button>

            <AnimatePresence>
                {(!expandable || isExpanded) && (
                    <motion.div
                        initial={expandable ? { height: 0, opacity: 0 } : false}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={expandable ? { height: 0, opacity: 0 } : {}}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="overflow-hidden"
                    >
                        <div className="mx-4 bg-white dark:bg-[#1c1c1e] rounded-[14px] overflow-hidden shadow-sm border border-black/[0.04] dark:border-white/[0.06]">
                            {children}
                        </div>
                        {footer && (
                            <p className="px-5 pt-2 text-[13px] text-[#6d6d72] dark:text-[#8e8e93]">
                                {footer}
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    )
}

// Premium Form Row
interface RowProps {
    label: string
    last?: boolean
    children: React.ReactNode
}

export const Row = ({ label, last, children }: RowProps): React.ReactElement => (
    <div className={`flex items-center justify-between min-h-[52px] px-4 ${!last ? 'border-b border-[#e5e5ea]/60 dark:border-[#38383a]/80' : ''}`}>
        <span className="text-[17px] text-[#1d1d1f] dark:text-white">{label}</span>
        <div className="flex items-center gap-2">{children}</div>
    </div>
)

// Smart Input with focus glow
interface SmartInputProps {
    value: string
    onChange: (e: { target: { value: string } }) => void
    placeholder?: string
    type?: string
    inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none'
    align?: 'left' | 'right'
    width?: string
    autoFocus?: boolean
    formatter?: (val: string) => string
    fullWidth?: boolean
}

export const SmartInput = ({
    value, onChange, placeholder, type = 'text', inputMode, align = 'right',
    width = 'w-full', autoFocus = false, formatter, fullWidth = false
}: SmartInputProps): React.ReactElement => {
    const [focused, setFocused] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        let val = e.target.value
        if (formatter) val = formatter(val)
        onChange({ target: { value: val } })
    }

    return (
        <motion.div
            className={`relative ${fullWidth ? 'flex-1' : ''}`}
            animate={{ scale: focused ? 1.01 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            <motion.div
                animate={{
                    boxShadow: focused
                        ? '0 0 0 4px rgba(0,122,255,0.12), 0 0 20px rgba(0,122,255,0.1)'
                        : '0 0 0 0px rgba(0,122,255,0)'
                }}
                style={{ borderRadius: 10 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <input
                    type={type}
                    inputMode={inputMode}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`
                        ${width} h-[36px] px-3 text-[17px] font-medium
                        bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px]
                        text-[#007aff] placeholder:text-[#aeaeb2]
                        outline-none transition-colors duration-[250ms]
                        ${align === 'right' ? 'text-right' : 'text-left'}
                        ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}
                    `}
                />
            </motion.div>
        </motion.div>
    )
}

// Apple Toggle
interface ToggleProps {
    on: boolean
    onChange: (value: boolean) => void
    label?: string
}

export const Toggle = ({ on, onChange, label = "Alternar opção" }: ToggleProps): React.ReactElement => (
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
                {ModalIcons.check}
            </motion.div>
        </motion.div>
    </motion.button>
)

// Premium Textarea
interface PremiumTextareaProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    placeholder?: string
    rows?: number
}

export const PremiumTextarea = ({ value, onChange, placeholder, rows = 3 }: PremiumTextareaProps): React.ReactElement => {
    const [focused, setFocused] = useState(false)

    return (
        <motion.div
            animate={{
                boxShadow: focused
                    ? '0 0 0 4px rgba(0,122,255,0.12), 0 0 20px rgba(0,122,255,0.1)'
                    : '0 0 0 0px rgba(0,122,255,0)'
            }}
            style={{ borderRadius: 14 }}
        >
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={`
                    w-full px-4 py-3 text-[17px] font-medium
                    bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[14px]
                    text-[#1d1d1f] dark:text-white placeholder:text-[#aeaeb2]
                    outline-none transition-colors duration-[250ms] resize-none
                    ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}
                `}
            />
        </motion.div>
    )
}
