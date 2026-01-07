/**
 * ═══════════════════════════════════════════════════════════════════
 * FichaTecnica — Premium multi-pizza recipe management
 * Refactored: ~140 lines (lean orchestrator)
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { useInventoryItems } from './Inventory'
import { useCurrency } from './stores/useCurrencyStore'
import { useModal, useToast } from './stores/useUIStore'
import { useAppStore, useRecipes } from './stores/useAppStore'
import type { NewRecipe } from './types'
import { CreatePizzaModal, PizzaGridView, PizzaDetailView, AddIngredientModal, InputModal, useFichaTecnicaState, useFichaTecnicaHandlers, Pizza, InventoryItemLocal } from './fichaTecnicaModules'

export default function FichaTecnica() {
    const storeRecipes = useRecipes(); const { addRecipe, updateRecipe, removeRecipe } = useAppStore(); const pizzas = storeRecipes as unknown as Pizza[]
    const inventoryItems = useInventoryItems() as InventoryItemLocal[]; const { formatCurrency } = useCurrency(); const { modal } = useModal(); const { toast } = useToast()
    const state = useFichaTecnicaState()
    const toastHelper = { success: (msg: string) => toast.success(msg), error: (msg: string) => toast.error(msg), info: (msg: string) => toast.info(msg) }
    const handlers = useFichaTecnicaHandlers({ pizzas, selectedPizzaId: state.selectedPizzaId, setSelectedPizzaId: state.setSelectedPizzaId, setEditingId: state.setEditingId, newPizzaName: state.newPizzaName, setNewPizzaName: state.setNewPizzaName, setIsCreatingPizza: state.setIsCreatingPizza, setIsAddingIngredient: state.setIsAddingIngredient, newIngredient: state.newIngredient, setNewIngredient: state.setNewIngredient, matchedInventoryItem: state.matchedInventoryItem, setMatchedInventoryItem: state.setMatchedInventoryItem, setInputModal: state.setInputModal, inventoryItems, addRecipe: addRecipe as (recipe: NewRecipe) => void, updateRecipe, removeRecipe, formatCurrency, toast: toastHelper, modal })

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40"><div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div><div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div></div>
            {/* Action Button */}
            <div className="relative z-10 flex justify-end mb-2">
                <button onClick={() => state.setIsCreatingPizza(true)} className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>Nova Pizza</button>
            </div>
            {/* Modals & Views */}
            <AnimatePresence>{state.isCreatingPizza && <CreatePizzaModal newPizzaName={state.newPizzaName} setNewPizzaName={state.setNewPizzaName} setIsCreatingPizza={state.setIsCreatingPizza} handleCreatePizza={handlers.handleCreatePizza} />}</AnimatePresence>
            {!state.selectedPizzaId && <PizzaGridView pizzas={pizzas} setSelectedPizzaId={state.setSelectedPizzaId} setIsCreatingPizza={state.setIsCreatingPizza} handleRenamePizza={handlers.handleRenamePizza} handleDeletePizza={handlers.handleDeletePizza} formatCurrency={formatCurrency} getItemCost={handlers.getItemCost} />}
            {handlers.selectedPizza && <PizzaDetailView pizza={handlers.selectedPizza} totals={handlers.totals} editingId={state.editingId} setEditingId={state.setEditingId} setSelectedPizzaId={state.setSelectedPizzaId} setIsAddingIngredient={state.setIsAddingIngredient} isAddingIngredient={state.isAddingIngredient} handleUpdateIngredient={handlers.handleUpdateIngredient} handleDeleteIngredient={handlers.handleDeleteIngredient} getItemCost={handlers.getItemCost} formatCurrency={formatCurrency} />}
            <AnimatePresence><AddIngredientModal isOpen={state.isAddingIngredient} onClose={() => state.setIsAddingIngredient(false)} newIngredient={state.newIngredient} setNewIngredient={state.setNewIngredient} matchedInventoryItem={state.matchedInventoryItem} setMatchedInventoryItem={state.setMatchedInventoryItem} inventoryItems={inventoryItems} handleIngredientNameChange={handlers.handleIngredientNameChange} handleUnitChange={handlers.handleUnitChange} handleAddIngredient={handlers.handleAddIngredient} formatCurrency={formatCurrency} formatPrice={handlers.formatPrice} /></AnimatePresence>
            <AnimatePresence><InputModal modalState={state.inputModal} /></AnimatePresence>
        </div>
    )
}
