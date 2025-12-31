/**
 * Quotation Domain Types - Enterprise TypeScript
 * 
 * Strict types for quotation state management with XState V5
 * Apple-quality type safety for predictable state transitions
 */

// ═══════════════════════════════════════════════════════════════════════════
// QUOTATION STATES - Explicit Finite States
// ═══════════════════════════════════════════════════════════════════════════

export const QuotationStateEnum = {
    IDLE: 'idle',
    DRAFT: 'draft',
    SENDING: 'sending',
    SENT: 'sent',
    WAITING_REPLY: 'waitingReply',
    REPLIED: 'replied',
    ANALYZING: 'analyzing',
    QUOTED: 'quoted',
    CONFIRMING: 'confirming',
    CONFIRMED: 'confirmed',
    DELIVERING: 'delivering',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    ERROR: 'error'
} as const;

export type QuotationState = typeof QuotationStateEnum[keyof typeof QuotationStateEnum];

// ═══════════════════════════════════════════════════════════════════════════
// QUOTATION EVENTS - Discriminated Union for Type Safety
// ═══════════════════════════════════════════════════════════════════════════

export type QuotationEvent =
    | { type: 'CREATE_DRAFT'; payload: CreateDraftPayload }
    | { type: 'SEND'; payload?: SendPayload }
    | { type: 'SEND_SUCCESS'; payload: SendSuccessPayload }
    | { type: 'SEND_ERROR'; payload: ErrorPayload }
    | { type: 'RECEIVE_REPLY'; payload: ReplyPayload }
    | { type: 'ANALYZE' }
    | { type: 'ANALYSIS_SUCCESS'; payload: AnalysisPayload }
    | { type: 'ANALYSIS_ERROR'; payload: ErrorPayload }
    | { type: 'CONFIRM' }
    | { type: 'CONFIRM_SUCCESS' }
    | { type: 'CONFIRM_ERROR'; payload: ErrorPayload }
    | { type: 'DELIVER'; payload?: DeliverPayload }
    | { type: 'DELIVER_SUCCESS' }
    | { type: 'CANCEL'; payload?: CancelPayload }
    | { type: 'EXPIRE' }
    | { type: 'RESET' }
    | { type: 'RETRY' };

// ═══════════════════════════════════════════════════════════════════════════
// EVENT PAYLOADS
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateDraftPayload {
    supplierId: string;
    supplierName: string;
    supplierEmail: string;
    items: QuotationItem[];
}

export interface SendPayload {
    subject?: string;
    body?: string;
    cc?: string[];
}

export interface SendSuccessPayload {
    messageId: string;
    sentAt: string;
}

export interface ReplyPayload {
    emailBody: string;
    from: string;
    receivedAt: string;
    attachments?: Attachment[];
}

export interface AnalysisPayload {
    quotedItems: QuotedItem[];
    deliveryDate?: string;
    paymentTerms?: string;
    confidence: number;
}

export interface DeliverPayload {
    invoiceNumber?: string;
    notes?: string;
    actualDeliveryDate?: string;
}

export interface CancelPayload {
    reason: string;
    cancelledBy?: string;
}

export interface ErrorPayload {
    code: string;
    message: string;
    retryable: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTATION CONTEXT - Machine State Data
// ═══════════════════════════════════════════════════════════════════════════

export interface QuotationContext {
    // Identity
    id: string;
    createdAt: string;
    updatedAt: string;

    // Supplier
    supplierId: string;
    supplierName: string;
    supplierEmail: string;

    // Items
    items: QuotationItem[];
    quotedItems: QuotedItem[];
    quotedTotal: number;

    // Email
    emailSubject?: string;
    emailBody?: string;
    messageId?: string;
    replyBody?: string;
    replyFrom?: string;

    // Timeline
    sentAt?: string;
    repliedAt?: string;
    analyzedAt?: string;
    confirmedAt?: string;
    deliveredAt?: string;
    cancelledAt?: string;
    expiresAt?: string;

    // Delivery
    deliveryDate?: string;
    paymentTerms?: string;
    invoiceNumber?: string;
    deliveryNotes?: string;

    // AI
    aiConfidence?: number;

    // Cancellation
    cancellationReason?: string;

    // Error handling
    error?: ErrorPayload;
    retryCount: number;

    // Optimistic UI
    _pending?: boolean;
    _previousState?: QuotationState;

    // Event history
    history: HistoryEntry[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface QuotationItem {
    id: string;
    name: string;
    category?: string;
    quantityToOrder: number;
    unit: string;
    currentPrice?: number;
}

export interface QuotedItem extends QuotationItem {
    unitPrice: number;
    totalPrice: number;
    priceChange?: number; // Percentage vs current price
}

export interface Attachment {
    filename: string;
    mimeType: string;
    size: number;
    url?: string;
}

export interface HistoryEntry {
    previousState: QuotationState;
    state: QuotationState;
    event: string;
    timestamp: string;
    payload?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION TYPES - TanStack Query
// ═══════════════════════════════════════════════════════════════════════════

export interface TransitionVariables {
    quotationId: string;
    event: QuotationEvent;
}

export interface MutationResult {
    success: boolean;
    quotation?: QuotationContext;
    error?: ErrorPayload;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE CONFIGURATION - UI Metadata
// ═══════════════════════════════════════════════════════════════════════════

export interface StateUIConfig {
    label: string;
    color: string;
    icon: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    hapticType: HapticType;
}

export type HapticType =
    | 'success'
    | 'warning'
    | 'error'
    | 'selection'
    | 'impactLight'
    | 'impactMedium'
    | 'impactHeavy'
    | 'approval'
    | 'notification';

export const STATE_UI_CONFIG: Record<QuotationState, StateUIConfig> = {
    [QuotationStateEnum.IDLE]: {
        label: 'Início',
        color: 'zinc',
        icon: '⚪',
        bgClass: 'bg-zinc-100 dark:bg-zinc-800',
        textClass: 'text-zinc-600 dark:text-zinc-400',
        borderClass: 'border-zinc-200 dark:border-zinc-700',
        hapticType: 'selection'
    },
    [QuotationStateEnum.DRAFT]: {
        label: 'Rascunho',
        color: 'zinc',
        icon: '📝',
        bgClass: 'bg-zinc-100 dark:bg-zinc-800',
        textClass: 'text-zinc-600 dark:text-zinc-400',
        borderClass: 'border-zinc-200 dark:border-zinc-700',
        hapticType: 'selection'
    },
    [QuotationStateEnum.SENDING]: {
        label: 'Enviando...',
        color: 'amber',
        icon: '⏳',
        bgClass: 'bg-amber-50 dark:bg-amber-500/10',
        textClass: 'text-amber-600 dark:text-amber-400',
        borderClass: 'border-amber-200 dark:border-amber-500/20',
        hapticType: 'impactLight'
    },
    [QuotationStateEnum.SENT]: {
        label: 'Enviado',
        color: 'amber',
        icon: '📤',
        bgClass: 'bg-amber-50 dark:bg-amber-500/10',
        textClass: 'text-amber-600 dark:text-amber-400',
        borderClass: 'border-amber-200 dark:border-amber-500/20',
        hapticType: 'impactMedium'
    },
    [QuotationStateEnum.WAITING_REPLY]: {
        label: 'Aguardando Resposta',
        color: 'sky',
        icon: '⏰',
        bgClass: 'bg-sky-50 dark:bg-sky-500/10',
        textClass: 'text-sky-600 dark:text-sky-400',
        borderClass: 'border-sky-200 dark:border-sky-500/20',
        hapticType: 'selection'
    },
    [QuotationStateEnum.REPLIED]: {
        label: 'Resposta Recebida',
        color: 'blue',
        icon: '📥',
        bgClass: 'bg-blue-50 dark:bg-blue-500/10',
        textClass: 'text-blue-600 dark:text-blue-400',
        borderClass: 'border-blue-200 dark:border-blue-500/20',
        hapticType: 'notification'
    },
    [QuotationStateEnum.ANALYZING]: {
        label: 'Analisando...',
        color: 'violet',
        icon: '🤖',
        bgClass: 'bg-violet-50 dark:bg-violet-500/10',
        textClass: 'text-violet-600 dark:text-violet-400',
        borderClass: 'border-violet-200 dark:border-violet-500/20',
        hapticType: 'impactLight'
    },
    [QuotationStateEnum.QUOTED]: {
        label: 'Cotado',
        color: 'violet',
        icon: '💰',
        bgClass: 'bg-violet-50 dark:bg-violet-500/10',
        textClass: 'text-violet-600 dark:text-violet-400',
        borderClass: 'border-violet-200 dark:border-violet-500/20',
        hapticType: 'success'
    },
    [QuotationStateEnum.CONFIRMING]: {
        label: 'Confirmando...',
        color: 'indigo',
        icon: '⏳',
        bgClass: 'bg-indigo-50 dark:bg-indigo-500/10',
        textClass: 'text-indigo-600 dark:text-indigo-400',
        borderClass: 'border-indigo-200 dark:border-indigo-500/20',
        hapticType: 'impactMedium'
    },
    [QuotationStateEnum.CONFIRMED]: {
        label: 'Confirmado',
        color: 'indigo',
        icon: '✅',
        bgClass: 'bg-indigo-50 dark:bg-indigo-500/10',
        textClass: 'text-indigo-600 dark:text-indigo-400',
        borderClass: 'border-indigo-200 dark:border-indigo-500/20',
        hapticType: 'approval'
    },
    [QuotationStateEnum.DELIVERING]: {
        label: 'Em Entrega',
        color: 'teal',
        icon: '🚚',
        bgClass: 'bg-teal-50 dark:bg-teal-500/10',
        textClass: 'text-teal-600 dark:text-teal-400',
        borderClass: 'border-teal-200 dark:border-teal-500/20',
        hapticType: 'impactLight'
    },
    [QuotationStateEnum.DELIVERED]: {
        label: 'Entregue',
        color: 'emerald',
        icon: '📦',
        bgClass: 'bg-emerald-50 dark:bg-emerald-500/10',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        borderClass: 'border-emerald-200 dark:border-emerald-500/20',
        hapticType: 'success'
    },
    [QuotationStateEnum.CANCELLED]: {
        label: 'Cancelado',
        color: 'rose',
        icon: '❌',
        bgClass: 'bg-rose-50 dark:bg-rose-500/10',
        textClass: 'text-rose-600 dark:text-rose-400',
        borderClass: 'border-rose-200 dark:border-rose-500/20',
        hapticType: 'warning'
    },
    [QuotationStateEnum.EXPIRED]: {
        label: 'Expirado',
        color: 'gray',
        icon: '⏰',
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        textClass: 'text-gray-500 dark:text-gray-500',
        borderClass: 'border-gray-200 dark:border-gray-700',
        hapticType: 'warning'
    },
    [QuotationStateEnum.ERROR]: {
        label: 'Erro',
        color: 'red',
        icon: '⚠️',
        bgClass: 'bg-red-50 dark:bg-red-500/10',
        textClass: 'text-red-600 dark:text-red-400',
        borderClass: 'border-red-200 dark:border-red-500/20',
        hapticType: 'error'
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type FinalState =
    | typeof QuotationStateEnum.DELIVERED
    | typeof QuotationStateEnum.CANCELLED
    | typeof QuotationStateEnum.EXPIRED;

export type ActiveState = Exclude<QuotationState, FinalState | typeof QuotationStateEnum.IDLE>;

export const isFinalState = (state: QuotationState): state is FinalState => {
    return [
        QuotationStateEnum.DELIVERED,
        QuotationStateEnum.CANCELLED,
        QuotationStateEnum.EXPIRED
    ].includes(state as FinalState);
};

export const isActiveState = (state: QuotationState): state is ActiveState => {
    return !isFinalState(state) && state !== QuotationStateEnum.IDLE;
};

// State progress for progress bars
export const STATE_PROGRESS: Record<QuotationState, number> = {
    [QuotationStateEnum.IDLE]: 0,
    [QuotationStateEnum.DRAFT]: 5,
    [QuotationStateEnum.SENDING]: 15,
    [QuotationStateEnum.SENT]: 20,
    [QuotationStateEnum.WAITING_REPLY]: 30,
    [QuotationStateEnum.REPLIED]: 40,
    [QuotationStateEnum.ANALYZING]: 50,
    [QuotationStateEnum.QUOTED]: 60,
    [QuotationStateEnum.CONFIRMING]: 70,
    [QuotationStateEnum.CONFIRMED]: 80,
    [QuotationStateEnum.DELIVERING]: 90,
    [QuotationStateEnum.DELIVERED]: 100,
    [QuotationStateEnum.CANCELLED]: 0,
    [QuotationStateEnum.EXPIRED]: 0,
    [QuotationStateEnum.ERROR]: 0
};
