// ═══════════════════════════════════════════════════════════════════
// AI MODULE — History Table Component
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react'
import type { HistoryQuotation, QuotationItemData } from '../types'

interface HistoryTableProps {
    quotations: HistoryQuotation[]
    onOpenModal: (quotation: HistoryQuotation) => void
    onMarkReceived: (quotation: HistoryQuotation) => void
    onDelete: (quotation: HistoryQuotation) => void
}

export function HistoryTable({ quotations, onOpenModal, onMarkReceived, onDelete }: HistoryTableProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const formatItems = (items: QuotationItemData[]) => {
        const displayItems = items.slice(0, 2)
        const remaining = items.length - 2
        return {
            displayed: displayItems,
            remaining
        }
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <tbody>
                    {quotations.map((quotation) => {
                        const { displayed, remaining } = formatItems(quotation.items)

                        return (
                            <tr
                                key={quotation.id}
                                onClick={() => onOpenModal(quotation)}
                                className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                            >
                                {/* Checkbox */}
                                <td className="py-4 px-3 w-12">
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggleSelection(quotation.id)
                                        }}
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer
                                            ${selectedIds.has(quotation.id)
                                                ? 'border-emerald-500 bg-emerald-500'
                                                : 'border-zinc-600 hover:border-zinc-500'
                                            }`}
                                    >
                                        {selectedIds.has(quotation.id) && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </td>

                                {/* Avatar & Name */}
                                <td className="py-4 px-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200 font-bold text-sm shadow-sm">
                                            {quotation.supplierInitial}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{quotation.supplier}</p>
                                            <p className="text-xs text-zinc-400">{quotation.supplierEmail}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* Items */}
                                <td className="py-4 px-3">
                                    <div className="flex flex-col gap-0.5">
                                        {displayed.map((item, idx) => (
                                            <span key={idx} className="text-sm text-zinc-300">{item.name}</span>
                                        ))}
                                        {remaining > 0 && (
                                            <span className="text-xs text-zinc-500">+{remaining} mais</span>
                                        )}
                                    </div>
                                </td>

                                {/* Quantities */}
                                <td className="py-4 px-3">
                                    <div className="flex flex-col gap-0.5">
                                        {displayed.map((item, idx) => (
                                            <span key={idx} className="text-sm font-semibold text-emerald-400 tabular-nums">+{item.requested}kg</span>
                                        ))}
                                    </div>
                                </td>

                                {/* Date & Time */}
                                <td className="py-4 px-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-zinc-300">{quotation.timestamp}</span>
                                        <span className="text-xs text-zinc-500">{quotation.time}</span>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="py-4 px-3">
                                    <span className={`text-sm font-medium ${quotation.status === 'recebido'
                                        ? 'text-emerald-400'
                                        : 'text-amber-500'
                                        }`}>
                                        {quotation.status === 'recebido' ? 'Recebido' : 'Sem Resposta'}
                                    </span>
                                    <div className="text-xs text-zinc-500">—</div>
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-3">
                                    <div className="flex items-center gap-2">
                                        {quotation.status === 'recebido' ? (
                                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onMarkReceived(quotation)
                                                }}
                                                className="w-8 h-8 rounded-full border border-zinc-600 hover:border-zinc-400 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(quotation)
                                            }}
                                            className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {quotations.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Nenhum histórico disponível</p>
                </div>
            )}
        </div>
    )
}
