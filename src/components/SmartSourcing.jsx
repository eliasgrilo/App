/**
 * SmartSourcing Component - Automated Purchase Order Generation
 * AI-powered supplier recommendations and bulk ordering
 * Apple 2025 Liquid Glass Design
 */

import React, { useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HapticService } from '../services/hapticService'

// Format currency
const formatCurrency = (val) => {
    const n = Number(val) || 0
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Calculate restock needs based on predictions
function calculateRestockNeeds(products, movements, daysBuffer = 14) {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000)

    return products.map(product => {
        // Calculate daily consumption
        const productMovements = movements.filter(m =>
            m.productId === product.id &&
            m.type === 'exit' &&
            new Date(m.date || m.createdAt).getTime() >= cutoff
        )
        const totalExits = productMovements.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)
        const dailyRate = totalExits / 30

        // Calculate how much to order
        const targetStock = Math.ceil(dailyRate * daysBuffer) + (product.minStock || 0)
        const currentStock = product.currentStock || 0
        const neededQuantity = Math.max(0, targetStock - currentStock)

        // Calculate urgency
        const daysUntilStockout = dailyRate > 0 ? Math.floor(currentStock / dailyRate) : Infinity

        return {
            ...product,
            dailyRate,
            targetStock,
            neededQuantity,
            daysUntilStockout,
            estimatedCost: neededQuantity * (product.currentPrice || 0),
            urgency: daysUntilStockout <= 3 ? 'critical' : daysUntilStockout <= 7 ? 'warning' : 'normal'
        }
    }).filter(p => p.neededQuantity > 0)
}

// Group products by supplier
function groupBySupplier(products) {
    const groups = {}

    products.forEach(product => {
        const supplier = product.supplier || 'Sem Fornecedor'
        if (!groups[supplier]) {
            groups[supplier] = {
                name: supplier,
                products: [],
                totalCost: 0,
                totalItems: 0,
                hasCritical: false,
                hasWarning: false
            }
        }
        groups[supplier].products.push(product)
        groups[supplier].totalCost += product.estimatedCost
        groups[supplier].totalItems += product.neededQuantity
        if (product.urgency === 'critical') groups[supplier].hasCritical = true
        if (product.urgency === 'warning') groups[supplier].hasWarning = true
    })

    return Object.values(groups).sort((a, b) => {
        // Sort by urgency first, then by cost
        if (a.hasCritical !== b.hasCritical) return a.hasCritical ? -1 : 1
        if (a.hasWarning !== b.hasWarning) return a.hasWarning ? -1 : 1
        return b.totalCost - a.totalCost
    })
}

// Supplier Order Card
function SupplierOrderCard({ supplier, isSelected, onSelect, onQuantityChange }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <motion.div
            layout
            className={`bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[1.5rem] border transition-all ${isSelected
                    ? 'border-violet-500/50 shadow-lg shadow-violet-500/10'
                    : 'border-zinc-200/50 dark:border-white/5'
                }`}
        >
            {/* Header */}
            <div
                className="p-5 cursor-pointer"
                onClick={() => {
                    HapticService.trigger('selection')
                    setExpanded(!expanded)
                }}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation()
                                HapticService.trigger('impactMedium')
                                onSelect(!isSelected)
                            }}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected
                                    ? 'bg-violet-500 border-violet-500 text-white'
                                    : 'border-zinc-300 dark:border-zinc-600'
                                }`}
                        >
                            {isSelected && '✓'}
                        </motion.button>
                        <div>
                            <h4 className="text-base font-bold text-zinc-900 dark:text-white">{supplier.name}</h4>
                            <p className="text-xs text-zinc-500">{supplier.products.length} produtos</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {supplier.hasCritical && (
                            <span className="px-2 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-600 text-[9px] font-bold uppercase rounded-full">
                                Urgente
                            </span>
                        )}
                        {supplier.hasWarning && !supplier.hasCritical && (
                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 text-[9px] font-bold uppercase rounded-full">
                                Atenção
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">Total Estimado</span>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                            {formatCurrency(supplier.totalCost)}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">Itens</span>
                        <p className="text-lg font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                            {supplier.totalItems}
                        </p>
                    </div>
                </div>
            </div>

            {/* Expanded Product List */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-2">
                            {supplier.products.map(product => (
                                <div
                                    key={product.id}
                                    className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl"
                                >
                                    <div className={`w-2 h-2 rounded-full ${product.urgency === 'critical' ? 'bg-rose-500' :
                                            product.urgency === 'warning' ? 'bg-amber-500' :
                                                'bg-emerald-500'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-zinc-800 dark:text-white truncate">
                                            {product.name}
                                        </p>
                                        <p className="text-[10px] text-zinc-400">
                                            Estoque: {product.currentStock} → Meta: {product.targetStock}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={product.neededQuantity}
                                            onChange={(e) => onQuantityChange(product.id, Number(e.target.value))}
                                            className="w-16 h-9 text-center text-sm font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-700 rounded-lg border-0 outline-none tabular-nums"
                                            onClick={e => e.stopPropagation()}
                                        />
                                        <span className="text-xs text-zinc-500 w-12">
                                            {formatCurrency(product.neededQuantity * (product.currentPrice || 0))}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// Order Summary Panel
function OrderSummary({ selectedSuppliers, totalCost, totalItems, onCreateOrders }) {
    const [isCreating, setIsCreating] = useState(false)

    const handleCreate = async () => {
        try {
            setIsCreating(true)
            HapticService.trigger('impactMedium')
            await onCreateOrders(selectedSuppliers)
            HapticService.trigger('approval')
        } catch (error) {
            HapticService.trigger('error')
        } finally {
            setIsCreating(false)
        }
    }

    if (selectedSuppliers.length === 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10 shadow-2xl z-50"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Resumo do Pedido</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums mt-1">
                        {formatCurrency(totalCost)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Fornecedores</p>
                    <p className="text-lg font-bold text-violet-600 tabular-nums">{selectedSuppliers.length}</p>
                </div>
            </div>

            <div className="flex gap-3 mb-4">
                <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-bold text-zinc-400 uppercase">Produtos</p>
                    <p className="text-lg font-bold text-zinc-800 dark:text-white tabular-nums">
                        {selectedSuppliers.reduce((sum, s) => sum + s.products.length, 0)}
                    </p>
                </div>
                <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-bold text-zinc-400 uppercase">Unidades</p>
                    <p className="text-lg font-bold text-zinc-800 dark:text-white tabular-nums">{totalItems}</p>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-violet-500/30 disabled:opacity-50"
            >
                {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            ⏳
                        </motion.span>
                        Criando...
                    </span>
                ) : (
                    '🚀 Criar Pedidos'
                )}
            </motion.button>
        </motion.div>
    )
}

// Main Smart Sourcing Component
export default function SmartSourcing({ products = [], movements = [], onCreateOrders }) {
    const [selectedSupplierIds, setSelectedSupplierIds] = useState(new Set())
    const [quantityOverrides, setQuantityOverrides] = useState({})
    const [daysBuffer, setDaysBuffer] = useState(14)

    // Calculate restock needs
    const restockNeeds = useMemo(() => {
        return calculateRestockNeeds(products, movements, daysBuffer)
    }, [products, movements, daysBuffer])

    // Apply quantity overrides
    const adjustedNeeds = useMemo(() => {
        return restockNeeds.map(product => ({
            ...product,
            neededQuantity: quantityOverrides[product.id] ?? product.neededQuantity,
            estimatedCost: (quantityOverrides[product.id] ?? product.neededQuantity) * (product.currentPrice || 0)
        }))
    }, [restockNeeds, quantityOverrides])

    // Group by supplier
    const supplierGroups = useMemo(() => {
        return groupBySupplier(adjustedNeeds)
    }, [adjustedNeeds])

    // Selected suppliers data
    const selectedSuppliers = useMemo(() => {
        return supplierGroups.filter(s => selectedSupplierIds.has(s.name))
    }, [supplierGroups, selectedSupplierIds])

    // Totals
    const totals = useMemo(() => ({
        cost: selectedSuppliers.reduce((sum, s) => sum + s.totalCost, 0),
        items: selectedSuppliers.reduce((sum, s) => sum + s.totalItems, 0)
    }), [selectedSuppliers])

    // Toggle supplier selection
    const toggleSupplier = useCallback((supplierName, selected) => {
        setSelectedSupplierIds(prev => {
            const next = new Set(prev)
            if (selected) {
                next.add(supplierName)
            } else {
                next.delete(supplierName)
            }
            return next
        })
    }, [])

    // Handle quantity change
    const handleQuantityChange = useCallback((productId, quantity) => {
        setQuantityOverrides(prev => ({
            ...prev,
            [productId]: Math.max(0, quantity)
        }))
    }, [])

    // Select all
    const selectAll = () => {
        HapticService.trigger('success')
        setSelectedSupplierIds(new Set(supplierGroups.map(s => s.name)))
    }

    // Clear selection
    const clearSelection = () => {
        HapticService.trigger('selection')
        setSelectedSupplierIds(new Set())
    }

    if (restockNeeds.length === 0) {
        return (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-white/5 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Estoque Adequado</h3>
                <p className="text-sm text-zinc-500">Nenhum produto precisa de reposição no momento</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Smart Sourcing</h3>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">Pedidos Inteligentes</p>
                </div>

                <div className="flex gap-2">
                    {/* Buffer Days Selector */}
                    <div className="p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl flex gap-1">
                        {[7, 14, 30].map(days => (
                            <button
                                key={days}
                                onClick={() => {
                                    HapticService.trigger('selection')
                                    setDaysBuffer(days)
                                }}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${daysBuffer === days
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                        : 'text-zinc-500'
                                    }`}
                            >
                                {days}d
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={selectAll}
                        className="px-4 py-2 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-xl text-[10px] font-bold uppercase tracking-wide"
                    >
                        Selecionar Todos
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-2xl p-4 border border-zinc-200/50 dark:border-white/5 text-center">
                    <p className="text-[8px] font-bold text-zinc-400 uppercase mb-1">Fornecedores</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{supplierGroups.length}</p>
                </div>
                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-2xl p-4 border border-zinc-200/50 dark:border-white/5 text-center">
                    <p className="text-[8px] font-bold text-zinc-400 uppercase mb-1">Produtos</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{restockNeeds.length}</p>
                </div>
                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-2xl p-4 border border-zinc-200/50 dark:border-white/5 text-center">
                    <p className="text-[8px] font-bold text-violet-500 uppercase mb-1">Total</p>
                    <p className="text-xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                        {formatCurrency(adjustedNeeds.reduce((sum, p) => sum + p.estimatedCost, 0))}
                    </p>
                </div>
            </div>

            {/* Supplier Cards */}
            <div className="space-y-3 pb-32">
                {supplierGroups.map(supplier => (
                    <SupplierOrderCard
                        key={supplier.name}
                        supplier={supplier}
                        isSelected={selectedSupplierIds.has(supplier.name)}
                        onSelect={(selected) => toggleSupplier(supplier.name, selected)}
                        onQuantityChange={handleQuantityChange}
                    />
                ))}
            </div>

            {/* Order Summary */}
            <AnimatePresence>
                {selectedSuppliers.length > 0 && (
                    <OrderSummary
                        selectedSuppliers={selectedSuppliers}
                        totalCost={totals.cost}
                        totalItems={totals.items}
                        onCreateOrders={onCreateOrders}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
