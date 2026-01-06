/**
 * ═══════════════════════════════════════════════════════════════════
 * EXPIRY MONITORING SECTION — Premium Apple-Level Component
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Hero card with circular progress, timeline view, and glassmorphism.
 * 
 * @module inventory/components/ExpiryMonitoringSection
 */

import React from 'react'
import { motion } from 'framer-motion'
import { getExpiryData, type ExpiryData } from '../../services/stockService'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface InventoryItem {
    id: number
    name: string
    packageQuantity: number
    packageCount: number
    unit: string
    pricePerUnit: number
    category: string
    subcategory?: string | null
    expiryDate?: string | null
}

interface ExpiryMonitoringSectionProps {
    items: InventoryItem[]
    onConfigureItem: (item: InventoryItem) => void
    getTotalQuantity: (item: InventoryItem) => number
}

interface ItemWithExpiry extends InventoryItem {
    expiryData: ExpiryData
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function ExpiryMonitoringSection({
    items,
    onConfigureItem,
    getTotalQuantity
}: ExpiryMonitoringSectionProps): React.ReactElement {
    // Get items with expiry dates sorted by urgency
    const itemsWithExpiry: ItemWithExpiry[] = items
        .filter(i => i.expiryDate)
        .map(item => ({ ...item, expiryData: getExpiryData(item)! }))
        .sort((a, b) => a.expiryData.days - b.expiryData.days)

    // Stats
    const expiredCount = itemsWithExpiry.filter(i => i.expiryData.status === 'expired').length
    const criticalCount = itemsWithExpiry.filter(i => i.expiryData.status === 'critical').length
    const warningCount = itemsWithExpiry.filter(i => i.expiryData.status === 'warning').length
    const okCount = itemsWithExpiry.filter(i => i.expiryData.status === 'ok').length

    const mostUrgent = itemsWithExpiry[0]
    const upcomingItems = itemsWithExpiry.slice(0, 5)

    // Stroke calculation for circular progress
    const circumference = 2 * Math.PI * 45 // radius = 45

    return (
        <section className="relative z-10 mb-8">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative overflow-hidden"
            >
                {/* Background gradient based on urgency */}
                <div
                    className="absolute inset-0 transition-all duration-700"
                    style={{
                        background: mostUrgent
                            ? `linear-gradient(135deg, ${mostUrgent.expiryData.color}08 0%, transparent 50%)`
                            : 'linear-gradient(135deg, rgba(52,199,89,0.05) 0%, transparent 50%)'
                    }}
                />

                {/* Main container with glassmorphism */}
                <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5">

                    {/* Header with elegant typography */}
                    <div className="px-8 pt-8 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                    Validade
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 -mt-0.5">
                                    Monitoramento em tempo real
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Hero Section - Most Urgent Item */}
                    {mostUrgent ? (
                        <div className="px-8 py-6">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                                className="relative p-6 rounded-3xl overflow-hidden cursor-pointer group"
                                style={{
                                    background: `linear-gradient(135deg, ${mostUrgent.expiryData.color}15 0%, ${mostUrgent.expiryData.color}05 100%)`,
                                    border: `1px solid ${mostUrgent.expiryData.color}20`
                                }}
                                onClick={() => onConfigureItem(mostUrgent)}
                            >
                                {/* Animated pulse for critical items */}
                                {mostUrgent.expiryData.status === 'expired' && (
                                    <div className="absolute inset-0 animate-pulse" style={{ background: `${mostUrgent.expiryData.color}10` }} />
                                )}

                                <div className="relative flex items-center gap-6">
                                    {/* Circular Progress Ring */}
                                    <div className="relative w-28 h-28 flex-shrink-0">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                            <circle
                                                cx="50" cy="50" r="45"
                                                fill="none"
                                                stroke="currentColor"
                                                className="text-zinc-200 dark:text-zinc-700"
                                                strokeWidth="6"
                                            />
                                            <motion.circle
                                                cx="50" cy="50" r="45"
                                                fill="none"
                                                stroke={mostUrgent.expiryData.color}
                                                strokeWidth="6"
                                                strokeLinecap="round"
                                                strokeDasharray={circumference}
                                                initial={{ strokeDashoffset: circumference }}
                                                animate={{ strokeDashoffset: circumference - (mostUrgent.expiryData.progress / 100) * circumference }}
                                                transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <motion.span
                                                className="text-3xl font-bold tabular-nums"
                                                style={{ color: mostUrgent.expiryData.color }}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
                                            >
                                                {mostUrgent.expiryData.days < 0 ? Math.abs(mostUrgent.expiryData.days) : mostUrgent.expiryData.days}
                                            </motion.span>
                                            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                                {mostUrgent.expiryData.days < 0 ? 'dias vencido' : 'dias'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Item details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                                                style={{
                                                    backgroundColor: `${mostUrgent.expiryData.color}20`,
                                                    color: mostUrgent.expiryData.color
                                                }}
                                            >
                                                {mostUrgent.expiryData.label}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white truncate mb-1 group-hover:text-opacity-80 transition-all">
                                            {mostUrgent.name}
                                        </h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                            Vence em <span className="font-semibold" style={{ color: mostUrgent.expiryData.color }}>
                                                {mostUrgent.expiryData.expiry.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="text-xs text-zinc-400">
                                                <span className="font-semibold text-zinc-600 dark:text-zinc-300">{getTotalQuantity(mostUrgent)}</span> {mostUrgent.unit} em estoque
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow indicator */}
                                    <motion.div
                                        className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                        whileHover={{ scale: 1.1 }}
                                    >
                                        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="px-8 py-12 text-center">
                            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Tudo sob controle</h3>
                            <p className="text-sm text-zinc-500">Nenhum item com data de validade cadastrada</p>
                        </div>
                    )}

                    {/* Quick Stats Bar */}
                    {itemsWithExpiry.length > 0 && (
                        <div className="px-8 py-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    {[
                                        { label: 'Vencidos', count: expiredCount, color: '#FF3B30' },
                                        { label: 'Crítico', count: criticalCount, color: '#FF3B30' },
                                        { label: 'Atenção', count: warningCount, color: '#FF9500' },
                                        { label: 'OK', count: okCount, color: '#34C759' }
                                    ].map((stat) => (
                                        <div key={stat.label} className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: stat.color }}
                                            />
                                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                                {stat.label}
                                            </span>
                                            <span
                                                className="text-sm font-bold tabular-nums"
                                                style={{ color: stat.count > 0 ? stat.color : undefined }}
                                            >
                                                {stat.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">
                                    {itemsWithExpiry.length} itens monitorados
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Timeline View - Upcoming Expirations */}
                    {upcomingItems.length > 1 && (
                        <div className="px-8 pb-8 pt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Próximos Vencimentos</h4>
                                <div className="flex-1 h-px bg-gradient-to-r from-zinc-200 dark:from-zinc-700 to-transparent" />
                            </div>

                            <div className="space-y-2">
                                {upcomingItems.slice(1, 5).map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + index * 0.1 }}
                                        onClick={() => onConfigureItem(item)}
                                        className="group flex items-center gap-4 p-3 -mx-2 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                                    >
                                        <div className="relative flex flex-col items-center" style={{ width: '20px' }}>
                                            <div
                                                className="w-3 h-3 rounded-full ring-4 ring-white dark:ring-zinc-900"
                                                style={{ backgroundColor: item.expiryData.color }}
                                            />
                                            {index < upcomingItems.slice(1, 5).length - 1 && (
                                                <div className="absolute top-4 w-0.5 h-8 bg-zinc-100 dark:bg-zinc-800" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                                                {item.name}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-sm font-bold tabular-nums"
                                                style={{ color: item.expiryData.color }}
                                            >
                                                {item.expiryData.days < 0 ? `−${Math.abs(item.expiryData.days)}` : item.expiryData.days}d
                                            </span>
                                            <svg className="w-4 h-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Items without expiry hint */}
                    {items.filter(i => !i.expiryDate).length > 0 && (
                        <div className="mx-8 mb-8 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                                        {items.filter(i => !i.expiryDate).length} itens sem validade
                                    </p>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                        Clique em um item para adicionar data
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </section>
    )
}

export default ExpiryMonitoringSection
