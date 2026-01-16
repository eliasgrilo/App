/**
 * useInsightsGenerator — AI Insights Generation Hook
 * 
 * Extracts insight generation logic from AIInsights component.
 * Analyzes ABC, Breakage, Velocity, Margin, and Forecast data.
 * 
 * @author Padoca Engineering Team
 */

import { useMemo } from 'react'
import type { ABCAnalysis, BreakageAnalysis, VelocityAnalysis, MarginAnalysis, DemandForecast } from '../types'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type InsightType = 'success' | 'warning' | 'info' | 'action'
export type InsightCategory = 'inventory' | 'finance' | 'production' | 'demand'

export interface Insight {
    id: string
    type: InsightType
    category: InsightCategory
    title: string
    description: string
    metric?: string
    action?: string
    priority: number
}

interface UseInsightsGeneratorProps {
    abcData?: ABCAnalysis
    breakageData?: BreakageAnalysis
    velocityData?: VelocityAnalysis
    marginData?: MarginAnalysis
    forecastData?: DemandForecast
    maxInsights?: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHT GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

const generateABCInsights = (abc: ABCAnalysis): Insight[] => {
    const insights: Insight[] = []
    const classAPercent = abc.totals.classA.percentage

    if (classAPercent > 75) {
        insights.push({
            id: 'abc-concentration',
            type: 'warning',
            category: 'inventory',
            title: 'Alta concentração em poucos itens',
            description: `${abc.totals.classA.count} ingredientes representam ${classAPercent.toFixed(0)}% do custo.`,
            metric: `${classAPercent.toFixed(0)}%`,
            action: 'Negociar contratos',
            priority: 8
        })
    }
    return insights
}

const generateBreakageInsights = (breakage: BreakageAnalysis): Insight[] => {
    const insights: Insight[] = []
    const wastePercent = breakage.totals.overallWastePercentage

    if (wastePercent > 10) {
        insights.push({
            id: 'breakage-high',
            type: 'warning',
            category: 'production',
            title: 'Desperdício acima do ideal',
            description: `Taxa de ${wastePercent.toFixed(1)}% representa R$ ${breakage.totals.totalLossValue.toLocaleString('pt-BR')} em perdas.`,
            metric: `${wastePercent.toFixed(1)}%`,
            action: 'Revisar processos',
            priority: 9
        })
    } else if (wastePercent < 5) {
        insights.push({
            id: 'breakage-excellent',
            type: 'success',
            category: 'production',
            title: 'Controle de desperdício excelente',
            description: `Taxa de apenas ${wastePercent.toFixed(1)}%.`,
            metric: `${wastePercent.toFixed(1)}%`,
            priority: 5
        })
    }
    return insights
}

const generateVelocityInsights = (velocity: VelocityAnalysis): Insight[] => {
    const insights: Insight[] = []

    if (velocity.summary.criticalCount > 0) {
        insights.push({
            id: 'velocity-critical',
            type: 'warning',
            category: 'inventory',
            title: `${velocity.summary.criticalCount} item(ns) crítico(s)`,
            description: 'Itens próximos do vencimento precisam de ação.',
            action: 'Usar em promoções',
            priority: 10
        })
    }
    return insights
}

const generateMarginInsights = (margin: MarginAnalysis): Insight[] => {
    const insights: Insight[] = []

    if (margin.summary.avgMarginPercent > 50) {
        insights.push({
            id: 'margin-healthy',
            type: 'success',
            category: 'finance',
            title: 'Margens saudáveis',
            description: `Margem média de ${margin.summary.avgMarginPercent.toFixed(1)}%.`,
            metric: `${margin.summary.avgMarginPercent.toFixed(1)}%`,
            priority: 5
        })
    }

    if (margin.summary.criticalCount > 0) {
        insights.push({
            id: 'margin-critical',
            type: 'warning',
            category: 'finance',
            title: `${margin.summary.criticalCount} produto(s) com margem crítica`,
            description: 'Considere revisar preços ou custos.',
            action: 'Analisar custos',
            priority: 8
        })
    }
    return insights
}

const generateForecastInsights = (forecast: DemandForecast): Insight[] => {
    const insights: Insight[] = []

    if (forecast.summary.overallAccuracy > 95) {
        insights.push({
            id: 'forecast-excellent',
            type: 'success',
            category: 'demand',
            title: 'Previsões precisas',
            description: `Acurácia de ${forecast.summary.overallAccuracy.toFixed(1)}%.`,
            metric: `${forecast.summary.overallAccuracy.toFixed(1)}%`,
            priority: 4
        })
    }
    return insights
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useInsightsGenerator({
    abcData,
    breakageData,
    velocityData,
    marginData,
    forecastData,
    maxInsights = 4
}: UseInsightsGeneratorProps): Insight[] {
    return useMemo(() => {
        const allInsights: Insight[] = []

        if (abcData) allInsights.push(...generateABCInsights(abcData))
        if (breakageData) allInsights.push(...generateBreakageInsights(breakageData))
        if (velocityData) allInsights.push(...generateVelocityInsights(velocityData))
        if (marginData) allInsights.push(...generateMarginInsights(marginData))
        if (forecastData) allInsights.push(...generateForecastInsights(forecastData))

        return allInsights
            .sort((a, b) => b.priority - a.priority)
            .slice(0, maxInsights)
    }, [abcData, breakageData, velocityData, marginData, forecastData, maxInsights])
}

export default useInsightsGenerator
