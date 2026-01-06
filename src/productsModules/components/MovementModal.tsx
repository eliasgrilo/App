// ═══════════════════════════════════════════════════════════════════
// MovementModal — Movement recording modal
// Refactored: 162 → ~30 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import { MovementModalProps, TypeSelector, ItemSearchField, QuantityFields, ReasonFields } from './movementModalModules'

export function MovementModal({ open, form, itemSearch, filteredItems, selectedItem, showItemResults, getStock, setForm, setItemSearch, setShowItemResults, setOpen, onSave, onSelectItem, onClearItem, onChangeType }: MovementModalProps) {
    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[10000] flex items-start justify-center">
                    <ModalScrollLock />
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl" onClick={() => setOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }} className="relative w-full md:max-w-md bg-white dark:bg-zinc-900 md:bg-white/95 md:dark:bg-zinc-900/95 md:backdrop-blur-2xl md:rounded-[24px] shadow-2xl overflow-hidden mt-16 md:mt-20 mx-4 md:mx-0 rounded-2xl" style={{ marginTop: 'max(calc(env(safe-area-inset-top, 0px) + 60px), 60px)' }}>
                        <div className="flex items-center justify-between px-5 pt-4 pb-2"><div className="w-12" /><h3 className="text-[17px] font-semibold text-zinc-900 dark:text-white">Nova Movimentação</h3><button onClick={() => setOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                        <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 mx-4" />
                        <div className="px-6 py-6 space-y-5">
                            <TypeSelector form={form} onChangeType={onChangeType} />
                            <ItemSearchField selectedItem={selectedItem} itemSearch={itemSearch} filteredItems={filteredItems} showItemResults={showItemResults} getStock={getStock} setItemSearch={setItemSearch} setForm={setForm} setShowItemResults={setShowItemResults} onSelectItem={onSelectItem} onClearItem={onClearItem} />
                            <QuantityFields form={form} setForm={setForm} />
                            <ReasonFields form={form} setForm={setForm} />
                            <div className="flex gap-3 pt-2"><button onClick={() => setOpen(false)} className="flex-1 h-14 rounded-2xl font-semibold text-[17px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98]">Cancelar</button><button onClick={onSave} className="flex-[1.5] h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[17px] hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-lg">Salvar</button></div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
