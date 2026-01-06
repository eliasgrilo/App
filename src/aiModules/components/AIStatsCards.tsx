// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Stats Cards Component
// ═══════════════════════════════════════════════════════════════════

import type { AIStats } from '../types'

interface AIStatsCardsProps {
    stats: AIStats
}

export function AIStatsCards({ stats }: AIStatsCardsProps) {
    return (
        <>
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-md hover:shadow-lg transition-all">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                        <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">Crítico</h3>
                    </div>
                    <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                        {stats.critical}
                    </div>
                    <div className="text-[9px] font-medium text-zinc-400 tabular-nums">
                        itens abaixo do mínimo
                    </div>
                </div>
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-1.5 px-0.5">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Urgência</span>
                        <span className="text-[8px] font-bold text-rose-500">Alta</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500/80 transition-all duration-[250ms]0" style={{ width: stats.total > 0 ? `${(stats.critical / stats.total * 100)}%` : '0%' }}></div>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-md hover:shadow-lg transition-all">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                        <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">Atenção</h3>
                    </div>
                    <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                        {stats.warning}
                    </div>
                    <div className="text-[9px] font-medium text-zinc-400 tabular-nums">
                        itens próximos do limite
                    </div>
                </div>
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-1.5 px-0.5">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Monitorar</span>
                        <span className="text-[8px] font-bold text-amber-500">Média</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500/80 transition-all duration-[250ms]0" style={{ width: stats.total > 0 ? `${(stats.warning / stats.total * 100)}%` : '0%' }}></div>
                    </div>
                </div>
            </div>
        </>
    )
}
