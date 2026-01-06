// ═══════════════════════════════════════════════════════════════════
// CATEGORY MANAGEMENT MODULES — Types
// ═══════════════════════════════════════════════════════════════════

export interface CategoryManagementModalProps { isOpen: boolean; onClose: () => void; categories: string[]; subcategories: Record<string, string[]>; onAddCategory: (name: string) => void; onRemoveCategory: (name: string) => void; onAddSubcategory: (category: string, name: string) => void; onRemoveSubcategory: (category: string, name: string) => void }
