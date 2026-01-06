// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Email Success Modal Component
// ═══════════════════════════════════════════════════════════════════

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { SentEmail } from '../types'

interface EmailSuccessModalProps {
    isOpen: boolean
    lastSentEmail: SentEmail | null
    onClose: () => void
}

export function EmailSuccessModal({ isOpen, lastSentEmail, onClose }: EmailSuccessModalProps) {
    return (
        <AnimatePresence>
            {isOpen && lastSentEmail && createPortal(
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden text-center p-8"
                        onClick={e => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 25 }}
                            className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                        >
                            <motion.svg
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                                className="w-10 h-10 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </motion.svg>
                        </motion.div>

                        <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl font-bold text-zinc-900 dark:text-white mb-2"
                        >
                            Email Enviado!
                        </motion.h3>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-sm text-zinc-500 dark:text-zinc-400 mb-6"
                        >
                            Cotação enviada para<br />
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{lastSentEmail.supplierName || lastSentEmail.to}</span>
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-2"
                        >
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                            >
                                Continuar
                            </button>
                        </motion.div>
                    </motion.div>
                </motion.div>,
                document.body
            )}
        </AnimatePresence>
    )
}
