/**
 * Vector Embedding Service - Cérebro AI Brain
 * 
 * PREMIUM FEATURE: Semantic AI with Vector Embeddings
 * 
 * Provides:
 * - Text-to-vector conversion via Gemini text-embedding-004
 * - Cosine similarity search for semantic matching
 * - Product deduplication via embedding distance
 * - Intelligent supplier-product matching
 * - Semantic search across entities
 * 
 * Architecture: Uses 768-dimensional embeddings for high-fidelity
 * semantic representation of products, suppliers, and quotations.
 * 
 * @module vectorEmbeddingService
 * @version 1.0.0
 */

import { db } from '../firebase'
import {
    collection,
    doc,
    getDoc,
    setDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore'

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const EMBEDDING_MODEL = 'text-embedding-004'
const EMBEDDING_DIMENSIONS = 768
const COLLECTION_NAME = 'vector_embeddings'

// Similarity thresholds
const SIMILARITY_THRESHOLDS = {
    EXACT_MATCH: 0.95,      // Almost identical
    HIGH_MATCH: 0.85,       // Very similar
    GOOD_MATCH: 0.75,       // Good semantic match
    POSSIBLE_MATCH: 0.65,   // Worth considering
    MINIMUM: 0.50           // Barely related
}

// Entity types that can be embedded
const ENTITY_TYPES = {
    PRODUCT: 'product',
    SUPPLIER: 'supplier',
    QUOTATION: 'quotation',
    RECIPE: 'recipe',
    SEARCH_QUERY: 'search_query'
}

let apiKey = null

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize the embedding service with API key
 * @param {string} key - Gemini API key
 */
function initialize(key) {
    apiKey = key
    console.log('🧠 VectorEmbeddingService initialized')
}

/**
 * Check if service is ready
 */
function isReady() {
    return !!apiKey
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMBEDDING GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate embedding vector for text using Gemini
 * 
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 768-dimensional vector
 */
async function generateEmbedding(text) {
    if (!apiKey) {
        throw new Error('VectorEmbeddingService not initialized. Call initialize() first.')
    }

    if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string')
    }

    // Normalize and clean text
    const normalizedText = normalizeText(text)

    try {
        const response = await fetch(
            `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: `models/${EMBEDDING_MODEL}`,
                    content: {
                        parts: [{ text: normalizedText }]
                    }
                })
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Embedding API error: ${error.error?.message || response.statusText}`)
        }

        const data = await response.json()
        return data.embedding?.values || []
    } catch (error) {
        console.error('Failed to generate embedding:', error)
        throw error
    }
}

/**
 * Generate embeddings for multiple texts (batch)
 * 
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
async function generateEmbeddingsBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
        return []
    }

    // Gemini doesn't support batch embeddings, so we process in parallel
    const embeddings = await Promise.all(
        texts.map(text => generateEmbedding(text).catch(() => null))
    )

    return embeddings.filter(Boolean)
}

/**
 * Normalize text for embedding
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')           // Collapse whitespace
        .replace(/[^\w\s\-áàâãéèêíïóôõöúçñ]/gi, '') // Remove special chars (keep accents)
        .substring(0, 2048)              // Limit length
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMILARITY CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate cosine similarity between two vectors
 * 
 * @param {number[]} vectorA - First vector
 * @param {number[]} vectorB - Second vector
 * @returns {number} - Similarity score (0 to 1)
 */
function cosineSimilarity(vectorA, vectorB) {
    if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
        return 0
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i]
        normA += vectorA[i] * vectorA[i]
        normB += vectorB[i] * vectorB[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    return denominator === 0 ? 0 : dotProduct / denominator
}

/**
 * Calculate Euclidean distance between two vectors
 * 
 * @param {number[]} vectorA - First vector
 * @param {number[]} vectorB - Second vector
 * @returns {number} - Distance (lower = more similar)
 */
function euclideanDistance(vectorA, vectorB) {
    if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
        return Infinity
    }

    let sum = 0
    for (let i = 0; i < vectorA.length; i++) {
        const diff = vectorA[i] - vectorB[i]
        sum += diff * diff
    }
    return Math.sqrt(sum)
}

/**
 * Get similarity level description
 */
function getSimilarityLevel(score) {
    if (score >= SIMILARITY_THRESHOLDS.EXACT_MATCH) return 'exact'
    if (score >= SIMILARITY_THRESHOLDS.HIGH_MATCH) return 'high'
    if (score >= SIMILARITY_THRESHOLDS.GOOD_MATCH) return 'good'
    if (score >= SIMILARITY_THRESHOLDS.POSSIBLE_MATCH) return 'possible'
    if (score >= SIMILARITY_THRESHOLDS.MINIMUM) return 'low'
    return 'none'
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE & RETRIEVAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Store an embedding for an entity
 * 
 * @param {string} entityType - Type of entity (product, supplier, etc.)
 * @param {string} entityId - Entity ID
 * @param {string} text - Text that was embedded
 * @param {number[]} embedding - The embedding vector
 */
async function storeEmbedding(entityType, entityId, text, embedding) {
    const embeddingId = `${entityType}_${entityId}`

    await setDoc(doc(db, COLLECTION_NAME, embeddingId), {
        id: embeddingId,
        entityType,
        entityId,
        text: text.substring(0, 500), // Store truncated for reference
        embedding: JSON.stringify(embedding),
        dimensions: embedding.length,
        model: EMBEDDING_MODEL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    })

    return embeddingId
}

/**
 * Get stored embedding for an entity
 */
async function getEmbedding(entityType, entityId) {
    const embeddingId = `${entityType}_${entityId}`
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, embeddingId))

    if (!docSnap.exists()) {
        return null
    }

    const data = docSnap.data()
    return {
        ...data,
        embedding: JSON.parse(data.embedding)
    }
}

/**
 * Get all embeddings for an entity type
 */
async function getEmbeddingsByType(entityType) {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('entityType', '==', entityType)
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
            ...data,
            embedding: JSON.parse(data.embedding)
        }
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEMANTIC SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Semantic search across entities
 * 
 * @param {string} queryText - Search query
 * @param {string} entityType - Type of entity to search
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Ranked results with similarity scores
 */
async function semanticSearch(queryText, entityType, options = {}) {
    const {
        topK = 10,
        minSimilarity = SIMILARITY_THRESHOLDS.POSSIBLE_MATCH
    } = options

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(queryText)

    // Get all embeddings for entity type
    const storedEmbeddings = await getEmbeddingsByType(entityType)

    // Calculate similarities
    const results = storedEmbeddings
        .map(stored => ({
            entityId: stored.entityId,
            text: stored.text,
            similarity: cosineSimilarity(queryEmbedding, stored.embedding),
            level: null // Will be set below
        }))
        .map(r => ({ ...r, level: getSimilarityLevel(r.similarity) }))
        .filter(r => r.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)

    return {
        query: queryText,
        entityType,
        results,
        totalCandidates: storedEmbeddings.length,
        searchedAt: new Date().toISOString()
    }
}

/**
 * Find similar products (for deduplication)
 * 
 * @param {string} productName - Product name to check
 * @param {string} excludeId - ID to exclude (self)
 * @returns {Promise<Array>} - Similar products
 */
async function findSimilarProducts(productName, excludeId = null) {
    const result = await semanticSearch(productName, ENTITY_TYPES.PRODUCT, {
        topK: 5,
        minSimilarity: SIMILARITY_THRESHOLDS.GOOD_MATCH
    })

    return result.results.filter(r => r.entityId !== excludeId)
}

/**
 * Find best suppliers for a product
 * 
 * @param {string} productDescription - Product description
 * @returns {Promise<Array>} - Ranked suppliers
 */
async function findBestSuppliersForProduct(productDescription) {
    return semanticSearch(productDescription, ENTITY_TYPES.SUPPLIER, {
        topK: 5,
        minSimilarity: SIMILARITY_THRESHOLDS.POSSIBLE_MATCH
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY EMBEDDING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Embed a product
 */
async function embedProduct(product) {
    const text = buildProductText(product)
    const embedding = await generateEmbedding(text)
    await storeEmbedding(ENTITY_TYPES.PRODUCT, product.id, text, embedding)
    return embedding
}

/**
 * Embed a supplier
 */
async function embedSupplier(supplier) {
    const text = buildSupplierText(supplier)
    const embedding = await generateEmbedding(text)
    await storeEmbedding(ENTITY_TYPES.SUPPLIER, supplier.id, text, embedding)
    return embedding
}

/**
 * Build text representation for a product
 */
function buildProductText(product) {
    const parts = [
        product.name,
        product.category,
        product.subcategory,
        product.unit,
        product.notes
    ].filter(Boolean)

    return parts.join(' ')
}

/**
 * Build text representation for a supplier
 */
function buildSupplierText(supplier) {
    const parts = [
        supplier.name,
        supplier.category,
        supplier.notes,
        supplier.address
    ].filter(Boolean)

    return parts.join(' ')
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEDUPLICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a product might be a duplicate
 * 
 * @param {Object} newProduct - Product to check
 * @param {number} threshold - Similarity threshold
 * @returns {Promise<Object>} - Duplicate check result
 */
async function checkForDuplicate(newProduct, threshold = SIMILARITY_THRESHOLDS.HIGH_MATCH) {
    const text = buildProductText(newProduct)
    const embedding = await generateEmbedding(text)
    const storedEmbeddings = await getEmbeddingsByType(ENTITY_TYPES.PRODUCT)

    const potentialDuplicates = storedEmbeddings
        .map(stored => ({
            entityId: stored.entityId,
            text: stored.text,
            similarity: cosineSimilarity(embedding, stored.embedding)
        }))
        .filter(r => r.similarity >= threshold && r.entityId !== newProduct.id)
        .sort((a, b) => b.similarity - a.similarity)

    return {
        isDuplicate: potentialDuplicates.length > 0,
        duplicates: potentialDuplicates,
        highestSimilarity: potentialDuplicates[0]?.similarity || 0,
        recommendation: potentialDuplicates.length > 0
            ? `Possível duplicata de "${potentialDuplicates[0].text}" (${Math.round(potentialDuplicates[0].similarity * 100)}% similar)`
            : null
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Embed all products in database
 * Used for initial population or rebuilding index
 */
async function embedAllProducts(products) {
    console.log(`🧠 Embedding ${products.length} products...`)

    let embedded = 0
    let failed = 0

    for (const product of products) {
        try {
            await embedProduct(product)
            embedded++

            // Rate limiting - 60 requests/minute for Gemini
            if (embedded % 10 === 0) {
                await new Promise(r => setTimeout(r, 1000))
            }
        } catch (error) {
            console.error(`Failed to embed product ${product.id}:`, error.message)
            failed++
        }
    }

    console.log(`✅ Embedded ${embedded} products, ${failed} failed`)
    return { embedded, failed }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const VectorEmbeddingService = {
    // Initialization
    initialize,
    isReady,

    // Embedding generation
    generateEmbedding,
    generateEmbeddingsBatch,

    // Similarity
    cosineSimilarity,
    euclideanDistance,
    getSimilarityLevel,
    SIMILARITY_THRESHOLDS,

    // Storage
    storeEmbedding,
    getEmbedding,
    getEmbeddingsByType,

    // Search
    semanticSearch,
    findSimilarProducts,
    findBestSuppliersForProduct,

    // Entity helpers
    embedProduct,
    embedSupplier,
    buildProductText,
    buildSupplierText,

    // Deduplication
    checkForDuplicate,

    // Batch
    embedAllProducts,

    // Constants
    ENTITY_TYPES,
    EMBEDDING_MODEL,
    EMBEDDING_DIMENSIONS
}

export default VectorEmbeddingService
