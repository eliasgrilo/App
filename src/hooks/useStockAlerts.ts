// ═══════════════════════════════════════════════════════════════════
// STOCK ALERTS HOOK — Low stock notifications
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useCallback } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { useToast } from '../stores/useUIStore'
import type { InventoryItem } from '../inventoryModules/types'

interface StockAlert {
    id: string
    itemName: string
    currentStock: number
    minStock: number
    criticalStock: number
    unit: string
    severity: 'critical' | 'warning'
}

export function useStockAlerts() {
    const ingredients = useAppStore((state) => state.ingredients)
    const { show: showToast } = useToast()

    const alerts = useMemo<StockAlert[]>(() => {
        return ingredients
            .filter((item: InventoryItem) => {
                const totalStock = (item.packageQuantity || 0) * (item.packageCount || 0)
                const minStock = item.minStock || 0
                const criticalStock = item.criticalStock || 0
                return totalStock > 0 && (totalStock <= criticalStock || totalStock <= minStock)
            })
            .map((item: InventoryItem) => {
                const totalStock = (item.packageQuantity || 0) * (item.packageCount || 0)
                const criticalStock = item.criticalStock || 0
                return {
                    id: String(item.id),
                    itemName: item.name,
                    currentStock: totalStock,
                    minStock: item.minStock || 0,
                    criticalStock,
                    unit: item.unit,
                    severity: totalStock <= criticalStock ? 'critical' as const : 'warning' as const
                }
            })
            .sort((a: StockAlert, b: StockAlert) => {
                // Critical first
                if (a.severity === 'critical' && b.severity !== 'critical') return -1
                if (b.severity === 'critical' && a.severity !== 'critical') return 1
                return 0
            })
    }, [ingredients])

    const criticalCount = useMemo(() =>
        alerts.filter(a => a.severity === 'critical').length,
        [alerts])

    const warningCount = useMemo(() =>
        alerts.filter(a => a.severity === 'warning').length,
        [alerts])

    // Show notification for critical items on mount
    useEffect(() => {
        if (criticalCount > 0) {
            const timeout = setTimeout(() => {
                showToast(`⚠️ ${criticalCount} item${criticalCount > 1 ? 's' : ''} em estoque crítico!`)
            }, 2000)
            return () => clearTimeout(timeout)
        }
        return undefined
    }, [])

    const checkAndNotify = useCallback(() => {
        if (criticalCount > 0) {
            showToast(`⚠️ ${criticalCount} item${criticalCount > 1 ? 's' : ''} em estoque crítico!`)
        } else if (warningCount > 0) {
            showToast(`📦 ${warningCount} item${warningCount > 1 ? 's' : ''} com estoque baixo`)
        }
    }, [criticalCount, warningCount, showToast])

    return {
        alerts,
        criticalCount,
        warningCount,
        totalAlertCount: alerts.length,
        hasAlerts: alerts.length > 0,
        hasCriticalAlerts: criticalCount > 0,
        checkAndNotify,
    }
}

// Badge component for the sidebar
export function useStockAlertBadge(): { count: number; color: 'red' | 'amber' } | null {
    const { criticalCount, warningCount } = useStockAlerts()

    if (criticalCount > 0) {
        return { count: criticalCount, color: 'red' }
    }
    if (warningCount > 0) {
        return { count: warningCount, color: 'amber' }
    }
    return null
}
