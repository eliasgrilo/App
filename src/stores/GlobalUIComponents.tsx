/**
 * ═══════════════════════════════════════════════════════════════════
 * GlobalUIComponents — Modal + Toast Container for App Root
 * Replaces Context Providers with Zustand-powered components
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import AppleConfirmModal from '../components/AppleConfirmModal'
import { ToastContainer } from '../toastModules'
import { useConfirmState, useToasts, useUIStore } from './useUIStore'

export const GlobalUIComponents: React.FC = () => {
    const confirmState = useConfirmState()
    const toasts = useToasts()
    const dismissToast = useUIStore((state) => state.dismissToast)

    return (
        <>
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
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </>
    )
}

export default GlobalUIComponents
