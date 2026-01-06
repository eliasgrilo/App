/**
 * ═══════════════════════════════════════════════════════════════════
 * useInventoryTotals — Derived computations for inventory
 * Encapsulates all useMemo calculations from Inventory.tsx
 * ═══════════════════════════════════════════════════════════════════
 */

import { useMemo } from 'react'
import type { InventoryItem, StockStatus, TotalsType, CategoryByValue } from '../types'
import { TAX_RATE } from '../types'
import { getStockStatus as getStockStatusService, getTotalQuantity as getTotalQuantityService } from '../../services/stockService'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface UseInventoryTotalsProps {
    items: InventoryItem[]
    taxRate?: number
}

export interface InventoryTotalsReturn {
    totals: TotalsType
    getTotalQuantity: (item: InventoryItem) => number
    getStockStatus: (item: InventoryItem) => StockStatus
    getItemTotal: (item: InventoryItem) => number
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useInventoryTotals({
    items,
    taxRate = TAX_RATE
}: UseInventoryTotalsProps): InventoryTotalsReturn {

    /**
     * Calculate total quantity for an item (total weight/volume)
     * Uses centralized StockService for consistency
     */
    const getTotalQuantity = (item: InventoryItem): number => {
        return getTotalQuantityService(item)
    }

    /**
     * Stock status indicator - Apple-quality 5-tier system
     * Uses centralized StockService for consistency across the app
     */
    const getStockStatus = (item: InventoryItem): StockStatus => {
        const status = getStockStatusService(item)
        // Map to Inventory's existing status names for UI compatibility
        switch (status) {
            case 'critical': return 'low'
            case 'warning': return 'warning'
            case 'excess': return 'high'
            case 'ok': return 'ok'
            default: return 'noLimit'
        }
    }

    /**
     * Calculate total value for an item
     * Formula: Nº Pacotes × Preço por Pacote
     */
    const getItemTotal = (item: InventoryItem): number => {
        const packageCount = Number(item.packageCount) || 1
        return packageCount * (Number(item.pricePerUnit) || 0)
    }

    /**
     * Calculate aggregated totals for all items
     */
    const totals: TotalsType = useMemo(() => {
        const totalValue = items.reduce((sum: number, item: InventoryItem) => sum + getItemTotal(item), 0)
        const itemCount = items.length

        // Group by category
        const byCategory: CategoryByValue = items.reduce((acc: CategoryByValue, item: InventoryItem) => {
            const value = getItemTotal(item)
            acc[item.category] = (acc[item.category] || 0) + value
            return acc
        }, {})

        return {
            totalValue,
            itemCount,
            byCategory,
            taxImpact: totalValue * taxRate,
            grandTotal: totalValue * (1 + taxRate)
        }
    }, [items, taxRate])

    return {
        totals,
        getTotalQuantity,
        getStockStatus,
        getItemTotal
    }
}

export default useInventoryTotals
