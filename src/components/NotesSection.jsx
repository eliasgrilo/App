import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * NotesSection - Apple-Quality Product Notes Component
 * Features: Categories, timestamps, Firebase sync
 */

const NOTE_CATEGORIES = [
    { id: 'general', label: 'Geral', icon: '📝', color: 'zinc', bgColor: 'bg-zinc-100 dark:bg-zinc-800' },
    { id: 'quality', label: 'Qualidade', icon: '⭐', color: 'amber', bgColor: 'bg-amber-100 dark:bg-amber-500/20' },
    { id: 'delivery', label: 'Entrega', icon: '🚚', color: 'blue', bgColor: 'bg-blue-100 dark:bg-blue-500/20' },
    { id: 'price', label: 'Preço', icon: '💰', color: 'emerald', bgColor: 'bg-emerald-100 dark:bg-emerald-500/20' }
]

const timeAgo = (d) => {
    if (!d) return ''
    const now = new Date()
    const date = new Date(d)
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}min`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString('pt-BR')
}

// Category Selector
function CategorySelector({ selected, onChange }) {
    return (
        <div className="flex gap-2 flex-wrap">
            {NOTE_CATEGORIES.map(cat => (
                <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onChange(cat.id)}
                    className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${selected === cat.id
                            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                            : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600'
                        }`}
                >
                    {cat.icon} {cat.label}
                </motion.button>
            ))}
        </div>
    )
}

// Note Card
function NoteCard({ note, onDelete, index }) {
    const [showDelete, setShowDelete] = useState(false)
    const category = NOTE_CATEGORIES.find(c => c.id === note.category) || NOTE_CATEGORIES[0]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: index * 0.03 }}
            className="group bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden hover:shadow-md transition-shadow"
            onMouseEnter={() => setShowDelete(true)}
            onMouseLeave={() => setShowDelete(false)}
        >
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-xl ${category.bgColor} flex items-center justify-center text-sm`}>
                            {category.icon}
                        </span>
                        <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                {category.label}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-600 mx-1">•</span>
                            <span className="text-[10px] text-zinc-400">{timeAgo(note.createdAt)}</span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showDelete && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onDelete(note.id)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Content */}
                <p className="text-[14px] text-zinc-700 dark:text-zinc-200 leading-relaxed">
                    {note.text}
                </p>
            </div>

            {/* Footer with author */}
            {note.author && (
                <div className="px-4 py-2 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-400">
                        Adicionado por <span className="font-medium">{note.author}</span>
                    </p>
                </div>
            )}
        </motion.div>
    )
}

// Add Note Form
function AddNoteForm({ onAdd, onCancel }) {
    const [text, setText] = useState('')
    const [category, setCategory] = useState('general')

    const handleSubmit = () => {
        if (!text.trim()) return
        onAdd({ text: text.trim(), category })
        setText('')
        setCategory('general')
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl p-5 space-y-4 border border-zinc-200/50 dark:border-zinc-700/50"
        >
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Escreva sua observação..."
                rows={3}
                className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white resize-none border border-zinc-200 dark:border-zinc-600 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-[14px] placeholder:text-zinc-400"
                autoFocus
            />

            <CategorySelector selected={category} onChange={setCategory} />

            <div className="flex gap-3">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onCancel}
                    className="flex-1 py-3.5 rounded-xl bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-white font-bold"
                >
                    Cancelar
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSubmit}
                    disabled={!text.trim()}
                    className="flex-1 py-3.5 rounded-xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:shadow-none"
                >
                    Adicionar Nota
                </motion.button>
            </div>
        </motion.div>
    )
}

// Main Component
export default function NotesSection({ notes = [], onAdd, onDelete, productId }) {
    const [showAddForm, setShowAddForm] = useState(false)
    const [filterCategory, setFilterCategory] = useState('all')

    const handleAdd = useCallback((noteData) => {
        onAdd?.(productId, {
            ...noteData,
            id: crypto.randomUUID?.() || Date.now().toString(),
            createdAt: new Date().toISOString()
        })
        setShowAddForm(false)
    }, [onAdd, productId])

    const handleDelete = useCallback((noteId) => {
        onDelete?.(productId, noteId)
    }, [onDelete, productId])

    const filteredNotes = filterCategory === 'all'
        ? notes
        : notes.filter(n => n.category === filterCategory)

    const sortedNotes = [...filteredNotes].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    )

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Notas</h3>
                {notes.length > 0 && (
                    <span className="px-3 py-1 bg-violet-100 dark:bg-violet-500/20 rounded-full text-xs font-bold text-violet-600 dark:text-violet-400">
                        {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
                    </span>
                )}
            </div>

            {/* Category Filter (if notes exist) */}
            {notes.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                    <button
                        onClick={() => setFilterCategory('all')}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filterCategory === 'all'
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                    >
                        Todas
                    </button>
                    {NOTE_CATEGORIES.map(cat => {
                        const count = notes.filter(n => n.category === cat.id).length
                        if (count === 0) return null
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setFilterCategory(cat.id)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filterCategory === cat.id
                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                    }`}
                            >
                                {cat.icon} {cat.label} ({count})
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Add Button or Form */}
            <AnimatePresence mode="wait">
                {showAddForm ? (
                    <AddNoteForm
                        key="form"
                        onAdd={handleAdd}
                        onCancel={() => setShowAddForm(false)}
                    />
                ) : (
                    <motion.button
                        key="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setShowAddForm(true)}
                        className="w-full py-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-500 hover:border-violet-400 hover:text-violet-600 transition-all"
                    >
                        + Adicionar Observação
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Notes List */}
            <AnimatePresence mode="popLayout">
                {sortedNotes.length > 0 ? (
                    <div className="space-y-3">
                        {sortedNotes.map((note, i) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onDelete={handleDelete}
                                index={i}
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <span className="text-4xl mb-3 block">📝</span>
                        <p className="text-sm text-zinc-400">
                            {filterCategory === 'all'
                                ? 'Nenhuma nota adicionada'
                                : `Nenhuma nota de ${NOTE_CATEGORIES.find(c => c.id === filterCategory)?.label.toLowerCase()}`
                            }
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export { NoteCard, CategorySelector, AddNoteForm, NOTE_CATEGORIES }
