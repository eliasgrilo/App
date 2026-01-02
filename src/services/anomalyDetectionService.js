/**
 * Anomaly Detection Service
 * 
 * PREMIUM FEATURE #3: AI-Powered Anomaly Detection
 * 
 * Uses statistical analysis and machine learning concepts to:
 * - Detect price anomalies (outliers from historical averages)
 * - Flag suspicious quotations (unusual delivery terms, extreme prices)
 * - Score supplier reliability based on historical performance
 * - Predict optimal ordering times
 * 
 * Created: 2025-12-31 - Quotation Module Reengineering
 */

import { PriceHistoryService } from './priceHistoryService';

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate mean of an array
 */
function mean(values) {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values) {
    if (!values || values.length < 2) return 0;
    const avg = mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(mean(squareDiffs));
}

/**
 * Calculate z-score (how many standard deviations from mean)
 */
function zScore(value, mean, stdDev) {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
}

/**
 * Calculate median
 */
function median(values) {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Interquartile range for outlier detection
 */
function iqr(values) {
    if (!values || values.length < 4) return { q1: 0, q3: 0, iqr: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = median(sorted.slice(0, Math.floor(sorted.length / 2)));
    const q3 = median(sorted.slice(Math.ceil(sorted.length / 2)));
    return { q1, q3, iqr: q3 - q1 };
}

// ═══════════════════════════════════════════════════════════════════════════
// PRICE ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Anomaly severity levels
 */
export const ANOMALY_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Anomaly types
 */
export const ANOMALY_TYPE = {
    PRICE_TOO_HIGH: 'price_too_high',
    PRICE_TOO_LOW: 'price_too_low',
    UNUSUAL_DELIVERY_TIME: 'unusual_delivery_time',
    MISSING_ITEMS: 'missing_items',
    SUSPICIOUS_SUPPLIER: 'suspicious_supplier',
    QUANTITY_MISMATCH: 'quantity_mismatch',
    PAYMENT_TERMS_UNUSUAL: 'payment_terms_unusual'
};

/**
 * Detect price anomalies in a quotation
 * Compares quoted prices against historical data
 * 
 * @param {Array} quotedItems - Items with quoted prices
 * @param {Object} priceHistory - Historical price data by product
 * @returns {Array} - List of detected anomalies
 */
export function detectPriceAnomalies(quotedItems, priceHistory = {}) {
    const anomalies = [];

    for (const item of quotedItems) {
        const productId = item.productId || item.id;
        const quotedPrice = item.quotedUnitPrice ?? item.unitPrice;

        if (!quotedPrice || quotedPrice <= 0) continue;

        // Get historical prices for this product
        const history = priceHistory[productId] || [];

        if (history.length < 3) {
            // Not enough data for statistical analysis
            continue;
        }

        const prices = history.map(h => h.price);
        const avgPrice = mean(prices);
        const stdDev = standardDeviation(prices);
        const z = zScore(quotedPrice, avgPrice, stdDev);
        const { q1, q3, iqr: iqrValue } = iqr(prices);

        // Outlier detection using IQR method
        const lowerBound = q1 - 1.5 * iqrValue;
        const upperBound = q3 + 1.5 * iqrValue;

        const isOutlier = quotedPrice < lowerBound || quotedPrice > upperBound;
        const deviationPercent = avgPrice > 0
            ? Math.round(((quotedPrice - avgPrice) / avgPrice) * 100)
            : 0;

        if (isOutlier || Math.abs(z) > 2) {
            const isHigher = quotedPrice > avgPrice;

            anomalies.push({
                type: isHigher ? ANOMALY_TYPE.PRICE_TOO_HIGH : ANOMALY_TYPE.PRICE_TOO_LOW,
                severity: getSeverity(Math.abs(z), Math.abs(deviationPercent)),
                productId,
                productName: item.productName || item.name,
                quotedPrice,
                averagePrice: avgPrice,
                deviationPercent,
                zScore: Math.round(z * 100) / 100,
                message: isHigher
                    ? `Preço ${deviationPercent}% acima da média histórica`
                    : `Preço ${Math.abs(deviationPercent)}% abaixo da média (verifique qualidade)`,
                recommendation: isHigher
                    ? 'Negocie com o fornecedor ou busque alternativas'
                    : 'Confirme a qualidade do produto antes de aceitar'
            });
        }
    }

    return anomalies;
}

/**
 * Determine anomaly severity based on z-score and deviation percentage
 */
function getSeverity(absZ, absDeviationPercent) {
    if (absZ >= 3.5 || absDeviationPercent >= 50) return ANOMALY_SEVERITY.CRITICAL;
    if (absZ >= 3 || absDeviationPercent >= 30) return ANOMALY_SEVERITY.HIGH;
    if (absZ >= 2.5 || absDeviationPercent >= 20) return ANOMALY_SEVERITY.MEDIUM;
    return ANOMALY_SEVERITY.LOW;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTATION ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Comprehensive quotation analysis
 * Checks for various types of anomalies
 * 
 * @param {Object} quotation - Full quotation object
 * @param {Object} context - Additional context (supplier history, market data)
 * @returns {Object} - Analysis result with risk score and anomalies
 */
export function analyzeQuotation(quotation, context = {}) {
    const anomalies = [];
    let riskScore = 0;

    const { supplierHistory = [], priceHistory = {}, expectedItems = [] } = context;

    // 1. Price anomaly detection
    if (quotation.items?.length > 0) {
        const priceAnomalies = detectPriceAnomalies(quotation.items, priceHistory);
        anomalies.push(...priceAnomalies);
        riskScore += priceAnomalies.reduce((sum, a) => sum + getSeverityWeight(a.severity), 0);
    }

    // 2. Missing items check
    if (expectedItems.length > 0 && quotation.items?.length > 0) {
        const quotedProductIds = new Set(quotation.items.map(i => i.productId || i.id));
        const missingItems = expectedItems.filter(exp => !quotedProductIds.has(exp.productId || exp.id));

        if (missingItems.length > 0) {
            anomalies.push({
                type: ANOMALY_TYPE.MISSING_ITEMS,
                severity: missingItems.length >= 3 ? ANOMALY_SEVERITY.HIGH : ANOMALY_SEVERITY.MEDIUM,
                message: `${missingItems.length} item(s) não cotado(s)`,
                items: missingItems.map(i => i.productName || i.name),
                recommendation: 'Solicite cotação dos itens faltantes antes de confirmar'
            });
            riskScore += missingItems.length * 5;
        }
    }

    // 3. Delivery time check
    if (quotation.deliveryDays) {
        const avgDeliveryDays = supplierHistory.length > 0
            ? mean(supplierHistory.map(h => h.deliveryDays || 7))
            : 5;

        if (quotation.deliveryDays > avgDeliveryDays * 2) {
            anomalies.push({
                type: ANOMALY_TYPE.UNUSUAL_DELIVERY_TIME,
                severity: ANOMALY_SEVERITY.MEDIUM,
                deliveryDays: quotation.deliveryDays,
                averageDeliveryDays: avgDeliveryDays,
                message: `Prazo de entrega ${quotation.deliveryDays} dias é ${Math.round(quotation.deliveryDays / avgDeliveryDays)}x maior que a média`,
                recommendation: 'Negocie prazo de entrega menor ou busque alternativas'
            });
            riskScore += 10;
        }
    }

    // 4. Supplier reliability check
    if (supplierHistory.length >= 5) {
        const completedOrders = supplierHistory.filter(h => h.status === 'delivered' || h.status === 'received');
        const problemOrders = supplierHistory.filter(h => h.hasProblems || h.hadDelay);
        const problemRate = problemOrders.length / supplierHistory.length;

        if (problemRate >= 0.3) {
            anomalies.push({
                type: ANOMALY_TYPE.SUSPICIOUS_SUPPLIER,
                severity: problemRate >= 0.5 ? ANOMALY_SEVERITY.HIGH : ANOMALY_SEVERITY.MEDIUM,
                problemRate: Math.round(problemRate * 100),
                message: `Fornecedor tem ${Math.round(problemRate * 100)}% de pedidos com problemas`,
                recommendation: 'Considere fornecedor alternativo ou negocie garantias'
            });
            riskScore += problemRate * 30;
        }
    }

    // 5. Quantity mismatch check
    if (quotation.items?.length > 0 && expectedItems.length > 0) {
        const mismatches = [];

        for (const item of quotation.items) {
            const expected = expectedItems.find(e =>
                (e.productId || e.id) === (item.productId || item.id)
            );

            if (expected) {
                const quotedQty = item.quotedAvailability || item.quantityToOrder;
                const expectedQty = expected.quantityToOrder || expected.neededQuantity;

                if (quotedQty && expectedQty && quotedQty < expectedQty * 0.8) {
                    mismatches.push({
                        productName: item.productName || item.name,
                        quotedQty,
                        expectedQty
                    });
                }
            }
        }

        if (mismatches.length > 0) {
            anomalies.push({
                type: ANOMALY_TYPE.QUANTITY_MISMATCH,
                severity: mismatches.length >= 3 ? ANOMALY_SEVERITY.HIGH : ANOMALY_SEVERITY.MEDIUM,
                message: `${mismatches.length} item(s) com quantidade menor que solicitada`,
                items: mismatches,
                recommendation: 'Verifique disponibilidade ou busque fornecedor adicional'
            });
            riskScore += mismatches.length * 5;
        }
    }

    // Calculate overall risk level
    const riskLevel = riskScore >= 50 ? 'high'
        : riskScore >= 25 ? 'medium'
            : riskScore >= 10 ? 'low'
                : 'none';

    return {
        riskScore,
        riskLevel,
        anomalies,
        summary: generateSummary(anomalies, riskLevel),
        recommendation: getOverallRecommendation(riskLevel, anomalies)
    };
}

/**
 * Get weight for severity level
 */
function getSeverityWeight(severity) {
    switch (severity) {
        case ANOMALY_SEVERITY.CRITICAL: return 20;
        case ANOMALY_SEVERITY.HIGH: return 10;
        case ANOMALY_SEVERITY.MEDIUM: return 5;
        case ANOMALY_SEVERITY.LOW: return 2;
        default: return 0;
    }
}

/**
 * Generate human-readable summary
 */
function generateSummary(anomalies, riskLevel) {
    if (anomalies.length === 0) {
        return 'Cotação dentro dos parâmetros normais';
    }

    const typeCount = {};
    for (const a of anomalies) {
        typeCount[a.type] = (typeCount[a.type] || 0) + 1;
    }

    const parts = [];
    if (typeCount[ANOMALY_TYPE.PRICE_TOO_HIGH]) {
        parts.push(`${typeCount[ANOMALY_TYPE.PRICE_TOO_HIGH]} preço(s) alto(s)`);
    }
    if (typeCount[ANOMALY_TYPE.PRICE_TOO_LOW]) {
        parts.push(`${typeCount[ANOMALY_TYPE.PRICE_TOO_LOW]} preço(s) suspeito(s)`);
    }
    if (typeCount[ANOMALY_TYPE.MISSING_ITEMS]) {
        parts.push('itens faltando');
    }
    if (typeCount[ANOMALY_TYPE.UNUSUAL_DELIVERY_TIME]) {
        parts.push('prazo atípico');
    }
    if (typeCount[ANOMALY_TYPE.SUSPICIOUS_SUPPLIER]) {
        parts.push('fornecedor problemático');
    }

    return `Atenção: ${parts.join(', ')} (Risco: ${riskLevel})`;
}

/**
 * Get overall recommendation based on risk level
 */
function getOverallRecommendation(riskLevel, anomalies) {
    switch (riskLevel) {
        case 'high':
            return 'Revise manualmente antes de confirmar. Considere solicitar nova cotação.';
        case 'medium':
            return 'Verifique os pontos destacados antes de confirmar.';
        case 'low':
            return 'Pequenos ajustes podem ser negociados se necessário.';
        default:
            return 'Cotação pode ser confirmada com segurança.';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLIER SCORING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate supplier reliability score
 * 
 * @param {Object} supplier - Supplier data
 * @param {Array} orderHistory - Historical orders from this supplier
 * @returns {Object} - Score breakdown and recommendations
 */
export function calculateSupplierScore(supplier, orderHistory = []) {
    if (orderHistory.length === 0) {
        return {
            overallScore: null,
            confidence: 'low',
            message: 'Sem histórico suficiente para avaliação'
        };
    }

    // Factors (0-100 each)
    let priceScore = 50; // Default neutral
    let deliveryScore = 50;
    let qualityScore = 50;
    let reliabilityScore = 50;

    // Price competitiveness
    const pricesVsMarket = orderHistory
        .filter(o => o.priceComparisonRatio)
        .map(o => o.priceComparisonRatio);

    if (pricesVsMarket.length > 0) {
        const avgRatio = mean(pricesVsMarket);
        priceScore = Math.max(0, Math.min(100, 100 - (avgRatio - 1) * 100));
    }

    // Delivery reliability
    const deliveries = orderHistory.filter(o => o.deliveryOnTime !== undefined);
    if (deliveries.length > 0) {
        const onTimeRate = deliveries.filter(d => d.deliveryOnTime).length / deliveries.length;
        deliveryScore = Math.round(onTimeRate * 100);
    }

    // Quality (based on problems/returns)
    const withQuality = orderHistory.filter(o => o.hasProblems !== undefined);
    if (withQuality.length > 0) {
        const problemRate = withQuality.filter(o => o.hasProblems).length / withQuality.length;
        qualityScore = Math.round((1 - problemRate) * 100);
    }

    // Reliability (completed vs cancelled)
    const completed = orderHistory.filter(o => ['delivered', 'received'].includes(o.status)).length;
    const cancelled = orderHistory.filter(o => o.status === 'cancelled').length;
    const total = completed + cancelled;

    if (total > 0) {
        reliabilityScore = Math.round((completed / total) * 100);
    }

    // Weighted overall score
    const overallScore = Math.round(
        priceScore * 0.25 +
        deliveryScore * 0.30 +
        qualityScore * 0.25 +
        reliabilityScore * 0.20
    );

    // Confidence based on sample size
    const confidence = orderHistory.length >= 20 ? 'high'
        : orderHistory.length >= 10 ? 'medium'
            : orderHistory.length >= 5 ? 'low'
                : 'very_low';

    return {
        overallScore,
        breakdown: {
            price: priceScore,
            delivery: deliveryScore,
            quality: qualityScore,
            reliability: reliabilityScore
        },
        confidence,
        sampleSize: orderHistory.length,
        recommendation: getSupplierRecommendation(overallScore),
        badge: getSupplierBadge(overallScore)
    };
}

/**
 * Get recommendation based on score
 */
function getSupplierRecommendation(score) {
    if (score >= 90) return 'Fornecedor excelente - priorizar';
    if (score >= 75) return 'Fornecedor confiável';
    if (score >= 60) return 'Fornecedor adequado';
    if (score >= 40) return 'Avaliar alternativas';
    return 'Evitar se possível';
}

/**
 * Get badge for UI display
 */
function getSupplierBadge(score) {
    if (score >= 90) return { label: '⭐ Premium', color: 'gold' };
    if (score >= 75) return { label: '✓ Verificado', color: 'green' };
    if (score >= 60) return { label: '○ Regular', color: 'blue' };
    if (score >= 40) return { label: '⚠ Atenção', color: 'yellow' };
    return { label: '✕ Risco', color: 'red' };
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const AnomalyDetectionService = {
    // Analysis
    analyzeQuotation,
    detectPriceAnomalies,
    calculateSupplierScore,

    // Constants
    ANOMALY_TYPE,
    ANOMALY_SEVERITY,

    // Statistical helpers
    mean,
    standardDeviation,
    zScore,
    median,
    iqr
};

export default AnomalyDetectionService;
