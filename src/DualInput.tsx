// ═══════════════════════════════════════════════════════════════════
// DualInput - Apple-quality input with automatic % / g conversion
// Refactored: 162 → ~25 lines using extracted hook
// ═══════════════════════════════════════════════════════════════════

import { ReactNode } from 'react'
import { DualInputProps, useDualInputState } from './dualInputModules'

export default function DualInput({ label, value, onChange, mode = 'pct', flourWeight = 1000, name, step = 0.1, decimals = 1, maxPct = null }: DualInputProps): ReactNode {
    const { localValue, currentUnit, handleChange, handleFocus, handleBlur } = useDualInputState({ value, mode, flourWeight, decimals, maxPct, onChange })

    return (
        <label className="block">
            <div className="label mb-1">{label}</div>
            <div className="relative">
                <input className="input text-right pr-8" type="number" inputMode="decimal" name={name} step={mode === 'grams' ? 1 : step} value={localValue} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} placeholder="0" />
                <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-gray-500 dark:text-gray-400 font-medium">{currentUnit}</span>
            </div>
        </label>
    )
}
