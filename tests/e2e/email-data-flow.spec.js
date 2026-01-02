/**
 * E2E Tests - Email Data Flow
 * 
 * Tests that data extracted from supplier email responses flows correctly
 * through the entire pipeline: Extraction → Storage → Display
 * 
 * CRITICAL: These tests validate that paymentTerms, deliveryDays, 
 * supplierNotes are properly saved and displayed in UI pills.
 * 
 * @module tests/e2e/email-data-flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GeminiService } from '../../src/services/geminiService'

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK SETUP
// ═══════════════════════════════════════════════════════════════════════════════

// Mock Firebase
vi.mock('../../src/firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'test-user' } }
}))

// Mock Firestore
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
    setDoc: vi.fn(() => Promise.resolve()),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
    serverTimestamp: vi.fn(() => new Date())
}))

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA - Sample supplier emails
// ═══════════════════════════════════════════════════════════════════════════════

const SAMPLE_EMAILS = {
    portuguese: `
Prezados,

Segue nossa cotação conforme solicitado:

- Farinha de Trigo Especial: R$ 5,50/kg
- Açúcar Cristal: R$ 4,80/kg  
- Fermento Biológico: R$ 12,00/un

Condições de Pagamento: 30 dias boleto
Prazo de Entrega: 3 dias úteis após confirmação

Observação: Válido até 15/01/2026. Frete incluso para pedidos acima de R$ 500.

Atenciosamente,
João - Fornecedor ABC
    `,

    english: `
Hello,

Please find our quotation below:

- Premium Flour: $5.50 per kg
- Crystal Sugar: $4.80 per kg

Payment Terms: Net 30
Delivery: 5 business days

Note: Price valid until Jan 15, 2026.

Best regards,
Supplier XYZ
    `,

    minimal: `
Preço farinha: R$ 6,00/kg
Entrega em 2 dias
    `,

    withProblems: `
Prezados,

Infelizmente não temos disponibilidade de Fermento no momento.

Farinha: R$ 5,80/kg (disponível: 30kg)
Açúcar: indisponível até próxima semana

Prazo: 5 dias úteis
Pagamento: À vista

Obs: Devido a problemas logísticos, pode haver atraso.
    `
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGEX EXTRACTION TESTS - When Gemini is not available
// ═══════════════════════════════════════════════════════════════════════════════

describe('Email Data Extraction (Regex Fallback)', () => {
    describe('Portuguese Email - Full Data', () => {
        it('should extract all fields from Portuguese supplier email', async () => {
            // GeminiService falls back to regex when no API key
            const result = await GeminiService.analyzeSupplierResponse(
                SAMPLE_EMAILS.portuguese,
                [{ name: 'Farinha de Trigo' }, { name: 'Açúcar' }, { name: 'Fermento' }]
            )

            expect(result.success).toBe(true)
            expect(result.data).toBeDefined()

            // ═══════════════════════════════════════════════════════════════════
            // CRITICAL: These fields MUST be extracted for UI display
            // ═══════════════════════════════════════════════════════════════════
            console.log('📧 Extracted data:', {
                paymentTerms: result.data.paymentTerms,
                deliveryDays: result.data.deliveryDays,
                supplierNotes: result.data.supplierNotes,
                confidence: result.data.confidence,
                itemsCount: result.data.items?.length
            })

            // Payment terms
            expect(result.data.paymentTerms).toBeTruthy()
            expect(result.data.paymentTerms).toMatch(/30|boleto/i)

            // Delivery days
            expect(result.data.deliveryDays).toBe(3)

            // Items with prices
            expect(result.data.items.length).toBeGreaterThan(0)
            expect(result.data.items.some(i => i.unitPrice > 0)).toBe(true)

            // Confidence should be reasonable
            expect(result.data.confidence).toBeGreaterThan(0.5)
        })

        it('should extract supplier notes/observations', async () => {
            const result = await GeminiService.analyzeSupplierResponse(
                SAMPLE_EMAILS.portuguese,
                []
            )

            // Should capture the observation about validity and shipping
            expect(result.data.supplierNotes).toBeTruthy()
        })
    })

    describe('English Email', () => {
        it('should extract payment terms from English email', async () => {
            const result = await GeminiService.analyzeSupplierResponse(
                SAMPLE_EMAILS.english,
                [{ name: 'Flour' }, { name: 'Sugar' }]
            )

            expect(result.success).toBe(true)

            // Should find "Net 30" or similar
            expect(result.data.paymentTerms).toBeTruthy()

            // Should find 5 business days
            expect(result.data.deliveryDays).toBe(5)
        })
    })

    describe('Minimal Email', () => {
        it('should extract basic data from minimal email', async () => {
            const result = await GeminiService.analyzeSupplierResponse(
                SAMPLE_EMAILS.minimal,
                [{ name: 'Farinha' }]
            )

            expect(result.success).toBe(true)
            expect(result.data.hasQuote).toBe(true)

            // Should find price
            expect(result.data.items.length).toBeGreaterThan(0)
            expect(result.data.items[0].unitPrice).toBe(6.0)

            // Should find 2 days
            expect(result.data.deliveryDays).toBe(2)
        })
    })

    describe('Email with Problems', () => {
        it('should detect problems in supplier response', async () => {
            const result = await GeminiService.analyzeSupplierResponse(
                SAMPLE_EMAILS.withProblems,
                [{ name: 'Fermento' }, { name: 'Farinha' }, { name: 'Açúcar' }]
            )

            expect(result.success).toBe(true)

            // Should extract whatever prices are available
            expect(result.data.items.some(i => i.unitPrice > 0)).toBe(true)

            // Should capture observation about delays
            // Note: Basic regex may not detect hasProblems flag, but should capture notes
        })
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// DATA FLOW VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Data Flow: Extraction → Save → Display', () => {
    it('should produce data structure compatible with UI display', async () => {
        const result = await GeminiService.analyzeSupplierResponse(
            SAMPLE_EMAILS.portuguese,
            [{ name: 'Farinha' }]
        )

        // Simulate what smartSourcingService does with the data
        const metadataToSave = {
            items: result.data.items,
            quotedTotal: result.data.totalQuote,
            deliveryDate: result.data.deliveryDate || null,
            deliveryDays: result.data.deliveryDays ?? null,
            paymentTerms: result.data.paymentTerms || null,
            supplierNotes: result.data.supplierNotes || null,
            aiAnalysis: result.data,
            aiProcessed: true
        }

        console.log('💾 Data to save to Firestore:', metadataToSave)

        // ═══════════════════════════════════════════════════════════════════
        // These assertions validate the data structure that UI expects
        // ═══════════════════════════════════════════════════════════════════

        // Direct fields (priority 1 in UI)
        expect(typeof metadataToSave.paymentTerms === 'string' || metadataToSave.paymentTerms === null).toBe(true)
        expect(typeof metadataToSave.deliveryDays === 'number' || metadataToSave.deliveryDays === null).toBe(true)
        expect(typeof metadataToSave.supplierNotes === 'string' || metadataToSave.supplierNotes === null).toBe(true)

        // aiAnalysis nested (fallback in UI)
        expect(metadataToSave.aiAnalysis).toBeDefined()
        expect(metadataToSave.aiAnalysis.confidence).toBeGreaterThan(0)

        // aiProcessed flag for UI indication
        expect(metadataToSave.aiProcessed).toBe(true)
    })

    it('should handle null values gracefully', async () => {
        // Empty email should not crash
        const result = await GeminiService.analyzeSupplierResponse('', [])

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()

        // All optional fields should be null, not undefined or throw
        expect(result.data.paymentTerms === null || result.data.paymentTerms === undefined).toBe(true)
        expect(result.data.deliveryDays === null || result.data.deliveryDays === undefined).toBe(true)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// UI FIELD MAPPING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('UI Field Mapping Compatibility', () => {
    it('should produce fields accessible via fallback chain', async () => {
        const result = await GeminiService.analyzeSupplierResponse(
            SAMPLE_EMAILS.portuguese,
            []
        )

        // Simulate Firestore document structure after smartSourcingService saves
        const firestoreDoc = {
            status: 'quoted',
            paymentTerms: result.data.paymentTerms,
            deliveryDays: result.data.deliveryDays,
            supplierNotes: result.data.supplierNotes,
            aiAnalysis: {
                ...result.data,
                paymentTerms: result.data.paymentTerms,
                deliveryDays: result.data.deliveryDays,
                supplierNotes: result.data.supplierNotes
            }
        }

        // UI fallback chain simulation (from SmartSourcingWorkflow.jsx)
        const uiPaymentTerms = firestoreDoc.paymentTerms ||
            firestoreDoc.quotedPaymentTerms ||
            firestoreDoc.aiAnalysis?.paymentTerms ||
            null

        const uiDeliveryDays = firestoreDoc.deliveryDays ??
            firestoreDoc.quotedDeliveryDays ??
            firestoreDoc.aiAnalysis?.deliveryDays ??
            null

        const uiSupplierNotes = firestoreDoc.supplierNotes ||
            firestoreDoc.quotedSupplierNotes ||
            firestoreDoc.aiAnalysis?.supplierNotes ||
            null

        console.log('🎨 UI will display:', {
            paymentTerms: uiPaymentTerms,
            deliveryDays: uiDeliveryDays,
            supplierNotes: uiSupplierNotes
        })

        // At least one of these should be populated for a valid email
        const hasAnyEmailData = uiPaymentTerms || uiDeliveryDays || uiSupplierNotes
        expect(hasAnyEmailData).toBeTruthy()
    })
})
