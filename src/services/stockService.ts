/**
 * ═══════════════════════════════════════════════════════════════════
 * STOCK SERVICE — Centralized Stock Management Logic
 * ═══════════════════════════════════════════════════════════════════
 * 
 * This service provides all stock-related calculations and business logic.
 * It should be used across all components that need stock information.
 * 
 * @module services/stockService
 */

import type { Ingredient } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Stock status indicator levels.
 * Used for visual representation of stock health.
 * 
 * @description
 * - `critical`: Stock is dangerously low (< 25% of min). Immediate action required.
 * - `warning`: Stock is below minimum. Time to reorder.
 * - `ok`: Stock is within healthy range.
 * - `excess`: Stock exceeds maximum. Avoid further purchases.
 * - `noLimit`: No stock limits configured.
 */
export type StockStatus = 'ok' | 'warning' | 'critical' | 'excess' | 'noLimit'

/**
 * Expiry status for shelf life monitoring.
 * 
 * @description
 * - `expired`: Past expiry date. Remove from stock.
 * - `critical`: Expires within 3 days.
 * - `warning`: Expires within 7 days.
 * - `ok`: More than 7 days until expiry.
 * - `noExpiry`: No expiry date set.
 */
export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'ok' | 'noExpiry'

/**
 * Comprehensive expiry data for an item.
 */
export interface ExpiryData {
    /** Days until expiry (negative if expired) */
    days: number
    /** Progress percentage for visual indicator (0-100) */
    progress: number
    /** Current expiry status */
    status: ExpiryStatus
    /** Apple HIG color for status */
    color: string
    /** Localized label */
    label: string
    /** Expiry date */
    expiry: Date
}

// ═══════════════════════════════════════════════════════════════════
// INVENTORY ITEM TYPE (for components that don't import full types)
// ═══════════════════════════════════════════════════════════════════

/**
 * Minimal interface for stock calculations.
 * Allows the service to work with any object that has these properties.
 */
export interface StockItem {
    packageQuantity?: number
    packageCount?: number
    pricePerUnit?: number
    minStock?: number
    maxStock?: number
    criticalStock?: number
    expiryDate?: string | null
}

// ═══════════════════════════════════════════════════════════════════
// STOCK CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate current stock quantity.
 * Formula: packageQuantity × packageCount
 * 
 * @param item - The inventory item
 * @returns Total quantity in stock
 * 
 * @example
 * const stock = getCurrentStock({ packageQuantity: 25, packageCount: 4 })
 * // Returns: 100
 */
export function getCurrentStock(item: StockItem): number {
    return (item.packageQuantity || 0) * (item.packageCount || 1)
}

/**
 * Alias for getCurrentStock for semantic clarity.
 */
export const getTotalQuantity = getCurrentStock
export const getStockLevel = getCurrentStock

/**
 * Calculate total monetary value of stock.
 * Formula: currentStock × pricePerUnit
 * 
 * @param item - The inventory item
 * @returns Total value in currency
 */
export function getStockValue(item: StockItem): number {
    return getCurrentStock(item) * (item.pricePerUnit || 0)
}

/**
 * Determine stock health status using 5-tier system.
 * 
 * @param item - The inventory item
 * @returns Stock status indicator
 * 
 * @description
 * The 5-tier system provides actionable insights:
 * 1. **noLimit**: No minimum stock configured - needs setup
 * 2. **critical**: Below 25% of minimum - production may stop today
 * 3. **warning**: Below minimum - time to order from supplier
 * 4. **ok**: Within healthy range
 * 5. **excess**: Above maximum - avoid waste, don't buy more
 */
export function getStockStatus(item: StockItem): StockStatus {
    const currentStock = getCurrentStock(item)
    const minStock = Number(item.minStock) || 0
    const maxStockRaw = Number(item.maxStock) || 0
    const criticalStockRaw = Number(item.criticalStock) || 0

    // Smart defaults: If user doesn't set thresholds, calculate automatically
    const criticalStock = criticalStockRaw > 0
        ? criticalStockRaw
        : (minStock > 0 ? minStock * 0.25 : 0)
    const maxStock = maxStockRaw > 0
        ? maxStockRaw
        : (minStock > 0 ? minStock * 3 : 0)

    // No limit configured
    if (minStock <= 0) return 'noLimit'

    // Critical: below 25% of minimum
    if (currentStock <= criticalStock) return 'critical'

    // Warning: below minimum
    if (currentStock < minStock) return 'warning'

    // Excess: above maximum
    if (maxStock > 0 && currentStock > maxStock) return 'excess'

    // OK: within healthy range
    return 'ok'
}

/**
 * Get configured minimum stock level.
 */
export function getMinStock(item: StockItem): number {
    return Number(item.minStock) || 0
}

/**
 * Check if item needs reordering.
 * 
 * @param item - The inventory item
 * @returns true if stock is at or below minimum
 */
export function needsReorder(item: StockItem): boolean {
    const currentStock = getCurrentStock(item)
    const minStock = getMinStock(item)
    return minStock > 0 && currentStock <= minStock
}

/**
 * Calculate suggested reorder quantity.
 * Aims to bring stock up to maximum (or 2× minimum if max not set).
 * 
 * @param item - The inventory item
 * @returns Suggested quantity to order
 */
export function getReorderQuantity(item: StockItem): number {
    const currentStock = getCurrentStock(item)
    const maxStock = Number(item.maxStock) || 0
    const minStock = getMinStock(item)

    if (maxStock > 0) return Math.max(0, maxStock - currentStock)
    if (minStock > 0) return Math.max(0, minStock * 2 - currentStock)
    return 0
}

// ═══════════════════════════════════════════════════════════════════
// EXPIRY CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get expiry status for an item.
 * 
 * @param item - The inventory item
 * @returns Expiry status indicator
 */
export function getExpiryStatus(item: StockItem): ExpiryStatus {
    if (!item.expiryDate) return 'noExpiry'

    const today = new Date()
    const expiry = new Date(item.expiryDate)
    const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry < 0) return 'expired'
    if (daysUntilExpiry <= 3) return 'critical'
    if (daysUntilExpiry <= 7) return 'warning'
    return 'ok'
}

/**
 * Get days until expiry.
 * 
 * @param item - The inventory item
 * @returns Days until expiry (negative if expired), or null if no expiry set
 */
export function getDaysUntilExpiry(item: StockItem): number | null {
    if (!item.expiryDate) return null

    const today = new Date()
    const expiry = new Date(item.expiryDate)
    return Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
}

/**
 * Get comprehensive expiry data for an item.
 * 
 * @param item - The inventory item
 * @returns Full expiry data object, or null if no expiry date
 */
export function getExpiryData(item: StockItem): ExpiryData | null {
    if (!item.expiryDate) return null

    const today = new Date()
    const expiry = new Date(item.expiryDate)
    const days = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    const maxDays = 90 // 90 days for progress calculation
    const progress = Math.max(0, Math.min(100, (days / maxDays) * 100))

    let status: ExpiryStatus
    let color: string
    let label: string

    if (days < 0) {
        status = 'expired'
        color = '#FF3B30'
        label = 'Vencido'
    } else if (days <= 3) {
        status = 'critical'
        color = '#FF3B30'
        label = 'Crítico'
    } else if (days <= 7) {
        status = 'warning'
        color = '#FF9500'
        label = 'Atenção'
    } else {
        status = 'ok'
        color = '#34C759'
        label = 'OK'
    }

    return { days, progress, status, color, label, expiry }
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE OBJECT (for backwards compatibility)
// ═══════════════════════════════════════════════════════════════════

/**
 * StockService object for backwards compatibility.
 * New code should use individual exported functions instead.
 */
export const StockService = {
    getCurrentStock,
    getTotalQuantity,
    getStockLevel,
    getStockValue,
    getStockStatus,
    getMinStock,
    needsReorder,
    getReorderQuantity,
    getExpiryStatus,
    getDaysUntilExpiry,
    getExpiryData,
}

export default StockService
