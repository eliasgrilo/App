// ═══════════════════════════════════════════════════════════════════
// INVENTORY TABLE — Premium Category-Grouped Inventory Display
// Refactored: 436 → ~80 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { ID } from '../../types'
import { InventoryTableProps, DesktopRow, MobileCard } from './inventoryTableModules'

export function InventoryTable({ groupedItems, totals, taxRate, subcategories, formatCurrency, getStockStatus, getTotalQuantity, getItemTotal, handleUpdateItem, handleDeleteItem, onAddItem, hasActiveFilter, onSelectIngredient }: InventoryTableProps): React.ReactElement {
    const [editingId, setEditingId] = useState<ID | null>(null)
    const rowProps = { taxRate, subcategories, formatCurrency, getStockStatus, getTotalQuantity, getItemTotal, handleUpdateItem, handleDeleteItem, setEditingId, onSelectIngredient }

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
                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency((totals.byCategory[category] || 0) * (1 + taxRate))}</span>
                                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5"><span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'}</span></div>
                                </div>
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:block">
                                <div className="grid grid-cols-12 gap-6 px-8 py-4 border-b border-zinc-100/80 dark:border-white/5 bg-zinc-50/30 dark:bg-white/[0.01]">
                                    <div className="col-span-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Item</div>
                                    <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Configuração</div>
                                    <div className="col-span-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Qtd</div>
                                    <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Total Estocado</div>
                                    <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Preço Unitário</div>
                                    <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Valor Total</div>
                                </div>
                                <div className="divide-y divide-zinc-100/50 dark:divide-white/5">{categoryItems.map(item => <DesktopRow key={item.id} item={item} isEditing={editingId === item.id} {...rowProps} />)}</div>
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden space-y-3 p-4 bg-zinc-50/50 dark:bg-white/[0.01]">{categoryItems.map(item => <MobileCard key={item.id} item={item} isEditing={editingId === item.id} {...rowProps} />)}</div>

                            {/* Category Footer */}
                            <div className="px-8 py-4 bg-zinc-50/50 dark:bg-white/[0.02] border-t border-zinc-100/80 dark:border-white/5 flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total {category}</span>
                                <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{formatCurrency((totals.byCategory[category] || 0) * (1 + taxRate))}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State - Only show when no filter is active (real empty stock) */}
            {Object.keys(groupedItems).length === 0 && !hasActiveFilter && (
                <div className="text-center py-20 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-zinc-50/50 dark:bg-white/[0.01]" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 mx-auto bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <svg className="h-10 w-10 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Estoque Vazio</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm font-medium">Você ainda não tem itens cadastrados no estoque.</p>
                        <button onClick={onAddItem} className="button primary">Adicionar Primeiro Item</button>
                    </div>
                </div>
            )}
        </>
    )
}

export default InventoryTable
