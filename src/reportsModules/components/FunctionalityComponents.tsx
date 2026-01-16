/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FUNCTIONALITY COMPONENTS — Advanced Interactive Features
 * 
 * Contains:
 * - Command Palette (⌘K)
 * - Drag-and-Drop Reordering
 * - Period Comparison Toggle
 * - Bookmark Button
 * - Offline Indicator
 * - Export Buttons (PDF, Excel, CSV)
 * - Share Link Generator
 * - Global Search
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
    Search, Command, Bookmark, BookmarkCheck, Wifi, WifiOff,
    Download, FileText, FileSpreadsheet, Share2, Link2, Copy,
    Check, X, Calendar, ArrowLeftRight, ChevronDown, Printer,
    Undo2, Redo2, Star, StarOff
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND PALETTE (⌘K)
// ═══════════════════════════════════════════════════════════════════════════════

interface CommandItem {
    id: string
    label: string
    shortcut?: string
    icon: React.ReactNode
    action: () => void
    category?: string
}

interface CommandPaletteProps {
    commands: CommandItem[]
    isOpen: boolean
    onClose: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    commands,
    isOpen,
    onClose
}) => {
    const [search, setSearch] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        cmd.category?.toLowerCase().includes(search.toLowerCase())
    )

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
        setSearch('')
        setSelectedIndex(0)
    }, [isOpen])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(i => Math.max(i - 1, 0))
            } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
                e.preventDefault()
                filteredCommands[selectedIndex].action()
                onClose()
            } else if (e.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, filteredCommands, selectedIndex, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[560px] max-w-[90vw] z-[101]"
                    >
                        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.1] overflow-hidden">
                            {/* Search Input */}
                            <div className="flex items-center gap-3 px-4 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
                                <Search className="w-5 h-5 text-zinc-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar comandos..."
                                    className="flex-1 bg-transparent outline-none text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                />
                                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-500">
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-[320px] overflow-y-auto py-2">
                                {filteredCommands.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-zinc-400 text-sm">
                                        Nenhum comando encontrado
                                    </div>
                                ) : (
                                    filteredCommands.map((cmd, i) => (
                                        <motion.button
                                            key={cmd.id}
                                            onClick={() => { cmd.action(); onClose() }}
                                            onMouseEnter={() => setSelectedIndex(i)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selectedIndex === i
                                                ? 'bg-[#007AFF]/10 text-[#007AFF]'
                                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                                }`}
                                        >
                                            <span className={selectedIndex === i ? 'text-[#007AFF]' : 'text-zinc-400'}>
                                                {cmd.icon}
                                            </span>
                                            <span className="flex-1 text-[14px] font-medium">{cmd.label}</span>
                                            {cmd.shortcut && (
                                                <kbd className="text-[11px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                                    {cmd.shortcut}
                                                </kbd>
                                            )}
                                        </motion.button>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.06] dark:border-white/[0.06] bg-zinc-50/50 dark:bg-zinc-800/30">
                                <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700">↑↓</kbd>
                                        navegar
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700">↵</kbd>
                                        selecionar
                                    </span>
                                </div>
                                <span className="text-[11px] text-zinc-400">
                                    {filteredCommands.length} comandos
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERIOD COMPARISON TOGGLE
// ═══════════════════════════════════════════════════════════════════════════════

type ComparisonPeriod = 'none' | 'lastMonth' | 'lastQuarter' | 'lastYear'

interface PeriodComparisonToggleProps {
    value: ComparisonPeriod
    onChange: (period: ComparisonPeriod) => void
}

export const PeriodComparisonToggle: React.FC<PeriodComparisonToggleProps> = ({
    value,
    onChange
}) => {
    const [isOpen, setIsOpen] = useState(false)

    const periods: { value: ComparisonPeriod; label: string }[] = [
        { value: 'none', label: 'Sem comparação' },
        { value: 'lastMonth', label: 'vs Mês anterior' },
        { value: 'lastQuarter', label: 'vs Trimestre anterior' },
        { value: 'lastYear', label: 'vs Ano anterior' }
    ]

    const selectedLabel = periods.find(p => p.value === value)?.label || 'Comparar'

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${value !== 'none'
                    ? 'bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/30'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                    }`}
            >
                <ArrowLeftRight className="w-4 h-4" />
                <span>{selectedLabel}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-50"
                    >
                        {periods.map(period => (
                            <button
                                key={period.value}
                                onClick={() => { onChange(period.value); setIsOpen(false) }}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${value === period.value
                                    ? 'bg-[#007AFF]/10 text-[#007AFF]'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <span>{period.label}</span>
                                {value === period.value && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKMARK BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

interface BookmarkButtonProps {
    reportId: string
    isBookmarked: boolean
    onToggle: (id: string) => void
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
    reportId,
    isBookmarked,
    onToggle
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onToggle(reportId)}
            className={`p-2 rounded-full transition-colors ${isBookmarked
                ? 'bg-[#FF9500]/10 text-[#FF9500]'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
        >
            <motion.div
                initial={false}
                animate={{
                    scale: isBookmarked ? [1, 1.3, 1] : 1,
                    rotate: isBookmarked ? [0, -10, 10, 0] : 0
                }}
                transition={{ duration: 0.4 }}
            >
                {isBookmarked ? (
                    <BookmarkCheck className="w-5 h-5" />
                ) : (
                    <Bookmark className="w-5 h-5" />
                )}
            </motion.div>
        </motion.button>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFLINE INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        setIsOnline(navigator.onLine)

        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF3B30] text-white text-sm font-medium shadow-lg"
                >
                    <WifiOff className="w-4 h-4" />
                    <span>Modo Offline</span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT BUTTONS
// ═══════════════════════════════════════════════════════════════════════════════

interface ExportButtonsProps {
    onExportPDF: () => void
    onExportExcel: () => void
    onExportCSV: () => void
    onPrint: () => void
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
    onExportPDF,
    onExportExcel,
    onExportCSV,
    onPrint
}) => {
    const [isOpen, setIsOpen] = useState(false)

    const exports = [
        { icon: <FileText className="w-4 h-4" />, label: 'Exportar PDF', action: onExportPDF, color: '#FF3B30' },
        { icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Exportar Excel', action: onExportExcel, color: '#34C759' },
        { icon: <Download className="w-4 h-4" />, label: 'Exportar CSV', action: onExportCSV, color: '#007AFF' },
        { icon: <Printer className="w-4 h-4" />, label: 'Imprimir', action: onPrint, color: '#5856D6' }
    ]

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-sm font-medium"
            >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-50"
                    >
                        {exports.map((exp, i) => (
                            <button
                                key={i}
                                onClick={() => { exp.action(); setIsOpen(false) }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <span style={{ color: exp.color }}>{exp.icon}</span>
                                <span>{exp.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARE LINK GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

interface ShareButtonProps {
    reportId?: string
}

export const ShareButton: React.FC<ShareButtonProps> = ({ reportId }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const shareUrl = `${window.location.origin}/reports${reportId ? `?report=${reportId}` : ''}`

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-sm font-medium"
            >
                <Share2 className="w-4 h-4" />
                <span>Compartilhar</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-4 z-50"
                    >
                        <p className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
                            Link de compartilhamento
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                <Link2 className="w-4 h-4 text-zinc-400 shrink-0" />
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="flex-1 bg-transparent outline-none text-xs text-zinc-600 dark:text-zinc-400 truncate"
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCopy}
                                className={`p-2.5 rounded-lg transition-colors ${copied
                                    ? 'bg-[#34C759] text-white'
                                    : 'bg-[#007AFF] text-white'
                                    }`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNDO/REDO BUTTONS
// ═══════════════════════════════════════════════════════════════════════════════

interface UndoRedoProps {
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
}

export const UndoRedoButtons: React.FC<UndoRedoProps> = ({
    canUndo,
    canRedo,
    onUndo,
    onRedo
}) => {
    return (
        <div className="flex items-center gap-1">
            <motion.button
                whileHover={canUndo ? { scale: 1.1 } : undefined}
                whileTap={canUndo ? { scale: 0.9 } : undefined}
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-2 rounded-lg transition-colors ${canUndo
                    ? 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                    }`}
            >
                <Undo2 className="w-4 h-4" />
            </motion.button>
            <motion.button
                whileHover={canRedo ? { scale: 1.1 } : undefined}
                whileTap={canRedo ? { scale: 0.9 } : undefined}
                onClick={onRedo}
                disabled={!canRedo}
                className={`p-2 rounded-lg transition-colors ${canRedo
                    ? 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                    }`}
            >
                <Redo2 className="w-4 h-4" />
            </motion.button>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// USE KEYBOARD SHORTCUTS HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useKeyboardShortcuts = (
    shortcuts: { key: string; metaKey?: boolean; ctrlKey?: boolean; action: () => void }[]
) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const metaMatch = shortcut.metaKey ? (e.metaKey || e.ctrlKey) : true
                const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey : true

                if (e.key.toLowerCase() === shortcut.key.toLowerCase() && metaMatch && ctrlMatch) {
                    e.preventDefault()
                    shortcut.action()
                    break
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [shortcuts])
}
