import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useScrollLock } from './hooks/useScrollLock'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, Reorder, useMotionValue, MotionValue, Transition } from 'framer-motion'
// @ts-expect-error - react-window type compatibility
import { FixedSizeList as List } from 'react-window'
import { useModal } from './contexts/ModalContext'
import { useToast } from './contexts/ToastContext'
import { CardLabel, ChecklistItem, Checklist, KanbanCardData, KanbanColumnData, KanbanBoard, ActiveDrag, DragTarget, DragState, PendingDrag, SpringConfigs, ZoomConfig, DEFAULT_KANBAN, STORAGE_KEY, spring, LABELS, ZOOM_CONFIG, VIRTUALIZATION_THRESHOLD, CARD_HEIGHT, DRAG_THRESHOLD } from './kanbanModules'

/**
 * Kanban Pro Max - Apple Quality Edition
 */

export default function Kanban() {
    // ═══════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    // Kanban board data (local session state - resets on page reload)
    const [board, setBoard] = useState(DEFAULT_KANBAN)

    const [editingCard, setEditingCard] = useState<any>(null)
    const [addingCol, setAddingCol] = useState(false)
    const [newColTitle, setNewColTitle] = useState('')
    const [zoomLevel, setZoomLevel] = useState<number>(0)
    const [addingCardToCol, setAddingCardToCol] = useState<string | null>(null)
    const [newCardTitle, setNewCardTitle] = useState<string>('')
    const [renamingColId, setRenamingColId] = useState<string | null>(null)
    const [renameTitle, setRenameTitle] = useState('')
    const { modal } = useModal()

    // Toast from centralized context
    const { toast } = useToast()
    const showToast = useCallback((message: string, type: string = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    // ═══════════════════════════════════════════════════════════════
    // DRAG & DROP ENGINE
    // ═══════════════════════════════════════════════════════════════

    const [dragState, setDragState] = useState<DragState>({
        active: null,      // { id, sourceColId, data, rect, offsetX, offsetY }
        target: null,      // { colId, index }
        isDragging: false, // True once threshold is exceeded
    })

    // High-performance ghost tracking
    const ghostX = useMotionValue(0)
    const ghostY = useMotionValue(0)

    // Pending drag state
    const pendingDragRef = useRef<PendingDrag | null>(null)


    const scrollContainerRef = useRef<HTMLDivElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const lastTargetRef = useRef<DragTarget>({ colId: null, index: 0 })

    // Haptic feedback simulation
    const haptic = useCallback((intensity = 'light') => {
        if (navigator.vibrate) {
            navigator.vibrate(intensity === 'light' ? 8 : intensity === 'medium' ? 15 : 25)
        }
    }, [])

    // Find drop target
    const findDropTarget = useCallback((clientX: number, clientY: number, activeCardId: string) => {
        const elements = document.elementsFromPoint(clientX, clientY)
        const colEl = elements.find(el => el.hasAttribute('data-column-id'))

        if (!colEl) return null

        const colId = colEl.getAttribute('data-column-id')
        const container = colEl.querySelector('[data-cards-container]')

        if (!container) return { colId, index: 0 }

        const cards = Array.from(container.querySelectorAll('[data-card-id]'))
            .filter((c: any) => c.getAttribute('data-card-id') !== activeCardId)

        if (cards.length === 0) return { colId, index: 0 }

        for (let i = 0; i < cards.length; i++) {
            const cardRect = cards[i]?.getBoundingClientRect()
            const cardMid = cardRect!.top + cardRect!.height / 2
            if (clientY < cardMid) return { colId, index: i }
        }

        return { colId, index: cards.length }
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════

    useEffect(() => {
        const handleWindowPointerMove = (e: any) => {
            const pending = pendingDragRef.current

            // PHASE 1: DETECT DRAG START
            if (pending && !dragState.isDragging) {
                const dx = e.clientX - pending.startX
                const dy = e.clientY - pending.startY
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance > DRAG_THRESHOLD) {
                    const { card, colId, rect, offsetX, offsetY, cardIndex } = pending

                    ghostX.set(rect.left)
                    ghostY.set(rect.top)

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
                        target: { colId, index: cardIndex },
                        isDragging: true
                    })

                    haptic('medium')
                }
                return
            }

            // PHASE 2: DRAG IN PROGRESS
            if (dragState.isDragging && dragState.active) {
                e.preventDefault()

                const newX = e.clientX - dragState.active.offsetX
                const newY = e.clientY - dragState.active.offsetY

                ghostX.set(newX)
                ghostY.set(newY)

                if (rafRef.current) return

                rafRef.current = requestAnimationFrame(() => {
                    const newTarget = findDropTarget(e.clientX, e.clientY, dragState.active?.id || '')
                    rafRef.current = null

                    if (newTarget) {
                        const lastTarget = lastTargetRef.current
                        if (lastTarget.colId !== newTarget.colId || lastTarget.index !== newTarget.index) {
                            lastTargetRef.current = newTarget
                            haptic('light')
                            setDragState(prev => ({ ...prev, target: newTarget }))
                        }
                    }
                })
            }
        }

        const handleWindowPointerUp = (e: any) => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }

            // CASE 1: Was dragging
            if (dragState.isDragging && dragState.active) {
                const { active, target } = dragState
                document.body.style.cursor = ''

                const targetColId = target?.colId
                const targetIndex = target?.index

                // Logic: Apply Move
                const needsUpdate = targetColId && (active.sourceColId !== targetColId || active.sourceIndex !== targetIndex)

                if (needsUpdate) {
                    setBoard(prev => {
                        const newCols = prev.columns.map(col => ({ ...col, cards: [...col.cards] }))
                        const sourceCol = newCols.find(c => c.id === active.sourceColId)
                        const destCol = newCols.find(c => c.id === targetColId)

                        if (!sourceCol || !destCol) return prev

                        const cardIdx = sourceCol.cards.findIndex((c: any) => c.id === active.id)
                        if (cardIdx === -1) return prev

                        const [movedCard] = sourceCol.cards.splice(cardIdx, 1)
                        destCol.cards.splice(targetIndex || 0, 0, movedCard!)

                        return { ...prev, columns: newCols }
                    })
                    haptic('medium')
                }

                setDragState({ active: null, target: null, isDragging: false })
                lastTargetRef.current = { colId: null, index: 0 }
            }
            // CASE 2: Click
            else if (pendingDragRef.current) {
                const { card, colId } = pendingDragRef.current
                setEditingCard({ ...card, columnId: colId })
            }

            pendingDragRef.current = null
        }

        window.addEventListener('pointermove', handleWindowPointerMove, { passive: false })
        window.addEventListener('pointerup', handleWindowPointerUp)
        window.addEventListener('pointercancel', handleWindowPointerUp)

        return () => {
            window.removeEventListener('pointermove', handleWindowPointerMove)
            window.removeEventListener('pointerup', handleWindowPointerUp)
            window.removeEventListener('pointercancel', handleWindowPointerUp)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [dragState, findDropTarget, haptic, ghostX, ghostY])


    const handleCardPointerDown = useCallback((e: any, card: any, colId: string) => {
        if (e.target.closest('button, input, textarea, [data-no-drag]')) return
        if (e.button && e.button !== 0) return

        const element = e.currentTarget
        const rect = element.getBoundingClientRect()

        pendingDragRef.current = {
            card,
            colId,
            element,
            rect,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            cardIndex: board.columns.find(c => c.id === colId)?.cards.findIndex((c: any) => c.id === card.id) ?? 0
        }
    }, [board.columns])

    // Note: Kanban board uses session state. For persistence, add 'board' to useAppStore

    // ═══════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════
    const addCard = useCallback((colId: string) => {
        if (!newCardTitle.trim()) return
        const card = {
            id: `card - ${Date.now()} -${Math.random().toString(36).substr(2, 9)} `,
            title: newCardTitle.trim(),
            labels: [],
            checklists: [],
            description: '',
            createdAt: new Date().toISOString()
        }
        setBoard(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === colId ? { ...c, cards: [...c.cards, card] } : c)
        }))
        setNewCardTitle('')
        setAddingCardToCol(null)
        haptic('light')
    }, [newCardTitle, haptic])

    const updateCard = useCallback((card: any) => {
        setBoard(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === card.columnId
                ? { ...c, cards: c.cards.map(existing => existing.id === card.id ? card : existing) }
                : c
            )
        }))
    }, [])

    const deleteCard = useCallback((colId: string, cardId: string) => {
        modal.confirm({
            title: "Excluir Cartão",
            message: "Esta ação não pode ser desfeita. Deseja continuar?",
            isDangerous: true,
            onConfirm: () => {
                setBoard(prev => ({
                    ...prev,
                    columns: prev.columns.map(c => c.id === colId
                        ? { ...c, cards: c.cards.filter(card => card.id !== cardId) }
                        : c
                    )
                }))
                setEditingCard(null)
                haptic('medium')
            }
        })
    }, [haptic, modal])

    const addColumn = useCallback(() => {
        if (!newColTitle.trim()) return
        setBoard(prev => ({
            ...prev,
            columns: [...prev.columns, { id: `col - ${Date.now()} `, title: newColTitle.trim(), cards: [] }]
        }))
        setNewColTitle('')
        setAddingCol(false)
        haptic('light')
    }, [newColTitle, haptic])

    const renameColumn = useCallback((colId: string) => {
        if (!renameTitle.trim()) { setRenamingColId(null); return }
        setBoard(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === colId ? { ...c, title: renameTitle.trim() } : c)
        }))
        setRenamingColId(null)
    }, [renameTitle])

    const deleteColumn = useCallback((colId: string) => {
        modal.confirm({
            title: "Excluir Lista",
            message: "Todos os cartões desta lista serão removidos. Continuar?",
            isDangerous: true,
            onConfirm: () => {
                setBoard(prev => ({ ...prev, columns: prev.columns.filter((c: any) => c.id !== colId) }))
                haptic('medium')
            }
        })
    }, [haptic, modal])

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    return (
        <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col pt-6 font-sans bg-zinc-50 dark:bg-black select-none overflow-hidden">

            {/* Header */}
            <header className="relative z-10 flex-shrink-0 px-6 md:px-8 pb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">Kanban</h1>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Gestão visual de tarefas e projetos</p>
                    </div>

                    <button onClick={() => setAddingCol(true)} className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/10 dark:shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-[250ms] flex items-center justify-center gap-3 group">
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Nova Lista
                    </button>
                </div>
            </header>

            {/* Board Container */}
            <div ref={scrollContainerRef} className="relative z-10 flex-1 overflow-x-auto flex gap-4 md:gap-6 px-6 md:px-8 pb-8 snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
                <AnimatePresence mode="popLayout">
                    {board.columns.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            col={col}
                            dragState={dragState}
                            spring={spring}
                            zoomLevel={zoomLevel}
                            renamingColId={renamingColId}
                            setRenamingColId={setRenamingColId}
                            renameTitle={renameTitle}
                            setRenameTitle={setRenameTitle}
                            renameColumn={renameColumn}
                            deleteColumn={deleteColumn}
                            addingCardToCol={addingCardToCol}
                            setAddingCardToCol={setAddingCardToCol}
                            newCardTitle={newCardTitle}
                            setNewCardTitle={setNewCardTitle}
                            addCard={addCard}
                            handleCardPointerDown={handleCardPointerDown}
                        />
                    ))}
                </AnimatePresence>

                {/* Add Column Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAddingCol(true)}
                    className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-lg hover:shadow-xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
                >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </motion.button>
            </div>

            {/* Mobile Zoom */}
            <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
                <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, ...(spring.enter) }} className="flex items-center bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl p-1.5 shadow-2xl border border-zinc-200/50 dark:border-white/10">
                    {ZOOM_CONFIG.map((config, idx) => (
                        <button key={idx} onClick={() => { setZoomLevel(idx); haptic('light') }} className={`relative px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-[250ms] ${zoomLevel === idx ? 'text-white dark:text-zinc-900' : 'text-zinc-400 dark:text-zinc-500'}`}>
                            {zoomLevel === idx && <motion.div layoutId="zoomIndicator" className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-xl" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
                            <span className="relative z-10">{config.label}</span>
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* Drag Ghost */}
            <DragGhost dragState={dragState} ghostX={ghostX} ghostY={ghostY} spring={spring} />

            {/* Modals */}
            <AnimatePresence>
                {editingCard && <CardDetailsModal card={editingCard} onClose={() => setEditingCard(null)} onUpdate={updateCard} onDelete={() => deleteCard(editingCard.columnId, editingCard.id)} />}
            </AnimatePresence>

            {/* Add Column Modal */}
            {createPortal(
                <AnimatePresence>
                    {addingCol && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto p-4"
                            style={{ paddingTop: '80px', paddingBottom: '40px' }}
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                                onClick={() => { setAddingCol(false); setNewColTitle('') }}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 30, scale: 0.98 }}
                                transition={spring.modal}
                                className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6"
                            >
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight">Nova Lista</h3>
                                <input
                                    autoFocus
                                    value={newColTitle}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewColTitle(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') { setAddingCol(false); setNewColTitle('') } }}
                                    placeholder="Nome da lista..."
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 px-4 py-4 rounded-2xl text-zinc-900 dark:text-white font-medium outline-none border border-zinc-200/80 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 mb-6"
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => { setAddingCol(false); setNewColTitle('') }} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-[0.98]">Cancelar</button>
                                    <button onClick={addColumn} disabled={!newColTitle.trim()} className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">Criar Lista</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Add Card Modal */}
            {createPortal(
                <AnimatePresence>
                    {addingCardToCol && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto p-4"
                            style={{ paddingTop: '80px', paddingBottom: '40px' }}
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                                onClick={() => { setAddingCardToCol(null); setNewCardTitle('') }}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 30, scale: 0.98 }}
                                transition={spring.modal}
                                className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6"
                            >
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">Novo Cartão</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                                    {board.columns.find(c => c.id === addingCardToCol)?.title}
                                </p>
                                <textarea
                                    autoFocus
                                    value={newCardTitle}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewCardTitle(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addCard(addingCardToCol) } if (e.key === 'Escape') { setAddingCardToCol(null); setNewCardTitle('') } }}
                                    placeholder="Título do cartão..."
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 px-4 py-4 rounded-2xl text-zinc-900 dark:text-white font-medium outline-none border border-zinc-200/80 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 resize-none mb-6"
                                    rows={3}
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => { setAddingCardToCol(null); setNewCardTitle('') }} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-[0.98]">Cancelar</button>
                                    <button onClick={() => addCard(addingCardToCol)} disabled={!newCardTitle.trim()} className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">Adicionar</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    )
}
interface KanbanColumnProps {
    col: any
    dragState: DragState
    spring: any
    zoomLevel: number
    renamingColId: string | null
    setRenamingColId: (id: string | null) => void
    renameTitle: string
    setRenameTitle: (title: string) => void
    renameColumn: (colId: string) => void
    deleteColumn: (colId: string) => void
    addingCardToCol: string | null
    setAddingCardToCol: (colId: string | null) => void
    newCardTitle: string
    setNewCardTitle: (title: string) => void
    addCard: (colId: string) => void
    handleCardPointerDown: (e: any, card: any, colId: string) => void
}

const KanbanColumn = React.memo(({
    col, dragState, spring, zoomLevel,
    renamingColId, setRenamingColId, renameTitle, setRenameTitle, renameColumn, deleteColumn,
    addingCardToCol, setAddingCardToCol, newCardTitle, setNewCardTitle, addCard,
    handleCardPointerDown
}: KanbanColumnProps) => {
    // Memoize column styling to prevent unnecessary re-calcs
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
                        <input autoFocus className="w-full text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white bg-transparent outline-none border-b-2 border-zinc-500" value={renameTitle} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRenameTitle(e.target.value)} onBlur={() => renameColumn(col.id)} onKeyDown={e => { if (e.key === 'Enter') renameColumn(col.id); if (e.key === 'Escape') setRenamingColId(null) }} />
                    ) : (
                        <h3 onClick={() => { setRenamingColId(col.id); setRenameTitle(col.title) }} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors truncate">
                            {col.title}
                        </h3>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-white/5 rounded-full text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">{col.cards.length}</span>
                    <button onClick={() => deleteColumn(col.id)} className="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>

            {/* Cards - Virtualized for Performance */}
            <VirtualizedCardList
                cards={col.cards}
                colId={col.id}
                dragState={dragState}
                spring={spring}
                zoomLevel={zoomLevel}
                handleCardPointerDown={handleCardPointerDown}
                isTargetCol={isTargetCol}
                setAddingCardToCol={setAddingCardToCol}
                setNewCardTitle={setNewCardTitle}
            />
        </motion.div>
    )
})

// ═══════════════════════════════════════════════════════════════
// VIRTUALIZED CARD LIST - 60fps PERFORMANCE OPTIMIZATION
// ═══════════════════════════════════════════════════════════════



interface VirtualizedCardListProps {
    cards: any[]
    colId: string
    dragState: DragState
    spring: any
    zoomLevel: number
    handleCardPointerDown: (e: any, card: any, colId: string) => void
    isTargetCol: boolean
    setAddingCardToCol: (colId: string | null) => void
    setNewCardTitle: (title: string) => void
}

const VirtualizedCardList = React.memo(({
    cards, colId, dragState, spring, zoomLevel,
    handleCardPointerDown, isTargetCol, setAddingCardToCol, setNewCardTitle
}: VirtualizedCardListProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [containerHeight, setContainerHeight] = useState(400)

    // Measure container height for virtualization
    useEffect(() => {
        if (!containerRef.current) return
        const resizeObserver = new ResizeObserver(entries => {
            const height = entries[0]?.contentRect?.height
            if (height) setContainerHeight(height - 60) // Reserve space for add button
        })
        resizeObserver.observe(containerRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    // Virtualized row renderer - recycles DOM elements
    const VirtualizedRow = useCallback((props: { index: number; style: React.CSSProperties }) => {
        const card = cards[props.index]
        if (!card) return null

        return (
            <div style={{ ...props.style, paddingBottom: 12 }}>
                <KanbanCard
                    card={card}
                    colId={colId}
                    dragState={dragState}
                    spring={spring}
                    zoomLevel={zoomLevel}
                    handleCardPointerDown={handleCardPointerDown}
                    isVirtualized={true}
                />
            </div>
        )
    }, [cards, colId, dragState, spring, zoomLevel, handleCardPointerDown])

    const useVirtualization = cards.length > VIRTUALIZATION_THRESHOLD

    return (
        <div
            ref={containerRef}
            data-cards-container
            className="flex-1 overflow-y-auto px-3 md:px-4 py-3 space-y-3 custom-scrollbar"
            style={{ willChange: 'scroll-position' }}
        >
            {useVirtualization ? (
                // VIRTUALIZED MODE: Recycle DOM elements for 60fps
                <List
                    height={containerHeight}
                    itemCount={cards.length}
                    itemSize={CARD_HEIGHT}
                    width="100%"
                    overscanCount={3}
                    style={{ overflow: 'visible' }}
                >
                    {VirtualizedRow}
                </List>
            ) : (
                // STANDARD MODE: Use AnimatePresence for smooth animations
                <AnimatePresence mode="popLayout">
                    {cards.map((card: any) => (
                        <KanbanCard
                            key={card.id}
                            card={card}
                            colId={colId}
                            dragState={dragState}
                            spring={spring}
                            zoomLevel={zoomLevel}
                            handleCardPointerDown={handleCardPointerDown}
                            isVirtualized={false}
                        />
                    ))}
                </AnimatePresence>
            )}

            {/* End Gap for Drag Target */}
            <AnimatePresence mode="sync">
                {dragState.isDragging && isTargetCol && dragState.active && (() => {
                    const filteredCards = cards.filter((c: any) => c.id !== dragState.active?.id)
                    return (dragState.target?.index ?? 0) >= filteredCards.length
                })() && (
                        <motion.div
                            key="kanban-gap"
                            layoutId="kanban-gap"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: dragState.active.rect?.height || 80 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={spring.placeholder}
                            className="pointer-events-none"
                        />
                    )}
            </AnimatePresence>

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


interface KanbanCardProps {
    card: any
    colId: string
    dragState: DragState
    spring: any
    zoomLevel: number
    handleCardPointerDown: (e: any, card: any, colId: string) => void
    isVirtualized?: boolean
}

const KanbanCard = React.memo(({ card, colId, dragState, spring, zoomLevel, handleCardPointerDown }: KanbanCardProps) => {
    // Derived state for fluidity
    const isCardDragging = dragState.active?.id === card.id
    const isTargetCol = dragState.target?.colId === colId

    // Calculate GAP logic
    const showPlaceholderBefore = false
    if (dragState.isDragging && isTargetCol && dragState.active) {
        // Need to check index
        // Since we don't have direct access to "index" here cleanly without passing full arrays,
        // we can assume the parent is handling the map order.
        // Wait, "KanbanColumn" maps them.

        // IMPORTANT: We need the index to determine gap position.
        // Passing "index" prop to KanbanCard.
    }

    return (
        <React.Fragment>
            {/* Logic for Gap moved to parent/wrapper for simplicity or calculated here if index passed */}
            {/* Actually, let's keep the gap logic inside the map of the Column to avoid passing heavy logic down */}

            {!isCardDragging && (
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
                    {/* Content... (Labels, Title, Meta) */}
                    {card.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {card.labels.map((l: any, i: number) => (
                                <div key={i} className={`rounded-full ${zoomLevel >= 2 ? 'h-2 w-2' : 'h-1.5 w-10'}`} style={{ backgroundColor: l.color }} />
                            ))}
                        </div>
                    )}
                    <h4 className={`font-semibold text-zinc-800 dark:text-zinc-100 leading-relaxed ${zoomLevel >= 2 ? 'text-[11px] line-clamp-2' : 'text-sm'}`}>{card.title}</h4>
                    {zoomLevel < 2 && card.checklists?.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 text-zinc-400 dark:text-zinc-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            <span className="text-[10px] font-bold tabular-nums">
                                {card.checklists.reduce((a: any, c: any) => a + c.items.filter((i: any) => i.done).length, 0)}/{card.checklists.reduce((a: any, c: any) => a + c.items.length, 0)}
                            </span>
                        </div>
                    )}
                </motion.div>
            )}
        </React.Fragment>
    )
})

// Corrected Column Inner Map to handle Gaps correctly
// I need, inside KanbanColumn, to render Gaps *between* cards.
// So I will override the map inside KanbanColumn.
// See KanbanColumn implementation above. It iterates cards.
// Inside that map, I also need to calculate the GAP logic.
// The GAP logic relies on `dragState.active` and `dragState.target`.

// RE-INJECTING GAP LOGIC INTO KANBAN COLUMN MAP:
// (Done in the KanbanColumn component definition above: see `filteredCards` logic)
// But wait, the `KanbanCard` component above doesn't have the gap.
// The gap was extracted to `KanbanCard` in my previous thought, but structurally it lies *between* cards.
// So in `KanbanColumn`, I will render:
// {gap} <KanbanCard />
// Just like the original file.

// Updating `KanbanColumn` in the final output to allow passing `index` to the map to calculate gaps.

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════

interface DragGhostProps {
    dragState: DragState
    ghostX: MotionValue<number>
    ghostY: MotionValue<number>
    spring: any
}

const DragGhost = React.memo(({ dragState, ghostX, ghostY, spring }: DragGhostProps) => {
    return (
        <AnimatePresence>
            {dragState.isDragging && dragState.active && (
                <motion.div
                    layoutId={dragState.active?.id}
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1, opacity: 1 }}
                    transition={spring.ghost}
                    style={{
                        x: ghostX, y: ghostY, position: 'fixed', top: 0, left: 0,
                        width: dragState.active.rect.width, zIndex: 10000, pointerEvents: 'none',
                        willChange: 'transform', cursor: 'grabbing'
                    }}
                    className="rounded-2xl"
                >
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/10 p-5 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none" />
                        <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 pointer-events-none" />
                        {dragState.active.data.labels?.length > 0 && (
                            <div className="flex gap-1.5 mb-3 relative z-10">
                                {dragState.active.data.labels.map((l: any, i: number) => (
                                    <div key={i} className="h-2 w-12 rounded-full shadow-sm" style={{ backgroundColor: l.color }} />
                                ))}
                            </div>
                        )}
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white leading-relaxed relative z-10">{dragState.active.data.title}</h4>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})

interface CardDetailsModalProps {
    card: any
    onClose: () => void
    onUpdate: (card: any) => void
    onDelete: () => void
}

function CardDetailsModal({ card, onClose, onUpdate, onDelete }: CardDetailsModalProps) {
    useScrollLock(true)
    const { modal } = useModal()
    const [localCard, setLocalCard] = useState<any>(card)
    const [addingChecklist, setAddingChecklist] = useState(false)
    const [newChecklistTitle, setNewChecklistTitle] = useState('')
    const isFirstRender = useRef(true)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Debounced sync to parent - prevents infinite loops and excessive re-renders
    useEffect(() => {
        // Skip first render to avoid unnecessary initial sync
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        // Clear any pending save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        // Debounce the update to prevent excessive syncs
        saveTimeoutRef.current = setTimeout(() => {
            onUpdate(localCard)
        }, 800)

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [localCard]) // Removed onUpdate from deps to prevent infinite loop

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
        modal.confirm({ title: "Excluir Checklist", message: "Esta checklist será removida permanentemente.", isDangerous: true, onConfirm: () => { setLocalCard((prev: any) => ({ ...prev, checklists: prev.checklists.filter((c: any) => c.id !== clId) })) } })
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="relative w-full md:max-w-2xl bg-white dark:bg-zinc-900 md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden border-t md:border border-zinc-200/50 dark:border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Close Button */}
                <div className="shrink-0 p-5 md:p-6 border-b border-zinc-100/80 dark:border-white/5">
                    {/* Mobile Drag Handle */}
                    <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 md:hidden" />

                    <div className="flex justify-between items-center mb-4">
                        {/* Labels */}
                        <div className="flex gap-2 flex-wrap">
                            {LABELS.map(label => (
                                <button
                                    key={label.id}
                                    onClick={() => toggleLabel(label)}
                                    className={`w-7 h-7 rounded-full transition-all ring-2 ring-offset-2 dark:ring-offset-zinc-900 ${localCard.labels?.find((l: any) => l.id === label.id) ? 'ring-zinc-900 dark:ring-white scale-110' : 'ring-transparent opacity-40 hover:opacity-100 hover:scale-110'}`}
                                    style={{ backgroundColor: label.color }}
                                />
                            ))}
                        </div>

                        {/* Close Button - Always Visible */}
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Title Input */}
                    <input
                        className="w-full text-xl md:text-2xl font-bold bg-transparent outline-none text-zinc-900 dark:text-white placeholder:text-zinc-300"
                        value={localCard.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLocalCard((prev: any) => ({ ...prev, title: e.target.value }))}
                        placeholder="Título do cartão"
                    />
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">
                    {/* Description */}
                    <div>
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Descrição</h4>
                        <textarea
                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-4 py-4 text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 resize-none min-h-[100px]"
                            placeholder="Adicione uma descrição..."
                            value={localCard.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLocalCard((prev: any) => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    {/* Checklists */}
                    {localCard.checklists?.map((cl: any) => (
                        <div key={cl.id}>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{cl.title}</h4>
                                <button onClick={() => deleteChecklist(cl.id)} className="text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider">Excluir</button>
                            </div>
                            <Reorder.Group axis="y" values={cl.items} onReorder={newItems => { setLocalCard((prev: any) => ({ ...prev, checklists: prev.checklists.map((c: any) => c.id === cl.id ? { ...c, items: newItems } : c) })) }} className="space-y-2">
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

                    {/* Add Checklist */}
                    {addingChecklist ? (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-700">
                            <input autoFocus value={newChecklistTitle} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewChecklistTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addChecklist(); if (e.key === 'Escape') setAddingChecklist(false) }} placeholder="Nome da checklist..." className="w-full bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 text-sm outline-none border border-zinc-200/80 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 mb-3" />
                            <div className="flex gap-2">
                                <button onClick={addChecklist} className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-xl text-xs font-bold uppercase tracking-wider">Criar</button>
                                <button onClick={() => setAddingChecklist(false)} className="flex-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 py-3 rounded-xl text-xs font-bold uppercase tracking-wider">Cancelar</button>
                            </div>
                        </motion.div>
                    ) : (
                        <button onClick={() => setAddingChecklist(true)} className="w-full py-4 border-2 border-dashed border-zinc-200/80 dark:border-zinc-700 rounded-2xl text-zinc-400 text-xs font-bold uppercase tracking-widest hover:border-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">+ Nova Checklist</button>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="shrink-0 p-5 md:p-6 border-t border-zinc-100/80 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <button onClick={onDelete} className="w-full py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors border border-rose-100 dark:border-rose-500/20 active:scale-[0.98]">Excluir Cartão</button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}
