import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
    Recipe,
    Ingredient,
    Product,
    Supplier,
    Expense,
    AppSettings,
    UIState,
    NewRecipe,
    NewIngredient,
    NewProduct,
    NewSupplier,
    NewExpense,
    RecipeUpdate,
    IngredientUpdate,
    ProductUpdate,
    SupplierUpdate,
    ExpenseUpdate,
    ID
} from '../types'
import {
    MOCK_INVENTORY,
    MOCK_SUPPLIERS,
    MOCK_RECIPES,
    MOCK_COSTS
} from '../mockData'

/**
 * ═══════════════════════════════════════════════════════════════════
 * APP STORE — Estado Global com Zustand + TypeScript
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ STOCK MOVEMENT TYPE ═══
export type MovementType = 'entrada' | 'saida' | 'ajuste' | 'producao' | 'perda'
export type ReasonCode = 'expired' | 'damaged' | 'theft' | 'count_error' | 'other'

export interface StockMovement {
    id: string
    itemId: number
    itemName: string
    type: MovementType
    quantity: number
    unit: string
    previousStock: number
    newStock: number
    costAtTime?: number        // Financial impact of this movement
    reasonCode?: ReasonCode    // Required for losses
    reason: string
    notes?: string
    timestamp: string
    createdBy?: string
}

// ═══ STATE INTERFACE ═══
interface AppStoreState {
    recipes: Recipe[]
    ingredients: Ingredient[]
    products: Product[]
    suppliers: Supplier[]
    expenses: Expense[]
    stockMovements: StockMovement[]
    settings: AppSettings
    ui: UIState
}

interface AppStoreActions {
    // Recipes
    addRecipe: (recipe: NewRecipe) => void
    updateRecipe: (id: ID, updates: RecipeUpdate) => void
    removeRecipe: (id: ID) => void

    // Ingredients
    addIngredient: (ingredient: NewIngredient) => void
    updateIngredient: (id: ID, updates: IngredientUpdate) => void
    removeIngredient: (id: ID) => void

    // Products
    addProduct: (product: NewProduct) => void
    updateProduct: (id: ID, updates: ProductUpdate) => void
    removeProduct: (id: ID) => void

    // Suppliers
    addSupplier: (supplier: NewSupplier) => void
    updateSupplier: (id: ID, updates: SupplierUpdate) => void
    removeSupplier: (id: ID) => void

    // Expenses
    addExpense: (expense: NewExpense) => void
    updateExpense: (id: ID, updates: ExpenseUpdate) => void
    removeExpense: (id: ID) => void

    // Settings & UI
    updateSettings: (updates: Partial<AppSettings>) => void
    setCurrentView: (view: string) => void
    toggleSidebar: () => void

    // Computed
    getRecipeById: (id: ID) => Recipe | undefined
    getIngredientById: (id: ID) => Ingredient | undefined
    getRecipeCost: (recipeId: ID) => number
    getTotalExpenses: () => number
    getLowStockIngredients: (threshold?: number) => Ingredient[]

    // Stock Movements
    addStockMovement: (movement: Omit<StockMovement, 'id' | 'timestamp'>) => void
    deleteStockMovement: (id: string) => void
    getMovementById: (id: string) => StockMovement | undefined
    getMovementsByItem: (itemId: number) => StockMovement[]
    getRecentMovements: (limit?: number) => StockMovement[]

    // Utilities
    resetStore: () => void
    exportData: () => string
    importData: (jsonString: string) => boolean
}

type AppStore = AppStoreState & AppStoreActions

// ═══ DEMO STOCK MOVEMENTS ═══
const DEMO_MOVEMENTS: StockMovement[] = [
    {
        id: 'demo_entrada_1',
        itemId: 1,
        itemName: 'Farinha de Trigo T55',
        type: 'entrada',
        quantity: 50,
        unit: 'kg',
        previousStock: 25,
        newStock: 75,
        costAtTime: 175.00,
        reason: 'Compra Fornecedor Moinho',
        timestamp: new Date().toISOString()
    },
    {
        id: 'demo_saida_1',
        itemId: 2,
        itemName: 'Mussarela',
        type: 'saida',
        quantity: 5,
        unit: 'kg',
        previousStock: 20,
        newStock: 15,
        costAtTime: 89.90,
        reason: 'Venda Balcão',
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1h ago
    },
    {
        id: 'demo_producao_1',
        itemId: 1,
        itemName: 'Farinha de Trigo T55',
        type: 'producao',
        quantity: 10,
        unit: 'kg',
        previousStock: 75,
        newStock: 65,
        costAtTime: 35.00,
        reason: 'Produção 50 pizzas',
        timestamp: new Date(Date.now() - 7200000).toISOString() // 2h ago
    },
    {
        id: 'demo_perda_1',
        itemId: 3,
        itemName: 'Tomate Pelati',
        type: 'perda',
        quantity: 2,
        unit: 'kg',
        previousStock: 8,
        newStock: 6,
        costAtTime: 24.00,
        reasonCode: 'expired',
        reason: 'Lote vencido 02/01',
        timestamp: new Date(Date.now() - 86400000).toISOString() // Yesterday
    },
    {
        id: 'demo_ajuste_1',
        itemId: 4,
        itemName: 'Fermento Biológico',
        type: 'ajuste',
        quantity: 0.5,
        unit: 'kg',
        previousStock: 1.5,
        newStock: 2,
        costAtTime: 15.00,
        reason: 'Correção inventário',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    },
    {
        id: 'demo_negativo_1',
        itemId: 5,
        itemName: 'Azeite Extra Virgem',
        type: 'saida',
        quantity: 3,
        unit: 'L',
        previousStock: 2,
        newStock: -1, // Negative stock scenario
        costAtTime: 89.70,
        reason: 'Venda urgente (contagem errada)',
        timestamp: new Date(Date.now() - 1800000).toISOString() // 30min ago
    }
]

// ═══ INITIAL STATE ═══
const initialState: AppStoreState = {
    recipes: MOCK_RECIPES as Recipe[],
    ingredients: MOCK_INVENTORY as Ingredient[],
    products: [],
    suppliers: MOCK_SUPPLIERS as Supplier[],
    expenses: MOCK_COSTS as Expense[],
    stockMovements: DEMO_MOVEMENTS,
    settings: {
        currency: 'BRL',
        darkMode: false,
        notifications: true
    },
    ui: {
        sidebarOpen: true,
        currentView: 'recipes'
    }
}

// ID counter to prevent collision in same millisecond
let idCounter = 0
const generateId = (): number => Date.now() + (idCounter++)

// ═══ STORE ═══
export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            // ═══ RECIPES ═══
            addRecipe: (recipe) => {
                set((state) => ({
                    recipes: [...state.recipes, {
                        ...recipe,
                        id: generateId(),
                        createdAt: new Date().toISOString()
                    } as Recipe]
                }))
            },

            updateRecipe: (id, updates) => {
                set((state) => ({
                    recipes: state.recipes.map(r =>
                        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
                    )
                }))
            },

            removeRecipe: (id) => {
                set((state) => ({
                    recipes: state.recipes.filter(r => r.id !== id)
                }))
            },

            // ═══ INGREDIENTS ═══
            addIngredient: (ingredient) => {
                set((state) => ({
                    ingredients: [...state.ingredients, {
                        ...ingredient,
                        id: generateId(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    } as Ingredient]
                }))
            },

            updateIngredient: (id, updates) => {
                set((state) => ({
                    ingredients: state.ingredients.map(i =>
                        i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
                    )
                }))
            },

            removeIngredient: (id) => {
                set((state) => ({
                    ingredients: state.ingredients.filter(i => i.id !== id)
                }))
            },

            // ═══ PRODUCTS ═══
            addProduct: (product) => {
                set((state) => ({
                    products: [...state.products, {
                        ...product,
                        id: Date.now()
                    } as Product]
                }))
            },

            updateProduct: (id, updates) => {
                set((state) => ({
                    products: state.products.map(p =>
                        p.id === id ? { ...p, ...updates } : p
                    )
                }))
            },

            removeProduct: (id) => {
                set((state) => ({
                    products: state.products.filter(p => p.id !== id)
                }))
            },

            // ═══ SUPPLIERS ═══
            addSupplier: (supplier) => {
                set((state) => ({
                    suppliers: [...state.suppliers, {
                        ...supplier,
                        id: generateId(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    } as Supplier]
                }))
            },

            updateSupplier: (id, updates) => {
                set((state) => ({
                    suppliers: state.suppliers.map(s =>
                        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
                    )
                }))
            },

            removeSupplier: (id) => {
                set((state) => ({
                    suppliers: state.suppliers.filter(s => s.id !== id)
                }))
            },

            // ═══ EXPENSES ═══
            addExpense: (expense) => {
                set((state) => ({
                    expenses: [...state.expenses, {
                        ...expense,
                        id: Date.now(),
                        createdAt: new Date().toISOString()
                    } as Expense]
                }))
            },

            updateExpense: (id, updates) => {
                set((state) => ({
                    expenses: state.expenses.map(e =>
                        e.id === id ? { ...e, ...updates } : e
                    )
                }))
            },

            removeExpense: (id) => {
                set((state) => ({
                    expenses: state.expenses.filter(e => e.id !== id)
                }))
            },

            // ═══ SETTINGS ═══
            updateSettings: (updates) => {
                set((state) => ({
                    settings: { ...state.settings, ...updates }
                }))
            },

            // ═══ UI ═══
            setCurrentView: (view) => {
                set((state) => ({
                    ui: { ...state.ui, currentView: view }
                }))
            },

            toggleSidebar: () => {
                set((state) => ({
                    ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
                }))
            },

            // ═══ COMPUTED VALUES ═══
            getRecipeById: (id) =>
                get().recipes.find(r => r.id === id),

            getIngredientById: (id) =>
                get().ingredients.find(i => i.id === id),

            getRecipeCost: (recipeId) => {
                const recipe = get().recipes.find(r => r.id === recipeId)
                if (!recipe?.ingredients) return 0
                return recipe.ingredients.reduce((sum, ing) => {
                    const ingredient = get().ingredients.find(i => i.id === ing.id)
                    return sum + ((ingredient?.pricePerUnit ?? 0) * (ing.quantity ?? 0))
                }, 0)
            },

            getTotalExpenses: () => {
                return get().expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)
            },

            getLowStockIngredients: (threshold = 10) => {
                return get().ingredients.filter(i =>
                    (i.packageCount * i.packageQuantity) < threshold
                )
            },

            // ═══ STOCK MOVEMENTS ═══
            addStockMovement: (movement) => {
                const newMovement: StockMovement = {
                    ...movement,
                    id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date().toISOString()
                }
                set((state) => ({
                    stockMovements: [newMovement, ...state.stockMovements]
                }))
            },

            deleteStockMovement: (id) => {
                const movement = get().stockMovements.find(m => m.id === id)
                if (!movement) return

                // Reverse the stock change: determine if original was outflow or inflow
                const outflowTypes: MovementType[] = ['saida', 'producao', 'perda']
                const isOutflow = outflowTypes.includes(movement.type)

                // Find the ingredient and reverse the stock
                const ingredient = get().ingredients.find(i => i.id === movement.itemId)
                if (ingredient) {
                    // If it was an outflow, add back. If inflow, subtract.
                    const packageQty = ingredient.packageQuantity || 1
                    const reverseQty = isOutflow ? movement.quantity : -movement.quantity
                    const newPackageCount = Math.max(0, (ingredient.packageCount || 0) + (reverseQty / packageQty))

                    get().updateIngredient(ingredient.id, { packageCount: newPackageCount })
                }

                // Remove the movement
                set((state) => ({
                    stockMovements: state.stockMovements.filter(m => m.id !== id)
                }))
            },

            getMovementById: (id) => {
                return get().stockMovements.find(m => m.id === id)
            },

            getMovementsByItem: (itemId) => {
                return get().stockMovements.filter(m => m.itemId === itemId)
            },

            getRecentMovements: (limit = 50) => {
                return get().stockMovements.slice(0, limit)
            },

            // ═══ RESET ═══
            resetStore: () => {
                set(initialState)
            },

            // ═══ IMPORT/EXPORT ═══
            exportData: () => {
                const state = get()
                return JSON.stringify({
                    recipes: state.recipes,
                    ingredients: state.ingredients,
                    products: state.products,
                    suppliers: state.suppliers,
                    expenses: state.expenses,
                    settings: state.settings,
                    exportedAt: new Date().toISOString()
                })
            },

            importData: (jsonString) => {
                try {
                    const data = JSON.parse(jsonString) as Partial<AppStoreState>
                    set({
                        recipes: data.recipes ?? [],
                        ingredients: data.ingredients ?? [],
                        products: data.products ?? [],
                        suppliers: data.suppliers ?? [],
                        expenses: data.expenses ?? [],
                        settings: data.settings ?? initialState.settings
                    })
                    return true
                } catch (error) {
                    console.error('Import failed:', error)
                    return false
                }
            }
        }),
        {
            name: 'padoca-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state): Partial<AppStoreState> => ({
                recipes: state.recipes,
                ingredients: state.ingredients,
                products: state.products,
                suppliers: state.suppliers,
                expenses: state.expenses,
                stockMovements: state.stockMovements,
                settings: state.settings
            }),
            onRehydrateStorage: () => (_state, error) => {
                if (error) {
                    console.error('Failed to rehydrate store:', error)
                    try {
                        localStorage.removeItem('padoca-storage')
                        console.warn('Corrupted storage cleared. Using default data.')
                    } catch (e) {
                        console.error('Failed to clear storage:', e)
                    }
                }
            },
            version: 1,
            migrate: (persistedState, version) => {
                if (version === 0) {
                    return { ...initialState, ...(persistedState as object) }
                }
                return persistedState as AppStoreState
            }
        }
    )
)

// ═══ TYPED SELECTORS ═══
export const useRecipes = (): Recipe[] => useAppStore((state) => state.recipes)
export const useIngredients = (): Ingredient[] => useAppStore((state) => state.ingredients)
export const useProducts = (): Product[] => useAppStore((state) => state.products)
export const useSuppliers = (): Supplier[] => useAppStore((state) => state.suppliers)
export const useExpenses = (): Expense[] => useAppStore((state) => state.expenses)
export const useSettings = (): AppSettings => useAppStore((state) => state.settings)
export const useStockMovements = (): StockMovement[] => useAppStore((state) => state.stockMovements)

export default useAppStore
