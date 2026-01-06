// ═══════════════════════════════════════════════════════════════════
// STOCK MOVEMENT MODULES — Form Fields Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { UnitType, UNITS, MOVEMENT_TYPES, REASON_BY_TYPE, MovementForm } from './types'

interface TypeSelectorProps { type: 'entrada' | 'saida'; setForm: (fn: (f: MovementForm) => MovementForm) => void }
interface QuantityFieldsProps { form: MovementForm; setForm: (fn: (f: MovementForm) => MovementForm) => void }
interface ReasonFieldsProps { form: MovementForm; setForm: (fn: (f: MovementForm) => MovementForm) => void }

export const TypeSelector: React.FC<TypeSelectorProps> = ({ type, setForm }) => (
    <fieldset>
        <legend className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Tipo</legend>
        <div className="flex flex-wrap gap-2">
            {Object.entries(MOVEMENT_TYPES).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setForm(f => ({ ...f, type: k as 'entrada' | 'saida', reasonLabel: REASON_BY_TYPE[k as 'entrada' | 'saida'][0] || '' }))} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${type === k ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{v.label}</button>
            ))}
        </div>
    </fieldset>
)

export const QuantityFields: React.FC<QuantityFieldsProps> = ({ form, setForm }) => (
    <div className="grid grid-cols-2 gap-3">
        <div>
            <label htmlFor="movement-qty" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Quantidade</label>
            <input id="movement-qty" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" className="w-full h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[20px] font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-300 outline-none" />
        </div>
        <div>
            <label htmlFor="movement-unit" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Unidade</label>
            <select id="movement-unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value as UnitType }))} className="w-full h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[17px] font-medium text-zinc-900 dark:text-white outline-none cursor-pointer appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '18px' }}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
        </div>
    </div>
)

export const ReasonFields: React.FC<ReasonFieldsProps> = ({ form, setForm }) => (
    <fieldset>
        <legend className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Motivo</legend>
        <div className="flex flex-wrap gap-2 mb-3">{REASON_BY_TYPE[form.type].map((label: string) => <button key={label} type="button" onClick={() => setForm(f => ({ ...f, reasonLabel: label }))} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${form.reasonLabel === label ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>{label}</button>)}</div>
        <label htmlFor="movement-reason-note" className="sr-only">Nota do motivo</label>
        <input id="movement-reason-note" type="text" value={form.reasonNote} onChange={e => setForm(f => ({ ...f, reasonNote: e.target.value }))} placeholder="Digitar o motivo:" className="w-full h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none" />
    </fieldset>
)
