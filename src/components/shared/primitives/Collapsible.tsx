/**
 * Collapsible — Apple-style expandable section
 * Used in modals for optional/advanced settings
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SPRING_BOUNCY, SPRING_SMOOTH } from './animations'
import { GlassCard } from './GlassCard'

export interface CollapsibleProps {
    /** Icon element to display */
    icon: React.ReactNode
    /** Section title */
    title: string
    /** Gradient class (e.g., 'from-blue-500 to-blue-600') */
    gradient: string
    /** Section content */
    children: React.ReactNode
    /** Initial open state */
    defaultOpen?: boolean
}

const ChevronIcon: React.FC = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
)

export const Collapsible: React.FC<CollapsibleProps> = ({
    icon,
    title,
    gradient,
    children,
    defaultOpen = false
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <GlassCard>
            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
                        {icon}
                    </div>
                    <span className="text-[15px] font-semibold text-zinc-900 dark:text-white">{title}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={SPRING_BOUNCY}
                    className="text-zinc-400"
                >
                    <ChevronIcon />
                </motion.div>
            </motion.button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={SPRING_SMOOTH}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-zinc-100/80 dark:border-zinc-700/30">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </GlassCard>
    )
}

export default Collapsible
