/**
 * ═══════════════════════════════════════════════════════════════════
 * KanbanColumn — Column component with cards list
 * Extracted from Kanban.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion } from 'framer-motion'
import { VirtualizedCardList } from './VirtualizedCardList'
import type { DragState, KanbanColumnData } from '../types'
import { spring, ZOOM_CONFIG } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface KanbanColumnProps {
    col: KanbanColumnData
    dragState: DragState
    zoomLevel: number
    renamingColId: string | null
    setRenamingColId: (id: string | null) => void
    renameTitle: string
    setRenameTitle: (title: string) => void
    renameColumn: (colId: string) => void
    deleteColumn: (colId: string) => void
    setAddingCardToCol: (colId: string | null) => void
    setNewCardTitle: (title: string) => void
    handleCardPointerDown: (e: any, card: any, colId: string) => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const KanbanColumn = React.memo(({
    col, dragState, zoomLevel,
    renamingColId, setRenamingColId, renameTitle, setRenameTitle, renameColumn, deleteColumn,
    setAddingCardToCol, setNewCardTitle, handleCardPointerDown
}: KanbanColumnProps) => {
    const isTargetCol = dragState.target?.colId === col.id

    return (
        <motion.div
            layout
            layoutId={`col-${col.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={spring.layout}
            data-column-id={col.id}
            className={`flex-shrink-0 flex flex-col snap-center ${ZOOM_CONFIG[zoomLevel]!.width} max-h-full rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-white/[0.06] shadow-xl shadow-black/[0.03] dark:shadow-black/20 transition-all duration-300 ${isTargetCol ? 'bg-zinc-100/50 dark:bg-white/[0.02]' : 'hover:shadow-2xl'}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-100/80 dark:border-white/5 group">
                <div className="flex-1 min-w-0 mr-3">
                    {renamingColId === col.id ? (
                        <input
                            autoFocus
                            className="w-full text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white bg-transparent outline-none border-b-2 border-zinc-500"
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            onBlur={() => renameColumn(col.id)}
                            onKeyDown={e => { if (e.key === 'Enter') renameColumn(col.id); if (e.key === 'Escape') setRenamingColId(null) }}
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => { setRenamingColId(col.id); setRenameTitle(col.title) }}
                            className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors truncate bg-transparent border-none p-0 text-left w-full"
                        >
                            {col.title}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-white/5 rounded-full text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">{col.cards.length}</span>
                    <button
                        onClick={() => deleteColumn(col.id)}
                        className="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Cards */}
            <VirtualizedCardList
                cards={col.cards}
                colId={col.id}
                dragState={dragState}
                zoomLevel={zoomLevel}
                handleCardPointerDown={handleCardPointerDown}
                isTargetCol={isTargetCol}
                setAddingCardToCol={setAddingCardToCol}
                setNewCardTitle={setNewCardTitle}
            />
        </motion.div>
    )
})

export default KanbanColumn
