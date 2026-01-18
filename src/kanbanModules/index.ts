/**
 * ═══════════════════════════════════════════════════════════════════
 * kanbanModules barrel exports
 * All components, hooks, types and utilities for Kanban module
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════
export type {
    CardLabel, ChecklistItem, Checklist, KanbanCardData, KanbanColumnData,
    KanbanBoard, ActiveDrag, DragTarget, DragState, PendingDrag,
    SpringConfig, SpringConfigs, ZoomConfig
} from './types'

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════
export {
    DEFAULT_KANBAN, STORAGE_KEY, spring, LABELS, ZOOM_CONFIG,
    VIRTUALIZATION_THRESHOLD, CARD_HEIGHT, DRAG_THRESHOLD
} from './types'

// ═══════════════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════════════
export { useKanbanState } from './hooks/useKanbanState'
export type { KanbanStateReturn } from './hooks/useKanbanState'

export { useKanbanHandlers } from './hooks/useKanbanHandlers'
export type { KanbanHandlersReturn, UseKanbanHandlersProps } from './hooks/useKanbanHandlers'

// ═══════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════
export { KanbanColumn } from './components/KanbanColumn'
export { VirtualizedCardList } from './components/VirtualizedCardList'
export { KanbanCard } from './components/KanbanCard'
export { DragGhost } from './components/DragGhost'
export { CardDetailsModal } from './components/CardDetailsModal'
export { AddColumnModal } from './components/AddColumnModal'
export { AddCardModal } from './components/AddCardModal'
export { KanbanView } from './components/KanbanView'

