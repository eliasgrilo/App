// ═══════════════════════════════════════════════════════════════════
// RecipeCategoryModal — iOS-style category management modal
// Refactored: 346 → ~110 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useScrollLock } from '../../hooks/useScrollLock'
import { RecipeCategoryModalProps, getCategoryName, normalizeCategory, MobileColorPicker, DesktopColorPicker, DeleteConfirmation, CategoryInput } from './recipeCategoryModules'

export const RecipeCategoryModal = ({ categories, onClose, onUpdate, onRenameCategory }: RecipeCategoryModalProps): React.ReactElement => {
    const [newName, setNewName] = useState(''); const [editingId, setEditingId] = useState<string | null>(null); const [editValue, setEditValue] = useState('')
    const [confirmDelete, setConfirmDelete] = useState<CategoryInput | null>(null); const [colorPicker, setColorPicker] = useState<string | null>(null); const [isDragging, setIsDragging] = useState(false)
    const modalRef = useRef(null); useScrollLock(true)

    const handleAdd = () => { const name = newName.trim(); if (!name) return; if (categories.some(c => getCategoryName(c) === name)) return; onUpdate([...categories.map(normalizeCategory), { name, color: '#007AFF' }]); setNewName('') }
    const handleRename = (oldCat: CategoryInput) => { const trimmed = editValue.trim(); const oldName = getCategoryName(oldCat); if (!trimmed || trimmed === oldName) { setEditingId(null); return }; if (categories.some(c => getCategoryName(c) === trimmed)) { setEditingId(null); return }; onRenameCategory(oldName, trimmed); onUpdate(categories.map(c => { const n = normalizeCategory(c); if (n.name === oldName) return { ...n, name: trimmed }; return n })); setEditingId(null) }
    const handleColorChange = (cat: CategoryInput, color: string) => { const catName = getCategoryName(cat); onUpdate(categories.map(c => { const n = normalizeCategory(c); if (n.name === catName) return { ...n, color }; return n })); setColorPicker(null) }
    const handleDelete = (cat: CategoryInput) => { const catName = getCategoryName(cat); onUpdate(categories.map(normalizeCategory).filter(c => getCategoryName(c) !== catName)); onRenameCategory(catName, 'Outros'); setConfirmDelete(null) }
    const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => { setIsDragging(false); if (info.offset.y > 100 || info.velocity.y > 500) onClose() }

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-stretch md:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl" onClick={onClose} />
            <motion.div ref={modalRef} initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                drag={window.innerWidth >= 768 ? "y" : false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.7 }} onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}
                className="relative w-full h-full md:h-auto md:max-w-md md:max-h-[80vh] bg-white dark:bg-zinc-900 md:bg-white/95 md:dark:bg-zinc-900/95 md:backdrop-blur-2xl md:rounded-[24px] shadow-[0_-10px_60px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col"
                style={{ paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 60px), 60px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing md:hidden touch-manipulation">
                    <motion.div className="w-9 h-[5px] rounded-full bg-zinc-300 dark:bg-zinc-600" animate={{ scale: isDragging ? 1.1 : 1, backgroundColor: isDragging ? '#007AFF' : undefined }} transition={{ duration: 0.15 }} />
                </div>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-4 md:pt-6 pb-4 shrink-0">
                    <div className="flex-1"><h3 className="text-[22px] font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">Categorias</h3><p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Organize suas receitas</p></div>
                    <button onClick={onClose} className="w-12 h-12 -mr-2 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90 touch-manipulation"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                {/* Add Category */}
                <div className="px-6 pb-5 shrink-0">
                    <div className="flex gap-3">
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} className="flex-1 h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 text-[16px] text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all placeholder:text-zinc-400" placeholder="Nova categoria..." />
                        <button onClick={handleAdd} disabled={!newName.trim()} className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-40 touch-manipulation shadow-lg shadow-blue-500/25"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></button>
                    </div>
                </div>
                <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 mx-6" />
                {/* Categories List */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                    {categories.length === 0 ? (
                        <div className="text-center py-12"><div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg></div><p className="text-[15px] font-medium text-zinc-400">Nenhuma categoria ainda</p></div>
                    ) : (
                        <div className="space-y-2">{categories.map((cat: CategoryInput, idx: number) => {
                            const { name, color } = normalizeCategory(cat); const catId = name + idx; return (
                                <div key={catId} className="group relative">
                                    <div className="flex items-center gap-3 py-3 px-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                        <button onClick={() => setColorPicker(colorPicker === catId ? null : catId)} className="w-12 h-12 rounded-xl flex items-center justify-center touch-manipulation hover:bg-white dark:hover:bg-zinc-700 transition-colors active:scale-95"><div className="w-7 h-7 rounded-full shadow-sm transition-transform hover:scale-110" style={{ backgroundColor: color }} /></button>
                                        <div className="flex-1 min-w-0">{editingId === catId ? <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => handleRename(cat)} onKeyDown={e => { if (e.key === 'Enter') handleRename(cat); if (e.key === 'Escape') setEditingId(null) }} className="w-full h-10 px-3 -ml-3 bg-white dark:bg-zinc-700 rounded-lg outline-none text-[16px] font-semibold text-zinc-900 dark:text-white ring-2 ring-blue-500" /> : <button onClick={() => { setEditingId(catId); setEditValue(name) }} className="text-left w-full py-2 text-[16px] font-semibold text-zinc-900 dark:text-white truncate touch-manipulation">{name}</button>}</div>
                                        <button onClick={() => setConfirmDelete(cat)} className="w-12 h-12 flex items-center justify-center rounded-xl text-zinc-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-95 touch-manipulation"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                    <AnimatePresence>{colorPicker === catId && (<><MobileColorPicker color={color} cat={cat} onColorChange={handleColorChange} onClose={() => setColorPicker(null)} /><DesktopColorPicker color={color} cat={cat} onColorChange={handleColorChange} onClose={() => setColorPicker(null)} /></>)}</AnimatePresence>
                                </div>
                            )
                        })}</div>
                    )}
                </div>
                <AnimatePresence>{confirmDelete && <DeleteConfirmation cat={confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}</AnimatePresence>
            </motion.div>
        </div>,
        document.body
    )
}

export default RecipeCategoryModal
