/**
 * ═══════════════════════════════════════════════════════════════════
 * SALES MODULE — Types & Interfaces
 * Apple-Level Design System for Sales Command Center
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════
// ORDER TYPES
// ═══════════════════════════════════════════════════════════════════

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export interface OrderItem {
    id: string
    name: string
    quantity: number
    unitPrice: number
    total: number
}

export interface Order {
    id: string
    orderNumber: string
    customerName: string
    items: OrderItem[]
    total: number
    status: OrderStatus
    createdAt: Date
    updatedAt: Date
    estimatedTime?: number // minutes
    notes?: string
    paymentMethod?: 'cash' | 'card' | 'pix'
}

// ═══════════════════════════════════════════════════════════════════
// METRICS TYPES
// ═══════════════════════════════════════════════════════════════════

export interface DailyMetrics {
    revenue: number
    revenueGoal: number
    revenueProgress: number // 0-100
    orderCount: number
    orderCountGoal: number
    averageTicket: number
    averageTicketGoal: number
    peakHour: number // 0-23
    peakHourOrders: number
}

export interface HourlyData {
    hour: number
    orders: number
    revenue: number
}

export interface StatusBreakdown {
    new: number
    preparing: number
    ready: number
    delivered: number
    cancelled: number
}

// ═══════════════════════════════════════════════════════════════════
// INSIGHT TYPES
// ═══════════════════════════════════════════════════════════════════

export type InsightType = 'success' | 'warning' | 'info' | 'opportunity'

export interface SalesInsight {
    id: string
    type: InsightType
    title: string
    description: string
    metric?: string
    trend?: 'up' | 'down' | 'stable'
}

// ═══════════════════════════════════════════════════════════════════
// UI STATE TYPES
// ═══════════════════════════════════════════════════════════════════

export type ViewMode = 'feed' | 'timeline' | 'grid'

export interface SalesState {
    orders: Order[]
    viewMode: ViewMode
    selectedOrderId: string | null
    filterStatus: OrderStatus | 'all'
    isLoading: boolean
    showNewOrderModal: boolean
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATION CONSTANTS
// ═══════════════════════════════════════════════════════════════════

export const SPRING_CONFIGS = {
    // Apple-level fluid motion
    ring: { type: 'spring' as const, stiffness: 60, damping: 15, mass: 1 },
    card: { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 },
    modal: { type: 'spring' as const, stiffness: 400, damping: 35, mass: 1 },
    quick: { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.5 },
} as const

export const EASING = {
    apple: [0.32, 0.72, 0, 1] as const,
    smooth: [0.4, 0, 0.2, 1] as const,
}

// ═══════════════════════════════════════════════════════════════════
// STATUS COLORS
// ═══════════════════════════════════════════════════════════════════

export const STATUS_CONFIG: Record<OrderStatus, {
    color: string
    bgLight: string
    bgDark: string
    label: string
    icon: string
}> = {
    new: {
        color: '#3B82F6',
        bgLight: 'bg-blue-50',
        bgDark: 'dark:bg-blue-500/10',
        label: 'Novo',
        icon: '🔵'
    },
    preparing: {
        color: '#F59E0B',
        bgLight: 'bg-amber-50',
        bgDark: 'dark:bg-amber-500/10',
        label: 'Preparando',
        icon: '🟡'
    },
    ready: {
        color: '#10B981',
        bgLight: 'bg-emerald-50',
        bgDark: 'dark:bg-emerald-500/10',
        label: 'Pronto',
        icon: '🟢'
    },
    delivered: {
        color: '#6B7280',
        bgLight: 'bg-zinc-100',
        bgDark: 'dark:bg-zinc-800',
        label: 'Entregue',
        icon: '✓'
    },
    cancelled: {
        color: '#EF4444',
        bgLight: 'bg-red-50',
        bgDark: 'dark:bg-red-500/10',
        label: 'Cancelado',
        icon: '✕'
    },
}

// ═══════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════

const PRODUCTS = [
    { name: 'Pizza Margherita', price: 45 },
    { name: 'Pizza Calabresa', price: 48 },
    { name: 'Pizza Quatro Queijos', price: 52 },
    { name: 'Pizza Pepperoni', price: 55 },
    { name: 'Calzone', price: 38 },
    { name: 'Focaccia', price: 28 },
    { name: 'Pão de Alho', price: 18 },
    { name: 'Refrigerante', price: 8 },
]

const CUSTOMERS = [
    'Maria Silva', 'João Santos', 'Ana Oliveira', 'Pedro Costa',
    'Carla Lima', 'Bruno Alves', 'Fernanda Dias', 'Ricardo Pinto',
    'Juliana Souza', 'Marcos Ferreira'
]

function randomId(): string {
    return Math.random().toString(36).substring(2, 10)
}

function randomFromArray<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!
}

function generateOrderItems(): OrderItem[] {
    const count = Math.floor(Math.random() * 3) + 1
    const items: OrderItem[] = []

    for (let i = 0; i < count; i++) {
        const product = randomFromArray(PRODUCTS)
        const quantity = Math.floor(Math.random() * 2) + 1
        items.push({
            id: randomId(),
            name: product.name,
            quantity,
            unitPrice: product.price,
            total: product.price * quantity
        })
    }

    return items
}

export function generateMockOrders(count: number = 20): Order[] {
    const orders: Order[] = []
    const now = new Date()
    const statuses: OrderStatus[] = ['new', 'preparing', 'ready', 'delivered']

    for (let i = 0; i < count; i++) {
        const items = generateOrderItems()
        const total = items.reduce((sum, item) => sum + item.total, 0)
        const hoursAgo = Math.random() * 10
        const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)

        orders.push({
            id: randomId(),
            orderNumber: `#${String(1000 + i).padStart(4, '0')}`,
            customerName: randomFromArray(CUSTOMERS),
            items,
            total,
            status: randomFromArray(statuses),
            createdAt,
            updatedAt: createdAt,
            estimatedTime: Math.floor(Math.random() * 20) + 15,
            paymentMethod: randomFromArray(['cash', 'card', 'pix'] as const)
        })
    }

    // Sort by creation time, newest first
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function generateMockInsights(): SalesInsight[] {
    return [
        {
            id: '1',
            type: 'success',
            title: 'Receita acima da meta',
            description: 'Você já atingiu 87% da meta diária às 18h',
            metric: '+23%',
            trend: 'up'
        },
        {
            id: '2',
            type: 'opportunity',
            title: 'Horário de pico identificado',
            description: 'Pico de vendas entre 12h-14h. Considere reforço.',
            metric: '12h-14h',
        },
        {
            id: '3',
            type: 'info',
            title: 'Ticket médio estável',
            description: 'R$ 68,50 em média por pedido hoje',
            metric: 'R$ 68,50',
            trend: 'stable'
        }
    ]
}

export function calculateMetrics(orders: Order[]): DailyMetrics {
    const delivered = orders.filter(o => o.status === 'delivered')
    const revenue = delivered.reduce((sum, o) => sum + o.total, 0)
    const revenueGoal = 5000

    // Calculate peak hour
    const hourCounts: Record<number, number> = {}
    orders.forEach(o => {
        const hour = o.createdAt.getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    let peakHour = 12
    let peakCount = 0
    Object.entries(hourCounts).forEach(([hour, count]) => {
        if (count > peakCount) {
            peakHour = parseInt(hour)
            peakCount = count
        }
    })

    return {
        revenue,
        revenueGoal,
        revenueProgress: Math.min((revenue / revenueGoal) * 100, 100),
        orderCount: orders.length,
        orderCountGoal: 80,
        averageTicket: orders.length > 0 ? revenue / delivered.length : 0,
        averageTicketGoal: 60,
        peakHour,
        peakHourOrders: peakCount
    }
}

export function getHourlyData(orders: Order[]): HourlyData[] {
    const data: HourlyData[] = []

    for (let hour = 8; hour <= 22; hour++) {
        const hourOrders = orders.filter(o => o.createdAt.getHours() === hour)
        data.push({
            hour,
            orders: hourOrders.length,
            revenue: hourOrders.reduce((sum, o) => sum + o.total, 0)
        })
    }

    return data
}

export function getStatusBreakdown(orders: Order[]): StatusBreakdown {
    return {
        new: orders.filter(o => o.status === 'new').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    }
}
