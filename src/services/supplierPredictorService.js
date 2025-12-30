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

        const price = item.quotedUnitPrice || item.unitPrice
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
            const price = item.quotedUnitPrice || item.unitPrice
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
