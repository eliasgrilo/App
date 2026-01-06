/**
 * ═══════════════════════════════════════════════════════════════════
 * SuppliersGrid — Grid view of suppliers
 * Extracted from Suppliers.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion } from 'framer-motion'
import type { LocalSupplier } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface SuppliersGridProps {
    suppliers: LocalSupplier[]
    onSupplierClick: (supplier: LocalSupplier) => void
    onEditClick: (supplier: LocalSupplier) => void
    onAddClick: () => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function SuppliersGrid({ suppliers, onSupplierClick, onEditClick, onAddClick }: SuppliersGridProps) {
    if (suppliers.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-12 border border-zinc-200/50 dark:border-white/10 text-center">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Nenhum fornecedor</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">Adicione seu primeiro fornecedor para começar</p>
                <button onClick={onAddClick} className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all">
                    Adicionar Fornecedor
                </button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {suppliers.map((supplier) => (
                <motion.div
                    key={supplier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    onClick={() => onSupplierClick(supplier)}
                    className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
                >
                    {/* Avatar + Name + Quick Edit */}
                    <div className="flex items-start gap-4 mb-4 relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEditClick(supplier) }}
                            className="absolute top-0 right-0 w-10 h-10 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-indigo-500 transition-all shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 touch-manipulation z-10"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-violet-500/25">
                            {supplier.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0 pr-12">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{supplier.name}</h3>
                            {supplier.company && <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{supplier.company}</p>}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                        {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="truncate">{supplier.phone}</span>
                            </div>
                        )}
                        {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="truncate">{supplier.email}</span>
                            </div>
                        )}
                    </div>

                    {/* Linked Items Badge */}
                    {(supplier.linkedItems?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-100 dark:border-violet-500/20">
                            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                {supplier.linkedItems?.length ?? 0} {(supplier.linkedItems?.length ?? 0) === 1 ? 'item' : 'itens'}
                            </span>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    )
}

export default SuppliersGrid
