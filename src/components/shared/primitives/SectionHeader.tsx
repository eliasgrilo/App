/**
 * SectionHeader — Header with gradient icon
 * Used in form sections across modals
 */

import React from 'react'

export interface SectionHeaderProps {
    icon: React.ReactNode
    title: string
    gradient: string
    subtitle?: string
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, gradient, subtitle }) => (
    <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
            {icon}
        </div>
        <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
    </div>
)

export default SectionHeader
