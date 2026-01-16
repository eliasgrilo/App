/**
 * ReportCard — Apple HIG Premium Report Card
 * 
 * Wrapper component for individual report sections.
 * Follows Apple Human Interface Guidelines with:
 * - Continuous corner radius (squircle)
 * - Spring physics animations
 * - Premium glassmorphism effects
 * - 8pt grid spacing
 * 
 * @author Padoca Engineering Team
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ReportCardProps {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    gradient: string
    isSelected: boolean
    onToggle: (id: string) => void
    children: React.ReactNode
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION CONFIG (Apple Spring Physics)
// ═══════════════════════════════════════════════════════════════════════════════

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 }

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const ReportCard: React.FC<ReportCardProps> = ({
    id,
    title,
    description,
    icon,
    gradient,
    isSelected,
    onToggle,
    children
}) => (
    <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        whileHover={{ y: -2 }}
        className={`
            relative overflow-hidden
            bg-white dark:bg-[#1c1c1e]
            rounded-[20px]
            transition-all duration-300
            ${isSelected
                ? 'ring-2 ring-[#007AFF] ring-offset-2 ring-offset-white dark:ring-offset-[#000] shadow-lg shadow-[#007AFF]/10'
                : 'border border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:shadow-md'
            }
        `}
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}
    >
        {/* Header */}
        <div
            className="flex items-center justify-between p-5 cursor-pointer select-none"
            onClick={() => onToggle(id)}
        >
            <div className="flex items-center gap-4">
                {/* Icon Container */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                        w-12 h-12 rounded-[14px] bg-gradient-to-br ${gradient}
                        flex items-center justify-center text-white
                        shadow-lg
                    `}
                >
                    {icon}
                </motion.div>

                {/* Title & Description */}
                <div>
                    <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-[-0.02em]">
                        {title}
                    </h3>
                    <p className="text-[13px] text-[#86868b] tracking-[-0.01em]">
                        {description}
                    </p>
                </div>
            </div>

            {/* Selection Checkbox — Apple Style */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                className={`
                    w-[26px] h-[26px] rounded-full
                    flex items-center justify-center
                    transition-all duration-200
                    ${isSelected
                        ? 'bg-[#007AFF] shadow-[0_2px_8px_rgba(0,122,255,0.4)]'
                        : 'border-2 border-[#d1d1d6] dark:border-[#48484a] bg-transparent'
                    }
                `}
            >
                {isSelected && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </motion.div>
                )}
            </motion.button>
        </div>

        {/* Content Area */}
        <div className="px-5 pb-5">
            {children}
        </div>
    </motion.section>
)

export default ReportCard
