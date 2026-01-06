import React, { useState, useCallback, useEffect, useRef, createContext, useContext, ReactNode } from 'react'

/**
 * ═══════════════════════════════════════════════════════════════════
 * UNDO/REDO HOOK — Histórico de mudanças
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Hook genérico para adicionar undo/redo a qualquer estado.
 * Suporta Ctrl+Z / Ctrl+Y automaticamente.
 * 
 * Usage:
 *   const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo(initialState)
 *   
 *   // Com limite de histórico:
 *   const { state, setState } = useUndoRedo(initialState, { maxHistory: 50 })
 */

interface UseUndoRedoOptions {
    maxHistory?: number
    enableKeyboardShortcuts?: boolean
}

interface UseUndoRedoReturn<T> {
    state: T
    setState: (newState: T | ((prev: T) => T)) => void
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean
    resetHistory: (newState?: T) => void
    clearHistory: () => void
    historyLength: number
    futureLength: number
}

export const useUndoRedo = <T,>(
    initialState: T,
    options: UseUndoRedoOptions = {}
): UseUndoRedoReturn<T> => {
    const {
        maxHistory = 100,
        enableKeyboardShortcuts = true
    } = options

    // Past states (for undo)
    const [past, setPast] = useState<T[]>([])

    // Current state
    const [present, setPresent] = useState<T>(initialState)

    // Future states (for redo)
    const [future, setFuture] = useState<T[]>([])

    // Track if we're in the middle of undo/redo (to avoid adding to history)
    const isUndoingRef = useRef(false)

    // Can undo/redo
    const canUndo = past.length > 0
    const canRedo = future.length > 0

    // Set state (adds to history)
    const setState = useCallback((newState: T | ((prev: T) => T)) => {
        if (isUndoingRef.current) {
            isUndoingRef.current = false
            setPresent(prev => typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState)
            return
        }

        setPresent(prev => {
            const nextState = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState

            // Don't add to history if state is the same
            if (JSON.stringify(nextState) === JSON.stringify(prev)) {
                return prev
            }

            setPast(prevPast => {
                const newPast = [...prevPast, prev]
                // Limit history size
                if (newPast.length > maxHistory) {
                    return newPast.slice(-maxHistory)
                }
                return newPast
            })
            setFuture([]) // Clear future on new change
            return nextState
        })
    }, [maxHistory])

    // Undo
    const undo = useCallback(() => {
        if (past.length === 0) return

        const previous = past[past.length - 1]
        const newPast = past.slice(0, -1)

        isUndoingRef.current = true
        setPast(newPast)
        setPresent(previous as T)
        setFuture(prev => [present, ...prev])
    }, [past, present])

    // Redo
    const redo = useCallback(() => {
        if (future.length === 0) return

        const next = future[0]
        const newFuture = future.slice(1)

        isUndoingRef.current = true
        setPast(prev => [...prev, present])
        setPresent(next as T)
        setFuture(newFuture)
    }, [past, present, future])

    // Reset history
    const resetHistory = useCallback((newState: T = initialState) => {
        setPast([])
        setPresent(newState)
        setFuture([])
    }, [initialState])

    // Clear history (keep current state)
    const clearHistory = useCallback(() => {
        setPast([])
        setFuture([])
    }, [])

    // Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
    useEffect(() => {
        if (!enableKeyboardShortcuts) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input
            const activeElement = document.activeElement as HTMLElement | null
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement?.tagName ?? '')
            if (isTyping) return

            // Ctrl+Z / Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                undo()
            }

            // Ctrl+Y / Cmd+Y / Ctrl+Shift+Z
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                redo()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [undo, redo, enableKeyboardShortcuts])

    return {
        state: present,
        setState,
        undo,
        redo,
        canUndo,
        canRedo,
        resetHistory,
        clearHistory,
        historyLength: past.length,
        futureLength: future.length
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════
 * UNDO/REDO CONTEXT — Para estado global
 * ═══════════════════════════════════════════════════════════════════
 */

const UndoRedoContext = createContext<UseUndoRedoReturn<unknown> | null>(null)

interface UndoRedoProviderProps<T> {
    children: ReactNode
    initialState: T
    options?: UseUndoRedoOptions
}

export const UndoRedoProvider = <T,>({
    children,
    initialState,
    options
}: UndoRedoProviderProps<T>): React.ReactElement => {
    const undoRedo = useUndoRedo<T>(initialState, options)

    return (
        <UndoRedoContext.Provider value={undoRedo as UseUndoRedoReturn<unknown>}>
            {children}
        </UndoRedoContext.Provider>
    )
}

export const useUndoRedoContext = <T,>(): UseUndoRedoReturn<T> => {
    const context = useContext(UndoRedoContext)
    if (!context) {
        throw new Error('useUndoRedoContext must be used within UndoRedoProvider')
    }
    return context as UseUndoRedoReturn<T>
}

/**
 * ═══════════════════════════════════════════════════════════════════
 * UNDO BUTTON COMPONENT — UI para undo/redo
 * ═══════════════════════════════════════════════════════════════════
 */
interface UndoRedoButtonsProps {
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean
    className?: string
}

export const UndoRedoButtons: React.FC<UndoRedoButtonsProps> = ({
    undo,
    redo,
    canUndo,
    canRedo,
    className = ''
}) => (
    <div className={`flex items-center gap-1 ${className}`}>
        <button
            onClick={undo}
            disabled={!canUndo}
            aria-label="Desfazer (Ctrl+Z)"
            title="Desfazer (Ctrl+Z)"
            className={`p-2 rounded-lg transition-colors ${canUndo
                ? 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                }`}
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
        </button>
        <button
            onClick={redo}
            disabled={!canRedo}
            aria-label="Refazer (Ctrl+Y)"
            title="Refazer (Ctrl+Y)"
            className={`p-2 rounded-lg transition-colors ${canRedo
                ? 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                }`}
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
        </button>
    </div>
)

export default useUndoRedo
