/**
 * ═══════════════════════════════════════════════════════════════════
 * PADOCA PIZZA — Domain Types
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Centralized type definitions for the entire application.
 * Following Google TypeScript Style Guide with strict typing.
 */

// ═══════════════════════════════════════════════════════════════════
// COMMON TYPES
// ═══════════════════════════════════════════════════════════════════

/** ISO 8601 date string */
export type ISODateString = string

/** Unique identifier */
export type ID = number

/** Measurement units */
export type Unit = 'kg' | 'g' | 'L' | 'ml' | 'un'

/** Expense frequency */
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

/** Expense type */
export type ExpenseType = 'Fixo' | 'Variável' | 'Fixed' | 'Variable'

/** Recipe difficulty */
export type Difficulty = 'Fácil' | 'Médio' | 'Difícil'

// ═══════════════════════════════════════════════════════════════════
// INGREDIENT / INVENTORY
// ═══════════════════════════════════════════════════════════════════

export type IngredientCategory =
    | 'Ingredientes'
    | 'Embalagens'
    | 'Equipamentos'
    | 'Limpeza'

export type IngredientSubcategory =
    | 'Farináceos'
    | 'Vegetais'
    | 'Laticínios'
    | 'Temperos'
    | 'Embutidos'
    | 'Produtos de Limpeza'
    | 'Outros Ingredientes'

/**
 * Inventory ingredient/item definition.
 * 
 * @description
 * Represents a single item in the inventory system.
 * Uses a dual quantity system: packageQuantity × packageCount = total stock.
 * 
 * @example
 * const flour: Ingredient = {
 *   id: 1,
 *   name: 'Farinha de Trigo',
 *   category: 'Ingredientes',
 *   subcategory: 'Farináceos',
 *   unit: 'kg',
 *   packageQuantity: 25,  // 25kg per bag
 *   packageCount: 4,      // 4 bags in stock
 *   minStock: 50,         // Reorder when below 50kg
 *   pricePerUnit: 3.50,   // R$3.50 per kg
 *   supplier: 'Moinho São Jorge',
 *   supplierId: 1,
 *   createdAt: '2024-01-01T00:00:00Z',
 *   updatedAt: '2024-01-01T00:00:00Z'
 * }
 */
export interface Ingredient {
    /** Unique identifier */
    id: ID
    /** Display name */
    name: string
    /** Primary category for grouping */
    category: IngredientCategory
    /** Optional subcategory for finer organization */
    subcategory: IngredientSubcategory | string
    /** Measurement unit (kg, g, L, ml, un) */
    unit: Unit
    /** Quantity per package (e.g., 25kg per bag) */
    packageQuantity: number
    /** Number of packages in stock */
    packageCount: number
    /** Minimum stock level - triggers reorder warning */
    minStock: number
    /** Maximum stock level - prevents over-ordering */
    maxStock?: number
    /** Expiry date for shelf life monitoring */
    expiryDate?: ISODateString
    /** Price per unit (per kg, per unit, etc.) */
    pricePerUnit: number
    /** Supplier name */
    supplier: string
    /** Reference to supplier record */
    supplierId: ID
    /** Additional notes */
    notes?: string
    /** Record creation timestamp */
    createdAt: ISODateString
    /** Last update timestamp */
    updatedAt: ISODateString
}

export type NewIngredient = Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>
export type IngredientUpdate = Partial<Omit<Ingredient, 'id'>>

// ═══════════════════════════════════════════════════════════════════
// SUPPLIER
// ═══════════════════════════════════════════════════════════════════

export type SupplierCategory =
    | 'Farinhas'
    | 'Importados'
    | 'Laticínios'
    | 'Carnes'
    | 'Vegetais'
    | 'Diversos'

export interface SupplierLinkedItem {
    itemId: ID
    itemName: string
}

export interface SupplierDocument {
    id: string
    name: string
    type: string
    size: number
    dataUrl: string
    uploadedAt: string
    category: string
}

export interface Supplier {
    id: ID
    name: string
    category?: SupplierCategory | string
    company?: string
    phone?: string
    email?: string
    whatsapp?: string
    address?: string
    website?: string
    notes?: string
    contactPerson?: string
    paymentTerms?: string
    linkedItems?: SupplierLinkedItem[] | ID[]
    documents?: SupplierDocument[] | string[]
    autoOrderEnabled?: boolean
    createdAt?: ISODateString
    updatedAt?: ISODateString
}

export type NewSupplier = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>
export type SupplierUpdate = Partial<Omit<Supplier, 'id'>>

// ═══════════════════════════════════════════════════════════════════
// RECIPE
// ═══════════════════════════════════════════════════════════════════

export type RecipeCategory = 'Massas' | 'Molhos' | 'Coberturas' | 'Sobremesas'

export interface RecipeIngredient {
    id: ID
    name: string
    quantity: number
    unit: string
}

export interface RecipeSectionItem {
    id: ID
    name?: string
    quantity?: string
    unit?: string
    text?: string
}

export interface RecipeSection {
    id: ID
    type: 'ingredients' | 'instructions'
    title: string
    items: RecipeSectionItem[]
}

export interface Recipe {
    id: ID
    name: string
    description: string
    category: RecipeCategory | string
    prepTime: string | number
    cookTime: string | number
    servings: number
    difficulty: Difficulty
    image: string | null
    ingredients: RecipeIngredient[]
    instructions: string[]
    notes?: string
    sections?: RecipeSection[]
    temperature?: number
    createdAt: ISODateString
    updatedAt?: ISODateString
}

export type NewRecipe = Omit<Recipe, 'id' | 'createdAt'>
export type RecipeUpdate = Partial<Omit<Recipe, 'id'>>

// ═══════════════════════════════════════════════════════════════════
// EXPENSE / COST
// ═══════════════════════════════════════════════════════════════════

export type ExpenseCategory =
    | 'Ingredientes'
    | 'Fixos'
    | 'Utilidades'
    | 'Pessoal'
    | 'Marketing'
    | 'Manutenção'
    | 'Embalagens'
    | 'Outros'

export interface Expense {
    id: ID
    description: string
    category: ExpenseCategory | string
    amount: number
    quantity: number
    type: ExpenseType
    date: string
    supplier: string
    link?: string
    notes?: string
    recurring: boolean
    frequency?: Frequency
    createdAt?: ISODateString
}

export type NewExpense = Omit<Expense, 'id' | 'createdAt'>
export type ExpenseUpdate = Partial<Omit<Expense, 'id'>>

// ═══════════════════════════════════════════════════════════════════
// PRODUCT
// ═══════════════════════════════════════════════════════════════════

export interface Product {
    id: ID
    name: string
    category: string
    subcategory?: string
    currentStock: number
    unit: Unit
    currentPrice: number
    supplier: string
    minStock: number
    maxStock: number
    movements: unknown[]
    lastUpdated: ISODateString
}

export type NewProduct = Omit<Product, 'id'>
export type ProductUpdate = Partial<Omit<Product, 'id'>>

// ═══════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════

export interface AppSettings {
    currency: 'BRL' | 'CAD' | 'USD'
    darkMode: boolean
    notifications: boolean
}

export interface UIState {
    sidebarOpen: boolean
    currentView: string
}

// ═══════════════════════════════════════════════════════════════════
// STORE STATE
// ═══════════════════════════════════════════════════════════════════

export interface AppState {
    // Data
    recipes: Recipe[]
    ingredients: Ingredient[]
    products: Product[]
    suppliers: Supplier[]
    expenses: Expense[]
    settings: AppSettings
    ui: UIState

    // Recipe actions
    addRecipe: (recipe: NewRecipe) => void
    updateRecipe: (id: ID, updates: RecipeUpdate) => void
    removeRecipe: (id: ID) => void

    // Ingredient actions
    addIngredient: (ingredient: NewIngredient) => void
    updateIngredient: (id: ID, updates: IngredientUpdate) => void
    removeIngredient: (id: ID) => void

    // Product actions
    addProduct: (product: NewProduct) => void
    updateProduct: (id: ID, updates: ProductUpdate) => void
    removeProduct: (id: ID) => void

    // Supplier actions
    addSupplier: (supplier: NewSupplier) => void
    updateSupplier: (id: ID, updates: SupplierUpdate) => void
    removeSupplier: (id: ID) => void

    // Expense actions
    addExpense: (expense: NewExpense) => void
    updateExpense: (id: ID, updates: ExpenseUpdate) => void
    removeExpense: (id: ID) => void

    // Settings
    updateSettings: (updates: Partial<AppSettings>) => void

    // UI
    setCurrentView: (view: string) => void
    toggleSidebar: () => void

    // Computed
    getRecipeById: (id: ID) => Recipe | undefined
    getIngredientById: (id: ID) => Ingredient | undefined
    getRecipeCost: (recipeId: ID) => number
    getTotalExpenses: () => number
    getLowStockIngredients: (threshold?: number) => Ingredient[]

    // Import/Export
    resetStore: () => void
    exportData: () => string
    importData: (jsonString: string) => boolean
}

// ═══════════════════════════════════════════════════════════════════
// KANBAN
// ═══════════════════════════════════════════════════════════════════

export interface KanbanChecklistItem {
    id: string | number
    text: string
    done: boolean
}

export interface KanbanChecklist {
    id: string | number
    title: string
    items: KanbanChecklistItem[]
}

export interface KanbanLabel {
    id: string
    color: string
}

export interface KanbanCard {
    id: string
    title: string
    description?: string
    labels?: KanbanLabel[]
    checklists?: KanbanChecklist[]
    createdAt?: string
}

export interface KanbanColumn {
    id: string
    title: string
    cards: KanbanCard[]
}

export interface KanbanBoard {
    columns: KanbanColumn[]
}

export interface DragActive {
    id: string
    sourceColId: string
    data: KanbanCard
    rect: DOMRect
    offsetX: number
    offsetY: number
}

export interface DragTarget {
    colId: string
    index: number
}

export interface DragState {
    active: DragActive | null
    target: DragTarget | null
    isDragging: boolean
}
