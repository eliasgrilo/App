import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatUtils'

/**
 * AutoQuoteDashboard - Dashboard for viewing auto-generated quotation requests
 * Displays quotations that were automatically created by the system
 */
export default function AutoQuoteDashboard({ quotes = [], onQuoteUpdate, suppliers = [] }) {
    const [expandedQuote, setExpandedQuote] = useState(null)

    // Status badge styling
    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            awaiting: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            quoted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            delivered: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
            cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }

        const labels = {
            pending: 'Pendente',
            sent: 'Enviado',
            awaiting: 'Aguardando',
            quoted: 'Cotado',
            confirmed: 'Confirmado',
            delivered: 'Entregue',
            cancelled: 'Cancelado'
        }

        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles[status] || styles.pending}`}>
                {labels[status] || status || 'Pendente'}
            </span>
        )
    }

    // Get supplier name by ID
    const getSupplierName = (supplierId) => {
        const supplier = suppliers.find(s => s.id === supplierId)
        return supplier?.name || supplierId || 'Fornecedor Desconhecido'
    }

    if (!quotes || quotes.length === 0) {
        return (
            <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                    <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.628.105a9.065 9.065 0 01-2.999.067l-1.2-.2a9 9 0 00-5.016.413l-.903.301m0 0a2.25 2.25 0 01-2.605-.683l-.39-.39a2.25 2.25 0 01-.492-2.447l.39-.78a9.065 9.065 0 011.973-2.635L5 14.5m7-11.396V.75" />
                    </svg>
                </div>
                <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">Nenhuma auto-cotação</p>
                <p className="text-[10px] text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">
                    Cotações automáticas aparecerão aqui
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Auto-Cotações</h3>
                        <p className="text-[10px] text-zinc-500">{quotes.length} cotação(ões) automática(s)</p>
                    </div>
                </div>
            </div>

            {/* Quotes List */}
            <AnimatePresence>
                {quotes.map((quote, index) => (
                    <motion.div
                        key={quote.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50 overflow-hidden"
                    >
                        {/* Quote Header - Clickable */}
                        <button
                            onClick={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {/* Supplier Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                    {(quote.supplierName || getSupplierName(quote.supplierId))?.charAt(0)?.toUpperCase() || '?'}
                                </div>

                                <div className="text-left">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        {quote.supplierName || getSupplierName(quote.supplierId)}
                                    </p>
                                    <p className="text-[10px] text-zinc-500">
                                        {quote.items?.length || 0} {quote.items?.length === 1 ? 'item' : 'itens'} •
                                        {quote.createdAt ? ` ${formatRelativeTime(quote.createdAt)}` : ' Recente'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {getStatusBadge(quote.status)}

                                {/* Expand Arrow */}
                                <svg
                                    className={`w-4 h-4 text-zinc-400 transition-transform ${expandedQuote === quote.id ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {/* Expanded Content */}
                        <AnimatePresence>
                            {expandedQuote === quote.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-t border-zinc-100 dark:border-zinc-700/50"
                                >
                                    <div className="p-4 space-y-4">
                                        {/* Items List */}
                                        {quote.items && quote.items.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Itens</p>
                                                <div className="space-y-2">
                                                    {quote.items.map((item, idx) => (
                                                        <div
                                                            key={item.id || idx}
                                                            className="flex items-center justify-between py-2 px-3 bg-zinc-50 dark:bg-zinc-700/30 rounded-lg"
                                                        >
                                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                                                {item.productName || item.name || 'Item'}
                                                            </span>
                                                            <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                                                {item.quantityToOrder || item.neededQuantity || 0} {item.unit || ''}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quote Details */}
                                        {quote.quotedTotal && (
                                            <div className="flex items-center justify-between py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                <span className="text-sm text-green-700 dark:text-green-400">Valor Total</span>
                                                <span className="text-sm font-bold text-green-700 dark:text-green-400">
                                                    {formatCurrency(quote.quotedTotal)}
                                                </span>
                                            </div>
                                        )}

                                        {quote.deliveryDate && (
                                            <div className="flex items-center justify-between py-2 px-3 bg-zinc-50 dark:bg-zinc-700/30 rounded-lg">
                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Previsão de Entrega</span>
                                                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                                    {formatDate(quote.deliveryDate)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Email Body Preview */}
                                        {quote.emailBody && (
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Mensagem</p>
                                                <div className="p-3 bg-zinc-50 dark:bg-zinc-700/30 rounded-lg">
                                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap line-clamp-4">
                                                        {quote.emailBody}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
