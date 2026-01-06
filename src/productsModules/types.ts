// ═══════════════════════════════════════════════════════════════════
// PRODUCTS MODULE — Types & Constants
// ═══════════════════════════════════════════════════════════════════

import type { MovementType, ReasonCode } from '../stores/useAppStore'

export type SimpleMovementType = 'entrada' | 'saida'
export const UNITS = ['g', 'kg', 'ml', 'L', 'un', 'cx'] as const
export type UnitType = typeof UNITS[number]

export const TYPES: Record<SimpleMovementType, { label: string; color: string; isOut: boolean }> = {
    entrada: { label: 'Entrada', color: 'emerald', isOut: false },
    saida: { label: 'Saída', color: 'red', isOut: true }
}

export const REASONS: Record<ReasonCode, string> = {
    expired: 'Vencido', damaged: 'Danificado', theft: 'Furto',
    count_error: 'Erro contagem', other: 'Outro'
}

export const REASON_BY_TYPE: Record<SimpleMovementType, string[]> = {
    entrada: ['Sobra de Produção', 'Erro de Contagem', 'Saldo Inicial', 'Bonificação', 'Outro'],
    saida: ['Vencimento', 'Avaria', 'Quebra', 'Roubo / Furto', 'Consumo Interno', 'Erro de Contagem', 'Outro']
}

export interface MovementForm {
    type: SimpleMovementType
    itemId: number
    qty: string
    unit: UnitType
    reasonLabel: string
    reasonNote: string
    code: ReasonCode
}

export const DEFAULT_FORM: MovementForm = {
    type: 'entrada', itemId: 0, qty: '', unit: 'kg',
    reasonLabel: 'Sobra de Produção', reasonNote: '', code: 'other'
}

export type PeriodFilter = 'all' | 'today' | '7d' | '30d'

export const getDateLabel = (ts: string): string => {
    const d = new Date(ts), now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (dt.getTime() === today.getTime()) return 'Hoje'
    if (dt.getTime() === today.getTime() - 86400000) return 'Ontem'
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}
