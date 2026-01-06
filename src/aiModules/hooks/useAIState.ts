// ═══════════════════════════════════════════════════════════════════
// AI MODULE — useAIState Hook
// State management for AI component 
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react'
import { useIngredients, useSuppliers } from '../../stores/useAppStore'
import { useToast } from '../../stores/useUIStore'
import type { Supplier, Ingredient } from '../../types'
import type {
    AlertItem,
    SupplierGroupWithSupplier,
    EmailDraft,
    SentEmail,
    QuotationTabKey,
    AIStats,
    SyncStatus
} from '../types'

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

const getTotalQuantity = (item: Ingredient): number => {
    return (Number(item.packageQuantity) || 0) * (Number(item.packageCount) || 1)
}

const getStockStatus = (item: Ingredient): 'critical' | 'warning' | 'ok' => {
    const total = getTotalQuantity(item)
    const min = Number(item.minStock) || 0
    if (min === 0) return 'ok'
    if (total < min) return 'critical'
    if (total <= min * 1.2) return 'warning'
    return 'ok'
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useAIState() {
    // Zustand Store - persistent state
    const inventory = useIngredients()
    const suppliers = useSuppliers()

    // Sync status
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')

    // Email Composer State
    const [isComposerOpen, setIsComposerOpen] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const [emailDraft, setEmailDraft] = useState<EmailDraft>({ to: '', subject: '', body: '' })
    const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [lastSentEmail, setLastSentEmail] = useState<SentEmail | null>(null)

    // Quotation tab state
    const [quotationTab, setQuotationTab] = useState<QuotationTabKey>('aguardando')

    // Toast
    const { toast } = useToast()
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    // Alerts grouped by supplier
    const alertsBySupplier: SupplierGroupWithSupplier[] = useMemo(() => {
        const alerts: AlertItem[] = inventory
            .filter(item => {
                const status = getStockStatus(item)
                return status === 'critical' || status === 'warning'
            })
            .map(item => ({
                ...item,
                status: getStockStatus(item),
                totalQty: getTotalQuantity(item)
            }))

        const grouped: Record<string | number, { supplier: Supplier | undefined; items: AlertItem[] }> = {}
        alerts.forEach(item => {
            const supplier = suppliers.find(s =>
                (s.linkedItems as unknown as Array<{ itemId: number }> | undefined)?.some(li => li.itemId === item.id)
            )
            const key = supplier?.id ?? 'unlinked'
            if (!grouped[key]) {
                grouped[key] = { supplier, items: [] }
            }
            grouped[key].items.push(item)
        })

        return Object.values(grouped).filter((g): g is SupplierGroupWithSupplier => g.supplier !== undefined)
    }, [inventory, suppliers])

    // Stats for dashboard
    const stats: AIStats = useMemo(() => {
        const total = inventory.length
        const critical = inventory.filter(i => getStockStatus(i) === 'critical').length
        const warning = inventory.filter(i => getStockStatus(i) === 'warning').length
        const suppliersWithAlerts = alertsBySupplier.length
        const healthScore = total > 0 ? Math.max(0, Math.round(100 - (critical * 20) - (warning * 5))) : 100
        return { total, critical, warning, suppliersWithAlerts, healthScore }
    }, [inventory, alertsBySupplier])

    const scoreColor: 'emerald' | 'amber' | 'rose' = stats.healthScore >= 80 ? 'emerald' : stats.healthScore >= 60 ? 'amber' : 'rose'

    return {
        // Data
        inventory,
        suppliers,
        alertsBySupplier,
        stats,
        scoreColor,

        // Sync
        syncStatus,
        setSyncStatus,

        // Email
        isComposerOpen,
        setIsComposerOpen,
        selectedSupplier,
        setSelectedSupplier,
        emailDraft,
        setEmailDraft,
        sentEmails,
        setSentEmails,
        isSendingEmail,
        setIsSendingEmail,
        showSuccessModal,
        setShowSuccessModal,
        lastSentEmail,
        setLastSentEmail,

        // Quotation
        quotationTab,
        setQuotationTab,

        // Toast
        showToast
    }
}

export type AIStateReturn = ReturnType<typeof useAIState>
