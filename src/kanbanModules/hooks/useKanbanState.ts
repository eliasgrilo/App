/**
 * ═══════════════════════════════════════════════════════════════════
 * useKanbanState — Local UI state for Kanban
 * Extracted from Kanban.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useCallback } from 'react'
import { useMotionValue, MotionValue } from 'framer-motion'
import type { DragState, DragTarget, PendingDrag, KanbanBoard, KanbanCardData } from '../types'
import { DEFAULT_KANBAN } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface KanbanStateReturn {
    // Board data
    board: KanbanBoard
    setBoard: React.Dispatch<React.SetStateAction<KanbanBoard>>

    // UI State
    editingCard: KanbanCardData | null
    setEditingCard: (card: KanbanCardData | null) => void
    addingCol: boolean
    setAddingCol: (v: boolean) => void
    newColTitle: string
    setNewColTitle: (v: string) => void
    zoomLevel: number
    setZoomLevel: (v: number) => void
    addingCardToCol: string | null
    setAddingCardToCol: (colId: string | null) => void
    newCardTitle: string
    setNewCardTitle: (v: string) => void
    renamingColId: string | null
    setRenamingColId: (id: string | null) => void
    renameTitle: string
    setRenameTitle: (v: string) => void

    // Drag state
    dragState: DragState
    setDragState: React.Dispatch<React.SetStateAction<DragState>>
    ghostX: MotionValue<number>
    ghostY: MotionValue<number>
    pendingDragRef: React.MutableRefObject<PendingDrag | null>
    scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>
    rafRef: React.MutableRefObject<number | null>
    lastTargetRef: React.MutableRefObject<DragTarget>

    // Helpers
    haptic: (intensity?: string) => void
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useKanbanState(): KanbanStateReturn {
    // Board data
    const [board, setBoard] = useState<KanbanBoard>(DEFAULT_KANBAN)

    // UI state
    const [editingCard, setEditingCard] = useState<KanbanCardData | null>(null)
    const [addingCol, setAddingCol] = useState(false)
    const [newColTitle, setNewColTitle] = useState('')
    const [zoomLevel, setZoomLevel] = useState<number>(0)
    const [addingCardToCol, setAddingCardToCol] = useState<string | null>(null)
    const [newCardTitle, setNewCardTitle] = useState<string>('')
    const [renamingColId, setRenamingColId] = useState<string | null>(null)
    const [renameTitle, setRenameTitle] = useState('')

    // Drag state
    const [dragState, setDragState] = useState<DragState>({
        active: null,
        target: null,
        isDragging: false
    })

    // Motion values for ghost
    const ghostX = useMotionValue(0)
    const ghostY = useMotionValue(0)

    // Refs
    const pendingDragRef = useRef<PendingDrag | null>(null)
    const scrollContainerRef = useRef<HTMLDivElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const lastTargetRef = useRef<DragTarget>({ colId: null, index: 0 })

    // Haptic feedback
    const haptic = useCallback((intensity = 'light') => {
        if (navigator.vibrate) {
            navigator.vibrate(intensity === 'light' ? 8 : intensity === 'medium' ? 15 : 25)
        }
    }, [])

    return {
        // Board
        board,
        setBoard,

        // UI State
        editingCard: editingCard as any,
        setEditingCard: setEditingCard as any,
        addingCol,
        setAddingCol,
        newColTitle,
        setNewColTitle,
        zoomLevel,
        setZoomLevel,
        addingCardToCol,
        setAddingCardToCol,
        newCardTitle,
        setNewCardTitle,
        renamingColId,
        setRenamingColId,
        renameTitle,
        setRenameTitle,

        // Drag
        dragState,
        setDragState,
        ghostX,
        ghostY,
        pendingDragRef,
        scrollContainerRef,
        rafRef,
        lastTargetRef,

        // Helpers
        haptic
    }
}

export default useKanbanState
