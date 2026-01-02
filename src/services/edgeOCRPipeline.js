/**
 * Edge OCR Pipeline - Hybrid Edge-Cloud Processing
 * 
 * PREMIUM FEATURE: On-Device OCR with Zero Cloud Latency
 * 
 * All image processing on device via ML Kit.
 * Only lightweight JSON (<2KB) syncs to cloud.
 * 
 * @module edgeOCRPipeline
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} OCRExtractedData
 * @property {string} id - Unique identifier
 * @property {string} sku - Product SKU/code
 * @property {string} productName - Extracted product name
 * @property {number} price - Unit price
 * @property {number} quantity - Quantity
 * @property {string} unit - Unit of measure (kg, un, etc.)
 * @property {string} date - Invoice date
 * @property {string} supplierName - Supplier name if detected
 * @property {number} confidence - OCR confidence 0-1
 * @property {number} processingTimeMs - On-device processing time
 * @property {string} deviceId - Device identifier
 * @property {number} timestamp - Extraction timestamp
 */

/**
 * @typedef {Object} SyncQueueItem
 * @property {string} id
 * @property {string} operation - 'create' | 'update' | 'delete'
 * @property {string} collection
 * @property {Object} data
 * @property {string} status - 'pending' | 'syncing' | 'synced' | 'failed'
 * @property {number} attempts
 * @property {number} createdAt
 * @property {string|null} lastError
 */

// ═══════════════════════════════════════════════════════════════════════════
// FRAME PROCESSOR (React Native Vision Camera)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * TypeScript Frame Processor for VisionCamera
 * Converts camera stream to structured JSON on-device
 * 
 * Usage with react-native-vision-camera:
 * 
 * ```tsx
 * import { useFrameProcessor } from 'react-native-vision-camera';
 * import { scanOCR } from 'vision-camera-ocr';
 * 
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet';
 *   const result = scanOCR(frame);
 *   if (result.text) {
 *     runOnJS(processOCRResult)(result.text);
 *   }
 * }, []);
 * ```
 */

// Regex patterns for Brazilian invoice parsing
const PATTERNS = {
    price: /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/gi,
    priceAlt: /(\d{1,3}(?:\.\d{3})*(?:,\d{2}))\s*(?:R\$|BRL)/gi,
    quantity: /(?:qtd|qty|quantidade)[:\s]*(\d+(?:[.,]\d+)?)/gi,
    quantityAlt: /(\d+(?:[.,]\d+)?)\s*(?:kg|un|cx|pc|ml|l|g)\b/gi,
    sku: /(?:cod|código|sku|ref)[:\s]*([A-Z0-9-]+)/gi,
    date: /(\d{2}[\/.-]\d{2}[\/.-]\d{2,4})/g,
    cnpj: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
    unit: /\b(kg|un|cx|pc|ml|l|g|und|pç|pacote)\b/gi
};

/**
 * Parse raw OCR text into structured data
 * Runs entirely on-device - no cloud calls
 */
function parseOCRText(rawText) {
    const startTime = performance.now();
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const extracted = {
        id: `ocr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        items: [],
        supplierName: null,
        invoiceDate: null,
        cnpj: null,
        rawLineCount: lines.length,
        confidence: 0,
        processingTimeMs: 0,
        deviceId: getDeviceId(),
        timestamp: Date.now()
    };

    // Extract CNPJ (supplier identifier)
    const cnpjMatch = rawText.match(PATTERNS.cnpj);
    if (cnpjMatch) {
        extracted.cnpj = cnpjMatch[0];
    }

    // Extract date
    const dateMatch = rawText.match(PATTERNS.date);
    if (dateMatch) {
        extracted.invoiceDate = dateMatch[0];
    }

    // Extract supplier name (usually first non-empty line or line after CNPJ)
    for (const line of lines.slice(0, 5)) {
        if (line.length > 5 && !PATTERNS.cnpj.test(line) && !PATTERNS.date.test(line)) {
            extracted.supplierName = line.substring(0, 100);
            break;
        }
    }

    // Extract items (price + quantity patterns)
    const items = extractLineItems(lines);
    extracted.items = items;

    // Calculate confidence based on extraction quality
    extracted.confidence = calculateConfidence(extracted);
    extracted.processingTimeMs = performance.now() - startTime;

    return extracted;
}

/**
 * Extract individual line items from OCR text
 */
function extractLineItems(lines) {
    const items = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const item = extractItemFromLine(line, i);

        if (item && item.price > 0) {
            items.push(item);
        }
    }

    return items;
}

/**
 * Extract a single item from a text line
 */
function extractItemFromLine(line, lineIndex) {
    const item = {
        lineIndex,
        sku: null,
        productName: null,
        price: 0,
        quantity: 1,
        unit: 'un',
        totalPrice: 0
    };

    // Extract SKU
    const skuMatch = line.match(/(?:cod|código|sku|ref)[:\s]*([A-Z0-9-]+)/i);
    if (skuMatch) item.sku = skuMatch[1];

    // Extract price (Brazilian format: R$ 1.234,56)
    const priceMatch = line.match(/R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i);
    if (priceMatch) {
        item.price = parseBrazilianNumber(priceMatch[1]);
    }

    // Extract quantity
    const qtyMatch = line.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|un|cx|pc|ml|l|g)\b/i);
    if (qtyMatch) {
        item.quantity = parseBrazilianNumber(qtyMatch[1]);
        const unitMatch = line.match(/\b(kg|un|cx|pc|ml|l|g)\b/i);
        if (unitMatch) item.unit = unitMatch[1].toLowerCase();
    }

    // Extract product name (text before price, cleaned)
    const namePart = line.split(/R\$|\d{1,3}(?:\.\d{3})*(?:,\d{2})/)[0];
    if (namePart && namePart.length > 2) {
        item.productName = namePart
            .replace(/(?:cod|código|sku|ref)[:\s]*[A-Z0-9-]+/gi, '')
            .replace(/^\d+\s*/, '')
            .trim()
            .substring(0, 100);
    }

    item.totalPrice = item.price * item.quantity;

    return item.productName || item.price > 0 ? item : null;
}

/**
 * Parse Brazilian number format (1.234,56 -> 1234.56)
 */
function parseBrazilianNumber(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

/**
 * Calculate confidence score based on extraction quality
 */
function calculateConfidence(extracted) {
    let score = 0;
    let factors = 0;

    if (extracted.supplierName) { score += 0.2; factors++; }
    if (extracted.invoiceDate) { score += 0.15; factors++; }
    if (extracted.cnpj) { score += 0.15; factors++; }
    if (extracted.items.length > 0) { score += 0.3; factors++; }
    if (extracted.items.length > 3) { score += 0.1; factors++; }
    if (extracted.items.every(i => i.price > 0)) { score += 0.1; factors++; }

    return factors > 0 ? Math.min(score, 1) : 0.1;
}

/**
 * Get device identifier for tracking
 */
function getDeviceId() {
    if (typeof localStorage !== 'undefined') {
        let id = localStorage.getItem('device_id');
        if (!id) {
            id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            localStorage.setItem('device_id', id);
        }
        return id;
    }
    return `web_${Date.now()}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// WATERMELONDB SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * WatermelonDB Schema for offline sync queue
 * 
 * Usage:
 * ```javascript
 * import { appSchema, tableSchema } from '@nozbe/watermelondb';
 * 
 * export default appSchema({
 *   version: 1,
 *   tables: [
 *     ocrResultsSchema,
 *     syncQueueSchema
 *   ]
 * });
 * ```
 */

const WatermelonDBSchema = {
    ocrResults: {
        name: 'ocr_results',
        columns: [
            { name: 'ocr_id', type: 'string' },
            { name: 'supplier_name', type: 'string', isOptional: true },
            { name: 'supplier_cnpj', type: 'string', isOptional: true },
            { name: 'invoice_date', type: 'string', isOptional: true },
            { name: 'items_json', type: 'string' }, // JSON stringified items
            { name: 'total_amount', type: 'number' },
            { name: 'confidence', type: 'number' },
            { name: 'processing_time_ms', type: 'number' },
            { name: 'device_id', type: 'string' },
            { name: 'sync_status', type: 'string' }, // 'pending' | 'synced' | 'failed'
            { name: 'created_at', type: 'number' },
            { name: 'synced_at', type: 'number', isOptional: true }
        ]
    },
    syncQueue: {
        name: 'sync_queue',
        columns: [
            { name: 'record_id', type: 'string' },
            { name: 'collection', type: 'string' },
            { name: 'operation', type: 'string' }, // 'create' | 'update' | 'delete'
            { name: 'payload_json', type: 'string' },
            { name: 'status', type: 'string' }, // 'pending' | 'syncing' | 'synced' | 'failed'
            { name: 'attempts', type: 'number' },
            { name: 'last_error', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' }
        ]
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// SYNC LOGIC
// ═══════════════════════════════════════════════════════════════════════════

class EdgeSyncService {
    constructor() {
        this.queue = [];
        this.isOnline = navigator.onLine;
        this.isSyncing = false;
        this.maxRetries = 5;
        this.retryDelayMs = 1000;
        this.apiEndpoint = '/api/ocr/sync';
        this.listeners = new Set();
    }

    initialize() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Start background sync check
        setInterval(() => this.processSyncQueue(), 30000);

        console.log('[EdgeSync] Initialized, online:', this.isOnline);
    }

    handleOnline() {
        this.isOnline = true;
        console.log('[EdgeSync] Back online - starting sync');
        this.processSyncQueue();
    }

    handleOffline() {
        this.isOnline = false;
        console.log('[EdgeSync] Offline - queuing changes');
    }

    /**
     * Add item to sync queue (optimistic commit)
     */
    async queueForSync(data, operation = 'create') {
        const queueItem = {
            id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            recordId: data.id,
            collection: 'ocr_results',
            operation,
            payload: data,
            status: 'pending',
            attempts: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.queue.push(queueItem);
        this.notifyListeners('queued', queueItem);

        // Immediately try to sync if online
        if (this.isOnline && !this.isSyncing) {
            this.processSyncQueue();
        }

        return queueItem;
    }

    /**
     * Process pending items in sync queue
     */
    async processSyncQueue() {
        if (!this.isOnline || this.isSyncing) return;

        const pending = this.queue.filter(item =>
            item.status === 'pending' ||
            (item.status === 'failed' && item.attempts < this.maxRetries)
        );

        if (pending.length === 0) return;

        this.isSyncing = true;
        console.log(`[EdgeSync] Processing ${pending.length} pending items`);

        for (const item of pending) {
            try {
                item.status = 'syncing';
                item.attempts++;
                item.updatedAt = Date.now();

                await this.syncItem(item);

                item.status = 'synced';
                this.notifyListeners('synced', item);

                // Remove from queue after success
                this.queue = this.queue.filter(q => q.id !== item.id);

            } catch (error) {
                item.status = 'failed';
                item.lastError = error.message;
                this.notifyListeners('failed', item);

                // Exponential backoff
                await this.delay(this.retryDelayMs * Math.pow(2, item.attempts - 1));
            }
        }

        this.isSyncing = false;
    }

    /**
     * Sync single item to cloud
     */
    async syncItem(item) {
        const payload = {
            id: item.recordId,
            operation: item.operation,
            data: item.payload,
            deviceId: getDeviceId(),
            timestamp: item.createdAt
        };

        // Payload is less than 2KB
        const payloadSize = new Blob([JSON.stringify(payload)]).size;
        if (payloadSize > 2048) {
            console.warn(`[EdgeSync] Payload exceeds 2KB: ${payloadSize} bytes`);
        }

        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Device-ID': getDeviceId(),
                'X-Sync-Timestamp': String(Date.now())
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get sync queue status
     */
    getQueueStatus() {
        return {
            total: this.queue.length,
            pending: this.queue.filter(q => q.status === 'pending').length,
            syncing: this.queue.filter(q => q.status === 'syncing').length,
            failed: this.queue.filter(q => q.status === 'failed').length,
            isOnline: this.isOnline,
            isSyncing: this.isSyncing
        };
    }

    /**
     * Force retry failed items
     */
    retryFailed() {
        this.queue.forEach(item => {
            if (item.status === 'failed') {
                item.status = 'pending';
                item.attempts = 0;
            }
        });
        this.processSyncQueue();
    }

    /**
     * Subscribe to sync events
     */
    onSyncEvent(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try { listener(event, data); } catch (e) { console.error(e); }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PIPELINE ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════

class EdgeOCRPipeline {
    constructor() {
        this.syncService = new EdgeSyncService();
        this.processingQueue = [];
        this.isProcessing = false;
        this.metrics = {
            framesProcessed: 0,
            itemsExtracted: 0,
            avgProcessingTimeMs: 0,
            avgConfidence: 0
        };
        this.processingTimes = [];
        this.confidences = [];
    }

    initialize() {
        this.syncService.initialize();
        console.log('[EdgeOCR] Pipeline initialized');
    }

    /**
     * Process OCR frame (called from VisionCamera frame processor)
     */
    async processFrame(rawText) {
        if (!rawText || rawText.trim().length < 10) return null;

        // 1. Parse on device (Edge)
        const extracted = parseOCRText(rawText);

        // 2. Record metrics
        this.recordMetrics(extracted);

        // Skip if low confidence
        if (extracted.confidence < 0.3 || extracted.items.length === 0) {
            return { skipped: true, reason: 'Low confidence or no items', confidence: extracted.confidence };
        }

        // 3. Optimistic commit - save locally first
        const localResult = await this.saveLocally(extracted);

        // 4. Queue for background sync (lightweight JSON only, no image)
        await this.syncService.queueForSync(extracted);

        return {
            success: true,
            localId: localResult.id,
            itemCount: extracted.items.length,
            confidence: extracted.confidence,
            processingTimeMs: extracted.processingTimeMs,
            syncStatus: this.syncService.getQueueStatus()
        };
    }

    /**
     * Save to local storage (WatermelonDB simulation for web)
     */
    async saveLocally(data) {
        // In React Native, this would be WatermelonDB
        // For web, using localStorage as fallback
        const key = `ocr_${data.id}`;
        const record = {
            ...data,
            items_json: JSON.stringify(data.items),
            sync_status: 'pending',
            created_at: Date.now()
        };

        if (typeof localStorage !== 'undefined') {
            const existing = JSON.parse(localStorage.getItem('ocr_results') || '[]');
            existing.push(record);
            localStorage.setItem('ocr_results', JSON.stringify(existing.slice(-100))); // Keep last 100
        }

        return record;
    }

    recordMetrics(extracted) {
        this.metrics.framesProcessed++;
        this.metrics.itemsExtracted += extracted.items.length;

        this.processingTimes.push(extracted.processingTimeMs);
        this.confidences.push(extracted.confidence);

        if (this.processingTimes.length > 100) this.processingTimes.shift();
        if (this.confidences.length > 100) this.confidences.shift();

        this.metrics.avgProcessingTimeMs =
            this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
        this.metrics.avgConfidence =
            this.confidences.reduce((a, b) => a + b, 0) / this.confidences.length;
    }

    getMetrics() {
        return {
            ...this.metrics,
            syncQueue: this.syncService.getQueueStatus()
        };
    }

    getSyncService() {
        return this.syncService;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const edgeOCRPipeline = new EdgeOCRPipeline();
export {
    parseOCRText,
    extractLineItems,
    parseBrazilianNumber,
    WatermelonDBSchema,
    EdgeSyncService,
    EdgeOCRPipeline,
    PATTERNS
};
export default edgeOCRPipeline;
