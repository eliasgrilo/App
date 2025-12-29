/**
 * Data Connect Service
 * Wrapper for Firebase Data Connect SDK with caching and optimistic updates
 * 
 * NOTE: This file serves as a template. When you run `firebase dataconnect:sdk:generate`,
 * it will create the actual SDK in src/generated/dataconnect/
 * 
 * After SDK generation, import from '@padoca/dataconnect' instead.
 */

import { initializeApp, getApp } from 'firebase/app'
import { getDataConnect, queryRef, mutationRef, executeQuery, executeMutation } from 'firebase/data-connect'

// Data Connect instance
let dataConnect = null

// Initialize Data Connect
export function initDataConnect() {
    try {
        const app = getApp()
        dataConnect = getDataConnect(app, {
            connector: 'padoca-connector',
            location: 'southamerica-east1',
            service: 'padoca-dataconnect'
        })
        console.log('Data Connect initialized')
        return dataConnect
    } catch (error) {
        console.error('Failed to initialize Data Connect:', error)
        return null
    }
}

// Get Data Connect instance
export function getDataConnectInstance() {
    if (!dataConnect) {
        return initDataConnect()
    }
    return dataConnect
}

// ===================================================================
// CACHE LAYER
// ===================================================================

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(key) {
    const entry = cache.get(key)
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data
    }
    cache.delete(key)
    return null
}

function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() })
}

function invalidateCache(pattern) {
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key)
        }
    }
}

// ===================================================================
// SUPPLIERS
// ===================================================================

export async function listSuppliers() {
    const cached = getCached('suppliers')
    if (cached) return cached

    const dc = getDataConnectInstance()
    if (!dc) throw new Error('Data Connect not initialized')

    const result = await executeQuery(queryRef(dc, 'ListSuppliers'))
    setCache('suppliers', result.data.suppliers)
    return result.data.suppliers
}

export async function getSupplier(id) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'GetSupplier'), { id })
    return result.data.supplier
}

export async function createSupplier(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'CreateSupplier'), data)
    invalidateCache('suppliers')
    return result.data.supplier_insert
}

export async function updateSupplier(id, data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'UpdateSupplier'), { id, ...data })
    invalidateCache('suppliers')
    return result.data.supplier_update
}

export async function deleteSupplier(id) {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'DeleteSupplier'), { id })
    invalidateCache('suppliers')
}

// ===================================================================
// PRODUCTS
// ===================================================================

export async function listProducts() {
    const cached = getCached('products')
    if (cached) return cached

    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'ListProducts'))
    setCache('products', result.data.products)
    return result.data.products
}

export async function listProductsByCategory(category) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'ListProductsByCategory'), { category })
    return result.data.products
}

export async function getProduct(id) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'GetProduct'), { id })
    return result.data.product
}

export async function createProduct(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'CreateProduct'), data)
    invalidateCache('products')
    return result.data.product_insert
}

export async function updateProduct(id, data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'UpdateProduct'), { id, ...data })
    invalidateCache('products')
    return result.data.product_update
}

export async function deleteProduct(id) {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'DeleteProduct'), { id })
    invalidateCache('products')
}

// ===================================================================
// MOVEMENTS
// ===================================================================

export async function listProductMovements(productId) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'ListProductMovements'), { productId })
    return result.data.productMovements
}

export async function listAllMovements(options = {}) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'ListAllMovements'), options)
    return result.data.productMovements
}

export async function createMovement(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'CreateMovement'), data)
    invalidateCache('products')
    invalidateCache('movements')
    return result.data.productMovement_insert
}

// ===================================================================
// NOTES
// ===================================================================

export async function listProductNotes(productId) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'ListProductNotes'), { productId })
    return result.data.productNotes
}

export async function createProductNote(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'CreateProductNote'), data)
    return result.data.productNote_insert
}

export async function deleteProductNote(id) {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'DeleteProductNote'), { id })
}

// ===================================================================
// COSTS
// ===================================================================

export async function listCosts(options = {}) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'ListCosts'), options)
    return result.data.costs
}

export async function createCost(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'CreateCost'), data)
    invalidateCache('costs')
    return result.data.cost_insert
}

export async function updateCost(id, data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'UpdateCost'), { id, ...data })
    invalidateCache('costs')
    return result.data.cost_update
}

export async function deleteCost(id) {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'DeleteCost'), { id })
    invalidateCache('costs')
}

// ===================================================================
// RECIPES
// ===================================================================

export async function listRecipes() {
    const cached = getCached('recipes')
    if (cached) return cached

    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'ListRecipes'))
    setCache('recipes', result.data.recipes)
    return result.data.recipes
}

export async function getRecipe(id) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'GetRecipe'), { id })
    return result.data.recipe
}

export async function createRecipe(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'CreateRecipe'), data)
    invalidateCache('recipes')
    return result.data.recipe_insert
}

export async function updateRecipe(id, data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'UpdateRecipe'), { id, ...data })
    invalidateCache('recipes')
    return result.data.recipe_update
}

export async function deleteRecipe(id) {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'DeleteRecipe'), { id })
    invalidateCache('recipes')
}

export async function addRecipeIngredient(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'AddRecipeIngredient'), data)
    return result.data.recipeIngredient_insert
}

export async function deleteRecipeIngredient(id) {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'DeleteRecipeIngredient'), { id })
}

export async function addRecipeInstruction(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'AddRecipeInstruction'), data)
    return result.data.recipeInstruction_insert
}

export async function deleteRecipeInstruction(id) {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'DeleteRecipeInstruction'), { id })
}

// ===================================================================
// KANBAN
// ===================================================================

export async function listKanbanTasks() {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'ListKanbanTasks'))
    return result.data.kanbanTasks
}

export async function createKanbanTask(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'CreateKanbanTask'), data)
    return result.data.kanbanTask_insert
}

export async function updateKanbanTask(id, data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'UpdateKanbanTask'), { id, ...data })
    return result.data.kanbanTask_update
}

export async function deleteKanbanTask(id) {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'DeleteKanbanTask'), { id })
}

// ===================================================================
// FILES (with Storage integration)
// ===================================================================

import { StorageService } from './storageService'

export async function uploadAndCreateFile(file, options = {}) {
    // Upload to Firebase Storage
    const uploadResult = await StorageService.uploadFile(file, options)

    // Save reference in Data Connect
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'CreateFile'), {
        name: uploadResult.name,
        type: uploadResult.type,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        storageUrl: uploadResult.storageUrl,
        storagePath: uploadResult.storagePath,
        thumbnailUrl: uploadResult.thumbnailUrl,
        entityType: options.entityType,
        entityId: options.entityId,
        uploadedBy: options.uploadedBy
    })

    return {
        ...uploadResult,
        id: result.data.file_insert.id
    }
}

export async function listEntityFiles(entityType, entityId) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'ListFilesByEntity'), {
        entityType,
        entityId
    })
    return result.data.files
}

export async function deleteFileAndRecord(fileId, storagePath) {
    // Delete from Storage
    await StorageService.deleteFile(storagePath)

    // Delete from Data Connect
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'DeleteFile'), { id: fileId })
}

// ===================================================================
// QUOTATIONS
// ===================================================================

export async function listQuotations(status = null) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'ListQuotations'), { status })
    return result.data.quotations
}

export async function createQuotation(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'CreateQuotation'), data)
    return result.data.quotation_insert
}

export async function updateQuotationStatus(id, data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'UpdateQuotationStatus'), { id, ...data })
    return result.data.quotation_update
}

export async function addQuotationItem(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'AddQuotationItem'), data)
    return result.data.quotationItem_insert
}

export async function updateQuotationItem(id, data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'UpdateQuotationItem'), { id, ...data })
    return result.data.quotationItem_update
}

// ===================================================================
// NOTIFICATIONS
// ===================================================================

export async function listNotifications(onlyUnread = false) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'ListNotifications'), { onlyUnread })
    return result.data.notifications
}

export async function createNotification(data) {
    const dc = getDataConnectInstance()
    const result = await executeMutation(mutationRef(dc, 'CreateNotification'), data)
    return result.data.notification_insert
}

export async function markNotificationRead(id) {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'MarkNotificationRead'), { id })
}

export async function markAllNotificationsRead() {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'MarkAllNotificationsRead'))
}

export async function dismissNotification(id) {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'DismissNotification'), { id })
}

// ===================================================================
// ANALYTICS QUERIES
// ===================================================================

export async function getStockValueByCategory() {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'GetStockValueByCategory'))

    // Aggregate by category
    const categoryValues = {}
    result.data.products.forEach(p => {
        const cat = p.category || 'Outros'
        const value = (p.pricePerUnit || 0) * (p.packageQuantity || 0) * (p.packageCount || 1)
        categoryValues[cat] = (categoryValues[cat] || 0) + value
    })

    return categoryValues
}

export async function getMovementSummary(startDate, endDate) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'GetMovementSummary'), {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    })

    const entries = result.data.productMovements.filter(m => m.type === 'ENTRY')
    const exits = result.data.productMovements.filter(m => m.type === 'EXIT')

    return {
        totalEntries: entries.length,
        totalExits: exits.length,
        totalEntryValue: entries.reduce((sum, m) => sum + ((m.price || 0) * (m.quantity || 0)), 0),
        totalExitValue: exits.reduce((sum, m) => sum + ((m.price || 0) * (m.quantity || 0)), 0),
        movements: result.data.productMovements
    }
}

export async function getLowStockProducts() {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'GetLowStockProducts'))

    return result.data.products.filter(p => {
        const currentStock = (p.packageQuantity || 0) * (p.packageCount || 1)
        return p.minStock > 0 && currentStock < p.minStock
    })
}

export async function getSupplierSummary() {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'GetSupplierSummary'))

    return result.data.suppliers.map(s => {
        const totalValue = s.products_on_supplier.reduce((sum, p) => {
            return sum + (p.pricePerUnit || 0) * (p.packageQuantity || 0) * (p.packageCount || 1)
        }, 0)

        const recentMovements = s.products_on_supplier.reduce((sum, p) => {
            return sum + (p.productMovements_on_product?.length || 0)
        }, 0)

        return {
            id: s.id,
            name: s.name,
            productCount: s.products_on_supplier.length,
            totalValue,
            recentMovements,
            products: s.products_on_supplier
        }
    }).sort((a, b) => b.totalValue - a.totalValue)
}

// ===================================================================
// SETTINGS
// ===================================================================

export async function getAppSetting(key) {
    const dc = getDataConnectInstance()
    const result = await executeQuery(queryRef(dc, 'GetAppSetting'), { key })
    const settings = result.data.appSettingsList
    return settings.length > 0 ? JSON.parse(settings[0].value) : null
}

export async function setAppSetting(key, value) {
    const dc = getDataConnectInstance()
    await executeMutation(mutationRef(dc, 'SetAppSetting'), {
        key,
        value: JSON.stringify(value)
    })
}

// ===================================================================
// SERVICE EXPORT
// ===================================================================

export const DataConnectService = {
    // Init
    init: initDataConnect,
    getInstance: getDataConnectInstance,

    // Suppliers
    listSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,

    // Products
    listProducts,
    listProductsByCategory,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,

    // Movements
    listProductMovements,
    listAllMovements,
    createMovement,

    // Notes
    listProductNotes,
    createProductNote,
    deleteProductNote,

    // Costs
    listCosts,
    createCost,
    updateCost,
    deleteCost,

    // Recipes
    listRecipes,
    getRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    addRecipeIngredient,
    deleteRecipeIngredient,
    addRecipeInstruction,
    deleteRecipeInstruction,

    // Kanban
    listKanbanTasks,
    createKanbanTask,
    updateKanbanTask,
    deleteKanbanTask,

    // Files
    uploadAndCreateFile,
    listEntityFiles,
    deleteFileAndRecord,

    // Quotations
    listQuotations,
    createQuotation,
    updateQuotationStatus,
    addQuotationItem,
    updateQuotationItem,

    // Notifications
    listNotifications,
    createNotification,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,

    // Analytics
    getStockValueByCategory,
    getMovementSummary,
    getLowStockProducts,
    getSupplierSummary,

    // Settings
    getAppSetting,
    setAppSetting,

    // Cache
    invalidateCache
}

export default DataConnectService
