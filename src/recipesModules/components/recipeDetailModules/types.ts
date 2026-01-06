// ═══════════════════════════════════════════════════════════════════
// RECIPE DETAIL VIEW MODULES — Types
// ═══════════════════════════════════════════════════════════════════

import { Recipe, RecipeSection as RecipeSectionType } from '../../../types'

interface ModalContextType { confirm: (opts: { title: string; message: string; isDangerous?: boolean; onConfirm: () => void }) => void }

export interface RecipeDetailViewProps {
    selected: Recipe; selectedId: string | number; isEditing: boolean; syncing: boolean; syncError: boolean; isUploading: boolean; categories: string[]; scrollRef: React.RefObject<HTMLDivElement | null>
    setSelectedId: (id: string | number | null) => void; setIsEditing: (v: boolean) => void; setZoomedImage: (v: string | null) => void; updateRecipe: (id: any, changes: any) => void
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; finishEditing: () => void; onDeleteRecipe: () => void; modal: ModalContextType
}

export type { Recipe, RecipeSectionType, ModalContextType }
