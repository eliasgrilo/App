/**
 * ReportHeader — Apple HIG Premium Page Header
 * 
 * Header for Reports page with Apple-style navigation and controls.
 * Features: frosted glass effect, spring animations, premium dropdown.
 * 
 * @author Padoca Engineering Team
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, ChevronDown, Check, TrendingUp, Trash2, Zap, DollarSign, Target, Clock, Truck, Wallet } from 'lucide-react'
import type { ReportType } from '../types'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

interface ReportHeaderProps {
    printButtonLabel: string
    selectedReports: ReportType[]
    showReportMenu: boolean
    onShowReportMenu: (show: boolean) => void
    onSelectAll: () => void
    onSelectNone: () => void
    onToggleReport: (id: ReportType) => void
    onPrint: () => void
    hasSelectedReports: boolean
    children?: React.ReactNode
}

const REPORTS = [
    { id: 'abc' as ReportType, label: 'Curva ABC', icon: TrendingUp },
    { id: 'breakage' as ReportType, label: 'Análise de Quebra', icon: Trash2 },
    { id: 'velocity' as ReportType, label: 'Giro de Estoque', icon: Zap },
    { id: 'margin' as ReportType, label: 'Margem', icon: DollarSign },
    { id: 'forecast' as ReportType, label: 'Previsão', icon: Target },
    { id: 'efficiency' as ReportType, label: 'Eficiência', icon: Clock },
    { id: 'suppliers' as ReportType, label: 'Fornecedores', icon: Truck },
    { id: 'cashflow' as ReportType, label: 'Fluxo Caixa', icon: Wallet },
]

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const ReportHeader: React.FC<ReportHeaderProps> = ({
    printButtonLabel,
    selectedReports,
    showReportMenu,
    onShowReportMenu,
    onSelectAll,
    onSelectNone,
    onToggleReport,
    onPrint,
    hasSelectedReports,
    children
}) => (
    <header
        className="sticky top-0 z-40 print:hidden"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}
    >
        {/* Frosted Glass Background */}
        <div className="absolute inset-0 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08]" />

        <div className="relative max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Title Section */}
                <div>
                    <h1 className="text-[28px] font-bold text-[#1d1d1f] dark:text-white tracking-[-0.02em]">
                        Relatórios
                    </h1>
                    <p className="text-[15px] text-[#86868b] tracking-[-0.01em]">
                        Análises e indicadores de gestão
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    {children}

                    {/* Print Button */}
                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onShowReportMenu(!showReportMenu)}
                            className="
                                flex items-center gap-2 px-4 py-2.5
                                rounded-[12px]
                                bg-[#1d1d1f] dark:bg-white
                                text-white dark:text-[#1d1d1f]
                                font-semibold text-[15px]
                                shadow-lg shadow-black/20
                                tracking-[-0.01em]
                            "
                        >
                            <Printer className="w-[18px] h-[18px]" />
                            <span>{printButtonLabel}</span>
                            <motion.span animate={{ rotate: showReportMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown className="w-4 h-4 opacity-60" />
                            </motion.span>
                        </motion.button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showReportMenu && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-40"
                                        onClick={() => onShowReportMenu(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className="
                                            absolute right-0 top-full mt-2 z-50
                                            w-[280px] p-3
                                            bg-white dark:bg-[#2c2c2e]
                                            rounded-[16px]
                                            border border-black/[0.06] dark:border-white/[0.08]
                                            shadow-[0_16px_48px_rgba(0,0,0,0.16)]
                                        "
                                    >
                                        {/* Quick Actions */}
                                        <div className="flex gap-2 mb-3">
                                            <button onClick={onSelectAll} className="flex-1 py-2 px-3 text-[13px] font-medium rounded-[10px] bg-[#f5f5f7] dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white hover:bg-[#e8e8ed] dark:hover:bg-[#48484a] transition-colors">
                                                Todos
                                            </button>
                                            <button onClick={onSelectNone} className="flex-1 py-2 px-3 text-[13px] font-medium rounded-[10px] bg-[#f5f5f7] dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white hover:bg-[#e8e8ed] dark:hover:bg-[#48484a] transition-colors">
                                                Nenhum
                                            </button>
                                        </div>

                                        {/* Report List */}
                                        <div className="space-y-1 max-h-64 overflow-y-auto border-t border-black/[0.06] dark:border-white/[0.08] pt-2">
                                            {REPORTS.map(({ id, label, icon: Icon }) => (
                                                <motion.button
                                                    key={id}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => onToggleReport(id)}
                                                    className="w-full flex items-center gap-3 p-2.5 rounded-[10px] hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c] transition-colors"
                                                >
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${selectedReports.includes(id) ? 'bg-[#007AFF]' : 'border-2 border-[#d1d1d6] dark:border-[#48484a]'}`}>
                                                        {selectedReports.includes(id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                    </div>
                                                    <Icon className="w-4 h-4 text-[#86868b]" />
                                                    <span className="text-[14px] text-[#1d1d1f] dark:text-white">{label}</span>
                                                </motion.button>
                                            ))}
                                        </div>

                                        {/* Print Button */}
                                        <button
                                            onClick={onPrint}
                                            disabled={!hasSelectedReports}
                                            className="
                                                w-full py-3 mt-3
                                                rounded-[12px]
                                                bg-[#007AFF]
                                                text-white text-[15px] font-semibold
                                                disabled:opacity-40 disabled:cursor-not-allowed
                                                hover:bg-[#0071e3]
                                                active:scale-[0.98]
                                                transition-all
                                                shadow-[0_2px_8px_rgba(0,122,255,0.3)]
                                            "
                                        >
                                            <Printer className="w-4 h-4 inline mr-2" />
                                            Imprimir Agora
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    </header>
)

export default ReportHeader
