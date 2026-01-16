/**
 * FormRow — Form layout wrapper with hover states
 * Used in form sections across modals
 */

import React from 'react'
import { motion } from 'framer-motion'

export interface FormRowProps {
    label: string
    hint?: string
    children: React.ReactNode
    last?: boolean
}

export const FormRow: React.FC<FormRowProps> = ({ label, hint, children, last = false }) => (
    <motion.div
        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
        className={`flex items-center justify-between gap-4 px-4 py-3 ${!last ? 'border-b border-zinc-100/80 dark:border-zinc-700/30' : ''}`}
    >
        <div className="flex-1 min-w-0">
            <span className="text-[15px] font-medium text-zinc-900 dark:text-white">{label}</span>
            {hint && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{hint}</p>}
        </div>
        <div className="shrink-0">{children}</div>
    </motion.div>
)

export default FormRow
