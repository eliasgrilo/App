/**
 * AutoQuotationService - Automatic Quotation Creation on Low Stock
 * 
 * Listens to stock events from StockService and automatically creates
 * quotations when products reach minimum stock levels.
 * 
 * Features:
 * - Debounced event handling (groups multiple products)
 * - Supplier grouping (one quotation per supplier)
 * - Haptic feedback for user awareness
 * - Firestore-based distributed locks (prevents race conditions)
 * 
 * REFACTORED: Replaced in-memory Set with Firestore locks for reliability
 */

import { onStockEvent } from './stockService'
import { createQuotation, getQuotations, QUOTATION_STATUS } from './smartSourcingService'
import { HapticService } from './hapticService'
import { db } from '../firebase'
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'

// ═══════════════════════════════════════════════════════════════
// FIRESTORE REAL-TIME DUPLICATE CHECK
// ═══════════════════════════════════════════════════════════════

/**
 * Get open quotations from Firestore for real-time duplicate detection
 * Falls back to localStorage if Firestore fails
 * @returns {Promise<Array>} Array of open quotations
 */
async function getOpenQuotationsFromFirestore() {
    try {
        const openStatuses = ['pending', 'awaiting', 'quoted', 'ordered']
        const q = query(
            collection(db, 'quotations'),
            where('status', 'in', openStatuses)
        )
        const snapshot = await getDocs(q)
        const firestoreQuotations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        console.log(`🔍 Found ${firestoreQuotations.length} open quotations in Firestore`)
        return firestoreQuotations
    } catch (error) {
        console.warn('⚠️ Firestore duplicate check failed, using localStorage fallback:', error.message)
        return getQuotations()
    }
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
    // Debounce time to group multiple product events (5s for faster response)
    DEBOUNCE_MS: 5000,
    // Maximum products per quotation
    MAX_ITEMS_PER_QUOTATION: 20,
    // System user for audit trail
    SYSTEM_USER_ID: 'system_auto_quotation',
    SYSTEM_USER_NAME: 'Automação de Estoque',
    // Lock TTL for processing (prevents stale locks)
    // INCREASED: 3 minutes to handle slow network/Firestore operations
    LOCK_TTL_MS: 180000, // 3 minutes (was 1 minute)
    // Heartbeat interval for long operations
    LOCK_HEARTBEAT_MS: 30000 // 30 seconds
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

// Pending products grouped by supplier
const pendingBySupplier = new Map()

// Debounce timer
let debounceTimer = null

// Initialization flag
let isInitialized = false

// ═══════════════════════════════════════════════════════════════
// DISTRIBUTED LOCK - Firestore-based (survives page refresh)
// ═══════════════════════════════════════════════════════════════

/**
 * Try to acquire a distributed lock for processing a product
 * Prevents race conditions across page refreshes and concurrent requests
 * 
 * @param {string} productId - Product ID to lock
 * @returns {Promise<boolean>} true if lock acquired, false if already locked
 */
async function acquireProcessingLock(productId) {
    const lockRef = doc(db, 'quotationProcessingLocks', productId)
    const now = Date.now()

    try {
        const lockDoc = await getDoc(lockRef)

        if (lockDoc.exists()) {
            const lockData = lockDoc.data()
            // Check if lock is still valid (not expired)
            if (lockData.expiresAt > now) {
                console.log(`🔒 Lock exists for product ${productId}, expires in ${Math.round((lockData.expiresAt - now) / 1000)}s`)
                return false
            }
            // Lock expired, we can take it
            console.log(`🔓 Expired lock found for ${productId}, taking over`)
        }

        // Acquire or refresh lock
        await setDoc(lockRef, {
            productId,
            acquiredAt: now,
            expiresAt: now + CONFIG.LOCK_TTL_MS,
            acquiredBy: 'autoQuotationService'
        })

        console.log(`🔐 Lock acquired for product ${productId}`)
        return true

    } catch (error) {
        console.warn(`⚠️ Lock acquisition failed for ${productId}:`, error.message)
        // On error, fail open - allow processing (better than stuck)
        return true
    }
}

/**
 * Release a processing lock (cleanup after processing)
 * @param {string} productId - Product ID to unlock
 */
async function releaseProcessingLock(productId) {
    try {
        const lockRef = doc(db, 'quotationProcessingLocks', productId)
        await deleteDoc(lockRef)
        console.log(`🔓 Lock released for product ${productId}`)
    } catch (error) {
        // Non-critical, lock will expire anyway
        console.warn(`⚠️ Lock release failed for ${productId}:`, error.message)
    }
}

/**
 * Extend lock TTL for long-running operations (heartbeat)
 * Call periodically during lengthy processing to prevent lock expiry
 * @param {string} productId - Product ID to extend lock for
 */
async function extendLock(productId) {
    const lockRef = doc(db, 'quotationProcessingLocks', productId)
    const now = Date.now()

    try {
        await setDoc(lockRef, {
            expiresAt: now + CONFIG.LOCK_TTL_MS,
            lastHeartbeat: now,
            acquiredBy: 'autoQuotationService'
        }, { merge: true })
        console.log(`💓 Lock heartbeat for product ${productId}`)
    } catch (error) {
        console.warn(`⚠️ Lock heartbeat failed for ${productId}:`, error.message)
    }
}



// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get supplier details from FirebaseService
 * FIXED: Now uses FirebaseService.getSuppliers() instead of direct collection query
 */
async function getSupplierDetails(supplierId) {
    try {
        // Use FirebaseService which correctly reads from settings/suppliers
        const { FirebaseService } = await import('./firebaseService')
        const data = await FirebaseService.getSuppliers()

        if (!data?.suppliers || !Array.isArray(data.suppliers)) {
            console.warn('⚠️ No suppliers found in database')
            return null
        }

        // Find supplier by id (comparing as strings to handle type mismatches)
        const supplier = data.suppliers.find(s => String(s.id) === String(supplierId))

        if (supplier) {
            console.log(`✅ Found supplier: ${supplier.name}`)
            return supplier
        }

        console.warn(`⚠️ Supplier ${supplierId} not found in ${data.suppliers.length} suppliers`)
        return null
    } catch (error) {
        console.error(`Failed to fetch supplier ${supplierId}:`, error)
        return null
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle incoming stock reorder event
 * Uses Firestore-based distributed locks for duplicate prevention
 */
async function handleReorderEvent(eventType, data) {
    if (eventType !== 'NEEDS_REORDER') return

    // GUARD 1: Check AI mode setting - skip if manual mode
    try {
        const settings = JSON.parse(localStorage.getItem('padoca_settings_extra') || '{}')
        if (settings.aiMode === 'manual') {
            console.log(`⏸️ Auto-quotation skipped for ${data.productName} (manual mode)`)
            return
        }
    } catch (e) { /* ignore parse errors */ }

    // GUARD 2: Check enableAutoQuotation flag on item
    if (data.enableAutoQuotation === false) {
        console.log(`⏸️ Auto-quotation disabled for ${data.productName}`)
        return
    }

    const { productId, supplierId } = data

    // GUARD 3: Validate required fields
    if (!productId) {
        console.warn(`⚠️ Product event has no product ID`)
        return
    }
    if (!supplierId) {
        console.warn(`⚠️ Product ${data.productName} has no supplier configured`)
        return
    }

    // GUARD 4: Acquire distributed lock (prevents race conditions)
    const hasLock = await acquireProcessingLock(productId)
    if (!hasLock) {
        console.log(`⏭️ Skipping duplicate event for ${data.productName} (locked)`)
        return
    }

    // Group by supplier
    if (!pendingBySupplier.has(supplierId)) {
        pendingBySupplier.set(supplierId, [])
    }

    pendingBySupplier.get(supplierId).push(data)
    console.log(`📥 Queued ${data.productName} for supplier ${data.supplierName || supplierId}`)


    // Reset debounce timer
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(processAllPendingQuotations, CONFIG.DEBOUNCE_MS)
}

/**
 * Process all pending quotations (after debounce)
 * Groups by supplier AND category for better organization
 */
async function processAllPendingQuotations() {
    if (pendingBySupplier.size === 0) return

    console.log(`\n🚀 Processing ${pendingBySupplier.size} supplier group(s)...`)

    // Get open quotations from Firestore for duplicate check
    const existingQuotations = await getOpenQuotationsFromFirestore()
    const openStatuses = [
        QUOTATION_STATUS.PENDING,
        QUOTATION_STATUS.AWAITING,
        QUOTATION_STATUS.QUOTED,
        QUOTATION_STATUS.ORDERED
    ]

    for (const [supplierId, products] of pendingBySupplier) {
        try {
            // Group products by category for this supplier
            const productsByCategory = products.reduce((acc, product) => {
                const category = product.category || 'Outros'
                if (!acc[category]) acc[category] = []
                acc[category].push(product)
                return acc
            }, {})

            // Create separate quotation for each category
            for (const [category, categoryProducts] of Object.entries(productsByCategory)) {
                await createQuotationForSupplierCategory(supplierId, categoryProducts, category, existingQuotations, openStatuses)
            }
        } catch (error) {
            console.error(`❌ Failed to create quotation for supplier ${supplierId}:`, error)
        }
    }

    // Clear pending
    pendingBySupplier.clear()

    // Haptic feedback
    HapticService.trigger('notification')
}

/**
 * Create quotation for a specific supplier and category
 * @param {string} supplierId - Supplier ID
 * @param {Array} products - Products to quote
 * @param {string} category - Category name for grouping
 * @param {Array} existingQuotations - Open quotations from Firestore
 * @param {Array} openStatuses - Valid open status values
 */
async function createQuotationForSupplierCategory(supplierId, products, category, existingQuotations, openStatuses) {
    // Get full supplier details
    const supplier = await getSupplierDetails(supplierId)

    if (!supplier) {
        console.warn(`⚠️ Supplier ${supplierId} not found in database`)
        return null
    }

    // BUG FIX #3: Check autoOrderEnabled flag on supplier
    if (supplier.autoOrderEnabled === false) {
        console.log(`⏸️ Auto-order disabled for supplier ${supplier.name}`)
        return null
    }

    if (!supplier.email) {
        console.warn(`⚠️ Supplier ${supplier.name} has no email configured`)
        return null
    }

    // 🔥 CRITICAL FIX: De-Duplication Guard using Firestore data
    const productsToQuote = products.filter(product => {
        const hasOpenQuotation = existingQuotations.some(q =>
            openStatuses.includes(q.status) &&
            q.items?.some(item => item.productId === product.productId)
        )
        if (hasOpenQuotation) {
            console.log(`⏭️ Skipping ${product.productName} - already has open quotation`)
        }
        return !hasOpenQuotation
    })

    // Early exit if all products already have open quotations
    if (productsToQuote.length === 0) {
        console.log(`✅ All products in category "${category}" already have open quotations`)
        return null
    }

    const itemsToQuote = productsToQuote.slice(0, CONFIG.MAX_ITEMS_PER_QUOTATION)

    // Create quotation with category info
    const quotation = await createQuotation({
        supplierId,
        supplierName: supplier.name,
        supplierEmail: supplier.email,
        category, // Include category for reference
        items: itemsToQuote.map(p => ({
            id: p.productId,
            name: p.productName,
            category: p.category,
            neededQuantity: p.quantityToOrder,
            unit: p.unit,
            currentPrice: p.currentPrice
        })),
        userId: CONFIG.SYSTEM_USER_ID,
        userName: CONFIG.SYSTEM_USER_NAME
    })

    console.log(`✅ Created auto-quotation ${quotation.id} for ${supplier.name} [${category}] with ${itemsToQuote.length} items`)

    return quotation
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the auto-quotation service
 * Should be called once on app startup
 */
export function initAutoQuotation() {
    if (isInitialized) {
        console.warn('AutoQuotationService already initialized')
        return
    }

    // Subscribe to stock events
    onStockEvent(handleReorderEvent)
    isInitialized = true

    console.log('✅ AutoQuotationService initialized')

    // Run initial stock check after a short delay to allow inventory to load
    setTimeout(runInitialStockCheck, 5000)
}

/**
 * Run initial stock check on startup
 * Scans inventory for items already below minimum stock
 */
async function runInitialStockCheck() {
    try {
        const { FirebaseService } = await import('./firebaseService')
        const data = await FirebaseService.getInventory()

        if (!data?.items || !Array.isArray(data.items)) {
            console.log('📦 No inventory items found for initial check')
            return
        }

        const { StockService } = await import('./stockService')

        // Find items that need reorder and have supplier configured
        // Guard: Items without minStock defined are skipped to prevent loop issues
        // BUG FIX #2 (also here): Check enableAutoQuotation flag
        const lowStockItems = data.items.filter(item => {
            const currentStock = StockService.getCurrentStock(item)
            const minStock = item.minStock || 0
            // Skip items without minStock defined
            if (minStock <= 0) return false
            // Skip items with auto-quotation explicitly disabled
            if (item.enableAutoQuotation === false) return false
            // Trigger when Estoque_Atual <= Estoque_Minimo
            return currentStock <= minStock && item.supplierId
        })

        if (lowStockItems.length === 0) {
            console.log('✅ Initial stock check: All items above minimum')
            return
        }

        console.log(`📦 Initial stock check: Found ${lowStockItems.length} item(s) below minimum`)

        // Trigger reorder events for each low stock item
        lowStockItems.forEach(item => {
            StockService.checkAndEmitReorderEvent(item)
        })
    } catch (error) {
        console.warn('⚠️ Initial stock check failed:', error.message)
    }
}

/**
 * Manually trigger quotation check for specific products
 * Useful for testing or manual batch processing
 */
export async function triggerQuotationCheck(products) {
    for (const product of products) {
        handleReorderEvent('NEEDS_REORDER', {
            productId: product.id,
            productName: product.name,
            category: product.category,
            currentStock: product.currentStock,
            quantityToOrder: product.quantityToOrder,
            unit: product.unit,
            supplierId: product.supplierId,
            supplierName: product.supplierName,
            supplierEmail: product.supplierEmail,
            currentPrice: product.currentPrice
        })
    }
}

/**
 * Get pending quotation count (for UI)
 */
export function getPendingCount() {
    let count = 0
    for (const products of pendingBySupplier.values()) {
        count += products.length
    }
    return count
}

/**
 * Force process pending quotations immediately
 */
export async function flushPending() {
    clearTimeout(debounceTimer)
    await processAllPendingQuotations()
}

// ═══════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════

export const AutoQuotationService = {
    init: initAutoQuotation,
    triggerCheck: triggerQuotationCheck,
    getPendingCount,
    flushPending
}

export default AutoQuotationService
