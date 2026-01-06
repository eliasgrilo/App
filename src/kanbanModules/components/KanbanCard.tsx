/**
 * ═══════════════════════════════════════════════════════════════════
 * KanbanCard — Individual card component
 * Extracted from Kanban.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion } from 'framer-motion'
import type { DragState, KanbanCardData } from '../types'
import { spring, ZOOM_CONFIG } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface KanbanCardProps {
    card: KanbanCardData
    colId: string
    dragState: DragState
    zoomLevel: number
    handleCardPointerDown: (e: any, card: any, colId: string) => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const KanbanCard = React.memo(({ card, colId, dragState, zoomLevel, handleCardPointerDown }: KanbanCardProps) => {
    const isCardDragging = dragState.active?.id === card.id

    if (isCardDragging) return null

    return (
        <motion.div
            layout
            layoutId={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -2 }}
            transition={spring.shift}
            data-card-id={card.id}
            onPointerDown={e => handleCardPointerDown(e, card, colId)}
            className={`relative bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-white/[0.06] rounded-2xl ${ZOOM_CONFIG[zoomLevel]!.cardPadding} shadow-sm hover:shadow-xl dark:shadow-black/10 cursor-grab active:cursor-grabbing touch-none select-none hover:border-zinc-300 dark:hover:border-white/10 group/card`}
            style={{ touchAction: 'none' }}
        >
            {/* Labels */}
            {card.labels?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {card.labels.map((l, i) => (
                        <div key={i} className={`rounded-full ${zoomLevel >= 2 ? 'h-2 w-2' : 'h-1.5 w-10'}`} style={{ backgroundColor: l.color }} />
                    ))}
                </div>
            )}

            {/* Title */}
            <h4 className={`font-semibold text-zinc-800 dark:text-zinc-100 leading-relaxed ${zoomLevel >= 2 ? 'text-[11px] line-clamp-2' : 'text-sm'}`}>{card.title}</h4>

            {/* Checklist Progress */}
            {zoomLevel < 2 && card.checklists?.length > 0 && (
                <div className="flex items-center gap-2 mt-3 text-zinc-400 dark:text-zinc-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span className="text-[10px] font-bold tabular-nums">
                        {card.checklists.reduce((a, c) => a + c.items.filter(i => i.done).length, 0)}/{card.checklists.reduce((a, c) => a + c.items.length, 0)}
                    </span>
                </div>
            )}
        </motion.div>
    )
})

export default KanbanCard
