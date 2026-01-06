import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { MODAL_ANIMATIONS } from '../utils/animations'

/**
 * AddSupplierModal — True Apple + Google HIG Design
 * 
 * Premium iOS/macOS design with:
 * - SF Symbol-style icons with vibrant gradients
 * - Glassmorphism header with premium pill indicator
 * - Smart auto-formatting inputs (phone, email)
 * - Magic micro-interactions & spring physics
 * - Premium file upload with drag & drop
 * - Linked items with search
 * - Focus trap for accessibility (WCAG 2.1)
 */

// ════════════════════════════════════════════════════════════════
// SF SYMBOLS (Premium SVG Icons)
// ════════════════════════════════════════════════════════════════

const Icons = {
    person: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    phone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    ),
    envelope: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    ),
    mappin: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    link: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    bolt: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    paperclip: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    ),
    text: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    check: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    xmark: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    chevronDown: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    whatsapp: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    ),
    call: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    ),
    mail: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    ),
    plus: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    upload: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    )
}

// Vibrant gradient backgrounds for section icons
const iconGradients = {
    identification: 'linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)',
    contact: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
    address: 'linear-gradient(135deg, #FF9500 0%, #FFCC00 100%)',
    commercial: 'linear-gradient(135deg, #5856D6 0%, #007AFF 100%)',
    links: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
    automation: 'linear-gradient(135deg, #FF2D55 0%, #FF6482 100%)',
    attachments: 'linear-gradient(135deg, #AF52DE 0%, #5856D6 100%)',
    notes: 'linear-gradient(135deg, #8E8E93 0%, #636366 100%)'
}

// ════════════════════════════════════════════════════════════════
// FORMATTERS
// ════════════════════════════════════════════════════════════════

// Format phone number as (XX) XXXXX-XXXX
const formatPhone = (value: string): string => {
    if (!value) return ''
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return `(${numbers}`
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

// Validate email format
const isValidEmail = (email: string | null | undefined): boolean | null => {
    if (!email) return null
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
}

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// ════════════════════════════════════════════════════════════════
// PREMIUM APPLE COMPONENTS
// ════════════════════════════════════════════════════════════════

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

const Section = ({ icon, iconKey, title, children, footer, delay = 0, expandable = false, defaultExpanded = true }: SectionProps): React.ReactElement => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    const shadowColor: Record<string, string> = {
        identification: 'rgba(88,86,214,0.4)',
        contact: 'rgba(0,122,255,0.4)',
        address: 'rgba(255,149,0,0.4)',
        commercial: 'rgba(88,86,214,0.4)',
        links: 'rgba(52,199,89,0.4)',
        rating: 'rgba(255,214,10,0.4)',
        automation: 'rgba(255,45,85,0.4)',
        attachments: 'rgba(175,82,222,0.4)',
        notes: 'rgba(142,142,147,0.3)'
    }

    const iconGradientsLocal: Record<string, string> = iconGradients as Record<string, string>

    return (
        <motion.section
            className="mb-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: delay * 0.06
            }}
        >
            <motion.button
                onClick={expandable ? () => setIsExpanded(!isExpanded) : undefined}
                className={`w-full flex items-center gap-3 mb-2.5 px-4 ${expandable ? 'cursor-pointer' : 'cursor-default'}`}
                whileTap={expandable ? { scale: 0.99 } : {}}
            >
                <motion.div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white"
                    style={{
                        background: iconGradientsLocal[iconKey] || iconGradients.identification,
                        boxShadow: `0 4px 12px ${shadowColor[iconKey] || 'rgba(0,0,0,0.2)'}`
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
                        {Icons.chevronDown}
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

const Row = ({ label, last, children }: RowProps): React.ReactElement => (
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

const SmartInput = ({
    value,
    onChange,
    placeholder,
    type = 'text',
    inputMode,
    align = 'right',
    width = 'w-full',
    autoFocus = false,
    formatter,
    fullWidth = false
}: SmartInputProps): React.ReactElement => {
    const [focused, setFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        let val = e.target.value
        if (formatter) {
            val = formatter(val)
        }
        onChange({ target: { value: val } })
    }

    return (
        <motion.div
            className={`relative ${fullWidth ? 'flex-1' : ''}`}
            animate={{
                scale: focused ? 1.01 : 1,
            }}
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
                    ref={inputRef}
                    type={type}
                    inputMode={inputMode}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`
                        ${width} h-[36px] px-3
                        text-[17px] font-medium
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

// Phone Input with formatter and quick action
interface PhoneInputProps {
    value: string
    onChange: (e: { target: { value: string } }) => void
    placeholder?: string
    onCall?: (phone: string) => void
}

const PhoneInput = ({ value, onChange, placeholder, onCall }: PhoneInputProps): React.ReactElement => {
    const [focused, setFocused] = useState(false)
    const hasValue = value && value.replace(/\D/g, '').length >= 10

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const formatted = formatPhone(e.target.value)
        onChange({ target: { value: formatted } })
    }

    return (
        <div className="flex items-center gap-2 flex-1">
            <motion.div
                className="flex-1 relative"
                animate={{
                    boxShadow: focused
                        ? '0 0 0 4px rgba(0,122,255,0.12), 0 0 20px rgba(0,122,255,0.1)'
                        : '0 0 0 0px rgba(0,122,255,0)'
                }}
                style={{ borderRadius: 10 }}
            >
                <input
                    type="tel"
                    inputMode="tel"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`
                        w-full h-[36px] px-3
                        text-[17px] font-medium tabular-nums
                        bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px]
                        text-[#007aff] placeholder:text-[#aeaeb2]
                        outline-none transition-colors duration-[250ms]
                        ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}
                    `}
                />
            </motion.div>
            {hasValue && onCall && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onCall(value)}
                    className="w-9 h-9 rounded-full bg-[#34c759] flex items-center justify-center text-white shadow-md"
                    style={{ boxShadow: '0 2px 8px rgba(52,199,89,0.4)' }}
                >
                    {Icons.call}
                </motion.button>
            )}
        </div>
    )
}

// Email Input with validation
interface EmailInputProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    onEmail?: (email: string) => void
}

const EmailInput = ({ value, onChange, placeholder, onEmail }: EmailInputProps): React.ReactElement => {
    const [focused, setFocused] = useState(false)
    const validState = isValidEmail(value)
    const hasValue = value && value.length > 0

    return (
        <div className="flex items-center gap-2 flex-1">
            <motion.div
                className="flex-1 relative"
                animate={{
                    boxShadow: focused
                        ? validState === false
                            ? '0 0 0 4px rgba(255,59,48,0.15), 0 0 20px rgba(255,59,48,0.1)'
                            : '0 0 0 4px rgba(0,122,255,0.12), 0 0 20px rgba(0,122,255,0.1)'
                        : '0 0 0 0px rgba(0,122,255,0)'
                }}
                style={{ borderRadius: 10 }}
            >
                <input
                    type="email"
                    inputMode="email"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`
                        w-full h-[36px] px-3 pr-9
                        text-[17px] font-medium
                        bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px]
                        placeholder:text-[#aeaeb2]
                        outline-none transition-colors duration-[250ms]
                        ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}
                        ${validState === true ? 'text-[#34c759]' : validState === false ? 'text-[#ff3b30]' : 'text-[#007aff]'}
                    `}
                />
                {/* Validation indicator */}
                {hasValue && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center ${validState ? 'bg-[#34c759]/15 text-[#34c759]' : 'bg-[#ff3b30]/15 text-[#ff3b30]'
                            }`}
                    >
                        {validState ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        )}
                    </motion.div>
                )}
            </motion.div>
            {validState && onEmail && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onEmail(value)}
                    className="w-9 h-9 rounded-full bg-[#007aff] flex items-center justify-center text-white shadow-md"
                    style={{ boxShadow: '0 2px 8px rgba(0,122,255,0.4)' }}
                >
                    {Icons.mail}
                </motion.button>
            )}
        </div>
    )
}

// WhatsApp Input with quick action
interface WhatsAppInputProps {
    value: string
    onChange: (e: { target: { value: string } }) => void
    placeholder?: string
    onWhatsApp?: (whatsapp: string) => void
}

const WhatsAppInput = ({ value, onChange, placeholder, onWhatsApp }: WhatsAppInputProps): React.ReactElement => {
    const [focused, setFocused] = useState(false)
    const hasValue = value && value.replace(/\D/g, '').length >= 10

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const formatted = formatPhone(e.target.value)
        onChange({ target: { value: formatted } })
    }

    return (
        <div className="flex items-center gap-2 flex-1">
            <motion.div
                className="flex-1 relative"
                animate={{
                    boxShadow: focused
                        ? '0 0 0 4px rgba(37,211,102,0.15), 0 0 20px rgba(37,211,102,0.1)'
                        : '0 0 0 0px rgba(37,211,102,0)'
                }}
                style={{ borderRadius: 10 }}
            >
                <input
                    type="tel"
                    inputMode="tel"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`
                        w-full h-[36px] px-3
                        text-[17px] font-medium tabular-nums
                        bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px]
                        text-[#25D366] placeholder:text-[#aeaeb2]
                        outline-none transition-colors duration-[250ms]
                        ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}
                    `}
                />
            </motion.div>
            {hasValue && onWhatsApp && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onWhatsApp(value)}
                    className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md"
                    style={{ boxShadow: '0 2px 8px rgba(37,211,102,0.4)' }}
                >
                    {Icons.whatsapp}
                </motion.button>
            )}
        </div>
    )
}

// Premium Name Input - Apple style without underline (uses row border)
interface NameInputProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    autoFocus?: boolean
}

const NameInput = ({ value, onChange, placeholder, autoFocus }: NameInputProps): React.ReactElement => {
    const [focused, setFocused] = useState(false)

    return (
        <motion.div
            className="relative"
            animate={{
                backgroundColor: focused ? 'rgba(0,122,255,0.02)' : 'transparent'
            }}
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
                className={`
                    w-full h-[52px] px-4
                    text-[17px] font-medium
                    bg-transparent
                    text-[#1d1d1f] dark:text-white 
                    placeholder:text-[#aeaeb2]
                    outline-none
                    transition-all duration-[250ms]
                `}
            />
        </motion.div>
    )
}

// Textarea with premium styling
interface PremiumTextareaProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    placeholder?: string
    rows?: number
}

const PremiumTextarea = ({ value, onChange, placeholder, rows = 3 }: PremiumTextareaProps): React.ReactElement => {
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
                    w-full px-4 py-3
                    text-[17px] font-medium
                    bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[14px]
                    text-[#1d1d1f] dark:text-white placeholder:text-[#aeaeb2]
                    outline-none transition-colors duration-[250ms] resize-none
                    ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}
                `}
            />
        </motion.div>
    )
}

// Apple Toggle — Accessible
interface ToggleProps {
    on: boolean
    onChange: (value: boolean) => void
    label?: string
}

const Toggle = ({ on, onChange, label = "Alternar opção" }: ToggleProps): React.ReactElement => (
    <motion.button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`
            relative w-[51px] h-[31px] rounded-full p-[2px]
            transition-colors duration-300
            ${on ? 'bg-[#34c759]' : 'bg-[#e9e9eb] dark:bg-[#39393d]'}
        `}
        whileTap={{ scale: 0.95 }}
        style={{
            boxShadow: on ? '0 2px 12px rgba(52,199,89,0.4)' : 'none'
        }}
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
                {Icons.check}
            </motion.div>
        </motion.div>
    </motion.button>
)

// Linked Items Search Component
interface LinkedItem {
    itemId: string | number
    name?: string
}

interface LinkedItemsSearchProps {
    inventoryItems: any[]
    linkedItems: any[]
    onLink: (item: any) => void
    onUnlink: (itemId: any) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
}

const LinkedItemsSearch = ({ inventoryItems, linkedItems, onLink, onUnlink, searchQuery, setSearchQuery }: LinkedItemsSearchProps): React.ReactElement => {
    const [isOpen, setIsOpen] = useState(false)
    const filtered = inventoryItems.filter((item: any) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !linkedItems.find((li: LinkedItem) => li.itemId === item.id)
    ).slice(0, 5)

    return (
        <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={( e: any) => { setSearchQuery(e.target.value); setIsOpen(true) }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Buscar item do estoque..."
                    className="w-full h-[44px] px-4 pr-10 text-[16px] bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder:text-[#aeaeb2] outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c7c7cc]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                </div>

                {/* Dropdown */}
                <AnimatePresence>
                    {isOpen && filtered.length > 0 && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#2c2c2e] rounded-[14px] shadow-2xl overflow-hidden z-50 border border-black/[0.04] dark:border-white/[0.06]"
                                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
                            >
                                {filtered.map((item, i) => (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => { onLink(item); setSearchQuery(''); setIsOpen(false) }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        whileHover={{ backgroundColor: 'rgba(52,199,89,0.08)' }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`
                                            w-full h-[48px] px-4 text-left flex items-center justify-between
                                            text-[15px] text-[#1d1d1f] dark:text-white
                                            ${i < filtered.length - 1 ? 'border-b border-[#f5f5f7] dark:border-[#3a3a3c]' : ''}
                                        `}
                                    >
                                        <span className="font-medium">{item.name}</span>
                                        <div className="w-6 h-6 rounded-full bg-[#34c759]/15 flex items-center justify-center text-[#34c759]">
                                            {Icons.plus}
                                        </div>
                                    </motion.button>
                                ))}
                            </motion.div>
                            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Linked Items Pills */}
            {linkedItems.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {linkedItems.map((item, i) => (
                        <motion.div
                            key={item.itemId}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-2 px-3 py-2 bg-[#34c759]/10 rounded-xl border border-[#34c759]/20"
                        >
                            <span className="text-[14px] font-medium text-[#34c759]">{item.itemName}</span>
                            <button
                                onClick={() => onUnlink(item.itemId)}
                                className="w-5 h-5 rounded-full bg-[#ff3b30]/10 flex items-center justify-center text-[#ff3b30] hover:bg-[#ff3b30]/20 transition-colors"
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Premium File Upload Zone
interface SupplierDocument {
    id: string | number
    name: string
    size?: number
}

interface FileUploadZoneProps {
    documents: any[]
    onFileSelect: (files: FileList) => void
    onDelete: (docId: any) => void
    uploadingFile: boolean
    uploadProgress: number
}

const FileUploadZone = ({ documents, onFileSelect, onDelete, uploadingFile, uploadProgress }: FileUploadZoneProps): React.ReactElement => {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>): void => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>): void => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent<HTMLElement>): void => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        if (e.dataTransfer.files?.length) {
            onFileSelect(e.dataTransfer.files)
        }
    }, [onFileSelect])

    return (
        <div className="space-y-3">
            {/* Uploaded Files */}
            {documents?.length > 0 && (
                <div className="space-y-2">
                    {documents.map(doc => (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl"
                        >
                            {doc.type.startsWith('image/') ? (
                                <div
                                    className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0"
                                    style={{ backgroundImage: `url(${doc.dataUrl})` }}
                                />
                            ) : (
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${doc.type === 'application/pdf' ? 'bg-red-100 dark:bg-red-500/20' :
                                    doc.type.includes('spreadsheet') || doc.type.includes('excel') ? 'bg-emerald-100 dark:bg-emerald-500/20' :
                                        'bg-blue-100 dark:bg-blue-500/20'
                                    }`}>
                                    {doc.type === 'application/pdf' ? (
                                        <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="4" y="2" width="16" height="20" rx="2" />
                                            <text x="12" y="13" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">PDF</text>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="4" y="2" width="16" height="20" rx="2" />
                                            <path d="M8 8h8M8 12h8M8 16h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    )}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-medium text-[#1d1d1f] dark:text-white truncate">{doc.name}</p>
                                <p className="text-[12px] text-[#8e8e93]">{formatFileSize(doc.size)}</p>
                            </div>
                            <button
                                onClick={() => onDelete(doc.id)}
                                aria-label={`Remover arquivo ${doc.name}`}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#c7c7cc] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-colors"
                            >
                                {Icons.xmark}
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Upload Zone */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={( e: any) => e.target.files?.length && onFileSelect(e.target.files)}
            />

            <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                disabled={!!uploadingFile}
                className={`
                    w-full py-4 rounded-xl border-2 border-dashed transition-all
                    flex flex-col items-center justify-center gap-2
                    ${isDragging
                        ? 'border-[#007aff] bg-[#007aff]/5'
                        : 'border-[#c7c7cc] dark:border-[#48484a] hover:border-[#007aff] hover:bg-[#007aff]/5'
                    }
                `}
                whileTap={{ scale: 0.99 }}
            >
                {uploadingFile ? (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-[#007aff] border-t-transparent rounded-full"
                        />
                        <span className="text-[14px] font-medium text-[#007aff]">{uploadingFile}</span>
                        <div className="w-32 h-1 bg-[#e5e5ea] dark:bg-[#3a3a3c] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#007aff] rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-[#007aff]">{Icons.upload}</div>
                        <span className="text-[14px] font-medium text-[#007aff]">
                            {isDragging ? 'Solte para anexar' : 'Anexar arquivos'}
                        </span>
                        <span className="text-[12px] text-[#8e8e93]">
                            Arraste ou clique para selecionar
                        </span>
                    </>
                )}
            </motion.button>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════
// MAIN MODAL COMPONENT
// ════════════════════════════════════════════════════════════════

interface AddSupplierModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: () => void
    formData: any // Using any for complex form state
    setFormData: React.Dispatch<React.SetStateAction<any>>
    inventoryItems?: any[]
    isEditing?: boolean
    onFileSelect?: (files: FileList) => void
    uploadingFile?: boolean
    uploadProgress?: number
    onDeleteDocument?: (docId: string) => void
}

const AddSupplierModal = ({
    isOpen,
    onClose,
    onSave,
    formData,
    setFormData,
    inventoryItems = [],
    isEditing = false,
    // File handling
    onFileSelect,
    uploadingFile,
    uploadProgress,
    onDeleteDocument
}: AddSupplierModalProps): React.ReactElement | null => {
    const modalRef = useRef<HTMLDivElement>(null)
    useScrollLock(isOpen)
    useFocusTrap(isOpen, modalRef)
    const [itemSearchQuery, setItemSearchQuery] = useState('')

    const valid = formData.name?.trim()

    // Contact quick actions
    const handleCall = (phone: string): void => {
        const clean = phone.replace(/\D/g, '')
        window.open(`tel:${clean}`, '_self')
    }

    const handleEmail = (email: string): void => {
        window.open(`mailto:${email}`, '_self')
    }

    const handleWhatsApp = (whatsapp: string): void => {
        const clean = whatsapp.replace(/\D/g, '')
        window.open(`https://wa.me/55${clean}`, '_blank')
    }

    // Link/Unlink items
    const linkItem = (item: any) => {
        if (formData.linkedItems?.find((i: any) => i.itemId === item.id)) return
        setFormData((prev: any) => ({
            ...prev,
            linkedItems: [...(prev.linkedItems || []), { itemId: item.id, itemName: item.name }]
        }))
    }

    const unlinkItem = (itemId: string) => {
        setFormData((prev: any) => ({
            ...prev,
            linkedItems: (prev.linkedItems || []).filter((i: any) => i.itemId !== itemId)
        }))
    }

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0"
                        style={{
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(40px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(40px) saturate(180%)'
                        }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="supplier-modal-title"
                        initial={{ y: '100%', scale: 0.95 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: '100%', scale: 0.95, opacity: 0 }}
                        transition={MODAL_ANIMATIONS.spring}
                        className="relative w-full max-w-[440px] max-h-[92vh] bg-[#f2f2f7] dark:bg-[#000] rounded-t-[32px] md:rounded-[32px] overflow-hidden flex flex-col"
                        style={{
                            boxShadow: '0 -8px 80px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Premium Pill Handle */}
                        <div className="flex justify-center pt-2.5 pb-1 md:hidden">
                            <motion.div
                                className="w-10 h-[5px] rounded-full"
                                style={{
                                    background: 'linear-gradient(90deg, rgba(120,120,128,0.3), rgba(120,120,128,0.5), rgba(120,120,128,0.3))'
                                }}
                                whileHover={{ scaleX: 1.2 }}
                                whileTap={{ scaleX: 0.9 }}
                            />
                        </div>

                        {/* Header */}
                        <div
                            className="flex items-center justify-between h-[58px] px-5 border-b border-[#c6c6c8]/20 dark:border-[#38383a]/50"
                            style={{
                                background: 'rgba(242,242,247,0.8)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)'
                            }}
                        >
                            <motion.button
                                onClick={onClose}
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ color: '#0051a8' }}
                                aria-label="Cancelar e fechar modal"
                                className="text-[17px] text-[#007aff] font-medium"
                            >
                                Cancelar
                            </motion.button>
                            <div className="flex flex-col items-center">
                                <span id="supplier-modal-title" className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">
                                    {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                                </span>
                            </div>
                            <motion.button
                                onClick={() => valid && onSave()}
                                disabled={!valid}
                                whileTap={{ scale: valid ? 0.95 : 1 }}
                                aria-label={valid ? "Salvar fornecedor" : "Preencha os campos obrigatórios"}
                                aria-disabled={!valid}
                                className={`
                                    text-[17px] font-bold transition-all
                                    ${valid ? 'text-[#007aff]' : 'text-[#007aff]/30'}
                                `}
                                style={{
                                    textShadow: valid ? '0 0 20px rgba(0,122,255,0.3)' : 'none'
                                }}
                            >
                                Salvar
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto py-5">

                            {/* ═══ IDENTIFICAÇÃO ═══ */}
                            <Section
                                icon={Icons.person}
                                iconKey="identification"
                                title="Identificação"
                                delay={0}
                            >
                                <NameInput
                                    value={formData.name || ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, name: e.target.value }))}
                                    placeholder="Nome do contato *"
                                    autoFocus
                                />
                                <div className="border-t border-[#e5e5ea]/60 dark:border-[#38383a]/80">
                                    <Row label="Empresa" last>
                                        <SmartInput
                                            value={formData.company || ''}
                                            onChange={e => setFormData((p: any) => ({ ...p, company: e.target.value }))}
                                            placeholder="Opcional"
                                            width="w-40"
                                            align="right"
                                        />
                                    </Row>
                                </div>
                            </Section>

                            {/* ═══ CONTATO ═══ */}
                            <Section
                                icon={Icons.phone}
                                iconKey="contact"
                                title="Contato"
                                delay={1}
                            >
                                <Row label="Telefone">
                                    <PhoneInput
                                        value={formData.phone || ''}
                                        onChange={e => setFormData((p: any) => ({ ...p, phone: e.target.value }))}
                                        placeholder="(00) 00000-0000"
                                        onCall={handleCall}
                                    />
                                </Row>
                                <Row label="Email">
                                    <EmailInput
                                        value={formData.email || ''}
                                        onChange={e => setFormData((p: any) => ({ ...p, email: e.target.value }))}
                                        placeholder="email@exemplo.com"
                                        onEmail={handleEmail}
                                    />
                                </Row>
                                <Row label="Tem WhatsApp?" last={!formData.hasWhatsApp}>
                                    <Toggle
                                        on={formData.hasWhatsApp || false}
                                        onChange={v => setFormData((p: any) => ({ ...p, hasWhatsApp: v }))}
                                    />
                                </Row>
                                {formData.hasWhatsApp && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <Row label="WhatsApp" last>
                                            <WhatsAppInput
                                                value={formData.whatsapp || formData.phone || ''}
                                                onChange={e => setFormData((p: any) => ({ ...p, whatsapp: e.target.value }))}
                                                placeholder="(00) 00000-0000"
                                                onWhatsApp={handleWhatsApp}
                                            />
                                        </Row>
                                    </motion.div>
                                )}
                            </Section>

                            {/* ═══ ENDEREÇO ═══ */}
                            <Section
                                icon={Icons.mappin}
                                iconKey="address"
                                title="Endereço"
                                delay={2}
                                expandable
                                defaultExpanded={!!formData.address}
                            >
                                <div className="p-4">
                                    <PremiumTextarea
                                        value={formData.address || ''}
                                        onChange={e => setFormData((p: any) => ({ ...p, address: e.target.value }))}
                                        placeholder="Endereço completo..."
                                        rows={2}
                                    />
                                </div>
                            </Section>

                            {/* ═══ VÍNCULOS ═══ */}
                            <Section
                                icon={Icons.link}
                                iconKey="links"
                                title="Itens Vinculados"
                                footer={formData.linkedItems?.length === 0 ? "Vincule itens do estoque a este fornecedor." : undefined}
                                delay={3}
                            >
                                <div className="p-4">
                                    <LinkedItemsSearch
                                        inventoryItems={inventoryItems}
                                        linkedItems={formData.linkedItems || []}
                                        onLink={linkItem}
                                        onUnlink={unlinkItem}
                                        searchQuery={itemSearchQuery}
                                        setSearchQuery={setItemSearchQuery}
                                    />
                                </div>
                            </Section>

                            {/* ═══ CONDIÇÕES COMERCIAIS ═══ */}
                            <Section
                                icon={
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                        <line x1="1" y1="10" x2="23" y2="10" />
                                    </svg>
                                }
                                iconKey="commercial"
                                title="Condições Comerciais"
                                delay={4}
                                expandable
                                defaultExpanded={!!(formData.paymentTerms || formData.minimumOrder)}
                                footer="Informações para automação de compras."
                            >
                                <Row label="Prazo Pagamento">
                                    <SmartInput
                                        value={formData.paymentTerms || ''}
                                        onChange={e => setFormData((p: any) => ({ ...p, paymentTerms: e.target.value }))}
                                        placeholder="30 dias"
                                        width="w-28"
                                        align="right"
                                    />
                                </Row>
                                <Row label="Pedido Mínimo" last>
                                    <SmartInput
                                        value={formData.minimumOrder || ''}
                                        onChange={e => setFormData((p: any) => ({ ...p, minimumOrder: e.target.value }))}
                                        placeholder="$ 500"
                                        width="w-28"
                                        align="right"
                                    />
                                </Row>
                            </Section>

                            {/* ═══ AUTOMAÇÃO ═══ */}
                            <Section
                                icon={Icons.bolt}
                                iconKey="automation"
                                title="Automação"
                                delay={5}
                            >
                                <Row label="Solicitação Automática" last>
                                    <Toggle
                                        on={formData.autoOrderEnabled || false}
                                        onChange={v => setFormData((p: any) => ({ ...p, autoOrderEnabled: v }))}
                                    />
                                </Row>
                                {formData.autoOrderEnabled && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="px-4 pb-4"
                                    >
                                        <div className="p-3 bg-[#34c759]/10 rounded-xl border border-[#34c759]/20">
                                            <p className="text-[13px] text-[#34c759] font-medium">
                                                Quando um item vinculado atingir o estoque mínimo, uma cotação será criada automaticamente.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </Section>

                            {/* ═══ ANEXOS ═══ */}
                            <Section
                                icon={Icons.paperclip}
                                iconKey="attachments"
                                title="Anexos"
                                delay={6}
                                expandable
                                defaultExpanded={formData.documents?.length > 0}
                            >
                                <div className="p-4">
                                    <FileUploadZone
                                        documents={formData.documents || []}
                                        onFileSelect={onFileSelect!}
                                        onDelete={onDeleteDocument!}
                                        uploadingFile={uploadingFile!}
                                        uploadProgress={uploadProgress!}
                                    />
                                </div>
                            </Section>

                            {/* ═══ OBSERVAÇÕES ═══ */}
                            <Section
                                icon={Icons.text}
                                iconKey="notes"
                                title="Observações"
                                delay={7}
                                expandable
                                defaultExpanded={!!formData.notes}
                            >
                                <div className="p-4">
                                    <PremiumTextarea
                                        value={formData.notes || ''}
                                        onChange={e => setFormData((p: any) => ({ ...p, notes: e.target.value }))}
                                        placeholder="Notas adicionais sobre este fornecedor..."
                                        rows={3}
                                    />
                                </div>
                            </Section>

                            {/* Safe area */}
                            <div className="h-8" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}

export default AddSupplierModal
