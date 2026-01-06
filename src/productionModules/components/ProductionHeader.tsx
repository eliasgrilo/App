// ═══════════════════════════════════════════════════════════════════
// Production Module — Header Component
// ═══════════════════════════════════════════════════════════════════

export function ProductionHeader() {
    return (
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Produção</h1>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Calculadora de massa premium</p>
            </div>
        </div>
    )
}
