// ═══════════════════════════════════════════════════════════════════
// useKanbanHandlers — Composite hook combining drag and card/column handlers
// Refactored: 350 → ~50 lines
// ═══════════════════════════════════════════════════════════════════

import { MotionValue } from 'framer-motion'
import type { DragState, DragTarget, PendingDrag, KanbanBoard } from '../types'
import { useDragHandlers } from './useDragHandlers'
import { useCardColumnHandlers, ModalContextType } from './useCardColumnHandlers'

export interface UseKanbanHandlersProps {
    board: KanbanBoard; setBoard: React.Dispatch<React.SetStateAction<KanbanBoard>>
    dragState: DragState; setDragState: React.Dispatch<React.SetStateAction<DragState>>
    ghostX: MotionValue<number>; ghostY: MotionValue<number>
    pendingDragRef: React.MutableRefObject<PendingDrag | null>; rafRef: React.MutableRefObject<number | null>
    lastTargetRef: React.MutableRefObject<DragTarget>; setEditingCard: (card: any) => void
    newCardTitle: string; setNewCardTitle: (v: string) => void; setAddingCardToCol: (colId: string | null) => void
    newColTitle: string; setNewColTitle: (v: string) => void; setAddingCol: (v: boolean) => void
    renameTitle: string; setRenamingColId: (id: string | null) => void
    haptic: (intensity?: string) => void; modal: ModalContextType
}

export interface KanbanHandlersReturn {
    addCard: (colId: string) => void; updateCard: (card: any) => void; deleteCard: (colId: string, cardId: string) => void
    addColumn: () => void; renameColumn: (colId: string) => void; deleteColumn: (colId: string) => void
    handleCardPointerDown: (e: any, card: any, colId: string) => void
    findDropTarget: (clientX: number, clientY: number, activeCardId: string) => { colId: string | null; index: number } | null
}

export function useKanbanHandlers(props: UseKanbanHandlersProps): KanbanHandlersReturn {
    const { board, dragState, setDragState, ghostX, ghostY, pendingDragRef, rafRef, lastTargetRef, setEditingCard, setBoard, haptic } = props
    const { newCardTitle, setNewCardTitle, setAddingCardToCol, newColTitle, setNewColTitle, setAddingCol, renameTitle, setRenamingColId, modal } = props

    const { findDropTarget, handleCardPointerDown } = useDragHandlers({ board, dragState, setDragState, ghostX, ghostY, pendingDragRef, rafRef, lastTargetRef, setEditingCard, setBoard, haptic })
    const { addCard, updateCard, deleteCard, addColumn, renameColumn, deleteColumn } = useCardColumnHandlers({ setBoard, setEditingCard, newCardTitle, setNewCardTitle, setAddingCardToCol, newColTitle, setNewColTitle, setAddingCol, renameTitle, setRenamingColId, haptic, modal })

    return { addCard, updateCard, deleteCard, addColumn, renameColumn, deleteColumn, handleCardPointerDown, findDropTarget }
}

export type { ModalContextType }
export default useKanbanHandlers
