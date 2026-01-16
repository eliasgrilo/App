// ═══════════════════════════════════════════════════════════════════
// RECIPE LIST VIEW MODULES — Types
// ═══════════════════════════════════════════════════════════════════

import type { Recipe, ID } from '../../../types'
import type { NormalizedCategory } from '../recipeCategoryModules'

interface ModalContextType { confirm: (opts: { title: string; message: string; isDangerous?: boolean; onConfirm: () => void }) => void }

export interface RecipeListViewProps { recipes: Recipe[]; filtered: Recipe[]; categories: NormalizedCategory[]; activeFilter: string; setActiveFilter: (filter: string) => void; setSelectedId: (id: string | number | null) => void; setIsEditing: (v: boolean) => void; setShowCatModal: (v: boolean) => void; onAddRecipe: () => void; onDeleteRecipe: (id: ID) => void; modal: ModalContextType }

export type { Recipe, ModalContextType }
