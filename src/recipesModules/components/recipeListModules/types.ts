// ═══════════════════════════════════════════════════════════════════
// RECIPE LIST VIEW MODULES — Types
// ═══════════════════════════════════════════════════════════════════

import type { Recipe } from '../../../types'

interface ModalContextType { confirm: (opts: { title: string; message: string; isDangerous?: boolean; onConfirm: () => void }) => void }

export interface RecipeListViewProps { recipes: Recipe[]; filtered: Recipe[]; categories: string[]; activeFilter: string; setActiveFilter: (filter: string) => void; setSelectedId: (id: string | number | null) => void; setIsEditing: (v: boolean) => void; setShowCatModal: (v: boolean) => void; onAddRecipe: () => void; onDeleteRecipe: (id: any) => void; modal: ModalContextType }

export type { Recipe, ModalContextType }
