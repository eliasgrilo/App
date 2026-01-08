// ═══════════════════════════════════════════════════════════════════
// AppleConfirmModal - Apple-style Confirmation Dialog
// Refactored: 176 → ~70 lines
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { MODAL_ANIMATIONS, HapticService } from '../utils/animations'
import { AppleConfirmModalProps, Icons } from '../appleConfirmModalModules'

const AppleConfirmModal: React.FC<AppleConfirmModalProps> = ({ isOpen = false, title = 'Confirmar Ação', message = 'Tem certeza que deseja continuar?', onConfirm, onCancel, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', isDangerous = false }) => {
    const modalRef = useRef<HTMLDivElement>(null)
    useScrollLock(isOpen); useFocusTrap(isOpen, modalRef)

    useEffect(() => { if (isOpen) HapticService.trigger('impact') }, [isOpen])

    const handleConfirm = (): void => { HapticService.trigger('success'); onConfirm?.() }
    const handleCancel = (): void => { HapticService.trigger('selection'); onCancel?.() }

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent): void => { if (e.key === 'Escape') handleCancel(); else if (e.key === 'Enter') handleConfirm() }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onConfirm, onCancel])

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[50000] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={handleCancel}>
                    <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />
                </motion.div>
                <motion.div ref={modalRef} role="alertdialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={MODAL_ANIMATIONS.springGentle}
                    className="relative bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <div className="md:hidden w-full flex justify-center pt-4 pb-2"><div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" /></div>
                    <div className="px-6 py-6 md:px-8 md:py-8">
                        <div className={`w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center ${isDangerous ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-blue-100 dark:bg-blue-500/20'}`}>{isDangerous ? Icons.danger : Icons.question}</div>
                        <h3 id="modal-title" className="text-xl font-bold text-zinc-900 dark:text-white text-center mb-3 tracking-tight">{title}</h3>
                        <p id="modal-description" className="text-sm text-zinc-600 dark:text-zinc-400 text-center leading-relaxed">{message}</p>
                    </div>
                    <div className="border-t border-zinc-200/80 dark:border-white/10">
                        <button onClick={handleConfirm} aria-label={isDangerous ? `${confirmLabel} - ação destrutiva` : confirmLabel}
                            className={`w-full px-6 py-4 text-base font-semibold border-b border-zinc-200/80 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 active:bg-zinc-100 dark:active:bg-white/10 transition-all duration-[250ms] ${isDangerous ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {confirmLabel}
                        </button>
                        <button onClick={handleCancel} aria-label={cancelLabel} className="w-full px-6 py-4 text-base font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 active:bg-zinc-100 dark:active:bg-white/10 transition-all duration-[250ms]">{cancelLabel}</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

export default AppleConfirmModal
