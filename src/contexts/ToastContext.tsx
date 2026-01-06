import React, { createContext, useContext, useState, useCallback, useRef, useMemo, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'

/**
 * ═══════════════════════════════════════════════════════════════════
 * APPLE HIG TOAST SYSTEM — Director Class Edition
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ TYPES ═══
type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading'

interface ToastAction {
    label: string
    onClick?: () => void
}

interface ToastData {
    id: number
    message: string
    title?: string
    type: ToastType
    action?: ToastAction
    duration: number
}

interface ToastOptions {
    message?: string
    title?: string
    type?: ToastType
    action?: ToastAction
    duration?: number
}

interface PromiseMessages {
    loading?: string
    success?: string
    error?: string
}

interface ToastAPI {
    show: (options: ToastOptions | string) => number
    dismiss: (id: number) => void
    dismissAll: () => void
    success: (message: string, options?: Partial<ToastOptions>) => number
    error: (message: string, options?: Partial<ToastOptions>) => number
    info: (message: string, options?: Partial<ToastOptions>) => number
    warning: (message: string, options?: Partial<ToastOptions>) => number
    loading: (message: string, options?: Partial<ToastOptions>) => number
    promise: <T>(promise: Promise<T>, messages: PromiseMessages) => Promise<T>
}

interface ToastStyle {
    bg: string
    border: string
    text: string
    icon: string
    progress: string
}

// ═══ HAPTIC SERVICE ═══
const HapticService = {
    light: (): void => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10)
        }
    },
    medium: (): void => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(20)
        }
    },
    success: (): void => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([10, 50, 10])
        }
    },
    error: (): void => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([30, 50, 30, 50, 30])
        }
    }
}

// ═══ TOAST ICONS ═══
const ToastIcons: Record<ToastType, React.ReactElement> = {
    success: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
        </svg>
    ),
    error: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" />
        </svg>
    ),
    info: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 16v-4M12 8h.01" />
        </svg>
    ),
    warning: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" fillOpacity="0.15" d="M12 2L2 20h20L12 2z" />
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 9v4M12 17h.01" />
        </svg>
    ),
    loading: (
        <svg className="w-[18px] h-[18px] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
            <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
        </svg>
    )
}

// ═══ TOAST STYLES ═══
const getToastStyles = (type: ToastType): ToastStyle => {
    const styles: Record<ToastType, ToastStyle> = {
        success: {
            bg: 'bg-emerald-500/95 dark:bg-emerald-600/95',
            border: 'border-emerald-400/20',
            text: 'text-white',
            icon: 'text-white',
            progress: 'bg-white/30'
        },
        error: {
            bg: 'bg-rose-500/95 dark:bg-rose-600/95',
            border: 'border-rose-400/20',
            text: 'text-white',
            icon: 'text-white',
            progress: 'bg-white/30'
        },
        info: {
            bg: 'bg-zinc-900/95 dark:bg-zinc-800/95',
            border: 'border-white/10',
            text: 'text-white',
            icon: 'text-indigo-400',
            progress: 'bg-white/20'
        },
        warning: {
            bg: 'bg-amber-500/95 dark:bg-amber-600/95',
            border: 'border-amber-400/20',
            text: 'text-white',
            icon: 'text-white',
            progress: 'bg-white/30'
        },
        loading: {
            bg: 'bg-zinc-900/95 dark:bg-zinc-800/95',
            border: 'border-white/10',
            text: 'text-white',
            icon: 'text-indigo-400',
            progress: 'bg-indigo-500/50'
        }
    }
    return styles[type] || styles.info
}

// ═══ SINGLE TOAST COMPONENT ═══
interface ToastComponentProps {
    toast: ToastData
    onDismiss: (id: number) => void
    index: number
}

const Toast: React.FC<ToastComponentProps> = ({ toast, onDismiss, index }) => {
    const x = useMotionValue(0)
    const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0])
    const scale = useTransform(x, [-150, 0, 150], [0.8, 1, 0.8])

    const styles = getToastStyles(toast.type)
    const duration = toast.duration || 3500
    const showProgress = toast.type !== 'loading' && duration > 0

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void => {
        if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
            HapticService.light()
            onDismiss(toast.id)
        }
    }

    return (
        <motion.div
            layout
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                    type: 'spring' as const,
                    stiffness: 400,
                    damping: 30,
                    delay: index * 0.05
                }
            }}
            exit={{
                opacity: 0,
                scale: 0.9,
                y: -20,
                transition: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            style={{ x, opacity, scale }}
            className={`
                relative w-full max-w-[calc(100vw-32px)] md:max-w-sm
                px-4 py-3.5 rounded-2xl shadow-2xl
                flex items-center gap-3
                backdrop-blur-xl border
                cursor-grab active:cursor-grabbing
                select-none touch-manipulation
                ${styles.bg} ${styles.border} ${styles.text}
            `}
        >
            {/* Icon */}
            <div className={`shrink-0 ${styles.icon}`}>
                {ToastIcons[toast.type] || ToastIcons.info}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <div className="font-bold text-sm tracking-tight leading-tight">
                        {toast.title}
                    </div>
                )}
                <div className={`text-sm font-medium tracking-tight leading-snug ${toast.title ? 'opacity-90 mt-0.5' : ''}`}>
                    {toast.message}
                </div>
            </div>

            {/* Action Button */}
            {toast.action && (
                <button
                    onClick={() => {
                        toast.action?.onClick?.()
                        onDismiss(toast.id)
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95"
                >
                    {toast.action.label}
                </button>
            )}

            {/* Close Button */}
            <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Fechar notificação"
                className="shrink-0 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 transition-all active:scale-90"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Progress Bar */}
            {showProgress && (
                <motion.div
                    className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-full ${styles.progress}`}
                    initial={{ scaleX: 1, originX: 0 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: duration / 1000, ease: 'linear' }}
                />
            )}
        </motion.div>
    )
}

// ═══ TOAST CONTAINER ═══
interface ToastContainerProps {
    toasts: ToastData[]
    onDismiss: (id: number) => void
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    if (typeof document === 'undefined') return null

    return createPortal(
        <div
            className="fixed z-[99999] flex flex-col items-center gap-2 pointer-events-none"
            style={{
                top: 'max(16px, env(safe-area-inset-top, 16px))',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '400px'
            }}
        >
            <AnimatePresence mode="popLayout">
                {toasts.map((toast, index) => (
                    <div key={toast.id} className="w-full pointer-events-auto">
                        <Toast
                            toast={toast}
                            onDismiss={onDismiss}
                            index={index}
                        />
                    </div>
                ))}
            </AnimatePresence>
        </div>,
        document.body
    )
}

// ═══ TOAST CONTEXT ═══
const ToastContext = createContext<ToastAPI | null>(null)

// ═══ TOAST PROVIDER ═══
interface ToastProviderProps {
    children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([])
    const toastIdRef = useRef(0)
    const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

    const dismiss = useCallback((id: number): void => {
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id])
            delete timersRef.current[id]
        }
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const dismissAll = useCallback((): void => {
        Object.values(timersRef.current).forEach(clearTimeout)
        timersRef.current = {}
        setToasts([])
    }, [])

    const show = useCallback((options: ToastOptions | string): number => {
        const id = ++toastIdRef.current
        const opts: ToastOptions = typeof options === 'string' ? { message: options } : options
        const duration = opts.duration ?? 3500

        // Haptic feedback based on type
        if (opts.type === 'success') HapticService.success()
        else if (opts.type === 'error') HapticService.error()
        else HapticService.light()

        const newToast: ToastData = {
            id,
            message: opts.message || '',
            title: opts.title,
            type: opts.type || 'info',
            action: opts.action,
            duration
        }

        setToasts(prev => {
            // Limit to 3 visible toasts (Apple style)
            const limited = prev.slice(-2)
            return [...limited, newToast]
        })

        // Auto dismiss
        if (duration > 0) {
            timersRef.current[id] = setTimeout(() => dismiss(id), duration)
        }

        return id
    }, [dismiss])

    // Convenience methods
    const toast = useMemo((): ToastAPI => ({
        show,
        dismiss,
        dismissAll,
        success: (message: string, options: Partial<ToastOptions> = {}) => show({ message, type: 'success', ...options }),
        error: (message: string, options: Partial<ToastOptions> = {}) => show({ message, type: 'error', ...options }),
        info: (message: string, options: Partial<ToastOptions> = {}) => show({ message, type: 'info', ...options }),
        warning: (message: string, options: Partial<ToastOptions> = {}) => show({ message, type: 'warning', ...options }),
        loading: (message: string, options: Partial<ToastOptions> = {}) => show({ message, type: 'loading', duration: 0, ...options }),
        promise: async <T,>(promise: Promise<T>, messages: PromiseMessages): Promise<T> => {
            const id = show({ message: messages.loading || 'Carregando...', type: 'loading', duration: 0 })
            try {
                const result = await promise
                dismiss(id)
                show({ message: messages.success || 'Sucesso!', type: 'success' })
                return result
            } catch (error) {
                dismiss(id)
                show({ message: messages.error || 'Erro!', type: 'error' })
                throw error
            }
        }
    }), [show, dismiss, dismissAll])

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    )
}

// ═══ HOOK ═══
export const useToast = (): { toast: ToastAPI } => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return { toast: context }
}

export default ToastProvider
