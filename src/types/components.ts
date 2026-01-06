/**
 * ═══════════════════════════════════════════════════════════════════
 * PADOCA PIZZA — Common Component Types
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Shared types for React components across the application.
 */

import React from 'react'

// ═══════════════════════════════════════════════════════════════════
// COMMON COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════

/** Base props for all components */
export interface BaseProps {
    className?: string
    style?: React.CSSProperties
}

/** Props for components with children */
export interface WithChildren {
    children?: React.ReactNode
}

/** Common modal props */
export interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
}

/** Props for toggle/switch components */
export interface ToggleProps {
    active?: boolean
    onChange?: (active: boolean) => void
    disabled?: boolean
}

// ═══════════════════════════════════════════════════════════════════
// FORM TYPES
// ═══════════════════════════════════════════════════════════════════

/** Common input props */
export interface InputProps {
    value: string | number
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    autoFocus?: boolean
}

/** Select option */
export interface SelectOption {
    value: string | number
    label: string
}

// ═══════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════

export type ChangeHandler<T = string> = (value: T) => void
export type ClickHandler = (event: React.MouseEvent) => void
export type KeyboardHandler = (event: React.KeyboardEvent) => void
export type FormSubmitHandler = (event: React.FormEvent) => void

// ═══════════════════════════════════════════════════════════════════
// VIEW TYPES
// ═══════════════════════════════════════════════════════════════════

export type ViewName =
    | 'production'
    | 'recipes'
    | 'inventory'
    | 'suppliers'
    | 'costs'
    | 'products'
    | 'kanban'
    | 'fichatecnica'
    | 'ai'
    | 'settings'

export type InputMode = 'pct' | 'grams'

// ═══════════════════════════════════════════════════════════════════
// FRAMER MOTION TYPES
// ═══════════════════════════════════════════════════════════════════

export const springTransition = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30
}

export const gentleSpringTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25
}

// ═══════════════════════════════════════════════════════════════════
// ICON PROPS
// ═══════════════════════════════════════════════════════════════════

export interface IconProps {
    active?: boolean
    size?: number
    className?: string
    color?: string
}
