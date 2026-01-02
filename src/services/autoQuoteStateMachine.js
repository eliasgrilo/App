/**
 * Auto Quote State Machine
 * Full implementation with class-based API for tests
 */

// ═══════════════════════════════════════════════════════════════════════════════
// STATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const AutoQuoteState = {
    PENDING: 'pending',
    AWAITING: 'awaiting',
    PROCESSING: 'processing',
    ORDERED: 'ordered',
    RECEIVED: 'received',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired'
};

export const AutoQuoteEvent = {
    SEND: 'SEND',
    RECEIVE_REPLY: 'RECEIVE_REPLY',
    AI_EXTRACT: 'AI_EXTRACT',
    AI_FAIL: 'AI_FAIL',
    MARK_RECEIVED: 'MARK_RECEIVED',
    CANCEL: 'CANCEL',
    EXPIRE: 'EXPIRE'
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE MACHINE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class AutoQuoteStateMachine {
    constructor(quotation) {
        this.context = {
            ...quotation,
            requestId: quotation.requestId || `REQ-${Date.now().toString(36).toUpperCase()}`
        };
        this.currentState = quotation.status || AutoQuoteState.PENDING;
        this.history = [{ state: this.currentState, timestamp: new Date().toISOString(), action: 'INIT' }];
    }

    send(event, payload = {}) {
        const transitions = {
            [AutoQuoteState.PENDING]: {
                [AutoQuoteEvent.SEND]: AutoQuoteState.AWAITING,
                [AutoQuoteEvent.CANCEL]: AutoQuoteState.CANCELLED
            },
            [AutoQuoteState.AWAITING]: {
                [AutoQuoteEvent.RECEIVE_REPLY]: AutoQuoteState.PROCESSING,
                [AutoQuoteEvent.SEND]: AutoQuoteState.AWAITING,
                [AutoQuoteEvent.CANCEL]: AutoQuoteState.CANCELLED,
                [AutoQuoteEvent.EXPIRE]: AutoQuoteState.EXPIRED
            },
            [AutoQuoteState.PROCESSING]: {
                [AutoQuoteEvent.AI_EXTRACT]: AutoQuoteState.ORDERED,
                [AutoQuoteEvent.AI_FAIL]: AutoQuoteState.AWAITING,
                [AutoQuoteEvent.CANCEL]: AutoQuoteState.CANCELLED
            },
            [AutoQuoteState.ORDERED]: {
                [AutoQuoteEvent.MARK_RECEIVED]: AutoQuoteState.RECEIVED,
                [AutoQuoteEvent.CANCEL]: AutoQuoteState.CANCELLED
            }
        };

        const stateTransitions = transitions[this.currentState];
        if (!stateTransitions || !stateTransitions[event]) {
            return { success: false, errors: [`Transição inválida: ${this.currentState} → ${event}`] };
        }

        // Validations
        if (event === AutoQuoteEvent.SEND) {
            if (this.context.supplierEmail && !this.context.supplierEmail.includes('@')) {
                return { success: false, errors: ['Email do fornecedor é inválido'] };
            }
            this.context.emailSentAt = new Date().toISOString();
        }

        if (event === AutoQuoteEvent.RECEIVE_REPLY) {
            if (!this.context.emailSentAt) {
                return { success: false, errors: ['Email não foi enviado ainda'] };
            }
            if (!payload.body || payload.body.length < 10) {
                return { success: false, errors: ['Corpo do email deve ter pelo menos 10 caracteres'] };
            }
            this.context.replyReceivedAt = new Date().toISOString();
        }

        if (event === AutoQuoteEvent.AI_EXTRACT) {
            if (!payload.price && payload.price !== 0) {
                return { success: false, errors: ['Preço é obrigatório'] };
            }
            this.context.quotedPrice = payload.price;
            this.context.quotedDeliveryDate = payload.deliveryDate;
            this.context.quotedDeliveryDays = payload.deliveryDays;
            this.context.paymentTerms = payload.paymentTerms;
            this.context.aiConfidence = payload.confidence;
            this.context.orderId = `order_${Date.now()}`;
        }

        if (event === AutoQuoteEvent.AI_FAIL) {
            this.context.retryCount = (this.context.retryCount || 0) + 1;
        }

        if (event === AutoQuoteEvent.MARK_RECEIVED) {
            if (this.context.receivedAt) {
                return { success: false, errors: ['Pedido já foi marcado como recebido'] };
            }
            this.context.receivedAt = new Date().toISOString();
            this.context.invoiceNumber = payload.invoiceNumber;
        }

        if (event === AutoQuoteEvent.CANCEL) {
            this.context.cancellationReason = payload.reason;
            this.context.softDeleted = true;
        }

        const newState = stateTransitions[event];
        this.currentState = newState;
        this.history.push({
            state: newState,
            event,
            timestamp: new Date().toISOString(),
            payload
        });

        return { success: true, state: newState };
    }

    toJSON() {
        return {
            context: this.context,
            currentState: this.currentState,
            history: this.history
        };
    }

    static fromJSON(json) {
        const machine = new AutoQuoteStateMachine(json.context);
        machine.currentState = json.currentState;
        machine.history = json.history;
        return machine;
    }
}

export default AutoQuoteStateMachine;
