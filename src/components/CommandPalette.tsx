import React, { useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useScrollLock } from '../hooks/useScrollLock'

/**
 * ═══════════════════════════════════════════════════════════════════
 * COMMAND PALETTE — Spotlight/Alfred Style (⌘K)
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ TYPES ═══
interface DataItem {
    id: string | number
    name: string
    category?: string
    ingredients?: unknown[]
    contact?: string
}

interface CommandData {
    recipes?: DataItem[]
    products?: DataItem[]
    ingredients?: DataItem[]
    suppliers?: DataItem[]
}

interface CommandItem {
    id: string
    type: 'section' | 'navigate' | 'action' | 'recipe' | 'product' | 'ingredient' | 'supplier' | 'calculator'
    name: string
    subtitle?: string
    icon?: ReactNode
    view?: string
    action?: string
    data?: DataItem
}

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
    onNavigate?: (view: string) => void
    onAction?: (action: string, data?: DataItem) => void
    data?: CommandData
}

interface UseCommandPaletteResult {
    isOpen: boolean
    open: () => void
    close: () => void
    toggle: () => void
}

// ═══ ICONS ═══
const Icons = {
    search: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    close: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    recipe: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    ),
    product: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
    ),
    ingredient: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    ),
    supplier: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    navigate: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
    ),
    create: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
    ),
    calculator: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    history: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    return: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
    )
}

// ═══ FUZZY SEARCH ═══
const fuzzySearch = <T extends { name?: string; subtitle?: string }>(
    query: string,
    items: T[],
    keys: (keyof T)[] = ['name' as keyof T]
): T[] => {
    if (!query) return items

    const searchTerms = query.toLowerCase().split(' ')

    return items
        .map(item => {
            let score = 0
            for (const key of keys) {
                const value = String(item[key] || '').toLowerCase()
                for (const term of searchTerms) {
                    if (value.includes(term)) {
                        score += value.startsWith(term) ? 3 : 1
                    }
                }
            }
            return { item, score }
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item)
}

// ═══ CALCULATOR ═══
const calculateExpression = (expr: string): number | null => {
    try {
        // Parse common patterns like "250g x 3" or "100 + 50"
        const cleaned = expr
            .toLowerCase()
            .replace(/[,]/g, '.')
            .replace(/[gkg ml l un]/g, '')
            .replace(/x/g, '*')
            .replace(/÷/g, '/')
            .trim()

        // Only allow safe characters
        if (!/^[0-9+\-*/.() ]+$/.test(cleaned)) return null

        const result = Function('"use strict"; return (' + cleaned + ')')() as number
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            return result
        }
        return null
    } catch {
        return null
    }
}

// ═══ SCROLL LOCK ═══
const CommandScrollLock: React.FC = () => {
    useScrollLock(true)
    return null
}

// ═══ COMMAND PALETTE COMPONENT ═══
const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    onNavigate,
    onAction,
    data = {}
}) => {
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [recentActions, setRecentActions] = useState<CommandItem[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const resultsRef = useRef<HTMLDivElement>(null)

    // Navigation items
    const navItems = useMemo<CommandItem[]>(() => [
        { id: 'nav-recipes', type: 'navigate', name: 'Ir para Receitas', view: 'recipes', icon: Icons.recipe },
        { id: 'nav-products', type: 'navigate', name: 'Ir para Produtos', view: 'products', icon: Icons.product },
        { id: 'nav-inventory', type: 'navigate', name: 'Ir para Estoque', view: 'inventory', icon: Icons.ingredient },
        { id: 'nav-suppliers', type: 'navigate', name: 'Ir para Fornecedores', view: 'suppliers', icon: Icons.supplier },
        { id: 'nav-costs', type: 'navigate', name: 'Ir para Financeiro', view: 'costs', icon: Icons.navigate },
        { id: 'nav-kanban', type: 'navigate', name: 'Ir para Kanban', view: 'kanban', icon: Icons.navigate },
    ], [])

    // Quick actions
    const quickActions = useMemo<CommandItem[]>(() => [
        { id: 'action-new-recipe', type: 'action', name: 'Criar nova receita', action: 'new-recipe', icon: Icons.create },
        { id: 'action-new-product', type: 'action', name: 'Criar novo produto', action: 'new-product', icon: Icons.create },
        { id: 'action-new-ingredient', type: 'action', name: 'Adicionar ingrediente', action: 'new-ingredient', icon: Icons.create },
    ], [])

    // Combine all searchable items
    const allItems = useMemo<CommandItem[]>(() => {
        const items: CommandItem[] = []

        // Add data items
        if (data.recipes) {
            data.recipes.forEach(r => items.push({
                id: `recipe-${r.id}`,
                type: 'recipe',
                name: r.name,
                subtitle: `${r.ingredients?.length || 0} ingredientes`,
                data: r,
                icon: Icons.recipe
            }))
        }

        if (data.products) {
            data.products.forEach(p => items.push({
                id: `product-${p.id}`,
                type: 'product',
                name: p.name,
                subtitle: p.category || '',
                data: p,
                icon: Icons.product
            }))
        }

        if (data.ingredients) {
            data.ingredients.forEach(i => items.push({
                id: `ingredient-${i.id}`,
                type: 'ingredient',
                name: i.name,
                subtitle: i.category || '',
                data: i,
                icon: Icons.ingredient
            }))
        }

        if (data.suppliers) {
            data.suppliers.forEach(s => items.push({
                id: `supplier-${s.id}`,
                type: 'supplier',
                name: s.name,
                subtitle: s.contact || '',
                data: s,
                icon: Icons.supplier
            }))
        }

        return items
    }, [data])

    // Filter results based on query
    const results = useMemo<CommandItem[]>(() => {
        if (!query.trim()) {
            // Show recent actions and quick actions when empty
            return [
                ...(recentActions.length > 0 ? [{ id: 'section-recent', type: 'section' as const, name: 'Recentes' }] : []),
                ...recentActions.slice(0, 3),
                { id: 'section-quick', type: 'section' as const, name: 'Ações Rápidas' },
                ...quickActions,
                { id: 'section-nav', type: 'section' as const, name: 'Navegação' },
                ...navItems
            ]
        }

        // Check for calculator expression
        const calcResult = calculateExpression(query)
        const calcItem: CommandItem[] = calcResult !== null ? [{
            id: 'calc-result',
            type: 'calculator',
            name: `= ${calcResult.toLocaleString('pt-BR')}`,
            subtitle: query,
            icon: Icons.calculator
        }] : []

        // Search all items
        const searchResults = fuzzySearch(query, [...allItems, ...navItems, ...quickActions], ['name', 'subtitle'])

        return [
            ...calcItem,
            ...searchResults.slice(0, 10)
        ]
    }, [query, allItems, navItems, quickActions, recentActions])

    // Filter out section headers for selection
    const selectableResults = results.filter(r => r.type !== 'section')

    // Handle selection
    const handleSelect = useCallback((item: CommandItem | undefined): void => {
        if (!item) return

        // Add to recent actions
        if (item.type !== 'section' && item.type !== 'calculator') {
            setRecentActions(prev => {
                const filtered = prev.filter(a => a.id !== item.id)
                return [{ ...item, icon: Icons.history }, ...filtered].slice(0, 5)
            })
        }

        switch (item.type) {
            case 'navigate':
                if (item.view) onNavigate?.(item.view)
                break
            case 'action':
                if (item.action) onAction?.(item.action, item.data)
                break
            case 'recipe':
            case 'product':
            case 'ingredient':
            case 'supplier':
                onAction?.(`view-${item.type}`, item.data)
                break
            case 'calculator':
                // Copy result to clipboard
                navigator.clipboard?.writeText(item.name.replace('= ', ''))
                break
        }

        onClose()
    }, [onNavigate, onAction, onClose])

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
            if (!isOpen) return

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex(i => Math.min(i + 1, selectableResults.length - 1))
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex(i => Math.max(i - 1, 0))
                    break
                case 'Enter':
                    e.preventDefault()
                    handleSelect(selectableResults[selectedIndex])
                    break
                case 'Escape':
                    e.preventDefault()
                    onClose()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, selectedIndex, selectableResults, handleSelect, onClose])

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setQuery('')
            setSelectedIndex(0)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isOpen])

    // Scroll selected item into view
    useEffect(() => {
        if (resultsRef.current) {
            const selected = resultsRef.current.querySelector('[data-selected="true"]')
            selected?.scrollIntoView({ block: 'nearest' })
        }
    }, [selectedIndex])

    if (!isOpen || typeof document === 'undefined') return null

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]"
            onClick={onClose}
        >
            <CommandScrollLock />

            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />

            {/* Palette */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xl mx-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden"
            >
                {/* Search Input */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-zinc-200/50 dark:border-white/10">
                    <div className="text-zinc-400 dark:text-zinc-500">
                        {Icons.search}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setSelectedIndex(0)
                        }}
                        placeholder="Buscar receitas, produtos, ações..."
                        className="flex-1 bg-transparent text-[17px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            {Icons.close}
                        </button>
                    )}
                </div>

                {/* Results */}
                <div
                    ref={resultsRef}
                    className="max-h-[400px] overflow-y-auto overscroll-contain py-2"
                >
                    {results.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                {Icons.search}
                            </div>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Nenhum resultado encontrado
                            </p>
                        </div>
                    ) : (
                        results.map((item) => {
                            if (item.type === 'section') {
                                return (
                                    <div
                                        key={item.id}
                                        className="px-5 py-2 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider"
                                    >
                                        {item.name}
                                    </div>
                                )
                            }

                            const selectableIndex = selectableResults.findIndex(r => r.id === item.id)
                            const isSelected = selectableIndex === selectedIndex

                            return (
                                <button
                                    key={item.id}
                                    data-selected={isSelected}
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setSelectedIndex(selectableIndex)}
                                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${isSelected
                                        ? 'bg-indigo-500 text-white'
                                        : 'text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className={`shrink-0 ${isSelected ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-[15px] truncate">
                                            {item.name}
                                        </div>
                                        {item.subtitle && (
                                            <div className={`text-[13px] truncate ${isSelected ? 'text-white/70' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                {item.subtitle}
                                            </div>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 text-[11px] font-bold">
                                            {Icons.return}
                                            <span>Enter</span>
                                        </div>
                                    )}
                                </button>
                            )
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-zinc-200/50 dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">↑↓</kbd>
                            navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">↵</kbd>
                            selecionar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">esc</kbd>
                            fechar
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">⌘</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">K</kbd>
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

// ═══ HOOK FOR GLOBAL SHORTCUT ═══
export const useCommandPalette = (): UseCommandPaletteResult => {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
            // ⌘K (Mac) or Ctrl+K (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(prev => !prev)
    }
}

export default CommandPalette
