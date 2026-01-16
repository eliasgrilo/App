/**
 * InsightsPanelCard — AI Insights Display Component
 * 
 * Premium gradient panel showing AI-generated insights.
 * @author Padoca Engineering Team
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 }

interface Insight {
    id: string
    title: string
    description: string
    action?: string
}

interface InsightsPanelCardProps {
    insights: Insight[]
}

export const InsightsPanelCard: React.FC<InsightsPanelCardProps> = ({ insights }) => {
    if (insights.length === 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="
                relative overflow-hidden
                bg-gradient-to-br from-[#5856D6] via-[#AF52DE] to-[#FF2D55]
                rounded-[28px]
                p-6
                mb-8
            "
        >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <motion.div
                        animate={{
                            boxShadow: ['0 0 20px rgba(255,255,255,0.3)', '0 0 40px rgba(255,255,255,0.5)', '0 0 20px rgba(255,255,255,0.3)']
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    >
                        <Sparkles className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                        <h3 className="text-[18px] font-semibold text-white">Insights Inteligentes</h3>
                        <p className="text-[14px] text-white/70">Análise automática dos seus dados</p>
                    </div>
                </div>

                {/* Insights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {insights.slice(0, 4).map((insight, i) => (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="
                                p-4 rounded-2xl
                                bg-white/10 backdrop-blur-sm
                                border border-white/10
                                hover:bg-white/15 transition-colors
                            "
                        >
                            <h4 className="text-[15px] font-semibold text-white mb-1">{insight.title}</h4>
                            <p className="text-[13px] text-white/70">{insight.description}</p>
                            {insight.action && (
                                <div className="mt-2 flex items-center gap-1 text-[12px] text-white/90 font-medium">
                                    <Sparkles className="w-3 h-3" />
                                    {insight.action}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
