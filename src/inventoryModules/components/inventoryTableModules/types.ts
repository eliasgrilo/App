// ═══════════════════════════════════════════════════════════════════
// INVENTORY TABLE MODULES — Types & Utils
// ═══════════════════════════════════════════════════════════════════

import { ID } from '../../../types'

export interface InventoryItem {
    id: number; name: string; packageQuantity: number; packageCount: number; unit: string
    pricePerUnit: number; category: string; subcategory?: string; minStock?: number; maxStock?: number; criticalStock?: number
}

export type StockStatus = 'noLimit' | 'critical' | 'warning' | 'excess' | 'ok' | 'low' | 'high'
export interface GroupedItems { [key: string]: InventoryItem[] }
export interface TotalsType { totalValue: number; itemCount: number; byCategory: { [key: string]: number }; taxImpact: number; grandTotal: number }

export interface InventoryTableProps {
    groupedItems: GroupedItems; totals: TotalsType; taxRate: number; subcategories: string[]
    formatCurrency: (value: number) => string; getStockStatus: (item: InventoryItem) => StockStatus
    getTotalQuantity: (item: InventoryItem) => number; getItemTotal: (item: InventoryItem) => number
    handleUpdateItem: (id: number | ID, field: string, value: string | number) => void; handleDeleteItem: (id: number | ID) => void; onAddItem: () => void
    hasActiveFilter?: boolean; onSelectIngredient?: (item: InventoryItem) => void
}

export interface RowProps {
    item: InventoryItem; isEditing: boolean; taxRate: number; subcategories: string[]
    formatCurrency: (value: number) => string; getStockStatus: (item: InventoryItem) => StockStatus
    getTotalQuantity: (item: InventoryItem) => number; getItemTotal: (item: InventoryItem) => number
    handleUpdateItem: (id: number | ID, field: string, value: string | number) => void; handleDeleteItem: (id: number | ID) => void
    setEditingId: (id: ID | null) => void; onSelectIngredient?: (item: InventoryItem) => void
}

export const unitOptions = ['kg', 'g', 'L', 'ml', 'un', 'cx']
