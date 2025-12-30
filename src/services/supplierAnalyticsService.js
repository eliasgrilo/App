/**
 * Supplier Analytics Service - Apple-Quality Metrics Dashboard
 * 
 * Calculates comprehensive metrics for supplier performance:
 * - Response time statistics
 * - Conversion rates
 * - Delivery reliability
 * - Price trends and anomalies
 * - Overall reliability score
 */

import { StockService } from './stockService'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const ANALYTICS_STORAGE_KEY = 'padoca_supplier_analytics'
const QUOTATIONS_STORAGE_KEY = 'padoca_sent_emails'

// Weights for reliability score calculation
const SCORE_WEIGHTS = {
    responseTime: 0.25,      // 25% - How fast they respond
    conversionRate: 0.20,   // 20% - How often quotes convert to orders
    deliveryPunctuality: 0.25, // 25% - On-time delivery rate
    priceStability: 0.15,    // 15% - Price consistency
    qualityRating: 0.15      // 15% - User ratings (if available)
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════════════════

function loadQuotations() {
    try {
        const stored = localStorage.getItem(QUOTATIONS_STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

function loadAnalyticsCache() {
    try {
        const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY)
        return stored ? JSON.parse(stored) : {}
    } catch {
        return {}
    }
}

function saveAnalyticsCache(cache) {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(cache))
}

// ═══════════════════════════════════════════════════════════════════════════
// METRIC CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate average response time in hours
 */
function calculateResponseTime(quotations) {
    const withResponse = quotations.filter(q => q.sentAt && q.repliedAt)

    if (withResponse.length === 0) return { avg: null, min: null, max: null, count: 0 }

    const times = withResponse.map(q => {
        const sent = new Date(q.sentAt)
        const replied = new Date(q.repliedAt)
        return (replied - sent) / (1000 * 60 * 60) // hours
    })

    return {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        count: times.length,
        trend: calculateTrend(times) // increasing, decreasing, stable
    }
}

/**
 * Calculate conversion rate (quoted → confirmed)
 */
function calculateConversionRate(quotations) {
    const quoted = quotations.filter(q =>
        ['quoted', 'confirmed', 'delivered'].includes(q.status)
    ).length

    const confirmed = quotations.filter(q =>
        ['confirmed', 'delivered'].includes(q.status)
    ).length

    if (quoted === 0) return { rate: null, quoted, confirmed }

    return {
        rate: (confirmed / quoted) * 100,
        quoted,
        confirmed
    }
}

/**
 * Calculate delivery punctuality
 */
function calculateDeliveryPunctuality(quotations) {
    const delivered = quotations.filter(q =>
        q.status === 'delivered' && q.expectedDelivery && q.deliveredAt
    )

    if (delivered.length === 0) return { rate: null, onTime: 0, late: 0 }

    let onTime = 0
    let late = 0
    let daysLateTotal = 0

    delivered.forEach(q => {
        const expected = new Date(q.expectedDelivery)
        const actual = new Date(q.deliveredAt)
        const diffDays = (actual - expected) / (1000 * 60 * 60 * 24)

        if (diffDays <= 0) {
            onTime++
        } else {
            late++
            daysLateTotal += diffDays
        }
    })

    return {
        rate: (onTime / delivered.length) * 100,
        onTime,
        late,
        avgDaysLate: late > 0 ? daysLateTotal / late : 0
    }
}

/**
 * Calculate price trends for items
 */
function calculatePriceTrends(quotations, itemId = null) {
    const pricesByItem = {}

    quotations.forEach(q => {
        if (!q.items) return

        q.items.forEach(item => {
            if (itemId && item.id !== itemId) return
            if (!item.quotedUnitPrice && !item.unitPrice) return

            const price = item.quotedUnitPrice || item.unitPrice
            const date = q.quotedAt || q.sentAt

            if (!pricesByItem[item.id]) {
                pricesByItem[item.id] = {
                    name: item.name,
                    prices: []
                }
            }

            pricesByItem[item.id].prices.push({
                price,
                date,
                supplierId: q.supplierId
            })
        })
    })

    // Calculate trends for each item
    const trends = {}

    Object.entries(pricesByItem).forEach(([id, data]) => {
        const prices = data.prices
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(p => p.price)

        if (prices.length < 2) {
            trends[id] = { ...data, trend: 'insufficient_data', change: 0 }
            return
        }

        const firstHalf = prices.slice(0, Math.floor(prices.length / 2))
        const secondHalf = prices.slice(Math.floor(prices.length / 2))

        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

        const changePercent = ((avgSecond - avgFirst) / avgFirst) * 100

        trends[id] = {
            ...data,
            avg: prices.reduce((a, b) => a + b, 0) / prices.length,
            min: Math.min(...prices),
            max: Math.max(...prices),
            current: prices[prices.length - 1],
            trend: changePercent > 5 ? 'increasing' : changePercent < -5 ? 'decreasing' : 'stable',
            changePercent
        }
    })

    return trends
}

/**
 * Calculate trend direction from array of values
 */
function calculateTrend(values) {
    if (values.length < 3) return 'insufficient_data'

    const midpoint = Math.floor(values.length / 2)
    const firstHalf = values.slice(0, midpoint)
    const secondHalf = values.slice(midpoint)

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    const change = ((avgSecond - avgFirst) / avgFirst) * 100

    if (change > 10) return 'increasing'
    if (change < -10) return 'decreasing'
    return 'stable'
}

/**
 * Calculate overall reliability score (0-100)
 */
function calculateReliabilityScore(metrics) {
    let score = 50 // Base score
    let weightSum = 0

    // Response time score (lower is better)
    if (metrics.responseTime.avg !== null) {
        const rtScore = metrics.responseTime.avg <= 4 ? 100 :
            metrics.responseTime.avg <= 12 ? 80 :
                metrics.responseTime.avg <= 24 ? 60 :
                    metrics.responseTime.avg <= 48 ? 40 : 20
        score += rtScore * SCORE_WEIGHTS.responseTime
        weightSum += SCORE_WEIGHTS.responseTime
    }

    // Conversion rate score
    if (metrics.conversionRate.rate !== null) {
        score += metrics.conversionRate.rate * SCORE_WEIGHTS.conversionRate
        weightSum += SCORE_WEIGHTS.conversionRate
    }

    // Delivery punctuality score
    if (metrics.deliveryPunctuality.rate !== null) {
        score += metrics.deliveryPunctuality.rate * SCORE_WEIGHTS.deliveryPunctuality
        weightSum += SCORE_WEIGHTS.deliveryPunctuality
    }

    // Price stability score (less volatility is better)
    if (metrics.priceStability !== null) {
        score += metrics.priceStability * SCORE_WEIGHTS.priceStability
        weightSum += SCORE_WEIGHTS.priceStability
    }

    // Normalize by actual weights used
    if (weightSum > 0) {
        score = (score / weightSum) * (weightSum / 1) // Adjust for missing metrics
    }

    return Math.min(100, Math.max(0, Math.round(score)))
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export const SupplierAnalyticsService = {
    /**
     * Get complete analytics for a supplier
     */
    getSupplierAnalytics(supplierId, suppliers = []) {
        const quotations = loadQuotations()
        const supplierQuotations = quotations.filter(q => q.supplierId === supplierId)
        const supplier = suppliers.find(s => s.id === supplierId)

        if (supplierQuotations.length === 0) {
            return {
                supplierId,
                supplierName: supplier?.name || 'Unknown',
                hasData: false,
                message: 'Sem histórico de cotações'
            }
        }

        const responseTime = calculateResponseTime(supplierQuotations)
        const conversionRate = calculateConversionRate(supplierQuotations)
        const deliveryPunctuality = calculateDeliveryPunctuality(supplierQuotations)
        const priceTrends = calculatePriceTrends(supplierQuotations)

        // Calculate price stability (100 - avg volatility)
        const volatilities = Object.values(priceTrends)
            .filter(t => t.changePercent !== undefined)
            .map(t => Math.abs(t.changePercent))
        const avgVolatility = volatilities.length > 0
            ? volatilities.reduce((a, b) => a + b, 0) / volatilities.length
            : 0
        const priceStability = Math.max(0, 100 - avgVolatility * 2)

        const metrics = {
            responseTime,
            conversionRate,
            deliveryPunctuality,
            priceStability
        }

        const reliabilityScore = calculateReliabilityScore(metrics)

        return {
            supplierId,
            supplierName: supplier?.name || 'Unknown',
            supplierEmail: supplier?.email,
            hasData: true,
            totalQuotations: supplierQuotations.length,
            ...metrics,
            priceTrends,
            reliabilityScore,
            reliabilityGrade: getGrade(reliabilityScore),
            lastActivity: supplierQuotations
                .map(q => new Date(q.updatedAt || q.sentAt))
                .sort((a, b) => b - a)[0]?.toISOString()
        }
    },

    /**
     * Get analytics for all suppliers
     */
    getAllSuppliersAnalytics(suppliers = []) {
        return suppliers.map(supplier =>
            this.getSupplierAnalytics(supplier.id, suppliers)
        ).filter(a => a.hasData)
            .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
    },

    /**
     * Get ranking of suppliers for a specific item
     */
    getSupplierRankingForItem(itemId, suppliers = []) {
        const quotations = loadQuotations()
        const itemQuotations = quotations.filter(q =>
            q.items?.some(i => i.id === itemId)
        )

        const supplierData = {}

        itemQuotations.forEach(q => {
            const item = q.items.find(i => i.id === itemId)
            if (!item) return

            const price = item.quotedUnitPrice || item.unitPrice
            if (!price) return

            if (!supplierData[q.supplierId]) {
                supplierData[q.supplierId] = {
                    supplierId: q.supplierId,
                    supplierName: q.supplierName,
                    prices: [],
                    quotations: 0,
                    deliveries: 0
                }
            }

            supplierData[q.supplierId].prices.push(price)
            supplierData[q.supplierId].quotations++
            if (q.status === 'delivered') {
                supplierData[q.supplierId].deliveries++
            }
        })

        return Object.values(supplierData)
            .map(data => ({
                ...data,
                avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
                minPrice: Math.min(...data.prices),
                maxPrice: Math.max(...data.prices),
                recentPrice: data.prices[data.prices.length - 1]
            }))
            .sort((a, b) => a.avgPrice - b.avgPrice) // Best price first
    },

    /**
     * Get overall system statistics
     */
    getSystemStats() {
        const quotations = loadQuotations()

        const byStatus = {}
        quotations.forEach(q => {
            byStatus[q.status] = (byStatus[q.status] || 0) + 1
        })

        const totalValue = quotations
            .filter(q => ['confirmed', 'delivered'].includes(q.status))
            .reduce((sum, q) => sum + (q.quotedTotal || q.quotedValue || 0), 0)

        const avgOrderValue = quotations.filter(q => q.quotedTotal || q.quotedValue).length > 0
            ? totalValue / quotations.filter(q => ['confirmed', 'delivered'].includes(q.status)).length
            : 0

        const thisMonth = quotations.filter(q => {
            const date = new Date(q.sentAt)
            const now = new Date()
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        })

        return {
            totalQuotations: quotations.length,
            byStatus,
            totalValue,
            avgOrderValue,
            thisMonth: {
                count: thisMonth.length,
                value: thisMonth.reduce((sum, q) => sum + (q.quotedTotal || q.quotedValue || 0), 0)
            },
            conversionRate: calculateConversionRate(quotations),
            avgResponseTime: calculateResponseTime(quotations)
        }
    },

    /**
     * Get time-series data for charts
     */
    getTimeSeriesData(days = 30) {
        const quotations = loadQuotations()
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)

        const dataByDate = {}

        quotations.forEach(q => {
            const date = new Date(q.sentAt)
            if (date < cutoffDate) return

            const dateKey = date.toISOString().split('T')[0]

            if (!dataByDate[dateKey]) {
                dataByDate[dateKey] = {
                    date: dateKey,
                    sent: 0,
                    quoted: 0,
                    confirmed: 0,
                    delivered: 0,
                    value: 0
                }
            }

            dataByDate[dateKey].sent++
            if (['quoted', 'confirmed', 'delivered'].includes(q.status)) {
                dataByDate[dateKey].quoted++
            }
            if (['confirmed', 'delivered'].includes(q.status)) {
                dataByDate[dateKey].confirmed++
                dataByDate[dateKey].value += q.quotedTotal || q.quotedValue || 0
            }
            if (q.status === 'delivered') {
                dataByDate[dateKey].delivered++
            }
        })

        // Fill missing dates
        const result = []
        for (let d = new Date(cutoffDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0]
            result.push(dataByDate[dateKey] || {
                date: dateKey,
                sent: 0,
                quoted: 0,
                confirmed: 0,
                delivered: 0,
                value: 0
            })
        }

        return result
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getGrade(score) {
    if (score >= 90) return { letter: 'A+', label: 'Excelente', color: 'emerald' }
    if (score >= 80) return { letter: 'A', label: 'Muito Bom', color: 'emerald' }
    if (score >= 70) return { letter: 'B', label: 'Bom', color: 'blue' }
    if (score >= 60) return { letter: 'C', label: 'Regular', color: 'amber' }
    if (score >= 50) return { letter: 'D', label: 'Abaixo da Média', color: 'orange' }
    return { letter: 'F', label: 'Crítico', color: 'rose' }
}

export default SupplierAnalyticsService
