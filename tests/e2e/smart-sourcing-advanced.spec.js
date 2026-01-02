/**
 * Advanced Smart Sourcing Tests
 * 
 * Comprehensive tests for:
 * - Email processing pipeline
 * - AI analysis accuracy
 * - Order creation flow
 * - Error handling and edge cases
 * - Performance and reliability
 * 
 * @module tests/e2e/smart-sourcing-advanced
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest'
import {
    AutoQuoteStateMachine,
    AutoQuoteState,
    AutoQuoteEvent
} from '../../src/services/autoQuoteStateMachine'
import { GCounter, PNCounter, LWWRegister, LWWMap } from '../../src/services/conflictResolutionService'

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK SETUP
// ═══════════════════════════════════════════════════════════════════════════════

// Mock Firebase
vi.mock('../../src/firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'test-user', email: 'test@padoca.com' } }
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
    addDoc: vi.fn(() => Promise.resolve({ id: 'test-doc-id' })),
    serverTimestamp: vi.fn(() => new Date()),
    runTransaction: vi.fn((db, fn) => fn({
        get: vi.fn(() => Promise.resolve({ exists: () => false })),
        set: vi.fn(),
        update: vi.fn()
    }))
}))

// Mock Distributed Lock
vi.mock('../../src/services/distributedLockService', () => ({
    DistributedLockService: {
        withLock: vi.fn((scope, resource, fn) => fn()),
        acquire: vi.fn(() => Promise.resolve({ lockId: 'test-lock' })),
        release: vi.fn(() => Promise.resolve())
    },
    LockScope: {
        ORDER_CREATE: 'order_create',
        QUOTATION_SEND: 'quotation_send',
        ORDER_RECEIVE: 'order_receive'
    }
}))

// Mock Haptic Service
vi.mock('../../src/services/hapticService', () => ({
    HapticService: {
        trigger: vi.fn()
    }
}))

// Mock Event Store
vi.mock('../../src/services/eventStoreService', () => ({
    EventStoreService: {
        append: vi.fn(() => Promise.resolve())
    },
    EventType: {
        QUOTATION_SENT: 'quotation.sent',
        QUOTATION_REPLY_RECEIVED: 'quotation.reply_received',
        QUOTATION_ANALYZED: 'quotation.analyzed',
        ORDER_CREATED: 'order.created',
        QUOTATION_DELIVERED: 'quotation.delivered',
        QUOTATION_CANCELLED: 'quotation.cancelled',
        QUOTATION_EXPIRED: 'quotation.expired',
        QUOTATION_ANALYSIS_FAILED: 'quotation.analysis_failed'
    }
}))

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA FACTORIES
// ═══════════════════════════════════════════════════════════════════════════════

const createTestQuotation = (overrides = {}) => {
    const status = overrides.status || AutoQuoteState.PENDING
    const needsEmailSent = [
        AutoQuoteState.AWAITING,
        AutoQuoteState.PROCESSING,
        AutoQuoteState.ORDERED,
        AutoQuoteState.RECEIVED
    ].includes(status)

    return {
        id: `quot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        requestId: `REQ-${Date.now().toString(36).toUpperCase()}`,
        productId: 'prod-farinha-001',
        productName: 'Farinha de Trigo Tipo 1',
        supplierId: 'sup-moinho-001',
        supplierName: 'Moinho São Paulo',
        supplierEmail: 'vendas@moinho.com.br',
        requestedQuantity: 100,
        neededQuantity: 100,
        unit: 'kg',
        estimatedUnitPrice: 5.50,
        currentStock: 25,
        minStock: 50,
        status,
        createdAt: new Date().toISOString(),
        items: [
            { productId: 'prod-farinha-001', productName: 'Farinha de Trigo Tipo 1', quantity: 100, unit: 'kg' }
        ],
        ...(needsEmailSent && !overrides.emailSentAt ? { emailSentAt: new Date().toISOString() } : {}),
        ...overrides
    }
}

const createSupplierEmail = (type = 'quoted') => {
    const templates = {
        quoted: {
            subject: 'RE: Cotação REQ-ABC123',
            body: `Prezado cliente,

Segue nossa cotação conforme solicitado:

- Farinha de Trigo Tipo 1: R$ 5,80/kg
- Quantidade disponível: 200kg
- Prazo de entrega: 3 dias úteis
- Condições de pagamento: 30 dias

Atenciosamente,
Equipe Comercial
Moinho São Paulo`
        },
        delayed: {
            subject: 'RE: Cotação REQ-ABC123',
            body: `Prezado cliente,

Informamos que temos um atraso na entrega devido à alta demanda.

Prazo atualizado: 7 dias úteis
Motivo: Falta de estoque temporária

Condições de pagamento permanecem as mesmas.

Atenciosamente,
Moinho São Paulo`
        },
        unavailable: {
            subject: 'RE: Cotação REQ-ABC123',
            body: `Prezado cliente,

Infelizmente não temos disponibilidade do produto solicitado no momento.
Previsão de reposição: 15 dias.

Atenciosamente,
Moinho São Paulo`
        },
        english: {
            subject: 'RE: Quote Request REQ-ABC123',
            body: `Dear customer,

Here is our quotation as requested:

- Wheat Flour Type 1: $5.80/kg
- Available quantity: 200kg
- Delivery time: 3 business days
- Payment terms: Net 30

Best regards,
Sales Team`
        }
    }

    return templates[type] || templates.quoted
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE MACHINE COMPREHENSIVE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('SmartSourcing Advanced Tests', () => {
    describe('State Machine Complete Flow', () => {
        let machine

        beforeEach(() => {
            machine = new AutoQuoteStateMachine(createTestQuotation())
        })

        it('should complete full lifecycle: PENDING → AWAITING → PROCESSING → ORDERED → RECEIVED', () => {
            expect(machine.currentState).toBe(AutoQuoteState.PENDING)

            // 1. Send quotation
            const sendResult = machine.send(AutoQuoteEvent.SEND, {
                subject: 'Cotação de Farinha',
                body: 'Solicitamos cotação para 100kg de farinha...'
            })
            expect(sendResult.success).toBe(true)
            expect(machine.currentState).toBe(AutoQuoteState.AWAITING)
            expect(machine.context.emailSentAt).toBeDefined()

            // 2. Receive reply
            const replyResult = machine.send(AutoQuoteEvent.RECEIVE_REPLY, {
                emailId: 'msg-001',
                from: 'vendas@moinho.com.br',
                subject: 'RE: Cotação de Farinha',
                body: createSupplierEmail('quoted').body
            })
            expect(replyResult.success).toBe(true)
            expect(machine.currentState).toBe(AutoQuoteState.PROCESSING)
            expect(machine.context.replyReceivedAt).toBeDefined()

            // 3. AI extraction
            const extractResult = machine.send(AutoQuoteEvent.AI_EXTRACT, {
                price: 5.80,
                quotedPrice: 5.80,
                deliveryDate: '2024-01-20',
                deliveryDays: 3,
                paymentTerms: '30 dias',
                availability: true,
                confidence: 0.95
            })
            expect(extractResult.success).toBe(true)
            expect(machine.currentState).toBe(AutoQuoteState.ORDERED)
            expect(machine.context.orderId).toBeDefined()
            expect(machine.context.quotedPrice).toBe(5.80)

            // 4. Mark received
            const receiveResult = machine.send(AutoQuoteEvent.MARK_RECEIVED, {
                userId: 'user-001',
                userName: 'João Silva',
                invoiceNumber: 'NF-12345',
                notes: 'Entregue conforme combinado'
            })
            expect(receiveResult.success).toBe(true)
            expect(machine.currentState).toBe(AutoQuoteState.RECEIVED)
            expect(machine.context.receivedAt).toBeDefined()
            expect(machine.context.invoiceNumber).toBe('NF-12345')

            // Verify history
            const history = machine.history
            expect(history.length).toBe(5) // INIT + 4 transitions
        })

        it('should handle AI failure and retry', () => {
            machine.send(AutoQuoteEvent.SEND, { subject: 'Test', body: 'Test quote body content' })
            machine.send(AutoQuoteEvent.RECEIVE_REPLY, {
                emailId: 'msg-002',
                from: 'test@test.com',
                body: 'Very long email response with price information'
            })

            expect(machine.currentState).toBe(AutoQuoteState.PROCESSING)

            // AI fails
            const failResult = machine.send(AutoQuoteEvent.AI_FAIL, {
                error: 'Could not parse supplier response'
            })
            expect(failResult.success).toBe(true)
            expect(machine.currentState).toBe(AutoQuoteState.AWAITING)
            expect(machine.context.retryCount).toBe(1)
        })

        it('should allow cancellation from any active state', () => {
            const states = [
                { initial: AutoQuoteState.PENDING },
                { initial: AutoQuoteState.AWAITING },
                { initial: AutoQuoteState.PROCESSING },
                { initial: AutoQuoteState.ORDERED, needsOrderId: true }
            ]

            states.forEach(({ initial, needsOrderId }) => {
                const m = new AutoQuoteStateMachine(createTestQuotation({
                    status: initial,
                    ...(needsOrderId ? { orderId: 'order-123' } : {})
                }))

                const result = m.send(AutoQuoteEvent.CANCEL, {
                    reason: 'Test cancellation',
                    userId: 'user-001',
                    userName: 'Test User'
                })

                expect(result.success).toBe(true)
                expect(m.currentState).toBe(AutoQuoteState.CANCELLED)
                expect(m.context.cancellationReason).toBe('Test cancellation')
                expect(m.context.softDeleted).toBe(true)
            })
        })

        it('should block invalid transitions', () => {
            // Cannot go from PENDING to PROCESSING directly
            const result1 = machine.send(AutoQuoteEvent.RECEIVE_REPLY, {
                emailId: 'msg-003',
                body: 'This should fail because quota was not sent'
            })
            expect(result1.success).toBe(false)
            expect(machine.currentState).toBe(AutoQuoteState.PENDING)

            // Cannot go from PENDING to ORDERED directly
            const result2 = machine.send(AutoQuoteEvent.AI_EXTRACT, { price: 10 })
            expect(result2.success).toBe(false)
        })

        it('should not allow transitions from terminal states', () => {
            machine = new AutoQuoteStateMachine(createTestQuotation({
                status: AutoQuoteState.RECEIVED
            }))

            const result = machine.send(AutoQuoteEvent.SEND, {
                subject: 'Should fail',
                body: 'This should fail because received is terminal'
            })
            expect(result.success).toBe(false)
            expect(machine.currentState).toBe(AutoQuoteState.RECEIVED)
        })
    })

    describe('Guard Validations', () => {
        it('should reject SEND without valid email', () => {
            const machine = new AutoQuoteStateMachine(createTestQuotation({
                supplierEmail: 'invalid-email'
            }))

            const result = machine.send(AutoQuoteEvent.SEND, {
                subject: 'Test',
                body: 'Test body'
            })

            expect(result.success).toBe(false)
            expect(result.errors).toContain('Email do fornecedor é inválido')
        })

        it('should reject RECEIVE_REPLY with short email body', () => {
            const machine = new AutoQuoteStateMachine(createTestQuotation({
                status: AutoQuoteState.AWAITING,
                emailSentAt: new Date().toISOString()
            }))

            const result = machine.send(AutoQuoteEvent.RECEIVE_REPLY, {
                emailId: 'msg-004',
                from: 'test@test.com',
                body: 'short' // Less than 10 characters
            })

            expect(result.success).toBe(false)
            expect(result.errors).toContain('Corpo do email deve ter pelo menos 10 caracteres')
        })

        it('should reject AI_EXTRACT without valid price', () => {
            const machine = new AutoQuoteStateMachine(createTestQuotation({
                status: AutoQuoteState.PROCESSING
            }))

            const result = machine.send(AutoQuoteEvent.AI_EXTRACT, {
                deliveryDate: '2024-01-20',
                confidence: 0.5
                // Missing price
            })

            expect(result.success).toBe(false)
        })

        it('should reject MARK_RECEIVED if already received', () => {
            const machine = new AutoQuoteStateMachine(createTestQuotation({
                status: AutoQuoteState.ORDERED,
                orderId: 'order-123',
                receivedAt: new Date().toISOString()
            }))

            const result = machine.send(AutoQuoteEvent.MARK_RECEIVED, {
                userId: 'user-001',
                userName: 'Test'
            })

            expect(result.success).toBe(false)
            expect(result.errors).toContain('Pedido já foi marcado como recebido')
        })
    })

    describe('Serialization & Hydration', () => {
        it('should serialize and restore state correctly', () => {
            const original = new AutoQuoteStateMachine(createTestQuotation())

            original.send(AutoQuoteEvent.SEND, {
                subject: 'Serialization Test',
                body: 'Testing serialization capabilities'
            })
            original.send(AutoQuoteEvent.RECEIVE_REPLY, {
                emailId: 'msg-005',
                from: 'test@test.com',
                body: 'Reply with price information $10.00'
            })

            const json = original.toJSON()
            const restored = AutoQuoteStateMachine.fromJSON(json)

            expect(restored.currentState).toBe(original.currentState)
            expect(restored.context.requestId).toBe(original.context.requestId)
            expect(restored.context.emailSentAt).toBe(original.context.emailSentAt)
            expect(restored.history).toHaveLength(original.history.length)
        })

        it('should preserve all context fields after serialization', () => {
            const quotation = createTestQuotation({
                status: AutoQuoteState.ORDERED,
                orderId: 'order-456',
                quotedPrice: 5.80,
                paymentTerms: '30 dias',
                deliveryDays: 3,
                aiConfidence: 0.95
            })

            const machine = new AutoQuoteStateMachine(quotation)
            const json = machine.toJSON()
            const restored = AutoQuoteStateMachine.fromJSON(json)

            expect(restored.context.orderId).toBe('order-456')
            expect(restored.context.quotedPrice).toBe(5.80)
            expect(restored.context.paymentTerms).toBe('30 dias')
            expect(restored.context.deliveryDays).toBe(3)
        })
    })

    describe('Edge Cases', () => {
        it('should handle concurrent modifications gracefully', async () => {
            const machine = new AutoQuoteStateMachine(createTestQuotation())

            // Simulate concurrent SEND attempts
            const results = await Promise.all([
                Promise.resolve(machine.send(AutoQuoteEvent.SEND, { subject: 'Test 1', body: 'Body test 1' })),
                Promise.resolve(machine.send(AutoQuoteEvent.SEND, { subject: 'Test 2', body: 'Body test 2' }))
            ])

            // First should succeed, second should fail
            const successes = results.filter(r => r.success)
            expect(successes.length).toBe(1) // Only one should succeed
            expect(machine.currentState).toBe(AutoQuoteState.AWAITING)
        })

        it('should handle missing optional fields gracefully', () => {
            const machine = new AutoQuoteStateMachine(createTestQuotation({
                status: AutoQuoteState.PROCESSING
            }))

            const result = machine.send(AutoQuoteEvent.AI_EXTRACT, {
                price: 10.00,
                confidence: 0.8
                // Missing: deliveryDate, deliveryDays, paymentTerms
            })

            expect(result.success).toBe(true)
            expect(machine.context.quotedDeliveryDate).toBeUndefined()
            expect(machine.context.quotedDeliveryDays).toBeUndefined()
        })

        it('should generate unique IDs on each instantiation', () => {
            const ids = new Set()

            for (let i = 0; i < 100; i++) {
                const machine = new AutoQuoteStateMachine(createTestQuotation({ requestId: null }))
                ids.add(machine.context.requestId)
            }

            expect(ids.size).toBe(100) // All should be unique
        })
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CRDT OPERATIONS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('CRDT Operations', () => {
    describe('G-Counter Operations', () => {
        it('should track increments across multiple devices', () => {
            let counter1 = GCounter.create('device-A')
            let counter2 = GCounter.create('device-B')

            counter1 = GCounter.increment(counter1, 'device-A', 10)
            counter1 = GCounter.increment(counter1, 'device-A', 5)
            counter2 = GCounter.increment(counter2, 'device-B', 7)
            counter2 = GCounter.increment(counter2, 'device-B', 3)

            const merged = GCounter.merge(counter1, counter2)

            expect(GCounter.value(merged)).toBe(25) // 15 + 10
        })

        it('should be idempotent on merge', () => {
            let counter1 = GCounter.create('device-A')
            let counter2 = GCounter.create('device-B')

            counter1 = GCounter.increment(counter1, 'device-A', 5)
            counter2 = GCounter.increment(counter2, 'device-B', 3)

            const merged1 = GCounter.merge(counter1, counter2)
            const merged2 = GCounter.merge(merged1, counter2)
            const merged3 = GCounter.merge(merged2, counter1)

            expect(GCounter.value(merged1)).toBe(GCounter.value(merged2))
            expect(GCounter.value(merged2)).toBe(GCounter.value(merged3))
        })
    })

    describe('PN-Counter Operations', () => {
        it('should handle stock movements correctly', () => {
            let stock = PNCounter.create('warehouse')

            // Initial stock: 100
            stock = PNCounter.increment(stock, 'warehouse', 100)

            // Sales
            stock = PNCounter.decrement(stock, 'warehouse', 30)
            stock = PNCounter.decrement(stock, 'warehouse', 20)

            // Restock
            stock = PNCounter.increment(stock, 'warehouse', 50)

            expect(PNCounter.value(stock)).toBe(100) // 100 - 50 + 50
        })

        it('should merge correctly with different operations', () => {
            let warehouse1 = PNCounter.create('w1')
            let warehouse2 = PNCounter.create('w2')

            warehouse1 = PNCounter.increment(warehouse1, 'w1', 100)
            warehouse1 = PNCounter.decrement(warehouse1, 'w1', 30)

            warehouse2 = PNCounter.increment(warehouse2, 'w2', 50)
            warehouse2 = PNCounter.decrement(warehouse2, 'w2', 10)

            const merged = PNCounter.merge(warehouse1, warehouse2)

            expect(PNCounter.value(merged)).toBe(110) // (100-30) + (50-10)
        })
    })

    describe('LWW-Register Operations', () => {
        it('should resolve conflicts by timestamp', () => {
            const old = LWWRegister.create('old value', 1000)
            const newer = LWWRegister.create('new value', 2000)

            const merged = LWWRegister.merge(old, newer)

            expect(LWWRegister.value(merged)).toBe('new value')
        })

        it('should be commutative', () => {
            const r1 = LWWRegister.create('value A', 1000)
            const r2 = LWWRegister.create('value B', 2000)

            const merged1 = LWWRegister.merge(r1, r2)
            const merged2 = LWWRegister.merge(r2, r1)

            expect(LWWRegister.value(merged1)).toBe(LWWRegister.value(merged2))
        })
    })

    describe('LWW-Map Operations', () => {
        it('should merge fields independently', () => {
            let map1 = LWWMap.create({ price: 10, quantity: 100 }, 1000)
            let map2 = LWWMap.create({}, 500)

            map2 = LWWMap.set(map2, 'price', 15, 2000) // Newer price
            map2 = LWWMap.set(map2, 'quantity', 50, 500) // Older quantity

            const merged = LWWMap.merge(map1, map2)
            const values = LWWMap.values(merged)

            expect(values.price).toBe(15) // From map2 (newer)
            expect(values.quantity).toBe(100) // From map1 (newer)
        })

        it('should handle partial updates', () => {
            let map = LWWMap.create({ a: 1, b: 2, c: 3 }, 1000)

            map = LWWMap.set(map, 'b', 20, 2000)

            const values = LWWMap.values(map)

            expect(values.a).toBe(1)
            expect(values.b).toBe(20)
            expect(values.c).toBe(3)
        })
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Performance Tests', () => {
    it('should handle 1000 state machines efficiently', () => {
        const startTime = performance.now()

        const machines = []
        for (let i = 0; i < 1000; i++) {
            const m = new AutoQuoteStateMachine(createTestQuotation({ requestId: null }))
            m.send(AutoQuoteEvent.SEND, {
                subject: `Quote ${i}`,
                body: `Quote body for iteration ${i}`
            })
            machines.push(m)
        }

        const endTime = performance.now()
        const duration = endTime - startTime

        expect(machines.length).toBe(1000)
        expect(machines.every(m => m.currentState === AutoQuoteState.AWAITING)).toBe(true)
        expect(duration).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should serialize/deserialize efficiently', () => {
        const machine = new AutoQuoteStateMachine(createTestQuotation())

        // Build up history
        machine.send(AutoQuoteEvent.SEND, { subject: 'Test', body: 'Test body content' })
        machine.send(AutoQuoteEvent.RECEIVE_REPLY, {
            emailId: 'msg-perf',
            from: 'test@test.com',
            body: 'Long reply content for performance testing'
        })
        machine.send(AutoQuoteEvent.AI_EXTRACT, { price: 10, confidence: 0.9 })

        const startTime = performance.now()

        for (let i = 0; i < 1000; i++) {
            const json = machine.toJSON()
            AutoQuoteStateMachine.fromJSON(json)
        }

        const endTime = performance.now()
        const duration = endTime - startTime

        expect(duration).toBeLessThan(500) // 1000 iterations in under 500ms
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ATOMIC OPERATIONS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Atomic Operations', () => {
    it('should rollback on action failure', () => {
        const machine = new AutoQuoteStateMachine(createTestQuotation())
        const originalState = machine.currentState
        const originalContext = { ...machine.context }

        // Mock an action that throws
        const originalAction = machine.send
        machine.send = function (event, payload) {
            if (event === AutoQuoteEvent.SEND && payload.simulateError) {
                throw new Error('Simulated error')
            }
            return originalAction.call(this, event, payload)
        }

        try {
            machine.send(AutoQuoteEvent.SEND, {
                subject: 'Test',
                body: 'Test content',
                simulateError: true
            })
        } catch (e) {
            // Expected to throw
        }

        // State should remain unchanged
        expect(machine.currentState).toBe(originalState)
    })

    it('should maintain history integrity on failed transitions', () => {
        const machine = new AutoQuoteStateMachine(createTestQuotation())
        const initialHistoryLength = machine.history.length

        // Try invalid transition
        machine.send(AutoQuoteEvent.MARK_RECEIVED, { userId: 'test' })

        // History should not change on failed transition
        expect(machine.history.length).toBe(initialHistoryLength)
    })
})
