import React, { useState, useEffect, useRef, ReactNode, ChangeEvent, Dispatch, SetStateAction, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useCurrency } from '../contexts/CurrencyContext'
import { MODAL_ANIMATIONS } from '../utils/animations'

// ═══ TYPE DEFINITIONS ═══
interface CategoryOption {
    id: string
    label: string
}

export interface ExpenseFormData {
    description: string
    amount: string
    quantity: number | string
    category: string
    type: 'Fixo' | 'Variável'
    link: string
    date: string
}

interface SectionProps {
    icon: ReactNode
    title: string
    children: ReactNode
    delay?: number
}

interface RowProps {
    label: string
    last?: boolean
    children: ReactNode
    onClick?: () => void
}

interface NameInputProps {
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    autoFocus?: boolean
}

interface SmartInputProps {
    value: string | number
    onChange: (e: { target: { value: string } }) => void
    placeholder?: string
    inputMode?: 'text' | 'decimal' | 'numeric'
    format?: 'integer' | 'number' | 'currency'
    suffix?: string
    prefix?: string
    width?: string
}

interface SegmentedControlProps {
    value: string
    options: { id: string; label: string }[]
    onChange: (value: string) => void
}

interface DatePickerProps {
    value: string
    onChange: (date: string) => void
}

interface CategoryGridProps {
    value: string
    options: CategoryOption[]
    onChange: (category: string) => void
}

interface SummaryCardProps {
    total: string | number
    quantity: string | number
    formatCurrency: (value: number) => string
}

interface WheelColumnProps {
    items: (number | { label: string; value: number })[]
    selected: number
    onSelect: (value: number) => void
    width?: string
}

interface DateSelection {
    day: number
    month: number
    year: number
}

interface AddExpenseModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (e?: FormEvent) => void
    formData: ExpenseFormData
    setFormData: Dispatch<SetStateAction<ExpenseFormData>>
    categories?: CategoryOption[]
    editingId?: string | number | null
}

/**
 * AddExpenseModal — True Apple HIG Design
 * 
 * Premium iOS/macOS design with:
 * - Row-based form (iOS Settings style)
 * - SegmentedControl for Fixo/Variável
 * - Smart currency formatting
 * - Premium DatePicker with Apple styling
 * - CategoryGrid with SF Symbols and vibrant colors
 * - Spring physics animations
 * - Focus trap for accessibility (WCAG 2.1)
 */

// ════════════════════════════════════════════════════════════════
// SF SYMBOLS (Premium SVG Icons)
// ════════════════════════════════════════════════════════════════

const Icons = {
    xmark: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    check: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    calendar: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    dollar: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    tag: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
    ),
    link: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    chevronRight: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    )
}

// Category Icons (SF Symbol style)
const CategoryIcons = {
    'Maquinário': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    ),
    'Insumos': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    ),
    'Operacional': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    'Marketing': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ),
    'Impostos': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    'Outros': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
        </svg>
    )
}

// Category Colors (Apple vibrant)
const CategoryColors = {
    'Maquinário': { bg: 'from-indigo-500 to-blue-600', glow: 'shadow-indigo-500/40' },
    'Insumos': { bg: 'from-orange-500 to-amber-500', glow: 'shadow-orange-500/40' },
    'Operacional': { bg: 'from-purple-500 to-violet-600', glow: 'shadow-purple-500/40' },
    'Marketing': { bg: 'from-pink-500 to-rose-500', glow: 'shadow-pink-500/40' },
    'Impostos': { bg: 'from-red-500 to-rose-600', glow: 'shadow-red-500/40' },
    'Outros': { bg: 'from-gray-500 to-slate-600', glow: 'shadow-gray-500/40' }
}

// Expense Types
const EXPENSE_TYPES = [
    { id: 'Fixo', label: 'Fixo' },
    { id: 'Variável', label: 'Variável' }
]

// ════════════════════════════════════════════════════════════════
// FORMATTERS
// ════════════════════════════════════════════════════════════════

const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return 'Selecionar'
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}

// ════════════════════════════════════════════════════════════════
// APPLE COMPONENTS
// ════════════════════════════════════════════════════════════════

// Section with icon and title
const Section: React.FC<SectionProps> = ({ icon, title, children, delay = 0 }) => (
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
        <div className="flex items-center gap-2.5 mb-2.5 px-4">
            <span className="text-[#007aff]">{icon}</span>
            <span className="text-[13px] font-semibold text-[#8e8e93] uppercase tracking-wide">
                {title}
            </span>
        </div>
        <div className="mx-4 bg-white dark:bg-[#1c1c1e] rounded-[14px] overflow-hidden shadow-sm border border-black/[0.04] dark:border-white/[0.06]">
            {children}
        </div>
    </motion.section>
)

// Form Row
const Row: React.FC<RowProps> = ({ label, last, children, onClick }) => (
    <div
        className={`flex items-center justify-between min-h-[52px] px-4 ${!last ? 'border-b border-[#e5e5ea]/60 dark:border-[#38383a]/80' : ''} ${onClick ? 'active:bg-[#f5f5f7] dark:active:bg-[#2c2c2e] cursor-pointer transition-colors' : ''}`}
        onClick={onClick}
    >
        <span className="text-[17px] text-[#1d1d1f] dark:text-white">{label}</span>
        <div className="flex items-center gap-2">{children}</div>
    </div>
)

// Premium Name Input
const NameInput: React.FC<NameInputProps> = ({ value, onChange, placeholder, autoFocus }) => {
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

// Smart Input with formatting
const SmartInput: React.FC<SmartInputProps> = ({
    value,
    onChange,
    placeholder,
    inputMode = 'text',
    format,
    suffix,
    prefix,
    width = 'w-24'
}) => {
    const [focused, setFocused] = useState(false)
    const [localValue, setLocalValue] = useState(String(value))

    useEffect(() => {
        setLocalValue(String(value))
    }, [value])

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
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
        <div className="flex items-center gap-1.5">
            {prefix && (
                <motion.span
                    className="text-[17px] font-medium"
                    animate={{ color: focused ? '#007aff' : '#8e8e93' }}
                >
                    {prefix}
                </motion.span>
            )}
            <motion.div
                animate={{
                    boxShadow: focused
                        ? '0 0 0 4px rgba(0,122,255,0.15)'
                        : '0 0 0 0px rgba(0,122,255,0)'
                }}
                style={{ borderRadius: 10 }}
                transition={{ duration: 0.2 }}
            >
                <input
                    type="text"
                    inputMode={inputMode}
                    value={localValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`
                        ${width} h-[36px] px-3
                        text-[17px] font-medium tabular-nums text-right
                        bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px]
                        text-[#007aff] placeholder:text-[#aeaeb2]
                        outline-none transition-colors duration-[250ms]
                        ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}
                    `}
                />
            </motion.div>
            {suffix && (
                <span className="text-[15px] font-medium text-[#8e8e93]">
                    {suffix}
                </span>
            )}
        </div>
    )
}

// True iOS UISegmentedControl
const SegmentedControl: React.FC<SegmentedControlProps> = ({ value, options, onChange }) => {
    const selectedIndex = options.findIndex((o: { id: string; label: string }) => o.id === value)

    return (
        <div
            className="relative p-[2px] rounded-[9px] bg-[#e9e9eb] dark:bg-[#39393d]"
            style={{ display: 'flex' }}
        >
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

            {options.map((opt: { id: string; label: string }) => (
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

// True iOS Wheel DatePicker with Modal
const AppleDatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false)

    // Parse current value or use today
    const parseDate = (dateStr: string): DateSelection => {
        if (!dateStr) {
            const today = new Date()
            return { day: today.getDate(), month: today.getMonth(), year: today.getFullYear() }
        }
        const d = new Date(dateStr + 'T00:00:00')
        return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() }
    }

    const [selected, setSelected] = useState(parseDate(value))

    useEffect(() => {
        setSelected(parseDate(value))
    }, [value])

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)
    const daysInMonth = new Date(selected.year, selected.month + 1, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const handleConfirm = () => {
        const dateStr = `${selected.year}-${String(selected.month + 1).padStart(2, '0')}-${String(selected.day).padStart(2, '0')}`
        onChange(dateStr)
        setIsOpen(false)
    }

    const WheelColumn: React.FC<WheelColumnProps> = ({ items, selected: sel, onSelect, width = 'w-16' }) => (
        <div className={`${width} h-[180px] overflow-y-auto snap-y snap-mandatory scrollbar-hide`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <div className="h-[60px]" />
            {items.map((item: number | { label: string; value: number }, i: number) => (
                <motion.button
                    key={i}
                    type="button"
                    onClick={() => onSelect(typeof item === 'object' ? item.value : item)}
                    className={`
                        w-full h-[44px] flex items-center justify-center snap-center
                        text-[22px] font-medium transition-all
                        ${(typeof item === 'object' ? item.value : item) === sel
                            ? 'text-white scale-110'
                            : 'text-white/40 scale-90'
                        }
                    `}
                    whileTap={{ scale: 0.95 }}
                >
                    {typeof item === 'object' ? item.label : item}
                </motion.button>
            ))}
            <div className="h-[60px]" />
        </div>
    )

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                type="button"
                onClick={() => setIsOpen(true)}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] transition-all hover:bg-[#ebebf0] dark:hover:bg-[#3a3a3c]"
            >
                <motion.div
                    className="w-9 h-9 rounded-[11px] flex items-center justify-center relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(145deg, #ff3b30 0%, #ff2d55 100%)',
                        boxShadow: '0 4px 12px rgba(255,59,48,0.4)'
                    }}
                    whileHover={{ scale: 1.05, rotate: 2 }}
                >
                    <span className="text-white text-[13px] font-bold">
                        {selected.day}
                    </span>
                </motion.div>
                <div className="flex flex-col items-start">
                    <span className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white">
                        {months[selected.month]} {selected.day}, {selected.year}
                    </span>
                </div>
                <span className="text-[#8e8e93] ml-1">{Icons.chevronRight}</span>
            </motion.button>

            {/* Modal Picker */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100000] flex items-end justify-center"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/50"
                            style={{ backdropFilter: 'blur(8px)' }}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            onClick={e => e.stopPropagation()}
                            className="relative w-full max-w-[400px] bg-[#1c1c1e] rounded-t-[28px] overflow-hidden"
                            style={{ boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-[17px] text-[#007aff] font-medium"
                                >
                                    Cancel
                                </button>
                                <span className="text-[17px] font-bold text-white">Select Date</span>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    className="text-[17px] text-[#007aff] font-bold"
                                >
                                    Done
                                </button>
                            </div>

                            {/* Wheels Container */}
                            <div className="relative py-4">
                                {/* Selection Highlight */}
                                <div
                                    className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[44px] rounded-xl pointer-events-none"
                                    style={{
                                        background: 'rgba(120,120,128,0.24)',
                                        boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.1)'
                                    }}
                                />

                                {/* Wheel Columns */}
                                <div className="flex justify-center gap-0 px-6">
                                    <WheelColumn
                                        items={months.map((m, i) => ({ label: m, value: i }))}
                                        selected={selected.month}
                                        onSelect={m => setSelected(prev => ({ ...prev, month: m, day: Math.min(prev.day, new Date(prev.year, m + 1, 0).getDate()) }))}
                                        width="w-20"
                                    />
                                    <WheelColumn
                                        items={days}
                                        selected={selected.day}
                                        onSelect={d => setSelected(prev => ({ ...prev, day: d }))}
                                        width="w-14"
                                    />
                                    <WheelColumn
                                        items={years}
                                        selected={selected.year}
                                        onSelect={y => setSelected(prev => ({ ...prev, year: y, day: Math.min(prev.day, new Date(y, prev.month + 1, 0).getDate()) }))}
                                        width="w-20"
                                    />
                                </div>
                            </div>

                            {/* Safe Area */}
                            <div className="h-8" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

// Premium Category Grid with Icons
const CategoryGrid: React.FC<CategoryGridProps> = ({ value, options, onChange }) => {
    // Convert options array to proper format
    const categories = options.map((opt: CategoryOption | string) => {
        const label = typeof opt === 'string' ? opt : (opt.label || opt.id)
        return { id: label, label }
    })

    return (
        <div className="p-4 grid grid-cols-3 gap-3">
            {categories.map((cat: { id: string; label: string }, i: number) => {
                const isSelected = value === cat.id || value === cat.label
                const colors = CategoryColors[cat.label as keyof typeof CategoryColors] || CategoryColors['Outros']
                const icon = CategoryIcons[cat.label as keyof typeof CategoryIcons] || CategoryIcons['Outros']

                return (
                    <motion.button
                        key={cat.id}
                        type="button"
                        onClick={() => onChange(cat.label)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 25 }}
                        whileTap={{ scale: 0.92 }}
                        className={`
                            relative flex flex-col items-center justify-center gap-2
                            p-4 rounded-2xl transition-all duration-300
                            ${isSelected
                                ? `bg-gradient-to-br ${colors.bg} shadow-lg ${colors.glow}`
                                : 'bg-[#f5f5f7] dark:bg-[#2c2c2e] hover:bg-[#ebebf0] dark:hover:bg-[#3a3a3c]'
                            }
                        `}
                        style={{
                            boxShadow: isSelected ? '0 8px 24px -8px currentColor' : 'none'
                        }}
                    >
                        {/* Icon */}
                        <motion.div
                            className={`
                                w-10 h-10 rounded-xl flex items-center justify-center
                                ${isSelected
                                    ? 'bg-white/20'
                                    : 'bg-white dark:bg-[#3a3a3c]'
                                }
                            `}
                            animate={{
                                scale: isSelected ? [1, 1.1, 1] : 1
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            <span className={isSelected ? 'text-white' : 'text-[#8e8e93]'}>
                                {icon}
                            </span>
                        </motion.div>

                        {/* Label */}
                        <span className={`
                            text-[11px] font-semibold tracking-tight
                            ${isSelected ? 'text-white' : 'text-[#1d1d1f] dark:text-white'}
                        `}>
                            {cat.label}
                        </span>

                        {/* Selection indicator */}
                        {isSelected && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md"
                            >
                                <span className="text-[#34c759]">{Icons.check}</span>
                            </motion.div>
                        )}
                    </motion.button>
                )
            })}
        </div>
    )
}

// Summary Card
const SummaryCard: React.FC<SummaryCardProps> = ({ total, quantity, formatCurrency }) => {
    const totalValue = (Number(total) || 0) * (Number(quantity) || 1)

    if (totalValue <= 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-4 p-5 rounded-[20px] relative overflow-hidden"
            style={{
                background: 'linear-gradient(145deg, #1c1c1e 0%, #000 100%)',
                boxShadow: '0 20px 60px -20px rgba(0,0,0,0.6)'
            }}
        >
            {/* Animated glow */}
            <motion.div
                className="absolute -top-16 -right-16 w-32 h-32 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(0,122,255,0.5) 0%, transparent 70%)'
                }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
                className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(52,199,89,0.4) 0%, transparent 70%)'
                }}
                animate={{ scale: [1.3, 1, 1.3], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
            />

            <div className="relative">
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                    Valor Total
                </span>
                <motion.div
                    className="flex items-baseline gap-2 mt-2"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                >
                    <span className="text-[36px] font-bold text-white tabular-nums tracking-tight">
                        {formatCurrency(totalValue)}
                    </span>
                </motion.div>
                {Number(quantity) > 1 && (
                    <span className="text-[13px] text-white/50 mt-1.5 block">
                        {quantity} × {formatCurrency(Number(total))}
                    </span>
                )}
            </div>
        </motion.div>
    )
}

// ════════════════════════════════════════════════════════════════
// MAIN MODAL COMPONENT
// ════════════════════════════════════════════════════════════════

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
    isOpen,
    onClose,
    onSave,
    formData,
    setFormData,
    categories = [],
    editingId = null
}) => {
    const modalRef = useRef<HTMLDivElement>(null)
    useScrollLock(isOpen)
    useFocusTrap(isOpen, modalRef)
    const { formatCurrency } = useCurrency()

    const valid = formData.description?.trim() && formData.amount

    if (!isOpen) return null

    // Ensure categories have proper format
    const categoryOptions = categories.length > 0 ? categories : [
        { id: 'maquinario', label: 'Maquinário' },
        { id: 'insumos', label: 'Insumos' },
        { id: 'operacional', label: 'Operacional' },
        { id: 'marketing', label: 'Marketing' },
        { id: 'impostos', label: 'Impostos' },
        { id: 'outros', label: 'Outros' }
    ]

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
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(40px) saturate(200%)',
                            WebkitBackdropFilter: 'blur(40px) saturate(200%)'
                        }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="expense-modal-title"
                        initial={{ y: '100%', scale: 0.95 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: '100%', scale: 0.95, opacity: 0 }}
                        transition={MODAL_ANIMATIONS.spring}
                        className="relative w-full max-w-[440px] max-h-[94vh] bg-[#f2f2f7] dark:bg-[#000] rounded-t-[36px] md:rounded-[36px] overflow-hidden flex flex-col"
                        style={{
                            boxShadow: '0 -12px 100px rgba(0,0,0,0.6)'
                        }}
                    >
                        {/* Pill Handle */}
                        <div className="flex justify-center pt-3 pb-1 md:hidden">
                            <motion.div
                                className="w-11 h-[5px] rounded-full"
                                style={{
                                    background: 'linear-gradient(90deg, rgba(120,120,128,0.2), rgba(120,120,128,0.5), rgba(120,120,128,0.2))'
                                }}
                            />
                        </div>

                        {/* Header with glassmorphism */}
                        <div
                            className="flex items-center justify-between h-[56px] px-5 border-b border-[#c6c6c8]/20 dark:border-[#38383a]/50"
                            style={{
                                background: 'rgba(242,242,247,0.85)',
                                backdropFilter: 'blur(30px) saturate(150%)',
                                WebkitBackdropFilter: 'blur(30px) saturate(150%)'
                            }}
                        >
                            <motion.button
                                onClick={onClose}
                                whileTap={{ scale: 0.95 }}
                                aria-label="Cancelar e fechar modal"
                                className="text-[17px] text-[#007aff] font-medium"
                            >
                                Cancelar
                            </motion.button>
                            <span id="expense-modal-title" className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">
                                {editingId ? 'Editar Despesa' : 'Nova Despesa'}
                            </span>
                            <motion.button
                                onClick={() => valid && onSave()}
                                disabled={!valid}
                                whileTap={{ scale: valid ? 0.95 : 1 }}
                                aria-label={valid ? "Salvar despesa" : "Preencha os campos obrigatórios"}
                                aria-disabled={!valid}
                                className={`
                                    text-[17px] font-bold transition-all duration-[250ms]
                                    ${valid
                                        ? 'text-[#007aff]'
                                        : 'text-[#007aff]/30'
                                    }
                                `}
                            >
                                Salvar
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto py-5">

                            {/* ═══ IDENTIFICAÇÃO ═══ */}
                            <Section icon={Icons.calendar} title="Identificação" delay={0}>
                                <NameInput
                                    value={formData.description || ''}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Nome da despesa"
                                    autoFocus
                                />
                                <Row label="Data" last>
                                    <AppleDatePicker
                                        value={formData.date}
                                        onChange={date => setFormData(p => ({ ...p, date }))}
                                    />
                                </Row>
                            </Section>

                            {/* ═══ VALOR ═══ */}
                            <Section icon={Icons.dollar} title="Valor" delay={1}>
                                <div className="px-4 py-3">
                                    <SegmentedControl
                                        value={formData.type || 'Variável'}
                                        options={EXPENSE_TYPES}
                                        onChange={(type: string) => setFormData((p: ExpenseFormData) => ({ ...p, type: type as 'Fixo' | 'Variável' }))}
                                    />
                                </div>
                                <Row label="Valor Unitário">
                                    <SmartInput
                                        value={formData.amount || ''}
                                        onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                                        placeholder="0.00"
                                        inputMode="decimal"
                                        format="currency"
                                        prefix="R$"
                                        width="w-28"
                                    />
                                </Row>
                                <Row label="Quantidade" last>
                                    <SmartInput
                                        value={formData.quantity || '1'}
                                        onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))}
                                        placeholder="1"
                                        inputMode="numeric"
                                        format="integer"
                                        width="w-16"
                                    />
                                </Row>
                            </Section>

                            {/* ═══ CATEGORIA (Premium Grid) ═══ */}
                            <Section icon={Icons.tag} title="Categoria" delay={2}>
                                <CategoryGrid
                                    value={formData.category}
                                    options={categoryOptions}
                                    onChange={category => setFormData(p => ({ ...p, category }))}
                                />
                            </Section>

                            {/* ═══ ANEXOS ═══ */}
                            <Section icon={Icons.link} title="Anexos" delay={3}>
                                <Row label="Link" last>
                                    <input
                                        type="url"
                                        value={formData.link || ''}
                                        onChange={e => setFormData(p => ({ ...p, link: e.target.value }))}
                                        placeholder="Opcional"
                                        className="bg-transparent text-[17px] text-[#007aff] font-medium outline-none text-right w-44 placeholder:text-[#aeaeb2]"
                                    />
                                </Row>
                            </Section>

                            {/* ═══ SUMMARY ═══ */}
                            <SummaryCard
                                total={formData.amount}
                                quantity={formData.quantity}
                                formatCurrency={formatCurrency}
                            />

                            {/* Safe area */}
                            <div className="h-10" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}

export default AddExpenseModal
