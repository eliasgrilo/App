import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollLock } from '../hooks/useScrollLock'

/**
 * ProductModal - Apple-Quality Product Detail Modal
 * Features: Price chart with tooltips, animated tabs, stats
 */

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-'
const formatDateTime = (d) => d ? new Date(d).toLocaleDateString('pt-BR') + ' ' + new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'

// Interactive Price Chart with Tooltips
function PriceChart({ data, height = 120 }) {
    const [hoveredPoint, setHoveredPoint] = useState(null)

    if (!data || data.length < 2) {
        return (
            <div className="flex items-center justify-center h-32 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                <p className="text-sm text-zinc-400">Dados insuficientes para gráfico</p>
            </div>
        )
    }

    const width = 300
    const padding = { top: 20, right: 20, bottom: 30, left: 50 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const values = data.map(d => Number(d.price) || 0)
    const min = Math.min(...values) * 0.95
    const max = Math.max(...values) * 1.05
    const range = max - min || 1

    const points = data.map((d, i) => ({
        x: padding.left + (i / (data.length - 1)) * chartWidth,
        y: padding.top + chartHeight - ((Number(d.price) - min) / range) * chartHeight,
        date: d.date,
        price: d.price
    }))

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

    // Calculate variation
    const firstPrice = values[0]
    const lastPrice = values[values.length - 1]
    const variation = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(1)
    const isUp = lastPrice > firstPrice

    const gradientId = `price-gradient-${Math.random().toString(36).substr(2, 9)}`
    const lineColor = isUp ? '#ef4444' : '#22c55e'

    return (
        <div className="relative">
            {/* Variation Badge */}
            <div className="absolute top-2 right-2 z-10">
                <div className={`px-3 py-1.5 rounded-xl text-sm font-bold ${isUp ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'
                    }`}>
                    {isUp ? '↑' : '↓'} {Math.abs(variation)}%
                </div>
            </div>

            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                    <g key={i}>
                        <line
                            x1={padding.left}
                            y1={padding.top + chartHeight * pct}
                            x2={padding.left + chartWidth}
                            y2={padding.top + chartHeight * pct}
                            stroke="#e4e4e7"
                            strokeDasharray="4"
                            className="dark:stroke-zinc-700"
                        />
                        <text
                            x={padding.left - 8}
                            y={padding.top + chartHeight * pct + 4}
                            textAnchor="end"
                            className="text-[9px] fill-zinc-400"
                        >
                            {formatCurrency(max - (max - min) * pct).replace('R$', '')}
                        </text>
                    </g>
                ))}

                {/* Area */}
                <path d={areaD} fill={`url(#${gradientId})`} />

                {/* Line */}
                <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Points */}
                {points.map((point, i) => (
                    <g key={i}>
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r={hoveredPoint === i ? 6 : 4}
                            fill={lineColor}
                            className="cursor-pointer transition-all"
                            onMouseEnter={() => setHoveredPoint(i)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                        {i === 0 || i === points.length - 1 ? (
                            <text
                                x={point.x}
                                y={padding.top + chartHeight + 16}
                                textAnchor={i === 0 ? 'start' : 'end'}
                                className="text-[9px] fill-zinc-400"
                            >
                                {formatDate(point.date)}
                            </text>
                        ) : null}
                    </g>
                ))}
            </svg>

            {/* Tooltip */}
            <AnimatePresence>
                {hoveredPoint !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-20 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl px-3 py-2 text-sm shadow-xl pointer-events-none"
                        style={{
                            left: Math.min(points[hoveredPoint].x, width - 100),
                            top: points[hoveredPoint].y - 50
                        }}
                    >
                        <p className="font-bold">{formatCurrency(points[hoveredPoint].price)}</p>
                        <p className="text-[10px] opacity-70">{formatDate(points[hoveredPoint].date)}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// Movement Timeline Item
function MovementItem({ movement, product, index }) {
    const isEntry = movement.type === 'entry'

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center gap-4 py-3"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEntry ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/20'
                }`}>
                <span className={`text-lg font-bold ${isEntry ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isEntry ? '↓' : '↑'}
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                    {isEntry ? 'Entrada' : 'Saída'}
                    <span className={`ml-2 ${isEntry ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isEntry ? '+' : '-'}{movement.quantity} {product.unit}
                    </span>
                </p>
                <p className="text-[11px] text-zinc-400">
                    {formatDateTime(movement.createdAt)}
                    {movement.reason && ` • ${movement.reason}`}
                </p>
            </div>
            {movement.price && (
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(movement.price)}
                </span>
            )}
        </motion.div>
    )
}

// Stat Card
function StatCard({ label, value, subValue, color = 'zinc' }) {
    const colors = {
        zinc: 'from-zinc-50 to-slate-50 dark:from-zinc-800 dark:to-zinc-800/50',
        emerald: 'from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5',
        violet: 'from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/5'
    }
    const textColors = {
        zinc: 'text-zinc-900 dark:text-white',
        emerald: 'text-emerald-700 dark:text-emerald-300',
        violet: 'text-violet-700 dark:text-violet-300'
    }

    return (
        <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 text-center`}>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-xl font-bold tabular-nums ${textColors[color]}`}>{value}</p>
            {subValue && <p className="text-[10px] text-zinc-400 mt-0.5">{subValue}</p>}
        </div>
    )
}

// Main Modal Component
export default function ProductModal({ product, onClose, onAddMovement, onAddNote, onDeleteNote }) {
    useScrollLock(true)
    const [activeTab, setActiveTab] = useState('resumo')
    const [showAddMovement, setShowAddMovement] = useState(false)
    const [newMovement, setNewMovement] = useState({ type: 'entry', quantity: '', price: '', reason: '' })

    const tabs = [
        { id: 'resumo', label: 'Resumo' },
        { id: 'movimentos', label: 'Movimentos' },
        { id: 'precos', label: 'Preços' }
    ]

    const priceStats = useMemo(() => {
        if (!product.priceHistory || product.priceHistory.length < 2) return null
        const prices = product.priceHistory.map(p => Number(p.price) || 0).filter(p => p > 0)
        if (prices.length === 0) return null
        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: prices.reduce((a, b) => a + b, 0) / prices.length,
            count: prices.length
        }
    }, [product.priceHistory])

    const stockValue = (product.currentStock || 0) * (product.currentPrice || 0)

    const handleSubmitMovement = () => {
        if (!newMovement.quantity) return
        onAddMovement?.(product.id, {
            type: newMovement.type,
            quantity: Number(newMovement.quantity),
            price: newMovement.price ? Number(newMovement.price) : null,
            reason: newMovement.reason || null
        })
        setNewMovement({ type: 'entry', quantity: '', price: '', reason: '' })
        setShowAddMovement(false)
    }

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
            />

            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 400 }}
                className="relative w-full md:max-w-lg bg-white dark:bg-zinc-900 md:rounded-3xl rounded-t-[28px] overflow-hidden shadow-2xl"
                style={{ maxHeight: '92vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Mobile Handle */}
                <div className="flex justify-center pt-3 pb-1 md:hidden">
                    <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                </div>

                {/* Header */}
                <div className="px-6 pb-4 pt-2 md:pt-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-[22px] font-bold text-zinc-900 dark:text-white truncate">
                                {product.name}
                            </h2>
                            <p className="text-[13px] text-zinc-500">
                                {product.category}
                                {product.supplier && <span className="text-zinc-300 dark:text-zinc-600"> • </span>}
                                {product.supplier}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-5 p-1 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-2xl">
                        {tabs.map(tab => (
                            <motion.button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-colors ${activeTab === tab.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'
                                    }`}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="modalTab"
                                        className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-sm"
                                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 220px)' }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'resumo' && (
                            <motion.div
                                key="resumo"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-5"
                            >
                                <div className="grid grid-cols-3 gap-3">
                                    <StatCard label="Estoque" value={product.currentStock} subValue={product.unit} />
                                    <StatCard label="Preço" value={formatCurrency(product.currentPrice)} color="zinc" />
                                    <StatCard label="Valor Total" value={formatCurrency(stockValue)} color="emerald" />
                                </div>

                                {priceStats && (
                                    <div className="bg-violet-50/50 dark:bg-violet-500/5 rounded-2xl p-4 border border-violet-100 dark:border-violet-500/10">
                                        <h4 className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-3">
                                            📊 Estatísticas ({priceStats.count} registros)
                                        </h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-center">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase">Mín</p>
                                                <p className="text-sm font-bold text-emerald-600">{formatCurrency(priceStats.min)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase">Média</p>
                                                <p className="text-sm font-bold text-violet-600">{formatCurrency(priceStats.avg)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase">Máx</p>
                                                <p className="text-sm font-bold text-rose-600">{formatCurrency(priceStats.max)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'movimentos' && (
                            <motion.div
                                key="movimentos"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                            >
                                {!showAddMovement ? (
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setShowAddMovement(true)}
                                        className="w-full py-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-500 hover:border-violet-400 hover:text-violet-600 transition-all"
                                    >
                                        + Registrar Movimentação
                                    </motion.button>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 space-y-4"
                                    >
                                        <div className="flex gap-2">
                                            <button onClick={() => setNewMovement(p => ({ ...p, type: 'entry' }))} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${newMovement.type === 'entry' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-zinc-700 text-zinc-600'}`}>↓ Entrada</button>
                                            <button onClick={() => setNewMovement(p => ({ ...p, type: 'exit' }))} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${newMovement.type === 'exit' ? 'bg-rose-500 text-white' : 'bg-white dark:bg-zinc-700 text-zinc-600'}`}>↑ Saída</button>
                                        </div>
                                        <input type="number" placeholder={`Quantidade (${product.unit})`} value={newMovement.quantity} onChange={e => setNewMovement(p => ({ ...p, quantity: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-medium" />
                                        {newMovement.type === 'entry' && (
                                            <input type="number" placeholder="Preço (opcional)" value={newMovement.price} onChange={e => setNewMovement(p => ({ ...p, price: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white" />
                                        )}
                                        <div className="flex gap-3">
                                            <button onClick={() => setShowAddMovement(false)} className="flex-1 py-3.5 rounded-xl bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-white font-bold">Cancelar</button>
                                            <button onClick={handleSubmitMovement} className="flex-1 py-3.5 rounded-xl bg-violet-600 text-white font-bold">Registrar</button>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {(product.movements || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((m, i) => (
                                        <MovementItem key={m.id} movement={m} product={product} index={i} />
                                    ))}
                                </div>

                                {(!product.movements || product.movements.length === 0) && (
                                    <p className="text-center text-sm text-zinc-400 py-12">Nenhuma movimentação</p>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'precos' && (
                            <motion.div
                                key="precos"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-5"
                            >
                                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/5 rounded-2xl p-5 text-center">
                                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-2">Preço Atual</p>
                                    <p className="text-4xl font-bold text-violet-700 dark:text-violet-300 tabular-nums">
                                        {formatCurrency(product.currentPrice)}
                                    </p>
                                </div>

                                {product.priceHistory && product.priceHistory.length >= 2 && (
                                    <div className="bg-white dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-700/50">
                                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-4">Evolução de Preços</h4>
                                        <PriceChart data={product.priceHistory} />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl text-[15px] font-semibold"
                    >
                        Fechar
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

export { PriceChart, MovementItem, StatCard }
