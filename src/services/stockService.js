/**
 * StockService - Single Source of Truth for Stock Calculations
 * 
 * This service centralizes all stock-related calculations to ensure consistency
 * across the entire application: alerts, dashboards, reports, reordering, etc.
 * 
 * ALL stock calculations should go through this service.
 * 
 * NEW: Event system for automatic quotation triggers
 */

// ═══════════════════════════════════════════════════════════════
// EVENT SYSTEM - For Stock → Quotation Automation
// ═══════════════════════════════════════════════════════════════

const stockEventListeners = new Set()

/**
 * Subscribe to stock events
 * @param {Function} callback - (eventType, data) => void
 * @returns {Function} Unsubscribe function
 */
export function onStockEvent(callback) {
    stockEventListeners.add(callback)
    return () => stockEventListeners.delete(callback)
}

/**
 * Emit stock event to all listeners
 * @param {string} eventType - Event type (e.g., 'NEEDS_REORDER')
 * @param {Object} data - Event payload
 */
function emitStockEvent(eventType, data) {
    stockEventListeners.forEach(cb => {
        try {
            cb(eventType, data)
        } catch (err) {
            console.error('Stock event listener error:', err)
        }
    })
}
// CORE CALCULATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate total quantity for an item
 * Formula: packageQuantity × packageCount
 * @param {Object} item - Inventory item
 * @returns {number} Total quantity in stock
 */
export function getTotalQuantity(item) {
    if (!item) return 0
    return (Number(item.packageQuantity) || 0) * (Number(item.packageCount) || 1)
}

/**
 * Get minimum stock level for an item
 * @param {Object} item - Inventory item
 * @returns {number} Minimum stock threshold
 */
export function getMinStock(item) {
    if (!item) return 0
    return Number(item.minStock) || 0
}

/**
 * Get maximum stock level for an item
 * Default: 3x minStock if not explicitly set
 * @param {Object} item - Inventory item
 * @returns {number} Maximum stock threshold
 */
export function getMaxStock(item) {
    if (!item) return 0
    const max = Number(item.maxStock) || 0
    if (max > 0) return max
    // Fallback: 3x minimum stock
    const min = getMinStock(item)
    return min > 0 ? min * 3 : 0
}

/**
 * Get current stock - alias for getTotalQuantity for semantic clarity
 * @param {Object} item - Inventory item
 * @returns {number} Current stock level
 */
export function getCurrentStock(item) {
    // Support both inventory items (packageQuantity * packageCount) and products (currentStock)
    if (item?.currentStock !== undefined) {
        return Number(item.currentStock) || 0
    }
    return getTotalQuantity(item)
}

// ═══════════════════════════════════════════════════════════════
// STOCK STATUS
// ═══════════════════════════════════════════════════════════════

/**
 * Stock status levels matching Apple-quality 5-tier system
 */
export const STOCK_STATUS = {
    CRITICAL: 'critical',  // Below minimum
    WARNING: 'warning',    // At or slightly above minimum (within 20%)
    OK: 'ok',              // Normal range
    EXCESS: 'excess',      // Above maximum
    UNKNOWN: 'unknown'     // No thresholds defined
}

/**
 * Get stock status for an item
 * @param {Object} item - Inventory item
 * @returns {string} One of STOCK_STATUS values
 */
export function getStockStatus(item) {
    if (!item) return STOCK_STATUS.UNKNOWN

    const current = getCurrentStock(item)
    const min = getMinStock(item)
    const max = getMaxStock(item)

    // If no thresholds defined, can't determine status
    if (min === 0 && max === 0) return STOCK_STATUS.OK

    // Check levels
    if (min > 0 && current < min) return STOCK_STATUS.CRITICAL
    if (min > 0 && current <= min * 1.2) return STOCK_STATUS.WARNING
    if (max > 0 && current > max) return STOCK_STATUS.EXCESS

    return STOCK_STATUS.OK
}

/**
 * Check if an item needs reordering
 * Triggers when current stock is at or below minimum (safety stock barrier)
 * @param {Object} item - Inventory item
 * @returns {boolean} True if Estoque_Atual <= Estoque_Minimo
 */
export function needsReorder(item) {
    const current = getCurrentStock(item)
    const min = getMinStock(item)
    // Guard: Items without minStock defined should not trigger reorder
    if (min <= 0) return false
    // Trigger when stock is at or below minimum
    return current <= min
}

/**
 * Check if an item is overstocked
 * @param {Object} item - Inventory item
 * @returns {boolean} True if current stock exceeds maximum
 */
export function isOverstocked(item) {
    const current = getCurrentStock(item)
    const max = getMaxStock(item)
    return max > 0 && current > max
}

// ═══════════════════════════════════════════════════════════════
// ORDERING CALCULATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate quantity to order to reach maximum stock
 * @param {Object} item - Inventory item
 * @returns {number} Quantity to order (always >= 0)
 */
export function getQuantityToOrder(item) {
    const current = getCurrentStock(item)
    const max = getMaxStock(item)
    return Math.max(0, max - current)
}

/**
 * Calculate safety stock buffer
 * Default: matches minStock or 3 days of average consumption
 * @param {Object} item - Inventory item
 * @param {number} dailyConsumption - Average daily consumption rate
 * @returns {number} Safety stock buffer
 */
export function getSafetyStock(item, dailyConsumption = 0) {
    const min = getMinStock(item)
    if (min > 0) return min
    // Fallback: 3 days of consumption
    return Math.ceil(dailyConsumption * 3)
}

/**
 * Calculate urgency level based on stock status
 * @param {Object} item - Inventory item
 * @returns {'critical' | 'warning' | 'low'} Urgency level
 */
export function getUrgency(item) {
    const status = getStockStatus(item)
    if (status === STOCK_STATUS.CRITICAL) return 'critical'
    if (status === STOCK_STATUS.WARNING) return 'warning'
    return 'low'
}

// ═══════════════════════════════════════════════════════════════
// FORMATTING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Format stock level with unit
 * @param {Object} item - Inventory item
 * @returns {string} Formatted stock level (e.g., "25 kg")
 */
export function formatStockLevel(item) {
    const current = getCurrentStock(item)
    const unit = item?.unit || 'un'
    return `${current} ${unit}`
}

/**
 * Format stock range (min-max)
 * @param {Object} item - Inventory item
 * @returns {string} Formatted range (e.g., "10-50 kg")
 */
export function formatStockRange(item) {
    const min = getMinStock(item)
    const max = getMaxStock(item)
    const unit = item?.unit || 'un'
    return `${min}-${max} ${unit}`
}

// ═══════════════════════════════════════════════════════════════
// AUTOMATIC QUOTATION TRIGGERS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if item needs reorder and emit event for automation
 * Emits event for any item with a configured supplier that needs reorder
 * @param {Object} item - Inventory item with product data
 * @returns {boolean} True if event was emitted
 */
export function checkAndEmitReorderEvent(item) {
    // Must have supplier configured to trigger quotation
    if (!item?.supplierId) {
        return false
    }

    if (needsReorder(item)) {
        const eventData = {
            productId: item.id,
            productName: item.name,
            category: item.category,
            currentStock: getCurrentStock(item),
            minStock: getMinStock(item),
            maxStock: getMaxStock(item),
            quantityToOrder: getQuantityToOrder(item),
            unit: item.unit || 'un',
            supplierId: item.supplierId,
            supplierName: item.supplierName,
            supplierEmail: item.supplierEmail,
            currentPrice: item.pricePerUnit || item.currentPrice,
            enableAutoQuotation: item.enableAutoQuotation, // Flag for auto-quotation permission
            timestamp: new Date().toISOString()
        }

        emitStockEvent('NEEDS_REORDER', eventData)
        console.log(`📦 Stock event: ${item.name} needs reorder (${eventData.currentStock}/${eventData.minStock})`)
        return true
    }

    return false
}

/**
 * Batch check multiple items for reorder events
 * @param {Array} items - Array of inventory items
 * @returns {Array} Items that triggered events
 */
export function checkBatchReorderEvents(items) {
    if (!Array.isArray(items)) return []
    return items.filter(item => checkAndEmitReorderEvent(item))
}

// ═══════════════════════════════════════════════════════════════
// RESTOCK CALCULATIONS - Centralized
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate restock needs based on consumption predictions
 * Single Source of Truth for restock calculations across the app
 * @param {Array} products - Array of product objects
 * @param {Array} movements - Array of stock movement records
 * @param {number} daysBuffer - Days of stock buffer to maintain (default: 14)
 * @returns {Array} Products needing restock with calculated needs
 */
export function calculateRestockNeeds(products, movements = [], daysBuffer = 14) {
    if (!Array.isArray(products)) return []

    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days back

    return products.map(product => {
        // Calculate daily consumption rate from exit movements
        const productMovements = Array.isArray(movements) ? movements.filter(m =>
            m.productId === product.id &&
            m.type === 'exit' &&
            new Date(m.date || m.createdAt).getTime() >= cutoff
        ) : []

        const totalExits = productMovements.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)
        const dailyRate = totalExits / 30

        // Calculate target stock and needed quantity
        const currentStock = getCurrentStock(product)
        const minStock = getMinStock(product)
        const targetStock = Math.ceil(dailyRate * daysBuffer) + minStock
        const neededQuantity = Math.max(0, targetStock - currentStock)

        // Calculate urgency based on days until stockout
        const daysUntilStockout = dailyRate > 0 ? Math.floor(currentStock / dailyRate) : Infinity
        const urgency = daysUntilStockout <= 3 ? 'critical' : daysUntilStockout <= 7 ? 'warning' : 'normal'

        return {
            ...product,
            dailyRate,
            targetStock,
            currentStock,
            neededQuantity,
            daysUntilStockout,
            estimatedCost: neededQuantity * (product.currentPrice || product.pricePerUnit || 0),
            urgency
        }
    }).filter(p => p.neededQuantity > 0)
}

// ═══════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════

export const StockService = {
    // Core calculations
    getTotalQuantity,
    getMinStock,
    getMaxStock,
    getCurrentStock,

    // Status
    STOCK_STATUS,
    getStockStatus,
    needsReorder,
    isOverstocked,

    // Ordering
    getQuantityToOrder,
    getSafetyStock,
    getUrgency,
    calculateRestockNeeds,

    // Formatting
    formatStockLevel,
    formatStockRange,

    // Event System (Automation)
    onStockEvent,
    checkAndEmitReorderEvent,
    checkBatchReorderEvents
}

export default StockService
