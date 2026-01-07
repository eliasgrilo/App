/**
 * ═══════════════════════════════════════════════════════════════════
 * productionModules barrel exports
 * All components, hooks, types and utilities for Production module
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════
export type {
    InputMode, YeastTypeKey, YeastTypeValue, PrefermentType, PrefermentKey,
    ProductionProps, YeastDataItem, YeastTypeData, PrefermentDataItem, PrefermentData,
    InputState, GramsInputState, InputModalState, Recipes, DisplayGrams
} from './types'

// ═══════════════════════════════════════════════════════════════════
// Constants & Utilities
// ═══════════════════════════════════════════════════════════════════
export {
    DEFAULT_INPUT_STATE, DEFAULT_GRAMS_STATE,
    formatNumber, hasValue
} from './types'

// ═══════════════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════════════
export { useProductionState } from './hooks/useProductionState'
export type { ProductionStateReturn, ProductionViewType } from './hooks/useProductionState'

export { useProductionHandlers } from './hooks/useProductionHandlers'
export type { ProductionHandlersReturn, UseProductionHandlersProps } from './hooks/useProductionHandlers'

// ═══════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════
export { ProductionHeader } from './components/ProductionHeader'
export { ProductionSummaryCard } from './components/ProductionSummaryCard'
export { PortioningSection } from './components/PortioningSection'
export { MaturationSection, ColdFermentationSection } from './components/MaturationSection'
export { FinalDoughSection } from './components/FinalDoughSection'
export { SystemControlsSection } from './components/SystemControlsSection'
export { SavedRecipesSection } from './components/SavedRecipesSection'
export { ProductionInputModal } from './components/ProductionInputModal'
export { ProductionContent } from './components/ProductionContent'

