/**
 * ═══════════════════════════════════════════════════════════════════
 * SALES PAGE — Complete Apple Experience (Refined)
 * Premium layout with all 5 refined components
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CommandRing } from './CommandRing'
import { LiveOrderFeed } from './LiveOrderFeed'
import { TimelineView } from './TimelineView'
import { QuickActions } from './QuickActions'
import { SalesInsights } from './SalesInsights'
import {
    Order,
    OrderStatus,
    generateMockOrders,
    calculateMetrics
} from '../types'

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
    }).format(value)
}

export function SalesPage() {
    const [orders, setOrders] = useState<Order[]>(() => generateMockOrders(20))

    const metrics = useMemo(() => calculateMetrics(orders), [orders])
    const activeOrders = useMemo(() =>
        orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
        , [orders])

    const insights = useMemo(() => {
        const list = []
        if (metrics.revenueProgress >= 100) {
            list.push({ id: '1', type: 'success' as const, title: 'Meta atingida!', value: '🎉' })
        } else if (metrics.revenueProgress >= 80) {
            list.push({ id: '1', type: 'success' as const, title: 'Quase na meta', value: `${Math.round(metrics.revenueProgress)}%` })
        }
        if (metrics.peakHour > 0) {
            list.push({ id: '2', type: 'info' as const, title: `Pico às ${metrics.peakHour}h`, value: `${metrics.peakHourOrders} pedidos` })
        }
        const newCount = orders.filter(o => o.status === 'new').length
        if (newCount > 3) {
            list.push({ id: '3', type: 'warning' as const, title: 'Pedidos aguardando', value: String(newCount) })
        }
        return list
    }, [metrics, orders])

    const handleStatusChange = useCallback((orderId: string, newStatus: OrderStatus) => {
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date() } : o
        ))
    }, [])

    const handleNewOrder = useCallback(() => {
        const [newOrder] = generateMockOrders(1)
        if (newOrder) {
            newOrder.status = 'new'
            newOrder.createdAt = new Date()
            setOrders(prev => [newOrder, ...prev])
        }
    }, [])

    return (
        <div className="pb-24">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Vendas
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <motion.div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <motion.div
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Ao vivo
                    </span>
                </motion.div>
            </motion.div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                    {/* Command Ring Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)] p-6"
                    >
                        <div className="flex items-center gap-5">
                            <CommandRing
                                progress={metrics.revenueProgress}
                                revenue={metrics.revenue}
                                goal={metrics.revenueGoal}
                                size="md"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                    {formatCurrency(metrics.revenue)}
                                </p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                    Meta: {formatCurrency(metrics.revenueGoal)}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] p-4"
                        >
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Pedidos</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{metrics.orderCount}</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] p-4"
                        >
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Ticket Médio</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                {formatCurrency(metrics.averageTicket || 0)}
                            </p>
                        </motion.div>
                    </div>

                    {/* Timeline */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <TimelineView orders={orders} />
                    </motion.div>

                    {/* Insights */}
                    {insights.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            <SalesInsights insights={insights} />
                        </motion.div>
                    )}
                </div>

                {/* Right Column */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-7 xl:col-span-8"
                >
                    <LiveOrderFeed
                        orders={activeOrders}
                        onStatusChange={handleStatusChange}
                    />
                </motion.div>
            </div>

            {/* Quick Actions */}
            <QuickActions onNewOrder={handleNewOrder} />
        </div>
    )
}

export default SalesPage
