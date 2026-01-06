// ═══════════════════════════════════════════════════════════════════
// STOCK MOVEMENT MODAL — New Movement Entry
// Refactored: 328 → ~70 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import { StockMovementModalProps, MovementForm, UnitType, MOVEMENT_TYPES, ItemSearch, TypeSelector, QuantityFields, ReasonFields } from './stockMovementModules'

export function StockMovementModal({ isOpen, onClose, items, onSaveMovement, getStock }: StockMovementModalProps): React.ReactElement | null {
    const [itemSearch, setItemSearch] = useState(''); const [showResults, setShowResults] = useState(false)
    const [form, setForm] = useState<MovementForm>({ type: 'entrada', itemId: 0, qty: '', unit: 'kg', reasonLabel: 'Sobra de Produção', reasonNote: '' })

    const filteredItems = useMemo(() => {
        if (!itemSearch.trim() || itemSearch.trim().length < 2) return []
        const words = itemSearch.toLowerCase().split(/\s+/).filter(w => w.length > 0)
        return items.filter(i => { const name = i.name.toLowerCase(); return words.every(word => name.split(/\s+/).some(nameWord => nameWord.startsWith(word))) }).slice(0, 6)
    }, [items, itemSearch])

    const selectedItem = items.find(i => i.id === form.itemId)

    const handleSave = useCallback(() => {
        if (!form.itemId || !form.qty || !form.reasonLabel) return
        const item = items.find(i => i.id === form.itemId); if (!item) return
        const q = parseFloat(form.qty); const t = MOVEMENT_TYPES[form.type]; if (!t) return
        const prev = getStock(item); const next = t.isOut ? prev - q : prev + q
        const fullReason = form.reasonNote ? `${form.reasonLabel} - ${form.reasonNote}` : form.reasonLabel
        onSaveMovement({ itemId: item.id, itemName: item.name, type: form.type, quantity: q, unit: form.unit, previousStock: prev, newStock: next, costAtTime: (item.pricePerUnit || 0) * q, reason: fullReason })
        setForm({ type: 'entrada', itemId: 0, qty: '', unit: 'kg', reasonLabel: 'Sobra de Produção', reasonNote: '' }); setItemSearch(''); onClose()
    }, [form, items, getStock, onSaveMovement, onClose])

    const handleClose = () => { setForm({ type: 'entrada', itemId: 0, qty: '', unit: 'kg', reasonLabel: 'Sobra de Produção', reasonNote: '' }); setItemSearch(''); onClose() }
    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-start justify-center">
                <ModalScrollLock />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl" onClick={handleClose} />
                <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="relative w-full md:max-w-md bg-white dark:bg-zinc-900 md:rounded-[24px] shadow-2xl overflow-hidden mt-16 md:mt-20 mx-4 md:mx-0 rounded-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                        <div className="w-12" /><h3 className="text-[17px] font-semibold text-zinc-900 dark:text-white">Nova Movimentação</h3>
                        <button onClick={handleClose} className="w-12 h-12 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 mx-4" />
                    <div className="px-6 py-6 space-y-5">
                        <TypeSelector type={form.type} setForm={setForm} />
                        <ItemSearch items={items} selectedItem={selectedItem} itemSearch={itemSearch} showResults={showResults} filteredItems={filteredItems} setItemSearch={setItemSearch} setShowResults={setShowResults} setForm={setForm} getStock={getStock} />
                        <QuantityFields form={form} setForm={setForm} />
                        <ReasonFields form={form} setForm={setForm} />
                    </div>
                    <div className="px-6 pb-6"><button onClick={handleSave} className="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">Salvar Movimentação</button></div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    )
}

export default StockMovementModal
