// ═══════════════════════════════════════════════════════════════════
// KANBAN CARD/COLUMN HANDLERS HOOK
// ═══════════════════════════════════════════════════════════════════

import { useCallback } from 'react'
import type { KanbanBoard } from '../types'

export interface ModalContextType { confirm: (opts: { title: string; message: string; isDangerous?: boolean; onConfirm: () => void }) => void }

export interface UseCardColumnHandlersProps {
    setBoard: React.Dispatch<React.SetStateAction<KanbanBoard>>
    setEditingCard: (card: any) => void; newCardTitle: string; setNewCardTitle: (v: string) => void
    setAddingCardToCol: (colId: string | null) => void; newColTitle: string; setNewColTitle: (v: string) => void
    setAddingCol: (v: boolean) => void; renameTitle: string; setRenamingColId: (id: string | null) => void
    haptic: (intensity?: string) => void; modal: ModalContextType
}

export function useCardColumnHandlers({ setBoard, setEditingCard, newCardTitle, setNewCardTitle, setAddingCardToCol, newColTitle, setNewColTitle, setAddingCol, renameTitle, setRenamingColId, haptic, modal }: UseCardColumnHandlersProps) {
    const addCard = useCallback((colId: string) => {
        if (!newCardTitle.trim()) return
        const card = { id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, title: newCardTitle.trim(), labels: [], checklists: [], description: '', createdAt: new Date().toISOString() }
        setBoard(prev => ({ ...prev, columns: prev.columns.map(c => c.id === colId ? { ...c, cards: [...c.cards, card] } : c) }))
        setNewCardTitle(''); setAddingCardToCol(null); haptic('light')
    }, [newCardTitle, haptic, setBoard, setNewCardTitle, setAddingCardToCol])

    const updateCard = useCallback((card: any) => {
        setBoard(prev => ({ ...prev, columns: prev.columns.map(c => c.id === card.columnId ? { ...c, cards: c.cards.map(existing => existing.id === card.id ? card : existing) } : c) }))
    }, [setBoard])

    const deleteCard = useCallback((colId: string, cardId: string) => {
        modal.confirm({ title: "Excluir Cartão", message: "Esta ação não pode ser desfeita. Deseja continuar?", isDangerous: true, onConfirm: () => { setBoard(prev => ({ ...prev, columns: prev.columns.map(c => c.id === colId ? { ...c, cards: c.cards.filter(card => card.id !== cardId) } : c) })); setEditingCard(null); haptic('medium') } })
    }, [haptic, modal, setBoard, setEditingCard])

    const addColumn = useCallback(() => {
        if (!newColTitle.trim()) return
        setBoard(prev => ({ ...prev, columns: [...prev.columns, { id: `col-${Date.now()}`, title: newColTitle.trim(), cards: [] }] }))
        setNewColTitle(''); setAddingCol(false); haptic('light')
    }, [newColTitle, haptic, setBoard, setNewColTitle, setAddingCol])

    const renameColumn = useCallback((colId: string) => {
        if (!renameTitle.trim()) { setRenamingColId(null); return }
        setBoard(prev => ({ ...prev, columns: prev.columns.map(c => c.id === colId ? { ...c, title: renameTitle.trim() } : c) })); setRenamingColId(null)
    }, [renameTitle, setBoard, setRenamingColId])

    const deleteColumn = useCallback((colId: string) => {
        modal.confirm({ title: "Excluir Lista", message: "Todos os cartões desta lista serão removidos. Continuar?", isDangerous: true, onConfirm: () => { setBoard(prev => ({ ...prev, columns: prev.columns.filter((c: any) => c.id !== colId) })); haptic('medium') } })
    }, [haptic, modal, setBoard])

    return { addCard, updateCard, deleteCard, addColumn, renameColumn, deleteColumn }
}
