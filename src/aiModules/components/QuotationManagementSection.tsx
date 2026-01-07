// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Quotation Management Section Component
// ═══════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react'
import type { QuotationTabKey, Quotation, HistoryQuotation } from '../types'
import { createMockQuotations } from '../mockData'
import { QuotationCard } from './QuotationCard'
import { OrderConfirmationModal } from './OrderConfirmationModal'
import { ReceivedItemsModal } from './ReceivedItemsModal'
import { HistoryTable } from './HistoryTable'
import { HistoryDetailModal } from './HistoryDetailModal'

interface QuotationManagementSectionProps {
    quotationTab: QuotationTabKey
    setQuotationTab: (tab: QuotationTabKey) => void
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
    onRequestQuotation?: (quotation: Quotation) => void
}

export function QuotationManagementSection({ quotationTab, setQuotationTab, showToast, onRequestQuotation }: QuotationManagementSectionProps) {
    const mockQuotations = useMemo(() => createMockQuotations(), [])
    const [selectedOrder, setSelectedOrder] = useState<Quotation | null>(null)
    const [orderModalOpen, setOrderModalOpen] = useState(false)
    const [receivedModalOpen, setReceivedModalOpen] = useState(false)
    const [selectedReceivedOrder, setSelectedReceivedOrder] = useState<Quotation | null>(null)

    // History modal state
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryQuotation | null>(null)

    const handleOpenOrderModal = (order: Quotation) => {
        setSelectedOrder(order)
        setOrderModalOpen(true)
    }

    const handleOpenReceivedModal = (order: Quotation) => {
        setSelectedReceivedOrder(order)
        setReceivedModalOpen(true)
    }

    const handleConfirmReceipt = (order: Quotation) => {
        showToast(`Recebimento confirmado para ${order.supplier}!`, 'success')
        setOrderModalOpen(false)
        setSelectedOrder(null)
    }

    // History handlers
    const handleOpenHistoryModal = (quotation: HistoryQuotation) => {
        setSelectedHistoryItem(quotation)
        setHistoryModalOpen(true)
    }

    const handleMarkHistoryReceived = (quotation: HistoryQuotation) => {
        showToast(`${quotation.supplier} marcado como recebido!`, 'success')
    }

    const handleDeleteHistory = (quotation: HistoryQuotation) => {
        showToast(`Registro de ${quotation.supplier} removido!`, 'info')
    }

    const quotationTabs: { key: QuotationTabKey, label: string, count: number }[] = [
        { key: 'pendente', label: 'Pendente', count: mockQuotations.pendente?.length ?? 0 },
        { key: 'aguardando', label: 'Aguardando', count: mockQuotations.aguardando?.length ?? 0 },
        { key: 'ordens', label: 'Ordens', count: mockQuotations.ordens?.length ?? 0 },
        { key: 'recebido', label: 'Recebido', count: mockQuotations.recebido?.length ?? 0 },
        { key: 'historico', label: 'Histórico', count: mockQuotations.historico?.length ?? 0 }
    ]

    const currentQuotations = quotationTab !== 'historico' ? (mockQuotations[quotationTab] ?? []) : []
    const historyQuotations = mockQuotations.historico

    return (
        <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
            {/* Header Section */}
            <div className="mb-8">
                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]">
                    AUTOMATION PROTOCOL
                </span>
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-1">
                    Gestão de Cotações
                </h2>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-full mb-8">
                {quotationTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setQuotationTab(tab.key)}
                        className={`flex-1 py-3 rounded-full text-[11px] font-medium uppercase tracking-wide transition-all whitespace-nowrap flex items-center justify-center gap-2 ${quotationTab === tab.key
                            ? 'bg-zinc-600 dark:bg-zinc-600 text-white'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium flex items-center justify-center ${quotationTab === tab.key
                                ? 'bg-zinc-500 dark:bg-zinc-500 text-white'
                                : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {quotationTab === 'historico' ? (
                <HistoryTable
                    quotations={historyQuotations}
                    onOpenModal={handleOpenHistoryModal}
                    onMarkReceived={handleMarkHistoryReceived}
                    onDelete={handleDeleteHistory}
                />
            ) : (
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
                            <QuotationCard
                                key={quotation.id}
                                quotation={quotation}
                                isPendente={quotationTab === 'pendente'}
                                isOrdens={quotationTab === 'ordens'}
                                isRecebido={quotationTab === 'recebido'}
                                showToast={showToast}
                                onRequestQuotation={onRequestQuotation}
                                onOpenOrderModal={handleOpenOrderModal}
                                onOpenReceivedModal={handleOpenReceivedModal}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Order Confirmation Modal */}
            <OrderConfirmationModal
                open={orderModalOpen}
                order={selectedOrder}
                onClose={() => {
                    setOrderModalOpen(false)
                    setSelectedOrder(null)
                }}
                onConfirmReceipt={handleConfirmReceipt}
            />

            {/* Received Items Modal */}
            <ReceivedItemsModal
                open={receivedModalOpen}
                order={selectedReceivedOrder}
                onClose={() => {
                    setReceivedModalOpen(false)
                    setSelectedReceivedOrder(null)
                }}
            />

            {/* History Detail Modal */}
            <HistoryDetailModal
                open={historyModalOpen}
                quotation={selectedHistoryItem}
                onClose={() => {
                    setHistoryModalOpen(false)
                    setSelectedHistoryItem(null)
                }}
                onMarkReceived={handleMarkHistoryReceived}
            />
        </section>
    )
}

