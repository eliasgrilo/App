/**
 * Validation Service - Pre-Commit Data Validation
 * Ensures data integrity with semantic rules before database commits
 */

import { HapticService } from './hapticService'
import { StockService } from './stockService'

// ═══════════════════════════════════════════════════════════════
// PRODUCT VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * Validate a product update before saving
 * @param {Object} product - Current product state
 * @param {Object} changes - Proposed changes
 * @returns {Object} Validation result
 */
export function validateProductUpdate(product, changes) {
    const errors = []
    const warnings = []

    // Required fields
    if (changes.name !== undefined && !changes.name?.trim()) {
        errors.push({
            field: 'name',
            code: 'REQUIRED',
            message: 'Nome do produto é obrigatório'
        })
    }

    // Numeric validations
    if (changes.packageQuantity !== undefined && changes.packageQuantity < 0) {
        errors.push({
            field: 'packageQuantity',
            code: 'NEGATIVE',
            message: 'Quantidade por pacote não pode ser negativa'
        })
    }

    if (changes.packageCount !== undefined && changes.packageCount < 0) {
        errors.push({
            field: 'packageCount',
            code: 'NEGATIVE',
            message: 'Número de pacotes não pode ser negativo'
        })
    }

    if (changes.pricePerUnit !== undefined && changes.pricePerUnit < 0) {
        errors.push({
            field: 'pricePerUnit',
            code: 'NEGATIVE',
            message: 'Preço não pode ser negativo'
        })
    }

    // Stock threshold validation
    if (changes.minStock !== undefined || changes.maxStock !== undefined) {
        const newMin = changes.minStock ?? product.minStock ?? 0
        const newMax = changes.maxStock ?? product.maxStock ?? 0

        if (newMax > 0 && newMin > newMax) {
            errors.push({
                field: 'minStock',
                code: 'INVALID_RANGE',
                message: 'Estoque mínimo não pode ser maior que o máximo'
            })
        }
    }

    // Unit consistency warning
    if (changes.unit !== undefined && product.unit && changes.unit !== product.unit) {
        warnings.push({
            field: 'unit',
            code: 'UNIT_CHANGE',
            message: `Unidade alterada de "${product.unit}" para "${changes.unit}". Verifique se os valores estão corretos.`
        })
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        canProceed: errors.length === 0
    }
}

/**
 * Validate a price change with historical context
 * @param {Object} product - Product with priceHistory
 * @param {number} newPrice - New price
 * @returns {Object} Validation result
 */
export function validatePriceChange(product, newPrice) {
    const errors = []
    const warnings = []
    let needsApproval = false

    // Basic validation
    if (newPrice < 0) {
        errors.push({
            code: 'NEGATIVE_PRICE',
            message: 'Preço não pode ser negativo'
        })
        return { valid: false, errors, warnings, needsApproval: false }
    }

    if (newPrice === 0) {
        warnings.push({
            code: 'ZERO_PRICE',
            message: 'Preço definido como zero'
        })
    }

    // Compare with last price
    const lastPrice = product.pricePerUnit || 0
    if (lastPrice > 0) {
        const changePercent = ((newPrice - lastPrice) / lastPrice) * 100

        if (changePercent > 50) {
            warnings.push({
                code: 'LARGE_INCREASE',
                message: `Aumento de ${changePercent.toFixed(0)}% em relação ao preço anterior`
            })
            needsApproval = true
        } else if (changePercent < -50) {
            warnings.push({
                code: 'LARGE_DECREASE',
                message: `Redução de ${Math.abs(changePercent).toFixed(0)}% em relação ao preço anterior`
            })
            needsApproval = true
        }
    }

    // Trigger haptic if needs attention
    if (needsApproval) {
        HapticService.trigger('warning')
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        needsApproval,
        changePercent: lastPrice > 0
            ? Math.round(((newPrice - lastPrice) / lastPrice) * 100)
            : null
    }
}

/**
 * Validate a stock adjustment
 * @param {Object} product - Product
 * @param {number} delta - Stock change (positive for add, negative for remove)
 * @returns {Object} Validation result
 */
export function validateStockAdjustment(product, delta) {
    const errors = []
    const warnings = []

    const currentStock = StockService.getCurrentStock(product)
    const newStock = currentStock + delta

    // Cannot go negative
    if (newStock < 0) {
        errors.push({
            code: 'NEGATIVE_STOCK',
            message: `Estoque resultante seria negativo (${newStock.toFixed(2)})`
        })
    }

    // Check against thresholds
    const minStock = product.minStock || 0
    const maxStock = product.maxStock || 0

    if (minStock > 0 && newStock < minStock && currentStock >= minStock) {
        warnings.push({
            code: 'BELOW_MIN',
            message: `Estoque ficará abaixo do mínimo (${minStock} ${product.unit})`
        })
        HapticService.trigger('warning')
    }

    if (maxStock > 0 && newStock > maxStock) {
        warnings.push({
            code: 'ABOVE_MAX',
            message: `Estoque ficará acima do máximo (${maxStock} ${product.unit})`
        })
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        newStock,
        canProceed: errors.length === 0
    }
}

// ═══════════════════════════════════════════════════════════════
// BATCH VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * Validate a batch of items for insert (e.g., from invoice scan)
 * @param {Array} items - Items to validate
 * @param {Array} existingProducts - Existing products for duplicate check
 * @returns {Object} Batch validation result
 */
export function validateBatchInsert(items, existingProducts = []) {
    const results = []
    const errors = []
    const warnings = []
    let validCount = 0

    items.forEach((item, index) => {
        const itemErrors = []
        const itemWarnings = []

        // Required fields
        if (!item.name && !item.rawName && !item.canonicalName) {
            itemErrors.push({
                code: 'MISSING_NAME',
                message: 'Nome do produto é obrigatório'
            })
        }

        // Price validation
        if (item.unitPrice !== undefined && item.unitPrice < 0) {
            itemErrors.push({
                code: 'NEGATIVE_PRICE',
                message: 'Preço não pode ser negativo'
            })
        }

        // Quantity validation
        if (item.quantity !== undefined && item.quantity <= 0) {
            itemErrors.push({
                code: 'INVALID_QUANTITY',
                message: 'Quantidade deve ser maior que zero'
            })
        }

        // Duplicate check
        const productName = item.canonicalName || item.name || item.rawName
        const duplicates = checkDuplicateProducts(productName, existingProducts)
        if (duplicates.length > 0 && item.status !== 'matched') {
            itemWarnings.push({
                code: 'POSSIBLE_DUPLICATE',
                message: `Possível duplicata de "${duplicates[0].name}"`,
                duplicates
            })
        }

        const isValid = itemErrors.length === 0

        results.push({
            index,
            item,
            valid: isValid,
            errors: itemErrors,
            warnings: itemWarnings
        })

        if (isValid) validCount++
        errors.push(...itemErrors.map(e => ({ ...e, itemIndex: index })))
        warnings.push(...itemWarnings.map(w => ({ ...w, itemIndex: index })))
    })

    // Trigger haptic based on result
    if (errors.length > 0) {
        HapticService.trigger('validationError')
    } else if (warnings.length > 0) {
        HapticService.trigger('warning')
    }

    return {
        valid: errors.length === 0,
        validCount,
        totalCount: items.length,
        results,
        errors,
        warnings,
        canProceed: errors.length === 0
    }
}

// ═══════════════════════════════════════════════════════════════
// SEMANTIC VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Check for duplicate products by name similarity
 * @param {string} name - Product name to check
 * @param {Array} existingProducts - Existing products
 * @returns {Array} Potential duplicates
 */
export function checkDuplicateProducts(name, existingProducts) {
    if (!name || !existingProducts?.length) return []

    const normalizedName = name.toLowerCase().trim()
    const words = normalizedName.split(/\s+/)

    return existingProducts.filter(product => {
        const productName = product.name?.toLowerCase().trim() || ''

        // Exact match
        if (productName === normalizedName) return true

        // Word overlap
        const productWords = productName.split(/\s+/)
        const matchingWords = words.filter(w =>
            productWords.some(pw => pw === w || pw.includes(w) || w.includes(pw))
        )

        // More than 60% word match
        return matchingWords.length / Math.max(words.length, productWords.length) > 0.6
    }).slice(0, 3)
}

/**
 * Validate unit consistency across items
 * @param {Array} items - Items to check
 * @returns {Object} Consistency result
 */
export function validateUnitConsistency(items) {
    const inconsistencies = []
    const unitGroups = {}

    // Group items by normalized name
    items.forEach((item, index) => {
        const name = (item.canonicalName || item.name || item.rawName || '').toLowerCase()
        if (!unitGroups[name]) {
            unitGroups[name] = []
        }
        unitGroups[name].push({ ...item, index })
    })

    // Check for same product with different units
    Object.entries(unitGroups).forEach(([name, group]) => {
        const units = [...new Set(group.map(g => g.unit))]
        if (units.length > 1) {
            inconsistencies.push({
                productName: name,
                units,
                items: group.map(g => ({ index: g.index, unit: g.unit }))
            })
        }
    })

    return {
        consistent: inconsistencies.length === 0,
        inconsistencies
    }
}

// ═══════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════

export const ValidationService = {
    // Product validation
    validateProduct: validateProductUpdate,
    validatePrice: validatePriceChange,
    validateStock: validateStockAdjustment,

    // Batch validation
    validateBatch: validateBatchInsert,

    // Semantic helpers
    checkDuplicates: checkDuplicateProducts,
    checkUnitConsistency: validateUnitConsistency
}

export default ValidationService
