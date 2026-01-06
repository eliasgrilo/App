// ═══════════════════════════════════════════════════════════════════
// TOAST MODULES — Toast Component
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { ToastData, ToastIcons, getToastStyles, HapticService } from './types'

interface ToastComponentProps { toast: ToastData; onDismiss: (id: number) => void; index: number }

export const Toast: React.FC<ToastComponentProps> = ({ toast, onDismiss, index }) => {
    const styles = getToastStyles(toast.type)
    const [progress, setProgress] = useState(100)
    const x = useMotionValue(0)
    const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0])

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void => {
        if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
            HapticService.light(); onDismiss(toast.id)
        }
    }

    useEffect(() => {
        if (toast.type === 'loading' || toast.duration === 0) return
        const startTime = Date.now(); const duration = toast.duration
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime; const remaining = Math.max(0, ((duration - elapsed) / duration) * 100)
            setProgress(remaining); if (remaining <= 0) { clearInterval(interval); onDismiss(toast.id) }
        }, 50)
        return () => clearInterval(interval)
    }, [toast.id, toast.type, toast.duration, onDismiss])

    return (
        <motion.div layout initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95, x: x.get() > 0 ? 100 : -100 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.5} onDragEnd={handleDragEnd} style={{ x, opacity, zIndex: 100 - index }}
            className={`relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl backdrop-blur-xl border shadow-lg shadow-black/5 ${styles.bg} ${styles.border}`}>
            <div className="flex items-start gap-3 p-4">
                <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>{ToastIcons[toast.type]}</div>
                <div className="flex-1 min-w-0">
                    {toast.title && <p className={`text-sm font-semibold ${styles.text}`}>{toast.title}</p>}
                    <p className={`text-sm ${toast.title ? 'mt-0.5 opacity-80' : 'font-medium'} ${styles.text}`}>{toast.message}</p>
                    {toast.action && <button onClick={() => { toast.action?.onClick?.(); onDismiss(toast.id) }} className="mt-2 text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400">{toast.action.label}</button>}
                </div>
                <button onClick={() => { HapticService.light(); onDismiss(toast.id) }} aria-label="Fechar notificação" className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <svg className={`w-4 h-4 ${styles.text} opacity-50`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {toast.type !== 'loading' && toast.duration > 0 && <motion.div className={`absolute bottom-0 left-0 h-0.5 ${styles.progress}`} initial={{ width: '100%' }} animate={{ width: `${progress}%` }} transition={{ duration: 0.05, ease: 'linear' }} />}
        </motion.div>
    )
}
