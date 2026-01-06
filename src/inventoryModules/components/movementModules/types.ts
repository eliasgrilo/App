// ═══════════════════════════════════════════════════════════════════
// MOVEMENT REGISTRY MODULES — Types & Constants
// ═══════════════════════════════════════════════════════════════════

export interface StockMovement { id: number | string; itemId: number; itemName: string; type: string; quantity: number; unit?: string; previousStock?: number; newStock?: number; costAtTime?: number; reason?: string; timestamp: string }
export interface MovementRegistryProps { movements: StockMovement[]; onRemoveMovement: (movement: StockMovement) => void; onAddMovement: () => void }
export type Period = 'all' | 'today' | '7d' | '30d'
export const MOVEMENT_TYPES = { entrada: { label: 'Entrada', isOut: false }, saida: { label: 'Saída', isOut: true }, in: { label: 'Entrada', isOut: false }, out: { label: 'Saída', isOut: true } }
