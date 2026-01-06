// ═══════════════════════════════════════════════════════════════════
// Production Module — Production Summary Card
// ═══════════════════════════════════════════════════════════════════

import { InputState, DisplayGrams, formatNumber } from '../types'

interface ProductionSummaryCardProps {
    inputs: InputState
    displayGrams: DisplayGrams
    totalDoughWeight: number
}

export function ProductionSummaryCard({ inputs, displayGrams, totalDoughWeight }: ProductionSummaryCardProps) {
    const diff = (Number(displayGrams.total) || 0) - (Number(totalDoughWeight) || 0)
    const diffColor = Math.abs(diff) < 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'

    return (
        <div className="relative group">
            <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-[2500ms]"></div>

                <div className="relative">
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-indigo-300/60 uppercase tracking-widest cursor-text hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                Production Matrix
                            </h3>
                            <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide mt-1">Protocol Status: Calculated</p>
                        </div>
                        <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live Calc</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest ml-1">Massa Preparada</span>
                        <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none flex flex-wrap items-baseline gap-2 md:gap-3">
                            {formatNumber(displayGrams.total, 0, 'g')}
                        </div>
                    </div>
                </div>

                <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100/80 dark:border-white/5">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Quantidade</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{inputs.doughBalls}</span>
                            <span className="text-xs font-medium text-zinc-400">un</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Peso/Unidade</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{inputs.ballWeight}</span>
                            <span className="text-xs font-medium text-zinc-400">g</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Peso Esperado</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl md:text-3xl font-semibold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">{formatNumber(totalDoughWeight, 0, 'g')}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Diferença</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl md:text-3xl font-semibold tracking-tight tabular-nums ${diffColor}`}>
                                {formatNumber(diff, 1, 'g')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
