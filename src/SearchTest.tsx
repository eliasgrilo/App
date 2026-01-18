import React, { useState, useMemo } from 'react'

// Test data
const testItems = [
    { id: 1, name: "Farinha" },
    { id: 2, name: "Farinha de Trigo" },
    { id: 3, name: "Molho Branco" },
    { id: 4, name: "Molho" },
    { id: 5, name: "Molho de Tomate" },
    { id: 6, name: "Queijo Mussarela" },
    { id: 7, name: "Queijo Parmesão" },
]

export default function SearchTest() {
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        if (search.trim().length < 3) return []

        const normalizedSearch = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
        const queryWords = normalizedSearch.split(/\s+/).filter(w => w.length > 0)

        return testItems.filter(item => {
            const normalizedName = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
            const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 0)

            // Query words must be <= name words (allows partial matching)
            if (queryWords.length > nameWords.length) return false

            // Each query word must START the corresponding name word in sequence
            return queryWords.every((qWord, idx) => nameWords[idx]?.startsWith(qWord) ?? false)
        })
    }, [search])

    return (
        <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
            <h1>🔍 Search Debug Test</h1>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Digite para buscar (min 3 chars)..."
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        border: '2px solid #ddd',
                        borderRadius: '8px'
                    }}
                />
            </div>

            <div style={{ marginBottom: '20px', padding: '12px', background: '#f0f0f0', borderRadius: '8px' }}>
                <strong>Query:</strong> "{search}" ({search.length} chars)
                <br />
                <strong>Is searchable:</strong> {search.trim().length >= 3 ? '✅ YES' : '❌ NO (need 3+ chars)'}
                <br />
                <strong>Results found:</strong> {filtered.length}
            </div>

            <div style={{ background: '#fff', border: '2px solid #ddd', borderRadius: '8px', minHeight: '200px' }}>
                <div style={{ padding: '12px', background: '#f9f9f9', borderBottom: '1px solid #ddd' }}>
                    <strong>Results ({filtered.length})</strong>
                </div>
                {search.trim().length < 3 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        Digite pelo menos 3 caracteres
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        Nenhum resultado encontrado
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {filtered.map(item => (
                            <li
                                key={item.id}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #eee',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    setSearch(item.name)
                                }}
                            >
                                {item.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{ marginTop: '30px', padding: '16px', background: '#fff3cd', borderRadius: '8px' }}>
                <h3>📝 Test Cases:</h3>
                <ul style={{ marginTop: '10px' }}>
                    <li><code>"far"</code> → should show "Farinha" ✅</li>
                    <li><code>"far"</code> → should NOT show "Farinha de Trigo" ❌ (1≠3 words)</li>
                    <li><code>"mol"</code> → should show "Molho" ✅</li>
                    <li><code>"mol bra"</code> → should show "Molho Branco" ✅</li>
                    <li><code>"que mus"</code> → should show "Queijo Mussarela" ✅</li>
                </ul>
            </div>
        </div>
    )
}
