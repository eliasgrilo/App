// ═══════════════════════════════════════════════════════════════════
// ITEM CONFIG MODULES — Types & Utils
// ═══════════════════════════════════════════════════════════════════

export interface InventoryItem { id: number; name: string; packageQuantity: number; packageCount: number; unit: string; pricePerUnit: number; category: string; minStock?: number; maxStock?: number; criticalStock?: number }
export type StockStatus = 'noLimit' | 'critical' | 'warning' | 'excess' | 'ok' | 'low' | 'high'
export interface ItemConfigModalProps { item: InventoryItem | null; onClose: () => void; onUpdateItem: (id: number, field: string, value: string | number) => void; getStockStatus: (item: InventoryItem) => StockStatus; getTotalQuantity: (item: InventoryItem) => number }

export const getGradient = (status: StockStatus) => { if (status === 'low') return 'linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)'; if (status === 'warning') return 'linear-gradient(135deg, #FF9F0A 0%, #FF6B00 100%)'; if (status === 'high') return 'linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)'; return 'linear-gradient(135deg, #34C759 0%, #30D158 100%)' }
export const getShadow = (status: StockStatus) => { if (status === 'low') return '0 8px 24px rgba(255,59,48,0.4)'; if (status === 'warning') return '0 8px 24px rgba(255,159,10,0.4)'; if (status === 'high') return '0 8px 24px rgba(88,86,214,0.4)'; return '0 8px 24px rgba(52,199,89,0.4)' }
