// ═══════════════════════════════════════════════════════════════════
// COMMAND PALETTE — Spotlight/Alfred Style (⌘K)
// Refactored: 543 → ~140 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Icons, CommandItem, CommandPaletteProps, DataItem, fuzzySearch, calculateExpression, CommandScrollLock, useCommandPalette } from '../commandPaletteModules'

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, onAction, data = {} }) => {
    const [query, setQuery] = useState(''); const [selectedIndex, setSelectedIndex] = useState(0)
    const [recentActions, setRecentActions] = useState<CommandItem[]>([])
    const inputRef = useRef<HTMLInputElement>(null); const resultsRef = useRef<HTMLDivElement>(null)

    const navItems = useMemo<CommandItem[]>(() => [
        { id: 'nav-recipes', type: 'navigate', name: 'Ir para Receitas', view: 'recipes', icon: Icons.recipe },
        { id: 'nav-products', type: 'navigate', name: 'Ir para Produtos', view: 'products', icon: Icons.product },
        { id: 'nav-inventory', type: 'navigate', name: 'Ir para Estoque', view: 'inventory', icon: Icons.ingredient },
        { id: 'nav-suppliers', type: 'navigate', name: 'Ir para Fornecedores', view: 'suppliers', icon: Icons.supplier },
        { id: 'nav-costs', type: 'navigate', name: 'Ir para Financeiro', view: 'costs', icon: Icons.navigate },
        { id: 'nav-kanban', type: 'navigate', name: 'Ir para Kanban', view: 'kanban', icon: Icons.navigate },
    ], [])

    const quickActions = useMemo<CommandItem[]>(() => [
        { id: 'action-new-recipe', type: 'action', name: 'Criar nova receita', action: 'new-recipe', icon: Icons.create },
        { id: 'action-new-product', type: 'action', name: 'Criar novo produto', action: 'new-product', icon: Icons.create },
        { id: 'action-new-ingredient', type: 'action', name: 'Adicionar ingrediente', action: 'new-ingredient', icon: Icons.create },
    ], [])

    const allItems = useMemo<CommandItem[]>(() => {
        const items: CommandItem[] = []
        if (data.recipes) data.recipes.forEach(r => items.push({ id: `recipe-${r.id}`, type: 'recipe', name: r.name, subtitle: `${r.ingredients?.length || 0} ingredientes`, data: r, icon: Icons.recipe }))
        if (data.products) data.products.forEach(p => items.push({ id: `product-${p.id}`, type: 'product', name: p.name, subtitle: p.category || '', data: p, icon: Icons.product }))
        if (data.ingredients) data.ingredients.forEach(i => items.push({ id: `ingredient-${i.id}`, type: 'ingredient', name: i.name, subtitle: i.category || '', data: i, icon: Icons.ingredient }))
        if (data.suppliers) data.suppliers.forEach(s => items.push({ id: `supplier-${s.id}`, type: 'supplier', name: s.name, subtitle: s.contact || '', data: s, icon: Icons.supplier }))
        return items
    }, [data])

    const results = useMemo<CommandItem[]>(() => {
        if (!query.trim()) return [...(recentActions.length > 0 ? [{ id: 'section-recent', type: 'section' as const, name: 'Recentes' }] : []), ...recentActions.slice(0, 3), { id: 'section-quick', type: 'section' as const, name: 'Ações Rápidas' }, ...quickActions, { id: 'section-nav', type: 'section' as const, name: 'Navegação' }, ...navItems]
        const calcResult = calculateExpression(query); const calcItem: CommandItem[] = calcResult !== null ? [{ id: 'calc-result', type: 'calculator', name: `= ${calcResult.toLocaleString('pt-BR')}`, subtitle: query, icon: Icons.calculator }] : []
        return [...calcItem, ...fuzzySearch(query, [...allItems, ...navItems, ...quickActions], ['name', 'subtitle']).slice(0, 10)]
    }, [query, allItems, navItems, quickActions, recentActions])

    const selectableResults = results.filter(r => r.type !== 'section')

    const handleSelect = useCallback((item: CommandItem | undefined) => {
        if (!item) return
        if (item.type !== 'section' && item.type !== 'calculator') setRecentActions(prev => [{ ...item, icon: Icons.history }, ...prev.filter(a => a.id !== item.id)].slice(0, 5))
        switch (item.type) {
            case 'navigate': if (item.view) onNavigate?.(item.view); break
            case 'action': if (item.action) onAction?.(item.action, item.data); break
            case 'recipe': case 'product': case 'ingredient': case 'supplier': onAction?.(`view-${item.type}`, item.data); break
            case 'calculator': navigator.clipboard?.writeText(item.name.replace('= ', '')); break
        }
        onClose()
    }, [onNavigate, onAction, onClose])

    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (!isOpen) return
            switch (e.key) { case 'ArrowDown': e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, selectableResults.length - 1)); break; case 'ArrowUp': e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); break; case 'Enter': e.preventDefault(); handleSelect(selectableResults[selectedIndex]); break; case 'Escape': e.preventDefault(); onClose(); break }
        }
        window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, selectedIndex, selectableResults, handleSelect, onClose])

    useEffect(() => { if (isOpen) { setQuery(''); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 50) } }, [isOpen])
    useEffect(() => { if (resultsRef.current) { const selected = resultsRef.current.querySelector('[data-selected="true"]'); selected?.scrollIntoView({ block: 'nearest' }) } }, [selectedIndex])

    if (!isOpen || typeof document === 'undefined') return null

    return createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]" onClick={onClose}>
            <CommandScrollLock /><div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xl mx-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4 border-b border-zinc-200/50 dark:border-white/10">
                    <div className="text-zinc-400 dark:text-zinc-500">{Icons.search}</div>
                    <input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }} placeholder="Buscar receitas, produtos, ações..."
                        className="flex-1 bg-transparent text-[17px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none" autoComplete="off" />
                    {query && <button onClick={() => setQuery('')} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">{Icons.close}</button>}
                </div>
                <div ref={resultsRef} className="max-h-[400px] overflow-y-auto overscroll-contain py-2">
                    {results.length === 0 ? <div className="px-5 py-8 text-center"><div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">{Icons.search}</div><p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Nenhum resultado encontrado</p></div>
                        : results.map((item) => item.type === 'section' ? <div key={item.id} className="px-5 py-2 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{item.name}</div>
                            : <button key={item.id} data-selected={selectableResults.findIndex(r => r.id === item.id) === selectedIndex} onClick={() => handleSelect(item)} onMouseEnter={() => setSelectedIndex(selectableResults.findIndex(r => r.id === item.id))}
                                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${selectableResults.findIndex(r => r.id === item.id) === selectedIndex ? 'bg-indigo-500 text-white' : 'text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5'}`}>
                                <div className={`shrink-0 ${selectableResults.findIndex(r => r.id === item.id) === selectedIndex ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>{item.icon}</div>
                                <div className="flex-1 min-w-0"><div className="font-semibold text-[15px] truncate">{item.name}</div>{item.subtitle && <div className={`text-[13px] truncate ${selectableResults.findIndex(r => r.id === item.id) === selectedIndex ? 'text-white/70' : 'text-zinc-500 dark:text-zinc-400'}`}>{item.subtitle}</div>}</div>
                                {selectableResults.findIndex(r => r.id === item.id) === selectedIndex && <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 text-[11px] font-bold">{Icons.return}<span>Enter</span></div>}
                            </button>)}
                </div>
                <div className="px-5 py-3 border-t border-zinc-200/50 dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                    <div className="flex items-center gap-4"><span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">↑↓</kbd>navegar</span><span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">↵</kbd>selecionar</span><span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">esc</kbd>fechar</span></div>
                    <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">⌘</kbd><kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">K</kbd></div>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

export { useCommandPalette }
export default CommandPalette
