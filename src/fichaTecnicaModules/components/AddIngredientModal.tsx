// ═══════════════════════════════════════════════════════════════════
// AddIngredientModal — Modal for adding new ingredient
// Refactored: 287 → ~70 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import { UNIT_TO_BASE, calculatePricePerBaseUnit } from '../types'
import { AddIngredientModalProps, InventoryItemLocal, SearchInput, AutoComplete, SyncIndicator, CostPreview } from './addIngredientModules'

export function AddIngredientModal({ isOpen, onClose, newIngredient, setNewIngredient, matchedInventoryItem, setMatchedInventoryItem, inventoryItems, handleIngredientNameChange, handleUnitChange, handleAddIngredient, formatCurrency, formatPrice }: AddIngredientModalProps): React.ReactElement | null {
    if (!isOpen) return null

    const handleClose = () => { setNewIngredient({ name: '', quantity: '', unit: 'g', pricePerUnit: '', isSyncedFromInventory: false, inventoryItemId: null }); setMatchedInventoryItem(null); onClose() }
    const handleSelectInventoryItem = (item: InventoryItemLocal) => {
        setMatchedInventoryItem(item)
        const pricePerBaseUnit = calculatePricePerBaseUnit(item); const targetUnitToBase = UNIT_TO_BASE[newIngredient.unit] || 1
        setNewIngredient(prev => ({ ...prev, name: item.name, pricePerUnit: (pricePerBaseUnit * targetUnitToBase).toFixed(6), isSyncedFromInventory: true, inventoryItemId: item.id }))
    }

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-start md:items-center justify-center">
            <ModalScrollLock />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl" onClick={handleClose} />
            <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }} className="relative w-full md:max-w-lg bg-white dark:bg-zinc-900 md:bg-white/95 md:dark:bg-zinc-900/95 md:backdrop-blur-2xl rounded-2xl md:rounded-[24px] p-6 md:p-8 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar mx-4 md:mx-0 mt-16 md:mt-0" style={{ marginTop: 'max(calc(env(safe-area-inset-top, 0px) + 60px), 60px)' }}>
                <div className="md:hidden w-full flex justify-center mb-5"><div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></div></div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Novo Ingrediente</h3><button onClick={handleClose} className="p-2 -mr-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div>
                {/* Search Input */}
                <div className="relative mb-5">
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Nome do Ingrediente</label>
                    <SearchInput value={newIngredient.name} matched={!!matchedInventoryItem} onChange={val => setNewIngredient(prev => ({ ...prev, name: val }))} onMatch={setMatchedInventoryItem} inventoryItems={inventoryItems} handleNameChange={handleIngredientNameChange} setNewIngredient={setNewIngredient} />
                    <AutoComplete items={inventoryItems} search={newIngredient.name} matched={!!matchedInventoryItem} onSelect={handleSelectInventoryItem} />
                </div>
                {matchedInventoryItem && <SyncIndicator item={matchedInventoryItem} formatCurrency={formatCurrency} />}
                {/* Unit Selector (manual) */}
                {!matchedInventoryItem && (
                    <div className="mb-5"><label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Unidade</label><select className="w-full px-4 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-zinc-900 dark:text-white text-lg font-bold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none text-center" value={newIngredient.unit} onChange={(e) => handleUnitChange(e.target.value)}><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option><option value="un">un</option></select></div>
                )}
                {/* Quantity & Unit Row */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <div><label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Quantidade</label><input id="cat-ing-qty-input" type="number" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddIngredient(true) } }} step="any" inputMode="decimal" className="w-full px-4 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100/80 dark:border-white/5 text-zinc-900 dark:text-white text-right text-lg font-bold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/20 transition-all" placeholder="0" value={newIngredient.quantity} onChange={e => setNewIngredient(prev => ({ ...prev, quantity: e.target.value }))} /></div>
                    {matchedInventoryItem && <div><label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Unidade</label><div className="w-full px-4 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-100/80 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 text-lg font-semibold text-center">{newIngredient.unit}</div></div>}
                </div>
                {matchedInventoryItem && newIngredient.quantity && <CostPreview quantity={newIngredient.quantity} unit={newIngredient.unit} pricePerUnit={newIngredient.pricePerUnit} formatPrice={formatPrice} formatCurrency={formatCurrency} />}
                {/* Action Buttons */}
                <div className="flex gap-3 safe-area-bottom">
                    <button onClick={handleClose} className="flex-1 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98]">Cancelar</button>
                    <button onClick={() => handleAddIngredient(false)} disabled={!newIngredient.name || !newIngredient.quantity} className="flex-[2] px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 shadow-lg shadow-zinc-900/20 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">Adicionar</button>
                </div>
            </motion.div>
        </div>,
        document.body
    )
}

export default AddIngredientModal
