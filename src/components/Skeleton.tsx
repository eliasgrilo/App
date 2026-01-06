import React from 'react'
import { motion, Variants } from 'framer-motion'

/**
 * ═══════════════════════════════════════════════════════════════════
 * SKELETON LOADERS — Apple HIG Premium Design
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ TYPES ═══
type RoundedSize = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface SkeletonProps {
    className?: string
    width?: string | number
    height?: string | number
    rounded?: RoundedSize
    animate?: boolean
}

interface SkeletonTextProps {
    lines?: number
    lastLineWidth?: string
    gap?: string
    lineHeight?: string
}

interface SkeletonAvatarProps {
    size?: AvatarSize
}

interface SkeletonCardProps {
    hasImage?: boolean
    hasAvatar?: boolean
    lines?: number
}

interface SkeletonListItemProps {
    hasIcon?: boolean
    hasAction?: boolean
}

interface SkeletonListProps {
    count?: number
    hasIcon?: boolean
    hasAction?: boolean
    gap?: string
}

interface SkeletonTableProps {
    rows?: number
    columns?: number
}

interface SkeletonGridProps {
    count?: number
    columns?: {
        sm?: number
        md?: number
        lg?: number
    }
    hasImage?: boolean
}

interface SkeletonStatsProps {
    count?: number
}

// ═══ SHIMMER ANIMATION ═══
const shimmerVariants: Variants = {
    initial: { x: '-100%' },
    animate: {
        x: '100%',
        transition: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 2,
            ease: 'easeInOut'
        }
    }
}

// ═══ BASE SKELETON COMPONENT ═══
export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width,
    height,
    rounded = 'lg',
    animate = true
}) => {
    const roundedClasses: Record<RoundedSize, string> = {
        'none': 'rounded-none',
        'sm': 'rounded-sm',
        'md': 'rounded-md',
        'lg': 'rounded-lg',
        'xl': 'rounded-xl',
        '2xl': 'rounded-2xl',
        '3xl': 'rounded-3xl',
        'full': 'rounded-full'
    }

    const roundedClass = roundedClasses[rounded] || 'rounded-lg'

    return (
        <div
            className={`relative overflow-hidden bg-zinc-200/80 dark:bg-zinc-800/80 ${roundedClass} ${className}`}
            style={{ width, height }}
        >
            {animate && (
                <motion.div
                    variants={shimmerVariants}
                    initial="initial"
                    animate="animate"
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"
                />
            )}
        </div>
    )
}

// ═══ SKELETON TEXT ═══
export const SkeletonText: React.FC<SkeletonTextProps> = ({
    lines = 1,
    lastLineWidth = '60%',
    gap = 'gap-2',
    lineHeight = 'h-4'
}) => (
    <div className={`flex flex-col ${gap}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                className={lineHeight}
                width={i === lines - 1 ? lastLineWidth : '100%'}
                rounded="md"
            />
        ))}
    </div>
)

// ═══ SKELETON AVATAR ═══
export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
    size = 'md'
}) => {
    const sizes: Record<AvatarSize, string> = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
        '2xl': 'w-20 h-20'
    }

    return <Skeleton className={sizes[size]} rounded="full" />
}

// ═══ SKELETON CARD — Premium Recipe/Product Card ═══
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
    hasImage = true,
    hasAvatar = false,
    lines = 2
}) => (
    <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden">
        {/* Image Placeholder */}
        {hasImage && (
            <Skeleton
                className="w-full aspect-[4/3] mb-5"
                rounded="2xl"
            />
        )}

        {/* Header with optional avatar */}
        <div className="flex items-center gap-3 mb-4">
            {hasAvatar && <SkeletonAvatar size="md" />}
            <div className="flex-1">
                <Skeleton className="h-5 mb-2" width="70%" rounded="md" />
                <Skeleton className="h-3" width="40%" rounded="md" />
            </div>
        </div>

        {/* Content Lines */}
        <SkeletonText lines={lines} lineHeight="h-3" gap="gap-2" />

        {/* Footer */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-100/80 dark:border-white/5">
            <Skeleton className="h-4 w-20" rounded="md" />
            <Skeleton className="h-8 w-24" rounded="xl" />
        </div>
    </div>
)

// ═══ SKELETON LIST ITEM ═══
export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
    hasIcon = true,
    hasAction = true
}) => (
    <div className="flex items-center gap-4 py-4 px-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10">
        {hasIcon && <Skeleton className="w-10 h-10" rounded="xl" />}
        <div className="flex-1">
            <Skeleton className="h-4 mb-2" width="60%" rounded="md" />
            <Skeleton className="h-3" width="35%" rounded="md" />
        </div>
        {hasAction && <Skeleton className="w-8 h-8" rounded="lg" />}
    </div>
)

// ═══ SKELETON LIST ═══
export const SkeletonList: React.FC<SkeletonListProps> = ({
    count = 3,
    hasIcon = true,
    hasAction = true,
    gap = 'gap-3'
}) => (
    <div className={`flex flex-col ${gap}`}>
        {Array.from({ length: count }).map((_, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
            >
                <SkeletonListItem hasIcon={hasIcon} hasAction={hasAction} />
            </motion.div>
        ))}
    </div>
)

// ═══ SKELETON TABLE ═══
export const SkeletonTable: React.FC<SkeletonTableProps> = ({
    rows = 5,
    columns = 4
}) => (
    <div className="bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="grid gap-4 p-4 border-b border-zinc-100/80 dark:border-white/5"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-3" width="80%" rounded="md" />
            ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
            <motion.div
                key={rowIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: rowIdx * 0.05 }}
                className="grid gap-4 p-4 border-b border-zinc-50 dark:border-white/5 last:border-0"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
                {Array.from({ length: columns }).map((_, colIdx) => (
                    <Skeleton
                        key={colIdx}
                        className="h-4"
                        width={colIdx === 0 ? '90%' : '70%'}
                        rounded="md"
                    />
                ))}
            </motion.div>
        ))}
    </div>
)

// ═══ SKELETON GRID (for Recipe/Product cards) ═══
export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
    count = 6,
    columns = { sm: 1, md: 2, lg: 3 },
    hasImage = true
}) => (
    <div className={`grid grid-cols-1 sm:grid-cols-${columns.sm || 1} md:grid-cols-${columns.md || 2} lg:grid-cols-${columns.lg || 3} gap-4 md:gap-6`}>
        {Array.from({ length: count }).map((_, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
            >
                <SkeletonCard hasImage={hasImage} />
            </motion.div>
        ))}
    </div>
)

// ═══ SKELETON STATS CARD ═══
export const SkeletonStats: React.FC<SkeletonStatsProps> = ({ count = 3 }) => (
    <div className={`grid grid-cols-1 md:grid-cols-${count} gap-4`}>
        {Array.from({ length: count }).map((_, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10"
            >
                <Skeleton className="h-3 mb-4" width="40%" rounded="md" />
                <Skeleton className="h-10 mb-2" width="60%" rounded="md" />
                <Skeleton className="h-2" width="30%" rounded="md" />
            </motion.div>
        ))}
    </div>
)

// ═══ SKELETON DASHBOARD ═══
export const SkeletonDashboard: React.FC = () => (
    <div className="space-y-6">
        {/* Stats Row */}
        <SkeletonStats count={4} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <SkeletonTable rows={5} columns={4} />
            </div>
            <div>
                <SkeletonList count={4} />
            </div>
        </div>
    </div>
)

export default Skeleton
