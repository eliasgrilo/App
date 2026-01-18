/**
 * ═══════════════════════════════════════════════════════════════════
 * LIVE ORDER FEED — Real-time Order Stream (Refined)
 * Premium cards with glassmorphism, depth, micro-interactions
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Order, OrderStatus } from '../types'
import { STATUS_CONFIG } from '../types'

interface LiveOrderFeedProps {
    orders: Order[]
    onStatusChange: (orderId: string, status: OrderStatus) => void
}

function formatTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `${diffMins}m`
    return `${Math.floor(diffMins / 60)}h`
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function LiveOrderFeed({ orders, onStatusChange }: LiveOrderFeedProps) {
    const getNextStatus = (status: OrderStatus): OrderStatus | null => {
        switch (status) {
            case 'new': return 'preparing'
            case 'preparing': return 'ready'
            case 'ready': return 'delivered'
            default: return null
        }
    }

    return (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-100/80 dark:border-zinc-800/80 flex items-center justify-between bg-gradient-to-b from-white/50 to-transparent dark:from-white/[0.02]">
                <div className="flex items-center gap-2">
                    <motion.div
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Pedidos Ativos
                    </span>
                </div>
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {orders.length}
                </span>
            </div>

            {/* List */}
            <div className="divide-y divide-zinc-100/80 dark:divide-zinc-800/80 max-h-[500px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                    {orders.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-12 text-center"
                        >
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <span className="text-xl">✨</span>
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhum pedido ativo</p>
                        </motion.div>
                    ) : (
                        orders.map((order, i) => {
                            const config = STATUS_CONFIG[order.status]
                            const next = getNextStatus(order.status)

                            return (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30, height: 0 }}
                                    transition={{
                                        delay: i * 0.02,
                                        duration: 0.25,
                                        ease: [0.32, 0.72, 0, 1]
                                    }}
                                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                                    className="px-5 py-4 flex items-center gap-4 transition-colors"
                                >
                                    {/* Status indicator */}
                                    <div className="relative flex-shrink-0">
                                        <motion.div
                                            className="w-3 h-3 rounded-full shadow-sm"
                                            style={{
                                                backgroundColor: config.color,
                                                boxShadow: `0 0 8px ${config.color}40`
                                            }}
                                        />
                                        {order.status === 'new' && (
                                            <motion.div
                                                className="absolute inset-0 rounded-full"
                                                style={{ backgroundColor: config.color }}
                                                animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                        )}
                                    </div>

                                    {/* Order info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-0.5">
                                            <span className="font-semibold text-zinc-900 dark:text-white">
                                                {order.orderNumber}
                                            </span>
                                            <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                                                {order.customerName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                                            <span>{order.items.length} itens</span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                            <span className="tabular-nums">{formatTime(order.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">
                                        {formatCurrency(order.total)}
                                    </span>

                                    {/* Action */}
                                    {next && (
                                        <motion.button
                                            whileHover={{ scale: 1.03, y: -1 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => onStatusChange(order.id, next)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-shadow hover:shadow-md"
                                            style={{
                                                backgroundColor: STATUS_CONFIG[next].color,
                                                boxShadow: `0 2px 8px ${STATUS_CONFIG[next].color}30`
                                            }}
                                        >
                                            {STATUS_CONFIG[next].label}
                                        </motion.button>
                                    )}
                                </motion.div>
                            )
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default LiveOrderFeed
