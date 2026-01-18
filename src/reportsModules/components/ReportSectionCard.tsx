/**
 * ReportSectionCard — Collapsible Report Section Component
 * 
 * Drag-and-drop enabled report section with visibility toggle.
 * @author Padoca Engineering Team
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Eye, EyeOff, GripVertical } from 'lucide-react'
import { MagneticHover, ElasticScale, RevealOnScroll } from './premium'
import { BookmarkButton } from './FunctionalityComponents'
import type { ReportType } from '../types'

interface ReportSectionCardProps {
    id: ReportType
    title: string
    description: string
    icon: React.ReactNode
    gradient: string
    isSelected: boolean
    onToggle: () => void
    children: React.ReactNode
    index: number
    isBookmarked?: boolean
    onBookmark?: () => void
}

export const ReportSectionCard: React.FC<ReportSectionCardProps> = ({
    id,
    title,
    description,
    icon,
    gradient,
    isSelected,
    onToggle,
    children,
    index,
    isBookmarked = false,
    onBookmark
}) => {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <RevealOnScroll direction="up">
            <section className="relative group">
                {/* Glass Card with subtle hover */}
                <motion.div
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.15 }}
                    className={`
                        relative overflow-hidden
                        bg-white/80 dark:bg-[#1c1c1e]/80
                        backdrop-blur-xl
                        rounded-[28px]
                        border transition-all duration-300
                        ${isSelected
                            ? 'border-[#007AFF]/40 shadow-[0_0_0_4px_rgba(0,122,255,0.1),0_8px_32px_rgba(0,0,0,0.08)]'
                            : 'border-black/[0.04] dark:border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
                        }
                    `}
                >
                    {/* Animated Gradient Stripe at Top */}
                    <motion.div
                        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}
                        initial={{ scaleX: 0, originX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: index * 0.03 + 0.1, duration: 0.5 }}
                    />

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.06]">
                        <div className="flex items-center gap-4">
                            {/* Icon with subtle hover */}
                            <MagneticHover strength={0.05}>
                                <ElasticScale scale={1.03}>
                                    <motion.div
                                        whileTap={{ scale: 0.97 }}
                                        className={`
                                            relative w-14 h-14 rounded-[18px] 
                                            bg-gradient-to-br ${gradient}
                                            flex items-center justify-center text-white
                                            shadow-lg cursor-pointer
                                        `}
                                    >
                                        {icon}
                                        <div className="absolute inset-0 rounded-[18px] bg-gradient-to-tr from-white/30 to-transparent" />
                                    </motion.div>
                                </ElasticScale>
                            </MagneticHover>

                            {/* Title */}
                            <div>
                                <h3 className="text-[20px] font-semibold text-[#1d1d1f] dark:text-white tracking-[-0.02em]">
                                    {title}
                                </h3>
                                <p className="text-[14px] text-[#86868b]">
                                    {description}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            {/* Drag Handle */}
                            <div className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Bookmark Button */}
                            {onBookmark && (
                                <BookmarkButton
                                    reportId={id}
                                    isBookmarked={isBookmarked}
                                    onToggle={onBookmark}
                                />
                            )}

                            {/* Show/Hide Chart Toggle */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsExpanded(!isExpanded)}
                                className={`p-2 rounded-xl transition-all ${isExpanded
                                    ? 'bg-[#007AFF]/10 text-[#007AFF]'
                                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                                title={isExpanded ? 'Ocultar gráfico' : 'Mostrar gráfico'}
                            >
                                {isExpanded ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </motion.button>

                            {/* Selection Toggle for Print */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onToggle}
                                className={`
                                    w-7 h-7 rounded-full
                                    flex items-center justify-center
                                    transition-all duration-200
                                    ${isSelected
                                        ? 'bg-[#007AFF] shadow-[0_0_12px_rgba(0,122,255,0.4)]'
                                        : 'border-2 border-[#d1d1d6] dark:border-[#48484a] hover:border-[#007AFF]/50'
                                    }
                                `}
                                title={isSelected ? 'Remover da impressão' : 'Incluir na impressão'}
                            >
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                        >
                                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </div>

                    {/* Content */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, filter: 'blur(8px)' }}
                                animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
                                exit={{ height: 0, opacity: 0, filter: 'blur(8px)' }}
                                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="p-6">
                                    {children}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </section>
        </RevealOnScroll>
    )
}
