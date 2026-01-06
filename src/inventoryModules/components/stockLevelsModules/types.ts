// ═══════════════════════════════════════════════════════════════════
// STOCK LEVELS MODULES — Types & Constants (Apple Vision Pro Style)
// ═══════════════════════════════════════════════════════════════════

export interface InventoryItem { id: number; name: string; packageQuantity: number; packageCount: number; unit: string; pricePerUnit: number; category: string; minStock?: number; maxStock?: number; criticalStock?: number }
export type StockStatus = 'noLimit' | 'critical' | 'warning' | 'excess' | 'ok' | 'low' | 'high'
export interface StockLevelsSectionProps { items: InventoryItem[]; getStockStatus: (item: InventoryItem) => StockStatus; getTotalQuantity: (item: InventoryItem) => number; onConfigureItem: (item: InventoryItem) => void }

// Apple Vision Pro inspired color system
export const colorStyles = {
    red: {
        bg: 'rgba(255,59,48,0.05)',
        bgHover: 'rgba(255,59,48,0.08)',
        border: 'rgba(255,59,48,0.10)',
        color: '#FF3B30',
        pill: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-500/20'
    },
    orange: {
        bg: 'rgba(255,149,0,0.05)',
        bgHover: 'rgba(255,149,0,0.08)',
        border: 'rgba(255,149,0,0.10)',
        color: '#FF9500',
        pill: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20'
    },
    green: {
        bg: 'rgba(52,199,89,0.05)',
        bgHover: 'rgba(52,199,89,0.08)',
        border: 'rgba(52,199,89,0.10)',
        color: '#34C759',
        pill: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20'
    },
    gray: {
        bg: 'rgba(142,142,147,0.04)',
        bgHover: 'rgba(142,142,147,0.07)',
        border: 'rgba(142,142,147,0.08)',
        color: '#8E8E93',
        pill: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-700'
    }
}

export const statusColors: Record<string, string> = {
    low: '#FF3B30',
    warning: '#FF9500',
    high: '#5856D6',
    ok: '#34C759',
    adequate: '#34C759',
    noLimit: '#8E8E93'
}

export const statusLabels: Record<string, string> = {
    low: 'Crítico',
    warning: 'Baixo',
    high: 'Excesso',
    ok: 'OK',
    adequate: 'OK',
    noLimit: 'Sem limite'
}
