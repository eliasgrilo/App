/**
 * Supply Chain Control Tower Service
 * 
 * PREMIUM FEATURE #26: Supply Chain Control Tower
 * 
 * Monitors external factors: weather, strikes, dollar rate.
 * Predicts price changes based on real causality.
 * 
 * @module supplyChainControlTower
 */

const AlertSeverity = Object.freeze({
    INFO: 'info', WARNING: 'warning', CRITICAL: 'critical'
});

const ExternalFactor = Object.freeze({
    WEATHER: 'weather', CURRENCY: 'currency', LOGISTICS: 'logistics',
    COMMODITY: 'commodity', POLITICAL: 'political', SUPPLY: 'supply'
});

class ExternalEvent {
    constructor(config) {
        this.id = `event_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.type = config.type;
        this.title = config.title;
        this.description = config.description;
        this.severity = config.severity || AlertSeverity.INFO;
        this.affectedProducts = config.affectedProducts || [];
        this.priceImpact = config.priceImpact || 0;
        this.probability = config.probability || 1;
        this.source = config.source;
        this.timestamp = Date.now();
        this.expiresAt = config.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000;
    }
}

class SupplyChainControlTowerService {
    constructor() {
        this.events = new Map();
        this.subscriptions = new Map();
        this.productWatchlist = new Set();
        this.alerts = [];
        this.dataFeeds = new Map();
        this.metrics = { eventsProcessed: 0, alertsGenerated: 0, predictionsAccurate: 0 };
    }

    initialize() {
        this.registerDefaultFeeds();
        console.log('[ControlTower] Initialized');
    }

    registerDefaultFeeds() {
        this.registerFeed('weather', { refreshInterval: 3600000, parser: this.parseWeatherData.bind(this) });
        this.registerFeed('currency', { refreshInterval: 300000, parser: this.parseCurrencyData.bind(this) });
        this.registerFeed('logistics', { refreshInterval: 1800000, parser: this.parseLogisticsData.bind(this) });
        this.registerFeed('commodities', { refreshInterval: 900000, parser: this.parseCommodityData.bind(this) });
    }

    registerFeed(name, config) {
        this.dataFeeds.set(name, { name, ...config, lastFetch: null, data: null });
    }

    async fetchExternalData(feedName) {
        const feed = this.dataFeeds.get(feedName);
        if (!feed) return null;

        try {
            // Simulated API calls - in production would hit real APIs
            const data = await this.simulateFeedData(feedName);
            feed.data = data;
            feed.lastFetch = Date.now();
            this.processExternalData(feedName, data);
            return data;
        } catch (error) {
            console.error(`[ControlTower] Feed error: ${feedName}`, error);
            return null;
        }
    }

    async simulateFeedData(feedName) {
        await new Promise(r => setTimeout(r, 100));

        const mockData = {
            weather: { region: 'Sul', forecast: 'geada', probability: 0.7, date: new Date(Date.now() + 86400000) },
            currency: { USD_BRL: 5.05 + Math.random() * 0.2, trend: 'up', change: 0.02 },
            logistics: { strikes: false, avgDeliveryDelay: 0.5, fuelPrice: 6.2 },
            commodities: { tomato: 4.5, flour: 3.2, cheese: 28.0, trends: { tomato: 'up', flour: 'stable' } }
        };

        return mockData[feedName] || {};
    }

    processExternalData(feedName, data) {
        let event = null;

        switch (feedName) {
            case 'weather':
                if (data.forecast === 'geada' && data.probability > 0.5) {
                    event = new ExternalEvent({
                        type: ExternalFactor.WEATHER,
                        title: `Geada prevista na região ${data.region}`,
                        description: `Probabilidade de ${(data.probability * 100).toFixed(0)}% de geada. Pode afetar produção de hortaliças.`,
                        severity: AlertSeverity.WARNING,
                        affectedProducts: ['tomate', 'alface', 'morango'],
                        priceImpact: 0.15,
                        source: 'weather-api'
                    });
                }
                break;

            case 'currency':
                if (data.change > 0.03) {
                    event = new ExternalEvent({
                        type: ExternalFactor.CURRENCY,
                        title: `Dólar em alta: R$${data.USD_BRL.toFixed(2)}`,
                        description: `Variação de ${(data.change * 100).toFixed(1)}%. Produtos importados devem subir.`,
                        severity: data.change > 0.05 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
                        affectedProducts: ['azeite', 'queijo importado', 'fermento'],
                        priceImpact: data.change * 0.8,
                        source: 'currency-api'
                    });
                }
                break;

            case 'logistics':
                if (data.strikes) {
                    event = new ExternalEvent({
                        type: ExternalFactor.LOGISTICS,
                        title: 'Greve de caminhoneiros detectada',
                        description: 'Possível desabastecimento e atrasos nas entregas.',
                        severity: AlertSeverity.CRITICAL,
                        affectedProducts: ['*'],
                        priceImpact: 0.10,
                        source: 'logistics-api'
                    });
                }
                break;

            case 'commodities':
                if (data.trends?.tomato === 'up') {
                    event = new ExternalEvent({
                        type: ExternalFactor.COMMODITY,
                        title: 'Tomate em tendência de alta',
                        description: `Preço atual: R$${data.tomato?.toFixed(2)}/kg. Sugerido estocar.`,
                        severity: AlertSeverity.INFO,
                        affectedProducts: ['tomate', 'molho'],
                        priceImpact: 0.08,
                        source: 'commodity-api'
                    });
                }
                break;
        }

        if (event) {
            this.registerEvent(event);
        }
    }

    parseWeatherData(raw) { return raw; }
    parseCurrencyData(raw) { return raw; }
    parseLogisticsData(raw) { return raw; }
    parseCommodityData(raw) { return raw; }

    registerEvent(event) {
        this.events.set(event.id, event);
        this.metrics.eventsProcessed++;

        if (event.severity !== AlertSeverity.INFO) {
            this.generateAlert(event);
        }

        this.notifySubscribers(event);
    }

    generateAlert(event) {
        const alert = {
            id: `alert_${Date.now()}`,
            eventId: event.id,
            title: event.title,
            severity: event.severity,
            action: this.suggestAction(event),
            timestamp: Date.now()
        };

        this.alerts.unshift(alert);
        if (this.alerts.length > 100) this.alerts.pop();
        this.metrics.alertsGenerated++;

        return alert;
    }

    suggestAction(event) {
        const actions = {
            [ExternalFactor.WEATHER]: `🌡️ Estocar ${event.affectedProducts.join(', ')} antes da alta de preços (estimado +${(event.priceImpact * 100).toFixed(0)}%)`,
            [ExternalFactor.CURRENCY]: `💱 Antecipar compra de importados ou buscar fornecedores nacionais`,
            [ExternalFactor.LOGISTICS]: `🚚 Aumentar estoque de segurança e confirmar entregas pendentes`,
            [ExternalFactor.COMMODITY]: `📦 Considerar compra em maior volume para aproveitar preço atual`
        };
        return actions[event.type] || 'Monitorar situação';
    }

    subscribe(productId, callback) {
        this.productWatchlist.add(productId);
        if (!this.subscriptions.has(productId)) {
            this.subscriptions.set(productId, new Set());
        }
        this.subscriptions.get(productId).add(callback);
        return () => this.subscriptions.get(productId)?.delete(callback);
    }

    notifySubscribers(event) {
        for (const product of event.affectedProducts) {
            const callbacks = this.subscriptions.get(product);
            if (callbacks) {
                for (const cb of callbacks) {
                    try { cb(event); } catch (e) { console.error(e); }
                }
            }
        }
    }

    getActiveAlerts(severity = null) {
        const now = Date.now();
        return this.alerts.filter(a => {
            const event = this.events.get(a.eventId);
            return (!severity || a.severity === severity) && (!event || event.expiresAt > now);
        });
    }

    getPriceforecast(productId) {
        let totalImpact = 0;
        let factors = [];

        for (const event of this.events.values()) {
            if (event.affectedProducts.includes(productId) || event.affectedProducts.includes('*')) {
                totalImpact += event.priceImpact * event.probability;
                factors.push({ factor: event.type, impact: event.priceImpact, event: event.title });
            }
        }

        return {
            productId,
            expectedPriceChange: (totalImpact * 100).toFixed(1) + '%',
            direction: totalImpact > 0 ? 'up' : totalImpact < 0 ? 'down' : 'stable',
            factors,
            recommendation: totalImpact > 0.05 ? 'Comprar agora' : 'Aguardar'
        };
    }

    async refreshAllFeeds() {
        const results = [];
        for (const [name] of this.dataFeeds) {
            results.push(await this.fetchExternalData(name));
        }
        return results;
    }

    getMetrics() {
        return { ...this.metrics, activeEvents: this.events.size, activeAlerts: this.alerts.length };
    }
}

export const supplyChainControlTower = new SupplyChainControlTowerService();
export { AlertSeverity, ExternalFactor, ExternalEvent, SupplyChainControlTowerService };
export default supplyChainControlTower;
