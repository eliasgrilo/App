// ═══════════════════════════════════════════════════════════════════
// APPLE DESKTOP MODAL — Premium macOS-style Modal System
// Design Philosophy: Cupertino Engineering Excellence for Desktop
// ═══════════════════════════════════════════════════════════════════

import React, { useRef, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS — Apple macOS Desktop Modal Standards
// ═══════════════════════════════════════════════════════════════════

export const APPLE_MODAL_TOKENS = {
    // Modal Container
    width: {
        sm: 'max-w-[380px]',
        md: 'max-w-[480px]',
        lg: 'max-w-[560px]',
        xl: 'max-w-[680px]',
        full: 'max-w-[800px]',
    },
    // Corner Radius - macOS Big Sur style
    radius: 'rounded-[20px]',
    // Backdrop blur intensity
    backdropBlur: 'blur(40px) saturate(180%)',
    // Shadows - macOS depth system
    shadow: {
        light: '0 24px 80px -12px rgba(0,0,0,0.25), 0 12px 36px -8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        dark: '0 24px 80px -12px rgba(0,0,0,0.6), 0 12px 36px -8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
    },
    // Background - Frosted glass effect
    background: {
        light: 'rgba(255,255,255,0.92)',
        dark: 'rgba(28,28,30,0.95)',
    },
    // Header height
    headerHeight: '60px',
    // Padding system
    padding: {
        header: 'px-6 py-4',
        content: 'px-6 py-6',
        footer: 'px-6 py-5',
    },
} as const

// ═══════════════════════════════════════════════════════════════════
// ANIMATION SYSTEM — Apple-quality Motion Design
// ═══════════════════════════════════════════════════════════════════

export const MODAL_SPRING = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 35,
    mass: 0.8,
}

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
}

const modalVariants = {
    hidden: {
        opacity: 0,
        scale: 0.92,
        y: 12,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        y: 8,
    },
}

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface AppleDesktopModalProps {
    /** Whether the modal is open */
    isOpen: boolean
    /** Callback when modal should close */
    onClose: () => void
    /** Modal title */
    title: string
    /** Optional subtitle below title */
    subtitle?: string
    /** Modal content */
    children: ReactNode
    /** Modal size variant */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    /** Footer content (buttons, etc) */
    footer?: ReactNode
    /** Icon to show in header (JSX element) */
    icon?: ReactNode
    /** Icon background color class */
    iconBg?: string
    /** Whether to show close button */
    showClose?: boolean
    /** Additional class names for the modal container */
    className?: string
    /** Aria label for the modal */
    ariaLabel?: string
    /** Whether to close on backdrop click */
    closeOnBackdropClick?: boolean
    /** Whether to close on Escape key */
    closeOnEscape?: boolean
    /** Maximum height for content area */
    maxContentHeight?: string
}

// ═══════════════════════════════════════════════════════════════════
// CLOSE BUTTON COMPONENT — Apple-style circular button
// ═══════════════════════════════════════════════════════════════════

const CloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.08)' }}
        whileTap={{ scale: 0.95 }}
        className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        aria-label="Fechar"
    >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    </motion.button>
)

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — Apple Desktop Modal
// ═══════════════════════════════════════════════════════════════════

export function AppleDesktopModal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    size = 'md',
    footer,
    icon,
    iconBg = 'bg-zinc-100 dark:bg-zinc-800',
    showClose = true,
    className = '',
    ariaLabel,
    closeOnBackdropClick = true,
    closeOnEscape = true,
    maxContentHeight = 'max-h-[60vh]',
}: AppleDesktopModalProps): React.ReactElement | null {
    const modalRef = useRef<HTMLDivElement>(null)

    // Hooks
    useScrollLock(isOpen)
    useFocusTrap(isOpen, modalRef)

    // Escape key handler
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return

        const handleKeyDown = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') onClose()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, closeOnEscape, onClose])

    // Backdrop click handler
    const handleBackdropClick = (): void => {
        if (closeOnBackdropClick) onClose()
    }

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
                    {/* Backdrop with blur */}
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute inset-0"
                        onClick={handleBackdropClick}
                        style={{
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            backdropFilter: APPLE_MODAL_TOKENS.backdropBlur,
                            WebkitBackdropFilter: APPLE_MODAL_TOKENS.backdropBlur,
                        }}
                    />

                    {/* Modal Container */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={ariaLabel || title}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`
                            relative w-full ${APPLE_MODAL_TOKENS.width[size]} ${APPLE_MODAL_TOKENS.radius}
                            bg-white/95 dark:bg-[#1c1c1e]/95
                            backdrop-blur-2xl
                            border border-zinc-200/50 dark:border-white/[0.08]
                            flex flex-col overflow-hidden
                            ${className}
                        `}
                        style={{
                            boxShadow: 'var(--shadow-2xl, 0 24px 80px -12px rgba(0,0,0,0.25))',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="shrink-0 flex items-center gap-4 px-6 py-5 border-b border-zinc-200/60 dark:border-white/[0.06]">
                            {/* Icon */}
                            {icon && (
                                <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
                                    {icon}
                                </div>
                            )}

                            {/* Title & Subtitle */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                        {subtitle}
                                    </p>
                                )}
                            </div>

                            {/* Close Button */}
                            {showClose && <CloseButton onClick={onClose} />}
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className={`flex-1 overflow-y-auto overscroll-contain ${maxContentHeight}`}>
                            <div className="px-6 py-6">
                                {children}
                            </div>
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="shrink-0 px-6 py-5 border-t border-zinc-200/60 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-zinc-900/50">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS — Apple-style Form Elements for Modals
// ═══════════════════════════════════════════════════════════════════

/** Apple-style section divider with label */
export const ModalSection: React.FC<{
    title?: string
    children: ReactNode
    className?: string
}> = ({ title, children, className = '' }) => (
    <div className={`space-y-3 ${className}`}>
        {title && (
            <h3 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.08em]">
                {title}
            </h3>
        )}
        {children}
    </div>
)

/** Apple-style row component for form fields */
export const ModalRow: React.FC<{
    label: string
    children: ReactNode
    description?: string
    last?: boolean
}> = ({ label, children, description, last = false }) => (
    <div className={`flex items-center justify-between py-3 ${!last ? 'border-b border-zinc-200/60 dark:border-white/[0.06]' : ''}`}>
        <div className="flex-1 min-w-0">
            <span className="text-[15px] font-medium text-zinc-900 dark:text-white">{label}</span>
            {description && (
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
            )}
        </div>
        <div className="shrink-0 ml-4">
            {children}
        </div>
    </div>
)

/** Apple-style card container for grouped content */
export const ModalCard: React.FC<{
    children: ReactNode
    className?: string
}> = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/60 dark:border-white/[0.06] overflow-hidden ${className}`}>
        {children}
    </div>
)

/** Apple-style input for modals */
export const ModalInput: React.FC<{
    value: string
    onChange: (value: string) => void
    placeholder?: string
    type?: 'text' | 'number' | 'email'
    className?: string
    autoFocus?: boolean
}> = ({ value, onChange, placeholder, type = 'text', className = '', autoFocus }) => (
    <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`
            w-full h-12 px-4 rounded-xl
            bg-zinc-100 dark:bg-zinc-800
            border-0 outline-none
            text-[15px] font-medium text-zinc-900 dark:text-white
            placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            focus:ring-2 focus:ring-blue-500/40 focus:bg-white dark:focus:bg-zinc-700
            transition-all duration-200
            ${className}
        `}
    />
)

/** Apple-style textarea for modals */
export const ModalTextarea: React.FC<{
    value: string
    onChange: (value: string) => void
    placeholder?: string
    rows?: number
    className?: string
}> = ({ value, onChange, placeholder, rows = 4, className = '' }) => (
    <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`
            w-full px-4 py-3 rounded-xl
            bg-zinc-100 dark:bg-zinc-800
            border-0 outline-none resize-none
            text-[15px] font-medium text-zinc-900 dark:text-white
            placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            focus:ring-2 focus:ring-blue-500/40 focus:bg-white dark:focus:bg-zinc-700
            transition-all duration-200
            ${className}
        `}
    />
)

// ═══════════════════════════════════════════════════════════════════
// BUTTON COMPONENTS — Apple-style Modal Buttons
// ═══════════════════════════════════════════════════════════════════

interface ModalButtonProps {
    children: ReactNode
    onClick?: () => void
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    disabled?: boolean
    className?: string
    type?: 'button' | 'submit'
}

export const ModalButton: React.FC<ModalButtonProps> = ({
    children,
    onClick,
    variant = 'secondary',
    disabled = false,
    className = '',
    type = 'button',
}) => {
    const baseStyles = `
        flex items-center justify-center gap-2
        h-12 px-6 rounded-xl
        text-[15px] font-semibold
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
    `

    const variants = {
        primary: 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-lg',
        secondary: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700',
        danger: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20',
        ghost: 'bg-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
    }

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {children}
        </motion.button>
    )
}

/** Apple-style button row for modal footers */
export const ModalButtonRow: React.FC<{
    children: ReactNode
    className?: string
}> = ({ children, className = '' }) => (
    <div className={`flex items-center gap-3 ${className}`}>
        {children}
    </div>
)

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export default AppleDesktopModal
