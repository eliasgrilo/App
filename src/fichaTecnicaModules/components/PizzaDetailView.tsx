// ═══════════════════════════════════════════════════════════════════
// PizzaDetailView — Pizza detail/summary view component
// Refactored: 178 → ~40 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { IngredientTableDesktop } from './IngredientTableDesktop'
import { IngredientListMobile } from './IngredientListMobile'
import { PizzaDetailViewProps, SummaryCard, EmptyIngredientsState } from './pizzaDetailModules'

export function PizzaDetailView({ pizza, totals, editingId, setEditingId, setSelectedPizzaId, setIsAddingIngredient, isAddingIngredient, handleUpdateIngredient, handleDeleteIngredient, getItemCost, formatCurrency }: PizzaDetailViewProps): React.ReactElement {
    return (
        <div className="relative z-10 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Back Button & Pizza Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => setSelectedPizzaId(null)} className="p-3 rounded-2xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                <div className="flex-1"><h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{pizza.name}</h2><p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">{pizza.ingredients.length} ingrediente{pizza.ingredients.length !== 1 ? 's' : ''} cadastrado{pizza.ingredients.length !== 1 ? 's' : ''}</p></div>
            </div>
            {/* Summary Card */}
            <SummaryCard ingredientCount={pizza.ingredients.length} totals={totals} formatCurrency={formatCurrency} />
            {/* Add Ingredient Button */}
            {!isAddingIngredient && <button onClick={() => setIsAddingIngredient(true)} className="w-full px-8 py-5 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 border-2 border-dashed border-zinc-200/80 dark:border-zinc-700 transition-all active:scale-[0.99] flex items-center justify-center gap-3 group shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Adicionar Ingrediente</button>}
            {/* Ingredients Table - Desktop */}
            <IngredientTableDesktop ingredients={pizza.ingredients} editingId={editingId} setEditingId={setEditingId} handleUpdateIngredient={handleUpdateIngredient} handleDeleteIngredient={handleDeleteIngredient} getItemCost={getItemCost} formatCurrency={formatCurrency} totalCost={totals.totalCost} />
            {/* Ingredients List - Mobile */}
            <IngredientListMobile ingredients={pizza.ingredients} editingId={editingId} setEditingId={setEditingId} handleUpdateIngredient={handleUpdateIngredient} handleDeleteIngredient={handleDeleteIngredient} getItemCost={getItemCost} formatCurrency={formatCurrency} totalCost={totals.totalCost} />
            {/* Empty Ingredients State */}
            {pizza.ingredients.length === 0 && !isAddingIngredient && <EmptyIngredientsState setIsAddingIngredient={setIsAddingIngredient} />}
        </div>
    )
}

export default PizzaDetailView
