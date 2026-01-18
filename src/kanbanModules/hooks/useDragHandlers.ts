// ═══════════════════════════════════════════════════════════════════
// KANBAN DRAG HANDLERS HOOK — Apple-Level Fluidity
// Refined drag detection and drop logic for seamless UX
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef } from 'react'
import { MotionValue } from 'framer-motion'
import type { DragState, DragTarget, PendingDrag, KanbanBoard, KanbanCardData } from '../types'
import { DRAG_THRESHOLD } from '../types'

export interface UseDragHandlersProps {
    board: KanbanBoard
    dragState: DragState
    setDragState: React.Dispatch<React.SetStateAction<DragState>>
    ghostX: MotionValue<number>
    ghostY: MotionValue<number>
    pendingDragRef: React.MutableRefObject<PendingDrag | null>
    rafRef: React.MutableRefObject<number | null>
    lastTargetRef: React.MutableRefObject<DragTarget>
    setEditingCard: (card: KanbanCardData & { columnId?: string }) => void
    setBoard: React.Dispatch<React.SetStateAction<KanbanBoard>>
    haptic: (intensity?: string) => void
}

export function useDragHandlers({
    board,
    dragState,
    setDragState,
    ghostX,
    ghostY,
    pendingDragRef,
    rafRef,
    lastTargetRef,
    setEditingCard,
    setBoard,
    haptic
}: UseDragHandlersProps) {
    // Keep a ref to current target for immediate access in pointerup
    const currentTargetRef = useRef<DragTarget>({ colId: null, index: 0 })

    // Enhanced drop target detection with better precision
    const findDropTarget = useCallback((clientX: number, clientY: number, activeCardId: string): { colId: string | null; index: number } | null => {
        const elements = document.elementsFromPoint(clientX, clientY)

        // Find column element
        const colEl = elements.find(el => el.hasAttribute('data-column-id'))
        if (!colEl) return null

        const colId = colEl.getAttribute('data-column-id')
        if (!colId) return null

        // Find cards container
        const container = colEl.querySelector('[data-cards-container]')
        if (!container) return { colId, index: 0 }

        // Get all cards except the one being dragged
        const cards = Array.from(container.querySelectorAll('[data-card-id]'))
            .filter((c: Element) => c.getAttribute('data-card-id') !== activeCardId)

        if (cards.length === 0) return { colId, index: 0 }

        // Find insertion point based on cursor Y position
        for (let i = 0; i < cards.length; i++) {
            const cardRect = cards[i]?.getBoundingClientRect()
            if (!cardRect) continue
            const cardMid = cardRect.top + cardRect.height / 2
            if (clientY < cardMid) return { colId, index: i }
        }

        return { colId, index: cards.length }
    }, [])

    // Handle pointer down on card
    const handleCardPointerDown = useCallback((e: React.PointerEvent<HTMLElement>, card: KanbanCardData, colId: string) => {
        // Ignore if clicking on interactive elements
        if ((e.target as HTMLElement).closest('button, input, textarea, [data-no-drag]')) return
        if (e.button && e.button !== 0) return

        const element = e.currentTarget
        const rect = element.getBoundingClientRect()
        const cardIndex = board.columns.find(c => c.id === colId)?.cards.findIndex((c: KanbanCardData) => c.id === card.id) ?? 0

        pendingDragRef.current = {
            card,
            colId,
            element,
            rect,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            cardIndex
        }

        // Capture pointer for reliable tracking
        element.setPointerCapture(e.pointerId)
    }, [board.columns, pendingDragRef])

    useEffect(() => {
        const handleWindowPointerMove = (e: PointerEvent) => {
            const pending = pendingDragRef.current

            // Check if we should start dragging
            if (pending && !dragState.isDragging) {
                const dx = e.clientX - pending.startX
                const dy = e.clientY - pending.startY
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance > DRAG_THRESHOLD) {
                    const { card, colId, rect, offsetX, offsetY, cardIndex } = pending

                    // Set initial ghost position
                    ghostX.set(rect.left)
                    ghostY.set(rect.top)

                    // Initialize drag state
                    const initialTarget = { colId, index: cardIndex }
                    currentTargetRef.current = initialTarget
                    lastTargetRef.current = initialTarget

                    setDragState({
                        active: {
                            id: card.id,
                            sourceColId: colId,
                            sourceIndex: cardIndex,
                            data: card,
                            rect,
                            offsetX,
                            offsetY
                        },
                        target: initialTarget,
                        isDragging: true
                    })

                    haptic('medium')
                    document.body.style.cursor = 'grabbing'
                }
                return
            }

            // Update ghost position and find drop target during drag
            if (dragState.isDragging && dragState.active) {
                e.preventDefault()

                // Smooth ghost movement
                ghostX.set(e.clientX - dragState.active.offsetX)
                ghostY.set(e.clientY - dragState.active.offsetY)

                // Throttle drop target detection with RAF
                if (rafRef.current) return

                rafRef.current = requestAnimationFrame(() => {
                    rafRef.current = null

                    const newTarget = findDropTarget(e.clientX, e.clientY, dragState.active?.id || '')

                    if (newTarget && newTarget.colId) {
                        const lastTarget = lastTargetRef.current

                        // Check if target changed
                        if (lastTarget.colId !== newTarget.colId || lastTarget.index !== newTarget.index) {
                            lastTargetRef.current = newTarget
                            currentTargetRef.current = newTarget
                            haptic('light')

                            setDragState(prev => ({
                                ...prev,
                                target: newTarget
                            }))
                        }
                    }
                })
            }
        }

        const handleWindowPointerUp = () => {
            // Cancel any pending RAF
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }

            if (dragState.isDragging && dragState.active) {
                const { active } = dragState
                const target = currentTargetRef.current

                document.body.style.cursor = ''

                // Always move the card if we have a valid target column
                const targetColId = target?.colId
                const targetIndex = target?.index ?? 0

                if (targetColId) {
                    // Move card to new position
                    setBoard(prev => {
                        const newCols = prev.columns.map(col => ({
                            ...col,
                            cards: [...col.cards]
                        }))

                        const sourceCol = newCols.find(c => c.id === active.sourceColId)
                        const destCol = newCols.find(c => c.id === targetColId)

                        if (!sourceCol || !destCol) return prev

                        // Find and remove card from source
                        const cardIdx = sourceCol.cards.findIndex((c: KanbanCardData) => c.id === active.id)
                        if (cardIdx === -1) return prev

                        const [movedCard] = sourceCol.cards.splice(cardIdx, 1)
                        if (!movedCard) return prev

                        // Adjust target index if moving within same column
                        let finalIndex = targetIndex
                        if (sourceCol.id === destCol.id && cardIdx < targetIndex) {
                            finalIndex = Math.max(0, targetIndex - 1)
                        }

                        // Insert card at destination
                        destCol.cards.splice(finalIndex, 0, movedCard)

                        return { ...prev, columns: newCols }
                    })

                    haptic('medium')
                }

                // Reset drag state
                setDragState({ active: null, target: null, isDragging: false })
                lastTargetRef.current = { colId: null, index: 0 }
                currentTargetRef.current = { colId: null, index: 0 }

            } else if (pendingDragRef.current) {
                // Click without drag - open card details
                const { card, colId } = pendingDragRef.current
                setEditingCard({ ...card, columnId: colId })
            }

            pendingDragRef.current = null
        }

        // Add event listeners
        window.addEventListener('pointermove', handleWindowPointerMove, { passive: false })
        window.addEventListener('pointerup', handleWindowPointerUp)
        window.addEventListener('pointercancel', handleWindowPointerUp)

        return () => {
            window.removeEventListener('pointermove', handleWindowPointerMove)
            window.removeEventListener('pointerup', handleWindowPointerUp)
            window.removeEventListener('pointercancel', handleWindowPointerUp)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [dragState, findDropTarget, haptic, ghostX, ghostY, pendingDragRef, rafRef, lastTargetRef, setDragState, setEditingCard, setBoard])

    return { findDropTarget, handleCardPointerDown }
}
