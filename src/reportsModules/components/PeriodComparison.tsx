/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PERIOD COMPARISON SELECTOR — Apple-Style Temporal Analysis
 * 
 * Compare different time periods with:
 * - Week vs week
 * - Month vs month
 * - Custom periods
 * - Animated toggle
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronDown, ArrowLeftRight } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type ComparisonPeriod = 'none' | 'previous_week' | 'previous_month' | 'previous_year' | 'custom'

interface ComparisonOption {
    id: ComparisonPeriod
    label: string
    shortLabel: string
}

interface PeriodComparisonProps {
    value: ComparisonPeriod
    onChange: (period: ComparisonPeriod) => void
    className?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const COMPARISON_OPTIONS: ComparisonOption[] = [
    { id: 'none', label: 'Sem comparação', shortLabel: 'Atual' },
    { id: 'previous_week', label: 'Semana anterior', shortLabel: 'vs Semana' },
    { id: 'previous_month', label: 'Mês anterior', shortLabel: 'vs Mês' },
    { id: 'previous_year', label: 'Ano anterior', shortLabel: 'vs Ano' }
]

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const PeriodComparison: React.FC<PeriodComparisonProps> = ({
    value,
    onChange,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const currentOption = COMPARISON_OPTIONS.find(o => o.id === value) ?? COMPARISON_OPTIONS[0]!

    return (
        <div className={`relative ${className}`}>
            {/* Trigger */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-2
                    rounded-xl text-sm font-medium
                    border transition-colors duration-150
                    ${value !== 'none'
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }
                `}
            >
                <ArrowLeftRight className="w-4 h-4" />
                <span>{currentOption.shortLabel}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                </motion.span>
            </motion.button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="
                            absolute left-0 top-full mt-2 z-50
                            w-52 p-1.5
                            bg-white dark:bg-zinc-900
                            border border-zinc-200 dark:border-zinc-700
                            rounded-xl shadow-xl
                        "
                    >
                        {COMPARISON_OPTIONS.map((option) => (
                            <motion.button
                                key={option.id}
                                whileHover={{ x: 2 }}
                                onClick={() => {
                                    onChange(option.id)
                                    setIsOpen(false)
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2.5
                                    rounded-lg text-left text-sm
                                    transition-colors duration-150
                                    ${value === option.id
                                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400'
                                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                    }
                                `}
                            >
                                <span className={`
                                    w-1.5 h-1.5 rounded-full flex-shrink-0
                                    ${value === option.id ? 'bg-blue-500' : 'bg-transparent'}
                                `} />
                                <span className="font-medium">{option.label}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                </>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEGMENTED PERIOD CONTROL — Inline version
// ═══════════════════════════════════════════════════════════════════════════════

interface SegmentedPeriodControlProps {
    value: ComparisonPeriod
    onChange: (period: ComparisonPeriod) => void
    className?: string
}

export const SegmentedPeriodControl: React.FC<SegmentedPeriodControlProps> = ({
    value,
    onChange,
    className = ''
}) => {
    const options = COMPARISON_OPTIONS.slice(0, 4) // Exclude custom

    return (
        <div className={`
            inline-flex items-center p-1
            bg-zinc-100 dark:bg-zinc-800
            rounded-xl
            ${className}
        `}>
            {options.map((option) => (
                <motion.button
                    key={option.id}
                    onClick={() => onChange(option.id)}
                    className={`
                        relative px-3 py-1.5 text-xs font-medium
                        rounded-lg transition-colors duration-150
                        ${value === option.id
                            ? 'text-zinc-900 dark:text-white'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }
                    `}
                >
                    {value === option.id && (
                        <motion.div
                            layoutId="period-background"
                            className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-lg shadow-sm"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10">{option.shortLabel}</span>
                </motion.button>
            ))}
        </div>
    )
}

export default PeriodComparison
