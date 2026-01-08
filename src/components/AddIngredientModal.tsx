// ═══════════════════════════════════════════════════════════════════
// ADD INGREDIENT MODAL — Apple Cupertino Ultimate Edition
// Inspired by macOS Sonoma, iOS 17, and visionOS Design Language
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { Supplier } from '../types'
import { NewItemState } from '../inventoryModules/hooks/useNewItemForm'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface AddIngredientModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: () => void
    newItem: NewItemState
    setNewItem: React.Dispatch<React.SetStateAction<NewItemState>>
    suppliers: Supplier[]
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════

const CATEGORIES = ['Ingredientes', 'Embalagens', 'Limpeza', 'Outros']
const UNITS = ['kg', 'g', 'L', 'ml', 'un', 'cx', 'pct']
const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
    Ingredientes: ['Farinhas', 'Laticínios', 'Carnes', 'Vegetais', 'Temperos', 'Outros'],
    Embalagens: ['Caixas', 'Sacolas', 'Papéis', 'Outros'],
    Limpeza: ['Produtos', 'Utensílios'],
    Outros: ['Geral']
}

// Apple-style gradients
const GRADIENTS = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-violet-500 to-violet-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    cyan: 'from-cyan-500 to-cyan-600',
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATION SYSTEM — Apple-quality springs
// ═══════════════════════════════════════════════════════════════════

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 }
const SPRING_BOUNCY = { type: 'spring' as const, stiffness: 600, damping: 25, mass: 0.5 }
const SPRING_SMOOTH = { type: 'spring' as const, stiffness: 300, damping: 35, mass: 1 }

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: SPRING },
    exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
}

const staggerContainer = {
    visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
}

const staggerItem = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: SPRING_SMOOTH },
}

// ═══════════════════════════════════════════════════════════════════
// ICONS — SF Symbols Style with Animation Support
// ═══════════════════════════════════════════════════════════════════

const Icons = {
    cube: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
    ),
    scale: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
        </svg>
    ),
    dollar: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    tag: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        </svg>
    ),
    building: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
    ),
    chart: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    ),
    cog: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    barcode: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        </svg>
    ),
    chevronDown: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    ),
    chevronRight: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    ),
    plus: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
    ),
    minus: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
    ),
    search: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    close: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    checkmark: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
    sparkles: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
    ),
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATED GRADIENT ORB — Apple visionOS style
// ═══════════════════════════════════════════════════════════════════

const GradientOrb: React.FC<{ gradient: string; size?: string }> = ({ gradient, size = 'w-9 h-9' }) => (
    <div className={`${size} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
)

// ═══════════════════════════════════════════════════════════════════
// GLASSMORPHIC CARD — Apple premium glass effect
// ═══════════════════════════════════════════════════════════════════

const GlassCard: React.FC<{
    children: React.ReactNode
    className?: string
    hoverable?: boolean
}> = ({ children, className = '', hoverable = false }) => (
    <motion.div
        whileHover={hoverable ? { scale: 1.01, y: -1 } : undefined}
        transition={SPRING_BOUNCY}
        className={`
            relative overflow-hidden rounded-2xl
            bg-white/70 dark:bg-zinc-800/50
            backdrop-blur-xl backdrop-saturate-150
            border border-white/50 dark:border-zinc-700/50
            shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_4px_16px_-4px_rgba(0,0,0,0.1)]
            dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]
            ${className}
        `}
    >
        {children}
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════
// SECTION HEADER — with gradient icon
// ═══════════════════════════════════════════════════════════════════

const SectionHeader: React.FC<{
    icon: React.ReactNode
    title: string
    gradient: string
    subtitle?: string
}> = ({ icon, title, gradient, subtitle }) => (
    <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
            {icon}
        </div>
        <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
    </div>
)

// ═══════════════════════════════════════════════════════════════════
// FORM ROW — with smooth hover states
// ═══════════════════════════════════════════════════════════════════

const FormRow: React.FC<{
    label: string
    hint?: string
    children: React.ReactNode
    last?: boolean
}> = ({ label, hint, children, last = false }) => (
    <motion.div
        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
        className={`flex items-center justify-between gap-4 px-4 py-3 ${!last ? 'border-b border-zinc-100/80 dark:border-zinc-700/30' : ''}`}
    >
        <div className="flex-1 min-w-0">
            <span className="text-[15px] font-medium text-zinc-900 dark:text-white">{label}</span>
            {hint && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{hint}</p>}
        </div>
        <div className="shrink-0">{children}</div>
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════
// INPUT — Apple native style with focus animation
// ═══════════════════════════════════════════════════════════════════

const AppleInput: React.FC<{
    value: string
    onChange: (v: string) => void
    placeholder?: string
    type?: 'text' | 'number'
    align?: 'left' | 'right'
    size?: 'sm' | 'md' | 'lg'
}> = ({ value, onChange, placeholder, type = 'text', align = 'right', size = 'md' }) => {
    const [isFocused, setIsFocused] = useState(false)

    const sizeClasses = {
        sm: 'h-8 px-2.5 text-[14px] min-w-[80px]',
        md: 'h-9 px-3 text-[15px] min-w-[100px]',
        lg: 'h-10 px-3.5 text-[16px] min-w-[120px]',
    }

    return (
        <motion.div
            animate={{ scale: isFocused ? 1.02 : 1 }}
            transition={SPRING_BOUNCY}
            className="relative"
        >
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                inputMode={type === 'number' ? 'decimal' : 'text'}
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
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// SELECT — with chevron animation
// ═══════════════════════════════════════════════════════════════════

const AppleSelect: React.FC<{
    value: string
    onChange: (v: string) => void
    options: string[]
}> = ({ value, onChange, options }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="
                h-9 pl-3 pr-8 rounded-lg appearance-none
                bg-zinc-100/80 dark:bg-zinc-700/50
                border-0 outline-none
                text-[15px] font-medium text-zinc-900 dark:text-white
                focus:bg-white dark:focus:bg-zinc-700
                focus:ring-2 focus:ring-blue-500/40
                transition-all duration-200 cursor-pointer
            "
        >
            {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
            {Icons.chevronDown}
        </div>
    </div>
)

// ═══════════════════════════════════════════════════════════════════
// STEPPER — with press animation and haptic-like feedback
// ═══════════════════════════════════════════════════════════════════

const AppleStepper: React.FC<{
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number
    step?: number
    unit?: string
}> = ({ value, onChange, min = 0, max = 9999, step = 1, unit }) => {
    // Use string state for controlled input to allow empty field while typing
    const [inputValue, setInputValue] = useState(String(value))
    const [isFocused, setIsFocused] = useState(false)

    // Sync with external value when not focused
    useEffect(() => {
        if (!isFocused) {
            setInputValue(String(value))
        }
    }, [value, isFocused])

    const decrease = () => {
        const newVal = Math.max(min, value - step)
        onChange(newVal)
        setInputValue(String(newVal))
    }

    const increase = () => {
        const newVal = Math.min(max, value + step)
        onChange(newVal)
        setInputValue(String(newVal))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow empty string and any number while typing
        setInputValue(e.target.value)
    }

    const handleBlur = () => {
        setIsFocused(false)
        // Apply constraints on blur
        const numVal = Number(inputValue)
        if (inputValue === '' || isNaN(numVal)) {
            // If empty or invalid, reset to min
            onChange(min)
            setInputValue(String(min))
        } else {
            // Clamp to min/max
            const clamped = Math.max(min, Math.min(max, numVal))
            onChange(clamped)
            setInputValue(String(clamped))
        }
    }

    return (
        <div className="flex items-center gap-2">
            {unit && <span className="text-[13px] font-medium text-zinc-400">{unit}</span>}
            <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-700/50 rounded-xl overflow-hidden">
                <motion.button
                    type="button"
                    onClick={decrease}
                    whileTap={{ scale: 0.85, backgroundColor: 'rgba(0,0,0,0.1)' }}
                    className="w-9 h-9 flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
                >
                    {Icons.minus}
                </motion.button>
                <input
                    type="text"
                    inputMode="numeric"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    className="w-14 h-9 bg-transparent text-center text-[15px] font-bold text-zinc-900 dark:text-white border-x border-zinc-200/50 dark:border-zinc-600/50 outline-none"
                />
                <motion.button
                    type="button"
                    onClick={increase}
                    whileTap={{ scale: 0.85, backgroundColor: 'rgba(0,0,0,0.1)' }}
                    className="w-9 h-9 flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
                >
                    {Icons.plus}
                </motion.button>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// TOGGLE — iOS authentic with scale bounce
// ═══════════════════════════════════════════════════════════════════

const AppleToggle: React.FC<{
    checked: boolean
    onChange: (v: boolean) => void
}> = ({ checked, onChange }) => {
    const scale = useSpring(1, { stiffness: 500, damping: 30 })

    return (
        <motion.button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            onTapStart={() => scale.set(0.95)}
            onTap={() => scale.set(1)}
            onTapCancel={() => scale.set(1)}
            style={{ scale }}
            className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-300 ${checked ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
        >
            <motion.div
                animate={{ x: checked ? 20 : 0 }}
                transition={SPRING_BOUNCY}
                className="absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-lg"
            />
        </motion.button>
    )
}

// ═══════════════════════════════════════════════════════════════════
// SUPPLIER SEARCH — Spotlight-style with animation
// ═══════════════════════════════════════════════════════════════════

const SupplierSearch: React.FC<{
    value: string
    onChange: (v: string) => void
    suppliers: Supplier[]
    onSelect: (s: Supplier) => void
}> = ({ value, onChange, suppliers, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const filtered = useMemo(() => {
        if (value.trim().length < 2) return []
        return suppliers.filter(s => s.name?.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
    }, [suppliers, value])

    return (
        <div className="relative">
            <motion.div
                animate={{ scale: isFocused ? 1.01 : 1 }}
                transition={SPRING_BOUNCY}
                className="relative"
            >
                <input
                    type="text"
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setIsOpen(true) }}
                    onFocus={() => { setIsOpen(true); setIsFocused(true) }}
                    onBlur={() => { setTimeout(() => setIsOpen(false), 200); setIsFocused(false) }}
                    placeholder="Pesquisar fornecedor..."
                    className="
                        w-full h-11 pl-10 pr-4 rounded-xl
                        bg-zinc-100/80 dark:bg-zinc-700/50
                        border-0 outline-none
                        text-[15px] font-medium text-zinc-900 dark:text-white
                        placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                        focus:bg-white dark:focus:bg-zinc-700
                        focus:ring-2 focus:ring-blue-500/40
                        transition-all duration-200
                    "
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                    {Icons.search}
                </div>
            </motion.div>

            <AnimatePresence>
                {isOpen && filtered.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={SPRING_BOUNCY}
                        className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl rounded-xl border border-white/50 dark:border-zinc-700/50 shadow-xl overflow-hidden"
                    >
                        {filtered.map((s, i) => (
                            <motion.button
                                key={s.id}
                                type="button"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => { onSelect(s); setIsOpen(false) }}
                                className="w-full px-3 py-2.5 text-left hover:bg-zinc-100/80 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3"
                            >
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${GRADIENTS.orange} flex items-center justify-center text-white`}>
                                    {Icons.building}
                                </div>
                                <span className="text-[14px] font-medium text-zinc-900 dark:text-white">{s.name}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// COLLAPSIBLE — with smooth height animation
// ═══════════════════════════════════════════════════════════════════

const Collapsible: React.FC<{
    icon: React.ReactNode
    title: string
    gradient: string
    children: React.ReactNode
    defaultOpen?: boolean
}> = ({ icon, title, gradient, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <GlassCard>
            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
                        {icon}
                    </div>
                    <span className="text-[15px] font-semibold text-zinc-900 dark:text-white">{title}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={SPRING_BOUNCY}
                    className="text-zinc-400"
                >
                    {Icons.chevronRight}
                </motion.div>
            </motion.button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={SPRING_SMOOTH}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-zinc-100/80 dark:border-zinc-700/30">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </GlassCard>
    )
}

// ═══════════════════════════════════════════════════════════════════
// SUCCESS CHECKMARK — animated celebration
// ═══════════════════════════════════════════════════════════════════

const SuccessCheckmark: React.FC = () => (
    <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={SPRING_BOUNCY}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-xl"
    >
        <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
        >
            {Icons.checkmark}
        </motion.div>
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function AddIngredientModal({
    isOpen,
    onClose,
    onAdd,
    newItem,
    setNewItem,
    suppliers
}: AddIngredientModalProps): React.ReactElement | null {
    const modalRef = useRef<HTMLDivElement>(null)
    const [supplierSearch, setSupplierSearch] = useState(newItem.supplierName || '')
    const [showSuccess, setShowSuccess] = useState(false)

    useScrollLock(isOpen)
    useFocusTrap(isOpen, modalRef)

    const subcategories = useMemo(() => DEFAULT_SUBCATEGORIES[newItem.category] || ['Outros'], [newItem.category])

    const updateField = useCallback((field: keyof NewItemState, value: string | boolean | number | null) => {
        setNewItem(prev => ({ ...prev, [field]: value }))
    }, [setNewItem])

    const handleSupplierSelect = useCallback((supplier: Supplier) => {
        setSupplierSearch(supplier.name || '')
        updateField('supplierId', String(supplier.id))
        updateField('supplierName', supplier.name || '')
    }, [updateField])

    const handleClose = useCallback(() => {
        setSupplierSearch('')
        setShowSuccess(false)
        onClose()
    }, [onClose])

    const handleSubmit = useCallback(() => {
        if (!newItem.name.trim()) return
        setShowSuccess(true)
        setTimeout(() => {
            onAdd()
            handleClose()
        }, 800)
    }, [newItem.name, onAdd, handleClose])

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && newItem.name.trim()) {
                e.preventDefault()
                handleSubmit()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, handleClose, handleSubmit, newItem.name])

    const isValid = useMemo(() => newItem.name.trim().length > 0, [newItem.name])

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto">
                    {/* Backdrop with blur */}
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black/30 backdrop-blur-2xl"
                        onClick={handleClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="
                            relative w-full max-w-[520px] my-4 md:my-0
                            bg-zinc-50/95 dark:bg-zinc-900/95
                            backdrop-blur-3xl
                            rounded-[28px]
                            border border-white/30 dark:border-zinc-700/50
                            shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]
                            dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]
                            overflow-hidden
                        "
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Success Overlay */}
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl"
                                >
                                    <SuccessCheckmark />
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="mt-4 text-[17px] font-semibold text-zinc-900 dark:text-white"
                                    >
                                        Item Adicionado!
                                    </motion.p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Header */}
                        <div className="relative flex items-center justify-between px-5 py-4 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-700/50">
                            <motion.button
                                onClick={handleClose}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-blue-500 text-[16px] font-medium hover:text-blue-600 transition-colors"
                            >
                                Cancelar
                            </motion.button>

                            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${GRADIENTS.green} flex items-center justify-center text-white shadow`}>
                                    {Icons.sparkles}
                                </div>
                                <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white">
                                    Novo Item
                                </h2>
                            </div>

                            <motion.button
                                onClick={handleSubmit}
                                disabled={!isValid}
                                whileHover={isValid ? { scale: 1.02 } : undefined}
                                whileTap={isValid ? { scale: 0.95 } : undefined}
                                className="text-[16px] font-semibold text-blue-500 disabled:text-zinc-300 dark:disabled:text-zinc-600 transition-colors"
                            >
                                Salvar
                            </motion.button>
                        </div>

                        {/* Content with stagger animation */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="px-4 py-4 space-y-3 max-h-[70vh] overflow-y-auto overscroll-contain"
                        >
                            {/* Name Input - Hero Field */}
                            <motion.div variants={staggerItem}>
                                <GlassCard className="group">
                                    <div className="px-4 py-4">
                                        <input
                                            type="text"
                                            value={newItem.name}
                                            onChange={(e) => updateField('name', e.target.value)}
                                            placeholder="Nome do item"
                                            autoFocus
                                            className="w-full text-[20px] font-semibold text-zinc-900 dark:text-white bg-transparent border-0 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                                        />
                                        <p className="text-[12px] text-zinc-400 mt-1">Campo obrigatório</p>
                                    </div>
                                </GlassCard>
                            </motion.div>

                            {/* Quantity & Unit */}
                            <motion.div variants={staggerItem}>
                                <GlassCard>
                                    <SectionHeader icon={Icons.scale} title="Quantidade" gradient={GRADIENTS.blue} />
                                    <FormRow label="Qtd por Pacote" hint="Unidades em cada pacote">
                                        <AppleStepper
                                            value={Number(newItem.packageQuantity) || 1}
                                            onChange={(v) => updateField('packageQuantity', String(v))}
                                            min={1}
                                        />
                                    </FormRow>
                                    <FormRow label="Nº de Pacotes">
                                        <AppleStepper
                                            value={Number(newItem.packageCount) || 1}
                                            onChange={(v) => updateField('packageCount', String(v))}
                                            min={1}
                                        />
                                    </FormRow>
                                    <FormRow label="Unidade" last>
                                        <AppleSelect value={newItem.unit} onChange={(v) => updateField('unit', v)} options={UNITS} />
                                    </FormRow>
                                </GlassCard>
                            </motion.div>

                            {/* Price */}
                            <motion.div variants={staggerItem}>
                                <GlassCard>
                                    <SectionHeader icon={Icons.dollar} title="Preço" subtitle="Em dólares canadenses" gradient={GRADIENTS.green} />
                                    <FormRow label="Preço por Unidade" last>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[14px] font-medium text-zinc-400">CAD$</span>
                                            <AppleInput
                                                value={newItem.pricePerUnit}
                                                onChange={(v) => updateField('pricePerUnit', v)}
                                                type="number"
                                                placeholder="0.00"
                                                size="md"
                                            />
                                        </div>
                                    </FormRow>
                                </GlassCard>
                            </motion.div>

                            {/* Category */}
                            <motion.div variants={staggerItem}>
                                <GlassCard>
                                    <SectionHeader icon={Icons.tag} title="Categoria" gradient={GRADIENTS.purple} />
                                    <FormRow label="Categoria">
                                        <AppleSelect
                                            value={newItem.category}
                                            onChange={(v) => {
                                                updateField('category', v)
                                                const subs = DEFAULT_SUBCATEGORIES[v] || ['Outros']
                                                updateField('subcategory', subs[0] || 'Outros')
                                            }}
                                            options={CATEGORIES}
                                        />
                                    </FormRow>
                                    <FormRow label="Subcategoria" last>
                                        <AppleSelect value={newItem.subcategory} onChange={(v) => updateField('subcategory', v)} options={subcategories} />
                                    </FormRow>
                                </GlassCard>
                            </motion.div>

                            {/* Supplier */}
                            <motion.div variants={staggerItem}>
                                <GlassCard>
                                    <SectionHeader icon={Icons.building} title="Fornecedor" gradient={GRADIENTS.orange} />
                                    <div className="px-4 py-3">
                                        <SupplierSearch
                                            value={supplierSearch}
                                            onChange={setSupplierSearch}
                                            suppliers={suppliers}
                                            onSelect={handleSupplierSelect}
                                        />
                                    </div>
                                </GlassCard>
                            </motion.div>

                            {/* Stock Limits - Collapsible */}
                            <motion.div variants={staggerItem}>
                                <Collapsible icon={Icons.chart} title="Limites de Estoque" gradient={GRADIENTS.cyan}>
                                    <FormRow label={`Mínimo`} hint={`Alertar quando abaixo (${newItem.unit})`}>
                                        <AppleStepper value={Number(newItem.minStock) || 0} onChange={(v) => updateField('minStock', String(v))} min={0} />
                                    </FormRow>
                                    <FormRow label={`Máximo`} hint={`Quantidade ideal (${newItem.unit})`} last>
                                        <AppleStepper value={Number(newItem.maxStock) || 0} onChange={(v) => updateField('maxStock', String(v))} min={0} step={10} />
                                    </FormRow>
                                </Collapsible>
                            </motion.div>

                            {/* Advanced - Collapsible */}
                            <motion.div variants={staggerItem}>
                                <Collapsible icon={Icons.cog} title="Configurações Avançadas" gradient={GRADIENTS.pink}>
                                    <FormRow label="Validade" hint="Dias até vencer">
                                        <AppleStepper value={Number(newItem.shelfLifeDays) || 0} onChange={(v) => updateField('shelfLifeDays', String(v))} min={0} />
                                    </FormRow>
                                    <FormRow label="Prazo de Entrega" hint="Dias até receber do fornecedor">
                                        <AppleStepper value={newItem.leadTimeDays} onChange={(v) => updateField('leadTimeDays', v)} min={0} />
                                    </FormRow>
                                    <FormRow label="Cotação Automática" hint="Pedir cotação quando baixo" last>
                                        <AppleToggle checked={newItem.enableAutoQuotation} onChange={(v) => updateField('enableAutoQuotation', v)} />
                                    </FormRow>
                                </Collapsible>
                            </motion.div>

                            {/* Barcode */}
                            <motion.div variants={staggerItem}>
                                <GlassCard>
                                    <FormRow label="Código de Barras" hint="EAN-13 ou UPC" last>
                                        <AppleInput
                                            value={newItem.barcode}
                                            onChange={(v) => updateField('barcode', v)}
                                            placeholder="Opcional"
                                            align="left"
                                            size="md"
                                        />
                                    </FormRow>
                                </GlassCard>
                            </motion.div>

                            {/* Keyboard Shortcut Hint */}
                            <motion.div variants={staggerItem} className="flex justify-center pt-2 pb-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/50">
                                    <span className="text-[11px] text-zinc-400">Pressione</span>
                                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-300">⌘</kbd>
                                    <span className="text-[11px] text-zinc-400">+</span>
                                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-300">↵</kbd>
                                    <span className="text-[11px] text-zinc-400">para salvar</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}

export default AddIngredientModal
