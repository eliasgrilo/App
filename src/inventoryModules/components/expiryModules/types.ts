// ═══════════════════════════════════════════════════════════════════
// EXPIRY MONITORING MODULES — Types
// ═══════════════════════════════════════════════════════════════════

import { ExpiryData } from '../../../services/stockService'

export interface InventoryItem { id: number; name: string; packageQuantity: number; packageCount: number; unit: string; pricePerUnit: number; category: string; subcategory?: string | null; expiryDate?: string | null }
export interface ItemWithExpiry extends InventoryItem { expiryData: ExpiryData }
export interface ExpiryMonitoringSectionProps { items: InventoryItem[]; onConfigureItem: (item: InventoryItem) => void; getTotalQuantity: (item: InventoryItem) => number }
