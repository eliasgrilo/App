/**
 * ═══════════════════════════════════════════════════════════════════
 * useStockCalculations — Stock Calculation Hook
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Provides stock calculation functions for inventory items.
 * 
 * @module inventory/hooks/useStockCalculations
 */

import { useMemo, useCallback } from 'react'
import {
    getCurrentStock,
    getStockValue,
    getStockStatus,
    needsReorder,
    getReorderQuantity,
    type StockStatus,
    type StockItem
} from '../../services/stockService'

interface StockCalculations {
    /** Get current stock for an item */
    getStock: (item: StockItem) => number
    /** Get monetary value of stock */
    getValue: (item: StockItem) => number
    /** Get stock health status */
    getStatus: (item: StockItem) => StockStatus
    /** Check if item needs reordering */
    needsReorder: (item: StockItem) => boolean
    /** Get suggested reorder quantity */
    getReorderQty: (item: StockItem) => number
    /** Calculate totals for multiple items */
    getTotals: (items: StockItem[]) => {
        totalValue: number
        itemCount: number
        criticalCount: number
        warningCount: number
        okCount: number
    }
}

/**
 * Hook for stock calculations.
 * 
 * @example
 * const { getStock, getStatus, getTotals } = useStockCalculations()
 * const status = getStatus(item)
 * const totals = getTotals(items)
 */
export function useStockCalculations(): StockCalculations {
    const getStock = useCallback((item: StockItem) => getCurrentStock(item), [])
    const getValue = useCallback((item: StockItem) => getStockValue(item), [])
    const getStatus = useCallback((item: StockItem) => getStockStatus(item), [])
    const checkNeedsReorder = useCallback((item: StockItem) => needsReorder(item), [])
    const getReorderQty = useCallback((item: StockItem) => getReorderQuantity(item), [])

    const getTotals = useCallback((items: StockItem[]) => {
        let totalValue = 0
        let criticalCount = 0
        let warningCount = 0
        let okCount = 0

        items.forEach(item => {
            totalValue += getStockValue(item)
            const status = getStockStatus(item)
            if (status === 'critical') criticalCount++
            else if (status === 'warning') warningCount++
            else if (status === 'ok') okCount++
        })

        return {
            totalValue,
            itemCount: items.length,
            criticalCount,
            warningCount,
            okCount
        }
    }, [])

    return {
        getStock,
        getValue,
        getStatus,
        needsReorder: checkNeedsReorder,
        getReorderQty,
        getTotals
    }
}

export default useStockCalculations
