import { useState, useEffect, ChangeEvent, ReactNode } from 'react'

/**
 * DualInput - Apple-quality input component with automatic % / g conversion
 * Uses local state during editing to prevent reformatting while typing
 */

type InputMode = 'pct' | 'grams'

interface DualInputProps {
    label: string
    value?: number | string
    onChange?: (value: number) => void
    mode?: InputMode
    flourWeight?: number
    name?: string
    step?: number
    decimals?: number
    maxPct?: number | null
}

export default function DualInput({
    label,
    value,
    onChange,
    mode = 'pct',
    flourWeight = 1000,
    name,
    step = 0.1,
    decimals = 1,
    maxPct = null
}: DualInputProps): ReactNode {
    // Ensure flourWeight is valid
    const safeFlourWeight = Math.max(flourWeight || 0, 1)

    // Convert between % and grams
    const pctToGrams = (pct: number | string | undefined): number => (safeFlourWeight * (Number(pct) || 0)) / 100
    const gramsToPct = (grams: number): number => ((Number(grams) || 0) / safeFlourWeight) * 100

    // Determine unit and display value
    const grams = pctToGrams(value)
    const isKG = mode === 'grams' && Math.abs(grams) >= 1000
    const currentUnit = mode === 'grams' ? (isKG ? 'kg' : 'g') : '%'

    const getDisplayValue = (): number => {
        const pct = Number(value) || 0
        if (mode === 'grams') {
            const g = pctToGrams(pct)
            if (isKG) return g / 1000
            return g < 10 ? g : Math.round(g)
        }
        return pct
    }

    // Local state for editing - prevents reformatting during typing
    const [localValue, setLocalValue] = useState<string>(() => {
        if (value === '' || value === null || value === undefined) return ''
        const displayVal = getDisplayValue()
        return isKG ? displayVal.toFixed(2) : displayVal.toString()
    })
    const [isFocused, setIsFocused] = useState(false)

    // Sync from props when not focused (external changes)
    useEffect(() => {
        if (!isFocused) {
            if (value === '' || value === null || value === undefined) {
                setLocalValue('')
            } else {
                const displayVal = getDisplayValue()
                if (mode === 'grams') {
                    const g = pctToGrams(Number(value) || 0)
                    if (isKG) {
                        setLocalValue(displayVal.toFixed(2))
                    } else {
                        setLocalValue(g < 10 ? g.toFixed(2) : Math.round(g).toString())
                    }
                } else {
                    setLocalValue(Number(displayVal).toFixed(decimals))
                }
            }
        }
    }, [value, mode, flourWeight, isFocused, isKG, decimals])

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const inputValue = e.target.value
        setLocalValue(inputValue)

        if (inputValue === '') {
            onChange?.(0)
            return
        }

        let numValue = parseFloat(inputValue)
        if (!Number.isNaN(numValue)) {
            // Prevent negative values
            numValue = Math.max(0, numValue)

            // Enforce max % limit if in pct mode
            if (mode === 'pct' && maxPct !== null && numValue > maxPct) {
                numValue = maxPct
                setLocalValue(numValue.toString())
            }

            // Convert to percentage for storage
            let finalGrams = numValue
            if (mode === 'grams' && isKG) {
                finalGrams = numValue * 1000
            }
            const pctValue = mode === 'grams' ? gramsToPct(finalGrams) : numValue
            onChange?.(pctValue)
        }
    }

    const handleFocus = (): void => {
        setIsFocused(true)
    }

    const handleBlur = (): void => {
        setIsFocused(false)
        if (localValue === '' || localValue === null) {
            setLocalValue('')
            return
        }
        const numValue = parseFloat(localValue)
        if (!Number.isNaN(numValue)) {
            if (mode === 'grams') {
                const g = pctToGrams(Number(value) || 0)
                if (isKG) {
                    setLocalValue(numValue.toFixed(2))
                } else {
                    setLocalValue(g < 10 ? numValue.toFixed(2) : Math.round(numValue).toString())
                }
            } else {
                setLocalValue(numValue.toFixed(decimals))
            }
        }
    }

    return (
        <label className="block">
            <div className="label mb-1">{label}</div>
            <div className="relative">
                <input
                    className="input text-right pr-8"
                    type="number"
                    inputMode="decimal"
                    name={name}
                    step={mode === 'grams' ? 1 : step}
                    value={localValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="0"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {currentUnit}
                </span>
            </div>
        </label>
    )
}
