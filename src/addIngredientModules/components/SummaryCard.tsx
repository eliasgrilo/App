// ═══════════════════════════════════════════════════════════════════
// ADD INGREDIENT MODULE — SummaryCard Component
// Premium glassmorphism summary card
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { Icons } from '../Icons'

export interface SummaryCardProps {
    total: string | number
    unit: string
    value: number
    hasAutoQuote: boolean
    formatCurrency: (val: number) => string
}

const formatNumber = (v: string | number): string => {
    if (!v) return ''
    const num = parseFloat(String(v))
    if (isNaN(num)) return String(v)
    return num.toLocaleString('en-CA', { maximumFractionDigits: 2 })
}

export function SummaryCard({ total, unit, value, hasAutoQuote, formatCurrency }: SummaryCardProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }} className="mx-4 mb-6 p-6 rounded-[24px] relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, rgba(28,28,30,0.95) 0%, rgba(0,0,0,0.98) 100%)', boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)' }}>
            <motion.div className="absolute -top-16 -right-16 w-32 h-32 rounded-full"
                style={{ background: hasAutoQuote ? 'radial-gradient(circle, rgba(0,122,255,0.5) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(88,86,214,0.4) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full" style={{ background: 'radial-gradient(circle, rgba(52,199,89,0.3) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} />

            {hasAutoQuote && (
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full"
                    style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.2) 0%, rgba(88,86,214,0.2) 100%)', boxShadow: '0 0 24px rgba(0,122,255,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                    <motion.span className="text-[#007aff]" animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>{Icons.sparkle}</motion.span>
                    <span className="text-[11px] font-bold text-[#007aff] uppercase tracking-wider">Auto Quote Ativo</span>
                </motion.div>
            )}

            <div className="relative z-10 mb-1"><span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Total em Estoque</span></div>
            <div className="relative z-10 flex items-baseline gap-2">
                <motion.span key={String(total)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[44px] font-bold text-white tabular-nums tracking-tight" style={{ fontFamily: '-apple-system, SF Pro Display, system-ui' }}>{formatNumber(total) || '0'}</motion.span>
                <span className="text-[18px] font-medium text-white/40">{unit}</span>
            </div>

            {value > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="relative z-10 mt-5 pt-5 border-t border-white/10">
                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Valor Total</span>
                    <div className="flex items-baseline gap-1 mt-1">
                        <motion.span key={value} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            className="text-[34px] font-bold text-[#30d158] tabular-nums tracking-tight" style={{ fontFamily: '-apple-system, SF Pro Display, system-ui' }}>{formatCurrency(value)}</motion.span>
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}
