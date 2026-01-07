// ═══════════════════════════════════════════════════════════════════
// CATEGORY MANAGEMENT MODULES — Types
// ═══════════════════════════════════════════════════════════════════

export interface CategoryManagementModalProps {
    isOpen: boolean
    onClose: () => void
    categories: string[]
    subcategories: Record<string, string[]>
    allSubcategories: string[] // All unique subcategories from items
    onAddCategory: (name: string) => void
    onRemoveCategory: (name: string) => void
    onAddSubcategory: (category: string, name: string) => void
    onRemoveSubcategory: (category: string, name: string) => void
    onReorderCategories: (categories: string[]) => void
    onReorderSubcategories: (subcategories: string[]) => void
}
