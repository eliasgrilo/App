/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY HEADER — Premium Page Header with Actions
 * Apple-style title with scan and add buttons
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { useStockAlerts } from '../../hooks/useStockAlerts'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface InventoryHeaderProps {
    onScanInvoice: () => void
    onAddItem: () => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function InventoryHeader({
    onScanInvoice,
    onAddItem
}: InventoryHeaderProps): React.ReactElement {
    const { totalAlertCount } = useStockAlerts()

    return (
        <div className="relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Estoque</h1>

                    {/* Cloud Active Badge */}
                    <div className="mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Cloud Active</span>
                    </div>

                    {/* Alerts Badge */}
                    {totalAlertCount > 0 && (
                        <div className="mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 bg-amber-500/5 border-amber-500/10 text-amber-500 animate-pulse">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{totalAlertCount} Alertas</span>
                        </div>
                    )}
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Gestão inteligente de insumos e provisões</p>
            </div>

            <div className="flex items-center gap-3">
                {/* Invoice Scanner Button */}
                <button
                    onClick={onScanInvoice}
                    className="flex w-auto px-4 md:px-6 py-3 md:py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all items-center justify-center gap-2 group"
                >
                    <svg className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden md:inline">Scan Nota</span>
                    <span className="md:hidden">Scan</span>
                </button>

                {/* Add Item Button */}
                <button
                    onClick={onAddItem}
                    className="w-full md:w-auto px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group touch-manipulation relative z-30"
                    style={{ minHeight: '44px' }}
                >
                    <svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Insumo
                </button>
            </div>
        </div>
    )
}

export default InventoryHeader
