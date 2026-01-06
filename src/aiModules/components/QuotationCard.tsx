// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Quotation Card Component
// ═══════════════════════════════════════════════════════════════════

import type { Quotation, QuotationItemData } from '../types'

interface QuotationCardProps {
    quotation: Quotation
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function QuotationCard({ quotation, showToast }: QuotationCardProps) {
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
