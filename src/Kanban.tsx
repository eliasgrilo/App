/**
 * ═══════════════════════════════════════════════════════════════════
 * Kanban Pro Max — Apple Quality Edition
 * Refactored: ~130 lines (lean orchestrator)
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useModal, useToast } from './stores/useUIStore'
import { useKanbanState, useKanbanHandlers, KanbanColumn, DragGhost, CardDetailsModal, AddColumnModal, AddCardModal, spring, ZOOM_CONFIG } from './kanbanModules'

export default function Kanban() {
    const { modal } = useModal(); const { toast } = useToast()
    const state = useKanbanState()
    const handlers = useKanbanHandlers({ board: state.board, setBoard: state.setBoard, dragState: state.dragState, setDragState: state.setDragState, ghostX: state.ghostX, ghostY: state.ghostY, pendingDragRef: state.pendingDragRef, rafRef: state.rafRef, lastTargetRef: state.lastTargetRef, setEditingCard: state.setEditingCard, newCardTitle: state.newCardTitle, setNewCardTitle: state.setNewCardTitle, setAddingCardToCol: state.setAddingCardToCol, newColTitle: state.newColTitle, setNewColTitle: state.setNewColTitle, setAddingCol: state.setAddingCol, renameTitle: state.renameTitle, setRenamingColId: state.setRenamingColId, haptic: state.haptic, modal })

    return (
        <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col pt-6 font-sans bg-zinc-50 dark:bg-black select-none overflow-hidden">
            {/* Action Button */}
            <div className="relative z-10 flex-shrink-0 px-6 md:px-8 pb-6 flex justify-end">
                <button onClick={() => state.setAddingCol(true)} className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/10 dark:shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-[250ms] flex items-center justify-center gap-3 group"><svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nova Lista</button>
            </div>
            {/* Board */}
            <div ref={state.scrollContainerRef} className="relative z-10 flex-1 overflow-x-auto flex gap-4 md:gap-6 px-6 md:px-8 pb-8 snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
                <AnimatePresence mode="popLayout">{state.board.columns.map((col) => <KanbanColumn key={col.id} col={col} dragState={state.dragState} zoomLevel={state.zoomLevel} renamingColId={state.renamingColId} setRenamingColId={state.setRenamingColId} renameTitle={state.renameTitle} setRenameTitle={state.setRenameTitle} renameColumn={handlers.renameColumn} deleteColumn={handlers.deleteColumn} setAddingCardToCol={state.setAddingCardToCol} setNewCardTitle={state.setNewCardTitle} handleCardPointerDown={handlers.handleCardPointerDown} />)}</AnimatePresence>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => state.setAddingCol(true)} className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-lg hover:shadow-xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"><svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></motion.button>
            </div>
            {/* Mobile Zoom */}
            <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-40"><motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, ...(spring.enter) }} className="flex items-center bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl p-1.5 shadow-2xl border border-zinc-200/50 dark:border-white/10">{ZOOM_CONFIG.map((config, idx) => (<button key={idx} onClick={() => { state.setZoomLevel(idx); state.haptic('light') }} className={`relative px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-[250ms] ${state.zoomLevel === idx ? 'text-white dark:text-zinc-900' : 'text-zinc-400 dark:text-zinc-500'}`}>{state.zoomLevel === idx && <motion.div layoutId="zoomIndicator" className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-xl" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}<span className="relative z-10">{config.label}</span></button>))}</motion.div></div>
            {/* Modals */}
            <DragGhost dragState={state.dragState} ghostX={state.ghostX} ghostY={state.ghostY} />
            <AnimatePresence>{state.editingCard && <CardDetailsModal card={state.editingCard} onClose={() => state.setEditingCard(null)} onUpdate={handlers.updateCard} onDelete={() => state.editingCard && handlers.deleteCard(state.editingCard.columnId || '', state.editingCard.id)} />}</AnimatePresence>
            <AddColumnModal isOpen={state.addingCol} newColTitle={state.newColTitle} setNewColTitle={state.setNewColTitle} setAddingCol={state.setAddingCol} addColumn={handlers.addColumn} />
            <AddCardModal addingCardToCol={state.addingCardToCol} columns={state.board.columns} newCardTitle={state.newCardTitle} setNewCardTitle={state.setNewCardTitle} setAddingCardToCol={state.setAddingCardToCol} addCard={handlers.addCard} />
        </div>
    )
}
