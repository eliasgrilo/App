// ═══════════════════════════════════════════════════════════════════
// APPLE CONFIRM MODAL MODULES — Types & Styles
// ═══════════════════════════════════════════════════════════════════

import React from 'react'

export interface AppleConfirmModalProps {
    isOpen?: boolean; title?: string; message?: string; onConfirm?: () => void; onCancel?: () => void
    confirmLabel?: string; cancelLabel?: string; isDangerous?: boolean
}

export const Icons = {
    danger: <svg className="w-8 h-8 text-rose-500 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    question: <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
