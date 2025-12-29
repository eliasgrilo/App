/**
 * DigitalTwinMap Component - Isometric Stock Visualization
 * Heat map visualization of stock turnover with category zones
 * Apple 2025 Liquid Glass Design
 */

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HapticService } from '../services/hapticService'

// Category colors
const CATEGORY_COLORS = {
    'Hortifruti': { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-500/20' },
    'Padaria': { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-500/20' },
    'Laticínios': { bg: 'bg-sky-500', text: 'text-sky-500', light: 'bg-sky-500/20' },
    'Carnes': { bg: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-500/20' },
    'Bebidas': { bg: 'bg-violet-500', text: 'text-violet-500', light: 'bg-violet-500/20' },
    'Limpeza': { bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-500/20' },
    'Outros': { bg: 'bg-zinc-500', text: 'text-zinc-500', light: 'bg-zinc-500/20' }
}

// Get heat level based on turnover rate (higher turnover = hotter)
function getHeatLevel(turnoverRate) {
    if (turnoverRate >= 10) return 'hot'      // Very active
    if (turnoverRate >= 5) return 'warm'      // Active
    if (turnoverRate >= 2) return 'normal'    // Normal
    if (turnoverRate >= 0.5) return 'cool'    // Slow
    return 'cold'                              // Inactive
}

// Heat colors
const HEAT_COLORS = {
    hot: { opacity: 1, color: 'rgba(239, 68, 68, 0.8)', glow: 'shadow-red-500/50' },
    warm: { opacity: 0.8, color: 'rgba(249, 115, 22, 0.7)', glow: 'shadow-orange-500/40' },
    normal: { opacity: 0.6, color: 'rgba(34, 197, 94, 0.6)', glow: '' },
    cool: { opacity: 0.4, color: 'rgba(99, 102, 241, 0.5)', glow: '' },
    cold: { opacity: 0.2, color: 'rgba(161, 161, 170, 0.3)', glow: '' }
}

// Isometric Product Node
function ProductNode({ product, position, onClick, isSelected }) {
    const heat = getHeatLevel(product.turnoverRate || 0)
    const heatStyle = HEAT_COLORS[heat]
    const category = CATEGORY_COLORS[product.category] || CATEGORY_COLORS['Outros']

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: isSelected ? 1.2 : 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.15, zIndex: 100 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
                HapticService.trigger('selection')
                onClick?.(product)
            }}
            className={`absolute cursor-pointer transition-all duration-200 ${heatStyle.glow}`}
            style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)'
            }}
        >
            {/* Heat Pulse Animation */}
            {heat === 'hot' && (
                <motion.div
                    className="absolute inset-0 rounded-full bg-red-500/30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}

            {/* Node */}
            <div
                className={`relative w-8 h-8 rounded-lg shadow-lg flex items-center justify-center text-white text-[10px] font-bold ${category.bg}`}
                style={{
                    opacity: heatStyle.opacity,
                    boxShadow: `0 4px 12px ${heatStyle.color}`
                }}
            >
                {product.currentStock}
            </div>

            {/* Label on hover/select */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg whitespace-nowrap z-50"
                    >
                        <p className="text-[10px] font-bold text-zinc-900 dark:text-white truncate max-w-[100px]">
                            {product.name}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// Category Zone
function CategoryZone({ category, bounds, productCount }) {
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['Outros']

    return (
        <div
            className={`absolute rounded-2xl border-2 border-dashed ${colors.light} ${colors.text} flex items-center justify-center transition-all`}
            style={{
                left: `${bounds.x}%`,
                top: `${bounds.y}%`,
                width: `${bounds.width}%`,
                height: `${bounds.height}%`,
                borderColor: 'currentColor',
                opacity: 0.3
            }}
        >
            <div className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest">{category}</p>
                <p className="text-[8px] opacity-60">{productCount} items</p>
            </div>
        </div>
    )
}

// Legend Component
function HeatLegend() {
    const levels = [
        { label: 'Alta Rotação', level: 'hot', color: 'bg-red-500' },
        { label: 'Ativo', level: 'warm', color: 'bg-orange-500' },
        { label: 'Normal', level: 'normal', color: 'bg-emerald-500' },
        { label: 'Lento', level: 'cool', color: 'bg-indigo-500' },
        { label: 'Parado', level: 'cold', color: 'bg-zinc-400' }
    ]

    return (
        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-2xl p-4 border border-zinc-200/50 dark:border-white/5">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Giro de Estoque</p>
            <div className="space-y-2">
                {levels.map(({ label, level, color }) => (
                    <div key={level} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${color}`} style={{ opacity: HEAT_COLORS[level].opacity }} />
                        <span className="text-[10px] text-zinc-600 dark:text-zinc-400">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Product Detail Panel
function ProductDetailPanel({ product, onClose }) {
    if (!product) return null

    const heat = getHeatLevel(product.turnoverRate || 0)
    const category = CATEGORY_COLORS[product.category] || CATEGORY_COLORS['Outros']

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-4 top-4 w-64 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-3xl rounded-2xl p-4 border border-zinc-200/50 dark:border-white/10 shadow-xl"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${category.bg} flex items-center justify-center text-white font-bold`}>
                    {product.currentStock}
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-600"
                >
                    ×
                </button>
            </div>

            <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1 truncate">{product.name}</h4>
            <p className="text-xs text-zinc-500 mb-4">{product.category}</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-bold text-zinc-400 uppercase mb-1">Rotação/dia</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
                        {(product.turnoverRate || 0).toFixed(1)}
                    </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-bold text-zinc-400 uppercase mb-1">Valor</p>
                    <p className="text-lg font-bold text-emerald-600 tabular-nums">
                        R$ {((product.currentStock || 0) * (product.currentPrice || 0)).toFixed(0)}
                    </p>
                </div>
            </div>

            <div className={`px-3 py-2 rounded-xl text-center ${heat === 'hot' ? 'bg-red-100 dark:bg-red-500/20 text-red-600' :
                    heat === 'warm' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600' :
                        heat === 'cold' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' :
                            'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'
                }`}>
                <span className="text-xs font-bold uppercase">
                    {heat === 'hot' ? '🔥 Alta Rotação' :
                        heat === 'warm' ? '⚡ Ativo' :
                            heat === 'cold' ? '❄️ Parado' :
                                '✓ Normal'}
                </span>
            </div>
        </motion.div>
    )
}

// Main Digital Twin Map Component
export default function DigitalTwinMap({ products = [], movements = [] }) {
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [zoomLevel, setZoomLevel] = useState(1)

    // Calculate turnover rates and positions
    const productsWithData = useMemo(() => {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)

        return products.map((product, index) => {
            // Calculate turnover from movements
            const productMovements = movements.filter(m =>
                m.productId === product.id &&
                m.type === 'exit' &&
                new Date(m.date || m.createdAt).getTime() >= thirtyDaysAgo
            )
            const totalExits = productMovements.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)
            const turnoverRate = totalExits / 30

            return {
                ...product,
                turnoverRate,
                totalExits30d: totalExits
            }
        })
    }, [products, movements])

    // Group by category and calculate positions
    const { categoryZones, productPositions } = useMemo(() => {
        const categories = {}

        productsWithData.forEach(product => {
            const cat = product.category || 'Outros'
            if (!categories[cat]) {
                categories[cat] = []
            }
            categories[cat].push(product)
        })

        // Create grid layout for categories
        const categoryNames = Object.keys(categories)
        const cols = Math.ceil(Math.sqrt(categoryNames.length))
        const rows = Math.ceil(categoryNames.length / cols)
        const zoneWidth = 100 / cols
        const zoneHeight = 100 / rows

        const zones = {}
        const positions = new Map()

        categoryNames.forEach((cat, catIndex) => {
            const col = catIndex % cols
            const row = Math.floor(catIndex / cols)

            zones[cat] = {
                x: col * zoneWidth + 2,
                y: row * zoneHeight + 2,
                width: zoneWidth - 4,
                height: zoneHeight - 4
            }

            // Position products within zone
            const catProducts = categories[cat]
            const productCols = Math.ceil(Math.sqrt(catProducts.length))

            catProducts.forEach((product, prodIndex) => {
                const prodCol = prodIndex % productCols
                const prodRow = Math.floor(prodIndex / productCols)
                const prodRows = Math.ceil(catProducts.length / productCols)

                const x = zones[cat].x + 10 + (prodCol / productCols) * (zones[cat].width - 20)
                const y = zones[cat].y + 15 + (prodRow / prodRows) * (zones[cat].height - 30)

                positions.set(product.id, { x, y })
            })
        })

        return { categoryZones: zones, productPositions: positions }
    }, [productsWithData])

    // Stats summary
    const stats = useMemo(() => {
        let hot = 0, warm = 0, normal = 0, cool = 0, cold = 0

        productsWithData.forEach(p => {
            const heat = getHeatLevel(p.turnoverRate)
            if (heat === 'hot') hot++
            else if (heat === 'warm') warm++
            else if (heat === 'normal') normal++
            else if (heat === 'cool') cool++
            else cold++
        })

        return { hot, warm, normal, cool, cold, total: productsWithData.length }
    }, [productsWithData])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Digital Twin</h3>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">Mapa de Estoque</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300"
                    >
                        −
                    </button>
                    <button
                        onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-5 gap-2">
                {[
                    { label: 'Alta', count: stats.hot, color: 'text-red-500' },
                    { label: 'Ativo', count: stats.warm, color: 'text-orange-500' },
                    { label: 'Normal', count: stats.normal, color: 'text-emerald-500' },
                    { label: 'Lento', count: stats.cool, color: 'text-indigo-500' },
                    { label: 'Parado', count: stats.cold, color: 'text-zinc-400' }
                ].map(stat => (
                    <div key={stat.label} className="text-center">
                        <p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.count}</p>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Map Container */}
            <div className="relative bg-white/60 dark:bg-zinc-900/40 backdrop-blur-3xl rounded-[2rem] border border-zinc-200/50 dark:border-white/5 overflow-hidden shadow-xl"
                style={{ paddingBottom: '60%' }}
            >
                <div
                    className="absolute inset-4 transition-transform duration-300"
                    style={{ transform: `scale(${zoomLevel})` }}
                >
                    {/* Category Zones */}
                    {Object.entries(categoryZones).map(([category, bounds]) => (
                        <CategoryZone
                            key={category}
                            category={category}
                            bounds={bounds}
                            productCount={productsWithData.filter(p => (p.category || 'Outros') === category).length}
                        />
                    ))}

                    {/* Product Nodes */}
                    {productsWithData.map(product => {
                        const position = productPositions.get(product.id)
                        if (!position) return null

                        return (
                            <ProductNode
                                key={product.id}
                                product={product}
                                position={position}
                                isSelected={selectedProduct?.id === product.id}
                                onClick={setSelectedProduct}
                            />
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="absolute left-4 bottom-4">
                    <HeatLegend />
                </div>

                {/* Detail Panel */}
                <AnimatePresence>
                    {selectedProduct && (
                        <ProductDetailPanel
                            product={selectedProduct}
                            onClose={() => setSelectedProduct(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
