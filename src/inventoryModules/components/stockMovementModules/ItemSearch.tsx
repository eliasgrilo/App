// ═══════════════════════════════════════════════════════════════════
// STOCK MOVEMENT MODULES — Item Search Component
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { InventoryItem, UnitType, MovementForm } from './types'

interface ItemSearchProps { items: InventoryItem[]; selectedItem: InventoryItem | undefined; itemSearch: string; showResults: boolean; filteredItems: InventoryItem[]; setItemSearch: (s: string) => void; setShowResults: (s: boolean) => void; setForm: (fn: (f: MovementForm) => MovementForm) => void; getStock: (item: InventoryItem) => number }

export const ItemSearch: React.FC<ItemSearchProps> = ({ selectedItem, itemSearch, showResults, filteredItems, setItemSearch, setShowResults, setForm, getStock }) => (
    <div className="relative">
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Item</label>
        <div className="relative">
            {selectedItem ? <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            <input type="text" value={selectedItem ? selectedItem.name : itemSearch} onChange={e => { setItemSearch(e.target.value); setForm(f => ({ ...f, itemId: 0 })); setShowResults(true) }} onFocus={() => setShowResults(true)} placeholder="Buscar ingrediente..."
                className={`w-full h-14 pl-12 pr-12 rounded-2xl text-[17px] font-medium placeholder:text-zinc-400 outline-none transition-all ${selectedItem ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'}`} />
            {selectedItem && <button type="button" onClick={() => { setForm(f => ({ ...f, itemId: 0 })); setItemSearch(''); setShowResults(true) }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-zinc-300 dark:bg-zinc-600"><svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
        </div>
        <AnimatePresence>
            {showResults && !selectedItem && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden max-h-64 overflow-y-auto">
                    {filteredItems.length === 0 ? <div className="px-4 py-6 text-center text-zinc-400 text-sm">Nenhum item encontrado</div> : filteredItems.map(i => <button key={i.id} type="button" onClick={() => { setForm(f => ({ ...f, itemId: i.id, unit: (i.unit as UnitType) || 'kg' })); setItemSearch(''); setShowResults(false) }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-left"><span className="text-[15px] font-medium text-zinc-800 dark:text-zinc-100">{i.name}</span><span className="text-xs text-zinc-400">{getStock(i).toFixed(1)} {i.unit}</span></button>)}
                </motion.div>
            )}
        </AnimatePresence>
        {selectedItem && <p className="text-xs text-zinc-400 mt-2 ml-1">Estoque atual: {getStock(selectedItem).toFixed(2)} {selectedItem.unit}</p>}
    </div>
)
