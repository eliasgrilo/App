/**
 * Invoice Scanner Service - Multimodal AI Invoice Extraction
 * Apple-Google Symbiosis: Gemini 1.5 Pro Vision + Premium UX
 * 
 * Extracts structured data from invoice photos using AI,
 * performs semantic product matching, and validates for DB commit.
 */

import { HapticService } from './hapticService'

// ═══════════════════════════════════════════════════════════════
// GEMINI VISION CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_VISION_MODEL = 'gemini-1.5-pro'

let geminiApiKey = null

/**
 * Initialize the invoice scanner with Gemini API key
 * @param {string} apiKey - Google AI API key
 */
export function initializeInvoiceScanner(apiKey) {
    geminiApiKey = apiKey
}

/**
 * Check if scanner is ready
 * @returns {boolean}
 */
export function isScannerReady() {
    return !!geminiApiKey
}

// ═══════════════════════════════════════════════════════════════
// INVOICE EXTRACTION PROMPT (Portuguese/Brazilian)
// ═══════════════════════════════════════════════════════════════

const INVOICE_EXTRACTION_PROMPT = `Você é um especialista em análise de documentos fiscais brasileiros.
Analise esta imagem de nota fiscal/cupom fiscal e extraia TODOS os itens listados.

Para cada item, extraia:
- nome: Nome exato como aparece no documento
- quantidade: Número de unidades (padrão 1 se não especificado)
- unidade: Unidade de medida (kg, g, L, ml, un, cx, pct)
- precoUnitario: Preço por unidade em reais
- precoTotal: Valor total do item em reais

Também extraia os metadados do documento:
- fornecedor: Nome do estabelecimento
- cnpj: CNPJ se visível
- data: Data da compra (formato YYYY-MM-DD)
- numeroNota: Número do documento fiscal

CRÍTICO: 
- Seja preciso com os valores numéricos
- Normalize unidades (quilogramas → kg, litros → L)
- Se um campo não for legível, use null
- Retorne APENAS JSON válido, sem markdown

Responda APENAS com este formato JSON:
{
    "success": true,
    "metadata": {
        "vendor": "nome do fornecedor",
        "cnpj": "00.000.000/0000-00",
        "date": "2024-01-15",
        "invoiceNumber": "123456",
        "totalValue": 150.00
    },
    "items": [
        {
            "rawName": "FARINHA TRIGO 25KG",
            "quantity": 1,
            "unit": "un",
            "unitPrice": 89.90,
            "totalPrice": 89.90,
            "confidence": 0.95
        }
    ],
    "overallConfidence": 0.92
}`

// ═══════════════════════════════════════════════════════════════
// CORE SCANNING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Scan an invoice image and extract structured data
 * @param {string} imageBase64 - Base64 encoded image (with or without data URI prefix)
 * @returns {Promise<Object>} Extracted invoice data
 */
export async function scanInvoice(imageBase64) {
    if (!geminiApiKey) {
        throw new Error('Invoice scanner not initialized. Call initializeInvoiceScanner first.')
    }

    // Trigger haptic for capture
    HapticService.trigger('invoiceCapture')

    // Clean base64 if it has data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    try {
        const response = await fetch(
            `${GEMINI_API_BASE}/models/${GEMINI_VISION_MODEL}:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: INVOICE_EXTRACTION_PROMPT },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: cleanBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 4096
                    }
                })
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || 'Gemini API request failed')
        }

        const result = await response.json()
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
            throw new Error('No response from Gemini')
        }

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Invalid JSON response from AI')
        }

        const parsed = JSON.parse(jsonMatch[0])

        // Add AI metadata
        parsed.aiMetadata = {
            model: GEMINI_VISION_MODEL,
            analyzedAt: new Date().toISOString(),
            processingTimeMs: Date.now()
        }

        return parsed

    } catch (error) {
        HapticService.trigger('error')
        console.error('Invoice scan error:', error)
        throw error
    }
}

// ═══════════════════════════════════════════════════════════════
// SEMANTIC PRODUCT MATCHING
// ═══════════════════════════════════════════════════════════════

const SEMANTIC_MATCH_PROMPT = (rawName, candidates) => `Você é um especialista em mapeamento semântico de produtos.

Produto da nota fiscal: "${rawName}"

Produtos existentes no estoque:
${candidates.map((c, i) => `${i + 1}. "${c.name}" (${c.unit})`).join('\n')}

Tarefa: Identifique se o produto da nota fiscal corresponde a algum produto existente.

Considere:
- Variações de nome (Coca-Cola = Refri Lata Coca)
- Abreviações comuns (FARI TRI 25K = Farinha de Trigo 25kg)
- Diferentes formatos de escrita
- Tamanhos/quantidades no nome

Responda APENAS com JSON:
{
    "matchFound": true/false,
    "matchedIndex": número ou null,
    "confidence": 0.0 a 1.0,
    "canonicalName": "nome padronizado sugerido",
    "reasoning": "breve explicação"
}`

/**
 * Match a raw product name against existing inventory
 * @param {string} rawName - Product name from invoice
 * @param {Array} existingProducts - Array of existing products
 * @returns {Promise<Object>} Match result with confidence
 */
export async function matchProductSemantically(rawName, existingProducts = []) {
    if (!geminiApiKey || existingProducts.length === 0) {
        return {
            matchFound: false,
            matchedProduct: null,
            confidence: 0,
            canonicalName: normalizeProductName(rawName),
            suggestions: []
        }
    }

    try {
        const response = await fetch(
            `${GEMINI_API_BASE}/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: SEMANTIC_MATCH_PROMPT(rawName, existingProducts) }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 512
                    }
                })
            }
        )

        if (!response.ok) {
            throw new Error('Semantic match request failed')
        }

        const result = await response.json()
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text

        const jsonMatch = text?.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Invalid response')
        }

        const parsed = JSON.parse(jsonMatch[0])

        // Trigger haptic based on confidence
        if (parsed.matchFound && parsed.confidence >= 0.9) {
            HapticService.trigger('scanSuccess')
        } else if (parsed.confidence >= 0.6) {
            HapticService.trigger('selection')
        }

        return {
            matchFound: parsed.matchFound,
            matchedProduct: parsed.matchedIndex !== null
                ? existingProducts[parsed.matchedIndex]
                : null,
            confidence: parsed.confidence,
            canonicalName: parsed.canonicalName,
            reasoning: parsed.reasoning,
            suggestions: parsed.matchFound ? [] : findSimilarProducts(rawName, existingProducts)
        }

    } catch (error) {
        console.warn('Semantic match fallback:', error)
        // Fallback to fuzzy matching
        return fuzzyMatchProduct(rawName, existingProducts)
    }
}

/**
 * Normalize a product name to canonical form
 * @param {string} rawName - Raw product name
 * @returns {string} Normalized name
 */
export function normalizeProductName(rawName) {
    if (!rawName) return ''

    return rawName
        // Decode common abbreviations
        .replace(/\bFAR\b/gi, 'Farinha')
        .replace(/\bTRI\b/gi, 'Trigo')
        .replace(/\bACU\b/gi, 'Açúcar')
        .replace(/\bREF\b/gi, 'Refrigerante')
        .replace(/\bAZ\b/gi, 'Azeitona')
        .replace(/\bMOZ\b/gi, 'Mozzarella')
        .replace(/\bMUSS\b/gi, 'Mussarela')
        .replace(/\bTOM\b/gi, 'Tomate')
        .replace(/\bMOL\b/gi, 'Molho')
        // Clean up
        .replace(/\s+/g, ' ')
        .trim()
        // Title case
        .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
}

/**
 * Find similar products using fuzzy matching
 * @param {string} name - Product name to match
 * @param {Array} products - Existing products
 * @returns {Array} Similar products sorted by similarity
 */
function findSimilarProducts(name, products) {
    const normalizedName = name.toLowerCase()
    const words = normalizedName.split(/\s+/)

    return products
        .map(product => {
            const productWords = product.name.toLowerCase().split(/\s+/)
            const matchingWords = words.filter(w =>
                productWords.some(pw => pw.includes(w) || w.includes(pw))
            )
            const score = matchingWords.length / Math.max(words.length, productWords.length)
            return { product, score }
        })
        .filter(({ score }) => score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ product, score }) => ({ ...product, matchScore: score }))
}

/**
 * Fuzzy match fallback when AI is unavailable
 * @param {string} rawName - Product name
 * @param {Array} existingProducts - Existing products
 * @returns {Object} Match result
 */
function fuzzyMatchProduct(rawName, existingProducts) {
    const similar = findSimilarProducts(rawName, existingProducts)
    const topMatch = similar[0]

    if (topMatch && topMatch.matchScore > 0.6) {
        return {
            matchFound: true,
            matchedProduct: topMatch,
            confidence: topMatch.matchScore,
            canonicalName: topMatch.name,
            reasoning: 'Fuzzy match based on word similarity',
            suggestions: similar.slice(1)
        }
    }

    return {
        matchFound: false,
        matchedProduct: null,
        confidence: 0,
        canonicalName: normalizeProductName(rawName),
        suggestions: similar
    }
}

// ═══════════════════════════════════════════════════════════════
// BATCH PROCESSING
// ═══════════════════════════════════════════════════════════════

/**
 * Process all items from an invoice scan with semantic matching
 * @param {Array} scannedItems - Items from scanInvoice()
 * @param {Array} existingProducts - Existing inventory products
 * @returns {Promise<Array>} Processed items with match status
 */
export async function processInvoiceItems(scannedItems, existingProducts) {
    const processedItems = []

    for (const item of scannedItems) {
        // Trigger haptic for each recognized item
        HapticService.trigger('itemRecognized')

        const matchResult = await matchProductSemantically(item.rawName, existingProducts)

        processedItems.push({
            ...item,
            matchResult,
            status: matchResult.matchFound
                ? (matchResult.confidence >= 0.9 ? 'matched' : 'review')
                : 'new',
            canonicalName: matchResult.canonicalName || normalizeProductName(item.rawName)
        })

        // Small delay for haptic rhythm
        await new Promise(resolve => setTimeout(resolve, 100))
    }

    return processedItems
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * Validate extracted invoice data before commit
 * @param {Object} invoiceData - Data from scanInvoice()
 * @returns {Object} Validation result
 */
export function validateExtraction(invoiceData) {
    const errors = []
    const warnings = []

    // Check overall confidence
    if (invoiceData.overallConfidence < 0.7) {
        warnings.push({
            code: 'LOW_CONFIDENCE',
            message: 'Confiança geral da extração está abaixo de 70%'
        })
    }

    // Validate items
    if (!invoiceData.items || invoiceData.items.length === 0) {
        errors.push({
            code: 'NO_ITEMS',
            message: 'Nenhum item foi extraído da nota fiscal'
        })
    } else {
        invoiceData.items.forEach((item, index) => {
            // Check required fields
            if (!item.rawName) {
                errors.push({
                    code: 'MISSING_NAME',
                    message: `Item ${index + 1}: Nome não identificado`
                })
            }

            // Check for suspicious values
            if (item.unitPrice && item.unitPrice > 10000) {
                warnings.push({
                    code: 'HIGH_PRICE',
                    message: `${item.rawName}: Preço unitário muito alto (${item.unitPrice})`
                })
            }

            if (item.quantity && item.quantity > 1000) {
                warnings.push({
                    code: 'HIGH_QUANTITY',
                    message: `${item.rawName}: Quantidade muito alta (${item.quantity})`
                })
            }

            // Check item confidence
            if (item.confidence && item.confidence < 0.5) {
                warnings.push({
                    code: 'LOW_ITEM_CONFIDENCE',
                    message: `${item.rawName}: Baixa confiança na extração`
                })
            }
        })
    }

    // Trigger haptic if validation fails
    if (errors.length > 0) {
        HapticService.trigger('validationError')
    } else if (warnings.length > 0) {
        HapticService.trigger('warning')
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        canProceed: errors.length === 0
    }
}

// ═══════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════

export const InvoiceScannerService = {
    // Initialization
    initialize: initializeInvoiceScanner,
    isReady: isScannerReady,

    // Core scanning
    scan: scanInvoice,
    processItems: processInvoiceItems,

    // Semantic matching
    matchProduct: matchProductSemantically,
    normalizeName: normalizeProductName,

    // Validation
    validate: validateExtraction
}

export default InvoiceScannerService
