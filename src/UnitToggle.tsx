import { ReactNode } from 'react'

/**
 * UnitToggle - Apple-style segmented control for unit selection
 */

type UnitMode = 'pct' | 'grams'

interface UnitToggleProps {
    value: UnitMode
    onChange?: (mode: UnitMode) => void
}

interface UnitOption {
    key: UnitMode
    label: string
}

export default function UnitToggle({ value, onChange }: UnitToggleProps): ReactNode {
    const options: UnitOption[] = [
        { key: 'pct', label: '%' },
        { key: 'grams', label: 'g' }
    ]

    return (
        <div className="inline-flex rounded-lg bg-gray-200/80 dark:bg-zinc-700/80 p-0.5 backdrop-blur-sm">
            {options.map((opt) => (
                <button
                    key={opt.key}
                    type="button"
                    onClick={() => onChange?.(opt.key)}
                    className={`
            relative px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-[250ms] ease-out
            ${value === opt.key
                            ? 'bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }
          `}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}
