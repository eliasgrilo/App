import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollLock } from '../hooks/useScrollLock'
import { HapticService } from '../services/hapticService'

/**
 * AppleConfirmModal - Apple-style Confirmation Dialog
 * 
 * Features:
 * - Ultra Thin Material blur background (SystemUltraThinMaterial)
 * - Smooth spring animations
 * - Haptic feedback on interactions
 * - Customizable title, message, and button labels
 * - Support for dangerous/destructive actions (red button)
 * - Keyboard support (Enter to confirm, Escape to cancel)
 * - Mobile-friendly with drag handle
 * - Dark mode support
 */

export default function AppleConfirmModal({
    isOpen = false,
    title = 'Confirmar Ação',
    message = 'Tem certeza que deseja continuar?',
    onConfirm,
    onCancel,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    isDangerous = false
}) {
    useScrollLock(isOpen)

    useEffect(() => {
        if (isOpen) {
            HapticService.trigger('impact')
        }
    }, [isOpen])

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCancel()
            } else if (e.key === 'Enter') {
                handleConfirm()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onConfirm, onCancel])

    const handleConfirm = () => {
        HapticService.trigger('success')
        onConfirm?.()
    }

    const handleCancel = () => {
        HapticService.trigger('selection')
        onCancel?.()
    }

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            >
                {/* SystemUltraThinMaterial Blur Background */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                    onClick={handleCancel}
                >
                    <div
                        className="absolute inset-0 bg-black/40 dark:bg-black/60"
                        style={{
                            backdropFilter: 'blur(40px) saturate(1.8)',
                            WebkitBackdropFilter: 'blur(40px) saturate(1.8)'
                        }}
                    />
                </motion.div>

                {/* Modal Card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{
                        type: 'spring',
                        damping: 25,
                        stiffness: 300
                    }}
                    className="relative bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Drag Handle - Mobile */}
                    <div className="md:hidden w-full flex justify-center pt-4 pb-2">
                        <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 md:px-8 md:py-8">
                        {/* Icon Circle */}
                        <div className={`w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center ${isDangerous
                                ? 'bg-rose-100 dark:bg-rose-500/20'
                                : 'bg-blue-100 dark:bg-blue-500/20'
                            }`}>
                            {isDangerous ? (
                                <svg className="w-8 h-8 text-rose-500 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white text-center mb-3 tracking-tight">
                            {title}
                        </h3>

                        {/* Message */}
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center leading-relaxed">
                            {message}
                        </p>
                    </div>

                    {/* Actions - Stacked buttons (iOS style) */}
                    <div className="border-t border-zinc-200 dark:border-white/10">
                        {/* Confirm Button */}
                        <button
                            onClick={handleConfirm}
                            className={`w-full px-6 py-4 text-base font-semibold border-b border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 active:bg-zinc-100 dark:active:bg-white/10 transition-colors ${isDangerous
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`}
                        >
                            {confirmLabel}
                        </button>

                        {/* Cancel Button */}
                        <button
                            onClick={handleCancel}
                            className="w-full px-6 py-4 text-base font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 active:bg-zinc-100 dark:active:bg-white/10 transition-colors"
                        >
                            {cancelLabel}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}
