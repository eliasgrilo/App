/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * APPLE NOTES SHEET — iOS-Style Annotation Modal
 * 
 * Premium annotation experience following Apple HIG:
 * - Sheet modal sliding from bottom
 * - Glassmorphism cards for each note
 * - Swipe-to-delete gesture
 * - Quick add with floating button
 * - Apple typography and colors
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
    X, Plus, MessageSquare, Trash2,
    CheckCircle, Calendar, Palette
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Note {
    id: string
    text: string
    color: string
    createdAt: Date
    chartId?: string
}

interface AppleNotesSheetProps {
    isOpen: boolean
    onClose: () => void
    notes: Note[]
    onAddNote: (text: string, color: string) => void
    onDeleteNote: (id: string) => void
    onEditNote: (id: string, text: string) => void
    chartName?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const NOTE_COLORS = [
    { name: 'Azul', value: '#007AFF' },
    { name: 'Verde', value: '#34C759' },
    { name: 'Laranja', value: '#FF9500' },
    { name: 'Vermelho', value: '#FF3B30' },
    { name: 'Roxo', value: '#AF52DE' },
    { name: 'Rosa', value: '#FF2D55' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// NOTE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface NoteCardProps {
    note: Note
    onDelete: () => void
    onEdit: (text: string) => void
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onEdit }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(note.text)
    const [swipeX, setSwipeX] = useState(0)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.x < -100) {
            setShowDeleteConfirm(true)
        }
        setSwipeX(0)
    }

    const handleSave = () => {
        onEdit(editText)
        setIsEditing(false)
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -200 }}
            className="relative"
        >
            {/* Delete Confirmation Overlay */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex items-center justify-end px-4 bg-red-500 rounded-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-red-600 font-semibold text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Card Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDrag={(_, info) => setSwipeX(info.offset.x)}
                onDragEnd={handleDragEnd}
                style={{ x: swipeX }}
                className={`
                    relative
                    bg-white/90 dark:bg-zinc-900/90
                    backdrop-blur-xl
                    rounded-2xl
                    border border-black/[0.04] dark:border-white/[0.06]
                    shadow-[0_4px_24px_rgba(0,0,0,0.06)]
                    overflow-hidden
                    cursor-grab active:cursor-grabbing
                `}
            >
                {/* Color Accent Bar */}
                <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ backgroundColor: note.color }}
                />

                <div className="pl-4 pr-4 py-4">
                    {isEditing ? (
                        <div className="space-y-3">
                            <textarea
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                className="w-full p-3 text-[15px] bg-zinc-50 dark:bg-zinc-800 rounded-xl border-0 resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] text-white rounded-lg text-sm font-semibold"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Salvar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div onClick={() => setIsEditing(true)} className="cursor-text">
                            <p className="text-[15px] text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                {note.text || <span className="text-zinc-400 italic">Toque para adicionar texto...</span>}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400">
                                <Calendar className="w-3 h-3" />
                                {formatDate(note.createdAt)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Swipe Hint */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px]">← deslize</span>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEW NOTE INPUT
// ═══════════════════════════════════════════════════════════════════════════════

interface NewNoteInputProps {
    onAdd: (text: string, color: string) => void
    onCancel: () => void
}

const NewNoteInput: React.FC<NewNoteInputProps> = ({ onAdd, onCancel }) => {
    const [text, setText] = useState('')
    const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]?.value ?? '#007AFF')
    const [showColors, setShowColors] = useState(false)

    const handleSubmit = () => {
        if (text.trim()) {
            onAdd(text.trim(), selectedColor)
            setText('')
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="
                bg-white dark:bg-zinc-900
                rounded-2xl
                border border-black/[0.04] dark:border-white/[0.06]
                shadow-[0_8px_32px_rgba(0,0,0,0.1)]
                overflow-hidden
            "
        >
            {/* Color Indicator */}
            <div
                className="h-1.5 w-full"
                style={{ backgroundColor: selectedColor }}
            />

            <div className="p-4 space-y-3">
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Adicione uma anotação..."
                    className="w-full p-3 text-[15px] bg-zinc-50 dark:bg-zinc-800 rounded-xl border-0 resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 min-h-[100px]"
                    autoFocus
                />

                {/* Color Selector */}
                <AnimatePresence>
                    {showColors && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 py-2"
                        >
                            {NOTE_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => {
                                        setSelectedColor(color.value)
                                        setShowColors(false)
                                    }}
                                    className={`
                                        w-8 h-8 rounded-full transition-transform
                                        ${selectedColor === color.value ? 'scale-110 ring-2 ring-offset-2 ring-black/20' : 'hover:scale-105'}
                                    `}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setShowColors(!showColors)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <Palette className="w-4 h-4" />
                        <span className="text-xs">Cor</span>
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!text.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#007AFF] disabled:bg-zinc-300 text-white rounded-xl text-sm font-semibold transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SHEET COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const AppleNotesSheet: React.FC<AppleNotesSheetProps> = ({
    isOpen,
    onClose,
    notes,
    onAddNote,
    onDeleteNote,
    onEditNote,
    chartName = 'Gráfico'
}) => {
    const [isAddingNote, setIsAddingNote] = useState(false)

    const handleAddNote = useCallback((text: string, color: string) => {
        onAddNote(text, color)
        setIsAddingNote(false)
    }, [onAddNote])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose()
                        }}
                        className="
                            fixed inset-x-0 bottom-0 z-50
                            max-h-[85vh]
                            bg-[#f5f5f7] dark:bg-[#1c1c1e]
                            rounded-t-[28px]
                            shadow-[0_-8px_32px_rgba(0,0,0,0.15)]
                            overflow-hidden
                        "
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4 border-b border-black/[0.04] dark:border-white/[0.06]">
                            <div>
                                <h2 className="text-[20px] font-semibold text-zinc-900 dark:text-white">
                                    Anotações
                                </h2>
                                <p className="text-[13px] text-zinc-500">
                                    {chartName} • {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                            {/* New Note Input */}
                            <AnimatePresence>
                                {isAddingNote && (
                                    <div className="mb-4">
                                        <NewNoteInput
                                            onAdd={handleAddNote}
                                            onCancel={() => setIsAddingNote(false)}
                                        />
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* Notes List */}
                            <AnimatePresence mode="popLayout">
                                {notes.length > 0 ? (
                                    <div className="space-y-3">
                                        {notes.map(note => (
                                            <NoteCard
                                                key={note.id}
                                                note={note}
                                                onDelete={() => onDeleteNote(note.id)}
                                                onEdit={(text) => onEditNote(note.id, text)}
                                            />
                                        ))}
                                    </div>
                                ) : !isAddingNote ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12"
                                    >
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <MessageSquare className="w-8 h-8 text-zinc-400" />
                                        </div>
                                        <p className="text-[15px] text-zinc-500">
                                            Nenhuma anotação ainda
                                        </p>
                                        <p className="text-[13px] text-zinc-400 mt-1">
                                            Toque no botão + para adicionar
                                        </p>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        {/* Floating Add Button */}
                        {!isAddingNote && (
                            <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsAddingNote(true)}
                                className="
                                    absolute bottom-6 right-6
                                    w-14 h-14
                                    bg-[#007AFF]
                                    rounded-full
                                    flex items-center justify-center
                                    text-white
                                    shadow-[0_8px_24px_rgba(0,122,255,0.4)]
                                "
                            >
                                <Plus className="w-6 h-6" />
                            </motion.button>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default AppleNotesSheet
