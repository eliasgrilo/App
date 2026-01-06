// ═══════════════════════════════════════════════════════════════════
// DUAL INPUT MODULES — Types & Hooks
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, ChangeEvent } from 'react'

export type InputMode = 'pct' | 'grams'

export interface DualInputProps { label: string; value?: number | string; onChange?: (value: number) => void; mode?: InputMode; flourWeight?: number; name?: string; step?: number; decimals?: number; maxPct?: number | null }

export function useDualInputState(props: Pick<DualInputProps, 'value' | 'mode' | 'flourWeight' | 'decimals' | 'maxPct'> & { onChange?: (v: number) => void }) {
    const { value, mode = 'pct', flourWeight = 1000, decimals = 1, maxPct = null, onChange } = props
    const safeFlourWeight = Math.max(flourWeight || 0, 1)
    const pctToGrams = (pct: number | string | undefined): number => (safeFlourWeight * (Number(pct) || 0)) / 100
    const gramsToPct = (grams: number): number => ((Number(grams) || 0) / safeFlourWeight) * 100
    const grams = pctToGrams(value)
    const isKG = mode === 'grams' && Math.abs(grams) >= 1000
    const currentUnit = mode === 'grams' ? (isKG ? 'kg' : 'g') : '%'

    const getDisplayValue = (): number => { const pct = Number(value) || 0; if (mode === 'grams') { const g = pctToGrams(pct); if (isKG) return g / 1000; return g < 10 ? g : Math.round(g) }; return pct }

    const [localValue, setLocalValue] = useState<string>(() => { if (value === '' || value === null || value === undefined) return ''; const displayVal = getDisplayValue(); return isKG ? displayVal.toFixed(2) : displayVal.toString() })
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => { if (!isFocused) { if (value === '' || value === null || value === undefined) { setLocalValue('') } else { const displayVal = getDisplayValue(); if (mode === 'grams') { const g = pctToGrams(Number(value) || 0); if (isKG) { setLocalValue(displayVal.toFixed(2)) } else { setLocalValue(g < 10 ? g.toFixed(2) : Math.round(g).toString()) } } else { setLocalValue(Number(displayVal).toFixed(decimals)) } } } }, [value, mode, flourWeight, isFocused, isKG, decimals])

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => { const inputValue = e.target.value; setLocalValue(inputValue); if (inputValue === '') { onChange?.(0); return }; let numValue = parseFloat(inputValue); if (!Number.isNaN(numValue)) { numValue = Math.max(0, numValue); if (mode === 'pct' && maxPct !== null && numValue > maxPct) { numValue = maxPct; setLocalValue(numValue.toString()) }; let finalGrams = numValue; if (mode === 'grams' && isKG) { finalGrams = numValue * 1000 }; const pctValue = mode === 'grams' ? gramsToPct(finalGrams) : numValue; onChange?.(pctValue) } }
    const handleFocus = (): void => { setIsFocused(true) }
    const handleBlur = (): void => { setIsFocused(false); if (localValue === '' || localValue === null) { setLocalValue(''); return }; const numValue = parseFloat(localValue); if (!Number.isNaN(numValue)) { if (mode === 'grams') { const g = pctToGrams(Number(value) || 0); if (isKG) { setLocalValue(numValue.toFixed(2)) } else { setLocalValue(g < 10 ? numValue.toFixed(2) : Math.round(numValue).toString()) } } else { setLocalValue(numValue.toFixed(decimals)) } } }

    return { localValue, currentUnit, handleChange, handleFocus, handleBlur }
}
