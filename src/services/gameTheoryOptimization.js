/**
 * Game Theory Optimization Service
 * 
 * PREMIUM FEATURE #25: Game Theory Optimization
 * 
 * Nash Equilibrium applied to purchasing.
 * Strategically distributes orders to keep suppliers competing.
 * 
 * @module gameTheoryOptimization
 */

const StrategyType = Object.freeze({
    COMPETITIVE: 'competitive', COOPERATIVE: 'cooperative',
    MIXED: 'mixed', DOMINANT: 'dominant'
});

class Supplier {
    constructor(id, config = {}) {
        this.id = id;
        this.name = config.name;
        this.priceMultiplier = config.priceMultiplier || 1.0;
        this.reliability = config.reliability || 0.9;
        this.marketShare = config.marketShare || 0;
        this.dependencyRisk = 0;
    }
}

class GameTheoryOptimizationService {
    constructor() {
        this.suppliers = new Map();
        this.history = [];
        this.config = {
            maxDependency: 0.5,      // Max 50% from single supplier
            minSuppliers: 2,         // Minimum active suppliers
            competitionWeight: 0.3,  // How much to prioritize competition
            priceWeight: 0.5,        // How much to prioritize price
            reliabilityWeight: 0.2   // How much to prioritize reliability
        };
    }

    registerSupplier(id, config) {
        this.suppliers.set(id, new Supplier(id, config));
    }

    calculateNashEquilibrium(order, supplierBids) {
        if (supplierBids.length < 2) {
            return { optimal: supplierBids[0], reason: 'Single supplier available' };
        }

        // Calculate payoff matrix for each supplier
        const payoffMatrix = this.buildPayoffMatrix(supplierBids);

        // Find Nash equilibrium (simplified - dominant strategy)
        const equilibrium = this.findEquilibrium(payoffMatrix, supplierBids);

        // Calculate optimal distribution
        const distribution = this.calculateOptimalDistribution(order, supplierBids, equilibrium);

        return {
            equilibrium,
            distribution,
            strategy: this.determineStrategy(distribution),
            competitionScore: this.calculateCompetitionScore(distribution),
            recommendations: this.generateRecommendations(distribution, supplierBids)
        };
    }

    buildPayoffMatrix(bids) {
        const matrix = [];

        for (let i = 0; i < bids.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < bids.length; j++) {
                if (i === j) {
                    matrix[i][j] = bids[i].price * bids[i].quantity;
                } else {
                    // Competitive scenario
                    const priceAdvantage = bids[j].price / bids[i].price;
                    const reliabilityAdvantage = bids[i].reliability / bids[j].reliability;
                    matrix[i][j] = priceAdvantage * reliabilityAdvantage;
                }
            }
        }

        return matrix;
    }

    findEquilibrium(matrix, bids) {
        // Find dominant strategies
        const scores = bids.map((bid, i) => {
            const avgPayoff = matrix[i].reduce((sum, p) => sum + p, 0) / matrix[i].length;
            return {
                supplierId: bid.supplierId,
                dominanceScore: avgPayoff,
                price: bid.price,
                reliability: bid.reliability
            };
        });

        scores.sort((a, b) => b.dominanceScore - a.dominanceScore);

        return {
            dominant: scores[0],
            alternatives: scores.slice(1),
            isStable: scores[0].dominanceScore > scores[1]?.dominanceScore * 1.2
        };
    }

    calculateOptimalDistribution(order, bids, equilibrium) {
        const totalQuantity = order.quantity;
        const distribution = [];
        let remaining = totalQuantity;

        // Sort by combined score
        const ranked = bids.map(bid => {
            const supplier = this.suppliers.get(bid.supplierId);
            const score =
                (1 / bid.price) * this.config.priceWeight +
                bid.reliability * this.config.reliabilityWeight +
                (1 - (supplier?.marketShare || 0)) * this.config.competitionWeight;
            return { ...bid, score };
        }).sort((a, b) => b.score - a.score);

        // Distribute to maintain competition
        for (const bid of ranked) {
            const maxAllocation = totalQuantity * this.config.maxDependency;
            const allocation = Math.min(remaining, maxAllocation, bid.maxQuantity || remaining);

            if (allocation > 0) {
                distribution.push({
                    supplierId: bid.supplierId,
                    quantity: allocation,
                    percentage: (allocation / totalQuantity * 100).toFixed(1) + '%',
                    price: bid.price,
                    totalCost: allocation * bid.price
                });
                remaining -= allocation;
            }

            if (remaining <= 0) break;
        }

        // Ensure minimum suppliers
        if (distribution.length < this.config.minSuppliers && ranked.length >= this.config.minSuppliers) {
            this.redistributeForCompetition(distribution, ranked, totalQuantity);
        }

        return distribution;
    }

    redistributeForCompetition(distribution, ranked, total) {
        // Take from largest and give to next best
        if (distribution.length > 0 && ranked.length > distribution.length) {
            const toAdd = ranked.find(r => !distribution.find(d => d.supplierId === r.supplierId));
            if (toAdd) {
                const takeFrom = distribution[0];
                const transfer = takeFrom.quantity * 0.2;
                takeFrom.quantity -= transfer;
                distribution.push({
                    supplierId: toAdd.supplierId,
                    quantity: transfer,
                    percentage: (transfer / total * 100).toFixed(1) + '%',
                    price: toAdd.price,
                    totalCost: transfer * toAdd.price
                });
            }
        }
    }

    determineStrategy(distribution) {
        if (distribution.length === 1) return StrategyType.DOMINANT;

        const maxShare = Math.max(...distribution.map(d => parseFloat(d.percentage)));
        if (maxShare > 60) return StrategyType.COMPETITIVE;
        if (distribution.length >= 3) return StrategyType.MIXED;
        return StrategyType.COOPERATIVE;
    }

    calculateCompetitionScore(distribution) {
        if (distribution.length < 2) return 0;

        const shares = distribution.map(d => parseFloat(d.percentage) / 100);
        const herfindahl = shares.reduce((sum, s) => sum + s * s, 0);

        // Convert HHI to competition score (lower HHI = more competition)
        return Math.round((1 - herfindahl) * 100);
    }

    generateRecommendations(distribution, bids) {
        const recommendations = [];

        // Check for over-dependence
        const maxShare = distribution[0];
        if (parseFloat(maxShare?.percentage) > 50) {
            recommendations.push({
                type: 'warning',
                message: `⚠️ Dependência alta (${maxShare.percentage}) de ${maxShare.supplierId}. Considere diversificar.`
            });
        }

        // Check if cheaper option was passed
        const cheapest = [...bids].sort((a, b) => a.price - b.price)[0];
        if (distribution[0]?.supplierId !== cheapest.supplierId) {
            const saving = (distribution[0].price - cheapest.price) * distribution[0].quantity;
            recommendations.push({
                type: 'info',
                message: `💡 Distribuição estratégica custou R$${saving.toFixed(2)} extra para manter competição.`
            });
        }

        // Suggest new supplier
        if (distribution.length < 3 && bids.length > distribution.length) {
            recommendations.push({
                type: 'opportunity',
                message: '🎯 Considere adicionar 3º fornecedor para maximizar poder de barganha.'
            });
        }

        return recommendations;
    }

    simulateMarketScenarios(order, bids, scenarios = 3) {
        const results = [];

        for (let i = 0; i < scenarios; i++) {
            const modifiedBids = bids.map(b => ({
                ...b,
                price: b.price * (0.9 + Math.random() * 0.2),
                reliability: Math.min(1, b.reliability * (0.95 + Math.random() * 0.1))
            }));

            results.push({
                scenario: i + 1,
                result: this.calculateNashEquilibrium(order, modifiedBids)
            });
        }

        return {
            scenarios: results,
            stableSupplier: this.findMostStableSupplier(results),
            recommendation: 'Fornecedor que aparece em mais cenários é mais confiável para longo prazo'
        };
    }

    findMostStableSupplier(scenarioResults) {
        const counts = {};
        for (const { result } of scenarioResults) {
            for (const d of result.distribution) {
                counts[d.supplierId] = (counts[d.supplierId] || 0) + 1;
            }
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    }

    getMetrics() {
        return {
            registeredSuppliers: this.suppliers.size,
            optimizationsRun: this.history.length
        };
    }
}

export const gameTheoryOptimization = new GameTheoryOptimizationService();
export { StrategyType, Supplier, GameTheoryOptimizationService };
export default gameTheoryOptimization;
