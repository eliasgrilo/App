/**
 * Secrets Management Service - Vault Pattern
 * 
 * PREMIUM FEATURE #18: Secrets Management
 * 
 * Digital vault for API keys and database passwords.
 * No passwords in code - credentials are borrowed for milliseconds.
 * 
 * @module secretsManagement
 */

const SecretType = Object.freeze({
    API_KEY: 'api_key',
    DATABASE: 'database',
    OAUTH: 'oauth',
    ENCRYPTION: 'encryption',
    SERVICE_ACCOUNT: 'service_account'
});

class SecretEntry {
    constructor(key, value, config = {}) {
        this.key = key;
        this.encryptedValue = this.encrypt(value);
        this.type = config.type || SecretType.API_KEY;
        this.rotationDays = config.rotationDays || 90;
        this.createdAt = Date.now();
        this.lastAccessed = null;
        this.accessCount = 0;
        this.expiresAt = config.expiresAt || null;
        this.allowedServices = config.allowedServices || ['*'];
    }

    encrypt(value) {
        // Simulated encryption - in production use crypto.subtle
        const key = this.generateKey();
        return { data: btoa(value + ':' + key), key: key.substring(0, 8) };
    }

    decrypt() {
        try {
            const decoded = atob(this.encryptedValue.data);
            return decoded.split(':')[0];
        } catch { return null; }
    }

    generateKey() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    isExpired() {
        return this.expiresAt && Date.now() > this.expiresAt;
    }

    needsRotation() {
        const daysSinceCreation = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
        return daysSinceCreation >= this.rotationDays;
    }
}

class SecretsManagementService {
    constructor() {
        this.vault = new Map();
        this.accessLog = [];
        this.leaseTokens = new Map();
        this.initialized = false;
    }

    initialize(masterKey = null) {
        this.masterKey = masterKey || this.generateMasterKey();
        this.initialized = true;
        console.log('[Vault] Secrets management initialized');
    }

    generateMasterKey() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    store(key, value, config = {}) {
        if (!this.initialized) throw new Error('Vault not initialized');
        const secret = new SecretEntry(key, value, config);
        this.vault.set(key, secret);
        this.log('STORE', key, config.service || 'system');
        return { stored: true, key, expiresAt: secret.expiresAt };
    }

    get(key, service = 'unknown') {
        if (!this.initialized) throw new Error('Vault not initialized');
        const secret = this.vault.get(key);
        if (!secret) return null;
        if (secret.isExpired()) {
            this.vault.delete(key);
            return null;
        }
        if (!secret.allowedServices.includes('*') && !secret.allowedServices.includes(service)) {
            this.log('ACCESS_DENIED', key, service);
            throw new Error(`Service ${service} not authorized for secret ${key}`);
        }
        secret.lastAccessed = Date.now();
        secret.accessCount++;
        this.log('ACCESS', key, service);
        return secret.decrypt();
    }

    lease(key, service, ttlMs = 60000) {
        const value = this.get(key, service);
        if (!value) return null;
        const token = `lease_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        this.leaseTokens.set(token, { key, value, service, expiresAt: Date.now() + ttlMs });
        setTimeout(() => this.revokeLease(token), ttlMs);
        this.log('LEASE', key, service);
        return { token, expiresIn: ttlMs };
    }

    useLeaseOnce(token) {
        const lease = this.leaseTokens.get(token);
        if (!lease || Date.now() > lease.expiresAt) {
            this.leaseTokens.delete(token);
            return null;
        }
        this.leaseTokens.delete(token);
        return lease.value;
    }

    revokeLease(token) {
        const lease = this.leaseTokens.get(token);
        if (lease) {
            this.log('LEASE_REVOKED', lease.key, lease.service);
            this.leaseTokens.delete(token);
        }
    }

    rotate(key, newValue) {
        const secret = this.vault.get(key);
        if (!secret) throw new Error(`Secret not found: ${key}`);
        const config = { type: secret.type, rotationDays: secret.rotationDays, allowedServices: secret.allowedServices };
        this.store(key, newValue, config);
        this.log('ROTATE', key, 'system');
        return { rotated: true, key };
    }

    delete(key) {
        this.vault.delete(key);
        this.log('DELETE', key, 'system');
    }

    listSecrets() {
        return Array.from(this.vault.entries()).map(([key, secret]) => ({
            key, type: secret.type, createdAt: new Date(secret.createdAt).toISOString(),
            accessCount: secret.accessCount, needsRotation: secret.needsRotation()
        }));
    }

    log(action, key, service) {
        this.accessLog.push({ action, key, service, timestamp: Date.now() });
        if (this.accessLog.length > 1000) this.accessLog.shift();
    }

    getAuditLog(limit = 50) {
        return this.accessLog.slice(-limit).map(e => ({
            ...e, timestamp: new Date(e.timestamp).toISOString()
        }));
    }

    getMetrics() {
        const secrets = Array.from(this.vault.values());
        return {
            totalSecrets: secrets.length,
            needingRotation: secrets.filter(s => s.needsRotation()).length,
            activeLeases: this.leaseTokens.size,
            recentAccesses: this.accessLog.filter(l => Date.now() - l.timestamp < 3600000).length
        };
    }
}

export const secretsManagement = new SecretsManagementService();
export { SecretType, SecretEntry, SecretsManagementService };
export default secretsManagement;
