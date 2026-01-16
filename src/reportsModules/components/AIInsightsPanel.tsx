/**
 * AIInsightsPanel — Simplified AI Insights Display
 * 
 * Displays auto-generated insights using the useInsightsGenerator hook.
 * Component is now < 100 lines after extracting logic to hook.
 * 
 * @author Padoca Engineering Team
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Package, DollarSign, Clock, Users } from 'lucide-react'
import type { Insight, InsightType, InsightCategory } from '../hooks/useInsightsGenerator'

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS: Record<InsightType, { bg: string; border: string; icon: string; iconBg: string }> = {
    success: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200/60', icon: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200/60', icon: 'text-amber-600', iconBg: 'bg-amber-100' },
    info: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200/60', icon: 'text-blue-600', iconBg: 'bg-blue-100' },
    action: { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200/60', icon: 'text-purple-600', iconBg: 'bg-purple-100' },
}

const ICONS: Record<InsightType, typeof TrendingUp> = { success: TrendingUp, warning: AlertTriangle, info: Lightbulb, action: Sparkles }
const CAT_ICONS: Record<InsightCategory, typeof Package> = { inventory: Package, finance: DollarSign, production: Clock, demand: Users }

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const InsightCard: React.FC<{ insight: Insight; index: number }> = ({ insight, index }) => {
    const c = COLORS[insight.type]
    const Icon = ICONS[insight.type]
    const CatIcon = CAT_ICONS[insight.category]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
            className={`p-4 rounded-2xl border ${c.bg} ${c.border} hover:shadow-md transition-shadow`}
        >
            <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                    <Icon className={`w-5 h-5 ${c.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{insight.title}</h4>
                        {insight.metric && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${c.iconBg} ${c.icon}`}>{insight.metric}</span>}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{insight.description}</p>
                    {insight.action && (
                        <div className="flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span className="font-medium text-purple-700 dark:text-purple-400">{insight.action}</span>
                        </div>
                    )}
                </div>
                <CatIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface AIInsightsPanelProps {
    insights: Insight[]
    className?: string
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insights, className = '' }) => {
    if (insights.length === 0) return null

    return (
        <div className={className}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-4">
                <motion.div
                    animate={{ boxShadow: ['0 0 15px rgba(147, 51, 234, 0.3)', '0 0 25px rgba(147, 51, 234, 0.5)', '0 0 15px rgba(147, 51, 234, 0.3)'] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center"
                >
                    <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Insights Inteligentes</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Análise automática dos seus dados</p>
                </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence>
                    {insights.map((insight, i) => <InsightCard key={insight.id} insight={insight} index={i} />)}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default AIInsightsPanel
