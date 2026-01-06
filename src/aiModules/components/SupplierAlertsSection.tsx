// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Supplier Alerts Section Component
// ═══════════════════════════════════════════════════════════════════

import type { SupplierGroupWithSupplier, AlertItem } from '../types'
import type { Supplier } from '../../types'

interface SupplierAlertsSectionProps {
    alertsBySupplier: SupplierGroupWithSupplier[]
    openEmailComposer: (supplier: Supplier, items: AlertItem[]) => void
}

export function SupplierAlertsSection({ alertsBySupplier, openEmailComposer }: SupplierAlertsSectionProps) {
    return (
        <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[3rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
            <div className="p-6 md:p-10 pb-4 md:pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
                <div>
                    <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Automation Protocol</h2>
                    <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">Cotações Pendentes</h3>
                </div>
                {alertsBySupplier.length > 0 && (
                    <div className="px-4 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-full border border-rose-200 dark:border-rose-500/20">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                            {alertsBySupplier.length} fornecedor{alertsBySupplier.length > 1 ? 'es' : ''}
                        </span>
                    </div>
                )}
            </div>

            <div className="px-6 md:px-10 pb-6 md:pb-10">
                {alertsBySupplier.length === 0 ? (
                    <div className="py-32 text-center flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/5 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">Estoque OK — Nenhuma cotação pendente</p>
                    </div>
                ) : (
                    <div className="space-y-3 md:space-y-1">
                        {alertsBySupplier.map(({ supplier, items }) => (
                            <div key={supplier.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-8 py-5 md:items-center group hover:bg-zinc-50 dark:hover:bg-white/[0.02] px-4 rounded-2xl md:rounded-[1.5rem] transition-all cursor-pointer border border-zinc-100/80 dark:border-white/5 md:border-transparent"
                                onClick={() => openEmailComposer(supplier, items)}
                            >
                                <div className="md:col-span-5 flex items-start md:items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/25 shrink-0">
                                        {supplier.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="flex flex-col text-ellipsis overflow-hidden">
                                        <span className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight leading-tight mb-1 truncate">
                                            {supplier.name}
                                        </span>
                                        <div className="flex items-center gap-3 opacity-60">
                                            <span className="text-[9px] font-bold text-zinc-400 tabular-nums">{supplier.email || 'Sem email'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-4 flex flex-wrap gap-2">
                                    {items.slice(0, 3).map(item => (
                                        <span key={item.id} className={`inline-flex px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-tighter ${item.status === 'critical'
                                            ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                                            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                                            }`}>
                                            {item.name}
                                        </span>
                                    ))}
                                    {items.length > 3 && (
                                        <span className="inline-flex px-3 py-1 bg-zinc-50 dark:bg-white/5 rounded-full border border-zinc-100/80 dark:border-white/10 text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                            +{items.length - 3} mais
                                        </span>
                                    )}
                                </div>

                                <div className="md:col-span-3 flex justify-end">
                                    <button className="w-full md:w-auto px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Solicitar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
