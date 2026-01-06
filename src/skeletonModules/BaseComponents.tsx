// ═══════════════════════════════════════════════════════════════════
// SKELETON MODULES — Base Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { SkeletonProps, SkeletonTextProps, SkeletonAvatarProps, shimmerVariants, roundedClasses, avatarSizes } from './types'

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height, rounded = 'lg', animate = true }) => (
    <div className={`relative overflow-hidden bg-zinc-200/80 dark:bg-zinc-800/80 ${roundedClasses[rounded] || 'rounded-lg'} ${className}`} style={{ width, height }}>
        {animate && <motion.div variants={shimmerVariants} initial="initial" animate="animate" className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />}
    </div>
)

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 1, lastLineWidth = '60%', gap = 'gap-2', lineHeight = 'h-4' }) => (
    <div className={`flex flex-col ${gap}`}>
        {Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className={lineHeight} width={i === lines - 1 ? lastLineWidth : '100%'} rounded="md" />)}
    </div>
)

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = 'md' }) => <Skeleton className={avatarSizes[size]} rounded="full" />
