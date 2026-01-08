// ═══════════════════════════════════════════════════════════════════
// ADD SUPPLIER MODAL — Apple Cupertino Ultimate Edition
// Inspired by macOS Sonoma, iOS 17, and visionOS Design Language
// Redesigned to match AddIngredientModal premium experience
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useSpring } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { Icons, LinkedItemsSearch, FileUploadZone } from '../addSupplierModules'
import { useStockMovements } from '../stores/useAppStore'

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
// DESIGN TOKENS — Apple-style gradients
// ═══════════════════════════════════════════════════════════════════

const GRADIENTS = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-violet-500 to-violet-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    cyan: 'from-cyan-500 to-cyan-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-400 to-teal-500',
}

// ═══════════════════════════════════════════════════════════════════
// ICONS — SF Symbols Style
// ═══════════════════════════════════════════════════════════════════

const ModalIcons = {
    person: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    ),
    phone: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
    ),
    mapPin: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
    ),
    link: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
    ),
    creditCard: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
    ),
    bolt: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
    ),
    paperclip: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
        </svg>
    ),
    text: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
    ),
    sparkles: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
    ),
    chevronRight: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    ),
    checkmark: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
}

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
            relative overflow-visible rounded-2xl
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
    type?: 'text' | 'tel' | 'email'
    align?: 'left' | 'right'
    size?: 'sm' | 'md' | 'lg' | 'full'
    autoFocus?: boolean
    onAction?: () => void
    actionIcon?: React.ReactNode
}> = ({ value, onChange, placeholder, type = 'text', align = 'right', size = 'md', autoFocus, onAction, actionIcon }) => {
    const [isFocused, setIsFocused] = useState(false)

    const sizeClasses = {
        sm: 'h-8 px-2.5 text-[14px] min-w-[80px]',
        md: 'h-9 px-3 text-[15px] min-w-[100px]',
        lg: 'h-10 px-3.5 text-[16px] min-w-[120px]',
        full: 'h-11 px-4 text-[15px] w-full',
    }

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
// TEXTAREA — Premium style
// ═══════════════════════════════════════════════════════════════════

const AppleTextarea: React.FC<{
    value: string
    onChange: (v: string) => void
    placeholder?: string
    rows?: number
}> = ({ value, onChange, placeholder, rows = 3 }) => (
    <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="
            w-full px-4 py-3 rounded-xl
            bg-zinc-100/80 dark:bg-zinc-700/50
            border-0 outline-none resize-none
            text-[15px] font-medium text-zinc-900 dark:text-white
            placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            focus:bg-white dark:focus:bg-zinc-700
            focus:ring-2 focus:ring-blue-500/40
            transition-all duration-200
        "
    />
)

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
                    {ModalIcons.chevronRight}
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
            {ModalIcons.checkmark}
        </motion.div>
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════
// ACTION ICONS
// ═══════════════════════════════════════════════════════════════════

const ActionIcons = {
    call: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    ),
    email: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    whatsapp: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    ),
}

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface AddSupplierModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: () => void
    formData: any
    setFormData: React.Dispatch<React.SetStateAction<any>>
    inventoryItems?: any[]
    isEditing?: boolean
    onFileSelect?: (files: FileList) => void
    uploadingFile?: boolean
    uploadProgress?: number
    onDeleteDocument?: (docId: string) => void
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function AddSupplierModal({
    isOpen, onClose, onSave, formData, setFormData, inventoryItems = [],
    isEditing = false, onFileSelect, uploadingFile, uploadProgress, onDeleteDocument
}: AddSupplierModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const [showSuccess, setShowSuccess] = useState(false)
    const [itemSearchQuery, setItemSearchQuery] = useState('')

    useScrollLock(isOpen)
    useFocusTrap(isOpen, modalRef)
    const stockMovements = useStockMovements()

    const isValid = useMemo(() => formData.name?.trim().length > 0, [formData.name])

    // Action handlers
    const handleCall = useCallback((phone: string) => window.open(`tel:${phone.replace(/\D/g, '')}`, '_self'), [])
    const handleEmail = useCallback((email: string) => window.open(`mailto:${email}`, '_self'), [])
    const handleWhatsApp = useCallback((w: string) => window.open(`https://wa.me/55${w.replace(/\D/g, '')}`, '_blank'), [])

    const linkItem = useCallback((item: any) => {
        if (!formData.linkedItems?.find((i: any) => i.itemId === item.id)) {
            setFormData((p: any) => ({
                ...p,
                linkedItems: [...(p.linkedItems || []), { itemId: item.id, itemName: item.name }]
            }))
        }
    }, [formData.linkedItems, setFormData])

    const unlinkItem = useCallback((id: string) => {
        setFormData((p: any) => ({
            ...p,
            linkedItems: (p.linkedItems || []).filter((i: any) => i.itemId !== id)
        }))
    }, [setFormData])

    const updateField = useCallback((field: string, value: any) => {
        setFormData((p: any) => ({ ...p, [field]: value }))
    }, [setFormData])

    const handleClose = useCallback(() => {
        setShowSuccess(false)
        onClose()
    }, [onClose])

    const handleSubmit = useCallback(() => {
        if (!isValid) return
        setShowSuccess(true)
        setTimeout(() => {
            onSave()
            handleClose()
        }, 800)
    }, [isValid, onSave, handleClose])

    // Set automation enabled by default for new suppliers
    useEffect(() => {
        if (isOpen && !isEditing && (formData.autoOrderEnabled === undefined || formData.autoOrderEnabled === null)) {
            updateField('autoOrderEnabled', true)
        }
    }, [isOpen, isEditing])

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isValid) {
                e.preventDefault()
                handleSubmit()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, handleClose, handleSubmit, isValid])

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
                        aria-labelledby="supplier-modal-title"
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
                                        {isEditing ? 'Fornecedor Atualizado!' : 'Fornecedor Adicionado!'}
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
                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${GRADIENTS.purple} flex items-center justify-center text-white shadow`}>
                                    {ModalIcons.sparkles}
                                </div>
                                <h2 id="supplier-modal-title" className="text-[17px] font-bold text-zinc-900 dark:text-white">
                                    {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
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
                                            value={formData.name || ''}
                                            onChange={(e) => updateField('name', e.target.value)}
                                            placeholder="Nome do contato"
                                            autoFocus
                                            className="w-full text-[20px] font-semibold text-zinc-900 dark:text-white bg-transparent border-0 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                                        />
                                        <p className="text-[12px] text-zinc-400 mt-1">Campo obrigatório</p>
                                    </div>
                                    <div className="border-t border-zinc-100/80 dark:border-zinc-700/30">
                                        <FormRow label="Empresa" last>
                                            <AppleInput
                                                value={formData.company || ''}
                                                onChange={(v) => updateField('company', v)}
                                                placeholder="Opcional"
                                            />
                                        </FormRow>
                                    </div>
                                </GlassCard>
                            </motion.div>

                            {/* Contact */}
                            <motion.div variants={staggerItem}>
                                <GlassCard>
                                    <SectionHeader icon={ModalIcons.phone} title="Contato" gradient={GRADIENTS.blue} />
                                    <FormRow label="Telefone">
                                        <AppleInput
                                            value={formData.phone || ''}
                                            onChange={(v) => updateField('phone', v)}
                                            placeholder="(00) 00000-0000"
                                            type="tel"
                                            onAction={() => handleCall(formData.phone)}
                                            actionIcon={ActionIcons.call}
                                        />
                                    </FormRow>
                                    <FormRow label="Email">
                                        <AppleInput
                                            value={formData.email || ''}
                                            onChange={(v) => updateField('email', v)}
                                            placeholder="email@exemplo.com"
                                            type="email"
                                            onAction={() => handleEmail(formData.email)}
                                            actionIcon={ActionIcons.email}
                                        />
                                    </FormRow>
                                    <FormRow label="Tem WhatsApp?">
                                        <AppleToggle
                                            checked={formData.hasWhatsApp || false}
                                            onChange={(v) => updateField('hasWhatsApp', v)}
                                        />
                                    </FormRow>
                                    <AnimatePresence>
                                        {formData.hasWhatsApp && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={SPRING_SMOOTH}
                                            >
                                                <FormRow label="WhatsApp" last>
                                                    <AppleInput
                                                        value={formData.whatsapp || formData.phone || ''}
                                                        onChange={(v) => updateField('whatsapp', v)}
                                                        placeholder="(00) 00000-0000"
                                                        type="tel"
                                                        onAction={() => handleWhatsApp(formData.whatsapp || formData.phone)}
                                                        actionIcon={ActionIcons.whatsapp}
                                                    />
                                                </FormRow>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {!formData.hasWhatsApp && <div className="h-0" />}
                                </GlassCard>
                            </motion.div>

                            {/* Address - Apple Style with separate fields */}
                            <motion.div variants={staggerItem}>
                                <Collapsible
                                    icon={ModalIcons.mapPin}
                                    title="Address"
                                    gradient={GRADIENTS.orange}
                                    defaultOpen={!!(formData.addressStreet || formData.addressCity)}
                                >
                                    <FormRow label="Street Address">
                                        <AppleInput
                                            value={formData.addressStreet || ''}
                                            onChange={(v) => updateField('addressStreet', v)}
                                            placeholder="123 Main Street"
                                            size="lg"
                                            align="left"
                                        />
                                    </FormRow>
                                    <FormRow label="Unit/Suite">
                                        <AppleInput
                                            value={formData.addressUnit || ''}
                                            onChange={(v) => updateField('addressUnit', v)}
                                            placeholder="Suite 200"
                                        />
                                    </FormRow>
                                    <div className="flex gap-2 px-4 py-2 border-b border-zinc-100/80 dark:border-zinc-700/30">
                                        <div className="flex-[2]">
                                            <label className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-1 block">City</label>
                                            <input
                                                type="text"
                                                value={formData.addressCity || ''}
                                                onChange={(e) => updateField('addressCity', e.target.value)}
                                                placeholder="Toronto"
                                                className="w-full h-9 px-3 text-[15px] rounded-lg bg-zinc-100/80 dark:bg-zinc-700/50 border-0 outline-none font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-1 block">Province</label>
                                            <input
                                                type="text"
                                                value={formData.addressProvince || ''}
                                                onChange={(e) => updateField('addressProvince', e.target.value.toUpperCase().slice(0, 2))}
                                                placeholder="ON"
                                                maxLength={2}
                                                className="w-full h-9 px-3 text-[15px] rounded-lg bg-zinc-100/80 dark:bg-zinc-700/50 border-0 outline-none font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 text-center uppercase"
                                            />
                                        </div>
                                    </div>
                                    <FormRow label="Postal Code" last>
                                        <AppleInput
                                            value={formData.addressPostalCode || ''}
                                            onChange={(v) => updateField('addressPostalCode', v.toUpperCase())}
                                            placeholder="M5V 1A1"
                                        />
                                    </FormRow>
                                </Collapsible>
                            </motion.div>

                            {/* Linked Items */}
                            <motion.div variants={staggerItem}>
                                <GlassCard>
                                    <SectionHeader
                                        icon={ModalIcons.link}
                                        title="Itens Vinculados"
                                        subtitle={formData.linkedItems?.length ? `${formData.linkedItems.length} itens` : undefined}
                                        gradient={GRADIENTS.cyan}
                                    />
                                    <div className="p-4">
                                        <LinkedItemsSearch
                                            inventoryItems={inventoryItems}
                                            linkedItems={formData.linkedItems || []}
                                            onLink={linkItem}
                                            onUnlink={unlinkItem}
                                            searchQuery={itemSearchQuery}
                                            setSearchQuery={setItemSearchQuery}
                                            stockMovements={stockMovements}
                                            supplierId={formData.id}
                                            inventoryItemsFull={inventoryItems}
                                        />
                                    </div>
                                </GlassCard>
                            </motion.div>

                            {/* Commercial Conditions - with Delivery Days */}
                            <motion.div variants={staggerItem}>
                                <Collapsible
                                    icon={ModalIcons.creditCard}
                                    title="Condições Comerciais"
                                    gradient={GRADIENTS.indigo}
                                    defaultOpen={!!(formData.paymentTerms || formData.minimumOrder || formData.deliveryDays?.length)}
                                >
                                    <FormRow label="Payment Terms">
                                        <AppleInput
                                            value={formData.paymentTerms || ''}
                                            onChange={(v) => updateField('paymentTerms', v)}
                                            placeholder="Net 30"
                                        />
                                    </FormRow>
                                    <FormRow label="Minimum Order">
                                        <AppleInput
                                            value={formData.minimumOrder || ''}
                                            onChange={(v) => updateField('minimumOrder', v)}
                                            placeholder="CAD $500"
                                        />
                                    </FormRow>

                                    {/* Delivery Days - Apple Style */}
                                    <div className="px-4 py-4 border-t border-zinc-100/80 dark:border-zinc-700/30">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[15px] font-medium text-zinc-900 dark:text-white">Delivery Days</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { key: 'mon', label: 'Mon' },
                                                { key: 'tue', label: 'Tue' },
                                                { key: 'wed', label: 'Wed' },
                                                { key: 'thu', label: 'Thu' },
                                                { key: 'fri', label: 'Fri' },
                                                { key: 'sat', label: 'Sat' },
                                                { key: 'sun', label: 'Sun' },
                                            ].map((day) => {
                                                const isSelected = (formData.deliveryDays || []).includes(day.key)
                                                return (
                                                    <motion.button
                                                        key={day.key}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = formData.deliveryDays || []
                                                            const updated = isSelected
                                                                ? current.filter((d: string) => d !== day.key)
                                                                : [...current, day.key]
                                                            updateField('deliveryDays', updated)
                                                        }}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        animate={{
                                                            backgroundColor: isSelected ? '#6366f1' : 'rgba(0,0,0,0)',
                                                            borderColor: isSelected ? '#6366f1' : 'rgba(161,161,170,0.3)',
                                                        }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                        className={`
                                                            w-[52px] h-[40px] rounded-xl border-2 
                                                            flex items-center justify-center
                                                            text-[13px] font-semibold
                                                            transition-colors
                                                            ${isSelected
                                                                ? 'text-white shadow-lg shadow-indigo-500/25'
                                                                : 'text-zinc-600 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-800/50'
                                                            }
                                                        `}
                                                    >
                                                        {day.label}
                                                    </motion.button>
                                                )
                                            })}
                                        </div>
                                        {(formData.deliveryDays?.length || 0) > 0 && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-[12px] text-indigo-500 dark:text-indigo-400 mt-2"
                                            >
                                                {formData.deliveryDays.length} day{formData.deliveryDays.length > 1 ? 's' : ''} selected
                                            </motion.p>
                                        )}
                                    </div>
                                </Collapsible>
                            </motion.div>

                            {/* Attachments - Collapsible */}
                            <motion.div variants={staggerItem}>
                                <Collapsible
                                    icon={ModalIcons.paperclip}
                                    title="Anexos"
                                    gradient={GRADIENTS.pink}
                                    defaultOpen={formData.documents?.length > 0}
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
                                </Collapsible>
                            </motion.div>

                            {/* Notes - Collapsible */}
                            <motion.div variants={staggerItem}>
                                <Collapsible
                                    icon={ModalIcons.text}
                                    title="Observações"
                                    gradient={GRADIENTS.purple}
                                    defaultOpen={!!formData.notes}
                                >
                                    <div className="p-4">
                                        <AppleTextarea
                                            value={formData.notes || ''}
                                            onChange={(v) => updateField('notes', v)}
                                            placeholder="Notas adicionais..."
                                            rows={3}
                                        />
                                    </div>
                                </Collapsible>
                            </motion.div>

                            {/* Automation - LAST ITEM with teal design */}
                            <motion.div variants={staggerItem}>
                                <GlassCard>
                                    <div className="p-4">
                                        {/* Header with toggle */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                                    </svg>
                                                </div>
                                                <span className="text-[16px] font-semibold text-zinc-900 dark:text-white">Automação</span>
                                            </div>
                                            <AppleToggle
                                                checked={formData.autoOrderEnabled === true}
                                                onChange={(v) => updateField('autoOrderEnabled', v)}
                                            />
                                        </div>
                                        {/* Description box */}
                                        <div className="p-4 bg-teal-500/10 dark:bg-teal-500/15 rounded-2xl border border-teal-500/20 dark:border-teal-400/20">
                                            <p className="text-[14px] text-teal-700 dark:text-teal-300 font-medium leading-relaxed">
                                                Quando um item vinculado atingir o estoque mínimo, uma cotação será criada automaticamente.
                                            </p>
                                        </div>
                                    </div>
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
