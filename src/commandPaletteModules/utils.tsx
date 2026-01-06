// ═══════════════════════════════════════════════════════════════════
// COMMAND PALETTE MODULES — Utils & Hook
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { UseCommandPaletteResult } from './types'

// Fuzzy Search
export function fuzzySearch<T extends { name?: string; subtitle?: string }>(query: string, items: T[], keys: (keyof T)[] = ['name' as keyof T]): T[] {
    if (!query) return items
    const searchTerms = query.toLowerCase().split(' ')
    return items.map(item => {
        let score = 0
        for (const key of keys) { const value = String(item[key] || '').toLowerCase(); for (const term of searchTerms) { if (value.includes(term)) { score += value.startsWith(term) ? 3 : 1 } } }
        return { item, score }
    }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).map(({ item }) => item)
}

// Calculator
export function calculateExpression(expr: string): number | null {
    try {
        const cleaned = expr.toLowerCase().replace(/[,]/g, '.').replace(/[gkg ml l un]/g, '').replace(/x/g, '*').replace(/÷/g, '/').trim()
        if (!/^[0-9+\-*/.() ]+$/.test(cleaned)) return null
        const result = Function('"use strict"; return (' + cleaned + ')')() as number
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) return result
        return null
    } catch { return null }
}

// Scroll Lock Component
export function CommandScrollLock(): null { useScrollLock(true); return null }

// Hook for Global Shortcut
export function useCommandPalette(): UseCommandPaletteResult {
    const [isOpen, setIsOpen] = useState(false)
    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsOpen(prev => !prev) } }
        window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])
    return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false), toggle: () => setIsOpen(prev => !prev) }
}
