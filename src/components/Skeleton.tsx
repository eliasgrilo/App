// ═══════════════════════════════════════════════════════════════════
// SKELETON LOADERS — Re-exports from modules
// Refactored: 323 → ~15 lines (barrel export)
// ═══════════════════════════════════════════════════════════════════

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonListItem, SkeletonList, SkeletonTable, SkeletonGrid, SkeletonStats, SkeletonDashboard } from '../skeletonModules'
export type { SkeletonProps, SkeletonTextProps, SkeletonAvatarProps, SkeletonCardProps, SkeletonListItemProps, SkeletonListProps, SkeletonTableProps, SkeletonGridProps, SkeletonStatsProps, RoundedSize, AvatarSize } from '../skeletonModules'

// Default export
export { Skeleton as default } from '../skeletonModules'
