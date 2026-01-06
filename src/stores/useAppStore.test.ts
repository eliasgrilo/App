import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './useAppStore'
import type { NewRecipe, NewIngredient, NewSupplier, NewExpense } from '../types'

// Test data factories
const createTestRecipe = (overrides: Partial<NewRecipe> = {}): NewRecipe => ({
    name: 'Test Recipe',
    description: 'Test description',
    category: 'Massas',
    prepTime: '10 min',
    cookTime: '20 min',
    servings: 4,
    difficulty: 'Fácil',
    image: null,
    ingredients: [],
    instructions: ['Step 1'],
    ...overrides
})

const createTestIngredient = (overrides: Partial<NewIngredient> = {}): NewIngredient => ({
    name: 'Test Ingredient',
    category: 'Ingredientes',
    subcategory: 'Outros Ingredientes',
    unit: 'kg',
    packageQuantity: 1,
    packageCount: 1,
    minStock: 5,
    pricePerUnit: 10,
    supplier: 'Test Supplier',
    supplierId: 1,
    ...overrides
})

const createTestSupplier = (overrides: Partial<NewSupplier> = {}): NewSupplier => ({
    name: 'Test Supplier',
    category: 'Diversos',
    phone: '123-456',
    email: 'test@test.com',
    address: '123 Test St',
    contactPerson: 'John',
    paymentTerms: 'Net 30',
    linkedItems: [],
    documents: [],
    ...overrides
})

const createTestExpense = (overrides: Partial<NewExpense> = {}): NewExpense => ({
    description: 'Test Expense',
    category: 'Fixos',
    amount: 100,
    quantity: 1,
    type: 'Fixed',
    date: '2025-01-01',
    supplier: '',
    recurring: false,
    ...overrides
})

// Reset store before each test
beforeEach(() => {
    useAppStore.setState({
        recipes: [],
        ingredients: [],
        products: [],
        suppliers: [],
        expenses: [],
        settings: {
            currency: 'BRL',
            darkMode: false,
            notifications: true
        },
        ui: {
            sidebarOpen: true,
            currentView: 'recipes'
        }
    })
})

// ═══════════════════════════════════════════════════════════════════
// RECIPES TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Recipes CRUD', () => {
    it('should add a recipe', () => {
        const { addRecipe } = useAppStore.getState()

        addRecipe(createTestRecipe({ name: 'Margherita' }))

        const { recipes } = useAppStore.getState()
        expect(recipes).toHaveLength(1)
        expect(recipes[0]?.name).toBe('Margherita')
        expect(recipes[0]?.id).toBeDefined()
        expect(recipes[0]?.createdAt).toBeDefined()
    })

    it('should update a recipe', () => {
        const { addRecipe, updateRecipe } = useAppStore.getState()

        addRecipe(createTestRecipe({ name: 'Margherita' }))
        const { recipes: initialRecipes } = useAppStore.getState()
        const recipeId = initialRecipes[0]?.id ?? 0

        updateRecipe(recipeId, { name: 'Margherita Especial' })

        const { recipes } = useAppStore.getState()
        expect(recipes[0]?.name).toBe('Margherita Especial')
        expect(recipes[0]?.updatedAt).toBeDefined()
    })

    it('should remove a recipe', () => {
        const { addRecipe, removeRecipe } = useAppStore.getState()

        addRecipe(createTestRecipe({ name: 'Margherita' }))

        const { recipes: afterFirst } = useAppStore.getState()
        expect(afterFirst).toHaveLength(1)

        addRecipe(createTestRecipe({ name: 'Pepperoni' }))

        const { recipes: afterSecond } = useAppStore.getState()
        expect(afterSecond).toHaveLength(2)

        // Remove the first recipe by its actual ID
        const firstRecipeId = afterSecond[0]?.id ?? 0
        removeRecipe(firstRecipeId)

        const { recipes: final } = useAppStore.getState()
        expect(final).toHaveLength(1)
    })
})

// ═══════════════════════════════════════════════════════════════════
// INGREDIENTS TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Ingredients CRUD', () => {
    it('should add an ingredient', () => {
        const { addIngredient } = useAppStore.getState()

        addIngredient(createTestIngredient({ name: 'Farinha' }))

        const { ingredients } = useAppStore.getState()
        expect(ingredients).toHaveLength(1)
        expect(ingredients[0]?.name).toBe('Farinha')
    })

    it('should update an ingredient', () => {
        const { addIngredient, updateIngredient } = useAppStore.getState()

        addIngredient(createTestIngredient({ name: 'Farinha', pricePerUnit: 5 }))
        const { ingredients: initial } = useAppStore.getState()
        updateIngredient(initial[0]?.id ?? 0, { pricePerUnit: 6 })

        const { ingredients } = useAppStore.getState()
        expect(ingredients[0]?.pricePerUnit).toBe(6)
    })

    it('should remove an ingredient', () => {
        const { addIngredient, removeIngredient } = useAppStore.getState()

        addIngredient(createTestIngredient({ name: 'Farinha' }))
        const { ingredients: initial } = useAppStore.getState()
        removeIngredient(initial[0]?.id ?? 0)

        const { ingredients } = useAppStore.getState()
        expect(ingredients).toHaveLength(0)
    })
})

// ═══════════════════════════════════════════════════════════════════
// SUPPLIERS TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Suppliers CRUD', () => {
    it('should add a supplier', () => {
        const { addSupplier } = useAppStore.getState()

        addSupplier(createTestSupplier({ name: 'Moinho Globo' }))

        const { suppliers } = useAppStore.getState()
        expect(suppliers).toHaveLength(1)
        expect(suppliers[0]?.name).toBe('Moinho Globo')
    })

    it('should update a supplier', () => {
        const { addSupplier, updateSupplier } = useAppStore.getState()

        addSupplier(createTestSupplier({ name: 'Moinho Globo', phone: '1234' }))
        const { suppliers: initial } = useAppStore.getState()
        updateSupplier(initial[0]?.id ?? 0, { phone: '5678' })

        const { suppliers } = useAppStore.getState()
        expect(suppliers[0]?.phone).toBe('5678')
    })

    it('should remove a supplier', () => {
        const { addSupplier, removeSupplier } = useAppStore.getState()

        addSupplier(createTestSupplier({ name: 'Moinho Globo' }))
        const { suppliers: initial } = useAppStore.getState()
        removeSupplier(initial[0]?.id ?? 0)

        const { suppliers } = useAppStore.getState()
        expect(suppliers).toHaveLength(0)
    })
})

// ═══════════════════════════════════════════════════════════════════
// EXPENSES TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Expenses CRUD', () => {
    it('should add an expense', () => {
        const { addExpense } = useAppStore.getState()

        addExpense(createTestExpense({ description: 'Aluguel', amount: 1500 }))

        const { expenses } = useAppStore.getState()
        expect(expenses).toHaveLength(1)
        expect(expenses[0]?.amount).toBe(1500)
    })

    it('should update an expense', () => {
        const { addExpense, updateExpense } = useAppStore.getState()

        addExpense(createTestExpense({ description: 'Aluguel', amount: 1500 }))
        const { expenses: initial } = useAppStore.getState()
        updateExpense(initial[0]?.id ?? 0, { amount: 1600 })

        const { expenses } = useAppStore.getState()
        expect(expenses[0]?.amount).toBe(1600)
    })

    it('should remove an expense', () => {
        const { addExpense, removeExpense } = useAppStore.getState()

        addExpense(createTestExpense({ description: 'Aluguel' }))
        const { expenses: initial } = useAppStore.getState()
        removeExpense(initial[0]?.id ?? 0)

        const { expenses } = useAppStore.getState()
        expect(expenses).toHaveLength(0)
    })

    it('should calculate total expenses', () => {
        const { addExpense } = useAppStore.getState()

        addExpense(createTestExpense({ amount: 1000 }))
        addExpense(createTestExpense({ amount: 500 }))

        const total = useAppStore.getState().getTotalExpenses()
        expect(total).toBe(1500)
    })
})

// ═══════════════════════════════════════════════════════════════════
// SETTINGS TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Settings', () => {
    it('should update settings', () => {
        const { updateSettings } = useAppStore.getState()

        updateSettings({ currency: 'CAD', darkMode: true })

        const { settings } = useAppStore.getState()
        expect(settings.currency).toBe('CAD')
        expect(settings.darkMode).toBe(true)
    })
})

// ═══════════════════════════════════════════════════════════════════
// IMPORT/EXPORT TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Import/Export', () => {
    it('should export data as JSON', () => {
        const { addRecipe } = useAppStore.getState()

        addRecipe(createTestRecipe({ name: 'Margherita' }))

        const exported = useAppStore.getState().exportData()
        const data = JSON.parse(exported)

        expect(data.recipes).toHaveLength(1)
        expect(data.exportedAt).toBeDefined()
    })

    it('should import data from JSON', () => {
        const { importData } = useAppStore.getState()

        const success = importData(JSON.stringify({
            recipes: [{ id: 1, name: 'Imported Recipe' }],
            ingredients: [],
            suppliers: []
        }))

        expect(success).toBe(true)
        const { recipes } = useAppStore.getState()
        expect(recipes[0]?.name).toBe('Imported Recipe')
    })

    it('should handle invalid JSON on import', () => {
        const { importData } = useAppStore.getState()

        const success = importData('invalid json')

        expect(success).toBe(false)
    })
})

// ═══════════════════════════════════════════════════════════════════
// RESET TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Reset Store', () => {
    it('should reset to initial state', () => {
        const { addRecipe, addExpense, resetStore } = useAppStore.getState()

        addRecipe(createTestRecipe({ name: 'Test' }))
        addExpense(createTestExpense({ amount: 100 }))
        resetStore()

        const state = useAppStore.getState()
        expect(state.recipes).toBeDefined()
        expect(state.settings.currency).toBe('BRL')
    })
})
