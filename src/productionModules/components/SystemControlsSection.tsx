// ═══════════════════════════════════════════════════════════════════
// Production Module — System Controls Section
// ═══════════════════════════════════════════════════════════════════

import type { RefObject, ChangeEvent } from 'react'

interface SystemControlsSectionProps {
    fileRef: RefObject<HTMLInputElement>
    onSave: () => void
    onExport: () => void
    onImport: (e: ChangeEvent<HTMLInputElement>) => void
    onClear: () => void
}

export function SystemControlsSection({ fileRef, onSave, onExport, onImport, onClear }: SystemControlsSectionProps) {
    return (
        <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
            <h2 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-6">Controle de Sistema</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button onClick={onSave}
                    className="px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all col-span-2 sm:col-span-1 shadow-lg">
                    Salvar
                </button>
                <button onClick={() => fileRef.current?.click()}
                    className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all">
                    Importar
                </button>
                <button onClick={onExport}
                    className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all">
                    Exportar
                </button>
                <button onClick={onClear}
                    className="px-6 py-4 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-[0.98] transition-all border border-red-100 dark:border-red-500/20">
                    Limpar
                </button>
            </div>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
        </section>
    )
}
