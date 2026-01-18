/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE SUPPLIER REPORT DATA — Hook to generate report data from real suppliers
 * Uses actual supplier data from the store, including images
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useMemo } from 'react'
import { useSuppliers } from '../../stores/useAppStore'
import type { SupplierAnalysis, SupplierItem, SupplierRating } from '../types'
import { MOCK_SUPPLIER_ANALYSIS } from '../mockReportsData'

/**
 * Generates supplier analysis data from real suppliers in the store
 * Falls back to mock data if no real suppliers exist
 */
export function useSupplierReportData(): SupplierAnalysis {
    const storeSuppliers = useSuppliers()

    return useMemo(() => {
        // If we have real suppliers, generate report data from them
        if (storeSuppliers.length > 0) {
            const items: SupplierItem[] = storeSuppliers.map((supplier, index) => {
                // Generate mock metrics for each real supplier
                const qualityScore = 7 + Math.random() * 3 // 7-10
                const onTimeRate = 75 + Math.random() * 25 // 75-100%
                const dependencyRisk = Math.random() * 100

                // Calculate rating based on quality and on-time rate
                let overallRating: SupplierRating = 'C'
                if (qualityScore >= 8.5 && onTimeRate >= 90) overallRating = 'A'
                else if (qualityScore >= 7.5 && onTimeRate >= 80) overallRating = 'B'
                else if (qualityScore < 7 || onTimeRate < 70) overallRating = 'D'

                return {
                    id: typeof supplier.id === 'number' ? supplier.id : index + 1,
                    name: supplier.name,
                    category: typeof supplier.category === 'string' ? supplier.category : 'Geral',
                    totalPurchases: 5000 + Math.random() * 20000,
                    avgDeliveryTime: 1 + Math.random() * 4,
                    onTimeDeliveryRate: onTimeRate,
                    qualityScore,
                    priceCompetitiveness: -15 + Math.random() * 30,
                    dependencyRisk,
                    overallRating,
                    image: supplier.image // REAL image from store!
                }
            })

            const totalSuppliers = items.length
            const totalSpend = items.reduce((sum, i) => sum + i.totalPurchases, 0)

            return {
                items,
                summary: {
                    totalSuppliers,
                    totalSpend,
                    avgDeliveryTime: items.reduce((s, i) => s + i.avgDeliveryTime, 0) / totalSuppliers,
                    avgOnTimeRate: items.reduce((s, i) => s + i.onTimeDeliveryRate, 0) / totalSuppliers,
                    avgQualityScore: items.reduce((s, i) => s + i.qualityScore, 0) / totalSuppliers,
                    ratingACount: items.filter(i => i.overallRating === 'A').length,
                    ratingBCount: items.filter(i => i.overallRating === 'B').length,
                    ratingCCount: items.filter(i => i.overallRating === 'C').length,
                    ratingDCount: items.filter(i => i.overallRating === 'D').length,
                    highDependencyCount: items.filter(i => i.dependencyRisk >= 75).length
                }
            }
        }

        // Fallback to mock data if no real suppliers
        return MOCK_SUPPLIER_ANALYSIS
    }, [storeSuppliers])
}

export default useSupplierReportData
