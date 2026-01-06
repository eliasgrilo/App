/**
 * ═══════════════════════════════════════════════════════════════════
 * useAutoQuotation — Auto-quotation monitoring hook
 * Stable signature-based approach to prevent infinite loops
 * Only triggers when low-stock signature changes
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef } from 'react'
import type { InventoryItem } from '../types'
import { getCurrentStock } from '../../services/stockService'

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

/**
 * Monitors inventory items for low stock and triggers auto-quotation events
 * Uses a stable signature approach to prevent re-triggering on every render
 */
export function useAutoQuotation(items: InventoryItem[]): void {
    const lowStockSignatureRef = useRef('')

    useEffect(() => {
        // Skip on initial empty state
        if (items.length === 0) return

        // Check each item for low stock - trigger if has supplier
        // Exception handling: Items without minStock defined (minStock <= 0) are skipped
        const lowStockItems = items.filter(item => {
            const currentStock = getCurrentStock(item)
            const minStock = item.minStock || 0
            // Guard: Skip items without minStock defined to prevent loop issues with zero-stock items
            if (minStock <= 0) return false
            // Trigger when Estoque_Atual <= Estoque_Minimo
            return currentStock <= minStock && item.supplierId
        })

        // Create a stable signature: sorted IDs + their current stock levels
        const newSignature = lowStockItems
            .map(item => `${item.id}:${getCurrentStock(item)}`)
            .sort()
            .join('|')

        // Only trigger events if the signature actually changed
        if (newSignature === lowStockSignatureRef.current) {
            return // No change, skip event emission
        }

        // Update signature reference
        lowStockSignatureRef.current = newSignature

        if (lowStockItems.length > 0) {
            console.log(
                `🔔 Auto-Quotation: Found ${lowStockItems.length} item(s) below minimum stock:`,
                lowStockItems.map(i => i.name).join(', ')
            )
        }
    }, [items])
}

export default useAutoQuotation
