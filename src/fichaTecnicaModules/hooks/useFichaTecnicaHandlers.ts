/**
 * ═══════════════════════════════════════════════════════════════════
 * useFichaTecnicaHandlers — CRUD operations for FichaTecnica
 * Extracted from FichaTecnica.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import { useMemo, useCallback } from 'react'
import type { ID, RecipeIngredient, NewRecipe } from '../../types'
import type { Pizza, PizzaIngredient, InventoryItemLocal, NewIngredientState } from '../types'
import { UNIT_TO_BASE, calculatePricePerBaseUnit } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ToastContextType {
    success: (msg: string) => void
    error: (msg: string) => void
    info: (msg: string) => void
}

export interface ModalContextType {
    close: () => void
    confirm: (opts: {
        title: string
        message: string
        isDangerous?: boolean
        onConfirm: () => void
    }) => void
}

export interface InputModalState {
    title: string
    placeholder: string
    defaultValue: string
    onConfirm: (value: string) => void
    onCancel: () => void
}

export interface UseFichaTecnicaHandlersProps {
    pizzas: Pizza[]
    selectedPizzaId: ID | null
    setSelectedPizzaId: (id: ID | null) => void
    setEditingId: (id: ID | null) => void
    newPizzaName: string
    setNewPizzaName: (v: string) => void
    setIsCreatingPizza: (v: boolean) => void
    setIsAddingIngredient: (v: boolean) => void
    newIngredient: NewIngredientState
    setNewIngredient: React.Dispatch<React.SetStateAction<NewIngredientState>>
    matchedInventoryItem: InventoryItemLocal | null
    setMatchedInventoryItem: (item: InventoryItemLocal | null) => void
    setInputModal: (modal: InputModalState | null) => void
    inventoryItems: InventoryItemLocal[]
    addRecipe: (recipe: NewRecipe) => void
    updateRecipe: (id: ID, updates: Partial<Pizza>) => void
    removeRecipe: (id: ID) => void
    formatCurrency: (v: number) => string
    toast: ToastContextType
    modal: ModalContextType
}

export interface FichaTecnicaHandlersReturn {
    selectedPizza: Pizza | null
    totals: { totalCost: number; costPerPizza: number }
    handleCreatePizza: () => void
    handleDeletePizza: (id: ID) => void
    handleRenamePizza: (id: ID) => void
    handleIngredientNameChange: (name: string) => void
    handleUnitChange: (newUnit: string) => void
    handleAddIngredient: (keepOpen?: boolean) => void
    handleUpdateIngredient: (ingredientId: ID, field: string, value: string | number) => void
    handleDeleteIngredient: (ingredientId: ID) => void
    getItemCost: (ing: PizzaIngredient) => number
    formatPrice: (val: number | string) => string
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useFichaTecnicaHandlers({
    pizzas,
    selectedPizzaId,
    setSelectedPizzaId,
    setEditingId,
    newPizzaName,
    setNewPizzaName,
    setIsCreatingPizza,
    setIsAddingIngredient,
    newIngredient,
    setNewIngredient,
    matchedInventoryItem,
    setMatchedInventoryItem,
    setInputModal,
    inventoryItems,
    addRecipe,
    updateRecipe,
    removeRecipe,
    formatCurrency,
    toast,
    modal
}: UseFichaTecnicaHandlersProps): FichaTecnicaHandlersReturn {

    // ═══════════════════════════════════════════════════════════════
    // DERIVED STATE
    // ═══════════════════════════════════════════════════════════════

    const selectedPizza = useMemo(() => {
        return pizzas.find(p => p.id === selectedPizzaId) || null
    }, [pizzas, selectedPizzaId])

    // Calculate individual cost - SIMPLE: quantity × pricePerUnit
    const getItemCost = useCallback((ing: PizzaIngredient): number => {
        return (Number(ing.quantity) || 0) * (Number(ing.pricePerUnit) || 0)
    }, [])

    // Calculate totals for a pizza
    const totals = useMemo(() => {
        if (!selectedPizza?.ingredients) return { totalCost: 0, costPerPizza: 0 }

        const totalCost = (selectedPizza.ingredients || []).reduce((sum: number, ing: PizzaIngredient) => {
            return sum + getItemCost(ing)
        }, 0)
        return { totalCost, costPerPizza: totalCost }
    }, [selectedPizza?.ingredients, getItemCost])

    // Format small prices with precision
    const formatPrice = useCallback((val: number | string): string => {
        const n = Number(val) || 0
        return formatCurrency(n)
    }, [formatCurrency])

    // ═══════════════════════════════════════════════════════════════
    // PIZZA HANDLERS
    // ═══════════════════════════════════════════════════════════════

    const handleCreatePizza = useCallback(() => {
        if (!newPizzaName.trim()) return

        const newPizza = {
            id: Date.now(),
            name: newPizzaName.trim(),
            createdAt: new Date().toISOString(),
            ingredients: [] as PizzaIngredient[]
        }

        addRecipe(newPizza as unknown as NewRecipe)
        setNewPizzaName('')
        setIsCreatingPizza(false)
        setSelectedPizzaId(newPizza.id)
    }, [newPizzaName, addRecipe, setNewPizzaName, setIsCreatingPizza, setSelectedPizzaId])

    const handleDeletePizza = useCallback((id: ID) => {
        const pizza = pizzas.find(p => p.id === id)
        modal.confirm({
            title: 'Excluir Pizza',
            message: `A pizza "${pizza?.name || ''}" será removida permanentemente.`,
            isDangerous: true,
            onConfirm: () => {
                removeRecipe(id)
                if (selectedPizzaId === id) setSelectedPizzaId(null)
            }
        })
    }, [pizzas, modal, removeRecipe, selectedPizzaId, setSelectedPizzaId])

    const handleRenamePizza = useCallback((id: ID) => {
        const pizza = pizzas.find(p => p.id === id)
        if (!pizza) return

        setInputModal({
            title: 'Renomear Pizza',
            placeholder: 'Nome da pizza',
            defaultValue: pizza.name,
            onConfirm: (newName: string) => {
                if (newName && newName !== pizza.name) {
                    updateRecipe(id, { name: newName.trim() })
                }
                setInputModal(null)
            },
            onCancel: () => setInputModal(null)
        })
    }, [pizzas, setInputModal, updateRecipe])

    // ═══════════════════════════════════════════════════════════════
    // INGREDIENT HANDLERS
    // ═══════════════════════════════════════════════════════════════

    const handleIngredientNameChange = useCallback((name: string) => {
        setNewIngredient(prev => ({ ...prev, name }))
        setMatchedInventoryItem(null)

        if (!Array.isArray(inventoryItems)) return

        if (name && name.trim().length > 0) {
            const searchTerm = name.toLowerCase().trim()
            const match = inventoryItems.find((item: InventoryItemLocal) => {
                if (!item || !item.name) return false
                return item.name.toLowerCase() === searchTerm
            })

            if (match) {
                setMatchedInventoryItem(match)
                const pricePerBaseUnit = calculatePricePerBaseUnit(match)
                const targetUnitToBase = UNIT_TO_BASE[newIngredient.unit] || 1
                const pricePerTargetUnit = pricePerBaseUnit * targetUnitToBase

                setNewIngredient(prev => ({
                    ...prev,
                    pricePerUnit: pricePerTargetUnit.toFixed(6),
                    isSyncedFromInventory: true,
                    inventoryItemId: match.id
                }))
            }
        }
    }, [inventoryItems, newIngredient.unit, setNewIngredient, setMatchedInventoryItem])

    const handleUnitChange = useCallback((newUnit: string) => {
        setNewIngredient(prev => {
            const updated = { ...prev, unit: newUnit }

            if (matchedInventoryItem) {
                const pricePerBaseUnit = calculatePricePerBaseUnit(matchedInventoryItem)
                const targetUnitToBase = UNIT_TO_BASE[newUnit] || 1
                const pricePerTargetUnit = pricePerBaseUnit * targetUnitToBase

                updated.pricePerUnit = pricePerTargetUnit.toFixed(6)
                updated.isSyncedFromInventory = true
            }

            return updated
        })
    }, [matchedInventoryItem, setNewIngredient])

    const handleAddIngredient = useCallback((keepOpen = false) => {
        if (!selectedPizza || !newIngredient.name.trim() || !newIngredient.quantity) return

        const ingredient = {
            id: Date.now(),
            name: newIngredient.name.trim(),
            quantity: Number(newIngredient.quantity) || 0,
            unit: newIngredient.unit,
            pricePerUnit: Number(newIngredient.pricePerUnit) || 0,
            inventoryItemId: newIngredient.inventoryItemId
        }

        const updatedIngredients: PizzaIngredient[] = [...(selectedPizza.ingredients || []), ingredient]
        updateRecipe(selectedPizzaId as ID, { ingredients: updatedIngredients })

        setNewIngredient({
            name: '', quantity: '', unit: 'g', pricePerUnit: '',
            isSyncedFromInventory: false, inventoryItemId: null
        })
        setMatchedInventoryItem(null)

        if (keepOpen) {
            setTimeout(() => document.getElementById('cat-ing-name-input')?.focus(), 50)
        } else {
            setIsAddingIngredient(false)
        }
    }, [selectedPizza, selectedPizzaId, newIngredient, updateRecipe, setNewIngredient, setMatchedInventoryItem, setIsAddingIngredient])

    const handleUpdateIngredient = useCallback((ingredientId: ID, field: string, value: string | number) => {
        if (!selectedPizza) return

        const updatedIngredients = (selectedPizza.ingredients || []).map((ing: PizzaIngredient) => {
            if (ing.id !== ingredientId) return ing
            return {
                ...ing,
                [field]: field === 'name' || field === 'unit' ? value : Number(value) || 0
            }
        })

        updateRecipe(selectedPizzaId as ID, { ingredients: updatedIngredients })
    }, [selectedPizza, selectedPizzaId, updateRecipe])

    const handleDeleteIngredient = useCallback((ingredientId: ID) => {
        if (!selectedPizza) return

        const updatedIngredients = (selectedPizza.ingredients || []).filter((ing: PizzaIngredient) => ing.id !== ingredientId)
        updateRecipe(selectedPizzaId as ID, { ingredients: updatedIngredients })
        setEditingId(null)
    }, [selectedPizza, selectedPizzaId, updateRecipe, setEditingId])

    return {
        selectedPizza,
        totals,
        handleCreatePizza,
        handleDeletePizza,
        handleRenamePizza,
        handleIngredientNameChange,
        handleUnitChange,
        handleAddIngredient,
        handleUpdateIngredient,
        handleDeleteIngredient,
        getItemCost,
        formatPrice
    }
}

export default useFichaTecnicaHandlers
