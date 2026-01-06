/**
 * CreatePizzaModal — Modal for creating new pizza recipes
 */

import React, { Dispatch, SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useScrollLock } from '../../hooks/useScrollLock'

interface CreatePizzaModalProps {
    newPizzaName: string
    setNewPizzaName: Dispatch<SetStateAction<string>>
    setIsCreatingPizza: Dispatch<SetStateAction<boolean>>
    handleCreatePizza: () => void
}

export function CreatePizzaModal({ newPizzaName, setNewPizzaName, setIsCreatingPizza, handleCreatePizza }: CreatePizzaModalProps) {
    useScrollLock(true)

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-start justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl"
                onClick={() => { setIsCreatingPizza(false); setNewPizzaName('') }}
            />

            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                className="relative w-full md:max-w-md bg-white dark:bg-zinc-900 md:bg-white/95 md:dark:bg-zinc-900/95 md:backdrop-blur-2xl md:rounded-[24px] shadow-2xl overflow-hidden mt-16 md:mt-20 mx-4 md:mx-0 rounded-2xl"
                style={{ marginTop: 'max(calc(env(safe-area-inset-top, 0px) + 60px), 60px)' }}
            >
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="w-12"></div>
                    <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-white">Nova Pizza</h3>
                    <button
                        onClick={() => { setIsCreatingPizza(false); setNewPizzaName('') }}
                        className="w-12 h-12 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90 touch-manipulation"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 mx-4" />

                <div className="px-6 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[15px] text-zinc-500 dark:text-zinc-400">Dê um nome para sua nova receita</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <input
                            type="text"
                            className="w-full h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-0 text-[17px] text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            placeholder="Ex: Margherita"
                            value={newPizzaName}
                            onChange={(e) => setNewPizzaName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreatePizza()}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setIsCreatingPizza(false); setNewPizzaName('') }}
                            className="flex-1 h-14 rounded-2xl font-semibold text-[17px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98] touch-manipulation"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreatePizza}
                            disabled={!newPizzaName.trim()}
                            className="flex-[1.5] h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[17px] hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-zinc-900/20 dark:shadow-white/10 touch-manipulation"
                        >
                            Criar
                        </button>
                    </div>
                </div>

                <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
            </motion.div>
        </div>,
        document.body
    )
}

export default CreatePizzaModal
