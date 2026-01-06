/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY CONSTANTS — Centralized configuration values
 * Move all hardcoded constants from Inventory.tsx to this file
 * ═══════════════════════════════════════════════════════════════════
 */

import type { InventoryItem } from './types'

// ═══════════════════════════════════════════════════════════════════
// MOVEMENT TYPES
// ═══════════════════════════════════════════════════════════════════

export const MOVEMENT_TYPES: Record<string, { label: string; color: string; isOut: boolean }> = {
    entrada: { label: 'Entrada', color: 'emerald', isOut: false },
    saida: { label: 'Saída', color: 'red', isOut: true },
    ajuste: { label: 'Ajuste', color: 'amber', isOut: true },
    producao: { label: 'Produção', color: 'blue', isOut: true },
    perda: { label: 'Perda', color: 'rose', isOut: true }
}

// ═══════════════════════════════════════════════════════════════════
// UNITS
// ═══════════════════════════════════════════════════════════════════

export const UNITS = ['g', 'kg', 'ml', 'L', 'un', 'cx'] as const
export type UnitType = typeof UNITS[number]

// ═══════════════════════════════════════════════════════════════════
// REASON BY MOVEMENT TYPE
// ═══════════════════════════════════════════════════════════════════

export const REASON_BY_TYPE: Record<'entrada' | 'saida', string[]> = {
    entrada: ['Sobra de Produção', 'Erro de Contagem', 'Saldo Inicial', 'Bonificação', 'Outro'],
    saida: ['Vencimento', 'Avaria', 'Quebra', 'Roubo / Furto', 'Consumo Interno', 'Erro de Contagem', 'Outro']
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate total stock from package quantity and count
 */
export const getStock = (item: InventoryItem): number =>
    (item.packageQuantity || 0) * (item.packageCount || 1)
