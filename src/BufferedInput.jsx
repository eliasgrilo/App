import React, { useState, useEffect } from 'react'

/**
 * BufferedInput - Handles input with local state to prevent jumping while typing
 * Used for calculated fields that act as inputs (like Total Flour reverse calc)
 * Supports dynamic g/kg display: >= 1000g shows as kg, < 1000g shows as g
 */
export default function BufferedInput({
    label,
    value,
    onChange,
    unit = '',
    type = 'number',
    placeholder = '0',
    pattern, // No default pattern to prevent blocking decimals
    inputMode // Allow overriding inputMode
}) {
    // Determine if we should show kg instead of g (>= 1000g)
    const numericValue = Number(value) || 0
    const isKG = unit === 'g' && Math.abs(numericValue) >= 1000
    const displayUnit = isKG ? 'kg' : unit

    // Calculate display value (convert to kg if >= 1000)
    const getDisplayValue = () => {
        if (isKG) {
            return Math.round(numericValue / 1000).toString()
        }
        return Math.round(numericValue).toString()
    }

    const [localValue, setLocalValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    // Sync from props when not focused
    useEffect(() => {
        if (!isFocused) {
            setLocalValue(value === undefined || value === null ? '' : getDisplayValue())
        }
    }, [value, isFocused, isKG])

    const handleChange = (e) => {
        const val = e.target.value
        setLocalValue(val)

        // Always interpret input as GRAMS directly - no conversion
        // This way user types the exact gram value they want
        const numVal = parseFloat(val) || 0
        onChange?.(numVal)
    }

    const handleFocus = () => setIsFocused(true)

    const handleBlur = () => {
        setIsFocused(false)
        if (value !== undefined && value !== null) {
            setLocalValue(getDisplayValue())
        }
    }

    return (
        <label className="block">
            <div className="label mb-1">{label}</div>
            <div className="relative">
                <input
                    className="input text-right pr-8"
                    type={type}
                    inputMode={inputMode || (type === 'number' ? 'decimal' : 'text')}
                    pattern={pattern}
                    value={localValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                />
                {displayUnit && (
                    <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {displayUnit}
                    </span>
                )}
            </div>
        </label>
    )
}
