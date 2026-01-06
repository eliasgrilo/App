import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useCurrency } from '../contexts/CurrencyContext'
import { MODAL_ANIMATIONS } from '../utils/animations'

/**
 * AddIngredientModal — True Apple HIG Design
 * 
 * Premium iOS/macOS design with:
 * - SF Symbol-style icons (NO emojis)
 * - Vibrant gradient sections with glow
 * - Smart auto-formatting inputs with character-level feedback
 * - Magic micro-interactions & spring physics
 * - Glassmorphism summary card
 * - Horizontal pill selectors
 * - Focus trap for accessibility (WCAG 2.1)
 */

// ════════════════════════════════════════════════════════════════
// SF SYMBOLS (Premium SVG Icons)
// ════════════════════════════════════════════════════════════════

const Icons = {
    layers: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
    ),
    cube: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    ),
    grid: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
    ),
    building: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
        </svg>
    ),
    sliders: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
        </svg>
    ),
    check: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    chevronDown: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    chevronRight: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    xmark: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    sparkle: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
        </svg>
    ),
    snowflake: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /><line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
            <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
    ),
    sun: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    ),
    box: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
    ),
    warehouse: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 8.35V20a2 2 0 01-2 2H4a2 2 0 01-2-2V8.35A2 2 0 013.26 6.5l8-3.2a2 2 0 011.48 0l8 3.2A2 2 0 0122 8.35z" />
            <path d="M6 18h12" /><path d="M6 14h12" /><path d="M6 10h12" />
        </svg>
    )
}

// Vibrant gradient backgrounds for section icons
const iconGradients: Record<string, string> = {
    identification: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)',
    quantity: 'linear-gradient(135deg, #54A0FF 0%, #2E86DE 100%)',
    storage: 'linear-gradient(135deg, #00D2D3 0%, #0984E3 100%)',
    supplier: 'linear-gradient(135deg, #A55EEA 0%, #8854D0 100%)',
    advanced: 'linear-gradient(135deg, #26DE81 0%, #20BF6B 100%)'
}

const shadowColors: Record<string, string> = {
    identification: 'rgba(255,107,107,0.4)',
    quantity: 'rgba(84,160,255,0.4)',
    storage: 'rgba(0,210,211,0.4)',
    supplier: 'rgba(165,94,234,0.4)',
    advanced: 'rgba(38,222,129,0.4)'
}

// Type definitions
interface SectionProps {
    icon: React.ReactNode
    iconKey: string
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    delay?: number
}

interface RowProps {
    label: string
    last?: boolean
    children: React.ReactNode
}

interface SmartInputProps {
    value: string
    onChange: (e: { target: { value: string } }) => void
    placeholder?: string
    type?: string
    inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none'
    align?: 'left' | 'right'
    format?: 'number' | 'integer' | 'currency' | string
    suffix?: string
    prefix?: string
    width?: string
    fullWidth?: boolean
    autoFocus?: boolean
}

interface NameInputProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    autoFocus?: boolean
}

interface SegmentedControlOption {
    id: string
    label: string
}

interface SegmentedControlProps {
    value: string
    options: SegmentedControlOption[]
    onChange: (id: string) => void
}

interface UnitSelectorProps {
    options: string[]
    value: string
    onChange: (unit: string) => void
}

interface ToggleProps {
    on: boolean
    onChange: (val: boolean) => void
    label?: string
}

interface SupplierSearchProps {
    suppliers: Array<{ id: number | string; name?: string }>
    selected: string | null
    onSelect: (supplier: { id: number | string; name?: string }) => void
    onClear: () => void
}

interface ExpandableSectionProps {
    icon: React.ReactNode
    iconKey: string
    title: string
    children: React.ReactNode
    delay?: number
}

interface SummaryCardProps {
    total: string | number
    unit: string
    value: number
    hasAutoQuote: boolean
    formatCurrency: (val: number) => string
}

// Product Types (for AI categorization)
const PRODUCT_TYPES = [
    { id: 'secos', label: 'Secos' },
    { id: 'refrigerados', label: 'Refrigerados' },
    { id: 'congelados', label: 'Congelados' },
    { id: 'frescos', label: 'Frescos' }
]

// Storage Locations
const STORAGE_LOCATIONS = [
    { id: 'freezer', label: 'Freezer' },
    { id: 'geladeira', label: 'Geladeira' },
    { id: 'prateleira', label: 'Prateleira' },
    { id: 'deposito', label: 'Depósito' }
]

// ════════════════════════════════════════════════════════════════
// FORMATTERS
// ════════════════════════════════════════════════════════════════

const formatNumber = (v: string | number): string => {
    if (!v) return ''
    const num = parseFloat(String(v))
    if (isNaN(num)) return String(v)
    return num.toLocaleString('en-CA', { maximumFractionDigits: 2 })
}

// ════════════════════════════════════════════════════════════════
// PREMIUM APPLE COMPONENTS
// ════════════════════════════════════════════════════════════════

// Section with gradient icon and spring animation
const Section = ({ icon, iconKey, title, children, footer, delay = 0 }: SectionProps): React.ReactElement => (
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
        <div className="flex items-center gap-3 mb-2.5 px-4">
            <motion.div
                className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white"
                style={{
                    background: iconGradients[iconKey],
                    boxShadow: `0 4px 12px ${shadowColors[iconKey]}`
                }}
                whileHover={{ scale: 1.08, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
                {icon}
            </motion.div>
            <span className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">
                {title}
            </span>
        </div>
        <div className="mx-4 bg-white dark:bg-[#1c1c1e] rounded-[14px] overflow-hidden shadow-sm border border-black/[0.04] dark:border-white/[0.06]">
            {children}
        </div>
        {footer && (
            <p className="px-5 pt-2 text-[13px] text-[#6d6d72] dark:text-[#8e8e93]">
                {footer}
            </p>
        )}
    </motion.section>
)

// Premium Form Row
const Row = ({ label, last, children }: RowProps): React.ReactElement => (
    <div className={`flex items-center justify-between min-h-[52px] px-4 ${!last ? 'border-b border-[#e5e5ea]/60 dark:border-[#38383a]/80' : ''}`}>
        <span className="text-[17px] text-[#1d1d1f] dark:text-white">{label}</span>
        <div className="flex items-center gap-2">{children}</div>
    </div>
)

// Smart Input with character-level feedback
const SmartInput = ({
    value,
    onChange,
    placeholder,
    type = 'text',
    inputMode,
    align = 'right',
    format,
    suffix,
    prefix,
    width = 'w-24',
    fullWidth = false,
    autoFocus = false
}: SmartInputProps): React.ReactElement => {
    const [focused, setFocused] = useState(false)
    const [localValue, setLocalValue] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setLocalValue(value)
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        let val = e.target.value

        if (format === 'integer') {
            val = val.replace(/\D/g, '')
        } else if (format === 'number' || format === 'currency') {
            val = val.replace(/[^\d.]/g, '')
            const parts = val.split('.')
            if (parts.length > 2) {
                val = parts[0] + '.' + parts.slice(1).join('')
            }
        }

        setLocalValue(val)
        onChange({ target: { value: val } })
    }

    return (
        <motion.div
            className={`relative flex items-center gap-1.5 ${fullWidth ? 'flex-1' : ''}`}
            animate={{
                scale: focused ? 1.02 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {prefix && (
                <motion.span
                    className="text-[17px] font-medium"
                    animate={{
                        color: focused ? '#007aff' : '#8e8e93'
                    }}
                >
                    {prefix}
                </motion.span>
            )}
            <motion.div
                animate={{
                    boxShadow: focused
                        ? '0 0 0 4px rgba(0,122,255,0.15), 0 0 20px rgba(0,122,255,0.1)'
                        : '0 0 0 0px rgba(0,122,255,0)'
                }}
                style={{ borderRadius: 10 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <input
                    ref={inputRef}
                    type={type}
                    inputMode={inputMode}
                    value={localValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`
                        ${width} h-[36px] px-3
                        text-[17px] font-medium tabular-nums
                        bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px]
                        text-[#007aff] placeholder:text-[#aeaeb2]
                        outline-none transition-colors duration-[250ms]
                        ${align === 'right' ? 'text-right' : 'text-left'}
                        ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}
                    `}
                />
            </motion.div>
            {suffix && (
                <motion.span
                    className="text-[15px] font-medium"
                    animate={{
                        color: focused ? '#007aff' : '#8e8e93'
                    }}
                >
                    {suffix}
                </motion.span>
            )}
        </motion.div>
    )
}

// Premium Name Input with animated focus line
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

// True iOS UISegmentedControl
const SegmentedControl = ({ value, options, onChange }: SegmentedControlProps): React.ReactElement => {
    const selectedIndex = options.findIndex((o: SegmentedControlOption) => o.id === value)

    return (
        <div
            className="relative mx-4 my-3 p-[2px] rounded-[9px] bg-[#e9e9eb] dark:bg-[#39393d]"
            style={{ display: 'flex' }}
        >
            {/* Sliding selector background */}
            <motion.div
                className="absolute top-[2px] bottom-[2px] rounded-[7px] bg-white dark:bg-[#636366]"
                style={{
                    width: `calc(${100 / options.length}% - 2px)`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)'
                }}
                animate={{
                    x: `calc(${selectedIndex * 100}% + ${selectedIndex * 2}px)`
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35
                }}
            />

            {/* Segment buttons */}
            {options.map((opt) => (
                <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange(opt.id)}
                    className={`
                        relative z-10 flex-1 h-[32px]
                        text-[13px] font-semibold
                        transition-colors duration-[250ms]
                        ${opt.id === value
                            ? 'text-[#1d1d1f] dark:text-white'
                            : 'text-[#8e8e93] dark:text-[#98989d]'
                        }
                    `}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}
// Unit Selector Pill
const UnitSelector = ({ options, value, onChange }: UnitSelectorProps): React.ReactElement => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1 h-[36px] px-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px] min-w-[60px]"
            >
                <span className="text-[15px] font-semibold text-[#007aff]">{value}</span>
                <motion.div
                    className="text-[#c7c7cc]"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    {Icons.chevronDown}
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="absolute right-0 top-full mt-2 bg-white dark:bg-[#2c2c2e] rounded-[12px] shadow-2xl overflow-hidden z-50 border border-black/[0.04] dark:border-white/[0.06]"
                            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
                        >
                            {options.map((opt: string, i: number) => (
                                <motion.button
                                    key={opt}
                                    type="button"
                                    onClick={() => { onChange(opt); setIsOpen(false) }}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    whileHover={{ backgroundColor: 'rgba(0,122,255,0.08)' }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`
                                        w-full h-[44px] px-5 text-left flex items-center justify-between
                                        text-[16px] font-medium text-[#1d1d1f] dark:text-white
                                        ${i < options.length - 1 ? 'border-b border-[#f5f5f7] dark:border-[#3a3a3c]' : ''}
                                    `}
                                >
                                    <span>{opt}</span>
                                    {opt === value && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="text-[#007aff]"
                                        >
                                            {Icons.check}
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

// Apple Toggle — Accessible
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

// Supplier Search
const SupplierSearch = ({ suppliers, selected, onSelect, onClear }: SupplierSearchProps): React.ReactElement => {
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const filtered = suppliers.filter((s: { id: number | string; name?: string }) =>
        s.name?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5)

    if (selected) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between min-h-[52px] px-4"
            >
                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-7 h-7 rounded-full bg-[#34c759] flex items-center justify-center text-white"
                        style={{
                            boxShadow: '0 2px 8px rgba(52,199,89,0.4)'
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
                    >
                        {Icons.check}
                    </motion.div>
                    <span className="text-[17px] font-medium text-[#1d1d1f] dark:text-white">{selected}</span>
                </div>
                <motion.button
                    onClick={onClear}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ backgroundColor: 'rgba(255,59,48,0.1)' }}
                    className="w-8 h-8 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center text-[#8e8e93] hover:text-[#ff3b30] transition-colors"
                >
                    {Icons.xmark}
                </motion.button>
            </motion.div>
        )
    }

    return (
        <div className="relative">
            <div className="flex items-center min-h-[52px] px-4 gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    placeholder="Buscar fornecedor..."
                    className="flex-1 text-[17px] bg-transparent outline-none text-[#1d1d1f] dark:text-white placeholder:text-[#aeaeb2]"
                />
                <motion.div
                    className="text-[#c7c7cc]"
                    animate={{ rotate: open ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    {Icons.chevronRight}
                </motion.div>
            </div>

            <AnimatePresence>
                {open && filtered.length > 0 && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="absolute left-2 right-2 top-full mt-1 bg-white dark:bg-[#2c2c2e] rounded-[14px] shadow-2xl overflow-hidden z-50 border border-black/[0.04] dark:border-white/[0.06]"
                            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
                        >
                            {filtered.map((s, i) => (
                                <motion.button
                                    key={s.id}
                                    onClick={() => { onSelect(s); setSearch(''); setOpen(false) }}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    whileHover={{ backgroundColor: 'rgba(0,122,255,0.08)' }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`
                                        w-full h-[50px] px-4 text-left flex items-center gap-3
                                        text-[16px] text-[#1d1d1f] dark:text-white
                                        ${i < filtered.length - 1 ? 'border-b border-[#f5f5f7] dark:border-[#3a3a3c]' : ''}
                                    `}
                                >
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#a55eea] to-[#8854d0] flex items-center justify-center text-[12px] font-bold text-white shadow-sm">
                                        {s.name?.charAt(0).toUpperCase()}
                                    </div>
                                    {s.name}
                                </motion.button>
                            ))}
                        </motion.div>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

// Expandable Section
const ExpandableSection = ({ icon, iconKey, title, children, delay = 0 }: ExpandableSectionProps): React.ReactElement => {
    const [isExpanded, setIsExpanded] = useState(false)

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
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 mb-2.5 px-4 group"
                whileTap={{ scale: 0.99 }}
            >
                <motion.div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white"
                    style={{
                        background: iconGradients[iconKey],
                        boxShadow: `0 4px 12px ${shadowColors[iconKey]}`
                    }}
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                    {icon}
                </motion.div>
                <span className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight flex-1 text-left">
                    {title}
                </span>
                <motion.div
                    className="text-[#c7c7cc] group-hover:text-[#8e8e93] transition-colors"
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    {Icons.chevronDown}
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="overflow-hidden"
                    >
                        <div className="mx-4 bg-white dark:bg-[#1c1c1e] rounded-[14px] overflow-hidden shadow-sm border border-black/[0.04] dark:border-white/[0.06]">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    )
}

// Premium Summary Card with Glassmorphism
const SummaryCard = ({ total, unit, value, hasAutoQuote, formatCurrency }: SummaryCardProps): React.ReactElement => (
    <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="mx-4 mb-6 p-6 rounded-[24px] relative overflow-hidden"
        style={{
            background: 'linear-gradient(145deg, rgba(28,28,30,0.95) 0%, rgba(0,0,0,0.98) 100%)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            backdropFilter: 'blur(40px)'
        }}
    >
        {/* Animated gradient orbs */}
        <motion.div
            className="absolute -top-16 -right-16 w-32 h-32 rounded-full"
            style={{
                background: hasAutoQuote
                    ? 'radial-gradient(circle, rgba(0,122,255,0.5) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(88,86,214,0.4) 0%, transparent 70%)'
            }}
            animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.6, 0.4]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full"
            style={{
                background: 'radial-gradient(circle, rgba(52,199,89,0.3) 0%, transparent 70%)'
            }}
            animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Auto-Quote Badge */}
        {hasAutoQuote && (
            <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full"
                style={{
                    background: 'linear-gradient(135deg, rgba(0,122,255,0.2) 0%, rgba(88,86,214,0.2) 100%)',
                    boxShadow: '0 0 24px rgba(0,122,255,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
            >
                <motion.span
                    className="text-[#007aff]"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    {Icons.sparkle}
                </motion.span>
                <span className="text-[11px] font-bold text-[#007aff] uppercase tracking-wider">
                    Auto Quote Ativo
                </span>
            </motion.div>
        )}

        {/* Total Display */}
        <div className="relative z-10 mb-1">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                Total em Estoque
            </span>
        </div>
        <div className="relative z-10 flex items-baseline gap-2">
            <motion.span
                key={total}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[44px] font-bold text-white tabular-nums tracking-tight"
                style={{ fontFamily: '-apple-system, SF Pro Display, system-ui' }}
            >
                {formatNumber(total) || '0'}
            </motion.span>
            <span className="text-[18px] font-medium text-white/40">{unit}</span>
        </div>

        {/* Value Display */}
        {value > 0 && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="relative z-10 mt-5 pt-5 border-t border-white/10"
            >
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                    Valor Total
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                    <motion.span
                        key={value}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[34px] font-bold text-[#30d158] tabular-nums tracking-tight"
                        style={{ fontFamily: '-apple-system, SF Pro Display, system-ui' }}
                    >
                        {formatCurrency(value)}
                    </motion.span>
                </div>
            </motion.div>
        )}
    </motion.div>
)

// ════════════════════════════════════════════════════════════════
// MAIN MODAL COMPONENT
// ════════════════════════════════════════════════════════════════

interface AddIngredientModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: () => void
    newItem: any // Using any for complex Ingredient form state
    setNewItem: React.Dispatch<React.SetStateAction<any>>
    suppliers?: Array<{ id: number | string; name?: string }>
    units?: string[]
}

const AddIngredientModal = ({
    isOpen,
    onClose,
    onAdd,
    newItem,
    setNewItem,
    suppliers = [],
    units = ['kg', 'g', 'L', 'ml', 'un']
}: AddIngredientModalProps): React.ReactElement | null => {
    const modalRef = useRef<HTMLDivElement>(null)
    useScrollLock(isOpen)
    useFocusTrap(isOpen, modalRef)
    const { formatCurrency } = useCurrency()

    const total = (Number(newItem.packageQuantity) || 0) * (Number(newItem.packageCount) || 1)
    const value = (Number(newItem.packageCount) || 1) * (Number(newItem.pricePerUnit) || 0)
    const valid = newItem.name?.trim()

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center">
                    {/* Backdrop with premium blur */}
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
                        aria-labelledby="ingredient-modal-title"
                        initial={{ y: '100%', scale: 0.95 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: '100%', scale: 0.95, opacity: 0 }}
                        transition={MODAL_ANIMATIONS.spring}
                        className="relative w-full max-w-[440px] max-h-[92vh] bg-[#f2f2f7] dark:bg-[#000] rounded-t-[32px] md:rounded-[32px] overflow-hidden flex flex-col"
                        style={{
                            boxShadow: '0 -8px 80px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Premium Pill Handle with Glow */}
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

                        {/* Header with Glassmorphism */}
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
                                <span id="ingredient-modal-title" className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">
                                    Novo Insumo
                                </span>
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-1.5 mt-0.5"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
                                    <span className="text-[11px] font-medium text-[#34c759]">
                                        Entrada: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </motion.div>
                            </div>
                            <motion.button
                                onClick={() => valid && onAdd()}
                                disabled={!valid}
                                whileTap={{ scale: valid ? 0.95 : 1 }}
                                aria-label={valid ? "Adicionar insumo" : "Preencha os campos obrigatórios"}
                                aria-disabled={!valid}
                                className={`
                                    text-[17px] font-bold transition-all
                                    ${valid
                                        ? 'text-[#007aff]'
                                        : 'text-[#007aff]/30'
                                    }
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
                                icon={Icons.layers}
                                iconKey="identification"
                                title="Identificação"
                                delay={0}
                            >
                                <NameInput
                                    value={newItem.name || ''}
                                    onChange={e => setNewItem((p: any) => ({ ...p, name: e.target.value }))}
                                    placeholder="Nome do ingrediente"
                                    autoFocus
                                />
                                <SegmentedControl
                                    value={newItem.type || 'secos'}
                                    options={PRODUCT_TYPES}
                                    onChange={type => setNewItem((p: any) => ({ ...p, type }))}
                                />
                            </Section>

                            {/* ═══ QUANTIDADE & PREÇO ═══ */}
                            <Section
                                icon={Icons.cube}
                                iconKey="quantity"
                                title="Quantidade & Preço"
                                delay={1}
                            >
                                <Row label="Tamanho">
                                    <SmartInput
                                        value={newItem.packageQuantity || ''}
                                        onChange={e => setNewItem((p: any) => ({ ...p, packageQuantity: e.target.value }))}
                                        placeholder="0"
                                        inputMode="decimal"
                                        format="number"
                                        width="w-16"
                                    />
                                    <UnitSelector
                                        options={units}
                                        value={newItem.unit || 'kg'}
                                        onChange={u => setNewItem((p: any) => ({ ...p, unit: u }))}
                                    />
                                </Row>
                                <Row label="Pacotes">
                                    <SmartInput
                                        value={newItem.packageCount || ''}
                                        onChange={e => setNewItem((p: any) => ({ ...p, packageCount: e.target.value }))}
                                        placeholder="1"
                                        inputMode="numeric"
                                        format="integer"
                                        width="w-14"
                                    />
                                </Row>
                                <Row label="Preço/Pacote" last>
                                    <SmartInput
                                        value={newItem.pricePerUnit || ''}
                                        onChange={e => setNewItem((p: any) => ({ ...p, pricePerUnit: e.target.value }))}
                                        placeholder="0.00"
                                        inputMode="decimal"
                                        format="currency"
                                        prefix="$"
                                        width="w-20"
                                    />
                                </Row>
                            </Section>

                            {/* ═══ CONTROLE DE ESTOQUE ═══ */}
                            <Section
                                icon={Icons.grid}
                                iconKey="storage"
                                title="Controle de Estoque"
                                delay={2}
                            >
                                <SegmentedControl
                                    value={newItem.storageLocation || 'prateleira'}
                                    options={STORAGE_LOCATIONS}
                                    onChange={loc => setNewItem((p: any) => ({ ...p, storageLocation: loc }))}
                                />
                                <Row label="Estoque Mínimo">
                                    <SmartInput
                                        value={newItem.minStock || ''}
                                        onChange={e => setNewItem((p: any) => ({ ...p, minStock: e.target.value }))}
                                        placeholder="0"
                                        inputMode="numeric"
                                        format="integer"
                                        suffix={newItem.unit || 'kg'}
                                        width="w-14"
                                    />
                                </Row>
                                <Row label="Validade" last>
                                    <SmartInput
                                        value={newItem.shelfLifeDays || ''}
                                        onChange={e => setNewItem((p: any) => ({ ...p, shelfLifeDays: e.target.value }))}
                                        placeholder="—"
                                        inputMode="numeric"
                                        format="integer"
                                        suffix="dias"
                                        width="w-12"
                                    />
                                </Row>
                            </Section>

                            {/* ═══ FORNECEDOR ═══ */}
                            <ExpandableSection
                                icon={Icons.building}
                                iconKey="supplier"
                                title="Fornecedor"
                                delay={3}
                            >
                                <SupplierSearch
                                    suppliers={suppliers}
                                    selected={newItem.supplierName}
                                    onSelect={(s) => setNewItem((p: any) => ({ ...p, supplierId: s.id, supplierName: s.name }))}
                                    onClear={() => setNewItem((p: any) => ({ ...p, supplierId: null, supplierName: '' }))}
                                />
                                {newItem.supplierId && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="border-t border-[#e5e5ea]/60 dark:border-[#38383a]/80"
                                    >
                                        <Row label="Cotação automática">
                                            <Toggle
                                                on={newItem.enableAutoQuotation || false}
                                                onChange={v => setNewItem((p: any) => ({ ...p, enableAutoQuotation: v }))}
                                            />
                                        </Row>
                                        <Row label="Prazo de Entrega" last>
                                            <SmartInput
                                                value={newItem.leadTimeDays || ''}
                                                onChange={e => setNewItem((p: any) => ({ ...p, leadTimeDays: e.target.value }))}
                                                placeholder="3"
                                                inputMode="numeric"
                                                format="integer"
                                                suffix="dias"
                                                width="w-12"
                                            />
                                        </Row>
                                    </motion.div>
                                )}
                            </ExpandableSection>

                            {/* ═══ AVANÇADO ═══ */}
                            <ExpandableSection
                                icon={Icons.sliders}
                                iconKey="advanced"
                                title="Avançado"
                                delay={4}
                            >
                                <Row label="Código EAN" last>
                                    <SmartInput
                                        value={newItem.barcode || ''}
                                        onChange={e => setNewItem((p: any) => ({ ...p, barcode: e.target.value }))}
                                        placeholder="—"
                                        inputMode="numeric"
                                        format="integer"
                                        width="w-32"
                                    />
                                </Row>
                            </ExpandableSection>

                            {/* ═══ SUMMARY ═══ */}
                            <AnimatePresence>
                                {total > 0 && (
                                    <SummaryCard
                                        total={total}
                                        unit={newItem.unit || 'kg'}
                                        value={value}
                                        hasAutoQuote={newItem.enableAutoQuotation}
                                        formatCurrency={formatCurrency}
                                    />
                                )}
                            </AnimatePresence>

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

export default AddIngredientModal
