/**
 * Kanban types, interfaces, and constants
 */

import { Transition } from 'framer-motion'

// Type Definitions
export interface CardLabel {
    id: string
    color: string
    name?: string
}

export interface ChecklistItem {
    id: string
    text: string
    done: boolean
}

export interface Checklist {
    id: string
    title: string
    items: ChecklistItem[]
}

export interface KanbanCardData {
    id: string
    title: string
    labels: CardLabel[]
    checklists: Checklist[]
    description: string
    createdAt: string
    columnId?: string
}

export interface KanbanColumnData {
    id: string
    title: string
    cards: KanbanCardData[]
}

export interface KanbanBoard {
    columns: KanbanColumnData[]
}

export interface ActiveDrag {
    id: string
    sourceColId: string
    sourceIndex: number
    data: KanbanCardData
    rect: DOMRect
    offsetX: number
    offsetY: number
}

export interface DragTarget {
    colId: string | null
    index: number
}

export interface DragState {
    active: ActiveDrag | null
    target: DragTarget | null
    isDragging: boolean
}

export interface PendingDrag {
    card: KanbanCardData
    colId: string
    element: HTMLElement
    rect: DOMRect
    startX: number
    startY: number
    offsetX: number
    offsetY: number
    cardIndex: number
}

export interface SpringConfig {
    type: string
    stiffness: number
    damping: number
    mass: number
}

export interface SpringConfigs {
    layout: Transition
    enter: Transition
    placeholder: Transition
    ghost: Transition
    shift: Transition
    modal: Transition
}

export interface ZoomConfig {
    width: string
    label: string
    cardPadding: string
}

// Constants
export const DEFAULT_KANBAN: KanbanBoard = {
    columns: [
        {
            id: 'todo', title: 'A Fazer', cards: [
                { id: 'card-1', title: 'Revisar receita de massa napoletana', labels: [{ id: 'indigo', color: '#6366f1' }], checklists: [], description: '', createdAt: new Date().toISOString() },
                { id: 'card-2', title: 'Contatar novo fornecedor de azeite', labels: [{ id: 'amber', color: '#f59e0b' }], checklists: [], description: '', createdAt: new Date().toISOString() }
            ]
        },
        {
            id: 'doing', title: 'Em Progresso', cards: [
                { id: 'card-3', title: 'Fotografar novas pizzas', labels: [{ id: 'indigo', color: '#6366f1' }], checklists: [], description: '', createdAt: new Date().toISOString() }
            ]
        },
        {
            id: 'done', title: 'Concluído', cards: [
                { id: 'card-4', title: 'Renovar contrato Moinho Globo', labels: [{ id: 'emerald', color: '#10b981' }], checklists: [], description: '', createdAt: new Date().toISOString() }
            ]
        }
    ]
}

export const STORAGE_KEY = 'padoca_kanban_pro_max'

// Premium Spring Configurations
export const spring = {
    layout: { type: "spring", stiffness: 500, damping: 40, mass: 1 },
    enter: { type: "spring", stiffness: 450, damping: 35, mass: 0.8 },
    placeholder: { type: "spring", stiffness: 600, damping: 45, mass: 0.7 },
    ghost: { type: "spring", stiffness: 500, damping: 40, mass: 1 },
    shift: { type: "spring", stiffness: 450, damping: 35, mass: 1 },
    modal: { type: "spring", stiffness: 400, damping: 30, mass: 1 }
} as const satisfies SpringConfigs

export const LABELS = [
    { id: 'emerald', name: 'Concluído', color: '#10b981' },
    { id: 'amber', name: 'Atenção', color: '#f59e0b' },
    { id: 'rose', name: 'Urgente', color: '#f43f5e' },
    { id: 'indigo', name: 'Em Progresso', color: '#6366f1' },
    { id: 'sky', name: 'Ideia', color: '#0ea5e9' },
    { id: 'violet', name: 'Revisão', color: '#8b5cf6' },
]

export const ZOOM_CONFIG: ZoomConfig[] = [
    { width: 'w-[85vw] md:w-[320px]', label: 'Foco', cardPadding: 'p-5' },
    { width: 'w-[45vw] md:w-[280px]', label: 'Visão', cardPadding: 'p-4' },
    { width: 'w-[30vw] md:w-[220px]', label: 'Quadro', cardPadding: 'p-3' }
]

export const VIRTUALIZATION_THRESHOLD = 15
export const CARD_HEIGHT = 100
export const DRAG_THRESHOLD = 4
