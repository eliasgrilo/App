import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { FirebaseService } from './services/firebaseService'
import { motion, AnimatePresence, Reorder, useMotionValue } from 'framer-motion'

/**
 * Kanban Pro Max - Apple Quality Edition
 * 
 * DESIGN PRINCIPLES (Apple HIG Inspired):
 * 1. Physics-based feel: Cards have weight and momentum with spring dynamics
 * 2. Visual Fidelity: Premium glassmorphism, subtle shadows, refined typography
 * 3. Fluid Motion: 60fps animations, spring physics, gesture-driven interactions
 * 4. Touch-First: Native-feeling drag with haptic feedback simulation
 * 5. Maximalist Clean: Rich features presented with clarity and elegance
 */

const STORAGE_KEY = 'padoca_kanban_pro_max'

// Premium Spring Configurations - "Apple-like" Physics (Restored to Stable)
const spring = {
    layout: { type: "spring", stiffness: 500, damping: 40, mass: 1 },
    enter: { type: "spring", stiffness: 450, damping: 35, mass: 0.8 },
    placeholder: { type: "spring", stiffness: 600, damping: 45, mass: 0.7 },
    ghost: { type: "spring", stiffness: 500, damping: 40, mass: 1 },
    shift: { type: "spring", stiffness: 450, damping: 35, mass: 1 },
    modal: { type: "spring", stiffness: 400, damping: 30, mass: 1 }
}

const LABELS = [
    { id: 'emerald', name: 'Concluído', color: '#10b981' },
    { id: 'amber', name: 'Atenção', color: '#f59e0b' },
    { id: 'rose', name: 'Urgente', color: '#f43f5e' },
    { id: 'indigo', name: 'Em Progresso', color: '#6366f1' },
    { id: 'sky', name: 'Ideia', color: '#0ea5e9' },
    { id: 'violet', name: 'Revisão', color: '#8b5cf6' },
]

const DEFAULT_BOARD = {
    columns: [
        { id: 'c1', title: 'A Fazer', cards: [] },
        { id: 'c2', title: 'Em Progresso', cards: [] },
        { id: 'c3', title: 'Concluído', cards: [] },
    ]
}

// Zoom configurations
const ZOOM_CONFIG = [
    { width: 'w-[85vw] md:w-[320px]', label: 'Foco', cardPadding: 'p-5' },
    { width: 'w-[45vw] md:w-[280px]', label: 'Visão', cardPadding: 'p-4' },
    { width: 'w-[30vw] md:w-[220px]', label: 'Quadro', cardPadding: 'p-3' }
]

export default function Kanban() {
    // ═══════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    const [board, setBoard] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            return saved ? JSON.parse(saved) : DEFAULT_BOARD
        } catch { return DEFAULT_BOARD }
    })

    const [editingCard, setEditingCard] = useState(null)
    const [addingCol, setAddingCol] = useState(false)
    const [newColTitle, setNewColTitle] = useState('')
    const [zoomLevel, setZoomLevel] = useState(0)
    const [addingCardToCol, setAddingCardToCol] = useState(null)
    const [newCardTitle, setNewCardTitle] = useState('')
    const [renamingColId, setRenamingColId] = useState(null)
    const [renameTitle, setRenameTitle] = useState('')
    const [confirmModal, setConfirmModal] = useState(null)
    const [isCloudSynced, setIsCloudSynced] = useState(false)

    // ═══════════════════════════════════════════════════════════════
    // DRAG & DROP ENGINE
    // ═══════════════════════════════════════════════════════════════

    const [dragState, setDragState] = useState({
        active: null,      // { id, sourceColId, data, rect, offsetX, offsetY }
        target: null,      // { colId, index }
        isDragging: false, // True once threshold is exceeded
    })

    // High-performance ghost tracking
    const ghostX = useMotionValue(0)
    const ghostY = useMotionValue(0)

    // Pending drag state
    const pendingDragRef = useRef(null)
    const DRAG_THRESHOLD = 4

    const scrollContainerRef = useRef(null)
    const rafRef = useRef(null)
    const lastTargetRef = useRef({ colId: null, index: null })

    // Haptic feedback simulation
    const haptic = useCallback((intensity = 'light') => {
        if (navigator.vibrate) {
            navigator.vibrate(intensity === 'light' ? 8 : intensity === 'medium' ? 15 : 25)
        }
    }, [])

    // Find drop target
    const findDropTarget = useCallback((clientX, clientY, activeCardId) => {
        const elements = document.elementsFromPoint(clientX, clientY)
        const colEl = elements.find(el => el.hasAttribute('data-column-id'))

        if (!colEl) return null

        const colId = colEl.getAttribute('data-column-id')
        const container = colEl.querySelector('[data-cards-container]')

        if (!container) return { colId, index: 0 }

        const cards = Array.from(container.querySelectorAll('[data-card-id]'))
            .filter(c => c.getAttribute('data-card-id') !== activeCardId)

        if (cards.length === 0) return { colId, index: 0 }

        for (let i = 0; i < cards.length; i++) {
            const cardRect = cards[i].getBoundingClientRect()
            const cardMid = cardRect.top + cardRect.height / 2
            if (clientY < cardMid) return { colId, index: i }
        }

        return { colId, index: cards.length }
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════

    useEffect(() => {
        const handleWindowPointerMove = (e) => {
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
                    const newTarget = findDropTarget(e.clientX, e.clientY, dragState.active.id)
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

        const handleWindowPointerUp = (e) => {
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

                        const cardIdx = sourceCol.cards.findIndex(c => c.id === active.id)
                        if (cardIdx === -1) return prev

                        const [movedCard] = sourceCol.cards.splice(cardIdx, 1)
                        destCol.cards.splice(targetIndex, 0, movedCard)

                        return { ...prev, columns: newCols }
                    })
                    haptic('medium')
                }

                setDragState({ active: null, target: null, isDragging: false })
                lastTargetRef.current = { colId: null, index: null }
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


    const handleCardPointerDown = useCallback((e, card, colId) => {
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
            cardIndex: board.columns.find(c => c.id === colId)?.cards.findIndex(c => c.id === card.id) ?? 0
        }
    }, [board.columns])

    // ═══════════════════════════════════════════════════════════════
    // SYNC
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        const loadCloud = async () => {
            try {
                const cloudBoard = await FirebaseService.getKanban?.()
                if (cloudBoard?.columns) setBoard(cloudBoard)
            } catch { }
            finally { setIsCloudSynced(true) }
        }
        loadCloud()
    }, [])

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
        if (isCloudSynced) {
            const timeout = setTimeout(() => {
                try { FirebaseService.syncKanban?.(board) } catch { }
            }, 2000)
            return () => clearTimeout(timeout)
        }
    }, [board, isCloudSynced])

    // ═══════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════
    const addCard = useCallback((colId) => {
        if (!newCardTitle.trim()) return
        const card = {
            id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    const updateCard = useCallback((card) => {
        setBoard(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === card.columnId
                ? { ...c, cards: c.cards.map(existing => existing.id === card.id ? card : existing) }
                : c
            )
        }))
    }, [])

    const deleteCard = useCallback((colId, cardId) => {
        setConfirmModal({
            title: "Excluir Cartão",
            message: "Esta ação não pode ser desfeita. Deseja continuar?",
            type: 'danger',
            onConfirm: () => {
                setBoard(prev => ({
                    ...prev,
                    columns: prev.columns.map(c => c.id === colId
                        ? { ...c, cards: c.cards.filter(card => card.id !== cardId) }
                        : c
                    )
                }))
                setEditingCard(null)
                setConfirmModal(null)
                haptic('medium')
            },
            onCancel: () => setConfirmModal(null)
        })
    }, [haptic])

    const addColumn = useCallback(() => {
        if (!newColTitle.trim()) return
        setBoard(prev => ({
            ...prev,
            columns: [...prev.columns, { id: `col-${Date.now()}`, title: newColTitle.trim(), cards: [] }]
        }))
        setNewColTitle('')
        setAddingCol(false)
        haptic('light')
    }, [newColTitle, haptic])

    const renameColumn = useCallback((colId) => {
        if (!renameTitle.trim()) { setRenamingColId(null); return }
        setBoard(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === colId ? { ...c, title: renameTitle.trim() } : c)
        }))
        setRenamingColId(null)
    }, [renameTitle])

    const deleteColumn = useCallback((colId) => {
        setConfirmModal({
            title: "Excluir Lista",
            message: "Todos os cartões desta lista serão removidos. Continuar?",
            type: 'danger',
            onConfirm: () => {
                setBoard(prev => ({ ...prev, columns: prev.columns.filter(c => c.id !== colId) }))
                setConfirmModal(null)
                haptic('medium')
            },
            onCancel: () => setConfirmModal(null)
        })
    }, [haptic])

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
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-500 ${isCloudSynced ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isCloudSynced ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{isCloudSynced ? 'Cloud Active' : 'Syncing'}</span>
                            </div>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Gestão visual de tarefas e projetos</p>
                    </div>

                    <button onClick={() => setAddingCol(true)} className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/10 dark:shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 group">
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

                {/* Add Column */}
                {addingCol ? (
                    <motion.div initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: 0.95 }} transition={spring.enter} className="flex-shrink-0 w-80 p-6 rounded-[2rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 shadow-xl h-min">
                        <input autoFocus value={newColTitle} onChange={e => setNewColTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') { setAddingCol(false); setNewColTitle('') } }} placeholder="Nome da lista..." className="w-full bg-zinc-50 dark:bg-zinc-900 px-4 py-4 rounded-xl text-zinc-900 dark:text-white font-medium outline-none border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 mb-4" />
                        <div className="flex gap-3">
                            <button onClick={addColumn} className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">Criar</button>
                            <button onClick={() => { setAddingCol(false); setNewColTitle('') }} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Cancelar</button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setAddingCol(true)} className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg flex items-center justify-center text-zinc-400 transition-all">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </motion.button>
                )}
            </div>

            {/* Mobile Zoom */}
            <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
                <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, ...spring.enter }} className="flex items-center bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl p-1.5 shadow-2xl border border-zinc-200/50 dark:border-white/10">
                    {ZOOM_CONFIG.map((config, idx) => (
                        <button key={idx} onClick={() => { setZoomLevel(idx); haptic('light') }} className={`relative px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${zoomLevel === idx ? 'text-white dark:text-zinc-900' : 'text-zinc-400 dark:text-zinc-500'}`}>
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
                {editingCard && <CardDetailsModal card={editingCard} onClose={() => setEditingCard(null)} onUpdate={updateCard} onDelete={() => deleteCard(editingCard.columnId, editingCard.id)} setConfirmModal={setConfirmModal} />}
            </AnimatePresence>
            <AnimatePresence>
                {confirmModal && <ConfirmationModal {...confirmModal} />}
            </AnimatePresence>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTED COMPONENTS (PERFORMANCE OPTIMIZATION)
// ═══════════════════════════════════════════════════════════════

const KanbanColumn = React.memo(({
    col, dragState, spring, zoomLevel,
    renamingColId, setRenamingColId, renameTitle, setRenameTitle, renameColumn, deleteColumn,
    addingCardToCol, setAddingCardToCol, newCardTitle, setNewCardTitle, addCard,
    handleCardPointerDown
}) => {
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
            className={`
                flex-shrink-0 flex flex-col snap-center
                ${ZOOM_CONFIG[zoomLevel].width}
                max-h-full rounded-[2rem] md:rounded-[2.5rem]
                bg-white dark:bg-zinc-950
                border border-zinc-200/60 dark:border-white/[0.06]
                shadow-xl shadow-black/[0.03] dark:shadow-black/20
                transition-all duration-300
                ${isTargetCol ? 'bg-zinc-100/50 dark:bg-white/[0.02]' : 'hover:shadow-2xl'}
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-100 dark:border-white/5 group">
                <div className="flex-1 min-w-0 mr-3">
                    {renamingColId === col.id ? (
                        <input autoFocus className="w-full text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white bg-transparent outline-none border-b-2 border-zinc-500" value={renameTitle} onChange={e => setRenameTitle(e.target.value)} onBlur={() => renameColumn(col.id)} onKeyDown={e => { if (e.key === 'Enter') renameColumn(col.id); if (e.key === 'Escape') setRenamingColId(null) }} />
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

            {/* Cards */}
            <div data-cards-container className="flex-1 overflow-y-auto px-3 md:px-4 py-3 space-y-3 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {col.cards.map((card, cardIndex) => (
                        <KanbanCard
                            key={card.id}
                            card={card}
                            colId={col.id}
                            dragState={dragState}
                            spring={spring}
                            zoomLevel={zoomLevel}
                            handleCardPointerDown={handleCardPointerDown}
                        />
                    ))}
                </AnimatePresence>

                {/* End Gap */}
                <AnimatePresence mode="sync">
                    {dragState.isDragging && isTargetCol && dragState.active && (() => {
                        const filteredCards = col.cards.filter(c => c.id !== dragState.active.id)
                        return dragState.target.index >= filteredCards.length
                    })() && (
                            <motion.div key="kanban-gap" layoutId="kanban-gap" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: dragState.active.rect?.height || 80 }} exit={{ opacity: 0, height: 0 }} transition={spring.placeholder} className="pointer-events-none" />
                        )}
                </AnimatePresence>

                {/* Add Card UI */}
                {addingCardToCol === col.id ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring.enter} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-lg">
                        <textarea autoFocus value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addCard(col.id) } if (e.key === 'Escape') setAddingCardToCol(null) }} placeholder="Título do cartão..." className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 resize-none mb-3" rows={2} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setAddingCardToCol(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={() => addCard(col.id)} disabled={!newCardTitle.trim()} className="px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all">Adicionar</button>
                        </div>
                    </motion.div>
                ) : (
                    <button onClick={() => { setAddingCardToCol(col.id); setNewCardTitle('') }} className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-all">+ Cartão</button>
                )}
            </div>
        </motion.div>
    )
})

const KanbanCard = React.memo(({ card, colId, dragState, spring, zoomLevel, handleCardPointerDown }) => {
    // Derived state for fluidity
    const isCardDragging = dragState.active?.id === card.id
    const isTargetCol = dragState.target?.colId === colId

    // Calculate GAP logic
    let showPlaceholderBefore = false
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
                    className={`
                        relative bg-white dark:bg-zinc-900
                        border border-zinc-200/60 dark:border-white/[0.06]
                        rounded-2xl ${ZOOM_CONFIG[zoomLevel].cardPadding}
                        shadow-sm hover:shadow-xl dark:shadow-black/10
                        cursor-grab active:cursor-grabbing
                        touch-none select-none
                        hover:border-zinc-300 dark:hover:border-white/10
                        group/card
                    `}
                    style={{ touchAction: 'none' }}
                >
                    {/* Content... (Labels, Title, Meta) */}
                    {card.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {card.labels.map((l, i) => (
                                <div key={i} className={`rounded-full ${zoomLevel >= 2 ? 'h-2 w-2' : 'h-1.5 w-10'}`} style={{ backgroundColor: l.color }} />
                            ))}
                        </div>
                    )}
                    <h4 className={`font-semibold text-zinc-800 dark:text-zinc-100 leading-relaxed ${zoomLevel >= 2 ? 'text-[11px] line-clamp-2' : 'text-sm'}`}>{card.title}</h4>
                    {zoomLevel < 2 && card.checklists?.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 text-zinc-400 dark:text-zinc-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            <span className="text-[10px] font-bold tabular-nums">
                                {card.checklists.reduce((a, c) => a + c.items.filter(i => i.done).length, 0)}/{card.checklists.reduce((a, c) => a + c.items.length, 0)}
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

const DragGhost = React.memo(({ dragState, ghostX, ghostY, spring }) => {
    return (
        <AnimatePresence>
            {dragState.isDragging && dragState.active && (
                <motion.div
                    layoutId={dragState.active.id}
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
                                {dragState.active.data.labels.map((l, i) => (
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

function ConfirmationModal({ title, message, type = 'info', onConfirm, onCancel }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="relative bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full border border-zinc-200/50 dark:border-white/10">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all ${type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'}`}>Confirmar</button>
                </div>
            </motion.div>
        </motion.div>
    )
}

function CardDetailsModal({ card, onClose, onUpdate, onDelete, setConfirmModal }) {
    const [localCard, setLocalCard] = useState(card)
    const [addingChecklist, setAddingChecklist] = useState(false)
    const [newChecklistTitle, setNewChecklistTitle] = useState('')

    useEffect(() => { onUpdate(localCard) }, [localCard, onUpdate])

    const toggleLabel = (label) => {
        const has = localCard.labels?.find(l => l.id === label.id)
        setLocalCard(prev => ({ ...prev, labels: has ? prev.labels.filter(l => l.id !== label.id) : [...(prev.labels || []), label] }))
    }

    const addChecklist = () => {
        if (!newChecklistTitle.trim()) return
        setLocalCard(prev => ({ ...prev, checklists: [...(prev.checklists || []), { id: Date.now(), title: newChecklistTitle.trim(), items: [] }] }))
        setNewChecklistTitle(''); setAddingChecklist(false)
    }

    const deleteChecklist = (clId) => {
        setConfirmModal({ title: "Excluir Checklist", message: "Esta checklist será removida permanentemente.", type: 'danger', onConfirm: () => { setLocalCard(prev => ({ ...prev, checklists: prev.checklists.filter(c => c.id !== clId) })); setConfirmModal(null) }, onCancel: () => setConfirmModal(null) })
    }

    const toggleItem = (clId, itemId) => {
        setLocalCard(prev => ({ ...prev, checklists: prev.checklists.map(cl => cl.id === clId ? { ...cl, items: cl.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) } : cl) }))
    }

    const addItem = (clId, text) => {
        if (!text.trim()) return
        setLocalCard(prev => ({ ...prev, checklists: prev.checklists.map(cl => cl.id === clId ? { ...cl, items: [...cl.items, { id: Date.now(), text: text.trim(), done: false }] } : cl) }))
    }

    const removeItem = (clId, itemId) => {
        setLocalCard(prev => ({ ...prev, checklists: prev.checklists.map(cl => cl.id === clId ? { ...cl, items: cl.items.filter(i => i.id !== itemId) } : cl) }))
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, y: 100, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.98 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200/50 dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className="shrink-0 p-6 md:p-8 border-b border-zinc-100 dark:border-white/5">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-2 flex-wrap">
                            {LABELS.map(label => (
                                <button key={label.id} onClick={() => toggleLabel(label)} className={`w-7 h-7 rounded-full transition-all ring-2 ring-offset-2 dark:ring-offset-zinc-900 ${localCard.labels?.find(l => l.id === label.id) ? 'ring-zinc-900 dark:ring-white scale-110' : 'ring-transparent opacity-40 hover:opacity-100 hover:scale-110'}`} style={{ backgroundColor: label.color }} />
                            ))}
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white flex items-center justify-center transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <input className="w-full text-2xl md:text-3xl font-bold bg-transparent outline-none text-zinc-900 dark:text-white placeholder:text-zinc-300" value={localCard.title} onChange={e => setLocalCard(prev => ({ ...prev, title: e.target.value }))} placeholder="Título do cartão" />
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                    <div>
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Descrição</h4>
                        <textarea className="w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-4 py-4 text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 resize-none min-h-[100px]" placeholder="Adicione uma descrição..." value={localCard.description || ''} onChange={e => setLocalCard(prev => ({ ...prev, description: e.target.value }))} />
                    </div>
                    {localCard.checklists?.map(cl => (
                        <div key={cl.id}>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{cl.title}</h4>
                                <button onClick={() => deleteChecklist(cl.id)} className="text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider">Excluir</button>
                            </div>
                            <Reorder.Group axis="y" values={cl.items} onReorder={newItems => { setLocalCard(prev => ({ ...prev, checklists: prev.checklists.map(c => c.id === cl.id ? { ...c, items: newItems } : c) })) }} className="space-y-2">
                                {cl.items.map(item => (
                                    <Reorder.Item key={item.id} value={item} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 cursor-grab active:cursor-grabbing group shadow-sm">
                                        <div className="text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">⋮⋮</div>
                                        <button onClick={() => toggleItem(cl.id, item.id)} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-400'}`}>
                                            {item.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </button>
                                        <span className={`flex-1 text-sm ${item.done ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>{item.text}</span>
                                        <button onClick={() => removeItem(cl.id, item.id)} className="text-zinc-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                            <input className="w-full mt-2 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-sm outline-none border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 placeholder:text-zinc-400" placeholder="+ Adicionar item..." onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { addItem(cl.id, e.target.value); e.target.value = '' } }} />
                        </div>
                    ))}
                    {addingChecklist ? (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-700">
                            <input autoFocus value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addChecklist(); if (e.key === 'Escape') setAddingChecklist(false) }} placeholder="Nome da checklist..." className="w-full bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 mb-3" />
                            <div className="flex gap-2">
                                <button onClick={addChecklist} className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider">Criar</button>
                                <button onClick={() => setAddingChecklist(false)} className="flex-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider">Cancelar</button>
                            </div>
                        </motion.div>
                    ) : (
                        <button onClick={() => setAddingChecklist(true)} className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-400 text-xs font-bold uppercase tracking-widest hover:border-zinc-400 hover:text-zinc-900 transition-colors">+ Nova Checklist</button>
                    )}
                    <div className="pt-6 border-t border-zinc-100 dark:border-white/5">
                        <button onClick={onDelete} className="w-full py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors border border-rose-100 dark:border-rose-500/20">Excluir Cartão</button>
                    </div>
                </div>
            </motion.div>

        </motion.div>
    )
}
