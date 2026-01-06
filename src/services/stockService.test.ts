/**
 * ═══════════════════════════════════════════════════════════════════
 * STOCK SERVICE — Unit Tests
 * ═══════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from 'vitest'
import {
    getCurrentStock,
    getTotalQuantity,
    getStockValue,
    getStockStatus,
    getMinStock,
    needsReorder,
    getReorderQuantity,
    getExpiryStatus,
    getDaysUntilExpiry,
    getExpiryData,
    type StockItem,
} from './stockService'

// ═══════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════

const createItem = (overrides: Partial<StockItem> = {}): StockItem => ({
    packageQuantity: 25,
    packageCount: 4,
    pricePerUnit: 10,
    minStock: 50,
    maxStock: 200,
    criticalStock: 10,
    ...overrides,
})

// ═══════════════════════════════════════════════════════════════════
// STOCK CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

describe('getCurrentStock', () => {
    it('calculates stock as packageQuantity × packageCount', () => {
        const item = createItem({ packageQuantity: 25, packageCount: 4 })
        expect(getCurrentStock(item)).toBe(100)
    })

    it('handles missing packageQuantity', () => {
        const item = createItem({ packageQuantity: undefined, packageCount: 4 })
        expect(getCurrentStock(item)).toBe(0)
    })

    it('defaults packageCount to 1', () => {
        const item = createItem({ packageQuantity: 25, packageCount: undefined })
        expect(getCurrentStock(item)).toBe(25)
    })
})

describe('getTotalQuantity', () => {
    it('is an alias for getCurrentStock', () => {
        const item = createItem()
        expect(getTotalQuantity(item)).toBe(getCurrentStock(item))
    })
})

describe('getStockValue', () => {
    it('calculates value as currentStock × pricePerUnit', () => {
        const item = createItem({ packageQuantity: 10, packageCount: 2, pricePerUnit: 5 })
        expect(getStockValue(item)).toBe(100) // 20 × 5
    })

    it('returns 0 when pricePerUnit is missing', () => {
        const item = createItem({ pricePerUnit: undefined })
        expect(getStockValue(item)).toBe(0)
    })
})

// ═══════════════════════════════════════════════════════════════════
// STOCK STATUS
// ═══════════════════════════════════════════════════════════════════

describe('getStockStatus', () => {
    it('returns noLimit when minStock is 0', () => {
        const item = createItem({ minStock: 0 })
        expect(getStockStatus(item)).toBe('noLimit')
    })

    it('returns critical when below critical threshold', () => {
        const item = createItem({ packageQuantity: 2, packageCount: 1, criticalStock: 10 })
        expect(getStockStatus(item)).toBe('critical')
    })

    it('returns warning when below minStock but above critical', () => {
        const item = createItem({ packageQuantity: 10, packageCount: 3, minStock: 50, criticalStock: 10 })
        expect(getStockStatus(item)).toBe('warning')
    })

    it('returns ok when within healthy range', () => {
        const item = createItem({ packageQuantity: 25, packageCount: 4, minStock: 50, maxStock: 200 })
        expect(getStockStatus(item)).toBe('ok')
    })

    it('returns excess when above maxStock', () => {
        const item = createItem({ packageQuantity: 100, packageCount: 3, maxStock: 200 })
        expect(getStockStatus(item)).toBe('excess')
    })
})

describe('needsReorder', () => {
    it('returns true when stock is at or below minimum', () => {
        const item = createItem({ packageQuantity: 10, packageCount: 1, minStock: 50 })
        expect(needsReorder(item)).toBe(true)
    })

    it('returns false when stock is above minimum', () => {
        const item = createItem({ packageQuantity: 25, packageCount: 4, minStock: 50 })
        expect(needsReorder(item)).toBe(false)
    })

    it('returns false when no minStock is set', () => {
        const item = createItem({ minStock: 0 })
        expect(needsReorder(item)).toBe(false)
    })
})

describe('getReorderQuantity', () => {
    it('returns quantity to reach maxStock', () => {
        const item = createItem({ packageQuantity: 25, packageCount: 2, maxStock: 100 })
        expect(getReorderQuantity(item)).toBe(50) // 100 - 50
    })

    it('returns quantity to reach 2× minStock when maxStock not set', () => {
        const item = createItem({ packageQuantity: 10, packageCount: 1, minStock: 50, maxStock: 0 })
        expect(getReorderQuantity(item)).toBe(90) // (50 × 2) - 10
    })
})

// ═══════════════════════════════════════════════════════════════════
// EXPIRY CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

describe('getExpiryStatus', () => {
    it('returns noExpiry when no date set', () => {
        const item = createItem({ expiryDate: null })
        expect(getExpiryStatus(item)).toBe('noExpiry')
    })

    it('returns expired for past dates', () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const item = createItem({ expiryDate: yesterday.toISOString() })
        expect(getExpiryStatus(item)).toBe('expired')
    })

    it('returns critical for 3 days or less', () => {
        const soon = new Date()
        soon.setDate(soon.getDate() + 2)
        const item = createItem({ expiryDate: soon.toISOString() })
        expect(getExpiryStatus(item)).toBe('critical')
    })

    it('returns warning for 4-7 days', () => {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 5)
        const item = createItem({ expiryDate: nextWeek.toISOString() })
        expect(getExpiryStatus(item)).toBe('warning')
    })

    it('returns ok for more than 7 days', () => {
        const future = new Date()
        future.setDate(future.getDate() + 30)
        const item = createItem({ expiryDate: future.toISOString() })
        expect(getExpiryStatus(item)).toBe('ok')
    })
})

describe('getDaysUntilExpiry', () => {
    it('returns null when no expiry date', () => {
        const item = createItem({ expiryDate: null })
        expect(getDaysUntilExpiry(item)).toBeNull()
    })

    it('returns negative for expired items', () => {
        const lastWeek = new Date()
        lastWeek.setDate(lastWeek.getDate() - 7)
        const item = createItem({ expiryDate: lastWeek.toISOString() })
        expect(getDaysUntilExpiry(item)).toBeLessThan(0)
    })

    it('returns positive for future expiry', () => {
        const nextMonth = new Date()
        nextMonth.setDate(nextMonth.getDate() + 30)
        const item = createItem({ expiryDate: nextMonth.toISOString() })
        expect(getDaysUntilExpiry(item)).toBeGreaterThan(0)
    })
})

describe('getExpiryData', () => {
    it('returns null when no expiry date', () => {
        const item = createItem({ expiryDate: null })
        expect(getExpiryData(item)).toBeNull()
    })

    it('returns complete expiry data object', () => {
        const future = new Date()
        future.setDate(future.getDate() + 30)
        const item = createItem({ expiryDate: future.toISOString() })
        const data = getExpiryData(item)

        expect(data).not.toBeNull()
        expect(data?.days).toBeGreaterThan(0)
        expect(data?.progress).toBeGreaterThan(0)
        expect(data?.status).toBe('ok')
        expect(data?.color).toBe('#34C759')
        expect(data?.label).toBe('OK')
    })
})
