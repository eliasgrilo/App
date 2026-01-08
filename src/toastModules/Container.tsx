// ═══════════════════════════════════════════════════════════════════
// TOAST MODULES — Container Component
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { ToastData } from './types'
import { Toast } from './Toast'

interface ToastContainerProps { toasts: ToastData[]; onDismiss: (id: number) => void }

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    if (typeof window === 'undefined') return null
    return createPortal(
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60000] w-full max-w-sm px-4 pointer-events-none" role="region" aria-label="Notificações" aria-live="polite">
            <div className="space-y-2 pointer-events-auto">
                <AnimatePresence mode="popLayout">{toasts.map((toast, index) => <Toast key={toast.id} toast={toast} onDismiss={onDismiss} index={index} />)}</AnimatePresence>
            </div>
        </div>,
        document.body
    )
}
