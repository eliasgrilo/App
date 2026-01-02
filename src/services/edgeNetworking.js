/**
 * Global Edge Networking Service - Dynamic CDN
 * 
 * PREMIUM FEATURE #17: Edge CDN
 * 
 * Processing at the edge of the internet, close to users.
 * Global latency under 50ms.
 * 
 * @module edgeNetworking
 */

const EdgeLocations = Object.freeze({
    NA_EAST: { id: 'na-east', region: 'us-east1', city: 'Virginia', lat: 38.9, lng: -77.0 },
    NA_WEST: { id: 'na-west', region: 'us-west1', city: 'Oregon', lat: 45.5, lng: -122.7 },
    SA_EAST: { id: 'sa-east', region: 'southamerica-east1', city: 'São Paulo', lat: -23.5, lng: -46.6 },
    EU_WEST: { id: 'eu-west', region: 'europe-west1', city: 'Belgium', lat: 50.8, lng: 4.3 },
    EU_NORTH: { id: 'eu-north', region: 'europe-north1', city: 'Finland', lat: 60.2, lng: 24.9 },
    ASIA_EAST: { id: 'asia-east', region: 'asia-east1', city: 'Taiwan', lat: 25.0, lng: 121.5 },
    ASIA_SOUTH: { id: 'asia-south', region: 'asia-south1', city: 'Mumbai', lat: 19.1, lng: 72.9 },
    ASIA_NORTHEAST: { id: 'asia-ne', region: 'asia-northeast1', city: 'Tokyo', lat: 35.7, lng: 139.7 },
    OCEANIA: { id: 'oceania', region: 'australia-southeast1', city: 'Sydney', lat: -33.9, lng: 151.2 }
});

class EdgeCache {
    constructor(maxSize = 1000, ttlMs = 300000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        entry.hits++;
        return entry.value;
    }

    set(key, value, ttl = this.ttlMs) {
        if (this.cache.size >= this.maxSize) {
            const oldest = this.cache.keys().next().value;
            this.cache.delete(oldest);
        }
        this.cache.set(key, { value, expiresAt: Date.now() + ttl, hits: 0, createdAt: Date.now() });
    }

    invalidate(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) this.cache.delete(key);
        }
    }
}

class EdgeNetworkingService {
    constructor() {
        this.currentLocation = null;
        this.edgeCaches = new Map();
        this.metrics = { requests: 0, cacheHits: 0, avgLatency: 0 };
        this.latencies = [];

        for (const loc of Object.values(EdgeLocations)) {
            this.edgeCaches.set(loc.id, new EdgeCache());
        }
    }

    async detectUserLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/', { cache: 'force-cache' });
            const data = await response.json();
            this.currentLocation = { lat: data.latitude, lng: data.longitude, country: data.country_code };
            return this.currentLocation;
        } catch {
            this.currentLocation = { lat: -23.5, lng: -46.6, country: 'BR' };
            return this.currentLocation;
        }
    }

    getNearestEdge(userLat, userLng) {
        let nearest = null;
        let minDistance = Infinity;

        for (const edge of Object.values(EdgeLocations)) {
            const distance = this.haversineDistance(userLat, userLng, edge.lat, edge.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = { ...edge, distance };
            }
        }
        return nearest;
    }

    haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    async edgeFetch(url, options = {}) {
        const start = performance.now();
        this.metrics.requests++;

        if (!this.currentLocation) await this.detectUserLocation();
        const edge = this.getNearestEdge(this.currentLocation.lat, this.currentLocation.lng);
        const cache = this.edgeCaches.get(edge.id);
        const cacheKey = `${options.method || 'GET'}:${url}`;

        if (options.method !== 'POST' && options.method !== 'PUT') {
            const cached = cache.get(cacheKey);
            if (cached) {
                this.metrics.cacheHits++;
                this.recordLatency(performance.now() - start);
                return { data: cached, fromCache: true, edge: edge.city, latency: performance.now() - start };
            }
        }

        const response = await fetch(url, {
            ...options,
            headers: { ...options.headers, 'X-Edge-Location': edge.id }
        });
        const data = await response.json();

        if (response.ok && options.method !== 'POST') {
            cache.set(cacheKey, data, options.cacheTtl);
        }

        this.recordLatency(performance.now() - start);
        return { data, fromCache: false, edge: edge.city, latency: performance.now() - start };
    }

    recordLatency(latency) {
        this.latencies.push(latency);
        if (this.latencies.length > 100) this.latencies.shift();
        this.metrics.avgLatency = this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
    }

    getMetrics() {
        return {
            ...this.metrics,
            cacheHitRate: this.metrics.requests > 0 ? (this.metrics.cacheHits / this.metrics.requests * 100).toFixed(1) + '%' : '0%',
            currentEdge: this.currentLocation ? this.getNearestEdge(this.currentLocation.lat, this.currentLocation.lng)?.city : null
        };
    }

    invalidateCache(pattern) {
        for (const cache of this.edgeCaches.values()) {
            cache.invalidate(pattern);
        }
    }
}

export const edgeNetworking = new EdgeNetworkingService();
export { EdgeLocations, EdgeCache, EdgeNetworkingService };
export default edgeNetworking;
