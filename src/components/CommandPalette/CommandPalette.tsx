// ═══════════════════════════════════════════════════════════════════
// COMMAND PALETTE — Spotlight-style quick actions (⌘K)
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { SHORTCUT_LIST } from '../../hooks/useKeyboardShortcuts'

interface CommandItem {
    id: string
    label: string
    category: 'navigation' | 'action' | 'settings'
    icon: React.ReactNode
    onSelect: () => void
    shortcut?: string
}

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
}

const NAV_ICONS = {
    '/': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    '/inventory': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    '/recipes': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    '/fichatecnica': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    '/products': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
    '/costs': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    '/suppliers': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    '/kanban': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>,
    '/padoca-ai': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const [search, setSearch] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()

    // Build command items
    const commands = useMemo<CommandItem[]>(() => {
        return SHORTCUT_LIST.map(s => ({
            id: s.path,
            label: s.description,
            category: 'navigation' as const,
            icon: NAV_ICONS[s.path as keyof typeof NAV_ICONS] || NAV_ICONS['/'],
            shortcut: s.key,
            onSelect: () => {
                navigate(s.path)
                onClose()
            }
        }))
    }, [navigate, onClose])

    // Filter commands
    const filteredCommands = useMemo(() => {
        if (!search.trim()) return commands
        const query = search.toLowerCase()
        return commands.filter(c =>
            c.label.toLowerCase().includes(query) ||
            c.shortcut?.toLowerCase().includes(query)
        )
    }, [commands, search])

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setSearch('')
            setSelectedIndex(0)
        }
    }, [isOpen])

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(i => Math.max(0, i - 1))
            } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
                e.preventDefault()
                filteredCommands[selectedIndex].onSelect()
            } else if (e.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, filteredCommands, selectedIndex, onClose])

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[20000] flex items-start justify-center pt-[15vh]"
                onClick={onClose}
            >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-xl mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200/50 dark:border-white/10"
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-100 dark:border-white/5">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0) }}
                            placeholder="Buscar comandos..."
                            className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-white text-lg placeholder:text-zinc-400"
                        />
                        <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-zinc-500 dark:text-zinc-400">ESC</kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto py-2">
                        {filteredCommands.length === 0 ? (
                            <div className="px-4 py-8 text-center text-zinc-400">
                                Nenhum resultado encontrado
                            </div>
                        ) : (
                            filteredCommands.map((cmd, index) => (
                                <button
                                    key={cmd.id}
                                    type="button"
                                    onClick={cmd.onSelect}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${index === selectedIndex
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${index === selectedIndex
                                            ? 'bg-indigo-100 dark:bg-indigo-500/20'
                                            : 'bg-zinc-100 dark:bg-white/5'
                                        }`}>
                                        {cmd.icon}
                                    </div>
                                    <span className="flex-1 font-medium">{cmd.label}</span>
                                    {cmd.shortcut && (
                                        <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            {cmd.shortcut}
                                        </kbd>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-zinc-50 dark:bg-black/20 border-t border-zinc-100 dark:border-white/5 flex items-center gap-4 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">↑</kbd><kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">↓</kbd> navegar</span>
                        <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">↵</kbd> selecionar</span>
                        <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">esc</kbd> fechar</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

export default CommandPalette
