// ═══════════════════════════════════════════════════════════════════
// MOVEMENT MODAL MODULES — Premium Components (Apple Standard)
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Ingredient } from '../../../types'
import { TYPES, UNITS, REASON_BY_TYPE, type MovementForm, type SimpleMovementType, type UnitType } from '../../types'

export interface MovementModalProps { open: boolean; form: MovementForm; itemSearch: string; filteredItems: Ingredient[]; selectedItem: Ingredient | undefined; showItemResults: boolean; getStock: (i: Ingredient) => number; setForm: React.Dispatch<React.SetStateAction<MovementForm>>; setItemSearch: (val: string) => void; setShowItemResults: (val: boolean) => void; setOpen: (val: boolean) => void; onSave: () => void; onSelectItem: (item: Ingredient) => void; onClearItem: () => void; onChangeType: (type: SimpleMovementType) => void }

// ═══════════════════════════════════════════════════════════════════
// TYPE SELECTOR — Premium Pills with Micro-Animations
// ═══════════════════════════════════════════════════════════════════
export const TypeSelector: React.FC<{ form: MovementForm; onChangeType: (t: SimpleMovementType) => void; firstInputRef?: React.RefObject<HTMLButtonElement | null> }> = ({ form, onChangeType, firstInputRef }) => (
    <fieldset>
        <legend className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.08em] mb-3">
            Tipo de Movimentação
        </legend>
        <div className="flex flex-wrap gap-2.5">
            {Object.entries(TYPES).map(([k, v], idx) => {
                const isSelected = form.type === k
                const isFirst = idx === 0
                return (
                    <motion.button
                        key={k}
                        ref={isFirst ? firstInputRef : undefined}
                        type="button"
                        onClick={() => onChangeType(k as SimpleMovementType)}
                        whileHover={{ scale: isSelected ? 1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            relative overflow-hidden
                            px-5 py-3
                            rounded-[14px]
                            text-[13px] font-bold uppercase tracking-wide
                            transition-all duration-200
                            ${isSelected
                                ? `bg-${v.color}-50 dark:bg-${v.color}-500/20 text-${v.color}-700 dark:text-${v.color}-400 ring-2 ring-${v.color}-500/40 shadow-sm`
                                : `bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80`
                            }
                        `}
                    >
                        {isSelected && (
                            <motion.div
                                layoutId="typeIndicator"
                                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {v.label}
                        </span>
                    </motion.button>
                )
            })}
        </div>
    </fieldset>
)

// ═══════════════════════════════════════════════════════════════════
// ITEM SEARCH FIELD — Premium Autocomplete with States
// ═══════════════════════════════════════════════════════════════════
export const ItemSearchField: React.FC<{
    selectedItem: Ingredient | undefined;
    itemSearch: string;
    filteredItems: Ingredient[];
    showItemResults: boolean;
    getStock: (i: Ingredient) => number;
    setItemSearch: (v: string) => void;
    setForm: React.Dispatch<React.SetStateAction<MovementForm>>;
    setShowItemResults: (v: boolean) => void;
    onSelectItem: (i: Ingredient) => void;
    onClearItem: () => void;
    inputRef?: React.RefObject<HTMLInputElement | null>
}> = ({ selectedItem, itemSearch, filteredItems, showItemResults, getStock, setItemSearch, setForm, setShowItemResults, onSelectItem, onClearItem, inputRef }) => (
    <div className="relative">
        <label
            htmlFor="products-item-search"
            className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.08em] mb-3"
        >
            Ingrediente
        </label>

        {/* Input Field with Premium States */}
        <motion.div
            className="relative"
            animate={selectedItem ? { scale: [1, 1.01, 1] } : {}}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
            {/* Icon - Dynamic based on state */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                <AnimatePresence mode="wait">
                    {selectedItem ? (
                        <motion.svg
                            key="check"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            className="h-5 w-5 text-emerald-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </motion.svg>
                    ) : (
                        <motion.svg
                            key="search"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="h-5 w-5 text-zinc-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </motion.svg>
                    )}
                </AnimatePresence>
            </div>

            {/* Input */}
            <input
                id="products-item-search"
                type="text"
                value={selectedItem ? selectedItem.name : itemSearch}
                onChange={e => {
                    setItemSearch(e.target.value)
                    setForm(f => ({ ...f, itemId: 0 }))
                    setShowItemResults(true)
                }}
                onFocus={() => setShowItemResults(true)}
                placeholder="Buscar ingrediente..."
                autoComplete="off"
                className={`
                    w-full h-[56px]
                    pl-12 pr-14
                    rounded-[16px]
                    text-[17px] font-medium
                    placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                    outline-none
                    transition-all duration-200
                    ${selectedItem
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 shadow-sm'
                        : 'bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 focus:ring-2 focus:ring-violet-500/30'
                    }
                `}
            />

            {/* Clear Button - Premium */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        type="button"
                        onClick={onClearItem}
                        className="
                            absolute right-4 top-1/2 -translate-y-1/2
                            w-7 h-7
                            flex items-center justify-center
                            rounded-full
                            bg-zinc-400 dark:bg-zinc-600
                            hover:bg-zinc-500 dark:hover:bg-zinc-500
                            active:bg-zinc-600 dark:active:bg-zinc-400
                            transition-colors duration-150
                        "
                        aria-label="Limpar seleção"
                    >
                        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>

        {/* Autocomplete Dropdown - Premium */}
        <AnimatePresence>
            {showItemResults && !selectedItem && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    className="
                        absolute z-50 w-full mt-2
                        bg-white/98 dark:bg-zinc-800/98
                        backdrop-blur-2xl
                        rounded-[20px]
                        shadow-2xl shadow-black/10
                        border border-zinc-200/50 dark:border-white/10
                        overflow-hidden
                        max-h-72 overflow-y-auto
                    "
                >
                    {filteredItems.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center">
                                <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                Nenhum ingrediente encontrado
                            </p>
                        </div>
                    ) : (
                        filteredItems.map((i, idx) => (
                            <motion.button
                                key={i.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03, duration: 0.15 }}
                                type="button"
                                onClick={() => {
                                    onSelectItem(i)
                                    setShowItemResults(false)
                                }}
                                className="
                                    w-full px-5 py-4
                                    flex items-center justify-between
                                    hover:bg-zinc-50 dark:hover:bg-zinc-700/50
                                    active:bg-zinc-100 dark:active:bg-zinc-700
                                    transition-colors duration-150
                                    text-left
                                    border-b border-zinc-100 dark:border-zinc-700/50
                                    last:border-0
                                "
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-100">
                                        {i.name}
                                    </span>
                                    <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
                                        {i.category || 'Sem categoria'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                    <span className="text-[13px] font-bold text-zinc-600 dark:text-zinc-300 tabular-nums">
                                        {getStock(i).toFixed(1)}
                                    </span>
                                    <span className="text-[11px] text-zinc-400 uppercase">
                                        {i.unit}
                                    </span>
                                </div>
                            </motion.button>
                        ))
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Stock Info - Refined */}
        <AnimatePresence>
            {selectedItem && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="
                        text-[13px] text-zinc-500 dark:text-zinc-400 font-medium
                        mt-2.5 ml-1
                        flex items-center gap-1.5
                    "
                >
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>
                        Estoque atual: <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{getStock(selectedItem).toFixed(2)}</span> {selectedItem.unit}
                    </span>
                </motion.p>
            )}
        </AnimatePresence>
    </div>
)

// ═══════════════════════════════════════════════════════════════════
// QUANTITY FIELDS — Premium Number Input
// ═══════════════════════════════════════════════════════════════════
export const QuantityFields: React.FC<{ form: MovementForm; setForm: React.Dispatch<React.SetStateAction<MovementForm>>; selectedItem?: Ingredient }> = ({ form, setForm, selectedItem }) => (
    <div>
        <label
            htmlFor="products-qty"
            className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.08em] mb-3"
        >
            Quantidade e Unidade
        </label>
        <div className="flex gap-3">
            {/* Quantity Input - Premium */}
            <motion.div
                className="flex-1 relative"
                whileFocus={{ scale: 1.01 }}
            >
                <input
                    id="products-qty"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.qty}
                    onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                    placeholder="0.00"
                    className="
                        w-full h-[56px]
                        px-6
                        rounded-[16px]
                        bg-zinc-100/80 dark:bg-zinc-800/80
                        text-[20px] text-zinc-900 dark:text-white font-bold
                        placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                        outline-none
                        text-center
                        tabular-nums
                        transition-all duration-200
                        hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80
                        focus:ring-2 focus:ring-violet-500/30
                        focus:bg-white dark:focus:bg-zinc-800
                    "
                />
            </motion.div>

            {/* Unit Select - Premium */}
            <div className="relative">
                <label htmlFor="products-unit" className="sr-only">Unidade</label>
                <select
                    id="products-unit"
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value as UnitType }))}
                    className="
                        w-24 h-[56px]
                        px-4 pr-10
                        rounded-[16px]
                        bg-zinc-100/80 dark:bg-zinc-800/80
                        text-[15px] text-zinc-700 dark:text-zinc-200 font-bold
                        text-center
                        outline-none
                        cursor-pointer
                        transition-all duration-200
                        hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80
                        focus:ring-2 focus:ring-violet-500/30
                        appearance-none
                    "
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                        backgroundSize: '16px'
                    }}
                >
                    {UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                </select>
            </div>
        </div>
    </div>
)

// ═══════════════════════════════════════════════════════════════════
// REASON FIELDS — Premium Reason Selection
// ═══════════════════════════════════════════════════════════════════
export const ReasonFields: React.FC<{ form: MovementForm; setForm: React.Dispatch<React.SetStateAction<MovementForm>> }> = ({ form, setForm }) => (
    <fieldset>
        <legend className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.08em] mb-3">
            Motivo da Movimentação
        </legend>

        {/* Reason Pills - Premium */}
        <div className="flex flex-wrap gap-2 mb-4">
            {REASON_BY_TYPE[form.type].map(label => {
                const isSelected = form.reasonLabel === label
                return (
                    <motion.button
                        key={label}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, reasonLabel: label }))}
                        whileHover={{ scale: isSelected ? 1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            px-4 py-2
                            rounded-[12px]
                            text-[13px] font-semibold
                            transition-all duration-200
                            ${isSelected
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md'
                                : 'bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80'
                            }
                        `}
                    >
                        {label}
                    </motion.button>
                )
            })}
        </div>

        {/* Custom Reason Note - Premium */}
        <div className="relative">
            <label htmlFor="products-reason-note" className="sr-only">Nota do motivo</label>
            <input
                id="products-reason-note"
                type="text"
                value={form.reasonNote}
                onChange={e => setForm(f => ({ ...f, reasonNote: e.target.value }))}
                placeholder="Adicionar observações (opcional)"
                className="
                    w-full h-[56px]
                    px-6
                    rounded-[16px]
                    bg-zinc-100/80 dark:bg-zinc-800/80
                    text-[15px] text-zinc-900 dark:text-white font-medium
                    placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                    outline-none
                    transition-all duration-200
                    hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80
                    focus:ring-2 focus:ring-violet-500/30
                    focus:bg-white dark:focus:bg-zinc-800
                "
            />
        </div>
    </fieldset>
)
