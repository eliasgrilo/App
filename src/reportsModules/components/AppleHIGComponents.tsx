/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * APPLE HIG COMPONENTS — Premium Interactive Features
 * 
 * Contains:
 * - LiveDataIndicator: Real-time pulse animation
 * - SaveIndicator: Auto-save toast notification
 * - ChartAnnotation: Click-to-add notes on charts
 * - AIInsightsCard: AI-powered insights with typing animation
 * - DragHandle: Visual drag indicator for reordering
 * - ZoomControls: Pinch-to-zoom UI controls
 * - SwipeIndicator: Visual swipe feedback
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Radio, Save, CheckCircle, MessageSquarePlus, X, Sparkles,
    Lightbulb, TrendingUp, AlertTriangle, Target, GripVertical,
    ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE DATA INDICATOR — Real-time Pulse
// ═══════════════════════════════════════════════════════════════════════════════

interface LiveDataIndicatorProps {
    isLive?: boolean
    lastUpdated?: Date
}

export const LiveDataIndicator: React.FC<LiveDataIndicatorProps> = ({
    isLive = true,
    lastUpdated
}) => {
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    const timeAgo = lastUpdated
        ? Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)
        : 0

    const formatTimeAgo = () => {
        if (timeAgo < 60) return 'agora'
        if (timeAgo < 3600) return `${Math.floor(timeAgo / 60)}min atrás`
        return `${Math.floor(timeAgo / 3600)}h atrás`
    }

    return (
        <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
                {/* Pulse rings */}
                {isLive && (
                    <>
                        <motion.div
                            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                            className="absolute w-3 h-3 rounded-full bg-emerald-500"
                        />
                        <motion.div
                            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                            className="absolute w-3 h-3 rounded-full bg-emerald-500"
                        />
                    </>
                )}
                {/* Core dot */}
                <div className={`relative w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
            </div>

            <div className="flex flex-col">
                <span className={`text-[11px] font-bold uppercase tracking-wide ${isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                    {isLive ? 'AO VIVO' : 'OFFLINE'}
                </span>
                {lastUpdated && (
                    <span className="text-[10px] text-zinc-400">
                        {formatTimeAgo()}
                    </span>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAVE INDICATOR — Auto-save Toast
// ═══════════════════════════════════════════════════════════════════════════════

interface SaveIndicatorProps {
    isSaving: boolean
    lastSaved: Date | null
    show: boolean
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
    isSaving,
    lastSaved,
    show
}) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg"
                >
                    {isSaving ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <Save className="w-3.5 h-3.5 text-[#007AFF]" />
                            </motion.div>
                            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                                Salvando...
                            </span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                                Salvo {lastSaved && new Date(lastSaved).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART ANNOTATION — Click-to-add Notes
// ═══════════════════════════════════════════════════════════════════════════════

interface ChartAnnotationProps {
    annotation: {
        id: string
        x: number
        y: number
        text: string
        color: string
    }
    onEdit: (id: string, text: string) => void
    onDelete: (id: string) => void
}

export const ChartAnnotationMarker: React.FC<ChartAnnotationProps> = ({
    annotation,
    onEdit,
    onDelete
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [editText, setEditText] = useState(annotation.text)

    const handleSave = () => {
        onEdit(annotation.id, editText)
        setIsOpen(false)
    }

    return (
        <div
            className="absolute z-20"
            style={{ left: annotation.x, top: annotation.y, transform: 'translate(-50%, -100%)' }}
        >
            {/* Marker */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="relative"
            >
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: annotation.color }}
                >
                    <MessageSquarePlus className="w-3.5 h-3.5 text-white" />
                </div>
                {/* Pointer */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent"
                    style={{ borderTopColor: annotation.color }}
                />
            </motion.button>

            {/* Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-8 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                    >
                        <div className="p-3">
                            <textarea
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                className="w-full p-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
                                rows={3}
                                placeholder="Adicione sua anotação..."
                            />
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700">
                            <button
                                onClick={() => onDelete(annotation.id)}
                                className="text-xs text-red-500 hover:text-red-600 font-medium"
                            >
                                Excluir
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#007AFF] hover:bg-[#0066CC] rounded-lg"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI INSIGHTS CARD — AI-powered Insights Generator
// ═══════════════════════════════════════════════════════════════════════════════

interface AIInsight {
    type: 'trend' | 'alert' | 'opportunity' | 'tip'
    title: string
    description: string
}

interface AIInsightsCardProps {
    reportName: string
    insights?: AIInsight[]
    isGenerating?: boolean
    onGenerate?: () => void
}

const insightIcons = {
    trend: TrendingUp,
    alert: AlertTriangle,
    opportunity: Target,
    tip: Lightbulb
}

const insightColors = {
    trend: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    alert: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    opportunity: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    tip: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
    reportName,
    insights = [],
    isGenerating = false,
    onGenerate
}) => {
    const [displayedText, setDisplayedText] = useState('')
    const [currentInsightIndex, setCurrentInsightIndex] = useState(0)

    // Typing effect for generating state
    useEffect(() => {
        if (isGenerating) {
            const texts = [
                'Analisando dados...',
                'Identificando padrões...',
                'Gerando insights...'
            ]
            let index = 0
            const interval = setInterval(() => {
                setDisplayedText(texts[index % texts.length]!)
                index++
            }, 1500)
            return () => clearInterval(interval)
        }
        return undefined
    }, [isGenerating])

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-100 dark:border-purple-800/30 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-100 dark:border-purple-800/30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">AI Insights</p>
                        <p className="text-[10px] text-zinc-500">{reportName}</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg shadow-sm disabled:opacity-50"
                >
                    {isGenerating ? 'Gerando...' : 'Gerar Insights'}
                </motion.button>
            </div>

            {/* Content */}
            <div className="p-4">
                {isGenerating ? (
                    <div className="flex items-center gap-3 py-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                            <Sparkles className="w-5 h-5 text-purple-500" />
                        </motion.div>
                        <motion.p
                            key={displayedText}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-zinc-600 dark:text-zinc-400"
                        >
                            {displayedText}
                        </motion.p>
                    </div>
                ) : insights.length > 0 ? (
                    <div className="space-y-3">
                        {insights.map((insight, i) => {
                            const Icon = insightIcons[insight.type]
                            const colorClass = insightColors[insight.type]
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-3"
                                >
                                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{insight.title}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{insight.description}</p>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-zinc-500 text-center py-4">
                        Clique em "Gerar Insights" para análise inteligente
                    </p>
                )}
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAG HANDLE — Visual Drag Indicator
// ═══════════════════════════════════════════════════════════════════════════════

interface DragHandleProps {
    isDragging?: boolean
}

export const DragHandle: React.FC<DragHandleProps> = ({ isDragging = false }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.1 }}
            className={`cursor-grab active:cursor-grabbing p-1.5 rounded-lg transition-colors ${isDragging
                ? 'bg-[#007AFF]/10 text-[#007AFF]'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
        >
            <GripVertical className="w-4 h-4" />
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ZOOM CONTROLS — Chart Zoom UI
// ═══════════════════════════════════════════════════════════════════════════════

interface ZoomControlsProps {
    scale: number
    onZoomIn: () => void
    onZoomOut: () => void
    onReset: () => void
    minScale?: number
    maxScale?: number
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
    scale,
    onZoomIn,
    onZoomOut,
    onReset,
    minScale = 0.5,
    maxScale = 3
}) => {
    return (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onZoomOut}
                disabled={scale <= minScale}
                className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ZoomOut className="w-4 h-4" />
            </motion.button>

            <span className="px-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 tabular-nums min-w-[40px] text-center">
                {Math.round(scale * 100)}%
            </span>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onZoomIn}
                disabled={scale >= maxScale}
                className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ZoomIn className="w-4 h-4" />
            </motion.button>

            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" />

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReset}
                disabled={scale === 1}
                className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <RotateCcw className="w-4 h-4" />
            </motion.button>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SWIPE INDICATOR — Visual Swipe Feedback
// ═══════════════════════════════════════════════════════════════════════════════

interface SwipeIndicatorProps {
    direction: 'left' | 'right' | null
    progress: number
}

export const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({ direction, progress }) => {
    if (!direction || progress < 0.2) return null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: progress }}
            className={`fixed top-1/2 -translate-y-1/2 z-50 ${direction === 'left' ? 'right-4' : 'left-4'
                }`}
        >
            <div className="w-12 h-12 rounded-full bg-[#007AFF]/20 backdrop-blur-xl flex items-center justify-center">
                {direction === 'left' ? (
                    <ChevronRight className="w-6 h-6 text-[#007AFF]" />
                ) : (
                    <ChevronLeft className="w-6 h-6 text-[#007AFF]" />
                )}
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANNOTATABLE CHART WRAPPER — iOS Sheet Modal for Annotations
// ═══════════════════════════════════════════════════════════════════════════════

import { AppleNotesSheet, type Note } from './AppleNotesSheet'

interface AnnotatableChartWrapperProps {
    children: React.ReactNode
    chartId: string
    chartName?: string
}

export const AnnotatableChartWrapper: React.FC<AnnotatableChartWrapperProps> = ({
    children,
    chartId,
    chartName = 'Gráfico'
}) => {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [notes, setNotes] = useState<Note[]>([])

    // Load notes from localStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem(`padoca-notes-${chartId}`)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setNotes(parsed.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) })))
            } catch (e) {
                console.warn('Failed to parse notes:', e)
            }
        }
    }, [chartId])

    // Save notes to localStorage
    const saveNotes = useCallback((newNotes: Note[]) => {
        setNotes(newNotes)
        localStorage.setItem(`padoca-notes-${chartId}`, JSON.stringify(newNotes))
    }, [chartId])

    const handleAddNote = useCallback((text: string, color: string) => {
        const newNote: Note = {
            id: `${chartId}-${Date.now()}`,
            text,
            color,
            createdAt: new Date(),
            chartId
        }
        saveNotes([newNote, ...notes])
    }, [chartId, notes, saveNotes])

    const handleDeleteNote = useCallback((id: string) => {
        saveNotes(notes.filter(n => n.id !== id))
    }, [notes, saveNotes])

    const handleEditNote = useCallback((id: string, text: string) => {
        saveNotes(notes.map(n => n.id === id ? { ...n, text } : n))
    }, [notes, saveNotes])

    return (
        <div className="relative">
            {/* Notes Button - Apple Style */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSheetOpen(true)}
                className={`
                    absolute top-2 right-2 z-10
                    flex items-center gap-1.5 px-3 py-2
                    rounded-xl text-[13px] font-medium
                    transition-all duration-200
                    bg-white/90 dark:bg-zinc-800/90 
                    backdrop-blur-xl
                    text-zinc-700 dark:text-zinc-300 
                    border border-black/[0.04] dark:border-white/[0.06]
                    shadow-[0_2px_8px_rgba(0,0,0,0.08)]
                    hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]
                `}
            >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Anotações</span>
                {notes.length > 0 && (
                    <span className="
                        ml-1 px-1.5 py-0.5 
                        bg-[#007AFF] text-white 
                        text-[10px] font-bold 
                        rounded-full min-w-[18px] text-center
                    ">
                        {notes.length}
                    </span>
                )}
            </motion.button>

            {/* Chart Content */}
            <div className="relative">
                {children}
            </div>

            {/* Apple Notes Sheet Modal */}
            <AppleNotesSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                notes={notes}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onEditNote={handleEditNote}
                chartName={chartName}
            />
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
    LiveDataIndicator,
    SaveIndicator,
    ChartAnnotationMarker,
    AIInsightsCard,
    DragHandle,
    ZoomControls,
    SwipeIndicator,
    AnnotatableChartWrapper
}
