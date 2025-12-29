/**
 * notificationService - Apple-Quality Smart Notification Service
 * Features: Push by event, priority levels, smart timing, history, batching
 */

import { useState, useEffect, useCallback } from 'react'

// Priority Levels
export const PRIORITY = {
    CRITICAL: { level: 4, sound: true, vibrate: true, persist: true, batch: false },
    HIGH: { level: 3, sound: true, vibrate: true, persist: false, batch: false },
    MEDIUM: { level: 2, sound: false, vibrate: true, persist: false, batch: true },
    LOW: { level: 1, sound: false, vibrate: false, persist: false, batch: true }
}

// Notification Types - Extended for premium features
export const NOTIFICATION_TYPES = {
    // Inventory
    LOW_STOCK: { id: 'low_stock', title: 'Estoque Baixo', icon: '⚠️', category: 'inventory', priority: PRIORITY.HIGH },
    OUT_OF_STOCK: { id: 'out_of_stock', title: 'Sem Estoque', icon: '🚨', category: 'inventory', priority: PRIORITY.CRITICAL },
    HIGH_STOCK: { id: 'high_stock', title: 'Estoque Alto', icon: '📦', category: 'inventory', priority: PRIORITY.MEDIUM },
    INACTIVITY: { id: 'inactivity', title: 'Produto Inativo', icon: '💤', category: 'inventory', priority: PRIORITY.LOW },

    // Pricing
    PRICE_SPIKE: { id: 'price_spike', title: 'Aumento de Preço', icon: '📈', category: 'price', priority: PRIORITY.HIGH },
    PRICE_DROP: { id: 'price_drop', title: 'Queda de Preço', icon: '📉', category: 'price', priority: PRIORITY.MEDIUM },
    PRICE_ANOMALY: { id: 'price_anomaly', title: 'Anomalia de Preço', icon: '🎯', category: 'anomaly', priority: PRIORITY.HIGH },

    // Forecasting
    RESTOCK_NEEDED: { id: 'restock_needed', title: 'Reposição Necessária', icon: '📦', category: 'forecast', priority: PRIORITY.MEDIUM },
    STOCKOUT_RISK: { id: 'stockout_risk', title: 'Risco de Ruptura', icon: '⏰', category: 'forecast', priority: PRIORITY.HIGH },
    RESTOCK_SUGGESTION: { id: 'restock_suggestion', title: 'Sugestão de Compra', icon: '💡', category: 'forecast', priority: PRIORITY.MEDIUM },

    // Activity
    DELIVERY_RECEIVED: { id: 'delivery_received', title: 'Entrega Recebida', icon: '✅', category: 'activity', priority: PRIORITY.LOW },
    MOVEMENT_REGISTERED: { id: 'movement_registered', title: 'Movimentação', icon: '↕️', category: 'activity', priority: PRIORITY.LOW },
    NOTE_ADDED: { id: 'note_added', title: 'Nota Adicionada', icon: '📝', category: 'activity', priority: PRIORITY.LOW },

    // Reports & Analytics
    REPORT_READY: { id: 'report_ready', title: 'Relatório Pronto', icon: '📄', category: 'reports', priority: PRIORITY.LOW },
    TREND_ALERT: { id: 'trend_alert', title: 'Tendência Detectada', icon: '📊', category: 'analytics', priority: PRIORITY.MEDIUM },
    ANOMALY_DETECTED: { id: 'anomaly_detected', title: 'Anomalia Detectada', icon: '🔍', category: 'anomaly', priority: PRIORITY.HIGH },

    // Supplier
    SUPPLIER_ISSUE: { id: 'supplier_issue', title: 'Problema com Fornecedor', icon: '🚛', category: 'supplier', priority: PRIORITY.HIGH }
}

// Smart Timing - Only notify during business hours
const isBusinessHours = () => {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()

    // Monday-Friday 7AM-9PM, Saturday 7AM-6PM
    if (day === 0) return false // Sunday - no notifications
    if (day === 6) return hour >= 7 && hour < 18 // Saturday
    return hour >= 7 && hour < 21 // Weekdays
}

// Notification Queue with History and Batching
class NotificationQueue {
    constructor() {
        this.queue = []
        this.processing = false
        this.history = []
        this.maxHistorySize = 100
        this.subscribers = new Map()
        this.batchQueue = []
        this.batchTimeout = null
        this.batchWindowMs = 60000 // 1 minute batch window
        this.settings = {
            enabled: true,
            respectBusinessHours: true,
            minInterval: 30000, // 30 seconds between notifications
            categories: {
                inventory: true,
                price: true,
                anomaly: true,
                forecast: true,
                activity: false, // Low priority by default
                reports: true,
                analytics: true,
                supplier: true
            },
            soundEnabled: true
        }
        this.lastNotification = 0
        this.loadHistory()
    }

    // Subscribe to notification events
    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set())
        }
        this.subscribers.get(event).add(callback)
        return () => this.subscribers.get(event)?.delete(callback)
    }

    // Emit event to subscribers
    emit(event, data) {
        this.subscribers.get(event)?.forEach(cb => {
            try { cb(data) } catch (e) { console.warn('Subscriber error:', e) }
        })
    }

    // Load history from localStorage
    loadHistory() {
        try {
            const saved = localStorage.getItem('notification_history')
            this.history = saved ? JSON.parse(saved) : []
        } catch {
            this.history = []
        }
    }

    // Save history to localStorage
    saveHistory() {
        try {
            localStorage.setItem('notification_history', JSON.stringify(this.history))
        } catch (e) {
            console.warn('Failed to save notification history:', e)
        }
    }

    // Add to history
    addToHistory(notification) {
        this.history.unshift({
            ...notification,
            read: false,
            dismissed: false
        })
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize)
        }
        this.saveHistory()
        this.emit('historyUpdated', this.history)
    }

    // Get unread count
    getUnreadCount() {
        return this.history.filter(n => !n.read && !n.dismissed).length
    }

    // Get unread notifications
    getUnread() {
        return this.history.filter(n => !n.read && !n.dismissed)
    }

    // Mark as read
    markAsRead(id) {
        const notification = this.history.find(n => n.id === id)
        if (notification) {
            notification.read = true
            notification.readAt = new Date().toISOString()
            this.saveHistory()
            this.emit('read', notification)
        }
        return notification
    }

    // Mark all as read
    markAllAsRead() {
        this.history.forEach(n => {
            if (!n.read) {
                n.read = true
                n.readAt = new Date().toISOString()
            }
        })
        this.saveHistory()
        this.emit('allRead')
    }

    // Dismiss notification
    dismiss(id) {
        const notification = this.history.find(n => n.id === id)
        if (notification) {
            notification.dismissed = true
            notification.dismissedAt = new Date().toISOString()
            this.saveHistory()
            this.emit('dismissed', notification)
        }
        return notification
    }

    // Clear all notifications
    clearAll() {
        this.history = []
        this.saveHistory()
        this.emit('cleared')
    }

    // Add to queue
    add(notification) {
        const fullNotification = {
            ...notification,
            timestamp: Date.now(),
            id: crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString()
        }

        // Check if category is enabled
        const typeConfig = notification.typeConfig
        if (typeConfig?.category && !this.settings.categories[typeConfig.category]) {
            return fullNotification
        }

        // Check if should batch
        if (notification.priority?.batch) {
            return this.addToBatch(fullNotification)
        }

        this.queue.push(fullNotification)
        this.process()
        return fullNotification
    }

    // Add to batch queue
    addToBatch(notification) {
        this.batchQueue.push(notification)

        if (!this.batchTimeout) {
            this.batchTimeout = setTimeout(() => this.flushBatch(), this.batchWindowMs)
        }

        return notification
    }

    // Flush batch queue
    flushBatch() {
        if (this.batchQueue.length === 0) {
            this.batchTimeout = null
            return
        }

        // Group by category
        const groups = new Map()
        this.batchQueue.forEach(n => {
            const key = n.typeConfig?.category || 'general'
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key).push(n)
        })

        // Create batch notifications
        groups.forEach((notifications, category) => {
            if (notifications.length === 1) {
                this.queue.push(notifications[0])
            } else {
                const batchNotification = {
                    id: crypto.randomUUID?.() || `batch_${Date.now()}`,
                    title: `${notifications.length} atualizações`,
                    body: notifications.slice(0, 3).map(n => n.title).join(', ') +
                        (notifications.length > 3 ? ` e mais ${notifications.length - 3}...` : ''),
                    icon: '📋',
                    priority: PRIORITY.LOW,
                    timestamp: Date.now(),
                    createdAt: new Date().toISOString(),
                    isBatch: true,
                    batchItems: notifications,
                    category
                }
                this.queue.push(batchNotification)
            }
        })

        this.batchQueue = []
        this.batchTimeout = null
        this.process()
    }

    // Process queue
    async process() {
        if (this.processing || this.queue.length === 0) return

        this.processing = true

        while (this.queue.length > 0) {
            const notification = this.queue.shift()

            // Check business hours
            if (this.settings.respectBusinessHours && !isBusinessHours()) {
                // Requeue critical notifications
                if (notification.priority?.level >= PRIORITY.CRITICAL.level) {
                    this.queue.push(notification)
                }
                continue
            }

            // Check interval
            const timeSinceLastNotification = Date.now() - this.lastNotification
            if (timeSinceLastNotification < this.settings.minInterval) {
                await new Promise(r => setTimeout(r, this.settings.minInterval - timeSinceLastNotification))
            }

            // Add to history and show
            this.addToHistory(notification)
            await this.show(notification)
            this.lastNotification = Date.now()
        }

        this.processing = false
    }

    // Show notification
    async show(notification) {
        // Emit for in-app listeners
        this.emit('notification', notification)

        // Browser Notification API
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const n = new Notification(notification.title, {
                    body: notification.body,
                    icon: notification.icon || '/icon-192.png',
                    badge: '/icon-72.png',
                    tag: notification.id,
                    requireInteraction: notification.priority?.persist || false,
                    silent: !notification.priority?.sound
                })

                n.onclick = () => {
                    window.focus()
                    this.markAsRead(notification.id)
                    if (notification.onClick) notification.onClick()
                    n.close()
                }

                // Auto-close non-persistent notifications
                if (!notification.priority?.persist) {
                    setTimeout(() => n.close(), 5000)
                }
            } catch (e) {
                console.warn('Notification failed:', e)
            }
        }

        // Play sound
        if (notification.priority?.sound && this.settings.soundEnabled) {
            this.playSound(notification.priority.level)
        }

        // Vibration API
        if (notification.priority?.vibrate && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100])
        }

        // Legacy callback
        if (notification.onShow) {
            notification.onShow(notification)
        }
    }

    // Play notification sound
    playSound(priorityLevel) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext
            if (!AudioContext) return

            const ctx = new AudioContext()
            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)

            if (priorityLevel >= 4) {
                // Critical - Alert tone
                oscillator.type = 'sine'
                oscillator.frequency.setValueAtTime(880, ctx.currentTime)
                oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
                gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
                gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25)
                oscillator.start(ctx.currentTime)
                oscillator.stop(ctx.currentTime + 0.25)
            } else if (priorityLevel >= 3) {
                // High - Chime
                oscillator.type = 'sine'
                oscillator.frequency.setValueAtTime(523, ctx.currentTime)
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
                gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15)
                oscillator.start(ctx.currentTime)
                oscillator.stop(ctx.currentTime + 0.15)
            }
        } catch (e) {
            // Audio not supported
        }
    }

    // Request permission
    async requestPermission() {
        if (!('Notification' in window)) {
            return false
        }

        if (Notification.permission === 'granted') {
            return true
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission()
            return permission === 'granted'
        }

        return false
    }

    // Update settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings }
        try {
            localStorage.setItem('notification_settings', JSON.stringify(this.settings))
        } catch (e) { }
    }

    // Load settings
    loadSettings() {
        try {
            const saved = localStorage.getItem('notification_settings')
            if (saved) this.settings = { ...this.settings, ...JSON.parse(saved) }
        } catch (e) { }
    }
}

// Singleton instance
const notificationQueue = new NotificationQueue()

// Service Functions
export const notificationService = {
    // Initialize
    async init() {
        notificationQueue.loadSettings()
        const hasPermission = await notificationQueue.requestPermission()
        console.log('Notification permission:', hasPermission)
        return hasPermission
    },

    // Subscribe to notification events
    subscribe(event, callback) {
        return notificationQueue.subscribe(event, callback)
    },

    // Send notification
    notify(type, data = {}) {
        const typeConfig = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.MOVEMENT_REGISTERED

        return notificationQueue.add({
            title: data.title || typeConfig.title,
            body: data.body || data.message,
            icon: typeConfig.icon,
            priority: data.priority || typeConfig.priority,
            typeConfig,
            onClick: data.onClick,
            onShow: data.onShow,
            productId: data.productId,
            data: data.data
        })
    },

    // Get notification history
    getHistory() {
        return notificationQueue.history
    },

    // Get unread count
    getUnreadCount() {
        return notificationQueue.getUnreadCount()
    },

    // Get unread notifications
    getUnread() {
        return notificationQueue.getUnread()
    },

    // Mark as read
    markAsRead(id) {
        return notificationQueue.markAsRead(id)
    },

    // Mark all as read
    markAllAsRead() {
        notificationQueue.markAllAsRead()
    },

    // Dismiss notification
    dismiss(id) {
        return notificationQueue.dismiss(id)
    },

    // Clear all
    clearAll() {
        notificationQueue.clearAll()
    },

    // === Inventory Notifications ===

    notifyLowStock(product) {
        this.notify('LOW_STOCK', {
            body: `${product.name}: ${product.currentStock || product.stock}/${product.minStock || 5} ${product.unit || 'un'}`,
            productId: product.id,
            data: { productId: product.id }
        })
    },

    notifyOutOfStock(product) {
        this.notify('OUT_OF_STOCK', {
            body: `${product.name} está sem estoque!`,
            productId: product.id,
            data: { productId: product.id }
        })
    },

    notifyHighStock(product, current, maximum) {
        this.notify('HIGH_STOCK', {
            body: `${product.name}: ${current} ${product.unit || 'un'} (máximo: ${maximum})`,
            productId: product.id,
            data: { productId: product.id, current, maximum }
        })
    },

    notifyInactivity(product, daysSinceLastMovement) {
        this.notify('INACTIVITY', {
            body: `${product.name}: sem movimentação há ${daysSinceLastMovement} dias`,
            productId: product.id,
            data: { productId: product.id, daysSinceLastMovement }
        })
    },

    // === Price Notifications ===

    notifyPriceSpike(product, change, newPrice, oldPrice) {
        this.notify('PRICE_SPIKE', {
            body: `${product.name}: +${Math.abs(change).toFixed(0)}% (R$ ${oldPrice?.toFixed(2) || '?'} → R$ ${newPrice?.toFixed(2) || '?'})`,
            productId: product.id,
            data: { productId: product.id, change, newPrice, oldPrice }
        })
    },

    notifyPriceDrop(product, change, newPrice, oldPrice) {
        this.notify('PRICE_DROP', {
            body: `${product.name}: ${Math.abs(change).toFixed(0)}% (R$ ${oldPrice?.toFixed(2) || '?'} → R$ ${newPrice?.toFixed(2) || '?'})`,
            productId: product.id,
            data: { productId: product.id, change, newPrice, oldPrice }
        })
    },

    notifyPriceAnomaly(product, details) {
        this.notify('PRICE_ANOMALY', {
            body: `${product.name}: ${details}`,
            productId: product.id,
            data: { productId: product.id, details }
        })
    },

    // === Forecast Notifications ===

    notifyRestockNeeded(product, daysUntilStockout) {
        this.notify('RESTOCK_NEEDED', {
            body: `${product.name}: estoque acaba em ${daysUntilStockout} dias`,
            productId: product.id,
            data: { productId: product.id, daysUntilStockout }
        })
    },

    notifyStockoutRisk(product, predictedDate, suggestedQuantity) {
        this.notify('STOCKOUT_RISK', {
            body: `${product.name}: ruptura prevista para ${predictedDate}. Pedir ${suggestedQuantity} ${product.unit || 'un'}`,
            productId: product.id,
            data: { productId: product.id, predictedDate, suggestedQuantity }
        })
    },

    notifyRestockSuggestion(product, quantity, reason) {
        this.notify('RESTOCK_SUGGESTION', {
            body: `${product.name}: sugerido pedir ${quantity} ${product.unit || 'un'}${reason ? ` - ${reason}` : ''}`,
            productId: product.id,
            data: { productId: product.id, quantity, reason }
        })
    },

    // === Activity Notifications ===

    notifyDeliveryReceived(product, quantity) {
        this.notify('DELIVERY_RECEIVED', {
            body: `${product.name}: +${quantity} ${product.unit || 'un'} recebido`,
            productId: product.id,
            data: { productId: product.id, quantity }
        })
    },

    notifyMovement(product, type, quantity) {
        const typeLabel = type === 'entrada' ? 'Entrada' : 'Saída'
        const sign = type === 'entrada' ? '+' : '-'
        this.notify('MOVEMENT_REGISTERED', {
            title: `${typeLabel} registrada`,
            body: `${product.name}: ${sign}${quantity} ${product.unit || 'un'}`,
            productId: product.id,
            data: { productId: product.id, type, quantity }
        })
    },

    notifyNoteAdded(product, notePreview) {
        this.notify('NOTE_ADDED', {
            body: `${product.name}: "${notePreview.slice(0, 50)}${notePreview.length > 50 ? '...' : ''}"`,
            productId: product.id,
            data: { productId: product.id, notePreview }
        })
    },

    // === Report & Analytics Notifications ===

    notifyReportReady(reportName, downloadUrl) {
        this.notify('REPORT_READY', {
            title: 'Relatório pronto',
            body: `${reportName} está pronto para download`,
            data: { reportName, downloadUrl },
            onClick: () => {
                if (downloadUrl) window.open(downloadUrl, '_blank')
            }
        })
    },

    notifyTrendAlert(product, trendType, details) {
        this.notify('TREND_ALERT', {
            body: `${product.name}: ${trendType} - ${details}`,
            productId: product.id,
            data: { productId: product.id, trendType, details }
        })
    },

    notifyAnomalyDetected(product, anomalyType, severity, details) {
        const type = severity === 'critical' ? 'ANOMALY_DETECTED' : 'TREND_ALERT'
        this.notify(type, {
            body: `${product.name}: ${anomalyType} - ${details}`,
            productId: product.id,
            data: { productId: product.id, anomalyType, severity, details }
        })
    },

    // === Supplier Notifications ===

    notifySupplierIssue(supplierName, issue) {
        this.notify('SUPPLIER_ISSUE', {
            title: 'Problema com fornecedor',
            body: `${supplierName}: ${issue}`,
            data: { supplierName, issue }
        })
    },

    // Update settings
    updateSettings(settings) {
        notificationQueue.updateSettings(settings)
    },

    // Get current settings
    getSettings() {
        return notificationQueue.settings
    }
}

// React Hook for notifications with state management
export const useNotifications = () => {
    const [unreadCount, setUnreadCount] = useState(notificationQueue.getUnreadCount())
    const [history, setHistory] = useState(notificationQueue.history)
    const [latestNotification, setLatestNotification] = useState(null)

    useEffect(() => {
        // Subscribe to notification events
        const unsubNotification = notificationQueue.subscribe('notification', (notification) => {
            setLatestNotification(notification)
            setUnreadCount(notificationQueue.getUnreadCount())
        })

        const unsubHistory = notificationQueue.subscribe('historyUpdated', (newHistory) => {
            setHistory([...newHistory])
            setUnreadCount(notificationQueue.getUnreadCount())
        })

        const unsubRead = notificationQueue.subscribe('read', () => {
            setUnreadCount(notificationQueue.getUnreadCount())
        })

        const unsubAllRead = notificationQueue.subscribe('allRead', () => {
            setUnreadCount(0)
            setHistory([...notificationQueue.history])
        })

        const unsubCleared = notificationQueue.subscribe('cleared', () => {
            setHistory([])
            setUnreadCount(0)
        })

        return () => {
            unsubNotification()
            unsubHistory()
            unsubRead()
            unsubAllRead()
            unsubCleared()
        }
    }, [])

    const notify = useCallback((type, data) => {
        return notificationService.notify(type, data)
    }, [])

    const requestPermission = useCallback(async () => {
        return await notificationService.init()
    }, [])

    const markAsRead = useCallback((id) => {
        notificationService.markAsRead(id)
    }, [])

    const markAllAsRead = useCallback(() => {
        notificationService.markAllAsRead()
    }, [])

    const dismiss = useCallback((id) => {
        notificationService.dismiss(id)
    }, [])

    const clearAll = useCallback(() => {
        notificationService.clearAll()
    }, [])

    return {
        // State
        unreadCount,
        history,
        latestNotification,

        // Core methods
        notify,
        requestPermission,

        // History management
        markAsRead,
        markAllAsRead,
        dismiss,
        clearAll,
        getUnread: () => notificationQueue.getUnread(),

        // Convenience notification methods
        notifyLowStock: notificationService.notifyLowStock.bind(notificationService),
        notifyOutOfStock: notificationService.notifyOutOfStock.bind(notificationService),
        notifyHighStock: notificationService.notifyHighStock.bind(notificationService),
        notifyInactivity: notificationService.notifyInactivity.bind(notificationService),
        notifyPriceSpike: notificationService.notifyPriceSpike.bind(notificationService),
        notifyPriceDrop: notificationService.notifyPriceDrop.bind(notificationService),
        notifyRestockNeeded: notificationService.notifyRestockNeeded.bind(notificationService),
        notifyStockoutRisk: notificationService.notifyStockoutRisk.bind(notificationService),
        notifyDeliveryReceived: notificationService.notifyDeliveryReceived.bind(notificationService),
        notifyMovement: notificationService.notifyMovement.bind(notificationService),
        notifyNoteAdded: notificationService.notifyNoteAdded.bind(notificationService),
        notifyReportReady: notificationService.notifyReportReady.bind(notificationService),
        notifyAnomalyDetected: notificationService.notifyAnomalyDetected.bind(notificationService)
    }
}

export default notificationService
