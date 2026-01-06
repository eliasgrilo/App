// ═══════════════════════════════════════════════════════════════════
// STOCK ALERT BADGE — Visual indicator for low/critical stock
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStockAlertBadge } from '../../hooks/useStockAlerts'

interface StockAlertBadgeProps {
    className?: string
}

export function StockAlertBadge({ className = '' }: StockAlertBadgeProps) {
    const badge = useStockAlertBadge()

    if (!badge) return null

    return (
        <AnimatePresence>
            <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold ${badge.color === 'red'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                        : 'bg-amber-500 text-white shadow-lg shadow-amber-500/40'
                    } ${className}`}
            >
                {badge.count > 9 ? '9+' : badge.count}
            </motion.span>
        </AnimatePresence>
    )
}

export default StockAlertBadge
