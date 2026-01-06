// ═══════════════════════════════════════════════════════════════════
// ANALYTICS STORE — Track metrics and generate insights
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
interface DailyMetric {
    date: string // YYYY-MM-DD
    totalIngredientCost: number
    totalProductsSold: number
    stockValue: number
    recipesCreated: number
}

interface AnalyticsState {
    // Daily metrics
    dailyMetrics: DailyMetric[]

    // Actions
    recordDailyMetric: (metric: Omit<DailyMetric, 'date'>) => void
    getWeeklyTrend: () => { percentChange: number; direction: 'up' | 'down' | 'neutral' }
    getMonthlyAverage: (field: keyof Omit<DailyMetric, 'date'>) => number
    getLast7DaysMetrics: () => DailyMetric[]
    getLast30DaysMetrics: () => DailyMetric[]
    clearOldMetrics: () => void
}

// Helper functions
const getTodayKey = (): string => new Date().toISOString().split('T')[0]!

const getDaysAgo = (days: number): string => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]!
}

// Store
export const useAnalyticsStore = create<AnalyticsState>()(
    persist(
        (set, get) => ({
            dailyMetrics: [],

            recordDailyMetric: (metric) => {
                const today = getTodayKey()
                set((state) => {
                    const existingIndex = state.dailyMetrics.findIndex(m => m.date === today)
                    if (existingIndex >= 0) {
                        // Update existing
                        const updated = [...state.dailyMetrics]
                        updated[existingIndex] = { ...metric, date: today }
                        return { dailyMetrics: updated }
                    }
                    // Add new
                    return { dailyMetrics: [...state.dailyMetrics, { ...metric, date: today }] }
                })
            },

            getWeeklyTrend: () => {
                const metrics = get().dailyMetrics
                const thisWeek = metrics.filter(m => m.date >= getDaysAgo(7))
                const lastWeek = metrics.filter(m => m.date >= getDaysAgo(14) && m.date < getDaysAgo(7))

                const thisWeekTotal = thisWeek.reduce((sum, m) => sum + m.totalIngredientCost, 0)
                const lastWeekTotal = lastWeek.reduce((sum, m) => sum + m.totalIngredientCost, 0)

                if (lastWeekTotal === 0) return { percentChange: 0, direction: 'neutral' as const }

                const percentChange = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
                return {
                    percentChange: Math.abs(percentChange),
                    direction: percentChange > 0 ? 'up' as const : percentChange < 0 ? 'down' as const : 'neutral' as const
                }
            },

            getMonthlyAverage: (field) => {
                const metrics = get().dailyMetrics.filter(m => m.date >= getDaysAgo(30))
                if (metrics.length === 0) return 0
                return metrics.reduce((sum, m) => sum + (m[field] as number), 0) / metrics.length
            },

            getLast7DaysMetrics: () => {
                const metrics = get().dailyMetrics
                return metrics.filter(m => m.date >= getDaysAgo(7)).sort((a, b) => a.date.localeCompare(b.date))
            },

            getLast30DaysMetrics: () => {
                const metrics = get().dailyMetrics
                return metrics.filter(m => m.date >= getDaysAgo(30)).sort((a, b) => a.date.localeCompare(b.date))
            },

            clearOldMetrics: () => {
                const cutoffDate = getDaysAgo(90) // Keep 90 days
                set((state) => ({
                    dailyMetrics: state.dailyMetrics.filter(m => m.date >= cutoffDate)
                }))
            },
        }),
        {
            name: 'padoca-analytics',
            version: 1,
        }
    )
)

// Selectors
export const useWeeklyTrend = () => useAnalyticsStore((state) => state.getWeeklyTrend())
export const useLast7DaysMetrics = () => useAnalyticsStore((state) => state.getLast7DaysMetrics())
export const useLast30DaysMetrics = () => useAnalyticsStore((state) => state.getLast30DaysMetrics())
