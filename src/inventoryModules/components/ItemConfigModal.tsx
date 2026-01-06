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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xl" onClick={onClose} />
                <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 400, damping: 32 }} className="relative w-full max-w-[380px] rounded-[32px] overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%)', backdropFilter: 'blur(40px) saturate(180%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 12px 24px rgba(0,0,0,0.15)' }}>
                    <div className="absolute inset-0 bg-[#1c1c1e]/98 dark:block hidden" />
                    {/* Header */}
                    <div className="relative z-10 flex items-center justify-between px-6 py-4 pt-8"><h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Configurar Limites</h3><motion.button onClick={onClose} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></motion.button></div>
                    {/* Content */}
                    <div className="relative z-10 px-6 pb-6">
                        <ItemBadge item={localItem} total={total} status={status} />
                        <LimitInputs item={localItem} onChange={handleChange} />
                        <motion.button onClick={onClose} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} className="w-full py-4 rounded-2xl text-[15px] font-bold uppercase tracking-wider text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>Salvar Limites</motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

export default ItemConfigModal
