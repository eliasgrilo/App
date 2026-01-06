// ═══════════════════════════════════════════════════════════════════
// MOVEMENT MODAL MODULES — Types & Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Ingredient } from '../../../types'
import { TYPES, UNITS, REASON_BY_TYPE, type MovementForm, type SimpleMovementType, type UnitType } from '../../types'

export interface MovementModalProps { open: boolean; form: MovementForm; itemSearch: string; filteredItems: Ingredient[]; selectedItem: Ingredient | undefined; showItemResults: boolean; getStock: (i: Ingredient) => number; setForm: React.Dispatch<React.SetStateAction<MovementForm>>; setItemSearch: (val: string) => void; setShowItemResults: (val: boolean) => void; setOpen: (val: boolean) => void; onSave: () => void; onSelectItem: (item: Ingredient) => void; onClearItem: () => void; onChangeType: (type: SimpleMovementType) => void }

export const TypeSelector: React.FC<{ form: MovementForm; onChangeType: (t: SimpleMovementType) => void }> = ({ form, onChangeType }) => (
    <fieldset><legend className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Tipo</legend><div className="flex flex-wrap gap-2">{Object.entries(TYPES).map(([k, v]) => (<button key={k} type="button" onClick={() => onChangeType(k as SimpleMovementType)} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${form.type === k ? `bg-${v.color}-50 dark:bg-${v.color}-500/20 text-${v.color}-600 dark:text-${v.color}-400 ring-2 ring-${v.color}-500/30` : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{v.label}</button>))}</div></fieldset>
)

export const ItemSearchField: React.FC<{ selectedItem: Ingredient | undefined; itemSearch: string; filteredItems: Ingredient[]; showItemResults: boolean; getStock: (i: Ingredient) => number; setItemSearch: (v: string) => void; setForm: React.Dispatch<React.SetStateAction<MovementForm>>; setShowItemResults: (v: boolean) => void; onSelectItem: (i: Ingredient) => void; onClearItem: () => void }> = ({ selectedItem, itemSearch, filteredItems, showItemResults, getStock, setItemSearch, setForm, setShowItemResults, onSelectItem, onClearItem }) => (
    <div className="relative">
        <label htmlFor="products-item-search" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Item</label>
        <motion.div className="relative" animate={selectedItem ? { scale: [1, 1.02, 1] } : {}} transition={{ duration: 0.2 }}>
            {selectedItem ? <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            <input id="products-item-search" type="text" value={selectedItem ? selectedItem.name : itemSearch} onChange={e => { setItemSearch(e.target.value); setForm(f => ({ ...f, itemId: 0 })); setShowItemResults(true) }} onFocus={() => setShowItemResults(true)} placeholder="Buscar ingrediente..." className={`w-full h-14 pl-12 pr-12 rounded-2xl text-[17px] font-medium placeholder:text-zinc-400 outline-none transition-all ${selectedItem ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'}`} />
            {selectedItem && <button type="button" onClick={onClearItem} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500 transition-colors"><svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
        </motion.div>
        <AnimatePresence>{showItemResults && !selectedItem && (<motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden max-h-64 overflow-y-auto">{filteredItems.length === 0 ? <div className="px-4 py-6 text-center text-zinc-400 text-sm">Nenhum item encontrado</div> : filteredItems.map(i => (<button key={i.id} type="button" onClick={() => { onSelectItem(i); setShowItemResults(false) }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-left"><span className="text-[15px] font-medium text-zinc-800 dark:text-zinc-100">{i.name}</span><span className="text-xs text-zinc-400">{getStock(i).toFixed(1)} {i.unit}</span></button>))}</motion.div>)}</AnimatePresence>
        {selectedItem && <p className="text-xs text-zinc-400 mt-2 ml-1">Estoque atual: {getStock(selectedItem).toFixed(2)} {selectedItem.unit}</p>}
    </div>
)

export const QuantityFields: React.FC<{ form: MovementForm; setForm: React.Dispatch<React.SetStateAction<MovementForm>> }> = ({ form, setForm }) => (
    <div>
        <label htmlFor="products-qty" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Quantidade</label>
        <div className="flex gap-2">
            <input id="products-qty" type="number" step="0.01" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" className="flex-1 h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[17px] text-zinc-900 dark:text-white font-medium outline-none text-center tabular-nums" />
            <label htmlFor="products-unit" className="sr-only">Unidade</label>
            <select id="products-unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value as UnitType }))} className="w-20 h-14 px-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[15px] text-zinc-700 dark:text-zinc-200 font-semibold text-center outline-none cursor-pointer">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
        </div>
    </div>
)

export const ReasonFields: React.FC<{ form: MovementForm; setForm: React.Dispatch<React.SetStateAction<MovementForm>> }> = ({ form, setForm }) => (
    <fieldset>
        <legend className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Motivo</legend>
        <div className="flex flex-wrap gap-2 mb-3">{REASON_BY_TYPE[form.type].map(label => (<button key={label} type="button" onClick={() => setForm(f => ({ ...f, reasonLabel: label }))} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.reasonLabel === label ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>{label}</button>))}</div>
        <label htmlFor="products-reason-note" className="sr-only">Nota do motivo</label>
        <input id="products-reason-note" type="text" value={form.reasonNote} onChange={e => setForm(f => ({ ...f, reasonNote: e.target.value }))} placeholder="Digitar o motivo:" className="w-full h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[17px] text-zinc-900 dark:text-white font-medium placeholder:text-zinc-400 outline-none" />
    </fieldset>
)
