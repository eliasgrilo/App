// ═══════════════════════════════════════════════════════════════════
// SUPPLIER FORM — Form Layout Components
// Section, Row components for form structure
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icons, iconGradients, iconShadows } from '../Icons'

export interface SectionProps {
    icon: React.ReactNode
    iconKey: string
    title: string
    children: React.ReactNode
    footer?: string
    delay?: number
    expandable?: boolean
    defaultExpanded?: boolean
}

export function Section({ icon, iconKey, title, children, footer, delay = 0, expandable = false, defaultExpanded = true }: SectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    return (
        <motion.section className="mb-5"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: delay * 0.06 }}>
            <motion.button onClick={expandable ? () => setIsExpanded(!isExpanded) : undefined}
                className={`w-full flex items-center gap-3 mb-2.5 px-4 ${expandable ? 'cursor-pointer' : 'cursor-default'}`}
                whileTap={expandable ? { scale: 0.99 } : {}}>
                <motion.div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white"
                    style={{ background: iconGradients[iconKey] || iconGradients.identification, boxShadow: `0 4px 12px ${iconShadows[iconKey] || 'rgba(0,0,0,0.2)'}` }}
                    whileHover={{ scale: 1.08, rotate: 3 }} whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                    {icon}
                </motion.div>
                <span className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight flex-1 text-left">{title}</span>
                {expandable && (
                    <motion.div className="text-[#c7c7cc]" animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}>{Icons.chevronDown}</motion.div>
                )}
            </motion.button>

            <AnimatePresence>
                {(!expandable || isExpanded) && (
                    <motion.div initial={expandable ? { height: 0, opacity: 0 } : false}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={expandable ? { height: 0, opacity: 0 } : {}}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }} className="overflow-hidden">
                        <div className="mx-4 bg-white dark:bg-[#1c1c1e] rounded-[14px] overflow-hidden shadow-sm border border-black/[0.04] dark:border-white/[0.06]">
                            {children}
                        </div>
                        {footer && <p className="px-5 pt-2 text-[13px] text-[#6d6d72] dark:text-[#8e8e93]">{footer}</p>}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    )
}

export interface RowProps {
    label: string
    last?: boolean
    children: React.ReactNode
}

export function Row({ label, last, children }: RowProps) {
    return (
        <div className={`flex items-center justify-between min-h-[52px] px-4 ${!last ? 'border-b border-[#e5e5ea]/60 dark:border-[#38383a]/80' : ''}`}>
            <span className="text-[17px] text-[#1d1d1f] dark:text-white">{label}</span>
            <div className="flex items-center gap-2">{children}</div>
        </div>
    )
}
