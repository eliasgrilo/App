// ═══════════════════════════════════════════════════════════════════
// PRODUCTS MODULE — Barrel Export
// ═══════════════════════════════════════════════════════════════════

// Types
export * from './types'

// Hooks
export { useProductsState } from './hooks/useProductsState'
export type { ProductsStateReturn } from './hooks/useProductsState'
export { useProductsHandlers } from './hooks/useProductsHandlers'
export type { ProductsHandlersReturn } from './hooks/useProductsHandlers'

// Components
export { ProductsFilters } from './components/ProductsFilters'
export { MovementList } from './components/MovementList'
export { MovementModal } from './components/MovementModal'
