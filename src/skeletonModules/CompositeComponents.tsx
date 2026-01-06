// ═══════════════════════════════════════════════════════════════════
// SKELETON MODULES — Composite Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { SkeletonCardProps, SkeletonListItemProps, SkeletonListProps, SkeletonTableProps, SkeletonGridProps, SkeletonStatsProps } from './types'
import { Skeleton, SkeletonText, SkeletonAvatar } from './BaseComponents'

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ hasImage = true, hasAvatar = false, lines = 2 }) => (
    <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden">
        {hasImage && <Skeleton className="w-full aspect-[4/3] mb-5" rounded="2xl" />}
        <div className="flex items-center gap-3 mb-4">{hasAvatar && <SkeletonAvatar size="md" />}<div className="flex-1"><Skeleton className="h-5 mb-2" width="70%" rounded="md" /><Skeleton className="h-3" width="40%" rounded="md" /></div></div>
        <SkeletonText lines={lines} lineHeight="h-3" gap="gap-2" />
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-100/80 dark:border-white/5"><Skeleton className="h-4 w-20" rounded="md" /><Skeleton className="h-8 w-24" rounded="xl" /></div>
    </div>
)

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({ hasIcon = true, hasAction = true }) => (
    <div className="flex items-center gap-4 py-4 px-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10">
        {hasIcon && <Skeleton className="w-10 h-10" rounded="xl" />}<div className="flex-1"><Skeleton className="h-4 mb-2" width="60%" rounded="md" /><Skeleton className="h-3" width="35%" rounded="md" /></div>{hasAction && <Skeleton className="w-8 h-8" rounded="lg" />}
    </div>
)

export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 3, hasIcon = true, hasAction = true, gap = 'gap-3' }) => (
    <div className={`flex flex-col ${gap}`}>{Array.from({ length: count }).map((_, i) => <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}><SkeletonListItem hasIcon={hasIcon} hasAction={hasAction} /></motion.div>)}</div>
)

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 4 }) => (
    <div className="bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden">
        <div className="grid gap-4 p-4 border-b border-zinc-100/80 dark:border-white/5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>{Array.from({ length: columns }).map((_, i) => <Skeleton key={i} className="h-3" width="80%" rounded="md" />)}</div>
        {Array.from({ length: rows }).map((_, rowIdx) => <motion.div key={rowIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: rowIdx * 0.05 }} className="grid gap-4 p-4 border-b border-zinc-50 dark:border-white/5 last:border-0" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>{Array.from({ length: columns }).map((_, colIdx) => <Skeleton key={colIdx} className="h-4" width={colIdx === 0 ? '90%' : '70%'} rounded="md" />)}</motion.div>)}
    </div>
)

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ count = 6, columns = { sm: 1, md: 2, lg: 3 }, hasImage = true }) => (
    <div className={`grid grid-cols-1 sm:grid-cols-${columns.sm || 1} md:grid-cols-${columns.md || 2} lg:grid-cols-${columns.lg || 3} gap-4 md:gap-6`}>
        {Array.from({ length: count }).map((_, i) => <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}><SkeletonCard hasImage={hasImage} /></motion.div>)}
    </div>
)

export const SkeletonStats: React.FC<SkeletonStatsProps> = ({ count = 3 }) => (
    <div className={`grid grid-cols-1 md:grid-cols-${count} gap-4`}>
        {Array.from({ length: count }).map((_, i) => <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10"><Skeleton className="h-3 mb-4" width="40%" rounded="md" /><Skeleton className="h-10 mb-2" width="60%" rounded="md" /><Skeleton className="h-2" width="30%" rounded="md" /></motion.div>)}
    </div>
)

export const SkeletonDashboard: React.FC = () => (
    <div className="space-y-6"><SkeletonStats count={4} /><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><SkeletonTable rows={5} columns={4} /></div><div><SkeletonList count={4} /></div></div></div>
)
