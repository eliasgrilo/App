/**
 * ═══════════════════════════════════════════════════════════════════
 * useFichaTecnicaState — Local UI state for FichaTecnica
 * Extracted from FichaTecnica.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState, useRef } from 'react'
import type { ID } from '../../types'
import type { NewIngredientState, InputModalState, InventoryItemLocal } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface FichaTecnicaStateReturn {
    // Selection
    selectedPizzaId: ID | null
    setSelectedPizzaId: (id: ID | null) => void
    editingId: ID | null
    setEditingId: (id: ID | null) => void

    // Creating/Adding
    isAddingIngredient: boolean
    setIsAddingIngredient: (v: boolean) => void
    isCreatingPizza: boolean
    setIsCreatingPizza: (v: boolean) => void
    newPizzaName: string
    setNewPizzaName: (v: string) => void

    // New Ingredient Form
    newIngredient: NewIngredientState
    setNewIngredient: React.Dispatch<React.SetStateAction<NewIngredientState>>
    matchedInventoryItem: InventoryItemLocal | null
    setMatchedInventoryItem: (item: InventoryItemLocal | null) => void

    // Input Modal
    inputModal: InputModalState | null
    setInputModal: (modal: InputModalState | null) => void

    // Reset ingredient form
    resetNewIngredient: () => void
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_NEW_INGREDIENT: NewIngredientState = {
    name: '',
    quantity: '',
    unit: 'g',
    pricePerUnit: '',
    isSyncedFromInventory: false,
    inventoryItemId: null
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useFichaTecnicaState(): FichaTecnicaStateReturn {
    // Selection
    const [selectedPizzaId, setSelectedPizzaId] = useState<ID | null>(null)
    const [editingId, setEditingId] = useState<ID | null>(null)

    // Creating/Adding
    const [isAddingIngredient, setIsAddingIngredient] = useState(false)
    const [isCreatingPizza, setIsCreatingPizza] = useState(false)
    const [newPizzaName, setNewPizzaName] = useState('')

    // New Ingredient Form
    const [newIngredient, setNewIngredient] = useState<NewIngredientState>(DEFAULT_NEW_INGREDIENT)
    const [matchedInventoryItem, setMatchedInventoryItem] = useState<InventoryItemLocal | null>(null)

    // Input Modal
    const [inputModal, setInputModal] = useState<InputModalState | null>(null)

    // Reset helper
    const resetNewIngredient = () => {
        setNewIngredient(DEFAULT_NEW_INGREDIENT)
        setMatchedInventoryItem(null)
    }

    return {
        // Selection
        selectedPizzaId,
        setSelectedPizzaId,
        editingId,
        setEditingId,

        // Creating/Adding
        isAddingIngredient,
        setIsAddingIngredient,
        isCreatingPizza,
        setIsCreatingPizza,
        newPizzaName,
        setNewPizzaName,

        // New Ingredient Form
        newIngredient,
        setNewIngredient,
        matchedInventoryItem,
        setMatchedInventoryItem,

        // Input Modal
        inputModal,
        setInputModal,

        // Helpers
        resetNewIngredient
    }
}

export default useFichaTecnicaState
