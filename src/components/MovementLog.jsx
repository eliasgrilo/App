import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * MovementLog - Apple-Quality Timeline Component
 * Features: Visual timeline, who/when/where tracking
 */

const formatDateTime = (d) => {
    if (!d) return '-'
    const date = new Date(d)
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

const timeAgo = (d) => {
    if (!d) return ''
    const now = new Date()
    const date = new Date(d)
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}min atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`
    return date.toLocaleDateString('pt-BR')
}

// Timeline Connector
function TimelineConnector({ isLast }) {
    if (isLast) return null
    return (
        <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-zinc-200 to-transparent dark:from-zinc-700" />
    )
}

// Movement Type Icon
function MovementIcon({ type }) {
    const isEntry = type === 'entry'
    return (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isEntry
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30'
                : 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/30'
            }`}>
            <span className="text-white font-bold text-lg">{isEntry ? '↓' : '↑'}</span>
        </div>
    )
}

// User Badge
function UserBadge({ user }) {
    const initials = user?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
            <div className="w-5 h-5 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">
                {initials}
            </div>
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">{user || 'Sistema'}</span>
        </div>
    )
}

// Location Badge
function LocationBadge({ location }) {
    if (!location) return null
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 rounded-full">
            <span className="text-xs">📍</span>
            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">{location}</span>
        </div>
    )
}

// Single Movement Item
function MovementTimelineItem({ movement, product, index, isLast }) {
    const [expanded, setExpanded] = useState(false)
    const isEntry = movement.type === 'entry'

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="relative pl-14"
        >
            {/* Timeline Connector */}
            <TimelineConnector isLast={isLast} />

            {/* Icon */}
            <div className="absolute left-0 top-0">
                <MovementIcon type={movement.type} />
            </div>

            {/* Content */}
            <motion.div
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 overflow-hidden cursor-pointer hover:border-violet-200 dark:hover:border-violet-800 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                            <p className="text-[15px] font-semibold text-zinc-900 dark:text-white">
                                {isEntry ? 'Entrada' : 'Saída'}
                                <span className={`ml-2 ${isEntry ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isEntry ? '+' : '-'}{movement.quantity} {product?.unit || 'un'}
                                </span>
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{timeAgo(movement.createdAt)}</p>
                        </div>
                        {movement.price && (
                            <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {formatCurrency(movement.price)}
                            </span>
                        )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2">
                        <UserBadge user={movement.user} />
                        <LocationBadge location={movement.location} />
                    </div>

                    {/* Reason */}
                    {movement.reason && (
                        <p className="mt-3 text-[13px] text-zinc-600 dark:text-zinc-300">
                            {movement.reason}
                        </p>
                    )}
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 px-4 py-3"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Data/Hora Completa</p>
                                    <p className="text-[12px] text-zinc-600 dark:text-zinc-300">{formatDateTime(movement.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">ID da Movimentação</p>
                                    <p className="text-[12px] text-zinc-600 dark:text-zinc-300 font-mono">{movement.id?.slice(0, 8) || '-'}</p>
                                </div>
                                {product && (
                                    <>
                                        <div>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Produto</p>
                                            <p className="text-[12px] text-zinc-600 dark:text-zinc-300">{product.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Fornecedor</p>
                                            <p className="text-[12px] text-zinc-600 dark:text-zinc-300">{product.supplier || '-'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    )
}

// Date Separator
function DateSeparator({ date }) {
    return (
        <div className="flex items-center gap-3 py-4">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
        </div>
    )
}

// Main Component
export default function MovementLog({ movements = [], products = [], maxItems = 50 }) {
    const [filter, setFilter] = useState('all') // 'all', 'entry', 'exit'

    // Filter and sort movements
    const filteredMovements = movements
        .filter(m => filter === 'all' || m.type === filter)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, maxItems)

    // Group by date
    const groupedMovements = filteredMovements.reduce((groups, mov) => {
        const date = new Date(mov.createdAt).toDateString()
        if (!groups[date]) groups[date] = []
        groups[date].push(mov)
        return groups
    }, {})

    // Get product for movement
    const getProduct = (productId) => products.find(p => p.id === productId)

    if (movements.length === 0) {
        return (
            <div className="text-center py-16">
                <span className="text-5xl mb-4 block">📋</span>
                <p className="text-base font-medium text-zinc-900 dark:text-white mb-1">Nenhuma movimentação</p>
                <p className="text-sm text-zinc-400">Registre entradas e saídas para ver o histórico</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with Filter */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Histórico de Movimentações</h3>
                <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'entry', label: '↓ Entradas' },
                        { id: 'exit', label: '↑ Saídas' }
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setFilter(opt.id)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filter === opt.id
                                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                    : 'text-zinc-500'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {Object.entries(groupedMovements).map(([date, movs], groupIndex) => (
                    <div key={date}>
                        {groupIndex > 0 && <DateSeparator date={date} />}
                        <div className="space-y-4">
                            {movs.map((mov, i) => (
                                <MovementTimelineItem
                                    key={mov.id}
                                    movement={mov}
                                    product={getProduct(mov.productId)}
                                    index={i}
                                    isLast={i === movs.length - 1}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Load More */}
            {movements.length > maxItems && (
                <div className="text-center pt-4">
                    <p className="text-sm text-zinc-400">
                        Mostrando {maxItems} de {movements.length} movimentações
                    </p>
                </div>
            )}
        </div>
    )
}

export { MovementTimelineItem, UserBadge, LocationBadge, DateSeparator }
