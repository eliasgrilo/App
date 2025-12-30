/**
 * Quotation State Machine - Apple-Quality State Management
 * 
 * Implements XState-inspired state machine without external dependency.
 * Provides validated transitions, guards, actions, and event sourcing.
 * 
 * Flow: draft → sent → replied → quoted → confirmed → delivered
 *                       ↓                      ↓
 *                    cancelled              cancelled
 */

// ═══════════════════════════════════════════════════════════════════════════
// STATES - All possible quotation states
// ═══════════════════════════════════════════════════════════════════════════

export const QuotationState = Object.freeze({
    DRAFT: 'draft',           // Created, not yet sent
    SENT: 'sent',             // Email sent, awaiting response
    REPLIED: 'replied',       // Supplier replied, needs analysis
    QUOTED: 'quoted',         // AI analyzed, prices extracted
    CONFIRMED: 'confirmed',   // Order confirmed by user
    DELIVERED: 'delivered',   // Goods received
    CANCELLED: 'cancelled',   // Cancelled at any point
    EXPIRED: 'expired'        // No response within timeout
})

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS - All possible transition triggers
// ═══════════════════════════════════════════════════════════════════════════

export const QuotationEvent = Object.freeze({
    SEND: 'SEND',
    RECEIVE_REPLY: 'RECEIVE_REPLY',
    ANALYZE: 'ANALYZE',
    CONFIRM: 'CONFIRM',
    DELIVER: 'DELIVER',
    CANCEL: 'CANCEL',
    EXPIRE: 'EXPIRE',
    RESET: 'RESET'
})

// ═══════════════════════════════════════════════════════════════════════════
// TRANSITION RULES - Valid state transitions with guards
// ═══════════════════════════════════════════════════════════════════════════

const transitions = {
    [QuotationState.DRAFT]: {
        [QuotationEvent.SEND]: {
            target: QuotationState.SENT,
            guard: (context) => context.supplierEmail && context.items?.length > 0,
            errorMessage: 'Email do fornecedor e itens são obrigatórios para enviar'
        },
        [QuotationEvent.CANCEL]: {
            target: QuotationState.CANCELLED
        }
    },
    [QuotationState.SENT]: {
        [QuotationEvent.RECEIVE_REPLY]: {
            target: QuotationState.REPLIED,
            guard: (context, payload) => !!payload?.emailBody,
            errorMessage: 'Corpo do email é obrigatório'
        },
        [QuotationEvent.EXPIRE]: {
            target: QuotationState.EXPIRED,
            guard: (context) => {
                const sentAt = new Date(context.sentAt)
                const daysSinceSent = (Date.now() - sentAt.getTime()) / (1000 * 60 * 60 * 24)
                return daysSinceSent >= 7 // Expire after 7 days
            }
        },
        [QuotationEvent.CANCEL]: {
            target: QuotationState.CANCELLED
        }
    },
    [QuotationState.REPLIED]: {
        [QuotationEvent.ANALYZE]: {
            target: QuotationState.QUOTED,
            guard: (context, payload) => payload?.quotedItems?.length > 0,
            errorMessage: 'Nenhum item cotado encontrado na análise'
        },
        [QuotationEvent.CANCEL]: {
            target: QuotationState.CANCELLED
        }
    },
    [QuotationState.QUOTED]: {
        [QuotationEvent.CONFIRM]: {
            target: QuotationState.CONFIRMED,
            guard: (context) => context.quotedTotal > 0,
            errorMessage: 'Cotação precisa ter valor total para confirmar'
        },
        [QuotationEvent.CANCEL]: {
            target: QuotationState.CANCELLED
        }
    },
    [QuotationState.CONFIRMED]: {
        [QuotationEvent.DELIVER]: {
            target: QuotationState.DELIVERED
        },
        [QuotationEvent.CANCEL]: {
            target: QuotationState.CANCELLED,
            guard: (context) => {
                const confirmedAt = new Date(context.confirmedAt)
                const hoursSinceConfirm = (Date.now() - confirmedAt.getTime()) / (1000 * 60 * 60)
                return hoursSinceConfirm < 24 // Can only cancel within 24h
            },
            errorMessage: 'Pedidos confirmados há mais de 24h não podem ser cancelados'
        }
    },
    [QuotationState.DELIVERED]: {
        // Final state - no transitions
    },
    [QuotationState.CANCELLED]: {
        [QuotationEvent.RESET]: {
            target: QuotationState.DRAFT
        }
    },
    [QuotationState.EXPIRED]: {
        [QuotationEvent.RESET]: {
            target: QuotationState.DRAFT
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIONS - Side effects triggered by transitions
// ═══════════════════════════════════════════════════════════════════════════

const actions = {
    [QuotationEvent.SEND]: (context, payload) => ({
        ...context,
        sentAt: new Date().toISOString(),
        emailSubject: payload?.subject,
        emailBody: payload?.body
    }),
    [QuotationEvent.RECEIVE_REPLY]: (context, payload) => ({
        ...context,
        repliedAt: new Date().toISOString(),
        replyBody: payload?.emailBody,
        replyFrom: payload?.from
    }),
    [QuotationEvent.ANALYZE]: (context, payload) => ({
        ...context,
        analyzedAt: new Date().toISOString(),
        quotedItems: payload?.quotedItems,
        quotedTotal: payload?.quotedItems?.reduce((sum, item) =>
            sum + (item.quantity * item.unitPrice), 0) || 0,
        deliveryDate: payload?.deliveryDate,
        paymentTerms: payload?.paymentTerms,
        aiConfidence: payload?.confidence
    }),
    [QuotationEvent.CONFIRM]: (context) => ({
        ...context,
        confirmedAt: new Date().toISOString()
    }),
    [QuotationEvent.DELIVER]: (context, payload) => ({
        ...context,
        deliveredAt: new Date().toISOString(),
        deliveryNotes: payload?.notes,
        invoiceNumber: payload?.invoiceNumber
    }),
    [QuotationEvent.CANCEL]: (context, payload) => ({
        ...context,
        cancelledAt: new Date().toISOString(),
        cancellationReason: payload?.reason || 'Cancelled by user'
    }),
    [QuotationEvent.RESET]: (context) => ({
        ...context,
        sentAt: null,
        repliedAt: null,
        analyzedAt: null,
        confirmedAt: null,
        deliveredAt: null,
        cancelledAt: null,
        quotedTotal: null
    })
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE MACHINE CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class QuotationMachine {
    constructor(initialContext = {}) {
        this.state = initialContext.status || QuotationState.DRAFT
        this.context = {
            id: initialContext.id || `quot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            supplierId: initialContext.supplierId,
            supplierName: initialContext.supplierName,
            supplierEmail: initialContext.supplierEmail,
            items: initialContext.items || [],
            createdAt: initialContext.createdAt || new Date().toISOString(),
            ...initialContext
        }
        this.history = initialContext.history || [{
            state: this.state,
            timestamp: new Date().toISOString(),
            event: 'INIT'
        }]
        this.listeners = new Set()
    }

    /**
     * Get current state and context
     */
    getSnapshot() {
        return {
            state: this.state,
            context: { ...this.context },
            history: [...this.history],
            canTransition: this.getAvailableEvents()
        }
    }

    /**
     * Get available events from current state
     */
    getAvailableEvents() {
        const stateTransitions = transitions[this.state] || {}
        return Object.keys(stateTransitions)
    }

    /**
     * Check if a transition is valid
     */
    canTransition(event, payload = {}) {
        const stateTransitions = transitions[this.state]
        if (!stateTransitions) return { valid: false, error: 'Estado atual não permite transições' }

        const transition = stateTransitions[event]
        if (!transition) return { valid: false, error: `Evento '${event}' não é válido no estado '${this.state}'` }

        if (transition.guard && !transition.guard(this.context, payload)) {
            return { valid: false, error: transition.errorMessage || 'Condição de transição não satisfeita' }
        }

        return { valid: true, target: transition.target }
    }

    /**
     * Attempt a state transition
     * @returns {{ success: boolean, error?: string, snapshot: Object }}
     */
    send(event, payload = {}) {
        const validation = this.canTransition(event, payload)

        if (!validation.valid) {
            console.warn(`⚠️ Invalid transition: ${this.state} + ${event}:`, validation.error)
            return {
                success: false,
                error: validation.error,
                snapshot: this.getSnapshot()
            }
        }

        const previousState = this.state
        const action = actions[event]

        // Update state
        this.state = validation.target

        // Execute action if exists
        if (action) {
            this.context = action(this.context, payload)
        }

        // Update context status
        this.context.status = this.state
        this.context.updatedAt = new Date().toISOString()

        // Record in history (event sourcing)
        this.history.push({
            previousState,
            state: this.state,
            event,
            timestamp: new Date().toISOString(),
            payload: { ...payload, items: undefined } // Don't duplicate items in history
        })

        console.log(`✅ Transition: ${previousState} → ${this.state} (${event})`)

        // Notify listeners
        this.notifyListeners()

        return {
            success: true,
            snapshot: this.getSnapshot()
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    /**
     * Notify all listeners of state change
     */
    notifyListeners() {
        const snapshot = this.getSnapshot()
        this.listeners.forEach(listener => listener(snapshot))
    }

    /**
     * Serialize for storage
     */
    toJSON() {
        return {
            ...this.context,
            status: this.state,
            history: this.history
        }
    }

    /**
     * Create from stored data
     */
    static fromJSON(data) {
        const machine = new QuotationMachine(data)
        machine.state = data.status || QuotationState.DRAFT
        machine.history = data.history || []
        return machine
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE COLORS & LABELS (for UI)
// ═══════════════════════════════════════════════════════════════════════════

export const StateConfig = {
    [QuotationState.DRAFT]: {
        label: 'Rascunho',
        color: 'zinc',
        icon: '📝',
        bgClass: 'bg-zinc-100 dark:bg-zinc-800',
        textClass: 'text-zinc-600 dark:text-zinc-400',
        borderClass: 'border-zinc-200 dark:border-zinc-700'
    },
    [QuotationState.SENT]: {
        label: 'Enviado',
        color: 'amber',
        icon: '📤',
        bgClass: 'bg-amber-50 dark:bg-amber-500/10',
        textClass: 'text-amber-600 dark:text-amber-400',
        borderClass: 'border-amber-200 dark:border-amber-500/20'
    },
    [QuotationState.REPLIED]: {
        label: 'Resposta Recebida',
        color: 'blue',
        icon: '📥',
        bgClass: 'bg-blue-50 dark:bg-blue-500/10',
        textClass: 'text-blue-600 dark:text-blue-400',
        borderClass: 'border-blue-200 dark:border-blue-500/20'
    },
    [QuotationState.QUOTED]: {
        label: 'Cotado',
        color: 'violet',
        icon: '💰',
        bgClass: 'bg-violet-50 dark:bg-violet-500/10',
        textClass: 'text-violet-600 dark:text-violet-400',
        borderClass: 'border-violet-200 dark:border-violet-500/20'
    },
    [QuotationState.CONFIRMED]: {
        label: 'Confirmado',
        color: 'indigo',
        icon: '✅',
        bgClass: 'bg-indigo-50 dark:bg-indigo-500/10',
        textClass: 'text-indigo-600 dark:text-indigo-400',
        borderClass: 'border-indigo-200 dark:border-indigo-500/20'
    },
    [QuotationState.DELIVERED]: {
        label: 'Entregue',
        color: 'emerald',
        icon: '📦',
        bgClass: 'bg-emerald-50 dark:bg-emerald-500/10',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        borderClass: 'border-emerald-200 dark:border-emerald-500/20'
    },
    [QuotationState.CANCELLED]: {
        label: 'Cancelado',
        color: 'rose',
        icon: '❌',
        bgClass: 'bg-rose-50 dark:bg-rose-500/10',
        textClass: 'text-rose-600 dark:text-rose-400',
        borderClass: 'border-rose-200 dark:border-rose-500/20'
    },
    [QuotationState.EXPIRED]: {
        label: 'Expirado',
        color: 'gray',
        icon: '⏰',
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        textClass: 'text-gray-500 dark:text-gray-500',
        borderClass: 'border-gray-200 dark:border-gray-700'
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if state is a final state (no more transitions possible)
 */
export const isFinalState = (state) => {
    return [QuotationState.DELIVERED, QuotationState.CANCELLED, QuotationState.EXPIRED].includes(state)
}

/**
 * Check if state is active (in progress)
 */
export const isActiveState = (state) => {
    return [QuotationState.SENT, QuotationState.REPLIED, QuotationState.QUOTED, QuotationState.CONFIRMED].includes(state)
}

/**
 * Get progress percentage based on state
 */
export const getStateProgress = (state) => {
    const progressMap = {
        [QuotationState.DRAFT]: 0,
        [QuotationState.SENT]: 20,
        [QuotationState.REPLIED]: 40,
        [QuotationState.QUOTED]: 60,
        [QuotationState.CONFIRMED]: 80,
        [QuotationState.DELIVERED]: 100,
        [QuotationState.CANCELLED]: 0,
        [QuotationState.EXPIRED]: 0
    }
    return progressMap[state] || 0
}

export default QuotationMachine
