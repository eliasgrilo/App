/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI INSIGHTS — Apple-Style Auto-Generated Intelligence
 * 
 * Intelligent insights panel with:
 * - Auto-generated natural language insights
 * - Pattern detection (trends, anomalies)
 * - Actionable recommendations
 * - Siri-like animated reveal
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Package, DollarSign, Clock, Users } from 'lucide-react'
import type { ABCAnalysis, BreakageAnalysis, VelocityAnalysis, MarginAnalysis, DemandForecast } from '../types'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type InsightType = 'success' | 'warning' | 'info' | 'action'
type InsightCategory = 'inventory' | 'finance' | 'production' | 'demand'

interface Insight {
    id: string
    type: InsightType
    category: InsightCategory
    title: string
    description: string
    metric?: string
    action?: string
    priority: number // 1-10, higher = more important
}

interface AIInsightsProps {
    abcData?: ABCAnalysis
    breakageData?: BreakageAnalysis
    velocityData?: VelocityAnalysis
    marginData?: MarginAnalysis
    forecastData?: DemandForecast
    maxInsights?: number
    className?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHT ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const INSIGHT_ICONS = {
    success: TrendingUp,
    warning: AlertTriangle,
    info: Lightbulb,
    action: Sparkles
}

const CATEGORY_ICONS = {
    inventory: Package,
    finance: DollarSign,
    production: Clock,
    demand: Users
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHT COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const INSIGHT_COLORS = {
    success: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200/60 dark:border-emerald-800/40',
        icon: 'text-emerald-600 dark:text-emerald-400',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50'
    },
    warning: {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200/60 dark:border-amber-800/40',
        icon: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50'
    },
    info: {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200/60 dark:border-blue-800/40',
        icon: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-100 dark:bg-blue-900/50'
    },
    action: {
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        border: 'border-purple-200/60 dark:border-purple-800/40',
        icon: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-100 dark:bg-purple-900/50'
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHT GENERATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const generateInsights = (
    abc?: ABCAnalysis,
    breakage?: BreakageAnalysis,
    velocity?: VelocityAnalysis,
    margin?: MarginAnalysis,
    forecast?: DemandForecast
): Insight[] => {
    const insights: Insight[] = []

    // ABC Analysis Insights
    if (abc) {
        const classAPercent = abc.totals.classA.percentage
        if (classAPercent > 75) {
            insights.push({
                id: 'abc-concentration',
                type: 'warning',
                category: 'inventory',
                title: 'Alta concentração em poucos itens',
                description: `${abc.totals.classA.count} ingredientes representam ${classAPercent.toFixed(0)}% do custo total. Considere diversificar fornecedores para reduzir riscos.`,
                metric: `${classAPercent.toFixed(0)}%`,
                action: 'Negociar contratos de longo prazo',
                priority: 8
            })
        }

        const topItem = abc.items[0]
        if (topItem && topItem.percentage > 20) {
            insights.push({
                id: 'abc-top-item',
                type: 'info',
                category: 'inventory',
                title: `${topItem.name} domina o orçamento`,
                description: `Este item sozinho representa ${topItem.percentage.toFixed(1)}% do custo total de insumos.`,
                metric: topItem.percentage.toFixed(1) + '%',
                priority: 6
            })
        }
    }

    // Breakage Insights
    if (breakage) {
        const wastePercent = breakage.totals.overallWastePercentage
        if (wastePercent > 10) {
            insights.push({
                id: 'breakage-high',
                type: 'warning',
                category: 'production',
                title: 'Desperdício acima do ideal',
                description: `Taxa de quebra de ${wastePercent.toFixed(1)}% está acima da meta de 10%. Isso representa R$ ${breakage.totals.totalLossValue.toLocaleString('pt-BR')} em perdas.`,
                metric: wastePercent.toFixed(1) + '%',
                action: 'Revisar processos de produção',
                priority: 9
            })
        } else if (wastePercent < 5) {
            insights.push({
                id: 'breakage-excellent',
                type: 'success',
                category: 'production',
                title: 'Excelente controle de desperdício',
                description: `Taxa de quebra de apenas ${wastePercent.toFixed(1)}%. Continue monitorando para manter esse padrão.`,
                metric: wastePercent.toFixed(1) + '%',
                priority: 5
            })
        }

        // Find worst item
        const worstItem = [...breakage.items].sort((a, b) => b.wastePercentage - a.wastePercentage)[0]
        if (worstItem && worstItem.wastePercentage > 20) {
            insights.push({
                id: 'breakage-worst-item',
                type: 'action',
                category: 'production',
                title: `${worstItem.name} precisa de atenção`,
                description: `Este produto tem ${worstItem.wastePercentage.toFixed(0)}% de desperdício. Ajuste a produção ou revise a previsão de vendas.`,
                action: 'Reduzir lote de produção',
                priority: 7
            })
        }
    }

    // Velocity Insights
    if (velocity) {
        const criticalCount = velocity.summary.criticalCount
        if (criticalCount > 0) {
            insights.push({
                id: 'velocity-critical',
                type: 'warning',
                category: 'inventory',
                title: `${criticalCount} item(ns) em estado crítico`,
                description: 'Itens próximos do vencimento ou com giro muito baixo precisam de ação imediata.',
                action: 'Usar em promoções ou doar',
                priority: 10
            })
        }

        const expiryRiskCount = velocity.summary.expiryRiskCount
        if (expiryRiskCount > 2) {
            insights.push({
                id: 'velocity-expiry',
                type: 'action',
                category: 'inventory',
                title: 'Risco de vencimento detectado',
                description: `${expiryRiskCount} ingredientes podem vencer antes de serem utilizados. Priorize no próximo ciclo de produção.`,
                priority: 9
            })
        }
    }

    // Margin Insights
    if (margin) {
        const avgMargin = margin.summary.avgMarginPercent
        if (avgMargin > 50) {
            insights.push({
                id: 'margin-healthy',
                type: 'success',
                category: 'finance',
                title: 'Margens saudáveis',
                description: `Margem média de ${avgMargin.toFixed(1)}% indica operação lucrativa. Top performer: ${margin.summary.topPerformer}.`,
                metric: avgMargin.toFixed(1) + '%',
                priority: 5
            })
        }

        if (margin.summary.criticalCount > 0) {
            insights.push({
                id: 'margin-critical',
                type: 'warning',
                category: 'finance',
                title: `${margin.summary.criticalCount} produto(s) com margem crítica`,
                description: `${margin.summary.bottomPerformer} e outros produtos têm margem abaixo de 20%. Considere revisar preços ou custos.`,
                action: 'Analisar composição de custos',
                priority: 8
            })
        }
    }

    // Forecast Insights
    if (forecast) {
        const accuracy = forecast.summary.overallAccuracy
        if (accuracy > 95) {
            insights.push({
                id: 'forecast-excellent',
                type: 'success',
                category: 'demand',
                title: 'Previsões muito precisas',
                description: `Acurácia de ${accuracy.toFixed(1)}% indica que o modelo está calibrado. Confie nas previsões para planejar produção.`,
                metric: accuracy.toFixed(1) + '%',
                priority: 4
            })
        } else if (accuracy < 85) {
            insights.push({
                id: 'forecast-low',
                type: 'action',
                category: 'demand',
                title: 'Previsões precisam de ajuste',
                description: `Acurácia de ${accuracy.toFixed(1)}% está abaixo do ideal. Considere adicionar mais dados históricos ou ajustar para sazonalidade.`,
                action: 'Revisar modelo de previsão',
                priority: 7
            })
        }

        if (forecast.summary.downTrendCount > forecast.summary.upTrendCount) {
            insights.push({
                id: 'forecast-downtrend',
                type: 'info',
                category: 'demand',
                title: 'Tendência de queda detectada',
                description: `${forecast.summary.downTrendCount} produtos estão em queda. Pode indicar sazonalidade ou mudança de preferência.`,
                priority: 6
            })
        }
    }

    // Sort by priority and return
    return insights.sort((a, b) => b.priority - a.priority)
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const InsightCard: React.FC<{ insight: Insight; index: number }> = ({ insight, index }) => {
    const colors = INSIGHT_COLORS[insight.type]
    const Icon = INSIGHT_ICONS[insight.type]
    const CategoryIcon = CATEGORY_ICONS[insight.category]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                delay: index * 0.1,
                duration: 0.4,
                type: 'spring',
                stiffness: 100
            }}
            className={`
                p-4 rounded-2xl border
                ${colors.bg} ${colors.border}
                hover:shadow-md transition-shadow duration-300
            `}
        >
            <div className="flex gap-3">
                {/* Icon */}
                <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${colors.iconBg}
                `}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                            {insight.title}
                        </h4>
                        {insight.metric && (
                            <span className={`
                                text-xs font-bold px-1.5 py-0.5 rounded-md
                                ${colors.iconBg} ${colors.icon}
                            `}>
                                {insight.metric}
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                        {insight.description}
                    </p>

                    {insight.action && (
                        <div className="flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span className="font-medium text-purple-700 dark:text-purple-400">
                                {insight.action}
                            </span>
                        </div>
                    )}
                </div>

                {/* Category indicator */}
                <div className="flex-shrink-0">
                    <CategoryIcon className="w-4 h-4 text-zinc-400" />
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const AIInsights: React.FC<AIInsightsProps> = ({
    abcData,
    breakageData,
    velocityData,
    marginData,
    forecastData,
    maxInsights = 4,
    className = ''
}) => {
    const insights = useMemo(() =>
        generateInsights(abcData, breakageData, velocityData, marginData, forecastData).slice(0, maxInsights),
        [abcData, breakageData, velocityData, marginData, forecastData, maxInsights]
    )

    if (insights.length === 0) return null

    return (
        <div className={`${className}`}>
            {/* Header with Siri-like glow */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 mb-4"
            >
                <div className="relative">
                    <motion.div
                        animate={{
                            boxShadow: [
                                '0 0 15px rgba(147, 51, 234, 0.3)',
                                '0 0 25px rgba(147, 51, 234, 0.5)',
                                '0 0 15px rgba(147, 51, 234, 0.3)'
                            ]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="
                            w-10 h-10 rounded-2xl
                            bg-gradient-to-br from-purple-500 to-pink-600
                            flex items-center justify-center
                        "
                    >
                        <Sparkles className="w-5 h-5 text-white" />
                    </motion.div>
                </div>
                <div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                        Insights Inteligentes
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Análise automática dos seus dados
                    </p>
                </div>
            </motion.div>

            {/* Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence>
                    {insights.map((insight, index) => (
                        <InsightCard key={insight.id} insight={insight} index={index} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default AIInsights
