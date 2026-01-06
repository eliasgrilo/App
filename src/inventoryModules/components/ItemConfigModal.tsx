/**
 * ═══════════════════════════════════════════════════════════════════
 * ITEM CONFIG MODAL — Premium Apple Glassmorphism Design
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
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
    category: string
    minStock?: number
    maxStock?: number
    criticalStock?: number
}

type StockStatus = 'noLimit' | 'critical' | 'warning' | 'excess' | 'ok' | 'low' | 'high'

interface ItemConfigModalProps {
    item: InventoryItem | null
    onClose: () => void
    onUpdateItem: (id: number, field: string, value: string | number) => void
    getStockStatus: (item: InventoryItem) => StockStatus
    getTotalQuantity: (item: InventoryItem) => number
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function ItemConfigModal({
    item,
    onClose,
    onUpdateItem,
    getStockStatus,
    getTotalQuantity
}: ItemConfigModalProps): React.ReactElement | null {
    const [localItem, setLocalItem] = React.useState<InventoryItem | null>(item)

    React.useEffect(() => {
        setLocalItem(item)
    }, [item])

    if (!item || !localItem) return null

    const handleChange = (field: keyof InventoryItem, value: string) => {
        const numValue = Number(value) || 0
        setLocalItem(prev => prev ? { ...prev, [field]: numValue } : null)
        onUpdateItem(item.id, field, value)
    }

    const status = getStockStatus(localItem)
    const total = getTotalQuantity(localItem)

    const getGradient = () => {
        if (status === 'low') return 'linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)'
        if (status === 'warning') return 'linear-gradient(135deg, #FF9F0A 0%, #FF6B00 100%)'
        if (status === 'high') return 'linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)'
        return 'linear-gradient(135deg, #34C759 0%, #30D158 100%)'
    }

    const getShadow = () => {
        if (status === 'low') return '0 8px 24px rgba(255,59,48,0.4)'
        if (status === 'warning') return '0 8px 24px rgba(255,159,10,0.4)'
        if (status === 'high') return '0 8px 24px rgba(88,86,214,0.4)'
        return '0 8px 24px rgba(52,199,89,0.4)'
    }

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto"
                style={{ paddingTop: '80px', paddingBottom: '40px' }}
            >
                <ModalScrollLock />
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xl"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="relative w-full max-w-[380px] rounded-[32px] overflow-hidden"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%)',
                        backdropFilter: 'blur(40px) saturate(180%)',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 12px 24px rgba(0,0,0,0.15)'
                    }}
                >
                    <div className="absolute inset-0 bg-[#1c1c1e]/98 dark:block hidden" />

                    {/* Header */}
                    <div className="relative z-10 flex items-center justify-between px-6 py-4 pt-8">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Configurar Limites</h3>
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-600"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 px-6 pb-6">
                        {/* Item Badge */}
                        <div className="text-center mb-6">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="inline-flex w-[72px] h-[72px] rounded-[22px] items-center justify-center text-3xl font-bold text-white mb-4"
                                style={{ background: getGradient(), boxShadow: getShadow() }}
                            >
                                {total}
                            </motion.div>
                            <h4 className="text-xl font-bold text-zinc-900 dark:text-white">{localItem.name}</h4>
                            <p className="text-sm text-zinc-400 mt-1">
                                Estoque atual: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{total} {localItem.unit}</span>
                            </p>
                        </div>

                        {/* Inputs */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {/* Critical */}
                            <div>
                                <label className="block text-[10px] font-bold text-red-400 uppercase tracking-[0.15em] mb-2 ml-1">Crítico</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-3 py-[14px] rounded-2xl text-zinc-900 dark:text-white text-center text-xl font-bold focus:outline-none"
                                    style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)' }}
                                    placeholder="0"
                                    value={localItem.criticalStock || ''}
                                    onChange={(e) => handleChange('criticalStock', e.target.value)}
                                />
                                <p className="text-[10px] text-red-500/80 text-center mt-1.5 font-semibold">{localItem.unit}</p>
                            </div>

                            {/* Min */}
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2 ml-1">Mínimo</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-[18px] rounded-2xl text-zinc-900 dark:text-white text-center text-2xl font-bold focus:outline-none"
                                    style={{ background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.2)' }}
                                    placeholder="0"
                                    value={localItem.minStock || ''}
                                    onChange={(e) => handleChange('minStock', e.target.value)}
                                />
                                <p className="text-[10px] text-amber-500/80 text-center mt-1.5 font-semibold">{localItem.unit}</p>
                            </div>

                            {/* Max */}
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2 ml-1">Máximo</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-[18px] rounded-2xl text-zinc-900 dark:text-white text-center text-2xl font-bold focus:outline-none"
                                    style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)' }}
                                    placeholder="0"
                                    value={localItem.maxStock || ''}
                                    onChange={(e) => handleChange('maxStock', e.target.value)}
                                />
                                <p className="text-[10px] text-blue-500/80 text-center mt-1.5 font-semibold">{localItem.unit}</p>
                            </div>
                        </div>

                        {/* Save Button */}
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 rounded-2xl text-[15px] font-bold uppercase tracking-wider text-white"
                            style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                        >
                            Salvar Limites
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

export default ItemConfigModal
