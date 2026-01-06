// ═══════════════════════════════════════════════════════════════════
// PIZZA DETAIL VIEW MODULES — Types & Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import type { ID } from '../../../types'
import type { Pizza, PizzaIngredient } from '../../types'

export interface PizzaDetailViewProps { pizza: Pizza; totals: { totalCost: number; costPerPizza: number }; editingId: ID | null; setEditingId: (id: ID | null) => void; setSelectedPizzaId: (id: ID | null) => void; setIsAddingIngredient: (v: boolean) => void; isAddingIngredient: boolean; handleUpdateIngredient: (id: ID, field: string, value: string | number) => void; handleDeleteIngredient: (id: ID) => void; getItemCost: (ing: PizzaIngredient) => number; formatCurrency: (v: number) => string }

interface SummaryCardProps { ingredientCount: number; totals: { totalCost: number; costPerPizza: number }; formatCurrency: (v: number) => string }

export const SummaryCard: React.FC<SummaryCardProps> = ({ ingredientCount, totals, formatCurrency }) => (
    <div className="relative group">
        <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-[250ms]0"></div>
            <div className="relative">
                <div className="flex justify-between items-start mb-12"><div><h3 className="text-[10px] font-bold text-zinc-400 dark:text-indigo-300/60 uppercase tracking-widest cursor-text hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Recipe Cost Matrix</h3><p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide mt-1">Protocol Status: Calculated</p></div><div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live Pricing</span></div></div>
                <div className="flex flex-col gap-2"><span className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest ml-1">Custo Total da Receita</span><div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none flex flex-wrap items-baseline gap-2 md:gap-3">{formatCurrency(totals.totalCost)}</div></div>
            </div>
            <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100/80 dark:border-white/5">
                <div className="flex flex-col gap-1.5"><span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Ingredients</span><div className="flex items-baseline gap-1"><span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{ingredientCount}</span><span className="text-xs font-medium text-zinc-400">itens</span></div></div>
                <div className="flex flex-col gap-1.5"><span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Cost per Unit</span><div className="flex items-baseline gap-1"><span className="text-2xl md:text-3xl font-semibold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">{formatCurrency(totals.costPerPizza)}</span><span className="text-xs font-medium text-indigo-500/60">/pizza</span></div></div>
            </div>
        </div>
    </div>
)

interface EmptyStateProps { setIsAddingIngredient: (v: boolean) => void }

export const EmptyIngredientsState: React.FC<EmptyStateProps> = ({ setIsAddingIngredient }) => (
    <div className="text-center py-16 rounded-[2.5rem] bg-white dark:bg-zinc-950 border-2 border-dashed border-zinc-200/80 dark:border-zinc-700 shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-zinc-50/50 dark:bg-white/[0.01]"></div><div className="relative z-10"><div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-5 shadow-inner"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></div><h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Nenhum Ingrediente</h3><p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm font-medium">Comece adicionando ingredientes à receita</p><button onClick={() => setIsAddingIngredient(true)} className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">Adicionar Primeiro Ingrediente</button></div>
    </div>
)
