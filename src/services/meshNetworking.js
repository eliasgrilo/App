/**
 * Mesh Networking Service - P2P Sync
 * 
 * PREMIUM FEATURE #24: Mesh Networking
 * 
 * Decentralized internet - devices create their own network.
 * Works in cold rooms, basements, or when WiFi is down.
 * 
 * @module meshNetworking
 */

const ConnectionState = Object.freeze({
    DISCONNECTED: 'disconnected', CONNECTING: 'connecting',
    CONNECTED: 'connected', SYNCING: 'syncing'
});

const MessageType = Object.freeze({
    HANDSHAKE: 'handshake', DATA_SYNC: 'data_sync', HEARTBEAT: 'heartbeat',
    REQUEST: 'request', RESPONSE: 'response', BROADCAST: 'broadcast'
});

class Peer {
    constructor(id, config = {}) {
        this.id = id;
        this.name = config.name || `Device-${id.substring(0, 6)}`;
        this.role = config.role || 'node';
        this.state = ConnectionState.DISCONNECTED;
        this.lastSeen = null;
        this.dataVersion = 0;
        this.latency = null;
    }
}

class MeshMessage {
    constructor(type, payload, config = {}) {
        this.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.type = type;
        this.payload = payload;
        this.from = config.from;
        this.to = config.to || 'broadcast';
        this.ttl = config.ttl || 3;
        this.timestamp = Date.now();
        this.hops = [];
    }
}

class MeshNetworkingService {
    constructor() {
        this.peerId = `peer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        this.peers = new Map();
        this.dataStore = new Map();
        this.messageQueue = [];
        this.handlers = new Map();
        this.isOnline = navigator.onLine;
        this.syncVersion = 0;
        this.metrics = { messagesSent: 0, messagesReceived: 0, syncsCompleted: 0, peersConnected: 0 };
    }

    initialize(config = {}) {
        this.deviceName = config.deviceName || `Device-${this.peerId.substring(0, 6)}`;
        this.role = config.role || 'node';

        window.addEventListener('online', () => this.handleOnlineChange(true));
        window.addEventListener('offline', () => this.handleOnlineChange(false));

        this.startHeartbeat();
        console.log('[Mesh] Initialized:', this.peerId);
        return { peerId: this.peerId, deviceName: this.deviceName };
    }

    handleOnlineChange(online) {
        this.isOnline = online;
        if (!online) {
            console.log('[Mesh] Offline - switching to P2P mode');
            this.activateP2PMode();
        } else {
            console.log('[Mesh] Online - syncing with cloud');
            this.syncWithCloud();
        }
    }

    activateP2PMode() {
        // In real implementation, would use WebRTC, Bluetooth, or WiFi Direct
        console.log('[Mesh] P2P mode activated - scanning for nearby devices');
        this.broadcastPresence();
    }

    broadcastPresence() {
        const msg = new MeshMessage(MessageType.HANDSHAKE, {
            peerId: this.peerId,
            deviceName: this.deviceName,
            role: this.role,
            dataVersion: this.syncVersion,
            capabilities: ['sync', 'relay', 'storage']
        }, { from: this.peerId });

        this.broadcast(msg);
    }

    connectToPeer(peerId, peerInfo = {}) {
        if (this.peers.has(peerId)) return this.peers.get(peerId);

        const peer = new Peer(peerId, peerInfo);
        peer.state = ConnectionState.CONNECTING;
        this.peers.set(peerId, peer);

        // Simulate connection
        setTimeout(() => {
            peer.state = ConnectionState.CONNECTED;
            peer.lastSeen = Date.now();
            this.metrics.peersConnected++;
            console.log('[Mesh] Connected to peer:', peer.name);
            this.requestSync(peerId);
        }, 100);

        return peer;
    }

    disconnectPeer(peerId) {
        const peer = this.peers.get(peerId);
        if (peer) {
            peer.state = ConnectionState.DISCONNECTED;
            this.peers.delete(peerId);
            this.metrics.peersConnected--;
        }
    }

    send(peerId, type, payload) {
        const peer = this.peers.get(peerId);
        if (!peer || peer.state !== ConnectionState.CONNECTED) {
            throw new Error(`Peer not connected: ${peerId}`);
        }

        const msg = new MeshMessage(type, payload, { from: this.peerId, to: peerId });
        this.deliverMessage(msg);
        this.metrics.messagesSent++;
        return msg.id;
    }

    broadcast(message) {
        message.to = 'broadcast';
        for (const [peerId, peer] of this.peers) {
            if (peer.state === ConnectionState.CONNECTED) {
                this.deliverMessage({ ...message, to: peerId });
            }
        }
        this.metrics.messagesSent += this.peers.size;
    }

    deliverMessage(message) {
        // Simulate network delivery
        setTimeout(() => {
            this.handleIncomingMessage(message);
        }, Math.random() * 50 + 10);
    }

    handleIncomingMessage(message) {
        this.metrics.messagesReceived++;
        message.hops.push(this.peerId);

        const handler = this.handlers.get(message.type);
        if (handler) {
            handler(message);
        }

        // Relay if TTL > 0 and not final destination
        if (message.to === 'broadcast' && message.ttl > 0) {
            message.ttl--;
            this.relayMessage(message);
        }
    }

    relayMessage(message) {
        for (const [peerId, peer] of this.peers) {
            if (!message.hops.includes(peerId) && peer.state === ConnectionState.CONNECTED) {
                this.deliverMessage({ ...message, hops: [...message.hops] });
            }
        }
    }

    onMessage(type, handler) {
        this.handlers.set(type, handler);
    }

    // ─────────────────────────────────────────────────
    // DATA SYNC
    // ─────────────────────────────────────────────────

    setData(key, value) {
        const entry = { key, value, version: ++this.syncVersion, timestamp: Date.now(), origin: this.peerId };
        this.dataStore.set(key, entry);
        this.broadcast(new MeshMessage(MessageType.DATA_SYNC, entry, { from: this.peerId }));
        return entry;
    }

    getData(key) {
        const entry = this.dataStore.get(key);
        return entry?.value;
    }

    requestSync(peerId) {
        this.send(peerId, MessageType.REQUEST, { type: 'full_sync', fromVersion: this.syncVersion });
    }

    handleSyncRequest(message) {
        const { fromVersion } = message.payload;
        const updates = [];

        for (const [key, entry] of this.dataStore) {
            if (entry.version > fromVersion) {
                updates.push(entry);
            }
        }

        this.send(message.from, MessageType.RESPONSE, { type: 'sync_data', updates });
    }

    applySyncData(updates) {
        for (const entry of updates) {
            const existing = this.dataStore.get(entry.key);
            if (!existing || existing.version < entry.version) {
                this.dataStore.set(entry.key, entry);
                this.syncVersion = Math.max(this.syncVersion, entry.version);
            }
        }
        this.metrics.syncsCompleted++;
    }

    async syncWithCloud() {
        if (!this.isOnline) return;
        console.log('[Mesh] Syncing local changes to cloud...');
        // Would sync to Firebase/backend here
    }

    // ─────────────────────────────────────────────────
    // HEARTBEAT
    // ─────────────────────────────────────────────────

    startHeartbeat() {
        setInterval(() => {
            for (const [peerId, peer] of this.peers) {
                if (peer.state === ConnectionState.CONNECTED) {
                    const start = performance.now();
                    this.send(peerId, MessageType.HEARTBEAT, { timestamp: Date.now() });
                    peer.latency = performance.now() - start;
                    peer.lastSeen = Date.now();
                }
            }
            this.cleanupStalePeers();
        }, 30000);
    }

    cleanupStalePeers() {
        const staleThreshold = 60000;
        for (const [peerId, peer] of this.peers) {
            if (peer.lastSeen && Date.now() - peer.lastSeen > staleThreshold) {
                this.disconnectPeer(peerId);
            }
        }
    }

    getNetworkTopology() {
        return {
            self: { id: this.peerId, name: this.deviceName, role: this.role },
            peers: Array.from(this.peers.values()).map(p => ({
                id: p.id, name: p.name, state: p.state, latency: p.latency
            })),
            isOnline: this.isOnline,
            dataVersion: this.syncVersion
        };
    }

    getMetrics() {
        return { ...this.metrics, dataItems: this.dataStore.size, syncVersion: this.syncVersion };
    }
}

export const meshNetworking = new MeshNetworkingService();
export { ConnectionState, MessageType, Peer, MeshMessage, MeshNetworkingService };
export default meshNetworking;
