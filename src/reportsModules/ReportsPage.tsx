/**
 * ReportsPage — Apple Premium Analytics Dashboard
 * 
 * State-of-the-art reports experience refactored for maintainability.
 * Components extracted to individual files following Apple HIG standards.
 * 
 * @author Padoca Engineering Team
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
    TrendingUp, Zap, Trash2, DollarSign, Target, Clock, Truck, Wallet,
    Printer, ChevronDown, Check
} from 'lucide-react'

// Hooks
import { useReportsState } from './hooks/useReportsState'
import { useInsightsGenerator } from './hooks/useInsightsGenerator'
import { useReportsPrint } from './hooks/useReportsPrint'
import { usePreferences } from './hooks/useAppleHIG'

// Extracted Components
import { KPICard } from './components/KPICard'
import { ReportSectionCard } from './components/ReportSectionCard'
import { InsightsPanelCard } from './components/InsightsPanelCard'
import { DateRangePicker } from './components/DateRangePicker'

// Chart Components
import { ABCAnalysisChart } from './components/ABCAnalysisChart'
import { BreakageAnalysisChart } from './components/BreakageAnalysisChart'
import { VelocityChart } from './components/VelocityChart'
import { MarginAnalysisChart } from './components/MarginAnalysisChart'
import { DemandForecastChart } from './components/DemandForecastChart'
import { ProductionEfficiencyChart } from './components/ProductionEfficiencyChart'
import { SupplierAnalysisChart } from './components/SupplierAnalysisChart'
import { CashFlowChart } from './components/CashFlowChart'

// Premium Components
import { GradientText, PageEntrance } from './components/premium'

// Functionality Components
import { PeriodComparisonToggle, OfflineIndicator } from './components/FunctionalityComponents'
import { LiveDataIndicator, SaveIndicator, AIInsightsCard } from './components/AppleHIGComponents'

// Data
import {
    MOCK_ABC_ANALYSIS, MOCK_BREAKAGE_ANALYSIS, MOCK_VELOCITY_ANALYSIS,
    MOCK_MARGIN_ANALYSIS, MOCK_DEMAND_FORECAST, MOCK_PRODUCTION_EFFICIENCY,
    MOCK_SUPPLIER_ANALYSIS, MOCK_CASHFLOW_ANALYSIS,
    formatCurrency, formatPercent, COMPARISON_DATA,
} from './mockReportsData'

import type { ReportType } from './types'

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 }

const REPORTS_CONFIG = [
    { id: 'abc' as ReportType, title: 'Curva ABC', desc: 'Classificação de insumos', icon: <TrendingUp className="w-7 h-7" />, gradient: 'from-[#007AFF] to-[#5856D6]', component: ABCAnalysisChart, data: MOCK_ABC_ANALYSIS },
    { id: 'breakage' as ReportType, title: 'Análise de Quebra', desc: 'Desperdício por produto', icon: <Trash2 className="w-7 h-7" />, gradient: 'from-[#FF3B30] to-[#FF2D55]', component: BreakageAnalysisChart, data: MOCK_BREAKAGE_ANALYSIS },
    { id: 'velocity' as ReportType, title: 'Giro de Estoque', desc: 'Velocidade de consumo', icon: <Zap className="w-7 h-7" />, gradient: 'from-[#FF9500] to-[#FFCC00]', component: VelocityChart, data: MOCK_VELOCITY_ANALYSIS },
    { id: 'margin' as ReportType, title: 'Margem', desc: 'Lucratividade', icon: <DollarSign className="w-7 h-7" />, gradient: 'from-[#34C759] to-[#30D158]', component: MarginAnalysisChart, data: MOCK_MARGIN_ANALYSIS },
    { id: 'forecast' as ReportType, title: 'Previsão', desc: 'Projeção de vendas', icon: <Target className="w-7 h-7" />, gradient: 'from-[#AF52DE] to-[#BF5AF2]', component: DemandForecastChart, data: MOCK_DEMAND_FORECAST },
    { id: 'efficiency' as ReportType, title: 'Eficiência', desc: 'Performance', icon: <Clock className="w-7 h-7" />, gradient: 'from-[#5AC8FA] to-[#64D2FF]', component: ProductionEfficiencyChart, data: MOCK_PRODUCTION_EFFICIENCY },
    { id: 'suppliers' as ReportType, title: 'Fornecedores', desc: 'Avaliação', icon: <Truck className="w-7 h-7" />, gradient: 'from-[#636366] to-[#8E8E93]', component: SupplierAnalysisChart, data: MOCK_SUPPLIER_ANALYSIS },
    { id: 'cashflow' as ReportType, title: 'Fluxo de Caixa', desc: 'Financeiro', icon: <Wallet className="w-7 h-7" />, gradient: 'from-[#5856D6] to-[#007AFF]', component: CashFlowChart, data: MOCK_CASHFLOW_ANALYSIS },
]

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const ReportsPage: React.FC = () => {
    const {
        dateRange, setDateRange, selectedReports, toggleReport,
        selectAllReports, selectNoReports, showReportMenu, setShowReportMenu,
        printButtonLabel, hasSelectedReports
    } = useReportsState()

    const insights = useInsightsGenerator({
        abcData: MOCK_ABC_ANALYSIS,
        breakageData: MOCK_BREAKAGE_ANALYSIS,
        velocityData: MOCK_VELOCITY_ANALYSIS,
        marginData: MOCK_MARGIN_ANALYSIS,
        forecastData: MOCK_DEMAND_FORECAST,
    })

    const [comparisonPeriod, setComparisonPeriod] = useState<'none' | 'lastMonth' | 'lastQuarter' | 'lastYear'>('none')
    const { preferences, updatePreference, lastSaved, isSaving } = usePreferences()
    const [lastDataUpdate] = useState(new Date())
    const [aiInsights, setAiInsights] = useState<{ type: 'trend' | 'alert' | 'opportunity' | 'tip', title: string, description: string }[]>([])
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)

    const generateInsights = () => {
        setIsGeneratingInsights(true)
        setTimeout(() => {
            setAiInsights([
                { type: 'trend', title: 'Tendência de Alta', description: 'Margem aumentou 3.2% nos últimos 30 dias' },
                { type: 'alert', title: 'Atenção ao Desperdício', description: 'Croissant tem 18% de quebra, acima da média' },
                { type: 'opportunity', title: 'Oportunidade', description: 'Pão Francês representa 45% das vendas' },
                { type: 'tip', title: 'Dica', description: 'Reduza pedido de Bolo de Chocolate em 20%' }
            ])
            setIsGeneratingInsights(false)
        }, 2500)
    }

    useEffect(() => {
        const timer = setTimeout(() => generateInsights(), 1000)
        return () => clearTimeout(timer)
    }, [])

    const toggleBookmark = (reportId: string) => {
        const current = preferences.bookmarkedReports
        const updated = current.includes(reportId) ? current.filter(id => id !== reportId) : [...current, reportId]
        updatePreference('bookmarkedReports', updated)
    }

    const { handlePrint } = useReportsPrint({
        selectedReports, dateRange,
        abcData: MOCK_ABC_ANALYSIS,
        breakageData: MOCK_BREAKAGE_ANALYSIS,
        velocityData: MOCK_VELOCITY_ANALYSIS,
    })

    const comparisonData = comparisonPeriod !== 'none' ? COMPARISON_DATA[comparisonPeriod as 'lastMonth' | 'lastQuarter' | 'lastYear'] : null

    const kpis = [
        { title: 'Receita Total', value: formatCurrency(847520), change: comparisonData?.kpis.receita.change ?? 12.4, previousValue: comparisonData ? formatCurrency(comparisonData.kpis.receita.previous) : null, icon: <DollarSign className="w-6 h-6 text-white" />, color: 'from-[#34C759] to-[#30D158]' },
        { title: 'Margem Média', value: formatPercent(MOCK_MARGIN_ANALYSIS.summary.avgMarginPercent), change: comparisonData?.kpis.margem.change ?? 3.2, previousValue: comparisonData ? formatPercent(comparisonData.kpis.margem.previous) : null, icon: <TrendingUp className="w-6 h-6 text-white" />, color: 'from-[#007AFF] to-[#5856D6]' },
        { title: 'Taxa Desperdício', value: formatPercent(MOCK_BREAKAGE_ANALYSIS.totals.overallWastePercentage), change: comparisonData?.kpis.desperdicio.change ?? -2.1, previousValue: comparisonData ? formatPercent(comparisonData.kpis.desperdicio.previous) : null, icon: <Trash2 className="w-6 h-6 text-white" />, color: 'from-[#FF9500] to-[#FF3B30]' },
        { title: 'Eficiência', value: formatPercent(MOCK_PRODUCTION_EFFICIENCY.summary.avgEfficiency), change: comparisonData?.kpis.eficiencia.change ?? 5.8, previousValue: comparisonData ? formatPercent(comparisonData.kpis.eficiencia.previous) : null, icon: <Zap className="w-6 h-6 text-white" />, color: 'from-[#AF52DE] to-[#FF2D55]' },
    ]

    const [reportOrder, setReportOrder] = useState<ReportType[]>(preferences.reportOrder as ReportType[] || REPORTS_CONFIG.map(r => r.id))
    const orderedReports = reportOrder.map(id => REPORTS_CONFIG.find(r => r.id === id)).filter((r): r is typeof REPORTS_CONFIG[0] => r !== undefined)

    const handleReorder = (newOrder: ReportType[]) => {
        setReportOrder(newOrder)
        updatePreference('reportOrder', newOrder)
    }

    const comparisonLabel = comparisonPeriod === 'lastMonth' ? 'vs mês ant.' : comparisonPeriod === 'lastQuarter' ? 'vs trim. ant.' : comparisonPeriod === 'lastYear' ? 'vs ano ant.' : 'vs mês ant.'

    return (
        <PageEntrance>
            <OfflineIndicator />
            <div className="bg-[#f5f5f7] dark:bg-[#000000]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
                {/* Header */}
                <header className="sticky top-0 z-50 print:hidden">
                    <div className="absolute inset-0 bg-[#f5f5f7]/80 dark:bg-[#000000]/80 backdrop-blur-xl" />
                    <div className="relative max-w-7xl mx-auto px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-4">
                                    <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-[34px] font-bold tracking-[-0.03em]">
                                        <GradientText colors={['#1d1d1f', '#3a3a3c']} className="dark:hidden">Relatórios</GradientText>
                                        <span className="hidden dark:inline text-white">Relatórios</span>
                                    </motion.h1>
                                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-3">
                                        <LiveDataIndicator isLive={true} lastUpdated={lastDataUpdate} />
                                        <SaveIndicator isSaving={isSaving} lastSaved={lastSaved} show={isSaving || !!lastSaved} />
                                    </motion.div>
                                </div>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-[17px] text-[#86868b]">
                                    Dashboard de análises e indicadores
                                </motion.p>
                            </div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                                <PeriodComparisonToggle value={comparisonPeriod} onChange={setComparisonPeriod} />
                                <DateRangePicker value={dateRange} onChange={setDateRange} />
                                <PrintMenuButton
                                    showMenu={showReportMenu}
                                    setShowMenu={setShowReportMenu}
                                    printLabel={printButtonLabel}
                                    reports={REPORTS_CONFIG}
                                    selectedReports={selectedReports}
                                    toggleReport={toggleReport}
                                    selectAll={selectAllReports}
                                    selectNone={selectNoReports}
                                    onPrint={handlePrint}
                                    hasSelected={hasSelectedReports}
                                />
                            </motion.div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-6 py-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        {kpis.map((kpi, i) => (
                            <KPICard key={kpi.title} {...kpi} delay={i * 0.1} comparisonLabel={comparisonLabel} />
                        ))}
                    </div>

                    {/* AI Insights */}
                    <div className="mb-8">
                        <AIInsightsCard reportName="Dashboard Geral" insights={aiInsights} isGenerating={isGeneratingInsights} onGenerate={generateInsights} />
                    </div>

                    {/* Report Sections */}
                    <Reorder.Group axis="y" values={reportOrder} onReorder={handleReorder} className="space-y-6">
                        {orderedReports.map(({ id, title, desc, icon, gradient, component: Chart, data }, i) => (
                            <Reorder.Item key={id} value={id} className="list-none">
                                <ReportSectionCard
                                    id={id} title={title} description={desc} icon={icon} gradient={gradient}
                                    isSelected={selectedReports.includes(id)} onToggle={() => toggleReport(id)}
                                    index={i} isBookmarked={preferences.bookmarkedReports.includes(id)}
                                    onBookmark={() => toggleBookmark(id)}
                                >
                                    <Chart data={data as any} />
                                </ReportSectionCard>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </main>
            </div>
        </PageEntrance>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT MENU BUTTON (Internal Component)
// ═══════════════════════════════════════════════════════════════════════════════

interface PrintMenuButtonProps {
    showMenu: boolean
    setShowMenu: (show: boolean) => void
    printLabel: string
    reports: typeof REPORTS_CONFIG
    selectedReports: ReportType[]
    toggleReport: (id: ReportType) => void
    selectAll: () => void
    selectNone: () => void
    onPrint: () => void
    hasSelected: boolean
}

function PrintMenuButton({
    showMenu, setShowMenu, printLabel, reports, selectedReports, toggleReport, selectAll, selectNone, onPrint, hasSelected
}: PrintMenuButtonProps) {
    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2.5 px-5 py-3 rounded-[14px] bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] font-semibold text-[15px] shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            >
                <Printer className="w-5 h-5" />
                <span>{printLabel}</span>
                <motion.span animate={{ rotate: showMenu ? 180 : 0 }}><ChevronDown className="w-4 h-4 opacity-60" /></motion.span>
            </motion.button>

            <AnimatePresence>
                {showMenu && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={SPRING}
                            className="absolute right-0 top-full mt-3 z-50 w-[300px] p-4 bg-white/95 dark:bg-[#2c2c2e]/95 backdrop-blur-xl rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.2)]"
                        >
                            <div className="flex gap-2 mb-4">
                                <button onClick={selectAll} className="flex-1 py-2.5 text-[14px] font-medium rounded-[12px] bg-[#f5f5f7] dark:bg-[#3a3a3c] hover:bg-[#e8e8ed]">Todos</button>
                                <button onClick={selectNone} className="flex-1 py-2.5 text-[14px] font-medium rounded-[12px] bg-[#f5f5f7] dark:bg-[#3a3a3c] hover:bg-[#e8e8ed]">Nenhum</button>
                            </div>
                            <div className="space-y-1 max-h-72 overflow-y-auto mb-4">
                                {reports.map(({ id, title, icon, gradient }) => (
                                    <motion.button key={id} whileTap={{ scale: 0.98 }} onClick={() => toggleReport(id)} className="w-full flex items-center gap-3 p-3 rounded-[12px] hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c]">
                                        <div className={`w-8 h-8 rounded-[10px] bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}>
                                            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' })}
                                        </div>
                                        <span className="flex-1 text-left text-[15px] text-[#1d1d1f] dark:text-white">{title}</span>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedReports.includes(id) ? 'bg-[#007AFF]' : 'border-2 border-[#d1d1d6]'}`}>
                                            {selectedReports.includes(id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                            <button onClick={onPrint} disabled={!hasSelected} className="w-full py-3.5 rounded-[14px] bg-[#007AFF] text-white text-[16px] font-semibold disabled:opacity-40 shadow-[0_4px_16px_rgba(0,122,255,0.35)]">
                                <Printer className="w-4 h-4 inline mr-2" />Imprimir Agora
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ReportsPage
