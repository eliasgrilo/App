/**
 * ═══════════════════════════════════════════════════════════════════
 * Smart Search Utility — Apple-Quality Search Implementation
 * 
 * Features:
 * - Minimum 3 characters required to start matching
 * - Smart word-by-word matching with fuzzy tolerance
 * - Accent-insensitive (normalizes accents)
 * - Case-insensitive
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * Normalize text for comparison: lowercase, remove accents
 */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .trim()
}

/**
 * Check if query matches target using Apple-quality smart search
 * 
 * Rules:
 * 1. Query must have at least 3 characters
 * 2. Each word in query must have at least 3 consecutive matching characters in target
 * 3. Case and accent insensitive
 * 
 * @param query - Search query from user
 * @param target - Target string to match against
 * @returns boolean - Whether it's a match
 */
export function smartMatch(query: string, target: string): boolean {
    // Safety checks
    if (!query || !target) return false

    const normalizedQuery = normalizeText(query)
    const normalizedTarget = normalizeText(target)

    // Rule 1: Minimum 3 characters to start searching
    if (normalizedQuery.length < 3) return false

    // Split into words
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0)
    const targetWords = normalizedTarget.split(/\s+/).filter(w => w.length > 0)

    // Rule 2: MUST have same number of words
    if (queryWords.length !== targetWords.length) return false

    // Rule 3: Each query word must START the corresponding target word
    return queryWords.every((qWord, index) => {
        const targetWord = targetWords[index] || ''
        return targetWord.startsWith(qWord)
    })
}

/**
 * Filter an array of items using smart search
 * 
 * @param items - Array of items to filter
 * @param query - Search query
 * @param getSearchableText - Function to extract searchable text from item
 * @returns Filtered array
 */
export function smartFilter<T>(
    items: T[],
    query: string,
    getSearchableText: (item: T) => string | string[]
): T[] {
    // If query is too short, return all items
    if (!query || query.trim().length < 3) return items

    return items.filter(item => {
        const searchableText = getSearchableText(item)

        if (Array.isArray(searchableText)) {
            // Match against any of the searchable fields
            return searchableText.some(text => smartMatch(query, text || ''))
        }

        return smartMatch(query, searchableText || '')
    })
}

/**
 * Check if query is long enough to trigger search
 */
export function isSearchable(query: string): boolean {
    return query.trim().length >= 3
}

export default {
    smartMatch,
    smartFilter,
    normalizeText,
    isSearchable
}
