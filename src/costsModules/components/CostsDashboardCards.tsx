// ═══════════════════════════════════════════════════════════════════
// COSTS MODULE — Dashboard Cards
// ═══════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import type { CostTotals } from '../types'
import { Sparkline } from '../../components/Sparkline'

interface CostsDashboardCardsProps {
    totals: CostTotals
    formatCurrency: (val: number) => string
    taxDisplay: string
    provinceName: string
    dashboardTitle: string
    setDashboardTitle: (title: string) => void
    isEditingTitle: boolean
    setIsEditingTitle: (editing: boolean) => void
}

export function CostsDashboardCards({
    totals, formatCurrency, taxDisplay, provinceName,
    dashboardTitle, setDashboardTitle, isEditingTitle, setIsEditingTitle
}: CostsDashboardCardsProps) {
    return (
        <section className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            {/* Total Investment Card */}
            <div className="md:col-span-2 relative group">
                <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-[2500ms]"></div>
                    <div className="relative">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                {isEditingTitle ? (
                                    <input className="bg-zinc-100 dark:bg-zinc-900/50 border-none text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest outline-none px-3 py-2 rounded-xl"
                                        value={dashboardTitle} onChange={(e) => setDashboardTitle(e.target.value)}
                                        onBlur={() => setIsEditingTitle(false)} onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)} autoFocus />
                                ) : (
                                    <button type="button" className="bg-transparent border-none p-0 m-0 text-[10px] font-bold text-zinc-400 dark:text-indigo-300/60 uppercase tracking-widest cursor-text hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                                        onClick={() => setIsEditingTitle(true)}>{dashboardTitle}</button>
                                )}
                                <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide mt-1">Status: Ativo</p>
                            </div>
                            <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest ml-1">Total</span>
                            <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter">{formatCurrency(totals.total)}</div>
                        </div>
                    </div>
                    {/* Spacer to maintain original card height */}
                    <div className="relative mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100/80 dark:border-white/5">
                        <div className="h-[40px] md:h-[44px]"></div>
                    </div>
                </div>
            </div>

            {/* Fixed Costs Card */}
            <CostTypeCard label="Custo Fixo" value={totals.fixed} total={totals.total} formatCurrency={formatCurrency} color="indigo" />
            {/* Variable Costs Card */}
            <CostTypeCard label="Variável" value={totals.variable} total={totals.total} formatCurrency={formatCurrency} color="orange" />
        </section>
    )
}

interface CostTypeCardProps {
    label: string; value: number; total: number
    formatCurrency: (val: number) => string
    color: 'indigo' | 'orange'
}

function CostTypeCard({ label, value, total, formatCurrency, color }: CostTypeCardProps) {
    const pct = ((value / total * 100) || 0).toFixed(0)
    const dotColor = color === 'indigo' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
    const barColor = color === 'indigo' ? 'bg-indigo-500/80' : 'bg-orange-500/80'
    const textColor = color === 'indigo' ? 'text-indigo-500' : 'text-orange-500'
    const sparklineColor = color === 'indigo' ? '#6366f1' : '#f97316'

    // Generate sample trend data based on value (simulating historical data)
    const trendData = useMemo(() => {
        const base = value * 0.8
        return Array.from({ length: 7 }, (_, i) => base + (Math.random() * value * 0.4) * (i / 7))
    }, [value])

    return (
        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-md hover:shadow-lg transition-all">
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                        <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">{label}</h3>
                    </div>
                    <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                        <Sparkline data={trendData} width={60} height={20} color={sparklineColor} strokeWidth={1.5} />
                    </div>
                </div>
                <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">{formatCurrency(value)}</div>
            </div>
            <div className="mt-6">
                <div className="flex justify-between items-center mb-1.5 px-0.5">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Proporção</span>
                    <span className={`text-[8px] font-bold ${textColor}`}>{pct}%</span>
                </div>
                <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} transition-all duration-[2500ms]`} style={{ width: `${pct}%` }}></div>
                </div>
            </div>
        </div>
    )
}
