/**
 * ═══════════════════════════════════════════════════════════════════
 * SALES MODULE — Barrel Exports
 * Complete Apple Experience
 * ═══════════════════════════════════════════════════════════════════
 */

// Types
export type {
    Order,
    OrderItem,
    OrderStatus,
    DailyMetrics,
} from './types'

// Utilities
export {
    STATUS_CONFIG,
    generateMockOrders,
    calculateMetrics,
} from './types'

// Components (using barrel export)
export {
    SalesPage,
    CommandRing,
    LiveOrderFeed,
    TimelineView,
    QuickActions,
    SalesInsights
} from './components'
