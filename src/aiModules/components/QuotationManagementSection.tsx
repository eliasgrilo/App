// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Quotation Management Section Component
// ═══════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import type { QuotationTabKey } from '../types'
import { createMockQuotations } from '../mockData'
import { QuotationCard } from './QuotationCard'

interface QuotationManagementSectionProps {
    quotationTab: QuotationTabKey
    setQuotationTab: (tab: QuotationTabKey) => void
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function QuotationManagementSection({ quotationTab, setQuotationTab, showToast }: QuotationManagementSectionProps) {
    const mockQuotations = useMemo(() => createMockQuotations(), [])

    const quotationTabs: { key: QuotationTabKey, label: string, count: number }[] = [
        { key: 'pendente', label: 'Pendente', count: mockQuotations.pendente?.length ?? 0 },
        { key: 'aguardando', label: 'Aguardando', count: mockQuotations.aguardando?.length ?? 0 },
        { key: 'ordens', label: 'Ordens', count: mockQuotations.ordens?.length ?? 0 },
        { key: 'recebido', label: 'Recebido', count: mockQuotations.recebido?.length ?? 0 },
        { key: 'historico', label: 'Histórico', count: mockQuotations.historico?.length ?? 0 }
    ]

    const currentQuotations = mockQuotations[quotationTab] ?? []

    return (
        <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gestão de Cotações</h2>
            </div>

            <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl mb-6 overflow-x-auto">
                {quotationTabs.map((tab) => (
                    <button key={tab.key} onClick={() => setQuotationTab(tab.key)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${quotationTab === tab.key
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${quotationTab === tab.key
                                ? 'bg-zinc-100 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-200'
                                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {currentQuotations.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Nenhuma cotação nesta categoria</p>
                    </div>
                ) : (
                    currentQuotations.map((quotation) => (
                        <QuotationCard key={quotation.id} quotation={quotation} showToast={showToast} />
                    ))
                )}
            </div>
        </section>
    )
}
