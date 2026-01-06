// ═══════════════════════════════════════════════════════════════════
// RECIPE CATEGORY MODAL MODULES — Delete Confirmation Component
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { getCategoryName } from './types'

interface DeleteConfirmProps { cat: any; onConfirm: (cat: any) => void; onCancel: () => void }

export const DeleteConfirmation: React.FC<DeleteConfirmProps> = ({ cat, onConfirm, onCancel }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-[280px] bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl rounded-[20px] overflow-hidden shadow-2xl">
            <div className="p-6 text-center">
                <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <h4 className="text-[17px] font-bold text-zinc-900 dark:text-white mb-2">Excluir Categoria?</h4>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">"{getCategoryName(cat)}" será removida. Receitas serão movidas para "Outros".</p>
            </div>
            <div className="border-t border-zinc-200/80 dark:border-zinc-700">
                <button onClick={onCancel} className="w-full h-12 text-[17px] font-normal text-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors touch-manipulation">Cancelar</button>
            </div>
            <div className="border-t border-zinc-200/80 dark:border-zinc-700">
                <button onClick={() => onConfirm(cat)} className="w-full h-12 text-[17px] font-semibold text-rose-500 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors touch-manipulation">Excluir</button>
            </div>
        </motion.div>
    </motion.div>
)
