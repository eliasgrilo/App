import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import AppleConfirmModal from '../components/AppleConfirmModal'

/**
 * ═══════════════════════════════════════════════════════════════════
 * MODAL CONTEXT — Centralized Confirm Modal State
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ TYPES ═══
interface ConfirmOptions {
    title?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    isDangerous?: boolean
    onConfirm?: () => void
    onCancel?: () => void
}

interface ConfirmState {
    title: string
    message: string
    confirmLabel: string
    cancelLabel: string
    isDangerous: boolean
    onConfirm: () => void
    onCancel: () => void
}

interface ModalAPI {
    confirm: (options: ConfirmOptions | string) => void
    close: () => void
}

interface ModalProviderProps {
    children: ReactNode
}

const ModalContext = createContext<ModalAPI | null>(null)

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

    const confirm = useCallback((options: ConfirmOptions | string): void => {
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

        setConfirmState({
            title,
            message,
            confirmLabel,
            cancelLabel,
            isDangerous,
            onConfirm: () => {
                onConfirm?.()
                setConfirmState(null)
            },
            onCancel: () => {
                onCancel?.()
                setConfirmState(null)
            }
        })
    }, [])

    const close = useCallback((): void => {
        setConfirmState(null)
    }, [])

    const modal = useMemo((): ModalAPI => ({
        confirm,
        close
    }), [confirm, close])

    return (
        <ModalContext.Provider value={modal}>
            {children}
            <AppleConfirmModal
                isOpen={!!confirmState}
                title={confirmState?.title || ''}
                message={confirmState?.message || ''}
                confirmLabel={confirmState?.confirmLabel}
                cancelLabel={confirmState?.cancelLabel}
                isDangerous={confirmState?.isDangerous}
                onConfirm={confirmState?.onConfirm}
                onCancel={confirmState?.onCancel}
            />
        </ModalContext.Provider>
    )
}

export const useModal = (): { modal: ModalAPI } => {
    const context = useContext(ModalContext)
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider')
    }
    return { modal: context }
}

export default ModalProvider
