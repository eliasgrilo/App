// ═══════════════════════════════════════════════════════════════════
// KANBAN DRAG HANDLERS HOOK
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useEffect } from 'react'
import { MotionValue } from 'framer-motion'
import type { DragState, DragTarget, PendingDrag, KanbanBoard, KanbanCardData } from '../types'
import { DRAG_THRESHOLD } from '../types'

export interface UseDragHandlersProps {
    board: KanbanBoard; dragState: DragState; setDragState: React.Dispatch<React.SetStateAction<DragState>>
    ghostX: MotionValue<number>; ghostY: MotionValue<number>
    pendingDragRef: React.MutableRefObject<PendingDrag | null>; rafRef: React.MutableRefObject<number | null>
    lastTargetRef: React.MutableRefObject<DragTarget>; setEditingCard: (card: KanbanCardData & { columnId?: string }) => void
    setBoard: React.Dispatch<React.SetStateAction<KanbanBoard>>; haptic: (intensity?: string) => void
}

export function useDragHandlers({ board, dragState, setDragState, ghostX, ghostY, pendingDragRef, rafRef, lastTargetRef, setEditingCard, setBoard, haptic }: UseDragHandlersProps) {
    const findDropTarget = useCallback((clientX: number, clientY: number, activeCardId: string) => {
        const elements = document.elementsFromPoint(clientX, clientY)
        const colEl = elements.find(el => el.hasAttribute('data-column-id'))
        if (!colEl) return null
        const colId = colEl.getAttribute('data-column-id')
        const container = colEl.querySelector('[data-cards-container]')
        if (!container) return { colId, index: 0 }
        const cards = Array.from(container.querySelectorAll('[data-card-id]')).filter((c: Element) => c.getAttribute('data-card-id') !== activeCardId)
        if (cards.length === 0) return { colId, index: 0 }
        for (let i = 0; i < cards.length; i++) { const cardRect = cards[i]?.getBoundingClientRect(); const cardMid = cardRect!.top + cardRect!.height / 2; if (clientY < cardMid) return { colId, index: i } }
        return { colId, index: cards.length }
    }, [])

    const handleCardPointerDown = useCallback((e: React.PointerEvent<HTMLElement>, card: KanbanCardData, colId: string) => {
        if ((e.target as HTMLElement).closest('button, input, textarea, [data-no-drag]')) return
        if (e.button && e.button !== 0) return
        const element = e.currentTarget; const rect = element.getBoundingClientRect()
        pendingDragRef.current = { card, colId, element, rect, startX: e.clientX, startY: e.clientY, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top, cardIndex: board.columns.find(c => c.id === colId)?.cards.findIndex((c: KanbanCardData) => c.id === card.id) ?? 0 }
    }, [board.columns, pendingDragRef])

    useEffect(() => {
        const handleWindowPointerMove = (e: PointerEvent) => {
            const pending = pendingDragRef.current
            if (pending && !dragState.isDragging) {
                const dx = e.clientX - pending.startX; const dy = e.clientY - pending.startY; const distance = Math.sqrt(dx * dx + dy * dy)
                if (distance > DRAG_THRESHOLD) {
                    const { card, colId, rect, offsetX, offsetY, cardIndex } = pending
                    ghostX.set(rect.left); ghostY.set(rect.top)
                    setDragState({ active: { id: card.id, sourceColId: colId, sourceIndex: cardIndex, data: card, rect, offsetX, offsetY }, target: { colId, index: cardIndex }, isDragging: true })
                    haptic('medium')
                }
                return
            }
            if (dragState.isDragging && dragState.active) {
                e.preventDefault()
                ghostX.set(e.clientX - dragState.active.offsetX); ghostY.set(e.clientY - dragState.active.offsetY)
                if (rafRef.current) return
                rafRef.current = requestAnimationFrame(() => {
                    const newTarget = findDropTarget(e.clientX, e.clientY, dragState.active?.id || ''); rafRef.current = null
                    if (newTarget) { const lastTarget = lastTargetRef.current; if (lastTarget.colId !== newTarget.colId || lastTarget.index !== newTarget.index) { lastTargetRef.current = newTarget; haptic('light'); setDragState(prev => ({ ...prev, target: newTarget })) } }
                })
            }
        }

        const handleWindowPointerUp = (_e: PointerEvent) => {
            if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
            if (dragState.isDragging && dragState.active) {
                const { active, target } = dragState; document.body.style.cursor = ''; const targetColId = target?.colId; const targetIndex = target?.index; const needsUpdate = targetColId && (active.sourceColId !== targetColId || active.sourceIndex !== targetIndex)
                if (needsUpdate) {
                    setBoard(prev => { const newCols = prev.columns.map(col => ({ ...col, cards: [...col.cards] })); const sourceCol = newCols.find(c => c.id === active.sourceColId); const destCol = newCols.find(c => c.id === targetColId); if (!sourceCol || !destCol) return prev; const cardIdx = sourceCol.cards.findIndex((c: KanbanCardData) => c.id === active.id); if (cardIdx === -1) return prev; const [movedCard] = sourceCol.cards.splice(cardIdx, 1); destCol.cards.splice(targetIndex || 0, 0, movedCard!); return { ...prev, columns: newCols } })
                    haptic('medium')
                }
                setDragState({ active: null, target: null, isDragging: false }); lastTargetRef.current = { colId: null, index: 0 }
            } else if (pendingDragRef.current) { const { card, colId } = pendingDragRef.current; setEditingCard({ ...card, columnId: colId }) }
            pendingDragRef.current = null
        }

        window.addEventListener('pointermove', handleWindowPointerMove, { passive: false }); window.addEventListener('pointerup', handleWindowPointerUp); window.addEventListener('pointercancel', handleWindowPointerUp)
        return () => { window.removeEventListener('pointermove', handleWindowPointerMove); window.removeEventListener('pointerup', handleWindowPointerUp); window.removeEventListener('pointercancel', handleWindowPointerUp); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }, [dragState, findDropTarget, haptic, ghostX, ghostY, pendingDragRef, rafRef, lastTargetRef, setDragState, setEditingCard, setBoard])

    return { findDropTarget, handleCardPointerDown }
}
