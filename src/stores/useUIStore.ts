import { create } from 'zustand'
import {
    ToastData,
    ToastOptions,
    ToastType,
    PromiseMessages,
    HapticService
} from '../toastModules'

/**
 * ═══════════════════════════════════════════════════════════════════
 * UI STORE — Unified Zustand Store for UI State (Modal + Toast)
 * Migrated from ModalContext and ToastContext
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ MODAL TYPES ═══
export interface ConfirmOptions {
    title?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    isDangerous?: boolean
    onConfirm?: () => void
    onCancel?: () => void
}

export interface ConfirmState {
    title: string
    message: string
    confirmLabel: string
    cancelLabel: string
    isDangerous: boolean
    onConfirm: () => void
    onCancel: () => void
}

// ═══ STATE INTERFACE ═══
interface UIState {
    // Modal
    confirmState: ConfirmState | null
    // Toast
    toasts: ToastData[]
    toastIdCounter: number
}

interface UIActions {
    // Modal
    confirm: (options: ConfirmOptions | string) => void
    closeModal: () => void

    // Toast
    showToast: (options: ToastOptions | string) => number
    dismissToast: (id: number) => void
    dismissAllToasts: () => void
    success: (message: string, options?: Partial<ToastOptions>) => number
    error: (message: string, options?: Partial<ToastOptions>) => number
    info: (message: string, options?: Partial<ToastOptions>) => number
    warning: (message: string, options?: Partial<ToastOptions>) => number
    loading: (message: string, options?: Partial<ToastOptions>) => number
    promise: <T>(promiseToResolve: Promise<T>, messages: PromiseMessages) => Promise<T>
}

type UIStore = UIState & UIActions

// ═══ INITIAL STATE ═══
const initialState: UIState = {
    confirmState: null,
    toasts: [],
    toastIdCounter: 0
}

// ═══ STORE ═══
export const useUIStore = create<UIStore>()((set, get) => ({
    ...initialState,

    // ═══ MODAL ACTIONS ═══
    confirm: (options) => {
        const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options

        const {
            title = 'Confirmar Ação',
            message = 'Tem certeza que deseja continuar?',
            confirmLabel = 'Confirmar',
            cancelLabel = 'Cancelar',
            isDangerous = false,
            onConfirm,
            onCancel
        } = opts

        set({
            confirmState: {
                title,
                message,
                confirmLabel,
                cancelLabel,
                isDangerous,
                onConfirm: () => {
                    onConfirm?.()
                    set({ confirmState: null })
                },
                onCancel: () => {
                    onCancel?.()
                    set({ confirmState: null })
                }
            }
        })
    },

    closeModal: () => {
        set({ confirmState: null })
    },

    // ═══ TOAST ACTIONS ═══
    showToast: (options) => {
        const opts = typeof options === 'string' ? { message: options } : options
        const id = get().toastIdCounter + 1

        const toast: ToastData = {
            id,
            message: opts.message || '',
            title: opts.title,
            type: opts.type || 'info',
            action: opts.action,
            duration: opts.duration ?? 4000
        }

        // Haptic feedback
        const hapticMap: Record<string, () => void> = {
            success: HapticService.success,
            error: HapticService.error,
            loading: HapticService.medium
        }
        const hapticFn = hapticMap[toast.type as string] || HapticService.light
        hapticFn()

        set((state) => ({
            toastIdCounter: id,
            toasts: [toast, ...state.toasts].slice(0, 5)
        }))

        return id
    },

    dismissToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }))
    },

    dismissAllToasts: () => {
        set({ toasts: [] })
    },

    success: (message, options = {}) => {
        return get().showToast({ message, type: 'success', ...options })
    },

    error: (message, options = {}) => {
        return get().showToast({ message, type: 'error', ...options })
    },

    info: (message, options = {}) => {
        return get().showToast({ message, type: 'info', ...options })
    },

    warning: (message, options = {}) => {
        return get().showToast({ message, type: 'warning', ...options })
    },

    loading: (message, options = {}) => {
        return get().showToast({ message, type: 'loading', duration: 0, ...options })
    },

    promise: async <T,>(promiseToResolve: Promise<T>, messages: PromiseMessages): Promise<T> => {
        const { showToast, dismissToast, success, error } = get()
        const id = showToast({
            message: messages.loading || 'Processando...',
            type: 'loading',
            duration: 0
        })

        try {
            const result = await promiseToResolve
            dismissToast(id)
            success(messages.success || 'Sucesso!')
            return result
        } catch (err) {
            dismissToast(id)
            error(messages.error || 'Erro ao processar')
            throw err
        }
    }
}))

// ═══ CONVENIENCE SELECTORS ═══
export const useConfirmState = () => useUIStore((state) => state.confirmState)
export const useToasts = () => useUIStore((state) => state.toasts)

// ═══ MODAL HOOK (backward compatibility with useModal) ═══
export const useModal = () => {
    const confirm = useUIStore((state) => state.confirm)
    const close = useUIStore((state) => state.closeModal)

    return {
        modal: {
            confirm,
            close
        }
    }
}

// ═══ TOAST HOOK (backward compatibility with useToast) ═══
export const useToast = () => {
    const show = useUIStore((state) => state.showToast)
    const dismiss = useUIStore((state) => state.dismissToast)
    const dismissAll = useUIStore((state) => state.dismissAllToasts)
    const success = useUIStore((state) => state.success)
    const error = useUIStore((state) => state.error)
    const info = useUIStore((state) => state.info)
    const warning = useUIStore((state) => state.warning)
    const loading = useUIStore((state) => state.loading)
    const promise = useUIStore((state) => state.promise)

    // Toast object for backward compatibility (const { toast } = useToast(); toast.success())
    const toast = { success, error, info, warning, loading, promise }

    return {
        show,
        dismiss,
        dismissAll,
        success,
        error,
        info,
        warning,
        loading,
        promise,
        toast
    }
}

export default useUIStore
