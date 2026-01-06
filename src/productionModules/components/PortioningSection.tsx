// ═══════════════════════════════════════════════════════════════════
// Production Module — Portioning Section
// ═══════════════════════════════════════════════════════════════════

import type { InputMode, InputState } from '../types'

interface PortioningSectionProps {
    inputs: InputState
    inputMode: InputMode
    flourWeight: number
    totalPct: number
    onDoughBallsChange: (val: number) => void
    onBallWeightChange: (val: number, flourWeight: number, totalPct: number, inputMode: InputMode) => void
}

export function PortioningSection({ inputs, inputMode, flourWeight, totalPct, onDoughBallsChange, onBallWeightChange }: PortioningSectionProps) {
    return (
        <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Porcionamento</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Dough Balls</label>
                    <input
                        className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                        type="number" inputMode="numeric" pattern="[0-9]*" step="1"
                        value={inputs.doughBalls}
                        onChange={(e) => onDoughBallsChange(Math.round(parseFloat(e.target.value)))}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Ball Weight (g)</label>
                    <input
                        className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                        type="number" inputMode="decimal"
                        value={inputs.ballWeight}
                        onChange={(e) => onBallWeightChange(parseFloat(e.target.value), flourWeight, totalPct, inputMode)}
                    />
                </div>
            </div>
        </section>
    )
}
