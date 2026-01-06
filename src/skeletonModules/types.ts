// ═══════════════════════════════════════════════════════════════════
// SKELETON MODULES — Types & Animation
// ═══════════════════════════════════════════════════════════════════

import { Variants } from 'framer-motion'

export type RoundedSize = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface SkeletonProps { className?: string; width?: string | number; height?: string | number; rounded?: RoundedSize; animate?: boolean }
export interface SkeletonTextProps { lines?: number; lastLineWidth?: string; gap?: string; lineHeight?: string }
export interface SkeletonAvatarProps { size?: AvatarSize }
export interface SkeletonCardProps { hasImage?: boolean; hasAvatar?: boolean; lines?: number }
export interface SkeletonListItemProps { hasIcon?: boolean; hasAction?: boolean }
export interface SkeletonListProps { count?: number; hasIcon?: boolean; hasAction?: boolean; gap?: string }
export interface SkeletonTableProps { rows?: number; columns?: number }
export interface SkeletonGridProps { count?: number; columns?: { sm?: number; md?: number; lg?: number }; hasImage?: boolean }
export interface SkeletonStatsProps { count?: number }

export const shimmerVariants: Variants = { initial: { x: '-100%' }, animate: { x: '100%', transition: { repeat: Infinity, repeatType: 'loop', duration: 2, ease: 'easeInOut' } } }
export const roundedClasses: Record<RoundedSize, string> = { 'none': 'rounded-none', 'sm': 'rounded-sm', 'md': 'rounded-md', 'lg': 'rounded-lg', 'xl': 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl', 'full': 'rounded-full' }
export const avatarSizes: Record<AvatarSize, string> = { xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16', '2xl': 'w-20 h-20' }
