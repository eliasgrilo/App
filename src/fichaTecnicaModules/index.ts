/**
 * ═══════════════════════════════════════════════════════════════════
 * fichaTecnicaModules barrel exports
 * All components, hooks, types and utilities for FichaTecnica module
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════
export { CreatePizzaModal } from './components/CreatePizzaModal'
export { PizzaGridView } from './components/PizzaGridView'
export { PizzaDetailView } from './components/PizzaDetailView'
export { AddIngredientModal } from './components/AddIngredientModal'
export { IngredientTableDesktop } from './components/IngredientTableDesktop'
export { IngredientListMobile } from './components/IngredientListMobile'
export { InputModal } from './components/InputModal'

// ═══════════════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════════════
export { useFichaTecnicaState } from './hooks/useFichaTecnicaState'
export type { FichaTecnicaStateReturn } from './hooks/useFichaTecnicaState'

export { useFichaTecnicaHandlers } from './hooks/useFichaTecnicaHandlers'
export type { FichaTecnicaHandlersReturn, UseFichaTecnicaHandlersProps } from './hooks/useFichaTecnicaHandlers'

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════
export type {
    UnitType,
    InventoryItemLocal,
    NewIngredientState,
    InputModalState,
    PizzaIngredient,
    Pizza
} from './types'

// ═══════════════════════════════════════════════════════════════════
// Utils and Constants
// ═══════════════════════════════════════════════════════════════════
export {
    UNIT_TO_BASE,
    StockService,
    convertUnit,
    calculatePricePerBaseUnit,
    defaultPizza
} from './types'
