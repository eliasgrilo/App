/**
 * ═══════════════════════════════════════════════════════════════════
 * useExpiryMonitoring — Expiry Date Monitoring Hook
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Provides expiry calculations and filtering for inventory items.
 * 
 * @module inventory/hooks/useExpiryMonitoring
 */

import { useMemo } from 'react'
import {
    getExpiryStatus,
    getDaysUntilExpiry,
    getExpiryData,
    type ExpiryStatus,
    type ExpiryData,
    type StockItem
} from '../../services/stockService'

interface ItemWithExpiry<T extends StockItem> {
    item: T
    expiryData: ExpiryData
}

interface ExpiryStats {
    expiredCount: number
    criticalCount: number
    warningCount: number
    okCount: number
    noExpiryCount: number
    totalMonitored: number
}

interface ExpiryMonitoringResult<T extends StockItem> {
    /** Items with expiry data, sorted by urgency */
    itemsWithExpiry: ItemWithExpiry<T>[]
    /** Most urgent item (first to expire) */
    mostUrgent: ItemWithExpiry<T> | null
    /** Items without expiry dates */
    itemsWithoutExpiry: T[]
    /** Expiry statistics */
    stats: ExpiryStats
    /** Get expiry status for a single item */
    getStatus: (item: StockItem) => ExpiryStatus
    /** Get days until expiry for a single item */
    getDays: (item: StockItem) => number | null
    /** Get full expiry data for a single item */
    getData: (item: StockItem) => ExpiryData | null
}

/**
 * Hook for expiry date monitoring.
 * 
 * @param items - Array of inventory items to monitor
 * @returns Expiry monitoring data and utilities
 * 
 * @example
 * const { mostUrgent, stats, itemsWithExpiry } = useExpiryMonitoring(items)
 * if (mostUrgent) {
 *   console.log(`${mostUrgent.item.name} expires in ${mostUrgent.expiryData.days} days`)
 * }
 */
export function useExpiryMonitoring<T extends StockItem>(
    items: T[]
): ExpiryMonitoringResult<T> {
    const result = useMemo(() => {
        const itemsWithExpiry: ItemWithExpiry<T>[] = []
        const itemsWithoutExpiry: T[] = []

        items.forEach(item => {
            const data = getExpiryData(item)
            if (data) {
                itemsWithExpiry.push({ item, expiryData: data })
            } else {
                itemsWithoutExpiry.push(item)
            }
        })

        // Sort by urgency (most urgent first)
        itemsWithExpiry.sort((a, b) => a.expiryData.days - b.expiryData.days)

        // Calculate stats
        const stats: ExpiryStats = {
            expiredCount: itemsWithExpiry.filter(i => i.expiryData.status === 'expired').length,
            criticalCount: itemsWithExpiry.filter(i => i.expiryData.status === 'critical').length,
            warningCount: itemsWithExpiry.filter(i => i.expiryData.status === 'warning').length,
            okCount: itemsWithExpiry.filter(i => i.expiryData.status === 'ok').length,
            noExpiryCount: itemsWithoutExpiry.length,
            totalMonitored: itemsWithExpiry.length
        }

        return {
            itemsWithExpiry,
            mostUrgent: itemsWithExpiry[0] || null,
            itemsWithoutExpiry,
            stats
        }
    }, [items])

    return {
        ...result,
        getStatus: getExpiryStatus,
        getDays: getDaysUntilExpiry,
        getData: getExpiryData
    }
}

export default useExpiryMonitoring
