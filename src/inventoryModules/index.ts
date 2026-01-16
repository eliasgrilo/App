/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY MODULE — Barrel Export
 * ═══════════════════════════════════════════════════════════════════
 */

// Components

export { MovementRegistry } from './components/MovementRegistry'
export { StockLevelsSection } from './components/StockLevelsSection'
export { ExpirationSection } from './components/ExpirationSection'
export { ExpirationLevelsSection } from './components/ExpirationLevelsSection'
export { ItemConfigModal } from './components/ItemConfigModal'
export { IngredientDetailModal } from './components/IngredientDetailModal'
export { StockMovementModal } from './components/StockMovementModal'
export { CategoryManagementModal } from './components/CategoryManagementModal'
export { ExpirationDateModal } from './components/ExpirationDateModal'
export { InventoryTable } from './components/InventoryTable'
export { InventoryDashboard } from './components/InventoryDashboard'
export { InventoryFilters } from './components/InventoryFilters'
export { InventoryHeader } from './components/InventoryHeader'
export { InventoryReportPage } from './components/InventoryReportPage'
export type { StockMovement } from './components/MovementRegistry'

// Hooks - Existing

export { useStockCalculations } from './hooks/useStockCalculations'
export { useInventoryFilters } from './hooks/useInventoryFilters'
export { useNewItemForm } from './hooks/useNewItemForm'
export type { NewItemState } from './hooks/useNewItemForm'

// Hooks - New (refactored from Inventory.tsx)
export { useInventoryState } from './hooks/useInventoryState'
export { useInventoryHandlers } from './hooks/useInventoryHandlers'
export { useInventoryTotals } from './hooks/useInventoryTotals'
export { useAutoQuotation } from './hooks/useAutoQuotation'
export type { InventoryStateReturn } from './hooks/useInventoryState'
export type { InventoryHandlersReturn } from './hooks/useInventoryHandlers'
export type { InventoryTotalsReturn } from './hooks/useInventoryTotals'

// Types & Constants
export type { StockStatus, InventoryItem, CategoryByValue, GroupedItems, TotalsType, ColorScheme } from './types'
export { TAX_RATE, DEFAULT_CATEGORIES, DEFAULT_SUBCATEGORIES } from './types'

// Constants (extracted from Inventory.tsx)
export { MOVEMENT_TYPES, UNITS, REASON_BY_TYPE, getStock } from './constants'
export type { UnitType } from './constants'
