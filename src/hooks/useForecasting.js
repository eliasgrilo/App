import { useMemo } from 'react'
import { StockService } from '../services/stockService'

/**
 * useForecasting - Apple-Quality Time Series Forecasting Hook
 * Predicts future stock levels and suggests restock timing
 * Uses centralized StockService for consistent stock calculations
 */

/**
 * Simple Moving Average calculation
 */
const calculateSMA = (data, period) => {
    if (data.length < period) return null
    const slice = data.slice(-period)
    return slice.reduce((a, b) => a + b, 0) / period
}

/**
 * Exponential Moving Average for trend detection
 */
const calculateEMA = (data, period) => {
    if (data.length < period) return null
    const k = 2 / (period + 1)
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period

    for (let i = period; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k)
    }
    return ema
}

/**
 * Calculate consumption rate from movements
 */
const calculateConsumptionRate = (movements, days = 30) => {
    if (!movements || movements.length === 0) return 0

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const recentExits = movements
        .filter(m => m.type === 'exit' && new Date(m.createdAt).getTime() > cutoff)
        .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)

    return recentExits / days
}

/**
 * Predict days until stock runs out
 */
const predictStockout = (currentStock, consumptionRate) => {
    if (consumptionRate <= 0) return Infinity
    return Math.floor(currentStock / consumptionRate)
}

/**
 * Suggest restock date based on lead time and safety stock
 */
const suggestRestockDate = (currentStock, consumptionRate, minStock, leadTimeDays = 3) => {
    if (consumptionRate <= 0) return null

    const safetyBuffer = minStock || Math.ceil(consumptionRate * 3) // 3 days buffer
    const daysUntilReorder = Math.floor((currentStock - safetyBuffer) / consumptionRate) - leadTimeDays

    if (daysUntilReorder <= 0) {
        return { urgent: true, date: new Date(), daysUntil: 0 }
    }

    const restockDate = new Date()
    restockDate.setDate(restockDate.getDate() + daysUntilReorder)

    return { urgent: false, date: restockDate, daysUntil: daysUntilReorder }
}

/**
 * Calculate suggested order quantity
 */
const calculateOrderQuantity = (consumptionRate, targetDays = 30, currentStock = 0, minStock = 0) => {
    const targetStock = Math.max(consumptionRate * targetDays, minStock * 2)
    const orderQty = Math.ceil(targetStock - currentStock)
    return Math.max(orderQty, 0)
}

/**
 * Main forecasting hook
 */
export const useForecasting = (product, options = {}) => {
    const {
        forecastDays = 30,
        leadTimeDays = 3,
        targetStockDays = 30
    } = options

    const forecast = useMemo(() => {
        if (!product) return null

        const movements = product.movements || []
        // Use centralized StockService for consistent values
        const currentStock = StockService.getCurrentStock(product)
        const minStock = StockService.getMinStock(product)
        const unit = product.unit || 'un'

        // Calculate consumption metrics
        const dailyRate7d = calculateConsumptionRate(movements, 7)
        const dailyRate30d = calculateConsumptionRate(movements, 30)
        const dailyRate = (dailyRate7d + dailyRate30d) / 2 // Weighted average

        // Predict stockout
        const daysUntilStockout = predictStockout(currentStock, dailyRate)
        const stockoutDate = daysUntilStockout < Infinity
            ? new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000)
            : null

        // Restock suggestion
        const restock = suggestRestockDate(currentStock, dailyRate, minStock, leadTimeDays)

        // Order quantity suggestion
        const suggestedOrderQty = calculateOrderQuantity(dailyRate, targetStockDays, currentStock, minStock)

        // Trend analysis (is consumption increasing or decreasing?)
        const trend = dailyRate7d > dailyRate30d * 1.1 ? 'increasing'
            : dailyRate7d < dailyRate30d * 0.9 ? 'decreasing'
                : 'stable'

        // Generate future stock projection
        const projection = []
        let projectedStock = currentStock
        for (let day = 0; day <= forecastDays; day += 7) {
            projection.push({
                day,
                date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
                stock: Math.max(0, Math.round(projectedStock))
            })
            projectedStock -= dailyRate * 7
        }

        return {
            dailyConsumption: dailyRate,
            weeklyConsumption: dailyRate * 7,
            monthlyConsumption: dailyRate * 30,
            daysUntilStockout,
            stockoutDate,
            restock,
            suggestedOrderQty,
            trend,
            projection,
            confidence: movements.length >= 10 ? 'high' : movements.length >= 5 ? 'medium' : 'low',
            unit
        }
    }, [product, forecastDays, leadTimeDays, targetStockDays])

    return forecast
}

/**
 * Batch forecasting for multiple products
 */
export const useBatchForecasting = (products, options = {}) => {
    const forecasts = useMemo(() => {
        if (!products || products.length === 0) return { items: [], urgentRestocks: [], lowStock: [] }

        const items = products.map(product => ({
            product,
            forecast: (() => {
                const movements = product.movements || []
                // Use centralized StockService for consistent values
                const currentStock = StockService.getCurrentStock(product)
                const minStock = StockService.getMinStock(product)
                const dailyRate = calculateConsumptionRate(movements, 30)
                const daysUntilStockout = predictStockout(currentStock, dailyRate)
                const restock = suggestRestockDate(currentStock, dailyRate, minStock, options.leadTimeDays || 3)

                return { dailyRate, daysUntilStockout, restock }
            })()
        }))

        // Products needing urgent restock
        const urgentRestocks = items
            .filter(i => i.forecast.restock?.urgent || i.forecast.daysUntilStockout < 7)
            .sort((a, b) => a.forecast.daysUntilStockout - b.forecast.daysUntilStockout)

        // Products with low stock
        const lowStock = items
            .filter(i => i.product.currentStock < i.product.minStock)
            .sort((a, b) => (a.product.currentStock / a.product.minStock) - (b.product.currentStock / b.product.minStock))

        return { items, urgentRestocks, lowStock }
    }, [products, options])

    return forecasts
}

export default useForecasting
