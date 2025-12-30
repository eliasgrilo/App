/**
 * SmartSourcingWorkflow Component - Complete AI-Powered Quotation Management
 * Workflow: Draft → Pending → Quoted → Ordered → Received
 * Apple 2025 Liquid Glass Design with Full Haptic Feedback
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { HapticService } from '../services/hapticService'
import {
    SmartSourcingService,
    QUOTATION_STATUS,
    STATUS_COLORS,
    STATUS_LABELS
} from '../services/smartSourcingService'
import { GeminiService } from '../services/geminiService'
import { gmailService } from '../services/gmailService'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'

// ===================================================================
// STATUS NORMALIZATION (handle legacy/Portuguese status values)
// ===================================================================

const STATUS_NORMALIZATION_MAP = {
    // Portuguese to English mapping
    'ABERTO': QUOTATION_STATUS.PENDING,
    'aberto': QUOTATION_STATUS.PENDING,
    'PENDENTE': QUOTATION_STATUS.PENDING,
    'pendente': QUOTATION_STATUS.PENDING,
    'AGUARDANDO': QUOTATION_STATUS.AWAITING,
    'aguardando': QUOTATION_STATUS.AWAITING,
    'COTADO': QUOTATION_STATUS.QUOTED,
    'cotado': QUOTATION_STATUS.QUOTED,
    'PEDIDO': QUOTATION_STATUS.ORDERED,
    'pedido': QUOTATION_STATUS.ORDERED,
    'ENVIADO': QUOTATION_STATUS.SHIPPED,
    'enviado': QUOTATION_STATUS.SHIPPED,
    'RECEBIDO': QUOTATION_STATUS.RECEIVED,
    'recebido': QUOTATION_STATUS.RECEIVED,
    'CANCELADO': QUOTATION_STATUS.CANCELLED,
    'cancelado': QUOTATION_STATUS.CANCELLED,
    'EXPIRADO': QUOTATION_STATUS.EXPIRED,
    'expirado': QUOTATION_STATUS.EXPIRED,
    // Cloud Function status values (BUG FIX: reply_received was not mapped)
    'reply_received': QUOTATION_STATUS.QUOTED,
    'REPLY_RECEIVED': QUOTATION_STATUS.QUOTED,
    'sent': QUOTATION_STATUS.PENDING,
    'SENT': QUOTATION_STATUS.PENDING,
    // English values pass through
    'draft': QUOTATION_STATUS.DRAFT,
    'pending': QUOTATION_STATUS.PENDING,
    'awaiting': QUOTATION_STATUS.AWAITING,
    'quoted': QUOTATION_STATUS.QUOTED,
    'ordered': QUOTATION_STATUS.ORDERED,
    'shipped': QUOTATION_STATUS.SHIPPED,
    'received': QUOTATION_STATUS.RECEIVED,
    'cancelled': QUOTATION_STATUS.CANCELLED,
    'expired': QUOTATION_STATUS.EXPIRED
}

/**
 * Normalize status from Firestore to expected enum values
 */
const normalizeStatus = (status) => {
    if (!status) return QUOTATION_STATUS.PENDING
    return STATUS_NORMALIZATION_MAP[status] || status
}

// ===================================================================
// FORMAT HELPERS
// ===================================================================

const formatCurrency = (val) => {
    const n = Number(val) || 0
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    return `${diffDays}d atrás`
}

// ===================================================================
// QUOTATION CARD COMPONENT
// ===================================================================

function QuotationCard({ quotation, onAction, isExpanded, onToggle }) {
    const statusColors = STATUS_COLORS[quotation.status] || STATUS_COLORS.draft
    const statusLabel = STATUS_LABELS[quotation.status] || quotation.status

    const isPending = [QUOTATION_STATUS.PENDING, QUOTATION_STATUS.AWAITING].includes(quotation.status)
    const isQuoted = quotation.status === QUOTATION_STATUS.QUOTED
    const isOrdered = quotation.status === QUOTATION_STATUS.ORDERED
    const isReceived = quotation.status === QUOTATION_STATUS.RECEIVED
    const isOptimisticPending = quotation._pending // From optimistic updates

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isOptimisticPending ? 0.6 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[1.5rem] border transition-all overflow-hidden ${statusColors.border} ${isQuoted ? 'ring-2 ring-violet-500/30 shadow-lg shadow-violet-500/10' : ''} ${isOptimisticPending ? 'pointer-events-none' : ''
                }`}
        >
            {/* Optimistic Loading Overlay */}
            {isOptimisticPending && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 z-10 flex items-center justify-center backdrop-blur-sm"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent"
                    />
                </motion.div>
            )}

            {/* Card Header */}
            <div
                className="p-5 cursor-pointer"
                onClick={() => {
                    HapticService.trigger('selection')
                    onToggle?.()
                }}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {/* Status Indicator - Enhanced Liquid Glass */}
                        {isPending && (
                            <motion.div
                                className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/30 to-orange-500/20 flex items-center justify-center overflow-hidden"
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {/* Shimmer effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                />
                                <span className="text-lg relative z-10">⏳</span>
                            </motion.div>
                        )}
                        {isQuoted && (
                            <motion.div
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <span className="text-lg">📋</span>
                            </motion.div>
                        )}
                        {isOrdered && (
                            <motion.div
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-blue-500/20 flex items-center justify-center"
                                animate={{ x: [0, 2, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <span className="text-lg">🚚</span>
                            </motion.div>
                        )}
                        {isReceived && (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/20 flex items-center justify-center">
                                <span className="text-lg">✓</span>
                            </div>
                        )}

                        <div>
                            <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                                {quotation.supplierName}
                            </h4>
                            <p className="text-xs text-zinc-500">
                                {quotation.items?.length || 0} itens · {timeAgo(quotation.updatedAt)}
                            </p>
                        </div>
                    </div>

                    {/* Status Badge + Problem Indicators */}
                    <div className="flex flex-col items-end gap-1.5">
                        {/* Main Status Badge - Liquid Glass */}
                        <div className={`px-3 py-1.5 rounded-full backdrop-blur-xl shadow-sm ${statusColors.bg} ${statusColors.border} border`}>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${statusColors.text}`}>
                                {statusLabel}
                            </span>
                        </div>

                        {/* Problem Indicators */}
                        {quotation.hasDelay && (
                            <motion.div
                                className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30"
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <span className="text-[8px] font-bold text-orange-600 dark:text-orange-400 uppercase">
                                    ⚠️ Atraso
                                </span>
                            </motion.div>
                        )}
                        {quotation.hasProblems && !quotation.hasDelay && (
                            <motion.div
                                className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <span className="text-[8px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                                    ⚠️ Não Tem
                                </span>
                            </motion.div>
                        )}
                        {quotation.aiProcessed && (
                            <div className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                                <span className="text-[7px] font-bold text-violet-500 uppercase">
                                    🤖 AI
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Values Row */}
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                            {isQuoted || isOrdered || isReceived ? 'Valor Cotado' : 'Estimado'}
                        </span>
                        <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
                            {formatCurrency(quotation.quotedTotal || quotation.estimatedTotal)}
                        </p>
                    </div>

                    {quotation.deliveryDate && (
                        <div className="text-right">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Entrega</span>
                            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                {formatDate(quotation.deliveryDate)}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="overflow-hidden"
                    >
                        {/* Items List */}
                        <div className="px-5 pb-3">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                Itens
                            </p>
                            <div className="space-y-2">
                                {quotation.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-800 dark:text-white truncate">
                                                {item.productName}
                                            </p>
                                            <p className="text-[10px] text-zinc-400">
                                                {item.quantityToOrder} {item.unit}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {item.quotedUnitPrice ? (
                                                <>
                                                    <p className="text-sm font-bold text-violet-600 tabular-nums">
                                                        {formatCurrency(item.quotedUnitPrice)}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400">
                                                        {formatCurrency(item.quotedUnitPrice * item.quantityToOrder)}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-sm text-zinc-400 tabular-nums">
                                                    ~{formatCurrency(item.estimatedUnitPrice)}
                                                </p>
                                            )}
                                        </div>
                                        {/* Availability indicator */}
                                        {item.quotedAvailability !== null && item.quotedAvailability !== undefined && (
                                            <div className={`ml-2 px-2 py-1 rounded-lg text-[9px] font-bold uppercase ${item.quotedAvailability >= item.quantityToOrder
                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                : 'bg-amber-500/10 text-amber-600'
                                                }`}>
                                                {item.quotedAvailability >= item.quantityToOrder ? '✓' : `${item.quotedAvailability} disp.`}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Analysis Summary - Payment Terms & Delivery */}
                        {(quotation.paymentTerms || quotation.deliveryDays) && (
                            <div className="px-5 pb-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {quotation.paymentTerms && (
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-200/50 dark:border-indigo-500/20">
                                            <p className="text-[9px] font-bold text-indigo-600 uppercase mb-1">
                                                💳 Pagamento
                                            </p>
                                            <p className="text-xs font-medium text-indigo-900 dark:text-indigo-200">
                                                {quotation.paymentTerms}
                                            </p>
                                        </div>
                                    )}
                                    {quotation.deliveryDays && (
                                        <div className="p-3 bg-sky-50 dark:bg-sky-500/10 rounded-xl border border-sky-200/50 dark:border-sky-500/20">
                                            <p className="text-[9px] font-bold text-sky-600 uppercase mb-1">
                                                📦 Prazo
                                            </p>
                                            <p className="text-xs font-medium text-sky-900 dark:text-sky-200">
                                                {quotation.deliveryDays} dias úteis
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Problems Alert - If AI detected issues */}
                        {quotation.aiAnalysis?.hasProblems && (
                            <div className="px-5 pb-3">
                                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200/50 dark:border-amber-500/20">
                                    <p className="text-[9px] font-bold text-amber-600 uppercase mb-1">
                                        ⚠️ Atenção
                                    </p>
                                    <p className="text-xs text-amber-900 dark:text-amber-200">
                                        {quotation.aiAnalysis.problemSummary || 'Problemas identificados na resposta'}
                                    </p>
                                    {quotation.aiAnalysis.delayReason && (
                                        <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                                            Motivo: {quotation.aiAnalysis.delayReason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* AI Notes */}
                        {quotation.supplierNotes && (
                            <div className="px-5 pb-3">
                                <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-200/50 dark:border-violet-500/20">
                                    <p className="text-[9px] font-bold text-violet-600 uppercase mb-1">
                                        🤖 Notas da IA
                                    </p>
                                    <p className="text-xs text-violet-900 dark:text-violet-200">
                                        {quotation.supplierNotes}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Order Summary - Ready For Confirmation */}
                        {isQuoted && (
                            <div className="px-5 pb-3">
                                <div className="p-4 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/10 rounded-2xl border border-violet-200/50 dark:border-violet-500/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">
                                            📋 Resumo do Pedido
                                        </p>
                                        {quotation.aiAnalysis?.suggestedAction && (
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase ${quotation.aiAnalysis.suggestedAction === 'confirm'
                                                ? 'bg-emerald-500/20 text-emerald-600'
                                                : quotation.aiAnalysis.suggestedAction === 'negotiate'
                                                    ? 'bg-amber-500/20 text-amber-600'
                                                    : 'bg-zinc-500/20 text-zinc-600'
                                                }`}>
                                                {quotation.aiAnalysis.suggestedAction === 'confirm' ? '✓ Recomendado' :
                                                    quotation.aiAnalysis.suggestedAction === 'negotiate' ? '💬 Negociar' :
                                                        quotation.aiAnalysis.suggestedAction}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <p className="text-[10px] text-zinc-400 uppercase">Itens</p>
                                            <p className="text-lg font-bold text-zinc-900 dark:text-white">{quotation.items.length}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-400 uppercase">Total</p>
                                            <p className="text-lg font-bold text-violet-600">{formatCurrency(quotation.quotedTotal || quotation.estimatedTotal)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-400 uppercase">Entrega</p>
                                            <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                                {quotation.deliveryDays ? `${quotation.deliveryDays}d` : formatDate(quotation.deliveryDate) || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="p-5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex gap-2">
                                {/* Confirm Order - One Touch */}
                                {isQuoted && (
                                    <>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => onAction?.('confirm', quotation)}
                                            className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg"
                                        >
                                            ✓ Confirmar Pedido
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => onAction?.('negotiate', quotation)}
                                            className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-[11px] font-bold uppercase tracking-widest"
                                        >
                                            💬
                                        </motion.button>
                                    </>
                                )}

                                {/* Confirm Receipt */}
                                {isOrdered && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onAction?.('receive', quotation)}
                                        className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest"
                                    >
                                        📦 Confirmar Recebimento
                                    </motion.button>
                                )}

                                {/* Follow Up */}
                                {isPending && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onAction?.('followup', quotation)}
                                        className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest"
                                    >
                                        📨 Enviar Lembrete
                                    </motion.button>
                                )}

                                {/* Simulate Response (Demo) */}
                                {isPending && (
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onAction?.('simulate', quotation)}
                                        className="px-4 py-3 bg-violet-100 dark:bg-violet-500/20 text-violet-600 rounded-xl text-[11px] font-bold uppercase tracking-widest"
                                        title="Demo: Simular resposta do fornecedor"
                                    >
                                        🤖
                                    </motion.button>
                                )}

                                {/* Delete Button - Available on all cards */}
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (window.confirm(`Excluir cotação de ${quotation.supplierName}?`)) {
                                            onAction?.('delete', quotation)
                                        }
                                    }}
                                    className="px-4 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-rose-200/50 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                                    title="Excluir cotação"
                                >
                                    🗑️
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ===================================================================
// WORKFLOW TABS
// ===================================================================

const WORKFLOW_TABS = [
    { id: 'pending', label: 'Aguardando', statuses: [QUOTATION_STATUS.PENDING, QUOTATION_STATUS.AWAITING], icon: '⏳' },
    { id: 'orders', label: 'Ordens', statuses: [QUOTATION_STATUS.QUOTED, QUOTATION_STATUS.ORDERED], icon: '📋' },
    { id: 'received', label: 'Recebidos', statuses: [QUOTATION_STATUS.RECEIVED], icon: '✓' },
    { id: 'history', label: 'Histórico', statuses: 'all', icon: '📚' }
]

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export default function SmartSourcingWorkflow({
    products = [],
    movements = [],
    onCreateQuotation,
    userId = 'user_1',
    userName = 'Operador'
}) {
    const [activeTab, setActiveTab] = useState('pending')
    const [quotations, setQuotations] = useState([])
    const [expandedId, setExpandedId] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    // Gmail and manual response states
    const [gmailConnected, setGmailConnected] = useState(false)
    const [responseModalQuotation, setResponseModalQuotation] = useState(null)
    const [manualEmailText, setManualEmailText] = useState('')
    const [isCheckingEmails, setIsCheckingEmails] = useState(false)

    // Check Gmail connection on mount
    useEffect(() => {
        const checkGmail = async () => {
            await gmailService.ensureInitialized()
            setGmailConnected(gmailService.isConnected())
        }
        checkGmail()
    }, [])

    // Load quotations: Real-time Firestore subscription with local fallback
    useEffect(() => {
        // First, load from local storage for immediate display
        const localQuotations = SmartSourcingService.getAll()
        setQuotations(localQuotations)

        // Then subscribe to Firestore for real-time updates
        let unsubscribe = null

        try {
            const quotationsRef = collection(db, 'quotations')
            const q = query(quotationsRef, orderBy('createdAt', 'desc'))

            unsubscribe = onSnapshot(q, (snapshot) => {
                if (snapshot.empty) {
                    console.log('📭 No quotations in Firestore, using local storage')
                    return
                }

                const firestoreQuotations = snapshot.docs.map(doc => {
                    const data = doc.data()

                    // BUG FIX: Map quotedItems from Cloud Function to frontend format
                    const mappedItems = (data.items || []).map((item, index) => {
                        // Try to find matching quoted item by name or index
                        const quotedItem = data.quotedItems?.find(qi =>
                            qi.name?.toLowerCase().includes(item.productName?.toLowerCase()) ||
                            item.productName?.toLowerCase().includes(qi.name?.toLowerCase())
                        ) || data.quotedItems?.[index] || {}

                        return {
                            ...item,
                            quotedUnitPrice: item.quotedUnitPrice || quotedItem.unitPrice || null,
                            quotedAvailability: item.quotedAvailability || quotedItem.availableQuantity || null
                        }
                    })

                    return {
                        id: doc.id,
                        ...data,
                        // BUG FIX: Map items with quoted prices
                        items: mappedItems,
                        // Normalize status from legacy/Portuguese values
                        status: normalizeStatus(data.status),
                        // BUG FIX: Map responseReceivedAt from Cloud Function's replyReceivedAt
                        responseReceivedAt: data.replyReceivedAt?.toDate?.()?.toISOString() || data.responseReceivedAt || null,
                        // Convert Firestore timestamps
                        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
                        emailSentAt: data.emailSentAt?.toDate?.()?.toISOString() || data.emailSentAt,
                        replyReceivedAt: data.replyReceivedAt?.toDate?.()?.toISOString() || data.replyReceivedAt
                    }
                })

                // Check for status changes and trigger haptic feedback
                const previousIds = new Map(quotations.map(q => [q.id, q.status]))
                for (const q of firestoreQuotations) {
                    const prevStatus = previousIds.get(q.id)
                    if (prevStatus && prevStatus !== q.status) {
                        console.log(`🔔 Quotation ${q.id} changed: ${prevStatus} → ${q.status}`)
                        HapticService.trigger('notification')
                    }
                }

                setQuotations(firestoreQuotations)

                // BUG FIX: Keep localStorage in sync with Firestore
                // This ensures that when Cloud Functions update Firestore, localStorage stays current
                SmartSourcingService.syncFromFirestore(firestoreQuotations)

                console.log(`📊 Real-time update: ${firestoreQuotations.length} quotations`)
            }, (error) => {
                console.error('❌ Firestore subscription error:', error)
                // Keep using local data on error
            })
        } catch (error) {
            console.warn('⚠️ Firestore not available, using local storage only')
        }

        return () => {
            if (unsubscribe) unsubscribe()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // =========================================================
    // AUTOMATIC EMAIL POLLING - Checks for replies every 30s
    // =========================================================
    useEffect(() => {
        if (!gmailConnected) {
            console.log('📧 Gmail não conectado - polling desativado')
            return
        }

        let isMounted = true

        const checkForSupplierReplies = async () => {
            if (!isMounted) return

            // BUG #5 FIX: Validate Gmail token before polling
            const tokenValid = await gmailService.validateToken()
            if (!tokenValid) {
                console.warn('⚠️ Gmail token inválido ou expirado - polling pausado')
                setGmailConnected(false)
                return
            }

            // Get pending quotations
            const currentQuotations = SmartSourcingService.getAll()
            const pendingQuotations = currentQuotations.filter(q =>
                [QUOTATION_STATUS.PENDING, QUOTATION_STATUS.AWAITING].includes(q.status)
            )

            if (pendingQuotations.length === 0) {
                console.log('📧 Nenhuma cotação pendente para verificar')
                return
            }

            console.log(`🔍 Verificando respostas para ${pendingQuotations.length} cotações...`)
            setIsCheckingEmails(true)

            try {
                // Get unique supplier emails
                const supplierEmails = [...new Set(
                    pendingQuotations.map(q => q.supplierEmail).filter(Boolean)
                )]

                if (supplierEmails.length === 0) {
                    console.log('📧 Nenhum email de fornecedor para verificar')
                    return
                }

                // Find oldest pending quotation for date filter
                const oldestQuotation = pendingQuotations.reduce((oldest, q) =>
                    new Date(q.emailSentAt || q.createdAt) < new Date(oldest.emailSentAt || oldest.createdAt) ? q : oldest
                )
                const afterDate = new Date(oldestQuotation.emailSentAt || oldestQuotation.createdAt)

                // Check for replies via Gmail API
                const replies = await gmailService.checkReplies(supplierEmails, afterDate)

                if (!isMounted) return

                if (replies.length > 0) {
                    console.log(`📬 ${replies.length} respostas encontradas!`, replies)
                    HapticService.trigger('notification')

                    // Process each reply
                    for (const reply of replies) {
                        console.log(`🔍 Trying to match reply from: ${reply.supplierEmail}`)

                        // Find matching quotation - EXACT email matching with improved logging
                        const matchingQuotation = pendingQuotations.find(q => {
                            const quotEmail = q.supplierEmail?.toLowerCase().trim() || ''
                            const replyEmail = reply.supplierEmail?.toLowerCase().trim() || ''

                            // Exact match (preferred)
                            if (quotEmail === replyEmail) {
                                console.log(`   ✅ Exact match found: ${quotEmail}`)
                                return true
                            }

                            // Domain-level fallback
                            const quotDomain = quotEmail.split('@')[1]
                            const replyDomain = replyEmail.split('@')[1]
                            if (quotDomain && replyDomain && quotDomain === replyDomain) {
                                console.log(`   ✅ Domain match found: ${quotDomain}`)
                                return true
                            }

                            return false
                        })

                        if (matchingQuotation) {
                            console.log(`🤖 Processando resposta para: ${matchingQuotation.supplierName} (ID: ${matchingQuotation.id})`)

                            // Use the full body if available, otherwise snippet
                            // BUG #3 FIX: Send ONLY the email body to AI, not headers
                            const emailBody = reply.body || reply.snippet || reply.subject || ''
                            console.log(`   📧 Email body length: ${emailBody.length} chars`)
                            console.log(`   📧 From: ${reply.from}, Subject: ${reply.subject}`)

                            // Auto-process with AI - send clean body only
                            const result = await SmartSourcingService.processResponse(
                                matchingQuotation.id,
                                emailBody,  // BUG #3 FIX: Clean body only, no headers
                                userId,
                                userName
                            )

                            if (result.success) {
                                console.log(`✅ Cotação ${matchingQuotation.id} processada automaticamente! Status: quoted`)
                                // BUG #3 FIXED: Update UI immediately after each successful processing
                                setQuotations(SmartSourcingService.getAll())
                                HapticService.trigger('notification')
                            } else {
                                console.warn(`⚠️ Falha ao processar cotação ${matchingQuotation.id}:`, result.error)
                            }
                        } else {
                            console.warn(`⚠️ Nenhuma cotação pendente encontrada para email: ${reply.supplierEmail}`)
                            console.log(`   Emails pendentes:`, pendingQuotations.map(q => q.supplierEmail))
                        }
                    }


                    // Final refresh to ensure all changes are visible
                    setQuotations(SmartSourcingService.getAll())
                } else {
                    console.log('📭 Nenhuma resposta nova encontrada')
                }
            } catch (error) {
                console.error('❌ Erro ao verificar emails:', error)
            } finally {
                if (isMounted) {
                    setIsCheckingEmails(false)
                }
            }
        }

        // Initial check after 2 seconds
        const initialTimeout = setTimeout(checkForSupplierReplies, 2000)

        // Poll every 30 seconds
        const interval = setInterval(checkForSupplierReplies, 30000)

        return () => {
            isMounted = false
            clearTimeout(initialTimeout)
            clearInterval(interval)
        }
    }, [gmailConnected, userId, userName])

    // Filter quotations by active tab
    const filteredQuotations = useMemo(() => {
        const tab = WORKFLOW_TABS.find(t => t.id === activeTab)
        if (!tab) return quotations

        if (tab.statuses === 'all') {
            return quotations
        }

        return quotations.filter(q => tab.statuses.includes(q.status))
    }, [quotations, activeTab])

    // Tab counts
    const tabCounts = useMemo(() => {
        const counts = {}
        WORKFLOW_TABS.forEach(tab => {
            if (tab.statuses === 'all') {
                counts[tab.id] = quotations.length
            } else {
                counts[tab.id] = quotations.filter(q => tab.statuses.includes(q.status)).length
            }
        })
        return counts
    }, [quotations])

    // Products needing reorder
    const lowStockProducts = useMemo(() => {
        return products.filter(p => (p.currentStock || 0) <= (p.minStock || 0))
    }, [products])

    // =========================================================
    // MANUAL EMAIL CHECK - Immediately check and process emails
    // =========================================================
    const handleCheckEmailsNow = useCallback(async () => {
        if (!gmailConnected) {
            alert('Gmail não conectado. Clique em "Ativar Automação 24/7" primeiro.')
            return
        }

        setIsCheckingEmails(true)
        HapticService.trigger('impactMedium')

        try {
            // Get pending quotations
            const currentQuotations = SmartSourcingService.getAll()
            const pendingQuotations = currentQuotations.filter(q =>
                [QUOTATION_STATUS.PENDING, QUOTATION_STATUS.AWAITING].includes(q.status)
            )

            if (pendingQuotations.length === 0) {
                alert('📭 Nenhuma cotação pendente para verificar')
                return
            }

            console.log(`🔍 Checking emails for ${pendingQuotations.length} pending quotations...`)

            // Get unique supplier emails
            const supplierEmails = [...new Set(
                pendingQuotations.map(q => q.supplierEmail).filter(Boolean)
            )]

            if (supplierEmails.length === 0) {
                alert('📭 Nenhum email de fornecedor cadastrado')
                return
            }

            // Find oldest quotation for date filter  
            const oldestQuotation = pendingQuotations.reduce((oldest, q) =>
                new Date(q.emailSentAt || q.createdAt) < new Date(oldest.emailSentAt || oldest.createdAt) ? q : oldest
            )
            const afterDate = new Date(oldestQuotation.emailSentAt || oldestQuotation.createdAt)

            // Check for replies via Gmail API
            const replies = await gmailService.checkReplies(supplierEmails, afterDate)

            if (replies.length === 0) {
                alert('📭 Nenhuma resposta nova encontrada')
                return
            }

            console.log(`📬 Found ${replies.length} replies!`, replies)
            let processedCount = 0

            // Process each reply with AI
            for (const reply of replies) {
                console.log(`🔍 Trying to match reply from: ${reply.supplierEmail}`)

                // Find matching quotation - EXACT email matching with logging
                const matchingQuotation = pendingQuotations.find(q => {
                    const quotEmail = q.supplierEmail?.toLowerCase().trim() || ''
                    const replyEmail = reply.supplierEmail?.toLowerCase().trim() || ''

                    // Exact match (preferred)
                    if (quotEmail === replyEmail) {
                        console.log(`   ✅ Exact match: ${quotEmail}`)
                        return true
                    }

                    // Domain-level fallback
                    const quotDomain = quotEmail.split('@')[1]
                    const replyDomain = replyEmail.split('@')[1]
                    if (quotDomain && replyDomain && quotDomain === replyDomain) {
                        console.log(`   ✅ Domain match: ${quotDomain}`)
                        return true
                    }
                    return false
                })

                if (matchingQuotation) {
                    console.log(`🤖 Processing response for: ${matchingQuotation.supplierName} (ID: ${matchingQuotation.id})`)

                    // Use full body if available, otherwise use snippet
                    // BUG #3 FIX: Send ONLY the email body to AI, not headers
                    const emailBody = reply.body || reply.snippet || reply.subject || ''
                    console.log(`   📧 Email body length: ${emailBody.length} chars`)
                    console.log(`   📧 From: ${reply.from}, Subject: ${reply.subject}`)

                    // Process with AI - send clean body only
                    const result = await SmartSourcingService.processResponse(
                        matchingQuotation.id,
                        emailBody,  // BUG #3 FIX: Clean body only, no headers
                        userId,
                        userName
                    )

                    if (result.success) {
                        console.log(`✅ Quotation ${matchingQuotation.id} processed successfully! Status: quoted`)
                        processedCount++
                    } else {
                        console.warn(`⚠️ Processing failed for ${matchingQuotation.id}:`, result.error)
                    }
                } else {
                    console.warn(`⚠️ No matching pending quotation for: ${reply.supplierEmail}`)
                    console.log(`   Pending emails:`, pendingQuotations.map(q => q.supplierEmail))
                }
            }


            // Refresh quotations list
            setQuotations(SmartSourcingService.getAll())

            if (processedCount > 0) {
                HapticService.trigger('success')
                alert(`✅ ${processedCount} resposta(s) processada(s) com sucesso!\nCards movidos para "Ordens".`)
                setActiveTab('orders')
            } else {
                alert('📧 Emails encontrados, mas nenhum corresponde às cotações pendentes.')
            }

        } catch (error) {
            console.error('❌ Error checking emails:', error)
            HapticService.trigger('error')
            alert(`Erro ao verificar emails: ${error.message}`)
        } finally {
            setIsCheckingEmails(false)
        }
    }, [gmailConnected, userId, userName])

    // Refresh quotations
    const refreshQuotations = useCallback(() => {
        setQuotations(SmartSourcingService.getAll())
    }, [])

    // Handle actions
    const handleAction = useCallback(async (action, quotation) => {
        setIsLoading(true)
        HapticService.trigger('impactMedium')

        try {
            switch (action) {
                case 'confirm':
                    await SmartSourcingService.confirm(quotation.id, userId, userName)
                    HapticService.trigger('approval')
                    break

                case 'receive':
                    // Could prompt for invoice number here
                    await SmartSourcingService.confirmReceipt(quotation.id, {}, userId, userName)
                    HapticService.trigger('success')
                    break

                case 'followup':
                    await SmartSourcingService.followUp(quotation.id, 'Acompanhamento de cotação', userId, userName)
                    break

                case 'simulate':
                    // Demo: Simulate a supplier response
                    const mockResponse = `Prezado cliente,

Segue nossa cotação conforme solicitado:
${quotation.items.map(i => `- ${i.productName}: R$ ${((i.estimatedUnitPrice || 10) * 0.95).toFixed(2)} por ${i.unit}`).join('\n')}

Prazo de entrega: 3 dias úteis
Pagamento: 30 dias

Atenciosamente,
${quotation.supplierName}`

                    await SmartSourcingService.processResponse(quotation.id, mockResponse, userId, userName)
                    HapticService.trigger('notification')
                    break

                case 'delete':
                    await SmartSourcingService.delete(quotation.id, userId, userName)
                    HapticService.trigger('impactMedium')
                    break

                default:
                    console.log('Unknown action:', action)
            }

            refreshQuotations()
        } catch (error) {
            console.error('Action failed:', error)
            HapticService.trigger('error')
        } finally {
            setIsLoading(false)
        }
    }, [userId, userName, refreshQuotations])

    // Create new quotation
    const handleCreateQuotation = useCallback(async (supplier, items) => {
        setIsLoading(true)
        HapticService.trigger('impactMedium')

        try {
            const quotation = await SmartSourcingService.create({
                supplierId: supplier.id || `supplier_${Date.now()}`,
                supplierName: supplier.name,
                supplierEmail: supplier.email,
                items,
                userId,
                userName
            })

            // Send email
            await SmartSourcingService.sendEmail(quotation.id, userId, userName)

            refreshQuotations()
            setActiveTab('pending')

            HapticService.trigger('success')
        } catch (error) {
            console.error('Create quotation failed:', error)
            HapticService.trigger('error')
        } finally {
            setIsLoading(false)
        }
    }, [userId, userName, refreshQuotations])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                        Smart Sourcing AI
                    </h3>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">
                        Gestão de Cotações
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Email Checking Indicator */}
                    {isCheckingEmails && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 rounded-full border border-violet-200/50 dark:border-violet-500/20 flex items-center gap-2"
                        >
                            <motion.div
                                className="w-2 h-2 rounded-full bg-violet-500"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                            <span className="text-[8px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">
                                Verificando...
                            </span>
                        </motion.div>
                    )}

                    {/* Gmail Status - Clickable to reconnect */}
                    {gmailConnected ? (
                        <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                📧 Gmail
                            </span>
                        </div>
                    ) : (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                HapticService.trigger('impactMedium')
                                // Use full OAuth flow to get refresh token for 24/7 automation
                                gmailService.startFullAuthorization()
                            }}
                            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-full border border-rose-200/50 dark:border-rose-500/20 flex items-center gap-2 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                        >
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-rose-500"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <span className="text-[8px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                                🔐 Ativar Automação 24/7
                            </span>
                        </motion.button>
                    )}

                    {/* CHECK EMAILS NOW BUTTON - Only when Gmail connected */}
                    {gmailConnected && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCheckEmailsNow}
                            disabled={isCheckingEmails}
                            className={`px-3 py-1.5 rounded-full border flex items-center gap-2 cursor-pointer transition-colors ${isCheckingEmails
                                ? 'bg-violet-100 dark:bg-violet-500/20 border-violet-300 dark:border-violet-500/30'
                                : 'bg-violet-50 dark:bg-violet-500/10 border-violet-200/50 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/20'
                                }`}
                        >
                            {isCheckingEmails ? (
                                <motion.div
                                    className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                            ) : (
                                <span className="text-sm">🔍</span>
                            )}
                            <span className="text-[8px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">
                                {isCheckingEmails ? 'Verificando...' : 'Verificar Emails'}
                            </span>
                        </motion.button>
                    )}

                    {/* AI Status */}
                    {GeminiService.isReady() ? (
                        <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-200/50 dark:border-emerald-500/20">
                            <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                🤖 AI
                            </span>
                        </div>
                    ) : (
                        <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-full border border-amber-200/50 dark:border-amber-500/20">
                            <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                                AI Off
                            </span>
                        </div>
                    )}
                    {lowStockProducts.length > 0 && (
                        <div className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-full border border-rose-200/50 dark:border-rose-500/20">
                            <span className="text-[8px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                                {lowStockProducts.length} Baixo Estoque
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Workflow Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {WORKFLOW_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            HapticService.trigger('selection')
                            setActiveTab(tab.id)
                            setExpandedId(null)
                        }}
                        className={`flex-shrink-0 px-4 py-3 min-h-[48px] rounded-full text-sm font-bold tracking-wide transition-all flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg'
                            : 'bg-white/80 dark:bg-zinc-800/50 backdrop-blur-xl text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/5'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                        {tabCounts[tab.id] > 0 && (
                            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${activeTab === tab.id
                                ? 'bg-white/20 dark:bg-zinc-900/20'
                                : 'bg-zinc-200 dark:bg-zinc-700'
                                }`}>
                                {tabCounts[tab.id]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Quotation Cards */}
            <LayoutGroup>
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {filteredQuotations.map(quotation => (
                            <QuotationCard
                                key={quotation.id}
                                quotation={quotation}
                                isExpanded={expandedId === quotation.id}
                                onToggle={() => setExpandedId(
                                    expandedId === quotation.id ? null : quotation.id
                                )}
                                onAction={handleAction}
                            />
                        ))}
                    </AnimatePresence>

                    {filteredQuotations.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-3xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-white/5 text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <span className="text-3xl">
                                    {activeTab === 'pending' ? '⏳' :
                                        activeTab === 'orders' ? '📋' :
                                            activeTab === 'received' ? '✓' : '📚'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                {activeTab === 'pending' ? 'Nenhuma cotação pendente' :
                                    activeTab === 'orders' ? 'Nenhum pedido em andamento' :
                                        activeTab === 'received' ? 'Nenhum item recebido' :
                                            'Histórico vazio'}
                            </h3>
                            <p className="text-sm text-zinc-500">
                                {activeTab === 'pending' && lowStockProducts.length > 0
                                    ? `${lowStockProducts.length} produtos precisam reposição`
                                    : 'Suas cotações aparecerão aqui'}
                            </p>
                        </motion.div>
                    )}
                </div>
            </LayoutGroup>

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-12 h-12 rounded-full border-3 border-violet-500 border-t-transparent"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
