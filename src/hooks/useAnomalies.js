import { useMemo } from 'react'

/**
 * useAnomalies - Apple-Quality Anomaly Detection Hook
 * Detects price spikes, stock issues, and inactivity
 */

const ANOMALY_TYPES = {
    PRICE_SPIKE: { type: 'price_spike', severity: 'warning', icon: '📈', color: 'amber' },
    PRICE_DROP: { type: 'price_drop', severity: 'info', icon: '📉', color: 'emerald' },
    PRICE_VOLATILE: { type: 'price_volatile', severity: 'warning', icon: '🔺', color: 'orange' },
    LOW_STOCK: { type: 'low_stock', severity: 'danger', icon: '⚠️', color: 'rose' },
    HIGH_STOCK: { type: 'high_stock', severity: 'warning', icon: '📦', color: 'amber' },
    OUT_OF_STOCK: { type: 'out_of_stock', severity: 'critical', icon: '🚨', color: 'red' },
    INACTIVE: { type: 'inactive', severity: 'info', icon: '💤', color: 'zinc' },
    NO_MOVEMENT: { type: 'no_movement', severity: 'info', icon: '❓', color: 'zinc' }
}

/**
 * Calculate price statistics from history
 */
const calculatePriceStats = (priceHistory) => {
    if (!priceHistory || priceHistory.length < 2) return null

    const prices = priceHistory.map(p => Number(p.price) || 0).filter(p => p > 0)
    if (prices.length < 2) return null

    const sum = prices.reduce((a, b) => a + b, 0)
    const avg = sum / prices.length
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const current = prices[prices.length - 1]
    const previous = prices[prices.length - 2]
    const variance = prices.reduce((acc, p) => acc + Math.pow(p - avg, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)

    return { avg, min, max, current, previous, stdDev, count: prices.length }
}

/**
 * Detect anomalies for a single product
 */
export const detectProductAnomalies = (product, options = {}) => {
    const {
        priceThreshold = 0.2,      // 20% price change threshold
        volatilityThreshold = 0.15, // 15% std dev threshold
        inactivityDays = 60,        // Days without movement
        newProductDays = 30         // Days before flagging new product
    } = options

    const anomalies = []
    const priceStats = calculatePriceStats(product.priceHistory)

    // Price Analysis
    if (priceStats) {
        const { avg, current, previous, stdDev } = priceStats

        // Price spike (>20% above average)
        if (current > avg * (1 + priceThreshold) && avg > 0) {
            const pct = ((current / avg - 1) * 100).toFixed(0)
            anomalies.push({
                ...ANOMALY_TYPES.PRICE_SPIKE,
                message: `Preço ${pct}% acima da média`,
                value: pct,
                priority: Math.min(3, Math.floor(pct / 20))
            })
        }

        // Price drop (>20% below average)
        if (current < avg * (1 - priceThreshold) && avg > 0) {
            const pct = ((1 - current / avg) * 100).toFixed(0)
            anomalies.push({
                ...ANOMALY_TYPES.PRICE_DROP,
                message: `Preço ${pct}% abaixo da média`,
                value: pct,
                priority: 1
            })
        }

        // High volatility
        if (avg > 0 && stdDev / avg > volatilityThreshold) {
            anomalies.push({
                ...ANOMALY_TYPES.PRICE_VOLATILE,
                message: `Preço com alta volatilidade`,
                value: ((stdDev / avg) * 100).toFixed(0),
                priority: 2
            })
        }
    }

    // Stock Analysis
    const { currentStock = 0, minStock = 0, maxStock = 0, unit = 'un' } = product

    if (currentStock === 0) {
        anomalies.push({
            ...ANOMALY_TYPES.OUT_OF_STOCK,
            message: 'Produto sem estoque',
            priority: 4
        })
    } else if (minStock > 0 && currentStock < minStock) {
        anomalies.push({
            ...ANOMALY_TYPES.LOW_STOCK,
            message: `Estoque ${currentStock}/${minStock} ${unit}`,
            value: currentStock,
            priority: 3
        })
    }

    if (maxStock > 0 && currentStock > maxStock) {
        anomalies.push({
            ...ANOMALY_TYPES.HIGH_STOCK,
            message: `Estoque acima do máximo (${maxStock} ${unit})`,
            value: currentStock,
            priority: 2
        })
    }

    // Inactivity Analysis
    const now = Date.now()
    const lastMovement = product.lastMovementDate ? new Date(product.lastMovementDate).getTime() : null
    const createdAt = product.createdAt ? new Date(product.createdAt).getTime() : now

    if (lastMovement) {
        const daysSinceMove = Math.floor((now - lastMovement) / (1000 * 60 * 60 * 24))
        if (daysSinceMove > inactivityDays) {
            anomalies.push({
                ...ANOMALY_TYPES.INACTIVE,
                message: `Sem movimentação há ${daysSinceMove} dias`,
                value: daysSinceMove,
                priority: 1
            })
        }
    } else {
        const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))
        if (daysSinceCreation > newProductDays && (product.totalMovements || 0) === 0) {
            anomalies.push({
                ...ANOMALY_TYPES.NO_MOVEMENT,
                message: 'Produto sem nenhuma movimentação',
                priority: 1
            })
        }
    }

    // Sort by priority (highest first)
    return anomalies.sort((a, b) => (b.priority || 0) - (a.priority || 0))
}

/**
 * Main hook - analyze multiple products for anomalies
 */
export const useAnomalies = (products, options = {}) => {
    const analysis = useMemo(() => {
        if (!products || products.length === 0) {
            return {
                byProduct: {},
                summary: { total: 0, critical: 0, warning: 0, info: 0 },
                topAnomalies: []
            }
        }

        const byProduct = {}
        let total = 0, critical = 0, warning = 0, info = 0
        const allAnomalies = []

        products.forEach(product => {
            const anomalies = detectProductAnomalies(product, options)
            byProduct[product.id] = anomalies

            anomalies.forEach(a => {
                total++
                if (a.severity === 'critical' || a.severity === 'danger') critical++
                else if (a.severity === 'warning') warning++
                else info++

                allAnomalies.push({ ...a, productId: product.id, productName: product.name })
            })
        })

        // Top 5 most critical anomalies
        const topAnomalies = allAnomalies
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))
            .slice(0, 5)

        return {
            byProduct,
            summary: { total, critical, warning, info },
            topAnomalies
        }
    }, [products, options])

    return analysis
}

/**
 * Pulsing Anomaly Badge Component
 */
export const AnomalyBadge = ({ anomalies, maxShow = 3, size = 'md' }) => {
    if (!anomalies || anomalies.length === 0) return null

    const sizeClasses = {
        sm: 'text-sm gap-0.5',
        md: 'text-base gap-1',
        lg: 'text-lg gap-1.5'
    }

    const hasCritical = anomalies.some(a => a.severity === 'critical' || a.severity === 'danger')

    return (
        <div className={`flex items-center ${sizeClasses[size]}`}>
            {anomalies.slice(0, maxShow).map((a, i) => (
                <span
                    key={i}
                    className={`${hasCritical ? 'animate-pulse' : ''} drop-shadow-sm cursor-help`}
                    title={a.message}
                >
                    {a.icon}
                </span>
            ))}
            {anomalies.length > maxShow && (
                <span className="text-xs font-bold text-zinc-400 ml-0.5">
                    +{anomalies.length - maxShow}
                </span>
            )}
        </div>
    )
}

export default useAnomalies
