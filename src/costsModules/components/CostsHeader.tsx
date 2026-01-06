// ═══════════════════════════════════════════════════════════════════
// COSTS MODULE — Header Component
// ═══════════════════════════════════════════════════════════════════

interface CostsHeaderProps {
    onAddExpense: () => void
}

export function CostsHeader({ onAddExpense }: CostsHeaderProps) {
    return (
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Financeiro</h1>
                    <div className="mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Local</span>
                    </div>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Controle de investimentos e fluxo de capital</p>
            </div>

            <button onClick={onAddExpense}
                className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Adicionar Despesa
            </button>
        </div>
    )
}
