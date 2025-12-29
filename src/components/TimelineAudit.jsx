/**
 * TimelineAudit Component - Time Travel UI
 * Navigate through stock history with gesture-based timeline
 * Apple 2025 Liquid Glass Design
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HapticService } from '../services/hapticService'
import { AuditService } from '../services/auditService'

// Format helpers
const formatDate = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const formatTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Timeline Marker Component
function TimelineMarker({ entry, isActive, onClick, position }) {
    const getActionColor = (action) => {
        switch (action) {
            case 'ENTRY': return 'bg-emerald-500'
            case 'EXIT': return 'bg-rose-500'
            case 'ADJUSTMENT': return 'bg-amber-500'
            case 'CREATE': return 'bg-violet-500'
            case 'DELETE': return 'bg-zinc-500'
            default: return 'bg-indigo-500'
        }
    }

    const getActionIcon = (action) => {
        switch (action) {
            case 'ENTRY': return '↓'
            case 'EXIT': return '↑'
            case 'ADJUSTMENT': return '⟳'
            case 'CREATE': return '+'
            case 'DELETE': return '×'
            default: return '•'
        }
    }

    return (
        <motion.button
            onClick={() => {
                HapticService.trigger('selection')
                onClick()
            }}
            className={`absolute z-10 flex flex-col items-center transition-all duration-300 ${isActive ? 'scale-125' : 'scale-100 opacity-70 hover:opacity-100'}`}
            style={{ left: `${position}%` }}
            whileHover={{ scale: isActive ? 1.25 : 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            <div className={`w-4 h-4 rounded-full ${getActionColor(entry.action)} shadow-lg flex items-center justify-center`}>
                <span className="text-[8px] text-white font-bold">{getActionIcon(entry.action)}</span>
            </div>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 px-2 py-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg text-[9px] font-bold text-zinc-700 dark:text-zinc-200 whitespace-nowrap"
                >
                    {formatDate(entry.timestamp)}
                </motion.div>
            )}
        </motion.button>
    )
}

// Stock State Diff Card
function StateDiffCard({ previousState, currentState, action }) {
    const getDiff = (prev, curr) => {
        if (!prev || !curr) return null
        const diff = curr - prev
        if (diff === 0) return null
        return {
            value: diff,
            isPositive: diff > 0,
            percentage: prev !== 0 ? ((diff / prev) * 100).toFixed(1) : '∞'
        }
    }

    const stockDiff = getDiff(previousState?.stock, currentState?.stock)
    const priceDiff = getDiff(previousState?.price, currentState?.price)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 shadow-xl"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action === 'ENTRY' ? 'bg-emerald-500/20 text-emerald-600' :
                    action === 'EXIT' ? 'bg-rose-500/20 text-rose-600' :
                        'bg-violet-500/20 text-violet-600'
                    }`}>
                    <span className="text-xl font-bold">
                        {action === 'ENTRY' ? '↓' : action === 'EXIT' ? '↑' : '⟳'}
                    </span>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Estado do Estoque</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{currentState?.productName || 'Produto'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Stock Change */}
                <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-4">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Quantidade</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                            {currentState?.stock ?? 0}
                        </span>
                        {stockDiff && (
                            <span className={`text-sm font-bold tabular-nums ${stockDiff.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {stockDiff.isPositive ? '+' : ''}{stockDiff.value}
                            </span>
                        )}
                    </div>
                    {previousState && (
                        <p className="text-[10px] text-zinc-400 mt-1">
                            Anterior: {previousState.stock ?? 0}
                        </p>
                    )}
                </div>

                {/* Price Change */}
                <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-4">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Preço Unit.</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                            R$ {(currentState?.price ?? 0).toFixed(2)}
                        </span>
                        {priceDiff && (
                            <span className={`text-sm font-bold tabular-nums ${priceDiff.isPositive ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {priceDiff.isPositive ? '+' : ''}{priceDiff.percentage}%
                            </span>
                        )}
                    </div>
                    {previousState && (
                        <p className="text-[10px] text-zinc-400 mt-1">
                            Anterior: R$ {(previousState.price ?? 0).toFixed(2)}
                        </p>
                    )}
                </div>
            </div>

            {/* Metadata */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 flex justify-between items-center">
                <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Responsável</p>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{currentState?.userName || 'Sistema'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Timestamp</p>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatTime(currentState?.timestamp)}</p>
                </div>
            </div>
        </motion.div>
    )
}

// Main Timeline Audit Component
export default function TimelineAudit({ entries = [], onSelectEntry, isFromPostgres = false, isLoading = false }) {
    const [activeIndex, setActiveIndex] = useState(entries.length - 1)
    const timelineRef = useRef(null)
    const isDragging = useRef(false)

    // Sort entries by timestamp
    const sortedEntries = useMemo(() => {
        return [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    }, [entries])

    const activeEntry = sortedEntries[activeIndex]

    // Calculate position for each entry
    const getPosition = useCallback((index) => {
        if (sortedEntries.length <= 1) return 50
        return (index / (sortedEntries.length - 1)) * 100
    }, [sortedEntries.length])

    // Handle timeline scrubbing
    const handleTimelineScrub = useCallback((e) => {
        if (!timelineRef.current) return

        const rect = timelineRef.current.getBoundingClientRect()
        const x = e.type.includes('touch')
            ? e.touches[0].clientX - rect.left
            : e.clientX - rect.left
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))

        // Find nearest entry
        let nearestIndex = 0
        let nearestDistance = Infinity

        sortedEntries.forEach((_, index) => {
            const pos = getPosition(index)
            const distance = Math.abs(pos - percentage)
            if (distance < nearestDistance) {
                nearestDistance = distance
                nearestIndex = index
            }
        })

        if (nearestIndex !== activeIndex) {
            HapticService.scrub()
            setActiveIndex(nearestIndex)
            onSelectEntry?.(sortedEntries[nearestIndex])
        }
    }, [sortedEntries, activeIndex, getPosition, onSelectEntry])

    // Gesture handlers
    const handleDragStart = () => {
        isDragging.current = true
        HapticService.trigger('impactLight')
    }

    const handleDragEnd = () => {
        isDragging.current = false
        HapticService.trigger('impactMedium')
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-white/5 text-center">
                <motion.div
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <span className="text-3xl">⏳</span>
                </motion.div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Carregando Histórico</h3>
                <p className="text-sm text-zinc-500">Buscando dados do PostgreSQL...</p>
            </div>
        )
    }

    if (entries.length === 0) {
        return (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-white/5 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <span className="text-3xl">⏱️</span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Histórico Vazio</h3>
                <p className="text-sm text-zinc-500">Nenhuma movimentação registrada ainda</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Timeline Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Time Travel</h3>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">Histórico de Auditoria</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Data Source Badge */}
                    {isFromPostgres ? (
                        <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                PostgreSQL
                            </span>
                        </div>
                    ) : (
                        <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-full border border-amber-200/50 dark:border-amber-500/20 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                                Local
                            </span>
                        </div>
                    )}
                    {/* Count Badge */}
                    <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                        <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest">
                            {sortedEntries.length} registros
                        </span>
                    </div>
                </div>
            </div>

            {/* Timeline Track - Liquid Glass */}
            <div
                ref={timelineRef}
                className="relative h-20 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-3xl rounded-2xl border border-zinc-200/50 dark:border-white/5 cursor-grab active:cursor-grabbing"
                onMouseDown={handleDragStart}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onMouseMove={(e) => isDragging.current && handleTimelineScrub(e)}
                onClick={handleTimelineScrub}
                onTouchStart={handleDragStart}
                onTouchEnd={handleDragEnd}
                onTouchMove={handleTimelineScrub}
            >
                {/* Track Line */}
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-zinc-200 dark:bg-white/10 rounded-full -translate-y-1/2">
                    {/* Progress */}
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        style={{ width: `${getPosition(activeIndex)}%` }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    />
                </div>

                {/* Markers */}
                <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2">
                    {sortedEntries.map((entry, index) => (
                        <TimelineMarker
                            key={entry.id || index}
                            entry={entry}
                            isActive={index === activeIndex}
                            position={getPosition(index)}
                            onClick={() => {
                                setActiveIndex(index)
                                onSelectEntry?.(entry)
                            }}
                        />
                    ))}
                </div>

                {/* Date Range Labels */}
                <div className="absolute bottom-2 left-4 right-4 flex justify-between">
                    <span className="text-[9px] font-bold text-zinc-400">
                        {formatDate(sortedEntries[0]?.timestamp)}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400">
                        {formatDate(sortedEntries[sortedEntries.length - 1]?.timestamp)}
                    </span>
                </div>
            </div>

            {/* Active Entry Detail */}
            <AnimatePresence mode="wait">
                {activeEntry && (
                    <StateDiffCard
                        key={activeIndex}
                        previousState={sortedEntries[activeIndex - 1]}
                        currentState={activeEntry}
                        action={activeEntry.action}
                    />
                )}
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="flex justify-center gap-3">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        if (activeIndex > 0) {
                            HapticService.trigger('selection')
                            setActiveIndex(activeIndex - 1)
                        }
                    }}
                    disabled={activeIndex === 0}
                    className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </motion.button>

                <div className="flex-1 flex items-center justify-center">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                        {activeIndex + 1} / {sortedEntries.length}
                    </span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        if (activeIndex < sortedEntries.length - 1) {
                            HapticService.trigger('selection')
                            setActiveIndex(activeIndex + 1)
                        }
                    }}
                    disabled={activeIndex === sortedEntries.length - 1}
                    className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </motion.button>
            </div>
        </div>
    )
}

// Named export for use hook - Fetches from PostgreSQL via Data Connect
export function useTimelineAudit(productId, movements = []) {
    const [auditEntries, setAuditEntries] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fetch audit logs from Data Connect (PostgreSQL)
    useEffect(() => {
        const fetchAuditLogs = async () => {
            if (!productId) {
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                setError(null)

                // Try to fetch from Data Connect
                const logs = await AuditService.getAuditTrail('Product', productId, { limit: 100 })

                if (logs && logs.length > 0) {
                    // Transform audit logs to timeline entries
                    const entries = logs.map(log => ({
                        id: log.id,
                        timestamp: log.createdAt,
                        action: log.action,
                        productName: 'Produto',
                        stock: log.newState ? JSON.parse(log.newState).currentStock : null,
                        price: log.newState ? JSON.parse(log.newState).currentPrice : null,
                        previousStock: log.previousState ? JSON.parse(log.previousState).currentStock : null,
                        previousPrice: log.previousState ? JSON.parse(log.previousState).currentPrice : null,
                        userName: log.userName || 'Sistema',
                        diff: log.diff ? JSON.parse(log.diff) : null,
                        source: 'postgresql' // Indicates data from PostgreSQL
                    }))
                    setAuditEntries(entries)
                } else {
                    // Fallback to movements if no audit logs
                    console.log('No audit logs found, using movements as fallback')
                    setAuditEntries([])
                }
            } catch (err) {
                console.warn('Failed to fetch audit logs, using movements fallback:', err)
                setError(err)
                setAuditEntries([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchAuditLogs()
    }, [productId])

    // Transform movements into audit entries as fallback
    const movementEntries = useMemo(() => {
        return movements.map((m, index) => ({
            id: m.id || `movement-${index}`,
            timestamp: m.date || m.createdAt,
            action: m.type === 'entry' ? 'ENTRY' : 'EXIT',
            productName: m.productName,
            stock: m.cumulativeStock,
            price: m.price,
            quantity: m.quantity,
            userName: m.userName || 'Sistema',
            reason: m.reason,
            source: 'local' // Indicates data from local state
        }))
    }, [movements])

    // Combine audit entries with movements (prefer audit entries)
    const entries = useMemo(() => {
        if (auditEntries.length > 0) {
            return auditEntries
        }
        return movementEntries
    }, [auditEntries, movementEntries])

    return {
        entries,
        isLoading,
        error,
        isFromPostgres: auditEntries.length > 0,
        refresh: () => {
            // Trigger a refetch
            setAuditEntries([])
        }
    }
}

