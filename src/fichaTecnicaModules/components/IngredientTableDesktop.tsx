// ═══════════════════════════════════════════════════════════════════
// IngredientTableDesktop — Desktop table for ingredients
// Refactored: 174 → ~35 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { IngredientTableDesktopProps, EditRow, ViewRow } from './ingredientTableModules'

export function IngredientTableDesktop({ ingredients, editingId, setEditingId, handleUpdateIngredient, handleDeleteIngredient, getItemCost, formatCurrency, totalCost }: IngredientTableDesktopProps): React.ReactElement | null {
    if (ingredients.length === 0) return null

    return (
        <div className="hidden md:block rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-6 px-8 py-5 border-b border-zinc-100/80 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                <div className="col-span-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Ingrediente</div>
                <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Qtd</div>
                <div className="col-span-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Un</div>
                <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">UND</div>
                <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Custo</div>
                <div className="col-span-1"></div>
            </div>
            {/* Table Body */}
            <div className="divide-y divide-zinc-100/50 dark:divide-white/5">{ingredients.map(ing => (
                <div key={ing.id} className="grid grid-cols-12 gap-6 px-8 py-5 items-center hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors duration-300 group">
                    {editingId === ing.id ? <EditRow ing={ing} setEditingId={setEditingId} handleUpdateIngredient={handleUpdateIngredient} handleDeleteIngredient={handleDeleteIngredient} getItemCost={getItemCost} formatCurrency={formatCurrency} /> : <ViewRow ing={ing} setEditingId={setEditingId} getItemCost={getItemCost} formatCurrency={formatCurrency} />}
                </div>
            ))}</div>
            {/* Table Footer */}
            <div className="grid grid-cols-12 gap-6 px-8 py-5 bg-zinc-900 dark:bg-white"><div className="col-span-9 text-[10px] font-bold text-white/60 dark:text-zinc-500 uppercase tracking-widest text-right self-center">Total da Receita</div><div className="col-span-2 text-right"><span className="text-xl font-bold text-white dark:text-zinc-900 tabular-nums">{formatCurrency(totalCost)}</span></div><div className="col-span-1"></div></div>
        </div>
    )
}

export default IngredientTableDesktop
