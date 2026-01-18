/**
 * AppleSelect — iOS-style dropdown select
 * Styled native select with chevron indicator
 */

import React from 'react'

export interface AppleSelectProps {
    /** Currently selected value */
    value: string
    /** Change handler */
    onChange: (value: string) => void
    /** Available options */
    options: string[]
    /** Optional placeholder */
    placeholder?: string
}

const ChevronDownIcon: React.FC = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
)

export const AppleSelect: React.FC<AppleSelectProps> = ({
    value,
    onChange,
    options,
    placeholder
}) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="
                h-9 pl-3 pr-8 rounded-lg appearance-none
                bg-zinc-100/80 dark:bg-zinc-700/50
                border-0 outline-none
                text-[15px] font-medium text-zinc-900 dark:text-white
                focus:bg-white dark:focus:bg-zinc-700
                focus:ring-2 focus:ring-blue-500/40
                transition-all duration-200 cursor-pointer
            "
        >
            {placeholder && (
                <option value="" disabled>
                    {placeholder}
                </option>
            )}
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
            <ChevronDownIcon />
        </div>
    </div>
)

export default AppleSelect
