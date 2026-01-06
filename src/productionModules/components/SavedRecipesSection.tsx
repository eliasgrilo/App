// ═══════════════════════════════════════════════════════════════════
// Production Module — Saved Recipes Section
// ═══════════════════════════════════════════════════════════════════

import type { Recipes } from '../types'

interface SavedRecipesSectionProps {
    recipes: Recipes
    onLoad: (name: string) => void
    onRename: (name: string) => void
    onDelete: (name: string) => void
}

export function SavedRecipesSection({ recipes, onLoad, onRename, onDelete }: SavedRecipesSectionProps) {
    const recipeNames = Object.keys(recipes)

    return (
        <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Receitas Salvas</h2>
            {recipeNames.length === 0 ? (
                <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Nenhum protocolo registrado.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {recipeNames.map((name) => (
                        <li key={name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-zinc-100/80 dark:hover:border-white/10 transition-all">
                            <div className="font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">{name}</div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onLoad(name)}
                                    className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    Carregar
                                </button>
                                <button onClick={() => onRename(name)}
                                    className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all">
                                    Renomear
                                </button>
                                <button onClick={() => onDelete(name)}
                                    className="flex-none p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
