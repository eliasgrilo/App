/**
 * ═══════════════════════════════════════════════════════════════════
 * PizzaGridView — Pizza list/grid view component
 * Extracted from FichaTecnica.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import type { ID } from '../../types'
import type { Pizza, PizzaIngredient } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface PizzaGridViewProps {
    pizzas: Pizza[]
    setSelectedPizzaId: (id: ID) => void
    setIsCreatingPizza: (v: boolean) => void
    handleRenamePizza: (id: ID) => void
    handleDeletePizza: (id: ID) => void
    formatCurrency: (v: number) => string
    getItemCost: (ing: PizzaIngredient) => number
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function PizzaGridView({
    pizzas = [],
    setSelectedPizzaId,
    setIsCreatingPizza,
    handleRenamePizza,
    handleDeletePizza,
    formatCurrency,
    getItemCost
}: PizzaGridViewProps): React.ReactElement {

    const calculateTotals = (ingredients: PizzaIngredient[] = []): number => {
        if (!Array.isArray(ingredients)) return 0
        return ingredients.reduce((sum, ing) => sum + getItemCost(ing), 0)
    }

    const safePizzas = Array.isArray(pizzas) ? pizzas : []

    return (
        <section className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {safePizzas.map((pizza) => {
                const ingredients = pizza.ingredients || []
                const totalCost = calculateTotals(ingredients)
                return (
                    <button
                        type="button"
                        key={pizza.id}
                        onClick={() => setSelectedPizzaId(pizza.id)}
                        className="group relative bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all cursor-pointer active:scale-[0.98] shadow-xl hover:shadow-2xl overflow-hidden text-left w-full"
                    >
                        {/* Subtle Gradient on Hover */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        <div className="relative">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{pizza.name}</h3>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{ingredients.length} ingrediente{ingredients.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRenamePizza(pizza.id) }}
                                        className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeletePizza(pizza.id) }}
                                        className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Cost Display */}
                            <div className="mb-6">
                                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Custo Total</span>
                                <div className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight tabular-nums mt-1">
                                    {formatCurrency(totalCost)}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-100/80 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Ver detalhes
                                </div>
                                <div className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{ingredients.length} itens</span>
                                </div>
                            </div>
                        </div>
                    </button>
                )
            })}

            {/* Empty State */}
            {safePizzas.length === 0 && (
                <div className="col-span-full text-center py-20 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-zinc-50/50 dark:bg-white/[0.01]"></div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 mx-auto bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Nenhuma Pizza Cadastrada</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm font-medium">Comece criando sua primeira receita</p>
                        <button
                            onClick={() => setIsCreatingPizza(true)}
                            className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                        >
                            Criar Primeira Pizza
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}

export default PizzaGridView
