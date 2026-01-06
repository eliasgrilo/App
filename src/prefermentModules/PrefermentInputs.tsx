// ═══════════════════════════════════════════════════════════════════
// PREFERMENT MODULES — PrefermentInputs Component
// ═══════════════════════════════════════════════════════════════════

import React, { ChangeEvent } from 'react'
import DualInput from '../DualInput'
import { PrefermentData, PrefermentDataSet, InputMode, getPrefermentFlourWeight, formatNumber } from './types'

interface PrefermentInputsProps { dataKey: string; data: PrefermentDataSet; inputMode: InputMode; flourWeight: number; onSet: (key: string, field: string, val: number) => void }

export function PrefermentInputs({ dataKey, data, inputMode, flourWeight, onSet }: PrefermentInputsProps) {
    const d = data[dataKey]; if (!d) return null
    const unitLabel = inputMode === 'grams' ? 'g' : '%'
    const prefFlourWeight = getPrefermentFlourWeight(flourWeight, d)
    const prefWaterWeight = prefFlourWeight * (Number(d.hydration) || 0) / 100

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <DualInput label={`Farinha Pref. (${unitLabel})`} value={d.pct} onChange={(v: number) => onSet(dataKey, 'pct', v)} mode={inputMode} flourWeight={flourWeight} name={`${dataKey}-pct`} />
                <DualInput label={`Água (${unitLabel})`} value={d.hydration} onChange={(v: number) => onSet(dataKey, 'hydration', Math.min(200, Math.max(0, v)))} mode={inputMode} flourWeight={prefFlourWeight > 0 ? prefFlourWeight : flourWeight} name={`${dataKey}-hydration`} />
                {typeof d.yeastPct !== 'undefined' && <DualInput label={`Fermento (${unitLabel})`} value={d.yeastPct} onChange={(v: number) => onSet(dataKey, 'yeastPct', v)} mode={inputMode} flourWeight={prefFlourWeight > 0 ? prefFlourWeight : flourWeight} name={`${dataKey}-yeast`} decimals={2} />}
                {typeof d.inoculationPct !== 'undefined' && <label className="block"><div className="label mb-1">Inoculação (%)</div><div className="relative"><input className="input text-right pr-8" type="number" inputMode="decimal" value={d.inoculationPct} onChange={(e: ChangeEvent<HTMLInputElement>) => onSet(dataKey, 'inoculationPct', parseFloat(e.target.value))} step={1} /><span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-gray-500 dark:text-gray-400 font-medium">%</span></div></label>}
                <label className="block"><div className="label mb-1">Tempo</div><div className="relative"><input className="input text-right pr-8" type="number" inputMode="numeric" pattern="[0-9]*" value={d.time_h} onChange={(e: ChangeEvent<HTMLInputElement>) => onSet(dataKey, 'time_h', parseFloat(e.target.value))} /><span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-gray-500 dark:text-gray-400 font-medium">h</span></div></label>
                <label className="block"><div className="label mb-1">Temp.</div><div className="relative"><input className="input text-right pr-8" type="number" inputMode="numeric" pattern="[0-9]*" value={d.temp_C} onChange={(e: ChangeEvent<HTMLInputElement>) => onSet(dataKey, 'temp_C', parseFloat(e.target.value))} /><span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-gray-500 dark:text-gray-400 font-medium">°C</span></div></label>
            </div>
            {inputMode === 'grams' && <div className="rounded-lg bg-gray-100 dark:bg-zinc-800 p-3"><div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Resumo do Pré-fermento:</div><div className="grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500 dark:text-gray-400">Farinha:</span><span className="ml-2 font-semibold">{formatNumber(prefFlourWeight, 0, 'g')}</span></div><div><span className="text-gray-500 dark:text-gray-400">Água:</span><span className="ml-2 font-semibold">{formatNumber(prefWaterWeight, 0, 'g')}</span></div><div><span className="text-gray-500 dark:text-gray-400">Total:</span><span className="ml-2 font-semibold">{formatNumber(prefFlourWeight + prefWaterWeight, 0, 'g')}</span></div></div></div>}
        </div>
    )
}
