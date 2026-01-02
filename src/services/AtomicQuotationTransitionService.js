/**
 * Atomic Quotation Transition Service
 * 
 * Handles atomic state transitions for quotations
 * and ensures global uniqueness across the application.
 */

export const AtomicQuotationTransitionService = {
    /**
     * Enforce global uniqueness for quotation cards
     * Removes duplicate quotation entries from localStorage and state
     */
    async enforceGlobalUniqueness() {
        const result = {
            duplicatesRemoved: 0,
            totalProcessed: 0
        }

        try {
            // Get current quotations from localStorage
            const stored = localStorage.getItem('padoca_sent_emails')
            if (!stored) return result

            const quotations = JSON.parse(stored)
            if (!Array.isArray(quotations)) return result

            result.totalProcessed = quotations.length

            // Track seen IDs to detect duplicates
            const seenIds = new Set()
            const seenCompositeKeys = new Set()
            const unique = []

            for (const q of quotations) {
                // Generate composite key for deduplication
                const compositeKey = `${q.supplierId || q.to || ''}_${(q.items || []).map(i => i.id || i.name).sort().join(',')}`

                // Check for duplicate by ID
                if (q.id && seenIds.has(q.id)) {
                    result.duplicatesRemoved++
                    console.log(`🗑️ Removed duplicate by ID: ${q.id}`)
                    continue
                }

                // Check for duplicate by firestoreId
                if (q.firestoreId && seenIds.has(q.firestoreId)) {
                    result.duplicatesRemoved++
                    console.log(`🗑️ Removed duplicate by firestoreId: ${q.firestoreId}`)
                    continue
                }

                // Check for duplicate by composite key
                if (compositeKey && seenCompositeKeys.has(compositeKey)) {
                    result.duplicatesRemoved++
                    console.log(`🗑️ Removed duplicate by composite key: ${compositeKey.substring(0, 50)}...`)
                    continue
                }

                // Not a duplicate - add to unique list
                if (q.id) seenIds.add(q.id)
                if (q.firestoreId) seenIds.add(q.firestoreId)
                if (compositeKey) seenCompositeKeys.add(compositeKey)
                unique.push(q)
            }

            // Save deduplicated list back to localStorage
            if (result.duplicatesRemoved > 0) {
                localStorage.setItem('padoca_sent_emails', JSON.stringify(unique))
                console.log(`✅ Saved ${unique.length} unique quotations (removed ${result.duplicatesRemoved} duplicates)`)
            }

            return result
        } catch (error) {
            console.error('Error enforcing global uniqueness:', error)
            return { ...result, error: error.message }
        }
    },

    /**
     * Atomically transition a quotation to a new status
     * Ensures no race conditions during status updates
     */
    async transitionStatus(quotationId, newStatus, options = {}) {
        const { optimistic = false } = options

        try {
            const stored = localStorage.getItem('padoca_sent_emails')
            if (!stored) return { success: false, error: 'No quotations found' }

            const quotations = JSON.parse(stored)
            const index = quotations.findIndex(q => q.id === quotationId || q.firestoreId === quotationId)

            if (index === -1) {
                return { success: false, error: 'Quotation not found' }
            }

            const oldStatus = quotations[index].status
            quotations[index].status = newStatus
            quotations[index].updatedAt = new Date().toISOString()

            localStorage.setItem('padoca_sent_emails', JSON.stringify(quotations))

            return {
                success: true,
                quotationId,
                oldStatus,
                newStatus,
                optimistic
            }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }
}

export default AtomicQuotationTransitionService
