/**
 * AI Price Negotiation Assistant Service
 * 
 * PREMIUM FEATURE #3: Intelligent Price Negotiation Recommendations
 * Uses historical data + Gemini AI to suggest optimal negotiation strategies.
 * 
 * Features:
 * - Price anomaly detection (above historical average)
 * - Savings potential calculation
 * - AI-generated negotiation email drafts
 * - Supplier performance scoring
 * 
 * Created: 2025-12-31 - Quotation Module Reengineering
 */

import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore';
import { GeminiService } from './geminiService';

// ═══════════════════════════════════════════════════════════════════════════
// PRICE ANALYSIS THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
    PRICE_INCREASE_WARNING: 0.05,   // 5% above average = warning
    PRICE_INCREASE_ALERT: 0.15,     // 15% above average = alert
    MIN_HISTORY_FOR_ANALYSIS: 3,    // Need at least 3 price points
    HISTORY_MONTHS: 6               // Look back 6 months
};

// ═══════════════════════════════════════════════════════════════════════════
// PRICE NEGOTIATOR SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class PriceNegotiatorServiceClass {
    constructor() {
        this.priceHistoryCache = new Map();
        this.cacheTTL = 10 * 60 * 1000; // 10 minutes
        this.cacheTimestamps = new Map();
    }

    /**
     * Analyze quotation for negotiation opportunities
     * @param {Object} quotation - Current quotation with items and prices
     * @param {string} supplierId - Supplier ID for history lookup
     * @returns {Promise<Object>} Analysis result with recommendations
     */
    async analyzeQuotation(quotation, supplierId) {
        console.log(`💰 Analyzing quotation for negotiation opportunities...`);

        if (!quotation.items || quotation.items.length === 0) {
            return { success: false, error: 'No items in quotation' };
        }

        // Get historical price data
        const historicalData = await this.getHistoricalPrices(supplierId, quotation.items);

        // Identify price anomalies
        const anomalies = this.detectPriceAnomalies(quotation.items, historicalData);

        // Calculate savings potential
        const savingsPotential = this.calculateSavingsPotential(quotation.items, historicalData);

        // Generate AI recommendations if significant savings possible
        let aiRecommendations = null;
        if (savingsPotential.totalPotential > 100 || anomalies.length > 0) {
            aiRecommendations = await this.generateAIRecommendations(quotation, anomalies, historicalData);
        }

        return {
            success: true,
            quotationId: quotation.id,
            supplierId,
            analysis: {
                anomalies,
                savingsPotential,
                overallScore: this.calculateNegotiationScore(anomalies, savingsPotential),
                recommendations: aiRecommendations
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get historical price data for items from a supplier
     * @param {string} supplierId - Supplier ID
     * @param {Array} items - Items to look up
     * @returns {Promise<Map>} Map of productId -> price history
     */
    async getHistoricalPrices(supplierId, items) {
        const cacheKey = `${supplierId}_${items.map(i => i.productId || i.id).join('_')}`;

        // Check cache
        const cachedData = this.priceHistoryCache.get(cacheKey);
        const cacheTime = this.cacheTimestamps.get(cacheKey);
        if (cachedData && cacheTime && Date.now() - cacheTime < this.cacheTTL) {
            console.log('📊 Using cached price history');
            return cachedData;
        }

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - THRESHOLDS.HISTORY_MONTHS);

        const priceHistory = new Map();

        try {
            // Query completed quotations from this supplier
            const quotationsRef = collection(db, 'quotations');
            const q = query(
                quotationsRef,
                where('supplierId', '==', supplierId),
                where('status', 'in', ['ordered', 'received', 'delivered', 'confirmed']),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            const snapshot = await getDocs(q);

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);

                if (createdAt >= sixMonthsAgo && data.items) {
                    data.items.forEach(item => {
                        const productId = item.productId || item.id;
                        const price = item.quotedUnitPrice ?? item.unitPrice;

                        if (productId && price && price > 0) {
                            if (!priceHistory.has(productId)) {
                                priceHistory.set(productId, []);
                            }
                            priceHistory.get(productId).push({
                                price,
                                date: createdAt,
                                quotationId: doc.id
                            });
                        }
                    });
                }
            });

            // Also check orders collection
            const ordersRef = collection(db, 'orders');
            const ordersQ = query(
                ordersRef,
                where('supplierId', '==', supplierId),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            const ordersSnapshot = await getDocs(ordersQ);

            ordersSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);

                if (createdAt >= sixMonthsAgo && data.items) {
                    data.items.forEach(item => {
                        const productId = item.productId || item.id;
                        const price = item.quotedUnitPrice ?? item.unitPrice;

                        if (productId && price && price > 0) {
                            if (!priceHistory.has(productId)) {
                                priceHistory.set(productId, []);
                            }
                            priceHistory.get(productId).push({
                                price,
                                date: createdAt,
                                orderId: doc.id
                            });
                        }
                    });
                }
            });

            // Cache results
            this.priceHistoryCache.set(cacheKey, priceHistory);
            this.cacheTimestamps.set(cacheKey, Date.now());

            console.log(`📊 Loaded price history for ${priceHistory.size} products`);
            return priceHistory;

        } catch (error) {
            console.error('❌ Error loading price history:', error);
            return new Map();
        }
    }

    /**
     * Detect items with prices significantly above historical average
     * @param {Array} items - Current quotation items
     * @param {Map} historicalData - Historical price data
     * @returns {Array} List of anomalies
     */
    detectPriceAnomalies(items, historicalData) {
        const anomalies = [];

        items.forEach(item => {
            const productId = item.productId || item.id;
            const currentPrice = item.quotedUnitPrice ?? item.unitPrice;

            if (!currentPrice || !historicalData.has(productId)) return;

            const pricePoints = historicalData.get(productId);
            if (pricePoints.length < THRESHOLDS.MIN_HISTORY_FOR_ANALYSIS) return;

            // Calculate average and std deviation
            const prices = pricePoints.map(p => p.price);
            const average = prices.reduce((a, b) => a + b, 0) / prices.length;
            const variance = prices.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / prices.length;
            const stdDev = Math.sqrt(variance);

            const deviation = (currentPrice - average) / average;
            const zScore = stdDev > 0 ? (currentPrice - average) / stdDev : 0;

            // Detect anomaly
            if (deviation > THRESHOLDS.PRICE_INCREASE_WARNING) {
                anomalies.push({
                    productId,
                    productName: item.productName || item.name,
                    currentPrice,
                    historicalAverage: Math.round(average * 100) / 100,
                    deviation: Math.round(deviation * 1000) / 10, // Percentage with 1 decimal
                    zScore: Math.round(zScore * 100) / 100,
                    severity: deviation > THRESHOLDS.PRICE_INCREASE_ALERT ? 'high' : 'medium',
                    potentialSavings: (currentPrice - average) * (item.quantityToOrder || item.quantity || 1),
                    lastLowestPrice: Math.min(...prices),
                    lastHighestPrice: Math.max(...prices),
                    dataPoints: pricePoints.length
                });
            }
        });

        return anomalies.sort((a, b) => b.potentialSavings - a.potentialSavings);
    }

    /**
     * Calculate total savings potential
     * @param {Array} items - Current quotation items
     * @param {Map} historicalData - Historical price data
     * @returns {Object} Savings breakdown
     */
    calculateSavingsPotential(items, historicalData) {
        let totalCurrent = 0;
        let totalHistoricalLow = 0;
        let totalHistoricalAvg = 0;
        let itemsAnalyzed = 0;

        items.forEach(item => {
            const productId = item.productId || item.id;
            const currentPrice = item.quotedUnitPrice ?? item.unitPrice ?? 0;
            const quantity = item.quantityToOrder || item.quantity || 1;

            totalCurrent += currentPrice * quantity;

            if (historicalData.has(productId)) {
                const pricePoints = historicalData.get(productId);
                if (pricePoints.length >= THRESHOLDS.MIN_HISTORY_FOR_ANALYSIS) {
                    const prices = pricePoints.map(p => p.price);
                    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                    const low = Math.min(...prices);

                    totalHistoricalLow += low * quantity;
                    totalHistoricalAvg += avg * quantity;
                    itemsAnalyzed++;
                }
            }
        });

        return {
            totalCurrent: Math.round(totalCurrent * 100) / 100,
            totalHistoricalAvg: Math.round(totalHistoricalAvg * 100) / 100,
            totalHistoricalLow: Math.round(totalHistoricalLow * 100) / 100,
            potentialFromAverage: Math.max(0, Math.round((totalCurrent - totalHistoricalAvg) * 100) / 100),
            potentialFromBest: Math.max(0, Math.round((totalCurrent - totalHistoricalLow) * 100) / 100),
            totalPotential: Math.max(0, Math.round((totalCurrent - totalHistoricalAvg) * 100) / 100),
            itemsAnalyzed,
            totalItems: items.length,
            percentageAboveAverage: totalHistoricalAvg > 0
                ? Math.round(((totalCurrent - totalHistoricalAvg) / totalHistoricalAvg) * 1000) / 10
                : 0
        };
    }

    /**
     * Calculate negotiation opportunity score (0-100)
     */
    calculateNegotiationScore(anomalies, savingsPotential) {
        let score = 0;

        // Base score from savings percentage
        score += Math.min(50, savingsPotential.percentageAboveAverage * 5);

        // Add points for each anomaly
        anomalies.forEach(a => {
            if (a.severity === 'high') score += 15;
            else if (a.severity === 'medium') score += 8;
        });

        // Add points if significant absolute savings
        if (savingsPotential.totalPotential > 500) score += 15;
        else if (savingsPotential.totalPotential > 200) score += 10;
        else if (savingsPotential.totalPotential > 50) score += 5;

        return Math.min(100, Math.round(score));
    }

    /**
     * Generate AI-powered negotiation recommendations
     * @param {Object} quotation - Current quotation
     * @param {Array} anomalies - Detected price anomalies
     * @param {Map} historicalData - Historical price data
     * @returns {Promise<Object>} AI recommendations
     */
    async generateAIRecommendations(quotation, anomalies, historicalData) {
        if (!GeminiService.isReady()) {
            console.warn('⚠️ Gemini not ready for AI recommendations');
            return this.generateFallbackRecommendations(anomalies);
        }

        const prompt = `
Você é um especialista em negociação de compras para uma padaria artesanal.

COTAÇÃO ATUAL:
- Fornecedor: ${quotation.supplierName}
- Total Cotado: R$ ${quotation.quotedTotal || 0}
- Itens: ${quotation.items?.map(i => `${i.productName || i.name}: R$ ${i.quotedUnitPrice ?? i.unitPrice ?? 'N/A'}`).join(', ')}

ANOMALIAS DE PREÇO DETECTADAS:
${anomalies.length > 0 ? anomalies.map(a =>
            `- ${a.productName}: R$ ${a.currentPrice} (${a.deviation}% acima da média histórica de R$ ${a.historicalAverage})`
        ).join('\n') : 'Nenhuma anomalia significativa detectada.'}

TAREFA:
1. Analise a situação e sugira uma estratégia de negociação
2. Escreva um email profissional e cordial solicitando melhores condições
3. Sugira argumentos específicos baseados nos dados históricos

RESPONDA EM JSON:
{
    "strategy": "Estratégia recomendada em 1-2 frases",
    "arguments": ["argumento 1", "argumento 2", "argumento 3"],
    "targetDiscount": 5,
    "emailSubject": "Assunto do email",
    "emailDraft": "Corpo do email de negociação",
    "confidence": 75,
    "riskLevel": "low|medium|high"
}
`;

        try {
            const response = await GeminiService.analyze(prompt);

            if (response.success && response.data) {
                return {
                    ...response.data,
                    generatedAt: new Date().toISOString(),
                    source: 'gemini'
                };
            }

            return this.generateFallbackRecommendations(anomalies);

        } catch (error) {
            console.error('❌ AI recommendation failed:', error);
            return this.generateFallbackRecommendations(anomalies);
        }
    }

    /**
     * Generate fallback recommendations without AI
     */
    generateFallbackRecommendations(anomalies) {
        const hasHighSeverity = anomalies.some(a => a.severity === 'high');
        const totalPotential = anomalies.reduce((sum, a) => sum + (a.potentialSavings || 0), 0);

        return {
            strategy: hasHighSeverity
                ? 'Solicitar revisão urgente de preços - valores significativamente acima do histórico'
                : 'Negociar desconto progressivo por volume ou fidelidade',
            arguments: [
                'Histórico de compras consistente com sua empresa',
                'Possibilidade de aumentar volume com melhores condições',
                anomalies.length > 0 ? `${anomalies.length} item(s) com preço acima da média histórica` : 'Bom relacionamento comercial'
            ],
            targetDiscount: hasHighSeverity ? 10 : 5,
            emailSubject: 'Solicitação de Revisão de Preços - Cotação Recente',
            emailDraft: `Prezado(a) parceiro(a),

Recebemos sua cotação e agradecemos a atenção.

Gostaríamos de solicitar uma revisão nos valores apresentados, considerando nosso histórico de compras e a possibilidade de aumentarmos o volume de pedidos.

${anomalies.length > 0 ? `Notamos que alguns itens estão com valores acima do praticado anteriormente. Seria possível revisar especialmente: ${anomalies.map(a => a.productName).join(', ')}?` : ''}

Aguardamos seu retorno para fecharmos o pedido.

Atenciosamente,
Equipe Padoca`,
            confidence: 60,
            riskLevel: hasHighSeverity ? 'low' : 'medium',
            generatedAt: new Date().toISOString(),
            source: 'fallback'
        };
    }

    /**
     * Clear price history cache
     */
    clearCache() {
        this.priceHistoryCache.clear();
        this.cacheTimestamps.clear();
        console.log('🗑️ Price history cache cleared');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const PriceNegotiatorService = new PriceNegotiatorServiceClass();
export default PriceNegotiatorService;
