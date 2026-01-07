// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Type Definitions
// ═══════════════════════════════════════════════════════════════════

import type { Ingredient, Supplier } from '../types'

export interface AlertItem extends Ingredient {
    status: 'critical' | 'warning' | 'ok'
    totalQty: number
}

export interface SupplierGroup {
    supplier: Supplier | undefined
    items: AlertItem[]
}

export interface SupplierGroupWithSupplier {
    supplier: Supplier
    items: AlertItem[]
}

export interface EmailDraft {
    to: string
    subject: string
    body: string
}

export interface SentEmail {
    id: string
    to: string
    subject: string
    body: string
    supplierName?: string
    sentAt: string
    status: string
}

export interface QuotationItemData {
    name: string
    current: number
    max: number
    requested: number
}

export interface Quotation {
    id: string
    supplier: string
    supplierInitial: string
    supplierEmail?: string
    itemCount: number
    timestamp: string
    items: QuotationItemData[]
}

export type HistoryQuotationStatus = 'sem_resposta' | 'recebido'

export interface HistoryQuotation extends Quotation {
    status: HistoryQuotationStatus
    time: string
}

export type QuotationTabKey = 'pendente' | 'aguardando' | 'ordens' | 'recebido' | 'historico'

export interface AIStats {
    total: number
    critical: number
    warning: number
    suppliersWithAlerts: number
    healthScore: number
}

export type SyncStatus = 'synced' | 'syncing' | 'error'
