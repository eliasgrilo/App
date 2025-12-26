import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { FirebaseService } from './services/firebaseService'
import { Reorder, motion, AnimatePresence, useDragControls } from 'framer-motion'
import { compressImage } from './services/imageUtils'

/**
 * Recipes - Ultra-Premium Editorial Design v2.0
 * "The details are not the details. They make the design." - Charles Eames
 */

// --- LOCAL TOAST HOOK ---
const useLocalToast = () => {
    const [toastMessage, setToastMessage] = useState(null)
    const timeoutRef = useRef(null)

    const showToast = useCallback((message, type = 'error') => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setToastMessage({ message, type })
        timeoutRef.current = setTimeout(() => setToastMessage(null), 3500)
    }, [])

    const toast = useMemo(() => ({
        error: (msg) => showToast(msg, 'error'),
        success: (msg) => showToast(msg, 'success'),
        info: (msg) => showToast(msg, 'info'),
    }), [showToast])

    const ToastUI = toastMessage ? createPortal(
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[20000] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${toastMessage.type === 'error' ? 'bg-rose-500/90 border-rose-400/20 text-white' :
                toastMessage.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/20 text-white' :
                    'bg-zinc-900/90 border-white/10 text-white'
                }`}
        >
            <div className={`w-2 h-2 rounded-full ${toastMessage.type === 'error' ? 'bg-white animate-pulse' :
                toastMessage.type === 'success' ? 'bg-white' :
                    'bg-indigo-400'
                }`} />
            <span className="text-sm font-semibold tracking-tight">{toastMessage.message}</span>
        </motion.div>,
        document.body
    ) : null

    return { toast, ToastUI }
}

// --- UTILS & ICONS ---
const Icons = {
    Camera: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Close: (props) => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    Plus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Back: (props) => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>,
    Trash: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Clock: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Bars: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>,
    Book: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    Check: () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
}

// --- SUB-COMPONENTS ---

const ImageLightbox = ({ src, onClose, layoutId }) => createPortal(
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-4"
    >
        <button
            onClick={onClose}
            className="absolute top-8 right-8 z-50 p-4 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md border border-white/5 hover:border-white/20 active:scale-95 group"
        >
            <Icons.Close className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
        </button>
        <motion.img
            layoutId={layoutId}
            src={src}
            className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            transition={{ type: "spring", stiffness: 250, damping: 35 }}
        />
    </motion.div>,
    document.body
)

const SectionWrapper = ({ id, children }) => {
    const controls = useDragControls()
    return (
        <Reorder.Item value={id} dragListener={false} dragControls={controls} className="relative bg-white dark:bg-black">
            {children(controls)}
        </Reorder.Item>
    )
}

const RecipeCategoryModal = ({ categories, onClose, onUpdate, onRenameCategory }) => {
    const [newName, setNewName] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editValue, setEditValue] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [colorPicker, setColorPicker] = useState(null)

    // Sophisticated Muted Palette
    const colorPalette = [
        '#E63946', // Soft Red
        '#F4A261', // Terracotta
        '#E9C46A', // Honey
        '#2A9D8F', // Teal
        '#457B9D', // Steel Blue
        '#264653', // Deep Slate
        '#6D597A', // Dusty Purple
        '#B5838D', // Mauve
        '#7F9183', // Sage
        '#3D405B', // Charcoal
    ]

    // Normalize category to object format
    const normalizeCategory = (cat) => {
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

    const handleRename = (oldCat) => {
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

    const handleColorChange = (cat, color) => {
        const catName = getCategoryName(cat)
        onUpdate(categories.map(c => {
            const n = normalizeCategory(c)
            if (n.name === catName) return { ...n, color }
            return n
        }))
        setColorPicker(null)
    }

    const handleDelete = (cat) => {
        const catName = getCategoryName(cat)
        onUpdate(categories.filter(c => getCategoryName(c) !== catName))
        onRenameCategory(catName, 'Outros')
        setConfirmDelete(null)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/5 dark:bg-white/5 backdrop-blur-lg"
                onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] p-6 pb-8 md:p-8 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
                {/* Header - Inventory Style */}
                <div className="flex items-center justify-between mb-8 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Gerenciar Categorias</h3>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">Organize sua biblioteca de receitas</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors touch-manipulation"
                    >
                        <Icons.Close className="w-5 h-5" />
                    </button>
                </div>

                {/* Add New Category - Inventory Style */}
                <div className="mb-8 shrink-0">
                    <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">Adicionar Nova Categoria</h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            className="flex-1 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-indigo-400/50"
                            placeholder="Nome da categoria"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newName.trim()}
                            className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                        >
                            <Icons.Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Categories List - Inventory Style + Color Picker */}
                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 sticky top-0 bg-white dark:bg-zinc-900 py-2 z-10">Suas Categorias</h4>
                    {categories.map((cat, idx) => {
                        const { name, color } = normalizeCategory(cat)
                        const catId = name + idx

                        return (
                            <div key={catId} className="group flex items-center justify-between py-3 px-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/20 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Color Dot */}
                                    <button
                                        onClick={() => setColorPicker(colorPicker === catId ? null : catId)}
                                        className="w-4 h-4 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-transparent hover:ring-indigo-300 transition-all shadow-sm"
                                        style={{ backgroundColor: color }}
                                    />

                                    {/* Color Picker Dropdown */}
                                    {colorPicker === catId && (
                                        <div className="absolute left-12 mt-10 z-50 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-3 grid grid-cols-6 gap-2 border border-zinc-200 dark:border-zinc-700 animate-slide-up">
                                            {colorPalette.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => handleColorChange(cat, c)}
                                                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-zinc-400' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        {editingId === catId ? (
                                            <input
                                                autoFocus
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                onBlur={() => handleRename(cat)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleRename(cat)
                                                    if (e.key === 'Escape') setEditingId(null)
                                                }}
                                                className="w-full bg-transparent outline-none text-sm font-bold text-zinc-900 dark:text-white"
                                            />
                                        ) : (
                                            <span
                                                onClick={() => { setEditingId(catId); setEditValue(name) }}
                                                className="text-sm font-medium text-indigo-900 dark:text-indigo-200 cursor-text truncate block select-none"
                                            >
                                                {name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Delete */}
                                <button
                                    onClick={() => setConfirmDelete(cat)}
                                    className="p-3 rounded-lg text-indigo-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 touch-manipulation"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Delete Confirmation Overlay - Inventory Style */}
                <AnimatePresence>
                    {confirmDelete && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md z-50 flex items-center justify-center p-6"
                        >
                            <div className="text-center w-full">
                                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4 shadow-sm">
                                    <Icons.Trash className="w-8 h-8" />
                                </div>
                                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Excluir Categoria?</h4>
                                <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                                    A categoria <span className="font-bold text-zinc-800 dark:text-zinc-200">"{getCategoryName(confirmDelete)}"</span> será removida.<br />As receitas serão movidas para "Outros".
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setConfirmDelete(null)}
                                        className="py-3 text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(confirmDelete)}
                                        className="py-3 text-xs font-bold uppercase tracking-wider text-white bg-rose-500 rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

const IngredientItem = React.memo(({ item, onUpdate, onDelete, onNext, isEditing }) => {
    const dragControls = useDragControls()
    const [checked, setChecked] = useState(false)

    return (
        <Reorder.Item
            value={item}
            dragListener={isEditing}
            dragControls={dragControls}
            className={`group relative mb-2 transition-all duration-300 ease-out ${!isEditing ? 'cursor-pointer' : ''}`}
            onClick={() => !isEditing && setChecked(!checked)}
        >
            <div className={`flex items-center gap-2 md:gap-3 py-3 px-1 rounded-xl transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${isEditing ? 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30' : checked ? 'opacity-50' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/10'}`}>
                {/* Drag Handle - Ultra Subtle (Edit Only) */}
                {isEditing && (
                    <div
                        className="cursor-grab active:cursor-grabbing text-zinc-300 dark:text-zinc-700 hover:text-zinc-400 dark:hover:text-zinc-600 transition-colors duration-150"
                        onPointerDown={(e) => dragControls.start(e)}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                            <circle cx="4" cy="4" r="1.5" />
                            <circle cx="4" cy="12" r="1.5" />
                            <circle cx="12" cy="4" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                        </svg>
                    </div>
                )}

                {/* Checkbox for Read Mode */}
                {!isEditing && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 dark:border-zinc-700'}`}>
                        {checked && <Icons.Check className="w-3 h-3 text-white" />}
                    </div>
                )}

                {/* Name Input/Text */}
                {isEditing ? (
                    <input
                        id={`ing-name-${item.id}`}
                        type="text"
                        value={item.name}
                        onChange={e => onUpdate({ ...item, name: e.target.value })}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                const qtyField = document.getElementById(`ing-qty-${item.id}`)
                                if (qtyField) qtyField.focus()
                            }
                        }}
                        className="flex-1 bg-transparent outline-none font-medium text-[15px] leading-[1.4] tracking-[-0.011em] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-colors duration-150 min-w-0"
                        placeholder="Ingrediente"
                        onBlur={() => {
                            if (!item.name.trim() && !item.quantity.trim()) onDelete()
                        }}
                    />
                ) : (
                    <span className={`flex-1 font-medium text-[15px] leading-[1.4] tracking-tight text-zinc-800 dark:text-zinc-200 ${checked ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
                        {item.name}
                    </span>
                )}

                {/* Quantity Input/Text */}
                <div className="flex items-center gap-1.5 md:gap-2">
                    {isEditing ? (
                        <>
                            <div className="relative w-12 md:w-24 transition-all duration-300">
                                <input
                                    id={`ing-qty-${item.id}`}
                                    type="text"
                                    inputMode="decimal"
                                    value={item.quantity}
                                    onChange={e => onUpdate({ ...item, quantity: e.target.value })}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            onNext?.()
                                        }
                                    }}
                                    className="w-full text-right bg-transparent outline-none font-semibold text-[15px] text-zinc-900 dark:text-white tabular-nums"
                                    placeholder="0"
                                    onBlur={() => {
                                        if (!item.name.trim() && !item.quantity.trim()) onDelete()
                                    }}
                                />
                            </div>
                            <select
                                value={item.unit}
                                onChange={e => onUpdate({ ...item, unit: e.target.value })}
                                className="bg-transparent text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 outline-none cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors duration-150 appearance-none"
                            >
                                {['g', 'kg', 'ml', 'L', 'un', 'col'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </>
                    ) : (
                        <div className={`font-semibold text-[15px] text-zinc-900 dark:text-white tabular-nums flex items-baseline gap-1 ${checked ? 'opacity-50' : ''}`}>
                            <span>{item.quantity}</span>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">{item.unit}</span>
                        </div>
                    )}

                    {/* Delete Button (Edit Only) */}
                    {isEditing && (
                        <button
                            onClick={onDelete}
                            className="p-3 text-zinc-300 dark:text-zinc-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors duration-150 opacity-100 md:opacity-0 md:group-hover:opacity-100 touch-manipulation"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </Reorder.Item>
    )
})

const InstructionItem = React.memo(({ item, index, onUpdate, onDelete, onNext, isEditing }) => {
    const dragControls = useDragControls()
    const [checked, setChecked] = useState(false)

    return (
        <Reorder.Item
            value={item}
            dragListener={isEditing}
            dragControls={dragControls}
            className={`group relative mb-2 transition-all duration-300 ease-out ${!isEditing ? 'cursor-pointer' : ''}`}
            onClick={() => !isEditing && setChecked(!checked)}
        >
            <div className={`flex gap-3 py-3 px-1 rounded-xl transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${isEditing ? 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30' : checked ? 'opacity-50' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/10'}`}>
                {/* Drag Handle (Edit Only) */}
                {isEditing && (
                    <div
                        className="cursor-grab active:cursor-grabbing text-zinc-300 dark:text-zinc-700 hover:text-zinc-400 dark:hover:text-zinc-600 transition-colors duration-150 mt-1"
                        onPointerDown={(e) => dragControls.start(e)}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                            <circle cx="4" cy="4" r="1.5" />
                            <circle cx="4" cy="12" r="1.5" />
                            <circle cx="12" cy="4" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                        </svg>
                    </div>
                )}

                {/* Step Number / Checkbox */}
                <div className="pt-1 w-5 shrink-0 flex justify-center">
                    {!isEditing && checked ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                            <Icons.Check className="w-3 h-3 text-white" />
                        </div>
                    ) : (
                        <span className={`text-[11px] font-black pt-0.5 select-none font-mono tabular-nums ${checked ? 'text-zinc-300' : 'text-zinc-300 dark:text-zinc-700'}`}>
                            {String(index + 1).padStart(2, '0')}
                        </span>
                    )}
                </div>

                {/* Instruction Text */}
                {isEditing ? (
                    <textarea
                        value={item.text}
                        onChange={e => onUpdate({ ...item, text: e.target.value })}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                onNext?.()
                            }
                        }}
                        className="flex-1 bg-transparent outline-none resize-none text-[15px] font-medium leading-[1.6] tracking-[-0.011em] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 min-w-0 transition-colors duration-150"
                        placeholder="Descreva este passo..."
                        rows={1}
                        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                        onBlur={() => {
                            if (!item.text.trim()) onDelete()
                        }}
                    />
                ) : (
                    <p className={`flex-1 text-[15px] font-medium leading-[1.6] tracking-[-0.011em] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap ${checked ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
                        {item.text}
                    </p>
                )}

                {/* Delete Button (Edit Only) */}
                {isEditing && (
                    <button
                        onClick={onDelete}
                        className="p-3 text-zinc-300 dark:text-zinc-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors duration-150 opacity-100 md:opacity-0 md:group-hover:opacity-100 mt-0.5 touch-manipulation"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>
        </Reorder.Item>
    )
})

// --- MAIN ---

// Helper to get category name (handles both string and object format)
const getCategoryName = (cat) => {
    if (typeof cat === 'string') return cat
    if (cat && typeof cat === 'object' && cat.name) return cat.name
    return 'Outros'
}

// Helper to get category color
const getCategoryColor = (categories, categoryName) => {
    const cat = categories.find(c => getCategoryName(c) === categoryName)
    if (cat && typeof cat === 'object' && cat.color) return cat.color
    return '#007AFF' // Default Apple blue
}

export default function Recipes() {
    const { toast, ToastUI } = useLocalToast()
    const [recipes, setRecipes] = useState([])
    const [categories, setCategories] = useState(['Tradicionais', 'Especiais', 'Veganas', 'Doces'])
    const [selectedId, setSelectedId] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [activeFilter, setActiveFilter] = useState('Todas')
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [zoomedImage, setZoomedImage] = useState(null)
    const [confirmModal, setConfirmModal] = useState(null)
    const [showCatModal, setShowCatModal] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [syncError, setSyncError] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const scrollRef = useRef(null)
    const pendingChangesRef = useRef({}) // ID -> collected changes
    const saveTimeoutsRef = useRef({}) // ID -> timeout handle


    // ULTRA SIMPLE DATA LOADING - GUARANTEED TO WORK
    useEffect(() => {
        let mounted = true

        // Start loading immediately - no forced delay
        const loadData = async () => {
            try {
                const recipeData = await FirebaseService.getRecipesV3()

                if (!mounted) return

                if (Array.isArray(recipeData) && recipeData.length > 0) {
                    setRecipes(recipeData.map(r => {
                        // Migration: Unified Sections
                        let sections = Array.isArray(r.sections) ? r.sections : []
                        if (sections.length === 0 && (Array.isArray(r.ingredientSections) || Array.isArray(r.instructionSections))) {
                            sections = [
                                ...(Array.isArray(r.ingredientSections) ? r.ingredientSections.map(s => ({ ...s, type: 'ingredients' })) : []),
                                ...(Array.isArray(r.instructionSections) ? r.instructionSections.map(s => ({ ...s, type: 'instructions' })) : [])
                            ]
                        }

                        // Sanitization: Remove empty items on load
                        if (sections.length > 0) {
                            sections = sections.map(s => ({
                                ...s,
                                items: Array.isArray(s.items) ? s.items.filter(i => {
                                    if (s.type === 'ingredients') return i.name?.trim() || i.quantity?.trim()
                                    return i.text?.trim()
                                }) : []
                            }))
                        }

                        return {
                            id: String(r.id),
                            name: r.name || 'Sem nome',
                            category: r.category || 'Outros',
                            prepTime: r.prepTime ?? 0,
                            cookTime: r.cookTime ?? 0,
                            temperature: r.temperature ?? 180,
                            image: r.image || null,
                            sections: sections,
                            createdAt: r.createdAt || new Date().toISOString(),
                            updatedAt: r.updatedAt || new Date().toISOString()
                        }
                    }))
                } else {
                    setRecipes([])
                }
            } catch (err) {
                if (mounted) setRecipes([])
            }

            // Load categories separately - don't block on this
            try {
                const catData = await FirebaseService.getRecipeCategories()
                if (mounted && catData && Array.isArray(catData)) {
                    setCategories(catData)
                }
            } catch (err) {
                // Categories load failed, using defaults
            }

            // Complete loading immediately
            if (mounted) {
                setLoading(false)
                setLoadError(null)
            }
        }

        loadData()

        return () => {
            mounted = false
        }
    }, [])


    // Debounced Category Save
    useEffect(() => {
        if (loading) return
        const timer = setTimeout(() => {
            FirebaseService.syncRecipeCategories(categories)
        }, 1000)
        return () => clearTimeout(timer)
    }, [categories, loading])

    // Cumulative Debounced Save with proper cleanup
    const updateRecipe = (id, changes) => {
        const stringId = String(id) // Ensure consistent ID format
        setSyncing(true)
        setSyncError(false)

        // Accumulate changes locally
        setRecipes(prev => prev.map(r =>
            String(r.id) === stringId
                ? { ...r, ...changes, updatedAt: new Date().toISOString() }
                : r
        ))

        // Accumulate changes for the cloud sync
        pendingChangesRef.current[stringId] = {
            ...(pendingChangesRef.current[stringId] || {}),
            ...changes,
            updatedAt: new Date().toISOString()
        }

        // Clear existing timeout using ref (not window)
        if (saveTimeoutsRef.current[stringId]) {
            clearTimeout(saveTimeoutsRef.current[stringId])
        }

        saveTimeoutsRef.current[stringId] = setTimeout(async () => {
            const finalChanges = pendingChangesRef.current[stringId]
            if (!finalChanges) {
                setSyncing(false)
                return
            }

            // Clear buffer BEFORE sync to avoid race condition
            delete pendingChangesRef.current[stringId]
            delete saveTimeoutsRef.current[stringId]

            try {
                const success = await FirebaseService.syncRecipeV3(stringId, finalChanges, true)
                if (!success) {
                    setSyncError(true)
                }
            } catch (err) {
                setSyncError(true)
            } finally {
                // Only set syncing to false if no other pending syncs
                if (Object.keys(pendingChangesRef.current).length === 0) {
                    setSyncing(false)
                }
            }
        }, 1200)
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!selectedId) {
            toast.error('Nenhuma receita selecionada.')
            return
        }

        setIsUploading(true)
        try {
            const r = new FileReader()
            r.onload = async ev => {
                try {
                    const compressed = await compressImage(ev.target.result)
                    updateRecipe(selectedId, { image: compressed })
                } catch (err) {
                    toast.error('Falha ao processar imagem. Tente uma foto menor.')
                } finally {
                    setIsUploading(false)
                }
            }
            r.onerror = () => {
                toast.error('Erro ao ler o arquivo.')
                setIsUploading(false)
            }
            r.readAsDataURL(file)
        } catch (error) {
            toast.error('Erro inesperado ao carregar imagem.')
            setIsUploading(false)
        }
    }


    const handleDeleteRecipe = async (id) => {
        const stringId = String(id)

        setConfirmModal(null)

        // Optimistic update
        setRecipes(prev => prev.filter(r => String(r.id) !== stringId))

        // Close detail view if deleting current
        if (String(selectedId) === stringId) {
            setSelectedId(null)
        }

        try {
            const success = await FirebaseService.deleteRecipeV3(stringId)
            if (!success) {
                throw new Error('Firebase returned false')
            }
        } catch (err) {
            toast.error('Erro ao excluir receita.')
        }
    }

    const filtered = useMemo(() => recipes.filter(r => activeFilter === 'Todas' || r.category === activeFilter), [recipes, activeFilter])
    const selected = useMemo(() => recipes.find(r => String(r.id) === String(selectedId)), [recipes, selectedId])

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Carregando receitas...</p>
            </div>
        </div>
    )

    // Error state with retry option
    if (loadError) return (
        <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-6">
            <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Erro de Conexão</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">{loadError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm uppercase tracking-wide hover:scale-105 active:scale-95 transition-transform"
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
    )

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            {/* Ultra-Subtle Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* --- LIST VIEW --- */}
            <AnimatePresence>
                {!selectedId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="relative z-10"
                    >
                        {/* Header */}
                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Receitas</h1>
                                    <div className={`mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-colors ${syncError
                                        ? 'bg-rose-500/5 border-rose-500/10 text-rose-500/80'
                                        : syncing
                                            ? 'bg-amber-500/5 border-amber-500/10 text-amber-500/80'
                                            : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80'
                                        }`}>
                                        <div className={`w-1 h-1 rounded-full ${syncError ? 'bg-rose-500' : syncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                            {syncError ? 'Erro de Sync' : syncing ? 'Sincronizando' : 'Cloud Active'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Bíblia culinária & fichas de produção</p>
                            </div>
                            <button
                                onClick={() => {
                                    const newId = String(Date.now())
                                    const newR = {
                                        id: newId,
                                        name: 'Nova Criação',
                                        category: 'Tradicionais',
                                        prepTime: 30,
                                        cookTime: 15,
                                        image: null,
                                        sections: [
                                            { id: Date.now(), type: 'ingredients', title: 'BASE', items: [] },
                                            { id: Date.now() + 1, type: 'instructions', title: 'PASSOS', items: [] }
                                        ],
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString()
                                    }
                                    setRecipes([newR, ...recipes])
                                    setSelectedId(newId)
                                    setIsEditing(true) // Start in Edit Mode for new recipes
                                    FirebaseService.syncRecipeV3(newId, newR)
                                }}
                                className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                            >
                                <Icons.Plus />
                                Criar Nova Receita
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="sticky top-4 z-30 mb-8 py-4 overflow-x-auto scrollbar-hidden bg-zinc-50/80 dark:bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-50/50">
                            <div className="flex items-center gap-2 w-max">
                                {['Todas', ...categories].map(cat => (
                                    <button
                                        key={getCategoryName(cat)} onClick={() => setActiveFilter(getCategoryName(cat))}
                                        className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${activeFilter === getCategoryName(cat) ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/50 dark:border-zinc-800'}`}
                                    >
                                        {getCategoryName(cat)}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowCatModal(true)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-200/50 dark:border-zinc-800 text-zinc-400 hover:text-indigo-500 hover:border-indigo-500/50 transition-all bg-white dark:bg-zinc-900 shadow-sm active:scale-90"
                                    title="Gerenciar Biblioteca"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {filtered.map(r => (
                                <motion.div
                                    layoutId={`card-${r.id}`} key={r.id} onClick={() => { setSelectedId(r.id); setIsEditing(false); }}
                                    className="group relative z-20 bg-white dark:bg-zinc-950 rounded-[2rem] p-4 border border-zinc-200/50 dark:border-white/10 md:hover:border-zinc-300 md:dark:hover:border-white/20 transition-all cursor-pointer shadow-xl md:hover:shadow-2xl md:hover:-translate-y-1 active:scale-[0.98] overflow-hidden"
                                >
                                    <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-6 shadow-inner">
                                        {r.image ? (
                                            <motion.img layoutId={`img-${r.id}`} src={r.image} className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-105" />
                                        ) : (
                                            /* Premium List View Placeholder */
                                            <div className="w-full h-full relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-950 dark:to-black"></div>
                                                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent animate-[spin_20s_linear_infinite] opacity-60"></div>
                                                <div className="absolute bottom-[-50%] right-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-500/5 via-transparent to-transparent animate-[spin_25s_linear_infinite_reverse] opacity-60"></div>

                                                {/* Inner Glow Pulse */}
                                                <motion.div
                                                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"
                                                />

                                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 md:group-hover:opacity-80 transition-opacity">
                                                    <div className="w-12 h-12 rounded-full bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center mb-2 shadow-lg md:group-hover:scale-110 transition-transform duration-500">
                                                        <Icons.Camera />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity" />

                                        {/* Apple-style Delete Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setConfirmModal({
                                                    title: 'Excluir Receita',
                                                    message: `Tem certeza que deseja excluir "${r.name}"? Esta ação é irreversível.`,
                                                    type: 'danger',
                                                    onConfirm: () => {
                                                        handleDeleteRecipe(r.id)
                                                    },
                                                    onCancel: () => setConfirmModal(null)
                                                })
                                            }}
                                            className="absolute top-3 right-3 p-2.5 rounded-full bg-black/30 hover:bg-rose-500/90 backdrop-blur-md text-white/90 hover:text-white opacity-0 md:group-hover:opacity-100 transition-all duration-300 transform scale-90 hover:scale-100 hover:shadow-lg z-[100] border border-white/10 active:scale-95 touch-manipulation cursor-pointer"
                                        >
                                            <Icons.Trash className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="px-2 pb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span
                                                className="inline-block px-2.5 py-1 text-[10px] font-medium tracking-wide rounded-lg"
                                                style={{
                                                    backgroundColor: `${getCategoryColor(categories, r.category)}15`,
                                                    color: getCategoryColor(categories, r.category)
                                                }}
                                            >
                                                {r.category}
                                            </span>
                                            <div className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Icons.Clock />
                                                    {r.prepTime + r.cookTime}m
                                                </div>
                                                {r.temperature > 0 && (
                                                    <>
                                                        <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-700" />
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                            </svg>
                                                            {r.temperature}°
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold leading-tight text-zinc-900 dark:text-white md:group-hover:text-indigo-600 md:dark:group-hover:text-indigo-400 transition-colors mb-1">{r.name}</h3>
                                        <p className="text-xs font-medium text-zinc-400">{(r.sections || []).filter(s => s.type === 'ingredients').reduce((acc, s) => acc + (s.items?.length || 0), 0)} ingredientes</p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Empty State */}
                            {filtered.length === 0 && (
                                <div className="col-span-full py-32 text-center rounded-[3rem] border border-zinc-200/50 dark:border-white/5 bg-white/30 dark:bg-white/[0.02] backdrop-blur-sm relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.02] to-transparent" />

                                    <div className="relative z-10">
                                        <div className="w-24 h-24 mx-auto mb-8 relative">
                                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                                            <div className="relative w-full h-full bg-white dark:bg-zinc-900 rounded-full border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shadow-2xl">
                                                <Icons.Book />
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">Expandir a Coleção</h3>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                                            Nenhuma receita encontrada em <span className="text-zinc-900 dark:text-zinc-200 font-bold">{activeFilter}</span>.
                                            Que tal criar algo novo?
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- DETAIL VIEW (EDITOR) --- */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedId && selected && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                            className="fixed inset-0 z-[9999] bg-white dark:bg-black overflow-y-auto"
                            ref={scrollRef}
                        >
                            {/* Fallback check if selected became null during exit */}
                            {selected ? (
                                <>
                                    {/* 1. Minimalist Sticky Header */}
                                    <div className="sticky top-0 left-0 right-0 z-[101] bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center px-4 md:px-6 h-16 transition-all">
                                        <div className="flex-1 flex justify-start">
                                            <button
                                                onClick={() => {
                                                    // Cleanup empty items on exit
                                                    const cleanedSections = (selected.sections || []).map(s => ({
                                                        ...s,
                                                        items: s.items.filter(i => {
                                                            if (s.type === 'ingredients') return i.name?.trim() || i.quantity?.trim()
                                                            return i.text?.trim()
                                                        })
                                                    }))
                                                    updateRecipe(selectedId, { sections: cleanedSections })
                                                    setSelectedId(null)
                                                }}
                                                className="p-3 rounded-2xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-sm group"
                                            >
                                                <Icons.Back className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                                            </button>
                                        </div>

                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${syncError ? 'text-rose-500' : syncing ? 'text-zinc-400' : 'text-zinc-300'}`}>
                                            {syncError ? 'Falha' : syncing ? 'Sincronizando...' : 'Salvo'}
                                        </span>

                                        <div className="flex-1 flex justify-end gap-2">
                                            <button
                                                onClick={() => setIsEditing(!isEditing)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${isEditing
                                                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/30 shadow-lg'
                                                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 hover:text-indigo-500'}`}
                                            >
                                                {isEditing ? 'Concluído' : 'Editar'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setConfirmModal({
                                                        title: 'Excluir Receita',
                                                        message: 'Tem certeza que deseja excluir esta receita permanentemente? Esta ação não pode ser desfeita.',
                                                        type: 'danger',
                                                        onConfirm: () => {
                                                            handleDeleteRecipe(selectedId)
                                                        },
                                                        onCancel: () => setConfirmModal(null)
                                                    })
                                                }}
                                                className="p-3 rounded-2xl text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 active:scale-95 transition-all group"
                                            >
                                                <Icons.Trash className="w-5 h-5 transition-transform group-hover:scale-110" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. Hybrid Layout: Mobile-First Optimized */}
                                    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-40">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-20">

                                            {/* LEFT COLUMN: Image & Stats (Sticky) */}
                                            <div className="md:col-span-5 space-y-6 md:space-y-10 md:sticky md:top-24 h-fit">

                                                {/* Hero Image - Card Style - Responsive Aspect Ratio */}
                                                <div className="relative aspect-video md:aspect-[4/5] rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800 group">
                                                    {selected.image ? (
                                                        <>
                                                            <motion.img
                                                                layoutId={`img-${selectedId}`}
                                                                src={selected.image}
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                onClick={() => setZoomedImage(selected.image)}
                                                            />
                                                            {/* Edit Icon - Top Right */}
                                                            <label className="absolute top-4 right-4 p-3 rounded-full bg-black/30 backdrop-blur-md text-white/90 hover:bg-black/50 hover:text-white transition-all cursor-pointer opacity-100 md:opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-lg border border-white/10">
                                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                                                {isUploading ? (
                                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                ) : (
                                                                    <Icons.Camera className="w-5 h-5" />
                                                                )}
                                                            </label>
                                                        </>
                                                    ) : (
                                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-300 hover:text-zinc-500">
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                                            <Icons.Camera />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest mt-3">Adicionar Capa</span>
                                                        </label>
                                                    )}
                                                </div>

                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-3 gap-3 md:gap-4">
                                                    {[
                                                        { label: 'Preparo', val: 'prepTime', unit: 'min' },
                                                        { label: 'Cozimento', val: 'cookTime', unit: 'min' },
                                                        { label: 'Temperatura', val: 'temperature', unit: '°C' }
                                                    ].map(stat => (
                                                        <div key={stat.label} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-3 md:p-4 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center">
                                                            <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 md:mb-2">{stat.label}</span>
                                                            <div className="flex items-baseline gap-1">
                                                                <input
                                                                    value={selected[stat.val]}
                                                                    onChange={e => updateRecipe(selectedId, { [stat.val]: e.target.value })}
                                                                    className="w-full bg-transparent font-bold text-lg md:text-xl text-center text-zinc-900 dark:text-white outline-none p-0 border-none focus:ring-0 tabular-nums"
                                                                    placeholder="0"
                                                                />
                                                                {stat.unit && <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold">{stat.unit}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                            </div>

                                            {/* RIGHT COLUMN: Form Content */}
                                            <div className="md:col-span-7 space-y-8 md:space-y-12">

                                                {/* Header Section */}
                                                <div className="space-y-4 md:space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <select
                                                            value={selected.category}
                                                            onChange={e => updateRecipe(selectedId, { category: e.target.value })}
                                                            className="appearance-none bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-full text-zinc-600 dark:text-zinc-300 font-bold text-[11px] uppercase tracking-wider outline-none cursor-pointer hover:bg-zinc-200 transition-colors"
                                                        >
                                                            {categories.map(c => <option key={getCategoryName(c)} value={getCategoryName(c)}>{getCategoryName(c)}</option>)}
                                                        </select>
                                                    </div>

                                                    <textarea
                                                        value={selected.name}
                                                        onChange={e => updateRecipe(selectedId, { name: e.target.value })}
                                                        className="w-full bg-transparent text-3xl md:text-6xl font-black text-zinc-900 dark:text-white outline-none resize-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800 leading-[1.1] tracking-tight"
                                                        placeholder="Nome da Receita"
                                                        rows={1}
                                                        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pb-6">
                                                    <button
                                                        disabled={!isEditing}
                                                        onClick={() => updateRecipe(selectedId, { sections: [...(selected.sections || []), { id: Date.now(), type: 'ingredients', title: 'INGREDIENTES', items: [] }] })}
                                                        className={`py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 group ${isEditing ? 'hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}`}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">IN</div>
                                                        + Ingredientes
                                                    </button>
                                                    <button
                                                        disabled={!isEditing}
                                                        onClick={() => updateRecipe(selectedId, { sections: [...(selected.sections || []), { id: Date.now(), type: 'instructions', title: 'PREPARO', items: [] }] })}
                                                        className={`py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 group ${isEditing ? 'hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}`}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">PR</div>
                                                        + Preparo
                                                    </button>
                                                </div>

                                                <Reorder.Group axis="y" values={selected.sections || []} onReorder={newSections => updateRecipe(selectedId, { sections: newSections })} className="space-y-6">
                                                    {(selected.sections || []).map(section => (
                                                        <SectionWrapper key={section.id} id={section}>
                                                            {(dragControls) => (
                                                                <RecipeSection
                                                                    section={section}
                                                                    onUpdate={(updatedSec) => updateRecipe(selectedId, { sections: selected.sections.map(s => s.id === section.id ? updatedSec : s) })}
                                                                    onDelete={() => updateRecipe(selectedId, { sections: selected.sections.filter(s => s.id !== section.id) })}
                                                                    dragControls={dragControls}
                                                                    isEditing={isEditing}
                                                                />
                                                            )}
                                                        </SectionWrapper>
                                                    ))}
                                                </Reorder.Group>

                                                {/* Delete Recipe Button (Apple Standard Footer) */}
                                                <div className="pt-12 pb-8 border-t border-zinc-100 dark:border-zinc-800">
                                                    <button
                                                        onClick={() => setConfirmModal({
                                                            title: 'Excluir Receita',
                                                            message: 'Tem certeza? Esta ação é irreversível.',
                                                            type: 'danger',
                                                            onConfirm: async () => { handleDeleteRecipe(selectedId); },
                                                            onCancel: () => setConfirmModal(null)
                                                        })}
                                                        className="w-full py-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 font-bold text-sm uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors"
                                                    >
                                                        Excluir Receita
                                                    </button>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Cat Modal */}
            {
                showCatModal && (
                    <RecipeCategoryModal
                        key="recipe-cat-modal"
                        categories={categories}
                        onClose={() => setShowCatModal(false)}
                        onUpdate={setCategories}
                        onRenameCategory={(oldName, newName) => {
                            // Update all recipes in this category
                            recipes.filter(r => r.category === oldName).forEach(r => {
                                updateRecipe(r.id, { category: newName })
                            })
                        }}
                    />
                )
            }

            {/* Image Zoom Lightbox */}
            <AnimatePresence>
                {zoomedImage && <ImageLightbox src={zoomedImage} onClose={() => setZoomedImage(null)} layoutId={`img-${selectedId}`} />}
            </AnimatePresence>

            {/* Premium Confirmation Modal - Safe Animated Portal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence mode="wait">
                    {confirmModal && (
                        <motion.div
                            key="confirm-modal-portal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                        >
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                                onClick={confirmModal.onCancel}
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmModal.type === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-zinc-100 text-zinc-600'}`}>
                                    <Icons.Trash />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{confirmModal.title}</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
                                    {confirmModal.message}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={confirmModal.onCancel}
                                        className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmModal.onConfirm}
                                        className={`flex-1 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all ${confirmModal.type === 'danger' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-zinc-900 dark:bg-white dark:text-zinc-900'}`}
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Toast Notifications */}
            {ToastUI}
        </div >
    )
}



function RecipeSection({ section, onUpdate, onDelete, dragControls, isEditing }) {
    if (section.type === 'ingredients') {
        return <IngredientsTable section={section} onUpdate={onUpdate} onDelete={onDelete} dragControls={dragControls} isEditing={isEditing} />
    }
    if (section.type === 'instructions') {
        return <InstructionsTable section={section} onUpdate={onUpdate} onDelete={onDelete} dragControls={dragControls} isEditing={isEditing} />
    }
    return null
}

function IngredientsTable({ section, onUpdate, onDelete, dragControls, isEditing }) {
    return (
        <div className="relative group/section bg-white dark:bg-black rounded-3xl p-4 md:p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6 pl-1">
                <div className="flex items-center gap-3 flex-1">
                    <div
                        className="cursor-grab p-2 -ml-2 text-zinc-300 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors opacity-100 md:opacity-0 md:group-hover/section:opacity-100"
                        onPointerDown={(e) => dragControls.start(e)}
                    >
                        <Icons.Bars className="w-5 h-5" />
                    </div>

                    {/* Badge for Type */}
                    <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                        IN
                    </div>

                    {isEditing ? (
                        <input
                            value={section.title}
                            onChange={e => onUpdate({ ...section, title: e.target.value })}
                            className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider bg-transparent outline-none hover:text-indigo-500 transition-colors flex-1 placeholder:text-zinc-300"
                            placeholder="NOME DA SEÇÃO"
                        />
                    ) : (
                        <span className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex-1">{section.title}</span>
                    )}
                </div>
                {isEditing && (
                    <button
                        onClick={onDelete}
                        className="opacity-100 md:opacity-0 md:group-hover/section:opacity-100 text-zinc-300 hover:text-rose-500 transition-all p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                        <Icons.Trash />
                    </button>
                )}
            </div>

            <div className="divide-y divide-zinc-50 dark:divide-zinc-900/50">
                <Reorder.Group axis="y" values={section.items} onReorder={newItems => isEditing && onUpdate({ ...section, items: newItems })}>
                    {section.items.map(item => (
                        <IngredientItem
                            key={item.id} item={item}
                            onUpdate={u => onUpdate({ ...section, items: section.items.map(i => i.id === item.id ? u : i) })}
                            onDelete={() => onUpdate({ ...section, items: section.items.filter(i => i.id !== item.id) })}
                            onNext={() => {
                                if (!item.name.trim()) return
                                onUpdate({ ...section, items: [...section.items, { id: Date.now(), name: '', quantity: '', unit: 'g' }] })
                            }}
                            isEditing={isEditing}
                        />
                    ))}
                </Reorder.Group>
            </div>

            {isEditing && (
                <button
                    type="button"
                    onClick={() => {
                        const lastItem = section.items[section.items.length - 1]
                        if (lastItem && !lastItem.name.trim()) return
                        const newId = Date.now()
                        const newItem = { id: newId, name: '', quantity: '', unit: 'g' }
                        onUpdate({ ...section, items: [...section.items, newItem] })
                        // Scroll to new field so user can tap it
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                const field = document.getElementById(`ing-name-${newId}`)
                                field?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            })
                        })
                    }}
                    className="mt-6 w-full py-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 active:scale-[0.98] touch-manipulation cursor-pointer select-none"
                >
                    <Icons.Plus /> Adicionar Ingrediente
                </button>
            )}
        </div>
    )
}

function InstructionsTable({ section, onUpdate, onDelete, dragControls, isEditing }) {
    return (
        <div className="relative group/section bg-white dark:bg-black rounded-3xl p-4 md:p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6 pl-1">
                <div className="flex items-center gap-3 flex-1">
                    <div
                        className="cursor-grab p-2 -ml-2 text-zinc-300 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors opacity-100 md:opacity-0 md:group-hover/section:opacity-100"
                        onPointerDown={(e) => dragControls.start(e)}
                    >
                        <Icons.Bars className="w-5 h-5" />
                    </div>

                    {/* Badge for Type */}
                    <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                        PR
                    </div>

                    {isEditing ? (
                        <input
                            value={section.title}
                            onChange={e => onUpdate({ ...section, title: e.target.value })}
                            className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider bg-transparent outline-none hover:text-amber-500 transition-colors flex-1 placeholder:text-zinc-300"
                            placeholder="TÍTULO DA SEÇÃO"
                        />
                    ) : (
                        <span className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex-1">{section.title}</span>
                    )}
                </div>
                {isEditing && (
                    <button
                        onClick={onDelete}
                        className="opacity-100 md:opacity-0 md:group-hover/section:opacity-100 text-zinc-300 hover:text-rose-500 transition-all p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                        <Icons.Trash />
                    </button>
                )}
            </div>

            <Reorder.Group axis="y" values={section.items} onReorder={newItems => isEditing && onUpdate({ ...section, items: newItems })} className="space-y-3">
                {section.items.map((item, idx) => (
                    <InstructionItem
                        key={item.id} item={item} index={idx}
                        onUpdate={u => onUpdate({ ...section, items: section.items.map(i => i.id === item.id ? u : i) })}
                        onDelete={() => onUpdate({ ...section, items: section.items.filter(i => i.id !== item.id) })}
                        onNext={() => {
                            if (!item.text.trim()) return
                            onUpdate({ ...section, items: [...section.items, { id: Date.now(), text: '' }] })
                        }}
                        isEditing={isEditing}
                    />
                ))}
            </Reorder.Group>

            {isEditing && (
                <button
                    type="button"
                    onClick={() => {
                        const lastItem = section.items[section.items.length - 1]
                        if (lastItem && !lastItem.text.trim()) return
                        const newId = Date.now()
                        onUpdate({ ...section, items: [...section.items, { id: newId, text: '' }] })
                        // Scroll to new field so user can tap it
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                const fields = document.querySelectorAll('textarea')
                                const lastField = fields[fields.length - 1]
                                lastField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            })
                        })
                    }}
                    className="mt-6 w-full py-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 active:scale-[0.98] touch-manipulation cursor-pointer select-none"
                >
                    <Icons.Plus /> Adicionar Passo
                </button>
            )}
        </div>
    )
}
