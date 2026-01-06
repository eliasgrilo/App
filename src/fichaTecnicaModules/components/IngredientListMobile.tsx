// ═══════════════════════════════════════════════════════════════════
// IngredientListMobile — Mobile list for ingredients
// Refactored: 182 → ~35 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { IngredientListMobileProps, MobileEditCard, MobileViewCard } from './ingredientListModules'

export function IngredientListMobile({ ingredients, editingId, setEditingId, handleUpdateIngredient, handleDeleteIngredient, getItemCost, formatCurrency, totalCost }: IngredientListMobileProps): React.ReactElement | null {
    if (ingredients.length === 0) return null

    return (
        <div className="md:hidden space-y-4">
            {ingredients.map((ing) => (
                <div key={ing.id} className={`relative backdrop-blur-xl rounded-[1.5rem] p-5 border transition-all duration-500 ${editingId === ing.id ? 'bg-white/90 dark:bg-zinc-900/90 border-indigo-500/20 shadow-[0_8px_30px_rgb(99,102,241,0.06)] scale-[1.01]' : 'bg-white/60 dark:bg-zinc-900/40 border-white/40 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:bg-white/80 dark:hover:bg-zinc-900/60'}`}>
                    {editingId === ing.id
                        ? <MobileEditCard ing={ing} setEditingId={setEditingId} handleUpdateIngredient={handleUpdateIngredient} handleDeleteIngredient={handleDeleteIngredient} getItemCost={getItemCost} formatCurrency={formatCurrency} />
                        : <MobileViewCard ing={ing} setEditingId={setEditingId} handleUpdateIngredient={handleUpdateIngredient} handleDeleteIngredient={handleDeleteIngredient} getItemCost={getItemCost} formatCurrency={formatCurrency} />
                    }
                </div>
            ))}
            {/* Mobile Total */}
            <div className="bg-zinc-900 dark:bg-white rounded-[2rem] p-5 shadow-xl"><div className="flex items-center justify-between"><span className="text-[10px] font-bold text-white/60 dark:text-zinc-500 uppercase tracking-widest">Total da Receita</span><span className="text-2xl font-bold text-white dark:text-zinc-900 tabular-nums">{formatCurrency(totalCost)}</span></div></div>
        </div>
    )
}

export default IngredientListMobile
