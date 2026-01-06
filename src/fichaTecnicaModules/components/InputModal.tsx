/**
 * ═══════════════════════════════════════════════════════════════════
 * InputModal — Generic input modal component
 * Extracted from FichaTecnica.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import type { InputModalState } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface InputModalProps {
    modalState: InputModalState | null
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function InputModal({ modalState }: InputModalProps): React.ReactElement | null {
    if (!modalState) return null

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-6"
        >
            <ModalScrollLock />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={modalState.onCancel}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden"
            >
                <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 mx-auto text-zinc-600 dark:text-zinc-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 text-center tracking-tight">{modalState.title}</h3>
                <input
                    autoFocus
                    defaultValue={modalState.defaultValue}
                    className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-black/20 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white mb-8 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white text-center font-medium placeholder:text-zinc-400"
                    placeholder={modalState.placeholder}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                            modalState.onConfirm((e.target as HTMLInputElement).value)
                        }
                    }}
                />
                <div className="flex gap-3">
                    <button
                        onClick={modalState.onCancel}
                        className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            const input = (e.target as HTMLElement).closest('.relative')?.querySelector('input') as HTMLInputElement | null
                            if (input) modalState.onConfirm(input.value)
                        }}
                        className="flex-1 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                    >
                        Salvar
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

export default InputModal
