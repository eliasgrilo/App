// ═══════════════════════════════════════════════════════════════════
// COSTS MODULE — Tools Section
// ═══════════════════════════════════════════════════════════════════

import type { RefObject, ChangeEvent } from 'react'

interface CostsToolsSectionProps {
    fileRef: RefObject<HTMLInputElement>
    onExportCSV: () => void
    onExportJSON: () => void
    onImportJSON: (e: ChangeEvent<HTMLInputElement>) => void
    onClearAll: () => void
}

export function CostsToolsSection({ fileRef, onExportCSV, onExportJSON, onImportJSON, onClearAll }: CostsToolsSectionProps) {
    return (
        <section className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Export CSV Card */}
            <div className="bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group shadow-xl transition-all hover:shadow-2xl">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-50 dark:bg-white/5 rounded-[1rem] md:rounded-[1.25rem] border border-zinc-100/80 dark:border-white/10 flex items-center justify-center transition-all group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </div>
                    <div>
                        <h2 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Exportar</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-semibold tracking-tight leading-none">Gerar relatório CSV/Excel</p>
                    </div>
                </div>
                <button onClick={onExportCSV} className="w-full sm:w-auto px-6 py-4 md:py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest shadow-lg active:scale-90 transition-all">Exportar</button>
            </div>

            {/* Backup & Restore Card */}
            <div className="bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Backup & Restaurar</h2>
                    <button onClick={onClearAll} className="text-[9px] font-bold text-red-500/60 hover:text-red-600 uppercase tracking-widest transition-colors">Apagar Tudo</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={onExportJSON} className="py-4 md:py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">Backup JSON</button>
                    <button onClick={() => fileRef.current?.click()} className="py-4 md:py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">Restaurar Backup</button>
                    <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportJSON} />
                </div>
            </div>
        </section>
    )
}
