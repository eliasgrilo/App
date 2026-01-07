// ═══════════════════════════════════════════════════════════════════
// INVENTORY TABLE MODULES — Mobile Card Component
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { RowProps, unitOptions } from './types'
import { getCombinedAlertStatus } from '../../../services/stockService'

export const MobileCard: React.FC<RowProps> = ({ item, isEditing, taxRate, formatCurrency, getStockStatus, getTotalQuantity, getItemTotal, handleUpdateItem, handleDeleteItem, setEditingId, onSelectIngredient }) => {
    const stockStatus = getStockStatus(item)
    const alertStatus = getCombinedAlertStatus(item)
    const stockBorderClass = alertStatus === 'critical' ? 'border-l-4 border-l-rose-500' : alertStatus === 'warning' ? 'border-l-4 border-l-amber-500' : stockStatus === 'excess' ? 'border-l-4 border-l-blue-500' : ''
    const itemId = `inv-${item.id}`

    if (isEditing) {
        return (
            <motion.div layout className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border transition-all ${stockBorderClass} border-indigo-500/30 shadow-lg shadow-indigo-500/5`}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" /><h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Editando Item</h4></div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingId(null)} className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></button>
                            <button onClick={() => handleDeleteItem(item.id)} className="p-2 rounded-xl text-red-500 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                    </div>
                    <div><label htmlFor={`${itemId}-name`} className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Nome</label><input id={`${itemId}-name`} type="text" className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-zinc-800 dark:text-zinc-100 font-semibold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-zinc-300" value={item.name} onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label htmlFor={`${itemId}-qty`} className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Qtd</label><input id={`${itemId}-qty`} type="number" step="0.01" inputMode="decimal" className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-center font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all" value={item.packageQuantity} onChange={(e) => handleUpdateItem(item.id, 'packageQuantity', e.target.value)} /></div>
                        <div><label htmlFor={`${itemId}-unit`} className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Unidade</label><select id={`${itemId}-unit`} className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 font-bold text-center appearance-none text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all" value={item.unit} onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}>{unitOptions.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label htmlFor={`${itemId}-pkgcount`} className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Nº Pcts</label><input id={`${itemId}-pkgcount`} type="number" inputMode="numeric" className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-center font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all" value={item.packageCount} onChange={(e) => handleUpdateItem(item.id, 'packageCount', e.target.value)} /></div>
                        <div><label htmlFor={`${itemId}-price`} className="text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Preço Unit</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400/60">R$</span><input id={`${itemId}-price`} type="number" step="0.01" inputMode="decimal" className="w-full pl-9 pr-3 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-right font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all" value={item.pricePerUnit} onChange={(e) => handleUpdateItem(item.id, 'pricePerUnit', e.target.value)} /></div></div>
                    </div>
                    <div className="flex items-end justify-between pt-4 border-t border-dashed border-zinc-100/80 dark:border-white/5">
                        <div className="flex flex-col"><span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300 dark:text-zinc-600 mb-0.5">Total</span><span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{getTotalQuantity(item)} {item.unit}</span></div>
                        <div className="flex flex-col items-end"><span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400 dark:text-indigo-400/80 mb-0.5">Valor</span><span className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-tight tabular-nums">{formatCurrency(getItemTotal(item) * (1 + taxRate))}</span></div>
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div layout className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border transition-all ${stockBorderClass} border-zinc-200/60 dark:border-white/5 shadow-sm cursor-pointer`} onClick={() => onSelectIngredient?.(item)}>
            <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-zinc-900 dark:text-white truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1"><span className="text-xs text-zinc-500">{item.packageQuantity} {item.unit} × {item.packageCount}</span><span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">= {getTotalQuantity(item)} {item.unit}</span></div>
                </div>
                <div className="text-right ml-3"><span className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(getItemTotal(item) * (1 + taxRate))}</span><p className="text-[10px] text-zinc-400">{formatCurrency(item.pricePerUnit)}/{item.unit}</p></div>
            </div>
        </motion.div>
    )
}
