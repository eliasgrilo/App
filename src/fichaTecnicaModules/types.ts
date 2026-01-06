/**
 * FichaTecnica local types and utilities
 */

import { ID } from '../types'

// Units
export type UnitType = 'g' | 'kg' | 'ml' | 'L' | 'un' | 'cx'

export interface InventoryItemLocal {
    id: ID
    name: string
    packageQuantity: number
    packageCount: number
    pricePerUnit: number
    unit: string
}

export interface NewIngredientState {
    name: string
    quantity: string
    unit: string
    pricePerUnit: string
    isSyncedFromInventory: boolean
    inventoryItemId: ID | null
}

export interface InputModalState {
    title: string
    placeholder: string
    defaultValue: string
    onConfirm: (value: string) => void
    onCancel: () => void
}

export interface PizzaIngredient {
    id: ID
    name: string
    quantity: number
    unit: string
    pricePerUnit: number
    inventoryItemId?: ID | null
}

export interface Pizza {
    id: ID
    name: string
    createdAt: string
    ingredients: PizzaIngredient[]
}

// Unit conversion factors to base units (g for weight, ml for volume)
export const UNIT_TO_BASE: Record<string, number> = {
    'g': 1,
    'kg': 1000,
    'ml': 1,
    'L': 1000,
    'un': 1,
    'cx': 1
}

// Services - reusing stock logic
export const StockService = {
    getCurrentStock: (item: InventoryItemLocal): number => (item.packageQuantity || 0) * (item.packageCount || 1),
    getTotalQuantity: (item: InventoryItemLocal): number => (item.packageQuantity || 0) * (item.packageCount || 1)
}

// Convert quantity from one unit to another
export const convertUnit = (value: number, fromUnit: string, toUnit: string): number => {
    if (!fromUnit || !toUnit || isNaN(value)) return 0
    if (fromUnit === toUnit) return value

    const fromBase = UNIT_TO_BASE[fromUnit] || 1
    const toBase = UNIT_TO_BASE[toUnit] || 1

    if (toBase === 0) return 0

    return (value * fromBase) / toBase
}

// Calculate price per base unit from inventory item
export const calculatePricePerBaseUnit = (inventoryItem: InventoryItemLocal | null): number => {
    if (!inventoryItem) return 0

    const packageQty = Number(inventoryItem.packageQuantity) || 0
    const packageCount = Number(inventoryItem.packageCount) || 1
    const pricePerPackage = Number(inventoryItem.pricePerUnit) || 0

    const totalQuantity = packageQty * packageCount
    const totalValue = packageCount * pricePerPackage

    if (totalQuantity <= 0) return 0

    const pricePerInventoryUnit = totalValue / totalQuantity
    const inventoryUnitToBase = UNIT_TO_BASE[inventoryItem.unit] || 1
    return pricePerInventoryUnit / inventoryUnitToBase
}

export const defaultPizza: Pizza = {
    id: Date.now(),
    name: 'Pizza Margherita',
    createdAt: new Date().toISOString(),
    ingredients: []
}
