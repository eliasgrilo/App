/**
 * ═══════════════════════════════════════════════════════════════════
 * VirtualizedCardList — Clean, Simple Card List
 * Apple HIG: Minimal, focused, no distractions
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useRef, useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { List } from 'react-window'
import { KanbanCard } from './KanbanCard'
import type { DragState, KanbanCardData } from '../types'
import { VIRTUALIZATION_THRESHOLD, CARD_HEIGHT } from '../types'

interface VirtualizedCardListProps {
    cards: KanbanCardData[]
    colId: string
    dragState: DragState
    zoomLevel: number
    handleCardPointerDown: (e: React.PointerEvent<HTMLElement>, card: KanbanCardData, colId: string) => void
    isTargetCol: boolean
    setAddingCardToCol: (colId: string | null) => void
    setNewCardTitle: (title: string) => void
}

interface RowData {
    cards: KanbanCardData[]
    colId: string
    dragState: DragState
    zoomLevel: number
    handleCardPointerDown: (e: React.PointerEvent<HTMLElement>, card: KanbanCardData, colId: string) => void
}

const VirtualRow = React.memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: RowData }) => {
    const card = data.cards[index]
    if (!card) return null
    return (
        <div style={{ ...style, paddingBottom: 12 }}>
            <KanbanCard
                card={card}
                colId={data.colId}
                dragState={data.dragState}
                zoomLevel={data.zoomLevel}
                handleCardPointerDown={data.handleCardPointerDown}
            />
        </div>
    )
})

export const VirtualizedCardList = React.memo(({
    cards,
    colId,
    dragState,
    zoomLevel,
    handleCardPointerDown,
    setAddingCardToCol,
    setNewCardTitle
}: VirtualizedCardListProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [containerHeight, setContainerHeight] = useState(400)

    useEffect(() => {
        if (!containerRef.current) return
        const ro = new ResizeObserver(e => {
            const h = e[0]?.contentRect?.height
            if (h) setContainerHeight(h - 60)
        })
        ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [])

    const useVirtualization = cards.length > VIRTUALIZATION_THRESHOLD
    const rowData: RowData = { cards, colId, dragState, zoomLevel, handleCardPointerDown }

    return (
        <div
            ref={containerRef}
            data-cards-container
            className="flex-1 overflow-y-auto px-3 md:px-4 py-3 space-y-3 custom-scrollbar"
        >
            {useVirtualization ? (
                <List
                    rowCount={cards.length}
                    rowHeight={CARD_HEIGHT}
                    rowProps={rowData}
                    rowComponent={VirtualRow as any}
                    style={{ height: containerHeight, width: '100%' }}
                />
            ) : (
                <AnimatePresence mode="popLayout">
                    {cards.map((card) => (
                        <KanbanCard
                            key={card.id}
                            card={card}
                            colId={colId}
                            dragState={dragState}
                            zoomLevel={zoomLevel}
                            handleCardPointerDown={handleCardPointerDown}
                        />
                    ))}
                </AnimatePresence>
            )}

            {/* Add Card Button */}
            <button
                onClick={() => { setAddingCardToCol(colId); setNewCardTitle('') }}
                className="w-full min-h-[48px] py-4 border-2 border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-[0.98] touch-manipulation"
            >
                + Cartão
            </button>
        </div>
    )
})

export default VirtualizedCardList
