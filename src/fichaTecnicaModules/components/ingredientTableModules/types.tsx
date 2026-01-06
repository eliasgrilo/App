// ═══════════════════════════════════════════════════════════════════
// INGREDIENT TABLE DESKTOP MODULES — Types & Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import type { ID } from '../../../types'
import type { PizzaIngredient } from '../../types'

export interface IngredientTableDesktopProps { ingredients: PizzaIngredient[]; editingId: ID | null; setEditingId: (id: ID | null) => void; handleUpdateIngredient: (id: ID, field: string, value: string | number) => void; handleDeleteIngredient: (id: ID) => void; getItemCost: (ing: PizzaIngredient) => number; formatCurrency: (v: number) => string; totalCost: number }

interface RowProps { ing: PizzaIngredient; editingId: ID | null; setEditingId: (id: ID | null) => void; handleUpdateIngredient: (id: ID, field: string, value: string | number) => void; handleDeleteIngredient: (id: ID) => void; getItemCost: (ing: PizzaIngredient) => number; formatCurrency: (v: number) => string }

export const EditRow: React.FC<{ ing: PizzaIngredient; setEditingId: (id: ID | null) => void; handleUpdateIngredient: (id: ID, field: string, value: string | number) => void; handleDeleteIngredient: (id: ID) => void; getItemCost: (ing: PizzaIngredient) => number; formatCurrency: (v: number) => string }> = ({ ing, setEditingId, handleUpdateIngredient, handleDeleteIngredient, getItemCost, formatCurrency }) => (
    <>
        <div className="col-span-4"><input id={`edit-ing-name-${ing.id}`} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(`edit-ing-qty-${ing.id}`)?.focus() } }} type="text" className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border-none text-zinc-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20" value={ing.name} onChange={e => handleUpdateIngredient(ing.id, 'name', e.target.value)} onBlur={() => { if (!ing.name.trim() && (!ing.quantity || ing.quantity === 0)) handleDeleteIngredient(ing.id) }} /></div>
        <div className="col-span-2"><input id={`edit-ing-qty-${ing.id}`} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(`edit-ing-price-${ing.id}`)?.focus() } }} type="number" step="any" inputMode="decimal" className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border-none text-zinc-900 dark:text-white text-sm text-right font-medium focus:ring-2 focus:ring-indigo-500/20" value={ing.quantity} onChange={e => handleUpdateIngredient(ing.id, 'quantity', e.target.value)} onBlur={() => { if (!ing.name.trim() && (!ing.quantity || ing.quantity === 0)) handleDeleteIngredient(ing.id) }} /></div>
        <div className="col-span-1"><select className="w-full px-2 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border-none text-zinc-900 dark:text-white text-sm text-center font-medium focus:ring-2 focus:ring-indigo-500/20" value={ing.unit} onChange={e => handleUpdateIngredient(ing.id, 'unit', e.target.value)}><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option><option value="un">un</option></select></div>
        <div className="col-span-2"><input id={`edit-ing-price-${ing.id}`} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setEditingId(null) } }} type="number" step="1" inputMode="numeric" className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border-none text-zinc-900 dark:text-white text-sm text-right font-medium focus:ring-2 focus:ring-indigo-500/20" value={ing.pricePerUnit} onChange={e => handleUpdateIngredient(ing.id, 'pricePerUnit', e.target.value)} /></div>
        <div className="col-span-2 text-right"><span className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(getItemCost(ing))}</span></div>
        <div className="col-span-1 flex justify-end gap-1">
            <button onClick={() => setEditingId(null)} className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
            <button onClick={() => handleDeleteIngredient(ing.id)} className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
        </div>
    </>
)

export const ViewRow: React.FC<{ ing: PizzaIngredient; setEditingId: (id: ID | null) => void; getItemCost: (ing: PizzaIngredient) => number; formatCurrency: (v: number) => string }> = ({ ing, setEditingId, getItemCost, formatCurrency }) => (
    <>
        <div className="col-span-4"><span className="text-sm font-medium text-zinc-900 dark:text-white">{ing.name}</span></div>
        <div className="col-span-2 text-right"><span className="text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">{ing.quantity}</span></div>
        <div className="col-span-1 text-center"><span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-full">{ing.unit}</span></div>
        <div className="col-span-2 text-right"><span className="text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">{Math.round(Number(ing.pricePerUnit) || 0)}</span></div>
        <div className="col-span-2 text-right"><span className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(getItemCost(ing))}</span></div>
        <div className="col-span-1 flex justify-end"><button onClick={() => setEditingId(ing.id)} className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button></div>
    </>
)
