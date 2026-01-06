// ═══════════════════════════════════════════════════════════════════
// Production Module — Maturation Section
// ═══════════════════════════════════════════════════════════════════

import type { InputState } from '../types'

interface MaturationSectionProps {
    inputs: InputState
    onUpdate: <K extends keyof InputState>(key: K, val: InputState[K]) => void
}

export function MaturationSection({ inputs, onUpdate }: MaturationSectionProps) {
    return (
        <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Maturação</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="maturation-time" className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Tempo (h)</label>
                    <input id="maturation-time" className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                        type="number" inputMode="numeric" pattern="[0-9]*" value={inputs.RT_h}
                        onChange={(e) => onUpdate('RT_h', parseFloat(e.target.value))} />
                </div>
                <div>
                    <label htmlFor="maturation-temp" className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Temperatura (°C)</label>
                    <input id="maturation-temp" className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                        type="number" inputMode="numeric" pattern="[0-9]*" value={inputs.RT_C}
                        onChange={(e) => onUpdate('RT_C', parseFloat(e.target.value))} />
                </div>
            </div>
        </section>
    )
}

export function ColdFermentationSection({ inputs, onUpdate }: MaturationSectionProps) {
    return (
        <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Cold Fermentation</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="cold-ferm-time" className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Tempo (h)</label>
                    <input id="cold-ferm-time" className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                        type="number" inputMode="numeric" pattern="[0-9]*" value={inputs.CT_h}
                        onChange={(e) => onUpdate('CT_h', parseFloat(e.target.value))} />
                </div>
                <div>
                    <label htmlFor="cold-ferm-temp" className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Temperatura (°C)</label>
                    <input id="cold-ferm-temp" className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                        type="number" inputMode="numeric" pattern="[0-9]*" value={inputs.CT_C}
                        onChange={(e) => onUpdate('CT_C', parseFloat(e.target.value))} />
                </div>
            </div>
        </section>
    )
}
