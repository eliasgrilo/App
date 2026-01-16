// ═══════════════════════════════════════════════════════════════════
// RECIPE CATEGORY MODAL MODULES — Types & Utils
// ═══════════════════════════════════════════════════════════════════

import React from 'react'

export type CategoryInput = string | { name: string; color?: string }
export type NormalizedCategory = { name: string; color: string }

export interface RecipeCategoryModalProps {
    categories: CategoryInput[]; onClose: () => void; onUpdate: (categories: NormalizedCategory[]) => void; onRenameCategory: (oldName: string, newName: string) => void
}

export interface CategoryItemProps {
    cat: CategoryInput; name: string; color: string; catId: string; editingId: string | null; editValue: string; colorPicker: string | null
    setEditingId: (id: string | null) => void; setEditValue: (v: string) => void; setColorPicker: (id: string | null) => void; setConfirmDelete: (cat: CategoryInput | null) => void
    handleRename: (cat: CategoryInput) => void; handleColorChange: (cat: CategoryInput, color: string) => void
}

export const getCategoryName = (cat: CategoryInput): string => { if (typeof cat === 'string') return cat; return cat?.name || 'Sem categoria' }
export const normalizeCategory = (cat: CategoryInput): NormalizedCategory => { if (typeof cat === 'string') return { name: cat, color: '#007AFF' }; return { name: cat.name || 'Sem nome', color: cat.color || '#007AFF' } }

export const colorPalette = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#8E8E93']

