/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY FILTERS — Premium Search & Category Chips
 * Apple-style search input with subcategory filter chips
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface InventoryFiltersProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    activeSubcategoryFilter: string | null
    setActiveSubcategoryFilter: (filter: string | null) => void
    subcategories: string[]
    filteredItemsCount: number
    onManageCategories: () => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function InventoryFilters({
    searchQuery,
    setSearchQuery,
    activeSubcategoryFilter,
    setActiveSubcategoryFilter,
    subcategories,
    filteredItemsCount,
    onManageCategories
}: InventoryFiltersProps): React.ReactElement {
    return (
        <section className="relative z-10 mb-6">
            <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-5 border border-zinc-200/50 dark:border-white/10 shadow-lg">
                {/* Search Input */}
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-white/5 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all placeholder:text-zinc-400"
                        placeholder="Buscar produto por nome ou subcategoria..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Subcategory Filter Chips */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                    <button
                        onClick={() => setActiveSubcategoryFilter('None')}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeSubcategoryFilter === 'None'
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                    >
                        None
                    </button>
                    <button
                        onClick={() => setActiveSubcategoryFilter(null)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeSubcategoryFilter === null
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                    >
                        Todos
                    </button>
                    {subcategories.filter(sub => sub !== 'None').map(sub => (
                        <button
                            key={sub}
                            onClick={() => setActiveSubcategoryFilter(activeSubcategoryFilter === sub ? null : sub)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeSubcategoryFilter === sub
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                }`}
                        >
                            {sub}
                        </button>
                    ))}

                    {/* Settings Button */}
                    <button
                        onClick={onManageCategories}
                        className="ml-auto w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all touch-manipulation group"
                        title="Gerenciar Categorias"
                    >
                        <svg className="h-4 w-4 transition-transform group-hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>

                {/* Active Filters Indicator */}
                {(searchQuery || activeSubcategoryFilter) && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100/80 dark:border-zinc-800">
                        <span className="text-xs text-zinc-500">
                            {filteredItemsCount} {filteredItemsCount === 1 ? 'resultado' : 'resultados'}
                        </span>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveSubcategoryFilter(null); }}
                            className="text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                        >
                            Limpar filtros
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}

export default InventoryFilters
