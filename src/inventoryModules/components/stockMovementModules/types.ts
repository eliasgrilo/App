// ═══════════════════════════════════════════════════════════════════
// STOCK MOVEMENT MODULES — Types & Constants
// ═══════════════════════════════════════════════════════════════════

export interface InventoryItem { id: number; name: string; packageQuantity: number; packageCount: number; unit: string; pricePerUnit: number }
export type UnitType = 'kg' | 'g' | 'L' | 'mL' | 'un'
export const UNITS: UnitType[] = ['kg', 'g', 'L', 'mL', 'un']
export const MOVEMENT_TYPES: Record<string, { label: string; color: string; isOut: boolean }> = { entrada: { label: 'Entrada', color: 'emerald', isOut: false }, saida: { label: 'Saída', color: 'red', isOut: true } }
export const REASON_BY_TYPE: Record<'entrada' | 'saida', string[]> = { entrada: ['Compra', 'Recebimento', 'Ajuste +', 'Devolução', 'Sobra de Produção'], saida: ['Produção', 'Venda', 'Perda', 'Ajuste -', 'Expirado'] }
export interface StockMovementModalProps { isOpen: boolean; onClose: () => void; items: InventoryItem[]; onSaveMovement: (data: { itemId: number; itemName: string; type: 'entrada' | 'saida'; quantity: number; unit: string; previousStock: number; newStock: number; costAtTime: number; reason: string }) => void; getStock: (item: InventoryItem) => number }
export interface MovementForm { type: 'entrada' | 'saida'; itemId: number; qty: string; unit: UnitType; reasonLabel: string; reasonNote: string }
