/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY TABLE — Premium Category-Grouped Inventory Display
 * Supports desktop table view and mobile card view with inline editing
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ID } from '../../types'

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
    subcategory?: string
    minStock?: number
    maxStock?: number
    criticalStock?: number
}

type StockStatus = 'noLimit' | 'critical' | 'warning' | 'excess' | 'ok' | 'low' | 'high'

interface GroupedItems {
    [key: string]: InventoryItem[]
}

interface TotalsType {
    totalValue: number
    itemCount: number
    byCategory: { [key: string]: number }
    taxImpact: number
    grandTotal: number
}

interface InventoryTableProps {
    groupedItems: GroupedItems
    totals: TotalsType
    taxRate: number
    subcategories: string[]
    formatCurrency: (value: number) => string
    getStockStatus: (item: InventoryItem) => StockStatus
    getTotalQuantity: (item: InventoryItem) => number
    getItemTotal: (item: InventoryItem) => number
    handleUpdateItem: (id: number | ID, field: string, value: string | number) => void
    handleDeleteItem: (id: number | ID) => void
    onAddItem: () => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function InventoryTable({
    groupedItems,
    totals,
    taxRate,
    subcategories,
    formatCurrency,
    getStockStatus,
    getTotalQuantity,
    getItemTotal,
    handleUpdateItem,
    handleDeleteItem,
    onAddItem
}: InventoryTableProps): React.ReactElement {
    const [editingId, setEditingId] = useState<ID | null>(null)

    return (
        <>
            {Object.keys(groupedItems).length > 0 && (
                <div className="space-y-8">
                    {Object.entries(groupedItems).map(([category, categoryItems]) => (
                        <div key={category} className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
                            {/* Category Header */}
                            <div className="px-8 py-6 border-b border-zinc-100/80 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{category}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                        {formatCurrency((totals.byCategory[category] || 0) * (1 + taxRate))}
                                    </span>
                                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
                                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                                            {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop View - Table */}
                            <div className="hidden md:block">
                                <div className="grid grid-cols-12 gap-6 px-8 py-4 border-b border-zinc-100/80 dark:border-white/5 bg-zinc-50/30 dark:bg-white/[0.01]">
                                    <div className="col-span-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Item</div>
                                    <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Configuração</div>
                                    <div className="col-span-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Qtd</div>
                                    <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Total Estocado</div>
                                    <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Preço Unitário</div>
                                    <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Valor Total</div>
                                </div>

                                <div className="divide-y divide-zinc-100/50 dark:divide-white/5">
                                    {categoryItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="grid grid-cols-12 gap-6 px-8 py-5 items-center hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors duration-300 group"
                                        >
                                            {editingId === item.id ? (
                                                <>
                                                    {/* Edit Mode */}
                                                    <div className="col-span-3">
                                                        <input
                                                            type="text"
                                                            className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-zinc-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                                            value={item.name}
                                                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                                            placeholder="Nome do item"
                                                        />
                                                        {item.category === 'Ingredientes' && (
                                                            <select
                                                                className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-200/50 dark:border-white/5 text-xs font-medium text-zinc-600 dark:text-zinc-400 outline-none cursor-pointer"
                                                                value={item.subcategory || ''}
                                                                onChange={(e) => handleUpdateItem(item.id, 'subcategory', e.target.value)}
                                                            >
                                                                {subcategories.map(sub => (
                                                                    <option key={sub} value={sub}>{sub}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2 flex items-center gap-1.5">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="flex-1 min-w-0 px-2 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-right text-sm font-medium focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                                            value={item.packageQuantity}
                                                            onChange={(e) => handleUpdateItem(item.id, 'packageQuantity', e.target.value)}
                                                        />
                                                        <select
                                                            className="shrink-0 w-14 px-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-sm font-medium text-zinc-600 dark:text-zinc-400 outline-none cursor-pointer"
                                                            value={item.unit}
                                                            onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                                                        >
                                                            <option value="kg">kg</option>
                                                            <option value="g">g</option>
                                                            <option value="L">L</option>
                                                            <option value="ml">ml</option>
                                                            <option value="un">un</option>
                                                            <option value="cx">cx</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-full px-2 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-center text-sm font-semibold focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                                            value={item.packageCount}
                                                            onChange={(e) => handleUpdateItem(item.id, 'packageCount', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex items-center justify-end">
                                                        <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                            {getTotalQuantity(item)} {item.unit}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <div className="relative">
                                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">R$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-right text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                                                value={item.pricePerUnit}
                                                                onChange={(e) => handleUpdateItem(item.id, 'pricePerUnit', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 flex items-center justify-end gap-2">
                                                        <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                                                            {formatCurrency(getItemTotal(item) * (1 + taxRate))}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* View Mode */}
                                                    <div className="col-span-3 flex items-center gap-2">
                                                        {getStockStatus(item) === 'low' && (
                                                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" title="Estoque baixo" />
                                                        )}
                                                        {getStockStatus(item) === 'warning' && (
                                                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" title="Próximo do mínimo" />
                                                        )}
                                                        {getStockStatus(item) === 'high' && (
                                                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]" title="Acima do máximo" />
                                                        )}
                                                        <span className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">{item.name}</span>
                                                    </div>
                                                    <div className="col-span-2 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 text-xs font-medium text-zinc-600 dark:text-zinc-400 tabular-nums">
                                                            {item.packageQuantity} {item.unit}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-1 text-center">
                                                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                                            {item.packageCount}×
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 text-right">
                                                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                                                            {getTotalQuantity(item)} {item.unit}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 text-right">
                                                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{formatCurrency(item.pricePerUnit)}</span>
                                                    </div>
                                                    <div className="col-span-2 flex items-center justify-end gap-2">
                                                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(getItemTotal(item) * (1 + taxRate))}</span>
                                                        <button
                                                            onClick={() => setEditingId(item.id)}
                                                            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile View - Cards */}
                            <div className="md:hidden space-y-3 p-4 bg-zinc-50/50 dark:bg-white/[0.01]">
                                {categoryItems.map((item) => {
                                    const stockStatus = getStockStatus(item)
                                    const stockBorderClass = stockStatus === 'low' ? 'border-l-4 border-l-rose-500' :
                                        stockStatus === 'warning' ? 'border-l-4 border-l-amber-500' :
                                            stockStatus === 'high' ? 'border-l-4 border-l-blue-500' : ''

                                    return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border transition-all ${stockBorderClass} ${editingId === item.id
                                                ? 'border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                                                : 'border-zinc-200/60 dark:border-white/5 shadow-sm'
                                                }`}
                                        >
                                            {editingId === item.id ? (
                                                /* Mobile Edit Mode */
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                                            <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Editando Item</h4>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="p-2 rounded-xl text-red-500 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {/* Name */}
                                                    <div>
                                                        <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Nome</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-zinc-800 dark:text-zinc-100 font-semibold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-zinc-300"
                                                            value={item.name}
                                                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                                        />
                                                    </div>
                                                    {/* Quantity & Unit */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Qtd</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                inputMode="decimal"
                                                                className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-center font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                                                value={item.packageQuantity}
                                                                onChange={(e) => handleUpdateItem(item.id, 'packageQuantity', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Unidade</label>
                                                            <select
                                                                className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 font-bold text-center appearance-none text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                                                value={item.unit}
                                                                onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                                                            >
                                                                <option value="kg">kg</option>
                                                                <option value="g">g</option>
                                                                <option value="L">L</option>
                                                                <option value="ml">ml</option>
                                                                <option value="un">un</option>
                                                                <option value="cx">cx</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    {/* Package Count & Price */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Nº Pcts</label>
                                                            <input
                                                                type="number"
                                                                inputMode="numeric"
                                                                className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-center font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                                                value={item.packageCount}
                                                                onChange={(e) => handleUpdateItem(item.id, 'packageCount', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Preço Unit</label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400/60">R$</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    inputMode="decimal"
                                                                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-right font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                                                    value={item.pricePerUnit}
                                                                    onChange={(e) => handleUpdateItem(item.id, 'pricePerUnit', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Total */}
                                                    <div className="flex items-end justify-between pt-4 border-t border-dashed border-zinc-100/80 dark:border-white/5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300 dark:text-zinc-600 mb-0.5">Total</span>
                                                            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{getTotalQuantity(item)} {item.unit}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400 dark:text-indigo-400/80 mb-0.5">Valor</span>
                                                            <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-tight tabular-nums">{formatCurrency(getItemTotal(item) * (1 + taxRate))}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Mobile View Mode */
                                                <div className="flex items-center justify-between" onClick={() => setEditingId(item.id)}>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-zinc-900 dark:text-white truncate">{item.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-zinc-500">{item.packageQuantity} {item.unit} × {item.packageCount}</span>
                                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">= {getTotalQuantity(item)} {item.unit}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-3">
                                                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(getItemTotal(item) * (1 + taxRate))}</span>
                                                        <p className="text-[10px] text-zinc-400">{formatCurrency(item.pricePerUnit)}/{item.unit}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </div>

                            {/* Category Footer */}
                            <div className="px-8 py-4 bg-zinc-50/50 dark:bg-white/[0.02] border-t border-zinc-100/80 dark:border-white/5 flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total {category}</span>
                                <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{formatCurrency((totals.byCategory[category] || 0) * (1 + taxRate))}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {Object.keys(groupedItems).length === 0 && (
                <div className="text-center py-20 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-zinc-50/50 dark:bg-white/[0.01]" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 mx-auto bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <svg className="h-10 w-10 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Estoque Vazio</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm font-medium">Você ainda não tem itens cadastrados no estoque.</p>
                        <button onClick={onAddItem} className="button primary">
                            Adicionar Primeiro Item
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

export default InventoryTable
