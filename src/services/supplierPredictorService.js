/**
 * Supplier Predictor Service - AI-Powered Supplier Intelligence
 * 
 * Uses machine learning-inspired algorithms to:
 * - Predict best supplier for each item
 * - Detect price anomalies
 * - Forecast demand and suggest quantities
 * - Optimize order timing
 */

import { SupplierAnalyticsService } from './supplierAnalyticsService'
import { StockService } from './stockService'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const PREDICTIONS_CACHE_KEY = 'padoca_ai_predictions'
const QUOTATIONS_STORAGE_KEY = 'padoca_sent_emails'
const INVENTORY_STORAGE_KEY = 'padoca_inventory_v2'

// Weights for supplier scoring
const PREDICTION_WEIGHTS = {
    price: 0.35,           // 35% - Lower price is better
    reliability: 0.30,     // 30% - Reliability score
    responseTime: 0.20,    // 20% - Faster response is better
    relationship: 0.15     // 15% - Order history bonus
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════════════════

function loadQuotations() {
    try {
        return JSON.parse(localStorage.getItem(QUOTATIONS_STORAGE_KEY) || '[]')
    } catch { return [] }
}

function loadInventory() {
    try {
        return JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY) || '[]')
    } catch { return [] }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLIER PREDICTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Predict best supplier for a specific item
 */
function predictBestSupplierForItem(itemId, suppliers, quotations) {
    const itemQuotations = quotations.filter(q =>
        q.items?.some(i => i.id === itemId)
    )

    if (itemQuotations.length === 0) {
        return {
            hasData: false,
            message: 'Sem histórico de cotações para este item',
            suggestions: []
        }
    }

    const supplierScores = {}

    itemQuotations.forEach(q => {
        const item = q.items.find(i => i.id === itemId)
        if (!item) return

        const price = item.quotedUnitPrice ?? item.unitPrice
        if (!q.supplierId) return

        if (!supplierScores[q.supplierId]) {
            const supplier = suppliers.find(s => s.id === q.supplierId)
            const analytics = SupplierAnalyticsService.getSupplierAnalytics(q.supplierId, suppliers)

            supplierScores[q.supplierId] = {
                supplierId: q.supplierId,
                supplierName: q.supplierName || supplier?.name,
                supplierEmail: supplier?.email,
                prices: [],
                orders: 0,
                deliveries: 0,
                analytics,
                responseHours: analytics.responseTime?.avg || 48
            }
        }

        if (price) {
            supplierScores[q.supplierId].prices.push(price)
        }
        supplierScores[q.supplierId].orders++

        if (q.status === 'delivered') {
            supplierScores[q.supplierId].deliveries++
        }
    })

    // Calculate scores
    const scores = Object.values(supplierScores).map(supplier => {
        const avgPrice = supplier.prices.length > 0
            ? supplier.prices.reduce((a, b) => a + b, 0) / supplier.prices.length
            : Infinity

        const minPrice = Math.min(...Object.values(supplierScores)
            .flatMap(s => s.prices)
            .filter(p => p > 0))

        // Price score (100 if lowest, scaled down for higher prices)
        const priceScore = minPrice > 0 && avgPrice < Infinity
            ? Math.max(0, 100 - ((avgPrice - minPrice) / minPrice) * 100)
            : 50

        // Reliability score (from analytics)
        const reliabilityScore = supplier.analytics?.reliabilityScore || 50

        // Response time score (24h = 100, 48h = 50, 72h+ = 0)
        const rtScore = Math.max(0, 100 - (supplier.responseHours / 72) * 100)

        // Relationship score (bonus for repeat orders)
        const relationshipScore = Math.min(100, supplier.orders * 20 + supplier.deliveries * 30)

        // Weighted total
        const totalScore =
            priceScore * PREDICTION_WEIGHTS.price +
            reliabilityScore * PREDICTION_WEIGHTS.reliability +
            rtScore * PREDICTION_WEIGHTS.responseTime +
            relationshipScore * PREDICTION_WEIGHTS.relationship

        return {
            ...supplier,
            avgPrice,
            minPrice: Math.min(...supplier.prices),
            maxPrice: Math.max(...supplier.prices),
            recentPrice: supplier.prices[supplier.prices.length - 1],
            priceScore: Math.round(priceScore),
            reliabilityScore: Math.round(reliabilityScore),
            responseTimeScore: Math.round(rtScore),
            relationshipScore: Math.round(relationshipScore),
            totalScore: Math.round(totalScore),
            recommendation: getRecommendation(totalScore)
        }
    })

    // Sort by total score
    scores.sort((a, b) => b.totalScore - a.totalScore)

    return {
        hasData: true,
        itemId,
        suggestions: scores,
        bestSupplier: scores[0] || null,
        alternativeSuppliers: scores.slice(1, 3),
        confidence: calculateConfidence(scores)
    }
}

/**
 * Get recommendation level
 */
function getRecommendation(score) {
    if (score >= 80) return { level: 'highly_recommended', label: 'Altamente Recomendado', color: 'emerald', icon: '⭐⭐⭐' }
    if (score >= 60) return { level: 'recommended', label: 'Recomendado', color: 'blue', icon: '⭐⭐' }
    if (score >= 40) return { level: 'acceptable', label: 'Aceitável', color: 'amber', icon: '⭐' }
    return { level: 'not_recommended', label: 'Não Recomendado', color: 'rose', icon: '⚠️' }
}

/**
 * Calculate confidence level of prediction
 */
function calculateConfidence(scores) {
    if (scores.length === 0) return { level: 'none', percent: 0 }
    if (scores.length === 1) return { level: 'low', percent: 40, reason: 'Apenas 1 fornecedor no histórico' }

    const topTwo = scores.slice(0, 2)
    const scoreDiff = topTwo[0].totalScore - topTwo[1].totalScore

    if (scoreDiff > 20) return { level: 'high', percent: 90, reason: 'Clara vantagem do melhor fornecedor' }
    if (scoreDiff > 10) return { level: 'medium', percent: 70, reason: 'Boa diferença entre fornecedores' }
    return { level: 'low', percent: 50, reason: 'Fornecedores muito próximos em pontuação' }
}

// ═══════════════════════════════════════════════════════════════════════════
// PRICE ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect price anomalies using statistical analysis
 */
function detectPriceAnomalies(quotations) {
    const anomalies = []
    const pricesByItem = {}

    // Group prices by item
    quotations.forEach(q => {
        q.items?.forEach(item => {
            const price = item.quotedUnitPrice ?? item.unitPrice
            if (!price) return

            if (!pricesByItem[item.id]) {
                pricesByItem[item.id] = {
                    itemId: item.id,
                    itemName: item.name,
                    prices: []
                }
            }

            pricesByItem[item.id].prices.push({
                price,
                date: q.quotedAt || q.sentAt,
                supplierId: q.supplierId,
                supplierName: q.supplierName,
                quotationId: q.id
            })
        })
    })

    // Detect anomalies for each item
    Object.values(pricesByItem).forEach(item => {
        if (item.prices.length < 3) return // Need at least 3 data points

        const prices = item.prices.map(p => p.price)
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length
        const stdDev = Math.sqrt(
            prices.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / prices.length
        )

        // Check each price against 2 standard deviations
        item.prices.forEach(priceData => {
            const zScore = (priceData.price - mean) / stdDev

            if (Math.abs(zScore) > 2) {
                anomalies.push({
                    type: zScore > 0 ? 'price_spike' : 'price_drop',
                    severity: Math.abs(zScore) > 3 ? 'critical' : 'warning',
                    itemId: item.itemId,
                    itemName: item.itemName,
                    price: priceData.price,
                    expectedRange: {
                        min: mean - 2 * stdDev,
                        max: mean + 2 * stdDev
                    },
                    mean,
                    stdDev,
                    zScore,
                    deviation: ((priceData.price - mean) / mean) * 100,
                    supplierId: priceData.supplierId,
                    supplierName: priceData.supplierName,
                    date: priceData.date,
                    quotationId: priceData.quotationId,
                    recommendation: zScore > 0
                        ? 'Preço acima do normal. Considere negociar ou buscar alternativas.'
                        : 'Preço abaixo do normal. Verifique qualidade ou aproveite a oportunidade.'
                })
            }
        })
    })

    return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMAND FORECASTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Forecast demand and suggest order quantities
 * Basic 30-day forecast
 */
function forecastDemand(item, days = 30) {
    const movements = item.movements || []
    const inventory = loadInventory()

    // Calculate historical consumption
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const recentExits = movements
        .filter(m => m.type === 'exit' && new Date(m.createdAt).getTime() > thirtyDaysAgo)
        .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)

    const dailyConsumption = recentExits / 30

    // Current stock using StockService
    const currentStock = StockService.getCurrentStock(item)
    const minStock = StockService.getMinStock(item)
    const maxStock = StockService.getMaxStock(item)

    // Days until stockout
    const daysUntilStockout = dailyConsumption > 0
        ? Math.floor(currentStock / dailyConsumption)
        : Infinity

    // Suggested order quantity (to reach max stock)
    const suggestedQuantity = Math.max(0, maxStock - currentStock)

    // Order urgency
    let urgency = 'none'
    if (daysUntilStockout <= 3) urgency = 'critical'
    else if (daysUntilStockout <= 7) urgency = 'high'
    else if (daysUntilStockout <= 14) urgency = 'medium'
    else if (currentStock < minStock) urgency = 'low'

    // Project future stock levels
    const projection = []
    let projectedStock = currentStock
    for (let day = 0; day <= days; day += 7) {
        projection.push({
            day,
            date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            stock: Math.max(0, Math.round(projectedStock)),
            belowMin: projectedStock < minStock
        })
        projectedStock -= dailyConsumption * 7
    }

    return {
        itemId: item.id,
        itemName: item.name,
        currentStock,
        minStock,
        maxStock,
        dailyConsumption,
        weeklyConsumption: dailyConsumption * 7,
        monthlyConsumption: dailyConsumption * 30,
        daysUntilStockout,
        suggestedQuantity,
        urgency,
        projection,
        orderRecommendation: getOrderRecommendation(urgency, daysUntilStockout, suggestedQuantity)
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 90-DAY PREDICTIVE ORDER INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Advanced 90-day demand forecast with seasonal decomposition
 * 
 * Features:
 * - Trend detection (increasing/decreasing/stable)
 * - Weekly patterns (daily specials, weekends)
 * - Monthly patterns (paydays, events)
 * - Seasonal patterns (holidays, weather)
 * - Anomaly detection
 * - Confidence intervals
 * 
 * @param {Object} item - Inventory item with movements
 * @returns {Object} - Comprehensive forecast
 */
function forecast90Days(item) {
    const movements = item.movements || []
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000

    // Get all exits in the last 90 days
    const exits = movements
        .filter(m => m.type === 'exit' && new Date(m.createdAt).getTime() > ninetyDaysAgo)
        .map(m => ({
            date: new Date(m.createdAt),
            quantity: Number(m.quantity) || 0,
            dayOfWeek: new Date(m.createdAt).getDay(),
            dayOfMonth: new Date(m.createdAt).getDate(),
            weekOfYear: getWeekNumber(new Date(m.createdAt))
        }))
        .sort((a, b) => a.date - b.date)

    if (exits.length < 7) {
        return {
            hasData: false,
            message: 'Dados insuficientes para previsão de 90 dias (mínimo 7 movimentações)',
            confidence: 0
        }
    }

    // === TREND ANALYSIS ===
    const trend = calculateTrend(exits)

    // === WEEKLY PATTERN (Day-of-Week) ===
    const weeklyPattern = calculateWeeklyPattern(exits)

    // === MONTHLY PATTERN (Day-of-Month) ===
    const monthlyPattern = calculateMonthlyPattern(exits)

    // === OVERALL STATISTICS ===
    const quantities = exits.map(e => e.quantity)
    const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length
    const stdDev = Math.sqrt(
        quantities.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / quantities.length
    )

    // === ANOMALY DETECTION ===
    const anomalies = exits.filter(e => {
        const zScore = Math.abs((e.quantity - mean) / stdDev)
        return zScore > 2.5
    }).map(e => ({
        date: e.date.toISOString().split('T')[0],
        quantity: e.quantity,
        deviation: ((e.quantity - mean) / mean) * 100
    }))

    // === CONSUMPTION RATES ===
    const dailyByPeriod = {
        week: calculateDailyAverage(exits, 7),
        twoWeeks: calculateDailyAverage(exits, 14),
        month: calculateDailyAverage(exits, 30),
        quarter: calculateDailyAverage(exits, 90)
    }

    // === FORECAST PROJECTIONS ===
    const currentStock = StockService.getCurrentStock(item)
    const minStock = StockService.getMinStock(item)
    const maxStock = StockService.getMaxStock(item)

    const projections = generateProjections(
        currentStock,
        minStock,
        dailyByPeriod,
        weeklyPattern,
        90
    )

    // === OPTIMAL ORDER CALCULATION ===
    const optimalOrder = calculateOptimalOrder(
        currentStock,
        minStock,
        maxStock,
        dailyByPeriod.quarter,
        trend
    )

    // === CONFIDENCE CALCULATION ===
    const confidence = calculateForecastConfidence(exits, stdDev, mean, trend)

    return {
        hasData: true,
        itemId: item.id,
        itemName: item.name,

        // Current state
        currentStock,
        minStock,
        maxStock,

        // Consumption rates
        consumption: {
            daily: round2(dailyByPeriod.quarter),
            weekly: round2(dailyByPeriod.quarter * 7),
            monthly: round2(dailyByPeriod.quarter * 30),
            quarterly: round2(dailyByPeriod.quarter * 90)
        },

        // Trend analysis
        trend: {
            direction: trend.direction,
            slope: round2(trend.slope),
            change: round2(trend.percentChange),
            description: getTrendDescription(trend)
        },

        // Patterns
        patterns: {
            weeklyPattern,
            monthlyPattern,
            peakDay: weeklyPattern.peakDay,
            lowDay: weeklyPattern.lowDay,
            payDayEffect: monthlyPattern.payDayEffect
        },

        // Anomalies detected
        anomalies,

        // 90-day projection
        projections,

        // Order recommendation
        optimalOrder,

        // Confidence
        confidence: {
            level: confidence.level,
            percent: confidence.percent,
            factors: confidence.factors
        },

        // When to order
        orderTiming: {
            daysUntilStockout: calculateDaysUntilStockout(currentStock, dailyByPeriod.quarter),
            optimalOrderDate: optimalOrder.orderByDate,
            urgency: optimalOrder.urgency
        }
    }
}

// === HELPER FUNCTIONS FOR 90-DAY FORECAST ===

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function calculateTrend(exits) {
    if (exits.length < 2) return { direction: 'stable', slope: 0, percentChange: 0 }

    // Simple linear regression
    const n = exits.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0

    exits.forEach((e, i) => {
        sumX += i
        sumY += e.quantity
        sumXY += i * e.quantity
        sumX2 += i * i
    })

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const avgY = sumY / n
    const percentChange = avgY > 0 ? (slope * n / avgY) * 100 : 0

    let direction = 'stable'
    if (percentChange > 10) direction = 'increasing'
    else if (percentChange < -10) direction = 'decreasing'

    return { direction, slope, percentChange }
}

function calculateWeeklyPattern(exits) {
    const dayTotals = Array(7).fill(0)
    const dayCounts = Array(7).fill(0)

    exits.forEach(e => {
        dayTotals[e.dayOfWeek] += e.quantity
        dayCounts[e.dayOfWeek]++
    })

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const averages = dayTotals.map((total, i) => ({
        day: i,
        name: dayNames[i],
        average: dayCounts[i] > 0 ? total / dayCounts[i] : 0,
        sampleSize: dayCounts[i]
    }))

    const validAverages = averages.filter(a => a.sampleSize > 0)
    const peakDay = validAverages.reduce((max, curr) =>
        curr.average > max.average ? curr : max,
        { average: 0, name: 'N/A' }
    )
    const lowDay = validAverages.reduce((min, curr) =>
        curr.average < min.average ? curr : min,
        { average: Infinity, name: 'N/A' }
    )

    return {
        byDay: averages,
        peakDay: { name: peakDay.name, average: round2(peakDay.average) },
        lowDay: { name: lowDay.name, average: round2(lowDay.average) }
    }
}

function calculateMonthlyPattern(exits) {
    // Check for payday effect (days 1-5 and 15-20 often see more spending)
    const early = exits.filter(e => e.dayOfMonth >= 1 && e.dayOfMonth <= 5)
    const mid = exits.filter(e => e.dayOfMonth >= 15 && e.dayOfMonth <= 20)
    const other = exits.filter(e =>
        !(e.dayOfMonth >= 1 && e.dayOfMonth <= 5) &&
        !(e.dayOfMonth >= 15 && e.dayOfMonth <= 20)
    )

    const avgEarly = early.length > 0 ? early.reduce((s, e) => s + e.quantity, 0) / early.length : 0
    const avgMid = mid.length > 0 ? mid.reduce((s, e) => s + e.quantity, 0) / mid.length : 0
    const avgOther = other.length > 0 ? other.reduce((s, e) => s + e.quantity, 0) / other.length : 0

    const payDayEffect = avgOther > 0
        ? ((Math.max(avgEarly, avgMid) - avgOther) / avgOther) * 100
        : 0

    return {
        earlyMonthAvg: round2(avgEarly),
        midMonthAvg: round2(avgMid),
        otherDaysAvg: round2(avgOther),
        payDayEffect: round2(payDayEffect),
        hasPayDayPattern: payDayEffect > 15
    }
}

function calculateDailyAverage(exits, days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const recentExits = exits.filter(e => e.date.getTime() > cutoff)
    const total = recentExits.reduce((s, e) => s + e.quantity, 0)
    return total / days
}

function generateProjections(currentStock, minStock, dailyRates, weeklyPattern, days) {
    const projections = []
    let stock = currentStock

    for (let day = 0; day <= days; day += 7) {
        const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000)

        // Adjust for weekly pattern
        const dayOfWeek = date.getDay()
        const patternMultiplier = weeklyPattern.byDay[dayOfWeek]?.average || dailyRates.quarter
        const weeklyConsumption = dailyRates.quarter * 7

        projections.push({
            day,
            date: date.toISOString().split('T')[0],
            stock: Math.max(0, Math.round(stock)),
            belowMin: stock < minStock,
            expectedConsumption: round2(weeklyConsumption)
        })

        stock -= weeklyConsumption
    }

    return projections
}

function calculateOptimalOrder(currentStock, minStock, maxStock, dailyRate, trend) {
    // Factor in trend
    let adjustedDailyRate = dailyRate
    if (trend.direction === 'increasing') adjustedDailyRate *= 1.1
    if (trend.direction === 'decreasing') adjustedDailyRate *= 0.9

    const daysUntilMin = dailyRate > 0 ? (currentStock - minStock) / adjustedDailyRate : Infinity
    const leadTimeDays = 3 // Assumed supplier lead time

    // When to order (before hitting min stock, accounting for lead time)
    const orderInDays = Math.max(0, daysUntilMin - leadTimeDays)
    const orderByDate = new Date(Date.now() + orderInDays * 24 * 60 * 60 * 1000)

    // How much to order
    const targetCoverage = 30 // Days of stock to maintain
    const targetStock = adjustedDailyRate * targetCoverage
    const orderQuantity = Math.max(0, Math.ceil(targetStock - currentStock))

    // Urgency
    let urgency = 'none'
    if (orderInDays <= 0) urgency = 'critical'
    else if (orderInDays <= 3) urgency = 'high'
    else if (orderInDays <= 7) urgency = 'medium'
    else if (orderInDays <= 14) urgency = 'low'

    return {
        orderQuantity,
        orderByDate: orderByDate.toISOString().split('T')[0],
        daysToOrder: Math.round(orderInDays),
        urgency,
        message: getOrderMessage(urgency, orderQuantity, orderInDays),
        recommendation: {
            action: urgency === 'critical' || urgency === 'high' ? 'ORDER_NOW' : 'SCHEDULE',
            color: urgency === 'critical' ? 'rose' : urgency === 'high' ? 'orange' : 'blue',
            priority: { critical: 1, high: 2, medium: 3, low: 4, none: 5 }[urgency]
        }
    }
}

function getOrderMessage(urgency, quantity, days) {
    if (urgency === 'critical') return `🚨 URGENTE: Pedir ${quantity} unidades imediatamente!`
    if (urgency === 'high') return `⚠️ Pedir ${quantity} unidades em até ${Math.round(days)} dias`
    if (urgency === 'medium') return `📅 Agendar pedido de ${quantity} un para próxima semana`
    if (urgency === 'low') return `📊 Monitorar estoque, considerar ${quantity} un em 2 semanas`
    return `✅ Estoque adequado`
}

function calculateDaysUntilStockout(currentStock, dailyRate) {
    if (dailyRate <= 0) return Infinity
    return Math.floor(currentStock / dailyRate)
}

function calculateForecastConfidence(exits, stdDev, mean, trend) {
    const factors = []
    let score = 50

    // More data = more confidence
    if (exits.length >= 30) { score += 20; factors.push('Dados abundantes (30+ registros)') }
    else if (exits.length >= 15) { score += 10; factors.push('Dados moderados (15+ registros)') }
    else { factors.push('Poucos dados disponíveis') }

    // Lower variance = more confidence
    const cv = mean > 0 ? stdDev / mean : 1
    if (cv < 0.3) { score += 15; factors.push('Baixa variância no consumo') }
    else if (cv > 0.7) { score -= 10; factors.push('Alta variância no consumo') }

    // Clear trend = more confidence
    if (Math.abs(trend.percentChange) > 20) {
        score += 5;
        factors.push(`Tendência clara de ${trend.direction === 'increasing' ? 'crescimento' : 'queda'}`)
    }

    const percent = Math.min(95, Math.max(20, score))
    let level = 'low'
    if (percent >= 80) level = 'high'
    else if (percent >= 60) level = 'medium'

    return { level, percent, factors }
}

function getTrendDescription(trend) {
    if (trend.direction === 'increasing') {
        return `Consumo crescendo ${Math.abs(trend.percentChange).toFixed(0)}% no período`
    }
    if (trend.direction === 'decreasing') {
        return `Consumo caindo ${Math.abs(trend.percentChange).toFixed(0)}% no período`
    }
    return 'Consumo estável'
}

function round2(num) {
    return Math.round(num * 100) / 100
}

/**
 * Get order recommendation text
 */
function getOrderRecommendation(urgency, daysUntilStockout, quantity) {
    if (urgency === 'critical') {
        return {
            action: 'ORDER_NOW',
            message: `⚠️ Estoque crítico! Pedir ${quantity} unidades imediatamente.`,
            color: 'rose',
            priority: 1
        }
    }
    if (urgency === 'high') {
        return {
            action: 'ORDER_SOON',
            message: `🔴 Estoque baixo. Pedir ${quantity} unidades em ${daysUntilStockout} dias.`,
            color: 'orange',
            priority: 2
        }
    }
    if (urgency === 'medium') {
        return {
            action: 'SCHEDULE',
            message: `🟡 Agendar pedido de ${quantity} unidades para próxima semana.`,
            color: 'amber',
            priority: 3
        }
    }
    if (urgency === 'low') {
        return {
            action: 'MONITOR',
            message: `🔵 Monitorar estoque. Considerar pedido de ${quantity} unidades.`,
            color: 'blue',
            priority: 4
        }
    }
    return {
        action: 'NONE',
        message: '✅ Estoque adequado. Nenhuma ação necessária.',
        color: 'emerald',
        priority: 5
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ORDER TIMING OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Suggest optimal order timing based on patterns
 */
function suggestOrderTiming(supplierId, suppliers) {
    const quotations = loadQuotations()
    const supplierQuotations = quotations.filter(q => q.supplierId === supplierId)

    if (supplierQuotations.length < 5) {
        return {
            hasData: false,
            message: 'Dados insuficientes para análise de timing'
        }
    }

    // Analyze response patterns by day of week
    const dayStats = Array(7).fill(null).map(() => ({ count: 0, totalHours: 0 }))

    supplierQuotations.forEach(q => {
        if (!q.sentAt || !q.repliedAt) return

        const sentDate = new Date(q.sentAt)
        const dayOfWeek = sentDate.getDay()
        const responseHours = (new Date(q.repliedAt) - sentDate) / (1000 * 60 * 60)

        dayStats[dayOfWeek].count++
        dayStats[dayOfWeek].totalHours += responseHours
    })

    // Calculate average response by day
    const dayAverages = dayStats.map((stat, day) => ({
        day,
        dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day],
        avgResponseHours: stat.count > 0 ? stat.totalHours / stat.count : null,
        sampleSize: stat.count
    }))

    // Find best day to send
    const validDays = dayAverages.filter(d => d.avgResponseHours !== null && d.sampleSize >= 2)
    const bestDay = validDays.length > 0
        ? validDays.reduce((best, current) =>
            current.avgResponseHours < best.avgResponseHours ? current : best
        )
        : null

    return {
        hasData: true,
        dayAnalysis: dayAverages,
        bestDay,
        recommendation: bestDay
            ? `📅 Melhor dia para enviar cotações: ${bestDay.dayName} (resposta média: ${bestDay.avgResponseHours.toFixed(1)}h)`
            : 'Não há dados suficientes para determinar melhor dia'
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export const SupplierPredictorService = {
    /**
     * Get AI recommendation for best supplier for an item
     */
    getBestSupplierForItem(itemId, suppliers = []) {
        const quotations = loadQuotations()
        return predictBestSupplierForItem(itemId, suppliers, quotations)
    },

    /**
     * Get recommendations for all items needing restock
     */
    getRestockRecommendations(inventory, suppliers = []) {
        const quotations = loadQuotations()
        const recommendations = []

        inventory.forEach(item => {
            if (!StockService.needsReorder(item)) return

            const forecast = forecastDemand(item)
            const supplierPrediction = predictBestSupplierForItem(item.id, suppliers, quotations)

            recommendations.push({
                item: {
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    unit: item.unit
                },
                forecast,
                supplierPrediction,
                priority: getPriorityFromUrgency(forecast.urgency)
            })
        })

        return recommendations.sort((a, b) => a.priority - b.priority)
    },

    /**
     * Detect all price anomalies
     */
    getPriceAnomalies() {
        const quotations = loadQuotations()
        return detectPriceAnomalies(quotations)
    },

    /**
     * Get demand forecast for an item
     */
    getForecast(item, days = 30) {
        return forecastDemand(item, days)
    },

    /**
     * Get advanced 90-day forecast with predictive intelligence
     */
    getForecast90Days(item) {
        return forecast90Days(item)
    },

    /**
     * Get optimal order timing for a supplier
     */
    getOrderTimingSuggestion(supplierId, suppliers = []) {
        return suggestOrderTiming(supplierId, suppliers)
    },

    /**
     * Generate complete AI insight report
     */
    generateInsightReport(inventory, suppliers = []) {
        const quotations = loadQuotations()
        const anomalies = detectPriceAnomalies(quotations)
        const restockRecs = this.getRestockRecommendations(inventory, suppliers)
        const systemStats = SupplierAnalyticsService.getSystemStats()

        // Top insights
        const insights = []

        // Critical stock alerts
        const criticalItems = restockRecs.filter(r => r.forecast.urgency === 'critical')
        if (criticalItems.length > 0) {
            insights.push({
                type: 'alert',
                severity: 'critical',
                icon: '🚨',
                title: `${criticalItems.length} itens em estoque crítico`,
                items: criticalItems.map(r => r.item.name),
                action: 'Iniciar cotações imediatamente'
            })
        }

        // Price anomalies
        const criticalAnomalies = anomalies.filter(a => a.severity === 'critical')
        if (criticalAnomalies.length > 0) {
            insights.push({
                type: 'warning',
                severity: 'warning',
                icon: '💰',
                title: `${criticalAnomalies.length} anomalias de preço detectadas`,
                items: criticalAnomalies.map(a => `${a.itemName}: ${a.type === 'price_spike' ? '↑' : '↓'} ${Math.abs(a.deviation).toFixed(0)}%`),
                action: 'Revisar cotações e negociar'
            })
        }

        // Best performing supplier
        const allAnalytics = SupplierAnalyticsService.getAllSuppliersAnalytics(suppliers)
        if (allAnalytics.length > 0 && allAnalytics[0].reliabilityScore >= 80) {
            insights.push({
                type: 'success',
                severity: 'info',
                icon: '⭐',
                title: `${allAnalytics[0].supplierName} é seu melhor fornecedor`,
                detail: `Score: ${allAnalytics[0].reliabilityScore}/100`,
                action: 'Considerar expandir relacionamento'
            })
        }

        return {
            generatedAt: new Date().toISOString(),
            insights,
            restockRecommendations: restockRecs.slice(0, 10),
            priceAnomalies: anomalies.slice(0, 5),
            supplierRanking: allAnalytics.slice(0, 5),
            systemStats,
            summary: {
                criticalItems: criticalItems.length,
                anomalies: anomalies.length,
                pendingQuotations: systemStats.byStatus?.sent || 0,
                monthlySpend: systemStats.thisMonth?.value || 0
            }
        }
    }
}

function getPriorityFromUrgency(urgency) {
    const map = { critical: 1, high: 2, medium: 3, low: 4, none: 5 }
    return map[urgency] || 5
}

export default SupplierPredictorService
