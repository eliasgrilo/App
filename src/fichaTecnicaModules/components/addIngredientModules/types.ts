// ═══════════════════════════════════════════════════════════════════
// FT ADD INGREDIENT MODULES — Types
// ═══════════════════════════════════════════════════════════════════

import type { InventoryItemLocal, NewIngredientState } from '../../types'

export interface AddIngredientModalProps {
    isOpen: boolean; onClose: () => void; newIngredient: NewIngredientState; setNewIngredient: React.Dispatch<React.SetStateAction<NewIngredientState>>
    matchedInventoryItem: InventoryItemLocal | null; setMatchedInventoryItem: (item: InventoryItemLocal | null) => void; inventoryItems: InventoryItemLocal[]
    handleIngredientNameChange: (name: string) => void; handleUnitChange: (unit: string) => void; handleAddIngredient: (keepOpen?: boolean) => void
    formatCurrency: (v: number) => string; formatPrice: (v: number | string) => string
}

export type { InventoryItemLocal, NewIngredientState }
