// ═══════════════════════════════════════════════════════════════════
// FT ADD INGREDIENT MODULES — Form Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { InventoryItemLocal, NewIngredientState } from './types'
import { StockService } from '../../types'

interface SearchInputProps { value: string; matched: boolean; onChange: (val: string) => void; onMatch: (item: InventoryItemLocal | null) => void; inventoryItems: InventoryItemLocal[]; handleNameChange: (name: string) => void; setNewIngredient: React.Dispatch<React.SetStateAction<NewIngredientState>> }

export const SearchInput: React.FC<SearchInputProps> = ({ value, matched, onChange, onMatch, handleNameChange, setNewIngredient }) => (
    <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
        <input id="cat-ing-name-input" type="text" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('cat-ing-qty-input')?.focus() } }}
            className={`w-full pl-12 pr-4 py-4 rounded-2xl text-base font-semibold transition-all ${matched ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-zinc-50/50 dark:bg-black/20 border border-zinc-200/50 dark:border-white/5 text-zinc-900 dark:text-white shadow-inner focus:shadow-lg focus:bg-white dark:focus:bg-black/40'} focus:outline-none focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-white/10 placeholder:text-zinc-400`}
            placeholder="Buscar no estoque..." value={value} onChange={e => { onChange(e.target.value); if (matched) { onMatch(null); setNewIngredient(prev => ({ ...prev, pricePerUnit: '', isSyncedFromInventory: false, inventoryItemId: null })) }; handleNameChange(e.target.value) }} autoFocus />
        {matched && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div>}
    </div>
)

interface AutoCompleteProps { items: InventoryItemLocal[]; search: string; matched: boolean; onSelect: (item: InventoryItemLocal) => void }

export const AutoComplete: React.FC<AutoCompleteProps> = ({ items, search, matched, onSelect }) => {
    if (search.length < 3 || matched) return null
    const normalizedSearch = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const queryWords = normalizedSearch.split(/\s+/).filter(w => w.length > 0)

    const matches = items.filter(i => {
        const normalizedName = i.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
        const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 0)

        // Query words must be <= name words (allows partial matching)
        if (queryWords.length > nameWords.length) return false

        // Each query word must START the corresponding name word in sequence
        return queryWords.every((qWord, idx) => nameWords[idx]?.startsWith(qWord) ?? false)
    }).slice(0, 6)
    return (
        <div className="mt-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100/80 dark:border-zinc-800 overflow-hidden max-h-[50vh] overflow-y-auto custom-scrollbar animate-fade-in pb-2">
            {matches.length === 0 && search.length > 1 ? (
                <div className="p-5 text-center"><div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mb-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nenhum item encontrado</p><p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Adicione "{search}" ao Estoque primeiro</p></div>
            ) : matches.map((item, idx) => (
                <button key={item.id} onClick={() => onSelect(item)} className={`w-full text-left px-5 py-4 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors group ${idx !== matches.length - 1 ? 'border-b border-zinc-200/50 dark:border-zinc-700/50' : ''}`}>
                    <div><span className="font-semibold text-zinc-900 dark:text-white">{item.name}</span><span className="text-xs text-zinc-400 dark:text-zinc-500 ml-2">{StockService.getTotalQuantity(item)} {item.unit}</span></div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            ))}
        </div>
    )
}

interface SyncIndicatorProps { item: InventoryItemLocal; formatCurrency: (v: number) => string }

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ item, formatCurrency }) => (
    <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
        <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 truncate">{item.name}</p><p className="text-xs text-emerald-600 dark:text-emerald-400">Estoque: {StockService.getTotalQuantity(item)} {item.unit} • {formatCurrency(item.packageCount * item.pricePerUnit)}</p></div>
        </div>
    </div>
)

interface CostPreviewProps { quantity: string; unit: string; pricePerUnit: string; formatPrice: (v: number | string) => string; formatCurrency: (v: number) => string }

export const CostPreview: React.FC<CostPreviewProps> = ({ quantity, unit, pricePerUnit, formatPrice, formatCurrency }) => (
    <div className="mb-6 p-5 rounded-2xl bg-zinc-900 dark:bg-white">
        <div className="text-[10px] font-bold text-white/50 dark:text-zinc-900/50 uppercase tracking-widest mb-2">Custo Calculado</div>
        <div className="flex items-end justify-between">
            <div className="text-sm text-white/70 dark:text-zinc-600">{quantity} {unit} × {formatPrice(pricePerUnit)}/{unit}</div>
            <div className="text-3xl font-bold text-white dark:text-zinc-900 tabular-nums">{formatCurrency(Number(quantity) * Number(pricePerUnit))}</div>
        </div>
    </div>
)
