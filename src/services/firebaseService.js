import { db } from "../firebase";
import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    getDoc,
    onSnapshot,
    where,
    runTransaction  // ACID: Import for atomic operations
} from "firebase/firestore";

/**
 * FirebaseService - FIXED QUOTATIONS LISTENER
 * BUG FIX: subscribeToQuotations now correctly processes snapshots
 * and forces card updates in real-time
 */

const COLLECTIONS = {
    RECIPES: "recipes",
    INVENTORY: "inventory",
    COSTS: "costs",
    SETTINGS: "settings",
    PIZZAS: "pizzas",
    RECIPES_V2: "recipes_v2",
    RECIPES_V3: "recipes_v3",
    KANBAN: "kanban",
    QUOTATIONS: "quotations"
};

const cleanPayload = (data) => {
    return JSON.parse(JSON.stringify(data));
};

export const FirebaseService = {
    // --- RECIPES ---
    async saveRecipe(id, data) {
        try {
            await setDoc(doc(db, COLLECTIONS.RECIPES, id), cleanPayload({
                ...data,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error saving recipe:", e);
            return false;
        }
    },

    async getAllRecipes() {
        try {
            const q = query(collection(db, COLLECTIONS.RECIPES), orderBy("updatedAt", "desc"));
            const snapshot = await getDocs(q);
            const recipes = {};
            snapshot.forEach(doc => {
                recipes[doc.id] = doc.data();
            });
            return recipes;
        } catch (e) {
            console.error("Error fetching recipes:", e);
            return {};
        }
    },

    async deleteRecipe(id) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.RECIPES, id));
            return true;
        } catch (e) {
            console.error("Error deleting recipe:", e);
            return false;
        }
    },

    // --- INVENTORY ---
    async syncInventory(items, categories) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "inventory_v2"), cleanPayload({
                items,
                categories,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing inventory:", e);
            return false;
        }
    },

    async getInventory() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "inventory_v2"));
            if (docSnap.exists()) return docSnap.data();

            const oldSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "inventory"));
            if (oldSnap.exists()) return { items: oldSnap.data().items, categories: null };

            return null;
        } catch (e) {
            console.error("Error getting inventory:", e);
            return null;
        }
    },

    // --- COSTS ---
    async syncCosts(costs, categories) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "costs_data"), cleanPayload({
                costs,
                categories,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing costs:", e);
            return false;
        }
    },

    async getCosts() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "costs_data"));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (e) {
            console.error("Error getting costs:", e);
            return null;
        }
    },

    // --- PIZZAS ---
    async syncPizzas(pizzas) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "ficha_tecnica"), cleanPayload({
                pizzas,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing pizzas:", e);
            return false;
        }
    },

    async getPizzas() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "ficha_tecnica"));
            return docSnap.exists() ? docSnap.data().pizzas : null;
        } catch (e) {
            console.error("Error getting pizzas:", e);
            return null;
        }
    },

    // --- GLOBAL SETTINGS ---
    async syncGlobalSettings(settings) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "global_config"), cleanPayload({
                ...settings,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing global settings:", e);
            return false;
        }
    },

    async getGlobalSettings() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "global_config"));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (e) {
            console.error("Error getting global settings:", e);
            return null;
        }
    },

    // --- RECIPES V2 ---
    async syncRecipesV2(recipes) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, COLLECTIONS.RECIPES_V2), cleanPayload({
                recipes,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing recipes v2:", e);
            return false;
        }
    },

    async getRecipesV2() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, COLLECTIONS.RECIPES_V2));
            return docSnap.exists() ? docSnap.data().recipes : null;
        } catch (e) {
            console.error("Error getting recipes v2:", e);
            return null;
        }
    },

    // --- RECIPES V3 ---
    async syncRecipeV3(id, recipe, merge = false) {
        try {
            await setDoc(doc(db, COLLECTIONS.RECIPES_V3, String(id)), cleanPayload({
                ...recipe,
                updatedAt: new Date().toISOString()
            }), { merge });
            return true;
        } catch (e) {
            console.error("Error syncing recipe v3:", e);
            return false;
        }
    },

    async getRecipesV3() {
        try {
            let snapshot;
            try {
                const q = query(collection(db, COLLECTIONS.RECIPES_V3), orderBy("updatedAt", "desc"));
                snapshot = await getDocs(q);
            } catch (indexError) {
                console.warn("Index not ready, fetching without order:", indexError.message);
                snapshot = await getDocs(collection(db, COLLECTIONS.RECIPES_V3));
            }

            const recipes = [];
            snapshot.forEach(doc => {
                recipes.push({ ...doc.data(), id: doc.id });
            });
            return recipes;
        } catch (e) {
            console.error("Error getting recipes v3:", e);
            return [];
        }
    },

    async deleteRecipeV3(id) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.RECIPES_V3, String(id)));
            return true;
        } catch (e) {
            console.error("Error deleting recipe v3:", e);
            return false;
        }
    },

    // --- KANBAN ---
    async syncKanban(board) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, COLLECTIONS.KANBAN), cleanPayload({
                ...board,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing kanban:", e);
            return false;
        }
    },

    async getKanban() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, COLLECTIONS.KANBAN));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (e) {
            console.error("Error getting kanban:", e);
            return null;
        }
    },

    // --- RECIPE CATEGORIES ---
    async syncRecipeCategories(categories) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "recipe_categories"), cleanPayload({
                categories,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing recipe categories:", e);
            return false;
        }
    },

    async getRecipeCategories() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "recipe_categories"));
            return docSnap.exists() ? docSnap.data().categories : null;
        } catch (e) {
            console.error("Error getting recipe categories:", e);
            return null;
        }
    },

    // --- SUPPLIERS ---
    async syncSuppliers(suppliers) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "suppliers"), cleanPayload({
                suppliers,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing suppliers:", e);
            return false;
        }
    },

    async getSuppliers() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "suppliers"));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (e) {
            console.error("Error getting suppliers:", e);
            return null;
        }
    },

    // --- PRODUCTS ---
    async syncProducts(products, categories) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "products_v1"), cleanPayload({
                products,
                categories,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing products:", e);
            return false;
        }
    },

    async getProducts() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "products_v1"));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (e) {
            console.error("Error getting products:", e);
            return null;
        }
    },

    // --- PRODUCT MOVEMENTS ---
    async syncProductMovements(movements) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "product_movements"), cleanPayload({
                movements,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing product movements:", e);
            return false;
        }
    },

    async getProductMovements() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "product_movements"));
            return docSnap.exists() ? docSnap.data().movements : [];
        } catch (e) {
            console.error("Error getting product movements:", e);
            return [];
        }
    },

    async addProductMovement(movement) {
        try {
            const existing = await this.getProductMovements();
            const updated = [...existing, { ...movement, id: Date.now(), createdAt: new Date().toISOString() }];
            await this.syncProductMovements(updated);
            return true;
        } catch (e) {
            console.error("Error adding product movement:", e);
            return false;
        }
    },

    /**
     * ACID-COMPLIANT: Atomic movement creation with stock update
     * Uses Firestore transaction to ensure both operations succeed or both fail
     * 
     * @param {Object} movement - Movement data { productId, type, quantity, ... }
     * @param {Object} stockUpdate - Stock update data { field, delta }
     * @returns {Promise<{success: boolean, movementId?: string, error?: string}>}
     */
    async addMovementWithStockUpdate(movement, stockUpdate = null) {
        try {
            const movementId = Date.now().toString();
            const movementData = {
                ...movement,
                id: movementId,
                createdAt: new Date().toISOString()
            };

            // If no stock update needed, just add movement
            if (!stockUpdate || !movement.productId) {
                const existing = await this.getProductMovements();
                await this.syncProductMovements([...existing, movementData]);
                return { success: true, movementId };
            }

            // ATOMIC TRANSACTION: Movement + Stock Update
            const inventoryRef = doc(db, COLLECTIONS.SETTINGS, "inventory_v2");
            const movementsRef = doc(db, COLLECTIONS.SETTINGS, "product_movements");

            await runTransaction(db, async (transaction) => {
                // Read current inventory state
                const inventoryDoc = await transaction.get(inventoryRef);
                const movementsDoc = await transaction.get(movementsRef);

                if (!inventoryDoc.exists()) {
                    throw new Error("Inventory not found");
                }

                const inventoryData = inventoryDoc.data();
                const items = inventoryData.items || [];
                const movements = movementsDoc.exists() ? (movementsDoc.data().movements || []) : [];

                // Find and update the product
                const productIndex = items.findIndex(item =>
                    item.id === movement.productId || item.id === String(movement.productId)
                );

                if (productIndex === -1) {
                    throw new Error(`Product ${movement.productId} not found in inventory`);
                }

                // Calculate stock change based on movement type
                const product = items[productIndex];
                const delta = movement.type === 'ENTRY'
                    ? movement.quantity
                    : -movement.quantity;

                // Update the stock field (packageCount or packageQuantity)
                const fieldToUpdate = stockUpdate?.field || 'packageCount';
                const currentValue = product[fieldToUpdate] || 0;
                const newValue = Math.max(0, currentValue + delta);

                items[productIndex] = {
                    ...product,
                    [fieldToUpdate]: newValue,
                    updatedAt: new Date().toISOString()
                };

                // Write both updates atomically
                transaction.set(inventoryRef, {
                    items,
                    categories: inventoryData.categories,
                    updatedAt: new Date().toISOString()
                });

                transaction.set(movementsRef, {
                    movements: [...movements, movementData],
                    updatedAt: new Date().toISOString()
                });

                console.log(`🔄 ATOMIC: Movement ${movementId} + Stock update (${fieldToUpdate}: ${currentValue} → ${newValue})`);
            });

            return { success: true, movementId };
        } catch (e) {
            console.error("❌ ATOMIC FAILED: Movement + stock update rolled back:", e);
            return {
                success: false,
                error: e.message,
                rollback: true
            };
        }
    },

    // --- PRODUCT AUDIT DATA ---
    async syncProductAuditData(auditData) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "product_audit"), cleanPayload({
                ...auditData,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing product audit data:", e);
            return false;
        }
    },

    async getProductAuditData() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "product_audit"));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (e) {
            console.error("Error getting product audit data:", e);
            return null;
        }
    },

    // --- NOTIFICATION SETTINGS ---
    async syncNotificationSettings(settings) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "notifications"), cleanPayload({
                ...settings,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing notification settings:", e);
            return false;
        }
    },

    async getNotificationSettings() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "notifications"));
            return docSnap.exists() ? docSnap.data() : {
                enabled: true,
                lowStockAlerts: true,
                priceAlerts: true,
                restockReminders: true,
                respectBusinessHours: true
            };
        } catch (e) {
            console.error("Error getting notification settings:", e);
            return null;
        }
    },

    // --- FORECAST DATA ---
    async syncForecastData(forecastData) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "forecast"), cleanPayload({
                ...forecastData,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing forecast data:", e);
            return false;
        }
    },

    async getForecastData() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "forecast"));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (e) {
            console.error("Error getting forecast data:", e);
            return null;
        }
    },

    // --- ANOMALY HISTORY ---
    async syncAnomalyHistory(anomalies) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "anomaly_history"), cleanPayload({
                anomalies,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing anomaly history:", e);
            return false;
        }
    },

    async getAnomalyHistory() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "anomaly_history"));
            return docSnap.exists() ? docSnap.data() : { anomalies: [] };
        } catch (e) {
            console.error("Error getting anomaly history:", e);
            return { anomalies: [] };
        }
    },

    // --- QUOTATIONS - REAL-TIME LISTENER - COMPLETELY REWRITTEN ---
    /**
     * Helper: Convert various timestamp formats to JavaScript Date objects
     * BUG #2 FIX: Robust timestamp conversion supporting all Firestore formats
     */
    convertTimestampToDate(field) {
        if (!field) return null;

        // Firestore Timestamp object (has toDate method)
        if (field.toDate && typeof field.toDate === 'function') {
            try {
                return field.toDate();
            } catch (e) {
                console.warn('Failed to convert Firestore timestamp:', e);
                return null;
            }
        }

        // ISO string
        if (typeof field === 'string') {
            try {
                const date = new Date(field);
                return isNaN(date.getTime()) ? null : date;
            } catch (e) {
                console.warn('Failed to parse date string:', field, e);
                return null;
            }
        }

        // Already a Date object
        if (field instanceof Date) {
            return isNaN(field.getTime()) ? null : field;
        }

        // Firestore Timestamp-like object with seconds/nanoseconds
        if (field.seconds !== undefined) {
            try {
                return new Date(field.seconds * 1000);
            } catch (e) {
                console.warn('Failed to convert timestamp object:', field, e);
                return null;
            }
        }

        console.warn('Unknown timestamp format:', field);
        return null;
    },

    /**
     * CRITICAL FIX: Real-time listener for quotation updates
     * This function is called from AI.jsx to detect email responses
     * BUG WAS: snapshot processing was not correctly extracting data
     * FIX: Properly map Firestore documents and convert timestamps
     * BUG #6 FIX: Added callback cleanup on unsubscribe
     */
    subscribeToQuotations(callback) {
        try {
            console.log('🔔 Initializing Firestore quotations listener...')

            const q = query(
                collection(db, COLLECTIONS.QUOTATIONS),
                orderBy("updatedAt", "desc")
            )

            // BUG #6 FIX: Store callback reference for cleanup
            let activeCallback = callback

            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    // Guard: Skip if callback was cleaned up
                    if (!activeCallback) return

                    console.log('📬 Snapshot received:', snapshot.size, 'documents')

                    const quotations = []
                    snapshot.forEach(doc => {
                        const data = doc.data()

                        // BUG #2 FIX: Convert all timestamp fields using robust helper
                        const quotation = {
                            id: doc.id,
                            ...data,
                            // Convert all timestamp fields with validation
                            createdAt: FirebaseService.convertTimestampToDate(data.createdAt),
                            updatedAt: FirebaseService.convertTimestampToDate(data.updatedAt),
                            replyReceivedAt: FirebaseService.convertTimestampToDate(data.replyReceivedAt),
                            responseReceivedAt: FirebaseService.convertTimestampToDate(data.responseReceivedAt),
                            quotedAt: FirebaseService.convertTimestampToDate(data.quotedAt)
                        }

                        quotations.push(quotation)

                        // DEBUG: Log each quotation for verification
                        console.log('📄 Quotation processed:', {
                            id: quotation.id,
                            supplierEmail: quotation.supplierEmail,
                            status: quotation.status,
                            hasReplyBody: !!(quotation.replyBody && quotation.replyBody.length > 0),
                            replyReceivedAt: quotation.replyReceivedAt,
                            createdAt: quotation.createdAt
                        })
                    })

                    console.log('✅ Processed quotations:', quotations.length)

                    // CRITICAL: Force callback execution with processed data
                    activeCallback(quotations)
                },
                (error) => {
                    console.error('❌ Error in quotations listener:', error)
                    // Return empty array on error to avoid breaking the UI
                    if (activeCallback) activeCallback([])
                }
            )

            console.log('✅ Quotations listener attached successfully')

            // BUG #6 FIX: Return enhanced unsubscribe that cleans up callback reference
            return () => {
                activeCallback = null // Clear callback reference to prevent memory leak
                unsubscribe()
            }
        } catch (e) {
            console.error('❌ Error setting up quotations listener:', e)
            return () => { } // Return no-op function
        }
    },

    /**
     * Get all auto-quote requests from Firestore
     * Used for AutoQuoteDashboard display in Gestão de Cotações
     */
    async getAutoQuoteRequests() {
        try {
            const q = query(
                collection(db, "autoQuoteRequests"),
                orderBy("createdAt", "desc")
            )
            const snapshot = await getDocs(q)
            const requests = []
            snapshot.forEach(doc => {
                const data = doc.data()
                // Skip soft-deleted items
                if (data.softDeleted) return
                requests.push({
                    id: doc.id,
                    ...data,
                    createdAt: this.convertTimestampToDate(data.createdAt),
                    updatedAt: this.convertTimestampToDate(data.updatedAt),
                    sentAt: this.convertTimestampToDate(data.sentAt),
                    replyReceivedAt: this.convertTimestampToDate(data.replyReceivedAt)
                })
            })
            console.log('📦 Loaded', requests.length, 'auto-quote requests from Firestore')
            return requests
        } catch (e) {
            console.error("Error getting auto-quote requests:", e)
            return []
        }
    },

    /**
     * Get all quotations from Firestore (one-time fetch)
     * Used for initial data load
     */
    async getQuotations() {
        try {
            const q = query(
                collection(db, COLLECTIONS.QUOTATIONS),
                orderBy("updatedAt", "desc")
            )
            const snapshot = await getDocs(q)
            const quotations = []
            snapshot.forEach(doc => {
                const data = doc.data()
                quotations.push({
                    id: doc.id,
                    ...data,
                    createdAt: this.convertTimestampToDate(data.createdAt),
                    updatedAt: this.convertTimestampToDate(data.updatedAt),
                    replyReceivedAt: this.convertTimestampToDate(data.replyReceivedAt),
                    responseReceivedAt: this.convertTimestampToDate(data.responseReceivedAt),
                    quotedAt: this.convertTimestampToDate(data.quotedAt)
                })
            })
            console.log('📦 Loaded', quotations.length, 'quotations from Firestore')
            return quotations
        } catch (e) {
            console.error("Error getting quotations:", e)
            return []
        }
    },

    async syncQuotation(id, data) {
        try {
            // CRITICAL FIX 2026-01-01: Removed { merge: true } to allow full document replacement
            // merge:true prevents arrays (like items[].quotedUnitPrice) from being updated
            await setDoc(doc(db, COLLECTIONS.QUOTATIONS, id), cleanPayload({
                ...data,
                updatedAt: new Date().toISOString()
            }));

            console.log('✅ Quotation synced to Firestore (full replace):', id)
            return true;
        } catch (e) {
            console.error("Error syncing quotation:", e);
            return false;
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // ORDERS - Phase 2: Email → Orders Automation
    // ═══════════════════════════════════════════════════════════════

    /**
     * Create or update an order from a quoted email
     * This moves the quotation to the "Orders" category with full history
     * 
     * IDEMPOTENCY: Checks if order already exists for this quotation before creating
     */
    async syncOrder(orderId, orderData) {
        try {
            // IDEMPOTENCY CHECK: Verify if order already exists for this quotation
            if (orderData.quotationId) {
                const existingQuery = query(
                    collection(db, "orders"),
                    where("quotationId", "==", orderData.quotationId)
                );
                const snapshot = await getDocs(existingQuery);
                if (!snapshot.empty) {
                    const existingOrder = snapshot.docs[0];
                    console.log(`⏭️ Order already exists for quotation ${orderData.quotationId}: ${existingOrder.id}`);
                    return {
                        success: true,
                        isDuplicate: true,
                        existingId: existingOrder.id,
                        order: { id: existingOrder.id, ...existingOrder.data() }
                    };
                }
            }

            await setDoc(doc(db, "orders", orderId), cleanPayload({
                ...orderData,
                updatedAt: new Date().toISOString()
            }), { merge: true });

            console.log('✅ Order synced to Firestore:', orderId);
            return { success: true, isDuplicate: false };
        } catch (e) {
            console.error("Error syncing order:", e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Get all orders
     */
    async getOrders() {
        try {
            const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const orders = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                orders.push({
                    id: doc.id,
                    ...data,
                    createdAt: this.convertTimestampToDate(data.createdAt),
                    updatedAt: this.convertTimestampToDate(data.updatedAt),
                    confirmedAt: this.convertTimestampToDate(data.confirmedAt),
                    deliveredAt: this.convertTimestampToDate(data.deliveredAt)
                });
            });
            return orders;
        } catch (e) {
            console.error("Error getting orders:", e);
            return [];
        }
    },

    /**
     * Subscribe to orders with real-time updates
     */
    subscribeToOrders(callback) {
        try {
            console.log('🔔 Initializing Firestore orders listener...');

            const q = query(
                collection(db, "orders"),
                orderBy("createdAt", "desc")
            );

            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    console.log('📦 Orders snapshot received:', snapshot.size, 'documents');

                    const orders = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        orders.push({
                            id: doc.id,
                            ...data,
                            createdAt: FirebaseService.convertTimestampToDate(data.createdAt),
                            updatedAt: FirebaseService.convertTimestampToDate(data.updatedAt),
                            confirmedAt: FirebaseService.convertTimestampToDate(data.confirmedAt),
                            deliveredAt: FirebaseService.convertTimestampToDate(data.deliveredAt)
                        });
                    });

                    console.log('✅ Processed orders:', orders.length);
                    callback(orders);
                },
                (error) => {
                    console.error('❌ Error in orders listener:', error);
                    callback([]);
                }
            );

            console.log('✅ Orders listener attached successfully');
            return unsubscribe;
        } catch (e) {
            console.error('❌ Error setting up orders listener:', e);
            return () => { };
        }
    },

    /**
     * Update order status with history tracking
     */
    async updateOrderStatus(orderId, newStatus, metadata = {}) {
        try {
            const docRef = doc(db, "orders", orderId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                console.error('Order not found:', orderId);
                return false;
            }

            const currentData = docSnap.data();
            const history = currentData.history || [];

            // Add status change to history
            history.push({
                status: newStatus,
                previousStatus: currentData.status,
                timestamp: new Date().toISOString(),
                ...metadata
            });

            await setDoc(docRef, cleanPayload({
                ...currentData,
                status: newStatus,
                history,
                updatedAt: new Date().toISOString(),
                ...metadata
            }), { merge: true });

            console.log(`✅ Order ${orderId} status updated: ${currentData.status} → ${newStatus}`);
            return true;
        } catch (e) {
            console.error("Error updating order status:", e);
            return false;
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // CLEANUP FUNCTIONS - Clear historical data
    // ═══════════════════════════════════════════════════════════════

    /**
     * Delete all quotations from Firestore
     * WARNING: Destructive operation - cannot be undone
     */
    async deleteAllQuotations() {
        try {
            console.log('🗑️ Deleting all quotations...');
            const snapshot = await getDocs(collection(db, COLLECTIONS.QUOTATIONS));
            let count = 0;

            for (const docSnap of snapshot.docs) {
                await deleteDoc(doc(db, COLLECTIONS.QUOTATIONS, docSnap.id));
                count++;
            }

            console.log(`✅ Deleted ${count} quotations`);
            return { success: true, count };
        } catch (e) {
            console.error("Error deleting quotations:", e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Delete all orders from Firestore
     * WARNING: Destructive operation - cannot be undone
     */
    async deleteAllOrders() {
        try {
            console.log('🗑️ Deleting all orders...');
            const snapshot = await getDocs(collection(db, "orders"));
            let count = 0;

            for (const docSnap of snapshot.docs) {
                await deleteDoc(doc(db, "orders", docSnap.id));
                count++;
            }

            console.log(`✅ Deleted ${count} orders`);
            return { success: true, count };
        } catch (e) {
            console.error("Error deleting orders:", e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Clear all historical data (quotations, orders, localStorage)
     * WARNING: Destructive operation - cannot be undone
     */
    async clearAllHistory() {
        console.log('═══════════════════════════════════════════════════════');
        console.log('🗑️ CLEARING ALL HISTORICAL DATA');
        console.log('═══════════════════════════════════════════════════════');

        const results = {
            quotations: await this.deleteAllQuotations(),
            orders: await this.deleteAllOrders()
        };

        // Clear localStorage
        try {
            localStorage.removeItem('padoca_sent_emails');
            localStorage.removeItem('padoca_quotations');
            console.log('✅ Cleared localStorage');
            results.localStorage = { success: true };
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            results.localStorage = { success: false, error: e.message };
        }

        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ CLEANUP COMPLETE');
        console.log('═══════════════════════════════════════════════════════');

        return results;
    }
};
