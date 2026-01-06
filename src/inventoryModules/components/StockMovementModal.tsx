/**
 * ═══════════════════════════════════════════════════════════════════
 * STOCK MOVEMENT MODAL — New Movement Entry
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface InventoryItem {
    id: number
    name: string
    packageQuantity: number
    packageCount: number
    unit: string
    pricePerUnit: number
}

type UnitType = 'kg' | 'g' | 'L' | 'mL' | 'un'

const UNITS: UnitType[] = ['kg', 'g', 'L', 'mL', 'un']

const MOVEMENT_TYPES: Record<string, { label: string; color: string; isOut: boolean }> = {
    entrada: { label: 'Entrada', color: 'emerald', isOut: false },
    saida: { label: 'Saída', color: 'red', isOut: true },
}

const REASON_BY_TYPE: Record<'entrada' | 'saida', string[]> = {
    entrada: ['Compra', 'Recebimento', 'Ajuste +', 'Devolução', 'Sobra de Produção'],
    saida: ['Produção', 'Venda', 'Perda', 'Ajuste -', 'Expirado']
}

interface StockMovementModalProps {
    isOpen: boolean
    onClose: () => void
    items: InventoryItem[]
    onSaveMovement: (data: {
        itemId: number
        itemName: string
        type: 'entrada' | 'saida'
        quantity: number
        unit: string
        previousStock: number
        newStock: number
        costAtTime: number
        reason: string
    }) => void
    getStock: (item: InventoryItem) => number
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function StockMovementModal({
    isOpen,
    onClose,
    items,
    onSaveMovement,
    getStock
}: StockMovementModalProps): React.ReactElement | null {
    const [itemSearch, setItemSearch] = useState('')
    const [showResults, setShowResults] = useState(false)
    const [form, setForm] = useState({
        type: 'entrada' as 'entrada' | 'saida',
        itemId: 0,
        qty: '',
        unit: 'kg' as UnitType,
        reasonLabel: 'Sobra de Produção',
        reasonNote: ''
    })

    const filteredItems = useMemo(() => {
        if (!itemSearch.trim() || itemSearch.trim().length < 2) return []
        const words = itemSearch.toLowerCase().split(/\s+/).filter(w => w.length > 0)
        return items.filter(i => {
            const name = i.name.toLowerCase()
            return words.every(word => name.split(/\s+/).some(nameWord => nameWord.startsWith(word)))
        }).slice(0, 6)
    }, [items, itemSearch])

    const selectedItem = items.find(i => i.id === form.itemId)

    const handleSave = useCallback(() => {
        if (!form.itemId || !form.qty || !form.reasonLabel) return
        const item = items.find(i => i.id === form.itemId)
        if (!item) return

        const q = parseFloat(form.qty)
        const t = MOVEMENT_TYPES[form.type]
        if (!t) return
        const prev = getStock(item)
        const next = t.isOut ? prev - q : prev + q
        const fullReason = form.reasonNote ? `${form.reasonLabel} - ${form.reasonNote}` : form.reasonLabel

        onSaveMovement({
            itemId: item.id,
            itemName: item.name,
            type: form.type,
            quantity: q,
            unit: form.unit,
            previousStock: prev,
            newStock: next,
            costAtTime: (item.pricePerUnit || 0) * q,
            reason: fullReason
        })

        // Reset
        setForm({ type: 'entrada', itemId: 0, qty: '', unit: 'kg', reasonLabel: 'Sobra de Produção', reasonNote: '' })
        setItemSearch('')
        onClose()
    }, [form, items, getStock, onSaveMovement, onClose])

    const handleClose = () => {
        setForm({ type: 'entrada', itemId: 0, qty: '', unit: 'kg', reasonLabel: 'Sobra de Produção', reasonNote: '' })
        setItemSearch('')
        onClose()
    }

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-start justify-center">
                <ModalScrollLock />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl"
                    onClick={handleClose}
                />
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative w-full md:max-w-md bg-white dark:bg-zinc-900 md:rounded-[24px] shadow-2xl overflow-hidden mt-16 md:mt-20 mx-4 md:mx-0 rounded-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                        <div className="w-12" />
                        <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-white">Nova Movimentação</h3>
                        <button
                            onClick={handleClose}
                            className="w-12 h-12 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 mx-4" />

                    <div className="px-6 py-6 space-y-5">
                        {/* Type */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Tipo</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(MOVEMENT_TYPES).map(([k, v]) => (
                                    <button
                                        key={k}
                                        onClick={() => setForm(f => ({ ...f, type: k as 'entrada' | 'saida', reasonLabel: REASON_BY_TYPE[k as 'entrada' | 'saida'][0] || '' }))}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${form.type === k
                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                            }`}
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Item Search */}
                        <div className="relative">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Item</label>
                            <div className="relative">
                                {selectedItem ? (
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                                <input
                                    type="text"
                                    value={selectedItem ? selectedItem.name : itemSearch}
                                    onChange={e => {
                                        setItemSearch(e.target.value)
                                        setForm(f => ({ ...f, itemId: 0 }))
                                        setShowResults(true)
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    placeholder="Buscar ingrediente..."
                                    className={`w-full h-14 pl-12 pr-12 rounded-2xl text-[17px] font-medium placeholder:text-zinc-400 outline-none transition-all ${selectedItem
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                                        }`}
                                />
                                {selectedItem && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForm(f => ({ ...f, itemId: 0 }))
                                            setItemSearch('')
                                            setShowResults(true)
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-zinc-300 dark:bg-zinc-600"
                                    >
                                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <AnimatePresence>
                                {showResults && !selectedItem && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden max-h-64 overflow-y-auto"
                                    >
                                        {filteredItems.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-zinc-400 text-sm">Nenhum item encontrado</div>
                                        ) : (
                                            filteredItems.map(i => (
                                                <button
                                                    key={i.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setForm(f => ({ ...f, itemId: i.id, unit: (i.unit as UnitType) || 'kg' }))
                                                        setItemSearch('')
                                                        setShowResults(false)
                                                    }}
                                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-left"
                                                >
                                                    <span className="text-[15px] font-medium text-zinc-800 dark:text-zinc-100">{i.name}</span>
                                                    <span className="text-xs text-zinc-400">{getStock(i).toFixed(1)} {i.unit}</span>
                                                </button>
                                            ))
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {selectedItem && <p className="text-xs text-zinc-400 mt-2 ml-1">Estoque atual: {getStock(selectedItem).toFixed(2)} {selectedItem.unit}</p>}
                        </div>

                        {/* Quantity + Unit */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Quantidade</label>
                                <input
                                    type="number"
                                    value={form.qty}
                                    onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                                    placeholder="0"
                                    className="w-full h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[20px] font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-300 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Unidade</label>
                                <select
                                    value={form.unit}
                                    onChange={e => setForm(f => ({ ...f, unit: e.target.value as UnitType }))}
                                    className="w-full h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[17px] font-medium text-zinc-900 dark:text-white outline-none cursor-pointer appearance-none"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '18px' }}
                                >
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Motivo</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {REASON_BY_TYPE[form.type].map((label: string) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, reasonLabel: label }))}
                                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${form.reasonLabel === label
                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={form.reasonNote}
                                onChange={e => setForm(f => ({ ...f, reasonNote: e.target.value }))}
                                placeholder="Digitar o motivo:"
                                className="w-full h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                            />
                        </div>
                    </div>

                    {/* Save */}
                    <div className="px-6 pb-6">
                        <button
                            onClick={handleSave}
                            className="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Salvar Movimentação
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    )
}

export default StockMovementModal
