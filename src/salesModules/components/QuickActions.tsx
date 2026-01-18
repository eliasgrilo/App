/**
 * ═══════════════════════════════════════════════════════════════════
 * QUICK ACTIONS — Floating Action Buttons (Refined)
 * Premium glassmorphism FAB with ring glow
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface QuickActionsProps {
    onNewOrder: () => void
    onExport?: () => void
}

export function QuickActions({ onNewOrder, onExport }: QuickActionsProps) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Secondary actions */}
            <AnimatePresence>
                {expanded && onExport && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                        onClick={() => { onExport(); setExpanded(false) }}
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-white/60 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-200"
                    >
                        <span className="text-lg">↗</span>
                        Exportar
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Main FAB */}
            <div className="relative">
                {/* Outer glow ring */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-blue-500"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Second glow ring */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-blue-400"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />

                <motion.button
                    onClick={() => {
                        if (expanded) {
                            onNewOrder()
                            setExpanded(false)
                        } else {
                            setExpanded(true)
                        }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-2xl shadow-blue-500/40 flex items-center justify-center border border-blue-400/30"
                >
                    {/* Inner highlight */}
                    <div className="absolute top-1 left-1/4 w-1/2 h-1/4 bg-white/20 rounded-full blur-sm" />

                    <motion.span
                        className="relative z-10 text-3xl font-light"
                        animate={{ rotate: expanded ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        +
                    </motion.span>
                </motion.button>
            </div>
        </div>
    )
}

export default QuickActions
