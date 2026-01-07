/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY TYPES — Type definitions for inventory module
 * Centralized types for all inventory components
 * ═══════════════════════════════════════════════════════════════════
 */

import { ID } from '../types'

// ═══════════════════════════════════════════════════════════════════
// STOCK STATUS
// ═══════════════════════════════════════════════════════════════════

export type StockStatus = 'noLimit' | 'critical' | 'warning' | 'excess' | 'ok' | 'low' | 'high'

// ═══════════════════════════════════════════════════════════════════
// INVENTORY ITEM
// ═══════════════════════════════════════════════════════════════════

export interface InventoryItem {
    id: number
    name: string
    packageQuantity: number
    packageCount: number
    unit: string
    pricePerUnit: number
    category: string
    subcategory?: string | null
    purchaseDate?: string
    supplierId?: ID | null
    supplierName?: string
    minStock?: number
    maxStock?: number
    criticalStock?: number
    enableAutoQuotation?: boolean
    leadTimeDays?: number
    shelfLifeDays?: number | null
    barcode?: string | null
    expiryDate?: string | null
    createdAt?: string
}

// ═══════════════════════════════════════════════════════════════════
// GROUPING & TOTALS
// ═══════════════════════════════════════════════════════════════════

export interface CategoryByValue {
    [key: string]: number
}

export interface GroupedItems {
    [key: string]: InventoryItem[]
}

export interface TotalsType {
    totalValue: number
    itemCount: number
    byCategory: CategoryByValue
    taxImpact: number
    grandTotal: number
}

// ═══════════════════════════════════════════════════════════════════
// UI STYLING
// ═══════════════════════════════════════════════════════════════════

export interface ColorScheme {
    bg: string
    text: string
    shadow: string
    pulse: string
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

export const TAX_RATE = 0.12

export const DEFAULT_CATEGORIES = ['Ingredientes', 'Embalagens', 'Equipamentos', 'Limpeza']

export const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
    'Ingredientes': ['Embutidos', 'Laticínios', 'Farináceos', 'Temperos', 'Vegetais', 'Outros Ingredientes'],
    'Embalagens': ['Caixas', 'Sacos', 'Descartáveis'],
    'Equipamentos': ['Utensílios', 'Máquinas'],
    'Limpeza': ['Produtos de Limpeza', 'Descartáveis']
}

