// ═══════════════════════════════════════════════════════════════════
// RecipeListView — Recipe list/grid view component
// Refactored: 233 → ~60 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { Icons } from './RecipeIcons'
import { getCategoryName } from '../utils/recipeUtils'
import { RecipeListViewProps, RecipeCard } from './recipeListModules'

export function RecipeListView({ recipes, filtered, categories, activeFilter, setActiveFilter, setSelectedId, setIsEditing, setShowCatModal, onAddRecipe, onDeleteRecipe, modal }: RecipeListViewProps): React.ReactElement {
    const displayRecipes = activeFilter === 'Todas' ? filtered : filtered.filter(r => r.category === activeFilter)

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">
            {/* Action Button */}
            <div className="relative z-10 flex justify-end mb-2">
                <button onClick={onAddRecipe} className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"><Icons.Plus />Criar Nova Receita</button>
            </div>
            {/* Filters */}
            <div className="sticky top-4 z-30 mb-8 py-4 overflow-x-auto scrollbar-hidden bg-zinc-50/80 dark:bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-50/50">
                <div className="flex items-center gap-2 w-max">
                    {['Todas', ...categories].map(cat => <button key={getCategoryName(cat)} onClick={() => setActiveFilter(getCategoryName(cat))} className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${activeFilter === getCategoryName(cat) ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/50 dark:border-zinc-800'}`}>{getCategoryName(cat)}</button>)}
                    <button onClick={() => setShowCatModal(true)} className="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-200/50 dark:border-zinc-800 text-zinc-400 hover:text-indigo-500 hover:border-indigo-500/50 transition-all bg-white dark:bg-zinc-900 shadow-sm active:scale-90" title="Gerenciar Biblioteca"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                </div>
            </div>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {displayRecipes.map(r => <RecipeCard key={r.id} recipe={r} categories={categories} onClick={() => { setSelectedId(r.id); setIsEditing(false) }} onDelete={() => onDeleteRecipe(r.id)} modal={modal} />)}
                {displayRecipes.length === 0 && (
                    <div className="col-span-full py-32 text-center rounded-[3rem] border border-zinc-200/50 dark:border-white/5 bg-white/30 dark:bg-white/[0.02] backdrop-blur-sm relative overflow-hidden group"><div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.02] to-transparent" /><div className="relative z-10"><div className="w-24 h-24 mx-auto mb-8 relative"><div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" /><div className="relative w-full h-full bg-white dark:bg-zinc-900 rounded-full border border-zinc-100/80 dark:border-zinc-800 flex items-center justify-center shadow-2xl"><Icons.Book /></div></div><h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">Expandir a Coleção</h3><p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium max-w-xs mx-auto leading-relaxed">Nenhuma receita encontrada em <span className="text-zinc-900 dark:text-zinc-200 font-bold">{activeFilter}</span>. Que tal criar algo novo?</p></div></div>
                )}
            </div>
        </motion.div>
    )
}

export default RecipeListView
