/**
 * Price History Service - Versioned Pricing with Trend Analysis
 * Tracks price changes over time for intelligent cost management
 */

import { HapticService } from './hapticService'

// ═══════════════════════════════════════════════════════════════
// PRICE HISTORY MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Add a new price entry to product's price history
 * @param {Object} product - Product with priceHistory field
 * @param {Object} entry - New price entry
 * @returns {Array} Updated price history
 */
export function addPriceEntry(product, entry) {
    const history = parsePriceHistory(product.priceHistory)

    const newEntry = {
        date: entry.date || new Date().toISOString(),
        price: entry.price,
        source: entry.source || 'manual', // 'invoice', 'manual', 'quotation'
        invoiceId: entry.invoiceId || null,
        supplierId: entry.supplierId || product.supplierId || null,
        supplierName: entry.supplierName || product.supplierName || null
    }

    history.push(newEntry)

    // Keep last 50 entries max
    if (history.length > 50) {
        history.shift()
    }

    return history
}

/**
 * Parse price history from JSON string
 * @param {string|Array} priceHistory - Price history
 * @returns {Array}
 */
export function parsePriceHistory(priceHistory) {
    if (Array.isArray(priceHistory)) return priceHistory
    if (!priceHistory) return []

    try {
        return JSON.parse(priceHistory)
    } catch {
        return []
    }
}

/**
 * Get price history for a product within a date range
 * @param {Object} product - Product with priceHistory
 * @param {Object} options - Filter options
 * @returns {Array} Filtered price history
 */
export function getPriceHistory(product, options = {}) {
    const { startDate, endDate, source } = options
    let history = parsePriceHistory(product.priceHistory)

    if (startDate) {
        history = history.filter(h => new Date(h.date) >= new Date(startDate))
    }
    if (endDate) {
        history = history.filter(h => new Date(h.date) <= new Date(endDate))
    }
    if (source) {
        history = history.filter(h => h.source === source)
    }

    return history.sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * Get the last recorded price for a product
 * @param {Object} product - Product
 * @returns {Object|null} Last price entry
 */
export function getLastPrice(product) {
    const history = parsePriceHistory(product.priceHistory)
    if (history.length === 0) return null

    return history.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
}

// ═══════════════════════════════════════════════════════════════
// PRICE ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Detect if a new price is anomalous compared to history
 * @param {Object} product - Product with priceHistory
 * @param {number} newPrice - New price to check
 * @returns {Object} Anomaly detection result
 */
export function detectPriceAnomaly(product, newPrice) {
    const history = parsePriceHistory(product.priceHistory)

    if (history.length < 2) {
        return {
            isAnomaly: false,
            deviation: 0,
            alert: null,
            comparison: null
        }
    }

    // Get last 10 prices for baseline
    const recentPrices = history
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
        .map(h => h.price)

    const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length
    const lastPrice = recentPrices[0]
    const deviation = ((newPrice - avgPrice) / avgPrice) * 100
    const changeFromLast = ((newPrice - lastPrice) / lastPrice) * 100

    // Thresholds for anomaly detection
    const isSpike = deviation > 25 || changeFromLast > 20
    const isDrop = deviation < -25 || changeFromLast < -20
    const isAnomaly = isSpike || isDrop

    // Trigger haptic if price anomaly detected
    if (isSpike) {
        HapticService.trigger('priceSpike')
    } else if (isDrop) {
        HapticService.trigger('success')
    }

    return {
        isAnomaly,
        deviation: Math.round(deviation * 10) / 10,
        changeFromLast: Math.round(changeFromLast * 10) / 10,
        avgPrice: Math.round(avgPrice * 100) / 100,
        lastPrice,
        alert: isSpike
            ? { type: 'spike', message: `Preço ${Math.abs(changeFromLast).toFixed(0)}% acima do último` }
            : isDrop
                ? { type: 'drop', message: `Preço ${Math.abs(changeFromLast).toFixed(0)}% abaixo do último` }
                : null,
        comparison: {
            vs_last: changeFromLast > 0 ? 'higher' : changeFromLast < 0 ? 'lower' : 'same',
            vs_average: deviation > 0 ? 'above' : deviation < 0 ? 'below' : 'average'
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// PRICE TREND ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate price trend over time
 * @param {Object} product - Product with priceHistory
 * @param {number} periodDays - Analysis period in days (default 30)
 * @returns {Object} Trend analysis
 */
export function getPriceTrend(product, periodDays = 30) {
    const history = parsePriceHistory(product.priceHistory)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays)

    const recentHistory = history
        .filter(h => new Date(h.date) >= cutoffDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))

    if (recentHistory.length < 2) {
        return {
            trend: 'insufficient_data',
            change: 0,
            changePercent: 0,
            dataPoints: recentHistory.length
        }
    }

    const firstPrice = recentHistory[0].price
    const lastPrice = recentHistory[recentHistory.length - 1].price
    const change = lastPrice - firstPrice
    const changePercent = (change / firstPrice) * 100

    // Calculate volatility (standard deviation)
    const prices = recentHistory.map(h => h.price)
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length
    const volatility = Math.sqrt(variance) / avg * 100

    let trend = 'stable'
    if (changePercent > 5) trend = 'up'
    else if (changePercent < -5) trend = 'down'

    return {
        trend,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 10) / 10,
        volatility: Math.round(volatility * 10) / 10,
        isVolatile: volatility > 15,
        firstPrice,
        lastPrice,
        avgPrice: Math.round(avg * 100) / 100,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        dataPoints: recentHistory.length,
        period: `${periodDays} dias`
    }
}

// ═══════════════════════════════════════════════════════════════
// SUPPLIER PRICE COMPARISON
// ═══════════════════════════════════════════════════════════════

/**
 * Compare prices across different suppliers
 * @param {Object} product - Product with priceHistory
 * @returns {Object} Supplier comparison
 */
export function compareSupplierPrices(product) {
    const history = parsePriceHistory(product.priceHistory)

    // Group by supplier
    const bySupplier = {}
    history.forEach(entry => {
        const supplierId = entry.supplierId || 'unknown'
        if (!bySupplier[supplierId]) {
            bySupplier[supplierId] = {
                supplierId,
                supplierName: entry.supplierName || 'Desconhecido',
                prices: [],
                entries: 0
            }
        }
        bySupplier[supplierId].prices.push(entry.price)
        bySupplier[supplierId].entries++
    })

    // Calculate stats per supplier
    const suppliers = Object.values(bySupplier).map(supplier => {
        const prices = supplier.prices
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length
        return {
            ...supplier,
            avgPrice: Math.round(avg * 100) / 100,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            lastPrice: prices[prices.length - 1]
        }
    })

    // Sort by average price
    suppliers.sort((a, b) => a.avgPrice - b.avgPrice)

    const cheapest = suppliers[0]
    const mostExpensive = suppliers[suppliers.length - 1]

    return {
        suppliers,
        cheapest,
        mostExpensive,
        savingsPotential: mostExpensive && cheapest
            ? Math.round((mostExpensive.avgPrice - cheapest.avgPrice) * 100) / 100
            : 0
    }
}

// ═══════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════

export const PriceHistoryService = {
    // History management
    addEntry: addPriceEntry,
    getHistory: getPriceHistory,
    getLastPrice,
    parse: parsePriceHistory,

    // Analysis
    detectAnomaly: detectPriceAnomaly,
    getTrend: getPriceTrend,
    compareSuppliers: compareSupplierPrices
}

export default PriceHistoryService
