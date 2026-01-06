// ═══════════════════════════════════════════════════════════════════
// Production Module — Final Dough Section
// ═══════════════════════════════════════════════════════════════════

import type { InputState, DisplayGrams, PrefermentDataItem } from '../types'
import { formatNumber, hasValue } from '../types'

interface FinalDoughSectionProps {
    inputs: InputState
    displayGrams: DisplayGrams
    hydration: number
    prefermentData: PrefermentDataItem | null
    prefermentFlour: number
    prefermentWater: number
    prefermentMass: number
}

export function FinalDoughSection({ inputs, displayGrams, hydration, prefermentData, prefermentFlour, prefermentWater, prefermentMass }: FinalDoughSectionProps) {
    return (
        <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
            <h2 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-6">Massa Final</h2>
            <div className="rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/30 p-5 border border-zinc-100/80 dark:border-zinc-700/50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    {hasValue(displayGrams.flour) && <IngredientDisplay label="Farinha" value={displayGrams.flour - prefermentFlour} />}
                    {hasValue(displayGrams.water) && <IngredientDisplay label="Água" value={displayGrams.water - prefermentWater} />}
                    {inputs.prefermentType !== 'None' && prefermentData && <IngredientDisplay label={`Pré-fermento (${inputs.prefermentType})`} value={prefermentMass} />}
                    {hasValue(displayGrams.salt) && <IngredientDisplay label="Sal" value={displayGrams.salt} decimals={1} />}
                    {hasValue(displayGrams.sugar) && <IngredientDisplay label="Açúcar" value={displayGrams.sugar} decimals={1} />}
                    {hasValue(displayGrams.oliveOil) && <IngredientDisplay label="Azeite" value={displayGrams.oliveOil} decimals={1} />}
                    {hasValue(displayGrams.oil) && <IngredientDisplay label="Óleo" value={displayGrams.oil} decimals={1} />}
                    {hasValue(displayGrams.milk) && <IngredientDisplay label="Leite" value={displayGrams.milk} decimals={1} />}
                    {hasValue(displayGrams.butter) && <IngredientDisplay label="Manteiga" value={displayGrams.butter} decimals={1} />}
                    {hasValue(displayGrams.diastatic) && <IngredientDisplay label="Malte" value={displayGrams.diastatic} decimals={1} />}
                    {hasValue(displayGrams.yeast) && <IngredientDisplay label="Fermento" value={displayGrams.yeast} decimals={2} />}
                </div>
                <div className="pt-4 border-t border-zinc-100/80 dark:border-zinc-700 grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Total da Massa</div>
                        <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.total, 0, 'g')}</div>
                    </div>
                    <div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Hidratação</div>
                        <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(hydration, 1, '%')}</div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function IngredientDisplay({ label, value, decimals = 0 }: { label: string; value: number; decimals?: number }) {
    return (
        <div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">{label}</div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(value, decimals, 'g')}</div>
        </div>
    )
}
