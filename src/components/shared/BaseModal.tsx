// ═══════════════════════════════════════════════════════════════════
// BASE MODAL — Shared modal shell component
// Eliminates duplicate modal boilerplate across 28+ modal files
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollLock } from '../../hooks/useScrollLock'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { SPRING_BOUNCY, backdropVariants, modalVariants } from './primitives'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface BaseModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    subtitle?: string
    // Size presets
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    // Enable/disable features
    showCloseButton?: boolean
    closeOnBackdrop?: boolean
    closeOnEscape?: boolean
    // Custom classNames
    className?: string
    contentClassName?: string
    // Accessibility
    ariaLabel?: string
    ariaDescribedBy?: string
}

// Size configurations
const SIZE_CLASSES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[90vw] md:max-w-[80vw]',
}

// ═══════════════════════════════════════════════════════════════════
// CLOSE ICON
// ═══════════════════════════════════════════════════════════════════

const CloseIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
)

// ═══════════════════════════════════════════════════════════════════
// BASE MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    subtitle,
    size = 'md',
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    className = '',
    contentClassName = '',
    ariaLabel,
    ariaDescribedBy,
}) => {
    const modalRef = useRef<HTMLDivElement>(null)

    // Lock scroll when open
    useScrollLock(isOpen)

    // Trap focus inside modal
    useFocusTrap(isOpen, modalRef)

    // Handle escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (closeOnEscape && e.key === 'Escape') {
            onClose()
        }
    }, [closeOnEscape, onClose])

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, handleKeyDown])

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
            onClose()
        }
    }

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    initial="closed"
                    animate="open"
                    exit="closed"
                    variants={backdropVariants}
                    onClick={handleBackdropClick}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label={ariaLabel || title}
                    aria-describedby={ariaDescribedBy}
                >
                    <motion.div
                        ref={modalRef}
                        variants={modalVariants}
                        className={`
                            w-full ${SIZE_CLASSES[size]}
                            bg-white/95 dark:bg-zinc-900/95 
                            backdrop-blur-xl
                            rounded-2xl shadow-2xl 
                            border border-white/20 dark:border-zinc-700/50
                            overflow-hidden
                            ${className}
                        `}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/50 dark:border-zinc-700/50">
                                <div>
                                    {title && (
                                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                                            {title}
                                        </h2>
                                    )}
                                    {subtitle && (
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                                {showCloseButton && (
                                    <motion.button
                                        type="button"
                                        onClick={onClose}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={SPRING_BOUNCY}
                                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                                        aria-label="Fechar modal"
                                    >
                                        <CloseIcon />
                                    </motion.button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className={`${contentClassName}`}>
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

// ═══════════════════════════════════════════════════════════════════
// MODAL FOOTER COMPONENT
// ═══════════════════════════════════════════════════════════════════

export interface ModalFooterProps {
    children: React.ReactNode
    className?: string
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => (
    <div className={`px-6 py-4 border-t border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-end gap-3 ${className}`}>
        {children}
    </div>
)

// ═══════════════════════════════════════════════════════════════════
// MODAL BODY COMPONENT
// ═══════════════════════════════════════════════════════════════════

export interface ModalBodyProps {
    children: React.ReactNode
    className?: string
    scrollable?: boolean
    maxHeight?: string
}

export const ModalBody: React.FC<ModalBodyProps> = ({
    children,
    className = '',
    scrollable = true,
    maxHeight = 'max-h-[60vh]',
}) => (
    <div className={`px-6 py-4 ${scrollable ? `${maxHeight} overflow-y-auto` : ''} ${className}`}>
        {children}
    </div>
)

export default BaseModal
