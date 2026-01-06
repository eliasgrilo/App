/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY MODULE — Barrel Export
 * ═══════════════════════════════════════════════════════════════════
 */

// Components
export { ExpiryMonitoringSection } from './components/ExpiryMonitoringSection'
export { MovementRegistry } from './components/MovementRegistry'
export { StockLevelsSection } from './components/StockLevelsSection'
export { ItemConfigModal } from './components/ItemConfigModal'
export { StockMovementModal } from './components/StockMovementModal'
export { CategoryManagementModal } from './components/CategoryManagementModal'
export { InventoryTable } from './components/InventoryTable'
export { InventoryDashboard } from './components/InventoryDashboard'
export { InventoryFilters } from './components/InventoryFilters'
export { InventoryHeader } from './components/InventoryHeader'
export type { StockMovement } from './components/MovementRegistry'

// Hooks
export { useExpiryMonitoring } from './hooks/useExpiryMonitoring'
export { useStockCalculations } from './hooks/useStockCalculations'
export { useInventoryFilters } from './hooks/useInventoryFilters'
export { useNewItemForm } from './hooks/useNewItemForm'
export type { NewItemState } from './hooks/useNewItemForm'

// Types & Constants
export type { StockStatus, InventoryItem, CategoryByValue, GroupedItems, TotalsType, ColorScheme } from './types'
export { TAX_RATE, DEFAULT_CATEGORIES, DEFAULT_SUBCATEGORIES } from './types'
