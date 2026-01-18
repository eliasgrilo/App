// Test search logic
function normalizeText(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function smartMatch(query, target) {
    if (!query || !target) return false

    const normalizedQuery = normalizeText(query)
    const normalizedTarget = normalizeText(target)

    // Rule 1: Minimum 3 characters
    if (normalizedQuery.length < 3) return false

    // Split into words
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0)
    const targetWords = normalizedTarget.split(/\s+/).filter(w => w.length > 0)

    // Rule 2: Same number of words
    if (queryWords.length !== targetWords.length) return false

    // Rule 3: Each query word must START the corresponding target word
    return queryWords.every((qWord, index) => {
        const targetWord = targetWords[index] || ''
        return targetWord.startsWith(qWord)
    })
}

// Test cases
const tests = [
    { query: "far", target: "Farinha", expected: true },
    { query: "far", target: "Farinha de Trigo", expected: false }, // 1 != 3 words
    { query: "mol bra", target: "Molho Branco", expected: true },
    { query: "mol", target: "Molho", expected: true },
    { query: "mol", target: "Molho Branco", expected: false }, // 1 != 2 words
    { query: "far de tri", target: "Farinha de Trigo", expected: true },
    { query: "molho branco", target: "Molho Branco", expected: true },
    { query: "molho branco ervas", target: "Molho Branco", expected: false }, // 3 != 2 words
]

console.log("=== SEARCH LOGIC TESTS ===\n")
tests.forEach((test, i) => {
    const result = smartMatch(test.query, test.target)
    const status = result === test.expected ? "✅ PASS" : "❌ FAIL"
    console.log(`Test ${i + 1}: ${status}`)
    console.log(`  Query: "${test.query}"`)
    console.log(`  Target: "${test.target}"`)
    console.log(`  Expected: ${test.expected}, Got: ${result}`)
    if (result !== test.expected) {
        const qWords = normalizeText(test.query).split(/\s+/).filter(w => w.length > 0)
        const tWords = normalizeText(test.target).split(/\s+/).filter(w => w.length > 0)
        console.log(`  Query words (${qWords.length}): [${qWords.join(', ')}]`)
        console.log(`  Target words (${tWords.length}): [${tWords.join(', ')}]`)
    }
    console.log()
})
