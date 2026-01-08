// ═══════════════════════════════════════════════════════════════════
// ITEM CONFIG MODAL — Premium Apple Glassmorphism Design
// Refactored: 214 → ~50 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import { ItemConfigModalProps, InventoryItem, ItemBadge, LimitInputs } from './itemConfigModules'

export function ItemConfigModal({ item, onClose, onUpdateItem, getStockStatus, getTotalQuantity }: ItemConfigModalProps): React.ReactElement | null {
    const [localItem, setLocalItem] = React.useState<InventoryItem | null>(item)
    React.useEffect(() => { setLocalItem(item) }, [item])
    if (!item || !localItem) return null

    const handleChange = (field: keyof InventoryItem, value: string) => { const numValue = Number(value) || 0; setLocalItem(prev => prev ? { ...prev, [field]: numValue } : null); onUpdateItem(item.id, field, value) }
    const status = getStockStatus(localItem); const total = getTotalQuantity(localItem)

    return createPortal(
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
                <ModalScrollLock />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0" onClick={onClose} style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(40px) saturate(180%)' }} />
                <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 400, damping: 32 }} className="relative w-full max-w-[380px] rounded-[2.5rem] overflow-hidden bg-white/95 dark:bg-black" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.5) inset, 0 25px 50px -12px rgba(0,0,0,0.15)', backdropFilter: 'blur(40px) saturate(180%)' }}>
                    {/* Header */}
                    <div className="relative z-10 flex items-center justify-between px-6 py-4 pt-8"><h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Configurar Limites</h3><motion.button onClick={onClose} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></motion.button></div>
                    {/* Content */}
                    <div className="relative z-10 px-6 pb-6">
                        <ItemBadge item={localItem} total={total} status={status} />
                        <LimitInputs item={localItem} onChange={handleChange} />
                        <motion.button onClick={onClose} whileTap={{ scale: 0.98 }} className="w-full h-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[15px] font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-lg transition-all active:scale-[0.98]">Salvar</motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

export default ItemConfigModal
