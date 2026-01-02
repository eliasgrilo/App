/**
 * Real-time Order Tracking Service
 * 
 * PREMIUM FEATURE #2: Zero-Latency Order Status Updates
 * Uses Firestore onSnapshot for instant order status updates without polling.
 * 
 * Features:
 * - Real-time order status changes
 * - Multi-subscriber support 
 * - Automatic reconnection on network issues
 * - Memory-efficient subscription management
 * 
 * Created: 2025-12-31 - Quotation Module Reengineering
 */

import { db } from '../firebase';
import {
    doc,
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot
} from 'firebase/firestore';
import { HapticService } from './hapticService';

// ═══════════════════════════════════════════════════════════════════════════
// ORDER STATUS FOR TRACKING
// ═══════════════════════════════════════════════════════════════════════════

export const ORDER_TRACKING_STATUS = {
    PENDING_CONFIRMATION: 'pending_confirmation',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

// Status labels in Portuguese
export const STATUS_LABELS = {
    [ORDER_TRACKING_STATUS.PENDING_CONFIRMATION]: 'Aguardando Confirmação',
    [ORDER_TRACKING_STATUS.CONFIRMED]: 'Pedido Confirmado',
    [ORDER_TRACKING_STATUS.PROCESSING]: 'Em Processamento',
    [ORDER_TRACKING_STATUS.SHIPPED]: 'Enviado',
    [ORDER_TRACKING_STATUS.OUT_FOR_DELIVERY]: 'Saiu para Entrega',
    [ORDER_TRACKING_STATUS.DELIVERED]: 'Entregue',
    [ORDER_TRACKING_STATUS.CANCELLED]: 'Cancelado'
};

// Status colors for UI
export const STATUS_COLORS = {
    [ORDER_TRACKING_STATUS.PENDING_CONFIRMATION]: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: '⏳' },
    [ORDER_TRACKING_STATUS.CONFIRMED]: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: '✅' },
    [ORDER_TRACKING_STATUS.PROCESSING]: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', icon: '🔄' },
    [ORDER_TRACKING_STATUS.SHIPPED]: { bg: 'bg-purple-500/10', text: 'text-purple-500', icon: '📦' },
    [ORDER_TRACKING_STATUS.OUT_FOR_DELIVERY]: { bg: 'bg-teal-500/10', text: 'text-teal-500', icon: '🚚' },
    [ORDER_TRACKING_STATUS.DELIVERED]: { bg: 'bg-green-500/10', text: 'text-green-500', icon: '🎉' },
    [ORDER_TRACKING_STATUS.CANCELLED]: { bg: 'bg-red-500/10', text: 'text-red-500', icon: '❌' }
};

// ═══════════════════════════════════════════════════════════════════════════
// REALTIME ORDER SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class RealtimeOrderServiceClass {
    constructor() {
        this.orderSubscriptions = new Map();
        this.allOrdersSubscription = null;
        this.supplierSubscriptions = new Map();
        this.statusChangeCallbacks = new Set();
    }

    /**
     * Subscribe to a single order's real-time updates
     * @param {string} orderId - Order ID to track
     * @param {Function} callback - Called on every status change
     * @returns {Function} Unsubscribe function
     */
    subscribeToOrder(orderId, callback) {
        // Check if already subscribed
        if (this.orderSubscriptions.has(orderId)) {
            console.log(`📡 Already subscribed to order: ${orderId}`);
            return this.orderSubscriptions.get(orderId).unsubscribe;
        }

        console.log(`📡 Subscribing to real-time order updates: ${orderId}`);

        const orderRef = doc(db, 'orders', orderId);
        let previousStatus = null;

        const unsubscribe = onSnapshot(
            orderRef,
            (docSnapshot) => {
                if (!docSnapshot.exists()) {
                    console.warn(`⚠️ Order ${orderId} not found`);
                    callback(null);
                    return;
                }

                const orderData = {
                    id: docSnapshot.id,
                    ...docSnapshot.data(),
                    // Normalize timestamps
                    createdAt: docSnapshot.data().createdAt?.toDate?.()?.toISOString() || docSnapshot.data().createdAt,
                    confirmedAt: docSnapshot.data().confirmedAt?.toDate?.()?.toISOString() || docSnapshot.data().confirmedAt,
                    deliveredAt: docSnapshot.data().deliveredAt?.toDate?.()?.toISOString() || docSnapshot.data().deliveredAt
                };

                // Detect status change
                if (previousStatus && previousStatus !== orderData.status) {
                    console.log(`📊 Order ${orderId} status changed: ${previousStatus} → ${orderData.status}`);
                    HapticService.trigger('notification');

                    // Notify all status change listeners
                    this.statusChangeCallbacks.forEach(cb => cb({
                        orderId,
                        previousStatus,
                        newStatus: orderData.status,
                        order: orderData
                    }));
                }

                previousStatus = orderData.status;
                callback(orderData);
            },
            (error) => {
                console.error(`❌ Order subscription error for ${orderId}:`, error);
                callback(null, error);
            }
        );

        // Store subscription
        this.orderSubscriptions.set(orderId, { unsubscribe, callback });

        return () => {
            console.log(`🔕 Unsubscribing from order: ${orderId}`);
            unsubscribe();
            this.orderSubscriptions.delete(orderId);
        };
    }

    /**
     * Subscribe to all orders with real-time updates
     * @param {Function} callback - Called on any order change
     * @param {Object} options - Filter options
     * @returns {Function} Unsubscribe function
     */
    subscribeToAllOrders(callback, options = {}) {
        const {
            status = null,
            supplierId = null,
            maxOrders = 50,
            onlyActive = true
        } = options;

        console.log(`📡 Subscribing to all orders (max: ${maxOrders})`);

        // Build query
        let q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc'),
            limit(maxOrders)
        );

        // Apply filters
        if (status) {
            q = query(
                collection(db, 'orders'),
                where('status', '==', status),
                orderBy('createdAt', 'desc'),
                limit(maxOrders)
            );
        }

        if (onlyActive) {
            q = query(
                collection(db, 'orders'),
                where('status', 'in', ['pending_confirmation', 'confirmed', 'processing', 'shipped', 'out_for_delivery']),
                orderBy('createdAt', 'desc'),
                limit(maxOrders)
            );
        }

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const orders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
                    confirmedAt: doc.data().confirmedAt?.toDate?.()?.toISOString() || doc.data().confirmedAt
                }));

                console.log(`📦 Real-time orders update: ${orders.length} orders`);
                callback(orders);
            },
            (error) => {
                console.error('❌ Orders subscription error:', error);
                callback([], error);
            }
        );

        this.allOrdersSubscription = unsubscribe;

        return () => {
            console.log('🔕 Unsubscribing from all orders');
            unsubscribe();
            this.allOrdersSubscription = null;
        };
    }

    /**
     * Subscribe to orders for a specific supplier
     * @param {string} supplierId - Supplier ID
     * @param {Function} callback - Called on any order change
     * @returns {Function} Unsubscribe function
     */
    subscribeToSupplierOrders(supplierId, callback) {
        if (this.supplierSubscriptions.has(supplierId)) {
            console.log(`📡 Already subscribed to supplier orders: ${supplierId}`);
            return this.supplierSubscriptions.get(supplierId).unsubscribe;
        }

        console.log(`📡 Subscribing to supplier orders: ${supplierId}`);

        const q = query(
            collection(db, 'orders'),
            where('supplierId', '==', supplierId),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const orders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(orders);
            },
            (error) => {
                console.error(`❌ Supplier orders subscription error:`, error);
                callback([], error);
            }
        );

        this.supplierSubscriptions.set(supplierId, { unsubscribe, callback });

        return () => {
            unsubscribe();
            this.supplierSubscriptions.delete(supplierId);
        };
    }

    /**
     * Register callback for any status change across all subscribed orders
     * @param {Function} callback - Called with { orderId, previousStatus, newStatus, order }
     * @returns {Function} Unregister function
     */
    onStatusChange(callback) {
        this.statusChangeCallbacks.add(callback);
        return () => this.statusChangeCallbacks.delete(callback);
    }

    /**
     * Get estimated delivery time based on current status
     * @param {Object} order - Order object
     * @returns {Object} { estimatedTime, confidence }
     */
    getEstimatedDelivery(order) {
        const now = new Date();
        const deliveryDate = order.deliveryDate || order.expectedDelivery;

        if (!deliveryDate) {
            return { estimatedTime: null, confidence: 0 };
        }

        const delivery = new Date(deliveryDate);
        const hoursUntil = (delivery - now) / (1000 * 60 * 60);

        // Adjust based on status
        let confidence = 0.5;
        switch (order.status) {
            case ORDER_TRACKING_STATUS.SHIPPED:
                confidence = 0.8;
                break;
            case ORDER_TRACKING_STATUS.OUT_FOR_DELIVERY:
                confidence = 0.95;
                break;
            case ORDER_TRACKING_STATUS.CONFIRMED:
                confidence = 0.7;
                break;
            case ORDER_TRACKING_STATUS.PENDING_CONFIRMATION:
                confidence = 0.4;
                break;
        }

        return {
            estimatedTime: delivery,
            hoursUntil: Math.max(0, hoursUntil),
            confidence,
            isOnTime: hoursUntil > 0,
            isDelayed: hoursUntil < 0
        };
    }

    /**
     * Calculate order progress percentage
     * @param {string} status - Order status
     * @returns {number} Progress 0-100
     */
    getProgressPercentage(status) {
        const progressMap = {
            [ORDER_TRACKING_STATUS.PENDING_CONFIRMATION]: 10,
            [ORDER_TRACKING_STATUS.CONFIRMED]: 25,
            [ORDER_TRACKING_STATUS.PROCESSING]: 40,
            [ORDER_TRACKING_STATUS.SHIPPED]: 60,
            [ORDER_TRACKING_STATUS.OUT_FOR_DELIVERY]: 80,
            [ORDER_TRACKING_STATUS.DELIVERED]: 100,
            [ORDER_TRACKING_STATUS.CANCELLED]: 0
        };
        return progressMap[status] || 0;
    }

    /**
     * Unsubscribe from all active subscriptions
     */
    unsubscribeAll() {
        console.log('🔕 Unsubscribing from all order tracking');

        // Unsubscribe from individual orders
        this.orderSubscriptions.forEach((sub, orderId) => {
            sub.unsubscribe();
        });
        this.orderSubscriptions.clear();

        // Unsubscribe from all orders feed
        if (this.allOrdersSubscription) {
            this.allOrdersSubscription();
            this.allOrdersSubscription = null;
        }

        // Unsubscribe from supplier feeds
        this.supplierSubscriptions.forEach((sub, supplierId) => {
            sub.unsubscribe();
        });
        this.supplierSubscriptions.clear();

        // Clear status change callbacks
        this.statusChangeCallbacks.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const RealtimeOrderService = new RealtimeOrderServiceClass();
export default RealtimeOrderService;
