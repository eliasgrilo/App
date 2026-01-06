/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY DASHBOARD — Premium Statistics Cards
 * Apple-style total value card with category breakdown
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface TotalsType {
    totalValue: number
    itemCount: number
    byCategory: { [key: string]: number }
    taxImpact: number
    grandTotal: number
}

interface ColorScheme {
    bg: string
    text: string
    shadow: string
    pulse: string
}

interface InventoryDashboardProps {
    totals: TotalsType
    taxRate: number
    categories: string[]
    formatCurrency: (value: number) => string
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function InventoryDashboard({
    totals,
    taxRate,
    categories,
    formatCurrency
}: InventoryDashboardProps): React.ReactElement {
    const colors: Record<string, ColorScheme> = {
        'Ingredientes': { bg: 'bg-indigo-500/80', text: 'text-indigo-500', shadow: 'shadow-[0_0_8px_rgba(99,102,241,0.4)]', pulse: 'bg-indigo-500' },
        'Embalagens': { bg: 'bg-orange-500/80', text: 'text-orange-500', shadow: 'shadow-[0_0_8px_rgba(249,115,22,0.4)]', pulse: 'bg-orange-500' },
        'Utensílios': { bg: 'bg-emerald-500/80', text: 'text-emerald-500', shadow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]', pulse: 'bg-emerald-500' },
        'Outros': { bg: 'bg-zinc-500/80', text: 'text-zinc-500', shadow: 'shadow-[0_0_8px_rgba(113,113,122,0.4)]', pulse: 'bg-zinc-500' }
    }

    return (
        <section className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            {/* Total Value Card */}
            <div className="md:col-span-2 relative group">
                <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-[250ms]0" />

                    <div className="relative">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h3 className="text-[10px] font-bold text-zinc-400 dark:text-emerald-300/60 uppercase tracking-widest cursor-text hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                    Inventory Matrix
                                </h3>
                                <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide mt-1">Protocol Status: High Integrity</p>
                            </div>
                            <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live Matrix</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest ml-1">Total Stock Asset Value</span>
                            <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none flex flex-wrap items-baseline gap-2 md:gap-3">
                                {formatCurrency(totals.grandTotal)}
                            </div>
                        </div>
                    </div>

                    <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100/80 dark:border-white/5">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Net Valuation</span>
                            <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{formatCurrency(totals.totalValue)}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">Tax Impact ({(taxRate * 100).toFixed(0)}%)</span>
                            <span className="text-2xl md:text-3xl font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">{formatCurrency(totals.taxImpact)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Cards */}
            <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
                {categories.map((cat) => {
                    const color = colors[cat] ?? colors['Outros']!
                    const value = totals.byCategory[cat] || 0
                    const valueWithTax = value * (1 + taxRate)
                    const allocation = (value / totals.totalValue * 100 || 0).toFixed(0)

                    return (
                        <div key={cat} className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-3xl p-5 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-md hover:shadow-lg transition-all">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${color.pulse} ${color.shadow}`} />
                                    <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">{cat}</h3>
                                </div>
                                <div className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                                    {formatCurrency(valueWithTax)}
                                </div>
                                <div className="text-[9px] font-medium text-zinc-400 tabular-nums">
                                    ({formatCurrency(value)} + {(taxRate * 100).toFixed(0)}% tax)
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-1 px-0.5">
                                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Allocation</span>
                                    <span className={`text-[8px] font-bold ${color.text}`}>{allocation}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${color.bg} transition-all duration-[250ms]0`} style={{ width: `${allocation}%` }} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

export default InventoryDashboard
