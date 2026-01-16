/**
 * useUndoRedo — History Management Hook
 * 
 * Provides undo/redo functionality with keyboard shortcuts (Cmd+Z, Cmd+Shift+Z).
 * @author Padoca Engineering Team
 */

import { useState, useEffect, useCallback } from 'react'

interface UndoRedoState<T> {
    past: T[]
    present: T
    future: T[]
}

interface UseUndoRedoReturn<T> {
    state: T
    setState: (newState: T) => void
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean
    clear: () => void
}

export function useUndoRedo<T>(initialState: T, maxHistory: number = 50): UseUndoRedoReturn<T> {
    const [history, setHistory] = useState<UndoRedoState<T>>({
        past: [],
        present: initialState,
        future: []
    })

    const setState = useCallback((newState: T) => {
        setHistory(prev => ({
            past: [...prev.past, prev.present].slice(-maxHistory),
            present: newState,
            future: []
        }))
    }, [maxHistory])

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev
            const previous = prev.past[prev.past.length - 1]!
            const newPast = prev.past.slice(0, -1)
            return {
                past: newPast,
                present: previous,
                future: [prev.present, ...prev.future]
            }
        })
    }, [])

    const redo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev
            const next = prev.future[0]!
            const newFuture = prev.future.slice(1)
            return {
                past: [...prev.past, prev.present],
                present: next,
                future: newFuture
            }
        })
    }, [])

    const clear = useCallback(() => {
        setHistory(prev => ({
            past: [],
            present: prev.present,
            future: []
        }))
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault()
                if (e.shiftKey) {
                    redo()
                } else {
                    undo()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [undo, redo])

    return {
        state: history.present,
        setState,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        clear
    }
}
