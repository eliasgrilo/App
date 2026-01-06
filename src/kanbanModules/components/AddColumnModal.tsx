/**
 * ═══════════════════════════════════════════════════════════════════
 * AddColumnModal — Modal for adding new column
 * Extracted from Kanban.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface AddColumnModalProps {
    isOpen: boolean
    newColTitle: string
    setNewColTitle: (v: string) => void
    setAddingCol: (v: boolean) => void
    addColumn: () => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function AddColumnModal({ isOpen, newColTitle, setNewColTitle, setAddingCol, addColumn }: AddColumnModalProps) {
    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto p-4" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => { setAddingCol(false); setNewColTitle('') }} />
                <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }} transition={spring.modal} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight">Nova Lista</h3>
                    <input
                        autoFocus
                        value={newColTitle}
                        onChange={e => setNewColTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') { setAddingCol(false); setNewColTitle('') } }}
                        placeholder="Nome da lista..."
                        className="w-full bg-zinc-50 dark:bg-zinc-800 px-4 py-4 rounded-2xl text-zinc-900 dark:text-white font-medium outline-none border border-zinc-200/80 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 mb-6"
                    />
                    <div className="flex gap-3">
                        <button onClick={() => { setAddingCol(false); setNewColTitle('') }} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-[0.98]">Cancelar</button>
                        <button onClick={addColumn} disabled={!newColTitle.trim()} className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">Criar Lista</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

export default AddColumnModal
