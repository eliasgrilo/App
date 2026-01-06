/**
 * ═══════════════════════════════════════════════════════════════════
 * CATEGORY MANAGEMENT MODAL — Premium Responsive Design
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface CategoryManagementModalProps {
    isOpen: boolean
    onClose: () => void
    categories: string[]
    subcategories: Record<string, string[]>
    onAddCategory: (name: string) => void
    onRemoveCategory: (name: string) => void
    onAddSubcategory: (category: string, name: string) => void
    onRemoveSubcategory: (category: string, name: string) => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function CategoryManagementModal({
    isOpen,
    onClose,
    categories,
    subcategories,
    onAddCategory,
    onRemoveCategory,
    onAddSubcategory,
    onRemoveSubcategory
}: CategoryManagementModalProps): React.ReactElement | null {
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newSubcategoryName, setNewSubcategoryName] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            onAddCategory(newCategoryName.trim())
            setNewCategoryName('')
        }
    }

    const handleAddSubcategory = () => {
        if (selectedCategory && newSubcategoryName.trim()) {
            onAddSubcategory(selectedCategory, newSubcategoryName.trim())
            setNewSubcategoryName('')
        }
    }

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[20000] flex items-end md:items-center justify-center"
            >
                <ModalScrollLock />
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xl"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="relative w-full md:max-w-lg md:mx-4 bg-white dark:bg-zinc-900 rounded-t-[2rem] md:rounded-[2rem] shadow-2xl max-h-[85vh] md:max-h-[80vh] flex flex-col overflow-hidden"
                    style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15), 0 32px 80px rgba(0,0,0,0.25)' }}
                >
                    {/* Drag Handle */}
                    <div className="md:hidden w-full flex justify-center pt-3 pb-2">
                        <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 md:px-6 py-4 md:pt-6 border-b border-zinc-100/80 dark:border-zinc-800">
                        <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Gerenciar Categorias</h3>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4 md:py-6 space-y-6">
                        {/* Categories */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">Categorias Principais</h4>
                            <div className="space-y-2">
                                {categories.map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-3 md:py-2.5 px-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                                        <span className="font-medium text-indigo-700 dark:text-indigo-300 text-sm md:text-base">{cat}</span>
                                        <button
                                            onClick={() => onRemoveCategory(cat)}
                                            className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-indigo-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                        >
                                            <svg className="h-5 w-5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Add Category */}
                        <div className="pt-4 border-t border-indigo-100 dark:border-indigo-800/30">
                            <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-3">Adicionar Nova Categoria</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="Nome da categoria"
                                    className="flex-1 h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                />
                                <button
                                    onClick={handleAddCategory}
                                    className="h-12 px-5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </div>

                        {/* Subcategories */}
                        <div className="pt-4 border-t border-violet-100 dark:border-violet-800/30 space-y-3">
                            <h4 className="text-[11px] font-bold text-violet-500 uppercase tracking-widest">Subcategorias</h4>
                            <select
                                value={selectedCategory || ''}
                                onChange={e => setSelectedCategory(e.target.value || null)}
                                className="w-full h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none"
                            >
                                <option value="">Selecione uma categoria</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {selectedCategory && (
                                <>
                                    <div className="space-y-2 mt-4">
                                        {(subcategories[selectedCategory] || []).map((sub, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-violet-50/50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30">
                                                <span className="font-medium text-violet-700 dark:text-violet-300 text-sm">{sub}</span>
                                                <button
                                                    onClick={() => onRemoveSubcategory(selectedCategory, sub)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl text-violet-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        <input
                                            type="text"
                                            value={newSubcategoryName}
                                            onChange={e => setNewSubcategoryName(e.target.value)}
                                            placeholder="Nova subcategoria"
                                            className="flex-1 h-11 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none text-sm"
                                            onKeyDown={e => e.key === 'Enter' && handleAddSubcategory()}
                                        />
                                        <button
                                            onClick={handleAddSubcategory}
                                            className="h-11 px-4 rounded-xl bg-violet-500 text-white font-semibold text-sm hover:bg-violet-600 transition-colors"
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 md:px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            onClick={onClose}
                            className="w-full h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-sm uppercase tracking-wider"
                        >
                            Concluído
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

export default CategoryManagementModal
