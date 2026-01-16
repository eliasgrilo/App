/**
 * AppleTextarea — Premium style textarea
 * Used across modals for multi-line text input
 */

import React from 'react'

export interface AppleTextareaProps {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    rows?: number
}

export const AppleTextarea: React.FC<AppleTextareaProps> = ({ value, onChange, placeholder, rows = 3 }) => (
    <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="
            w-full px-4 py-3 rounded-xl
            bg-zinc-100/80 dark:bg-zinc-700/50
            border-0 outline-none resize-none
            text-[15px] font-medium text-zinc-900 dark:text-white
            placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            focus:bg-white dark:focus:bg-zinc-700
            focus:ring-2 focus:ring-blue-500/40
            transition-all duration-200
        "
    />
)

export default AppleTextarea
