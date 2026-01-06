// ═══════════════════════════════════════════════════════════════════
// RECIPE CATEGORY MODAL MODULES — Types & Utils
// ═══════════════════════════════════════════════════════════════════

import React from 'react'

export interface RecipeCategoryModalProps {
    categories: any[]; onClose: () => void; onUpdate: (categories: any[]) => void; onRenameCategory: (oldName: string, newName: string) => void
}

export interface CategoryItemProps {
    cat: any; name: string; color: string; catId: string; editingId: any; editValue: string; colorPicker: any
    setEditingId: (id: any) => void; setEditValue: (v: string) => void; setColorPicker: (id: any) => void; setConfirmDelete: (cat: any) => void
    handleRename: (cat: any) => void; handleColorChange: (cat: any, color: string) => void
}

export const getCategoryName = (cat: any): string => { if (typeof cat === 'string') return cat; return cat?.name || 'Sem categoria' }
export const normalizeCategory = (cat: any): { name: string; color: string } => { if (typeof cat === 'string') return { name: cat, color: '#007AFF' }; return { name: cat.name || 'Sem nome', color: cat.color || '#007AFF' } }

export const colorPalette = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#8E8E93']
