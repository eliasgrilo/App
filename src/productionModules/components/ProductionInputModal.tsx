// ═══════════════════════════════════════════════════════════════════
// Production Module — Input Modal Component
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import type { InputModalState } from '../types'

interface ProductionInputModalProps {
    inputModal: InputModalState | null
}

export function ProductionInputModal({ inputModal }: ProductionInputModalProps) {
    if (!inputModal) return null

    return (
        <AnimatePresence>
            {createPortal(
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
                    <ModalScrollLock />
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={inputModal.onCancel} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 text-center tracking-tight">{inputModal.title}</h3>
                        <input autoFocus defaultValue={inputModal.defaultValue}
                            className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-black/20 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white mb-8 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white text-center font-medium placeholder:text-zinc-400"
                            placeholder={inputModal.placeholder}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter') inputModal.onConfirm((e.target as HTMLInputElement).value)
                            }}
                        />
                        <div className="flex gap-3">
                            <button onClick={inputModal.onCancel}
                                className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                const container = (e.target as Element).closest('.relative')
                                const input = container?.querySelector('input') as HTMLInputElement | null
                                if (input) inputModal.onConfirm(input.value)
                            }}
                                className="flex-1 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all">
                                Salvar
                            </button>
                        </div>
                    </motion.div>
                </motion.div>,
                document.body
            )}
        </AnimatePresence>
    )
}
