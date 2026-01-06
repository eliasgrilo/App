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
export type { StockMovement } from './components/MovementRegistry'

// Hooks
export { useStockCalculations } from './hooks/useStockCalculations'
export { useExpiryMonitoring } from './hooks/useExpiryMonitoring'
export { useInventoryFilters } from './hooks/useInventoryFilters'
