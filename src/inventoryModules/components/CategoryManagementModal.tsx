// ═══════════════════════════════════════════════════════════════════
// CATEGORY MANAGEMENT MODAL — Premium Responsive Design
// Refactored: 219 → ~55 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import { CategoryManagementModalProps, CategoryList, AddCategoryForm, SubcategorySection } from './categoryModules'

export function CategoryManagementModal({ isOpen, onClose, categories, subcategories, onAddCategory, onRemoveCategory, onAddSubcategory, onRemoveSubcategory }: CategoryManagementModalProps): React.ReactElement | null {
    const [newCategoryName, setNewCategoryName] = useState(''); const [newSubcategoryName, setNewSubcategoryName] = useState(''); const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const handleAddCategory = () => { if (newCategoryName.trim()) { onAddCategory(newCategoryName.trim()); setNewCategoryName('') } }
    const handleAddSubcategory = () => { if (selectedCategory && newSubcategoryName.trim()) { onAddSubcategory(selectedCategory, newSubcategoryName.trim()); setNewSubcategoryName('') } }
    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[20000] flex items-end md:items-center justify-center">
                <ModalScrollLock />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xl" onClick={onClose} />
                <motion.div initial={{ opacity: 0, y: 100, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 32 }} className="relative w-full md:max-w-lg md:mx-4 bg-white dark:bg-zinc-900 rounded-t-[2rem] md:rounded-[2rem] shadow-2xl max-h-[85vh] md:max-h-[80vh] flex flex-col overflow-hidden" style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15), 0 32px 80px rgba(0,0,0,0.25)' }}>
                    <div className="md:hidden w-full flex justify-center pt-3 pb-2"><div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" /></div>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 md:px-6 py-4 md:pt-6 border-b border-zinc-100/80 dark:border-zinc-800">
                        <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Gerenciar Categorias</h3>
                        <button onClick={onClose} className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900"><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                    </div>
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4 md:py-6 space-y-6">
                        <CategoryList categories={categories} onRemove={onRemoveCategory} />
                        <AddCategoryForm value={newCategoryName} onChange={setNewCategoryName} onAdd={handleAddCategory} />
                        <SubcategorySection categories={categories} selected={selectedCategory} setSelected={setSelectedCategory} subcategories={subcategories} newName={newSubcategoryName} setNewName={setNewSubcategoryName} onAdd={handleAddSubcategory} onRemove={onRemoveSubcategory} />
                    </div>
                    {/* Footer */}
                    <div className="px-5 md:px-6 py-4 border-t border-zinc-100 dark:border-zinc-800"><button onClick={onClose} className="w-full h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-sm uppercase tracking-wider">Concluído</button></div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

export default CategoryManagementModal
