/**
 * ═══════════════════════════════════════════════════════════════════
 * CardDetailsModal — Modal for editing card details
 * Extracted from Kanban.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, Reorder } from 'framer-motion'
import { useScrollLock } from '../../hooks/useScrollLock'
import { useModal } from '../../stores/useUIStore'
import { LABELS } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface CardDetailsModalProps {
    card: any
    onClose: () => void
    onUpdate: (card: any) => void
    onDelete: () => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function CardDetailsModal({ card, onClose, onUpdate, onDelete }: CardDetailsModalProps) {
    useScrollLock(true)
    const { modal } = useModal()
    const [localCard, setLocalCard] = useState<any>(card)
    const [addingChecklist, setAddingChecklist] = useState(false)
    const [newChecklistTitle, setNewChecklistTitle] = useState('')
    const isFirstRender = useRef(true)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return }
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => onUpdate(localCard), 800)
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) }
    }, [localCard])

    const toggleLabel = (label: any) => {
        const has = localCard.labels?.find((l: any) => l.id === label.id)
        setLocalCard((prev: any) => ({ ...prev, labels: has ? prev.labels.filter((l: any) => l.id !== label.id) : [...(prev.labels || []), label] }))
    }

    const addChecklist = () => {
        if (!newChecklistTitle.trim()) return
        setLocalCard((prev: any) => ({ ...prev, checklists: [...(prev.checklists || []), { id: Date.now(), title: newChecklistTitle.trim(), items: [] }] }))
        setNewChecklistTitle(''); setAddingChecklist(false)
    }

    const deleteChecklist = (clId: string) => {
        modal.confirm({ title: "Excluir Checklist", message: "Esta checklist será removida permanentemente.", isDangerous: true, onConfirm: () => setLocalCard((prev: any) => ({ ...prev, checklists: prev.checklists.filter((c: any) => c.id !== clId) })) })
    }

    const toggleItem = (clId: string, itemId: string) => {
        setLocalCard((prev: any) => ({ ...prev, checklists: prev.checklists.map((cl: any) => cl.id === clId ? { ...cl, items: cl.items.map((i: any) => i.id === itemId ? { ...i, done: !i.done } : i) } : cl) }))
    }

    const addItem = (clId: string, text: string) => {
        if (!text.trim()) return
        setLocalCard((prev: any) => ({ ...prev, checklists: prev.checklists.map((cl: any) => cl.id === clId ? { ...cl, items: [...cl.items, { id: Date.now(), text: text.trim(), done: false }] } : cl) }))
    }

    const removeItem = (clId: string, itemId: string) => {
        setLocalCard((prev: any) => ({ ...prev, checklists: prev.checklists.map((cl: any) => cl.id === clId ? { ...cl, items: cl.items.filter((i: any) => i.id !== itemId) } : cl) }))
    }

    return createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: "spring", stiffness: 400, damping: 35 }} className="relative w-full md:max-w-2xl bg-white dark:bg-zinc-900 md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden border-t md:border border-zinc-200/50 dark:border-white/10" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="shrink-0 p-5 md:p-6 border-b border-zinc-100/80 dark:border-white/5">
                    <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 md:hidden" />
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2 flex-wrap">
                            {LABELS.map(label => (
                                <button key={label.id} onClick={() => toggleLabel(label)} className={`w-7 h-7 rounded-full transition-all ring-2 ring-offset-2 dark:ring-offset-zinc-900 ${localCard.labels?.find((l: any) => l.id === label.id) ? 'ring-zinc-900 dark:ring-white scale-110' : 'ring-transparent opacity-40 hover:opacity-100 hover:scale-110'}`} style={{ backgroundColor: label.color }} />
                            ))}
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <input className="w-full text-xl md:text-2xl font-bold bg-transparent outline-none text-zinc-900 dark:text-white placeholder:text-zinc-300" value={localCard.title} onChange={e => setLocalCard((prev: any) => ({ ...prev, title: e.target.value }))} placeholder="Título do cartão" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">
                    <div>
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Descrição</h4>
                        <textarea className="w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-4 py-4 text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 resize-none min-h-[100px]" placeholder="Adicione uma descrição..." value={localCard.description || ''} onChange={e => setLocalCard((prev: any) => ({ ...prev, description: e.target.value }))} />
                    </div>

                    {localCard.checklists?.map((cl: any) => (
                        <div key={cl.id}>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{cl.title}</h4>
                                <button onClick={() => deleteChecklist(cl.id)} className="text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider">Excluir</button>
                            </div>
                            <Reorder.Group axis="y" values={cl.items} onReorder={newItems => setLocalCard((prev: any) => ({ ...prev, checklists: prev.checklists.map((c: any) => c.id === cl.id ? { ...c, items: newItems } : c) }))} className="space-y-2">
                                {cl.items.map((item: any) => (
                                    <Reorder.Item key={item.id} value={item} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100/80 dark:border-zinc-700 cursor-grab active:cursor-grabbing group shadow-sm">
                                        <div className="text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">⋮⋮</div>
                                        <button onClick={() => toggleItem(cl.id, item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-400'}`}>
                                            {item.done && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </button>
                                        <span className={`flex-1 text-sm ${item.done ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>{item.text}</span>
                                        <button onClick={() => removeItem(cl.id, item.id)} className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                            <input className="w-full mt-2 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-sm outline-none border border-zinc-100/80 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 placeholder:text-zinc-400" placeholder="+ Adicionar item..." onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) { addItem(cl.id, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = '' } }} />
                        </div>
                    ))}

                    {addingChecklist ? (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-700">
                            <input autoFocus value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addChecklist(); if (e.key === 'Escape') setAddingChecklist(false) }} placeholder="Nome da checklist..." className="w-full bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 text-sm outline-none border border-zinc-200/80 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 mb-3" />
                            <div className="flex gap-2">
                                <button onClick={addChecklist} className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-xl text-xs font-bold uppercase tracking-wider">Criar</button>
                                <button onClick={() => setAddingChecklist(false)} className="flex-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 py-3 rounded-xl text-xs font-bold uppercase tracking-wider">Cancelar</button>
                            </div>
                        </motion.div>
                    ) : (
                        <button onClick={() => setAddingChecklist(true)} className="w-full py-4 border-2 border-dashed border-zinc-200/80 dark:border-zinc-700 rounded-2xl text-zinc-400 text-xs font-bold uppercase tracking-widest hover:border-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">+ Nova Checklist</button>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 p-5 md:p-6 border-t border-zinc-100/80 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <button onClick={onDelete} className="w-full py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors border border-rose-100 dark:border-rose-500/20 active:scale-[0.98]">Excluir Cartão</button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

export default CardDetailsModal
