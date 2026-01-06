// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Health Score Card Component
// ═══════════════════════════════════════════════════════════════════

import type { AIStats } from '../types'

interface AIHealthCardProps {
    stats: AIStats
    scoreColor: 'emerald' | 'amber' | 'rose'
}

export function AIHealthCard({ stats, scoreColor }: AIHealthCardProps) {
    return (
        <div className="md:col-span-2 relative group">
            <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-[250ms]0"></div>

                <div className="relative">
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-emerald-300/60 uppercase tracking-widest cursor-text hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                Intelligence Matrix
                            </h3>
                            <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide mt-1">Protocol Status: Active Monitoring</p>
                        </div>
                        <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                            <div className={`w-1.5 h-1.5 rounded-full ${scoreColor === 'emerald' ? 'bg-emerald-500' : scoreColor === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                            <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live Analysis</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest ml-1">Health Score</span>
                        <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none flex flex-wrap items-baseline gap-2 md:gap-3">
                            <span className={scoreColor === 'emerald' ? 'text-emerald-500' : scoreColor === 'amber' ? 'text-amber-500' : 'text-rose-500'}>{stats.healthScore}</span>
                            <span className="text-2xl md:text-4xl text-zinc-300 dark:text-zinc-600">/ 100</span>
                        </div>
                    </div>
                </div>

                <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100/80 dark:border-white/5">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Itens Monitorados</span>
                        <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{stats.total}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest">Alertas Ativos</span>
                        <span className="text-2xl md:text-3xl font-semibold text-rose-600 dark:text-rose-400 tracking-tight tabular-nums">{stats.critical + stats.warning}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
