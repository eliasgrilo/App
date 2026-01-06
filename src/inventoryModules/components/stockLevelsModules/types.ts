// ═══════════════════════════════════════════════════════════════════
// STOCK LEVELS MODULES — Types & Constants
// ═══════════════════════════════════════════════════════════════════

export interface InventoryItem { id: number; name: string; packageQuantity: number; packageCount: number; unit: string; pricePerUnit: number; category: string; minStock?: number; maxStock?: number; criticalStock?: number }
export type StockStatus = 'noLimit' | 'critical' | 'warning' | 'excess' | 'ok' | 'low' | 'high'
export interface StockLevelsSectionProps { items: InventoryItem[]; getStockStatus: (item: InventoryItem) => StockStatus; getTotalQuantity: (item: InventoryItem) => number; onConfigureItem: (item: InventoryItem) => void }

export const colorStyles = { red: { bg: 'rgba(255, 59, 48, 0.08)', border: 'rgba(255, 59, 48, 0.2)', color: '#FF3B30' }, orange: { bg: 'rgba(255, 149, 0, 0.08)', border: 'rgba(255, 149, 0, 0.2)', color: '#FF9500' }, green: { bg: 'rgba(52, 199, 89, 0.08)', border: 'rgba(52, 199, 89, 0.2)', color: '#34C759' }, gray: { bg: 'rgba(142, 142, 147, 0.08)', border: 'rgba(142, 142, 147, 0.2)', color: '#8E8E93' } }
export const statusColors: Record<string, string> = { low: '#FF3B30', warning: '#FF9500', high: '#5856D6', ok: '#34C759', adequate: '#34C759', noLimit: '#8E8E93' }
