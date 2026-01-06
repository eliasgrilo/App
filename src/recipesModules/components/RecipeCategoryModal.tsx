/**
 * RecipeCategoryModal — iOS-style category management modal
 */

import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollLock } from '../../hooks/useScrollLock'

// Helper to get category name
const getCategoryName = (cat: any) => {
    if (typeof cat === 'string') return cat
    return cat?.name || 'Sem categoria'
}

interface RecipeCategoryModalProps {
    categories: any[]
    onClose: () => void
    onUpdate: (categories: any[]) => void
    onRenameCategory: (oldName: string, newName: string) => void
}

export const RecipeCategoryModal = ({ categories, onClose, onUpdate, onRenameCategory }: RecipeCategoryModalProps): React.ReactElement => {
    const [newName, setNewName] = useState('')
    const [editingId, setEditingId] = useState<any>(null)
    const [editValue, setEditValue] = useState('')
    const [confirmDelete, setConfirmDelete] = useState<any>(null)
    const [colorPicker, setColorPicker] = useState<any>(null)
    const [isDragging, setIsDragging] = useState(false)
    const modalRef = useRef(null)

    useScrollLock(true)

    const colorPalette = [
        '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE',
        '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#8E8E93',
    ]

    const normalizeCategory = (cat: any) => {
        if (typeof cat === 'string') return { name: cat, color: '#007AFF' }
        return { name: cat.name || 'Sem nome', color: cat.color || '#007AFF' }
    }

    const handleAdd = () => {
        const name = newName.trim()
        if (!name) return
        const exists = categories.some(c => getCategoryName(c) === name)
        if (exists) return
        onUpdate([...categories, { name, color: '#007AFF' }])
        setNewName('')
    }

    const handleRename = (oldCat: any) => {
        const trimmed = editValue.trim()
        const oldName = getCategoryName(oldCat)
        if (!trimmed || trimmed === oldName) {
            setEditingId(null)
            return
        }
        const exists = categories.some(c => getCategoryName(c) === trimmed)
        if (exists) {
            setEditingId(null)
            return
        }
        onRenameCategory(oldName, trimmed)
        onUpdate(categories.map(c => {
            const n = normalizeCategory(c)
            if (n.name === oldName) return { ...n, name: trimmed }
            return n
        }))
        setEditingId(null)
    }

    const handleColorChange = (cat: any, color: string) => {
        const catName = getCategoryName(cat)
        onUpdate(categories.map(c => {
            const n = normalizeCategory(c)
            if (n.name === catName) return { ...n, color }
            return n
        }))
        setColorPicker(null)
    }

    const handleDelete = (cat: any) => {
        const catName = getCategoryName(cat)
        onUpdate(categories.filter(c => getCategoryName(c) !== catName))
        onRenameCategory(catName, 'Outros')
        setConfirmDelete(null)
    }

    const handleDragEnd = (event: any, info: any) => {
        setIsDragging(false)
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose()
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-stretch md:items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl"
                onClick={onClose}
            />

            <motion.div
                ref={modalRef}
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                drag={window.innerWidth >= 768 ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.7 }}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                className="relative w-full h-full md:h-auto md:max-w-md md:max-h-[80vh] bg-white dark:bg-zinc-900 md:bg-white/95 md:dark:bg-zinc-900/95 md:backdrop-blur-2xl md:rounded-[24px] shadow-[0_-10px_60px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col"
                style={{
                    paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 60px), 60px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)'
                }}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing md:hidden touch-manipulation">
                    <motion.div
                        className="w-9 h-[5px] rounded-full bg-zinc-300 dark:bg-zinc-600"
                        animate={{ scale: isDragging ? 1.1 : 1, backgroundColor: isDragging ? '#007AFF' : undefined }}
                        transition={{ duration: 0.15 }}
                    />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-4 md:pt-6 pb-4 shrink-0">
                    <div className="flex-1">
                        <h3 className="text-[22px] font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">Categorias</h3>
                        <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Organize suas receitas</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 -mr-2 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90 touch-manipulation"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Add Category */}
                <div className="px-6 pb-5 shrink-0">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            className="flex-1 h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 text-[16px] text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all placeholder:text-zinc-400"
                            placeholder="Nova categoria..."
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newName.trim()}
                            className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-40 touch-manipulation shadow-lg shadow-blue-500/25"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 mx-6" />

                {/* Categories List */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                    {categories.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <p className="text-[15px] font-medium text-zinc-400">Nenhuma categoria ainda</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {categories.map((cat: any, idx: number) => {
                                const { name, color } = normalizeCategory(cat)
                                const catId = name + idx

                                return (
                                    <div key={catId} className="group relative">
                                        <div className="flex items-center gap-3 py-3 px-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                            <button
                                                onClick={() => setColorPicker(colorPicker === catId ? null : catId)}
                                                className="w-12 h-12 rounded-xl flex items-center justify-center touch-manipulation hover:bg-white dark:hover:bg-zinc-700 transition-colors active:scale-95"
                                            >
                                                <div className="w-7 h-7 rounded-full shadow-sm transition-transform hover:scale-110" style={{ backgroundColor: color }} />
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                {editingId === catId ? (
                                                    <input
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        onBlur={() => handleRename(cat)}
                                                        onKeyDown={e => { if (e.key === 'Enter') handleRename(cat); if (e.key === 'Escape') setEditingId(null) }}
                                                        className="w-full h-10 px-3 -ml-3 bg-white dark:bg-zinc-700 rounded-lg outline-none text-[16px] font-semibold text-zinc-900 dark:text-white ring-2 ring-blue-500"
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => { setEditingId(catId); setEditValue(name) }}
                                                        className="text-left w-full py-2 text-[16px] font-semibold text-zinc-900 dark:text-white truncate touch-manipulation"
                                                    >
                                                        {name}
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => setConfirmDelete(cat)}
                                                className="w-12 h-12 flex items-center justify-center rounded-xl text-zinc-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-95 touch-manipulation"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Color Picker */}
                                        <AnimatePresence>
                                            {colorPicker === catId && (
                                                <>
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 20 }}
                                                        className="md:hidden fixed inset-x-0 bottom-0 z-[80] bg-white dark:bg-zinc-800 rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.3)] p-6"
                                                        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)' }}
                                                    >
                                                        <div className="flex justify-center mb-4">
                                                            <div className="w-9 h-[5px] rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                                        </div>
                                                        <h4 className="text-[17px] font-bold text-zinc-900 dark:text-white text-center mb-5">Escolha uma Cor</h4>
                                                        <div className="grid grid-cols-5 gap-4 mb-6">
                                                            {colorPalette.map(c => (
                                                                <button
                                                                    key={c}
                                                                    onClick={() => handleColorChange(cat, c)}
                                                                    className={`aspect-square rounded-full transition-all active:scale-90 touch-manipulation ${color === c ? 'ring-[3px] ring-offset-4 ring-offset-white dark:ring-offset-zinc-800 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                                                                    style={{ backgroundColor: c }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => setColorPicker(null)}
                                                            className="w-full h-14 bg-zinc-100 dark:bg-zinc-700 rounded-2xl text-[17px] font-semibold text-zinc-900 dark:text-white active:bg-zinc-200 dark:active:bg-zinc-600 transition-colors touch-manipulation"
                                                        >
                                                            Fechar
                                                        </button>
                                                    </motion.div>
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="md:hidden fixed inset-0 z-[75] bg-black/40"
                                                        onClick={() => setColorPicker(null)}
                                                    />
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                                        className="hidden md:block absolute left-3 top-full mt-2 z-[80] bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-4 border border-zinc-200/80 dark:border-zinc-700"
                                                    >
                                                        <div className="grid grid-cols-5 gap-2">
                                                            {colorPalette.map(c => (
                                                                <button
                                                                    key={c}
                                                                    onClick={() => handleColorChange(cat, c)}
                                                                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 active:scale-95 ${color === c ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-zinc-800' : ''}`}
                                                                    style={{ backgroundColor: c }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation */}
                <AnimatePresence>
                    {confirmDelete && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-full max-w-[280px] bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl rounded-[20px] overflow-hidden shadow-2xl"
                            >
                                <div className="p-6 text-center">
                                    <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4">
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </div>
                                    <h4 className="text-[17px] font-bold text-zinc-900 dark:text-white mb-2">Excluir Categoria?</h4>
                                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        "{getCategoryName(confirmDelete)}" será removida. Receitas serão movidas para "Outros".
                                    </p>
                                </div>
                                <div className="border-t border-zinc-200/80 dark:border-zinc-700">
                                    <button onClick={() => setConfirmDelete(null)} className="w-full h-12 text-[17px] font-normal text-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors touch-manipulation">
                                        Cancelar
                                    </button>
                                </div>
                                <div className="border-t border-zinc-200/80 dark:border-zinc-700">
                                    <button onClick={() => handleDelete(confirmDelete)} className="w-full h-12 text-[17px] font-semibold text-rose-500 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors touch-manipulation">
                                        Excluir
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>,
        document.body
    )
}

export default RecipeCategoryModal
