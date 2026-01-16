// ═══════════════════════════════════════════════════════════════════
// RECIPE DETAIL VIEW MODULES — Types
// ═══════════════════════════════════════════════════════════════════

import { Recipe, RecipeSection as RecipeSectionType, ID } from '../../../types'
import type { NormalizedCategory } from '../recipeCategoryModules'

interface ModalContextType { confirm: (opts: { title: string; message: string; isDangerous?: boolean; onConfirm: () => void }) => void }

export interface RecipeDetailViewProps {
    selected: Recipe; selectedId: string | number; isEditing: boolean; syncing: boolean; syncError: boolean; isUploading: boolean; categories: NormalizedCategory[]; scrollRef: React.RefObject<HTMLDivElement | null>
    setSelectedId: (id: string | number | null) => void; setIsEditing: (v: boolean) => void; setZoomedImage: (v: string | null) => void; updateRecipe: (id: string | number | null, changes: Partial<Recipe>) => void
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; finishEditing: () => void; onDeleteRecipe: () => void; modal: ModalContextType
}

export type { Recipe, RecipeSectionType, ModalContextType }
