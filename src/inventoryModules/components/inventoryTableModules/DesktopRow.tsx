// ═══════════════════════════════════════════════════════════════════
// INVENTORY TABLE MODULES — Desktop Row Component
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { RowProps, unitOptions } from './types'
import { getCombinedAlertStatus } from '../../../services/stockService'

export const DesktopRow: React.FC<RowProps> = ({ item, isEditing, taxRate, subcategories, formatCurrency, getStockStatus, getTotalQuantity, getItemTotal, handleUpdateItem, handleDeleteItem, setEditingId, onSelectIngredient }) => {
    if (isEditing) {
        return (
            <div className="grid grid-cols-12 gap-6 px-8 py-5 items-center hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors duration-300 group">
                <div className="col-span-3">
                    <input type="text" className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-zinc-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all" value={item.name} onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)} placeholder="Nome do item" />
                    {item.category === 'Ingredientes' && <select className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-200/50 dark:border-white/5 text-xs font-medium text-zinc-600 dark:text-zinc-400 outline-none cursor-pointer" value={item.subcategory || ''} onChange={(e) => handleUpdateItem(item.id, 'subcategory', e.target.value)}>{subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}</select>}
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                    <input type="number" step="0.01" className="flex-1 min-w-0 px-2 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-right text-sm font-medium focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all" value={item.packageQuantity} onChange={(e) => handleUpdateItem(item.id, 'packageQuantity', e.target.value)} />
                    <select className="shrink-0 w-14 px-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-sm font-medium text-zinc-600 dark:text-zinc-400 outline-none cursor-pointer" value={item.unit} onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}>{unitOptions.map(u => <option key={u} value={u}>{u}</option>)}</select>
                </div>
                <div className="col-span-1"><input type="number" min="1" className="w-full px-2 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-center text-sm font-semibold focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all" value={item.packageCount} onChange={(e) => handleUpdateItem(item.id, 'packageCount', e.target.value)} /></div>
                <div className="col-span-2 flex items-center justify-end"><span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{getTotalQuantity(item)} {item.unit}</span></div>
                <div className="col-span-2"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">R$</span><input type="number" step="0.01" className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/10 text-right text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all" value={item.pricePerUnit} onChange={(e) => handleUpdateItem(item.id, 'pricePerUnit', e.target.value)} /></div></div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(getItemTotal(item) * (1 + taxRate))}</span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setEditingId(null)} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                </div>
            </div>
        )
    }

    const status = getStockStatus(item)
    const alertStatus = getCombinedAlertStatus(item)
    return (
        <div onClick={() => onSelectIngredient?.(item)} className="grid grid-cols-12 gap-6 px-8 py-5 items-center hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors duration-300 group cursor-pointer">
            <div className="col-span-3 flex items-center gap-2">
                {alertStatus === 'critical' && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" title="Estoque crítico ou validade próxima" />}
                {alertStatus === 'warning' && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" title="Estoque baixo ou validade em atenção" />}
                {status === 'excess' && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]" title="Acima do máximo" />}
                <span className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">{item.name}</span>
            </div>
            <div className="col-span-2 text-center"><span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 text-xs font-medium text-zinc-600 dark:text-zinc-400 tabular-nums">{item.packageQuantity} {item.unit}</span></div>
            <div className="col-span-1 text-center"><span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{item.packageCount}×</span></div>
            <div className="col-span-2 text-right"><span className="text-sm font-semibold text-zinc-900 dark:text-white">{getTotalQuantity(item)} {item.unit}</span></div>
            <div className="col-span-2 text-right"><span className="text-sm text-zinc-600 dark:text-zinc-400">{formatCurrency(item.pricePerUnit)}</span></div>
            <div className="col-span-2 flex items-center justify-end gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(getItemTotal(item) * (1 + taxRate))}</span>
                <button onClick={(e) => { e.stopPropagation(); setEditingId(item.id) }} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
            </div>
        </div>
    )
}
