// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Quotation Card Component
// ═══════════════════════════════════════════════════════════════════

import type { Quotation, QuotationItemData } from '../types'

interface QuotationCardProps {
    quotation: Quotation
    isPendente?: boolean
    isOrdens?: boolean
    isRecebido?: boolean
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
    onRequestQuotation?: (quotation: Quotation) => void
    onOpenOrderModal?: (quotation: Quotation) => void
    onOpenReceivedModal?: (quotation: Quotation) => void
}

export function QuotationCard({ quotation, isPendente, isOrdens, isRecebido, showToast, onRequestQuotation, onOpenOrderModal, onOpenReceivedModal }: QuotationCardProps) {
    // ─── Pendente Card (matches screenshot design) ───────────────────
    if (isPendente) {
        return (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100/80 dark:border-zinc-800 overflow-hidden">
                {/* Header with Avatar, Name, and Button */}
                <div className="flex items-center justify-between p-5 border-b border-zinc-100/80 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200 font-bold text-lg shadow-sm">
                            {quotation.supplierInitial}
                        </div>
                        <div>
                            <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100">{quotation.supplier}</p>
                            <p className="text-xs text-zinc-400">{quotation.itemCount} itens abaixo do mínimo</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (onRequestQuotation) {
                                onRequestQuotation(quotation)
                            }
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                        Solicitar Cotação
                    </button>
                </div>

                {/* Items Table */}
                {quotation.items.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900">
                        {/* Table Header */}
                        <div className="grid grid-cols-3 gap-4 px-5 py-3 border-b border-zinc-100/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Item</span>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-center">Estoque Atual</span>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-right">Quantidade a Pedir</span>
                        </div>

                        {/* Table Rows */}
                        {quotation.items.map((item: QuotationItemData, idx: number) => (
                            <div
                                key={idx}
                                className={`grid grid-cols-3 gap-4 px-5 py-4 ${idx !== quotation.items.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800/50' : ''}`}
                            >
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.name}</span>
                                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 text-center tabular-nums">{item.current}kg</span>
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">+{item.requested}kg</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // ─── Ordens Card (for ordens tab - clickable to open modal) ──────
    if (isOrdens) {
        return (
            <div
                onClick={() => onOpenOrderModal?.(quotation)}
                className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100/80 dark:border-zinc-800 overflow-hidden cursor-pointer hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all group"
            >
                {/* Header with Icon, Name, Status and Button */}
                <div className="flex items-center justify-between p-5 border-b border-zinc-100/80 dark:border-zinc-800">
                    <div className="flex items-center gap-4">
                        {/* Document Icon */}
                        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center group-hover:bg-indigo-600/30 transition-colors">
                            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>

                        <div>
                            <div className="flex items-center gap-3">
                                <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100">{quotation.supplier}</p>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Confirmada
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">Ordem criada em {quotation.timestamp}</p>
                        </div>
                    </div>

                    {/* Confirm Receipt Button */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onOpenOrderModal?.(quotation)
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Confirmar Recebimento
                    </button>
                </div>

                {/* Items Preview (first 3 items) */}
                {quotation.items.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900">
                        {/* Table Header */}
                        <div className="grid grid-cols-3 gap-4 px-5 py-3 border-b border-zinc-100/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Item</span>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-center">Quantidade Solicitada</span>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-right">Unidade</span>
                        </div>

                        {/* Table Rows - show first 3 items */}
                        {quotation.items.slice(0, 3).map((item: QuotationItemData, idx: number) => (
                            <div
                                key={idx}
                                className={`grid grid-cols-3 gap-4 px-5 py-4 ${idx !== Math.min(quotation.items.length, 3) - 1 ? 'border-b border-zinc-50 dark:border-zinc-800/50' : ''}`}
                            >
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.name}</span>
                                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 text-center tabular-nums">{item.requested}kg</span>
                                <span className="text-sm text-zinc-400 text-right">kg</span>
                            </div>
                        ))}

                        {/* Show more indicator if there are more items */}
                        {quotation.items.length > 3 && (
                            <div className="px-5 py-3 text-center border-t border-zinc-100/80 dark:border-zinc-800">
                                <span className="text-xs text-indigo-500 font-medium">+ {quotation.items.length - 3} mais itens • Clique para ver todos</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // ─── Recebido Card (for recebido tab - clickable to open modal) ──
    if (isRecebido) {
        // Format the received date
        const formatReceivedDate = () => {
            const now = new Date()
            return `Recebido em ${now.toLocaleDateString('pt-BR', { month: 'short', day: '2-digit', year: 'numeric' }).replace('.', '')}`
        }

        return (
            <div
                onClick={() => onOpenReceivedModal?.(quotation)}
                className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100/80 dark:border-zinc-800 overflow-hidden cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all group"
            >
                {/* Header with Checkmark Icon, Name, Status */}
                <div className="flex items-center justify-between p-5 border-b border-zinc-100/80 dark:border-zinc-800">
                    <div className="flex items-center gap-4">
                        {/* Checkmark Icon */}
                        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center group-hover:bg-emerald-400 transition-colors">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>

                        <div>
                            <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100">{quotation.supplier}</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{formatReceivedDate()}</p>
                        </div>
                    </div>

                    {/* Received Status Badge */}
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Recebido
                    </span>
                </div>

                {/* Items Preview (first 3 items) */}
                {quotation.items.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900">
                        {/* Table Header */}
                        <div className="grid grid-cols-2 gap-4 px-5 py-3 border-b border-zinc-100/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Item Recebido</span>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-right">Quantidade</span>
                        </div>

                        {/* Table Rows - show first 3 items */}
                        {quotation.items.slice(0, 3).map((item: QuotationItemData, idx: number) => (
                            <div
                                key={idx}
                                className={`grid grid-cols-2 gap-4 px-5 py-4 ${idx !== Math.min(quotation.items.length, 3) - 1 ? 'border-b border-zinc-50 dark:border-zinc-800/50' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Checkmark for each item */}
                                    <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">{item.requested}kg</span>
                            </div>
                        ))}

                        {/* Show more indicator if there are more items */}
                        {quotation.items.length > 3 && (
                            <div className="px-5 py-3 text-center border-t border-zinc-100/80 dark:border-zinc-800">
                                <span className="text-xs text-emerald-500 font-medium">+ {quotation.items.length - 3} mais itens • Clique para ver todos</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // ─── Default Card (for other tabs) ───────────────────────────────
    return (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-zinc-100/80 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {quotation.supplierInitial}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{quotation.supplier}</p>
                        <p className="text-[10px] text-zinc-400">{quotation.itemCount} itens • {quotation.timestamp}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => showToast('Cotação registrada!', 'success')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors">
                        Registrar Cotação
                    </button>
                    <button onClick={() => showToast('Email reenviado!', 'success')}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors">
                        Reenviar
                    </button>
                </div>
            </div>

            {quotation.items.length > 0 && (
                <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100/80 dark:border-zinc-700/50 overflow-hidden">
                    <div className="grid grid-cols-4 gap-4 px-4 py-2 border-b border-zinc-100/80 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Item</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-center">Estoque Atual</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-center">Máximo</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-right">Qtd. Solicitada</span>
                    </div>
                    {quotation.items.map((item: QuotationItemData, idx: number) => (
                        <div key={idx} className={`grid grid-cols-4 gap-4 px-4 py-3 ${idx !== quotation.items.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-700/30' : ''}`}>
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{item.name}</span>
                            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center tabular-nums">{item.current}</span>
                            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center tabular-nums">{item.max}</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">+{item.requested}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
