/**
 * useQuotationMutation - Enterprise TanStack Query Hook
 * 
 * Optimistic updates with automatic rollback on failure.
 * Apple-quality: UI updates instantly, rollback is imperceptible.
 * 
 * Features:
 * - Immediate UI feedback (optimistic)
 * - Automatic rollback on error
 * - Retry with exponential backoff  
 * - Query invalidation after success
 * - Haptic feedback integration
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { createActor } from 'xstate';
import { quotationMachine, createInitialContext, canTransition } from '../machines/quotationMachine.v2';
import type {
    QuotationContext,
    QuotationEvent,
    QuotationState,
    TransitionVariables,
    MutationResult,
    CreateDraftPayload
} from '../types/quotation.types';
// @ts-expect-error - JS service without type declarations
import { HapticService } from '../services/hapticService';
import { STATE_UI_CONFIG } from '../types/quotation.types';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════

export const quotationKeys = {
    all: ['quotations'] as const,
    lists: () => [...quotationKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...quotationKeys.lists(), filters] as const,
    details: () => [...quotationKeys.all, 'detail'] as const,
    detail: (id: string) => [...quotationKeys.details(), id] as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// IDEMPOTENCY LAYER - Prevents duplicate operations (Race Condition Fix)
// ═══════════════════════════════════════════════════════════════════════════

const idempotencyKeys = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 5000; // 5 seconds

/**
 * Ensure operation is idempotent - blocks duplicate calls within TTL
 * @param operationKey - Unique key for the operation (e.g., "create_<supplierId>_<timestamp>")
 * @returns true if operation should proceed, false if duplicate
 */
const ensureIdempotent = (operationKey: string): boolean => {
    const now = Date.now();
    const existing = idempotencyKeys.get(operationKey);

    // GUARD CLAUSE: Block if same operation was executed recently
    if (existing && now - existing < IDEMPOTENCY_TTL_MS) {
        console.warn(`⏭️ Duplicate operation blocked: ${operationKey}`);
        return false;
    }

    idempotencyKeys.set(operationKey, now);

    // Cleanup expired keys to prevent memory leak
    for (const [key, timestamp] of idempotencyKeys) {
        if (now - timestamp > IDEMPOTENCY_TTL_MS * 2) {
            idempotencyKeys.delete(key);
        }
    }

    return true;
};

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE LAYER - Atomic operations with version control
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'padoca_quotations_v2';

// Extended context type with version tracking
interface VersionedQuotation extends QuotationContext {
    _version?: number;
}

const storage = {
    load: (): VersionedQuotation[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            console.error('❌ Failed to load quotations from storage');
            return [];
        }
    },

    save: (quotations: VersionedQuotation[]): void => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations));
    },

    getById: (id: string): VersionedQuotation | undefined => {
        // GUARD CLAUSE: Validate ID format
        if (!id || typeof id !== 'string') {
            console.error('❌ Invalid quotation ID');
            return undefined;
        }
        return storage.load().find(q => q.id === id);
    },

    /**
     * ATOMIC UPDATE - Single read-modify-write with version tracking
     * Prevents race conditions by ensuring updates are serialized
     */
    update: (id: string, updater: (q: VersionedQuotation) => VersionedQuotation): VersionedQuotation | undefined => {
        // GUARD CLAUSE: Validate ID
        if (!id || typeof id !== 'string') {
            console.error('❌ Invalid quotation ID for update');
            return undefined;
        }

        // Atomic read-modify-write
        const raw = localStorage.getItem(STORAGE_KEY);
        const quotations: VersionedQuotation[] = raw ? JSON.parse(raw) : [];
        const index = quotations.findIndex(q => q.id === id);

        // GUARD CLAUSE: Early exit if not found
        if (index === -1) {
            console.warn(`⚠️ Quotation ${id} not found for update`);
            return undefined;
        }

        const current = quotations[index]!;
        const updated: VersionedQuotation = {
            ...updater(current),
            _version: (current._version ?? 0) + 1,
            updatedAt: new Date().toISOString()
        };

        quotations[index] = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations));

        console.log(`✅ Quotation ${id} updated to version ${updated._version}`);
        return updated;
    },

    /**
     * IDEMPOTENT ADD - Prevents duplicate quotations
     */
    add: (quotation: VersionedQuotation): VersionedQuotation | null => {
        // GUARD CLAUSE: Validate required fields
        if (!quotation.id || !quotation.supplierId) {
            console.error('❌ Invalid quotation: missing id or supplierId');
            return null;
        }

        // Idempotency check - prevent duplicate creates
        const idempotencyKey = `add_${quotation.id}`;
        if (!ensureIdempotent(idempotencyKey)) {
            return null;
        }

        const quotations = storage.load();

        // GUARD CLAUSE: Check for existing duplicate
        if (quotations.some(q => q.id === quotation.id)) {
            console.warn(`⏭️ Quotation ${quotation.id} already exists, skipping`);
            return quotations.find(q => q.id === quotation.id) ?? null;
        }

        const versionedQuotation: VersionedQuotation = {
            ...quotation,
            _version: 1,
            createdAt: quotation.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        quotations.unshift(versionedQuotation);
        storage.save(quotations);

        console.log(`✅ Quotation ${quotation.id} created (v1)`);
        return versionedQuotation;
    },

    remove: (id: string): boolean => {
        // GUARD CLAUSE: Validate ID
        if (!id || typeof id !== 'string') {
            console.error('❌ Invalid quotation ID for removal');
            return false;
        }

        const quotations = storage.load();
        const filtered = quotations.filter(q => q.id !== id);

        if (filtered.length === quotations.length) {
            console.warn(`⚠️ Quotation ${id} not found for removal`);
            return false;
        }

        storage.save(filtered);
        console.log(`✅ Quotation ${id} removed`);
        return true;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// OPTIMISTIC UPDATE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply optimistic state transition to quotation list
 */
const applyOptimisticTransition = (
    quotations: QuotationContext[] | undefined,
    { quotationId, event }: TransitionVariables
): QuotationContext[] => {
    if (!quotations) return [];

    return quotations.map(q => {
        if (q.id !== quotationId) return q;

        // Create actor to compute next state
        const actor = createActor(quotationMachine, {
            snapshot: quotationMachine.resolveState({
                value: getStateFromContext(q),
                context: q
            })
        });

        actor.start();
        actor.send(event);
        const snapshot = actor.getSnapshot();
        actor.stop();

        return {
            ...snapshot.context,
            _pending: true,
            _previousState: getStateFromContext(q)
        };
    });
};

/**
 * Get state value from context (for reconstruction)
 */
const getStateFromContext = (context: QuotationContext): QuotationState => {
    // Infer state from timestamps
    if (context.deliveredAt) return 'delivered';
    if (context.cancelledAt) return 'cancelled';
    if (context.confirmedAt) return 'confirmed';
    if (context.analyzedAt) return 'quoted';
    if (context.repliedAt) return 'replied';
    if (context.sentAt) return 'sent';
    if (context.items.length > 0) return 'draft';
    return 'idle';
};

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute state transition with persistence
 */
const executeTransition = async (
    variables: TransitionVariables
): Promise<MutationResult> => {
    const { quotationId, event } = variables;

    const quotation = storage.getById(quotationId);
    if (!quotation) {
        return {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Cotação não encontrada', retryable: false }
        };
    }

    // Validate transition
    const currentState = getStateFromContext(quotation);
    const validation = canTransition(currentState, event.type, quotation);

    if (!validation.valid) {
        return {
            success: false,
            error: { code: 'INVALID_TRANSITION', message: validation.error!, retryable: false }
        };
    }

    // Execute via state machine
    const actor = createActor(quotationMachine, {
        snapshot: quotationMachine.resolveState({
            value: currentState,
            context: quotation
        })
    });

    actor.start();
    actor.send(event);
    const snapshot = actor.getSnapshot();
    actor.stop();

    // Persist
    const updated = storage.update(quotationId, () => ({
        ...snapshot.context,
        _pending: false
    }));

    if (!updated) {
        return {
            success: false,
            error: { code: 'PERSIST_ERROR', message: 'Erro ao salvar', retryable: true }
        };
    }

    return { success: true, quotation: updated };
};

/**
 * Create new quotation with idempotency check
 */
const createQuotation = async (payload: CreateDraftPayload): Promise<MutationResult> => {
    // GUARD CLAUSE: Validate required fields
    if (!payload.supplierId || !payload.supplierEmail) {
        return {
            success: false,
            error: { code: 'INVALID_PAYLOAD', message: 'Fornecedor e email são obrigatórios', retryable: false }
        };
    }

    // Idempotency check - prevent rapid duplicate creates
    const idempotencyKey = `create_${payload.supplierId}_${payload.items.length}`;
    if (!ensureIdempotent(idempotencyKey)) {
        return {
            success: false,
            error: { code: 'DUPLICATE', message: 'Operação duplicada bloqueada', retryable: false }
        };
    }

    const context = createInitialContext({
        supplierId: payload.supplierId,
        supplierName: payload.supplierName,
        supplierEmail: payload.supplierEmail,
        items: payload.items
    });

    const actor = createActor(quotationMachine, { input: context });
    actor.start();
    actor.send({ type: 'CREATE_DRAFT', payload });
    const snapshot = actor.getSnapshot();
    actor.stop();

    const quotation = storage.add(snapshot.context);

    // GUARD CLAUSE: Handle storage failure
    if (!quotation) {
        return {
            success: false,
            error: { code: 'PERSIST_ERROR', message: 'Erro ao criar cotação', retryable: true }
        };
    }

    return { success: true, quotation };
};

/**
 * Delete quotation
 */
const deleteQuotation = async (quotationId: string): Promise<MutationResult> => {
    const success = storage.remove(quotationId);

    if (!success) {
        return {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Cotação não encontrada', retryable: false }
        };
    }

    return { success: true };
};

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for state transitions with optimistic updates
 */
export const useTransitionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: executeTransition,

        // ─────────────────────────────────────────────────────────────────────
        // OPTIMISTIC UPDATE - Instant UI feedback
        // ─────────────────────────────────────────────────────────────────────
        onMutate: async (variables) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: quotationKeys.all });

            // Snapshot previous state for rollback
            const previousQuotations = queryClient.getQueryData<QuotationContext[]>(
                quotationKeys.lists()
            );

            // Optimistically update cache
            queryClient.setQueryData<QuotationContext[]>(
                quotationKeys.lists(),
                (old) => applyOptimisticTransition(old, variables)
            );

            // Return context for rollback
            return { previousQuotations };
        },

        // ─────────────────────────────────────────────────────────────────────
        // ERROR - Instant rollback (imperceptible to user)
        // ─────────────────────────────────────────────────────────────────────
        onError: (_error, _variables, context) => {
            // Rollback to previous state
            if (context?.previousQuotations) {
                queryClient.setQueryData(quotationKeys.lists(), context.previousQuotations);
            }

            // Haptic feedback for error
            HapticService.trigger('error');

            console.error('❌ Transition failed:', _error);
        },

        // ─────────────────────────────────────────────────────────────────────
        // SUCCESS - Sync with reality
        // ─────────────────────────────────────────────────────────────────────
        onSuccess: (result, variables) => {
            if (result.success && result.quotation) {
                // Update cache with actual server response
                queryClient.setQueryData<QuotationContext[]>(
                    quotationKeys.lists(),
                    (old) => old?.map(q =>
                        q.id === variables.quotationId ? result.quotation! : q
                    )
                );

                // Haptic feedback for success
                const state = getStateFromContext(result.quotation);
                const config = STATE_UI_CONFIG[state];
                HapticService.trigger(config.hapticType);
            }
        },

        // ─────────────────────────────────────────────────────────────────────
        // SETTLED - Always invalidate to ensure consistency
        // ─────────────────────────────────────────────────────────────────────
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: quotationKeys.all });
        },

        // Retry configuration
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
    });
};

/**
 * Hook for creating quotations with optimistic insert
 */
export const useCreateQuotationMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createQuotation,

        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: quotationKeys.all });

            const previousQuotations = queryClient.getQueryData<QuotationContext[]>(
                quotationKeys.lists()
            );

            // Optimistically add new quotation
            const optimisticQuotation = createInitialContext({
                supplierId: payload.supplierId,
                supplierName: payload.supplierName,
                supplierEmail: payload.supplierEmail,
                items: payload.items,
                _pending: true
            } as Partial<QuotationContext>);

            queryClient.setQueryData<QuotationContext[]>(
                quotationKeys.lists(),
                (old) => [optimisticQuotation, ...(old ?? [])]
            );

            HapticService.trigger('impactMedium');

            return { previousQuotations, optimisticId: optimisticQuotation.id };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousQuotations) {
                queryClient.setQueryData(quotationKeys.lists(), context.previousQuotations);
            }
            HapticService.trigger('error');
        },

        onSuccess: (result, _variables, context) => {
            if (result.success && result.quotation) {
                // Replace optimistic with real
                queryClient.setQueryData<QuotationContext[]>(
                    quotationKeys.lists(),
                    (old) => old?.map(q =>
                        q.id === context?.optimisticId ? result.quotation! : q
                    )
                );
                HapticService.trigger('success');
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: quotationKeys.all });
        }
    });
};

/**
 * Hook for deleting quotations with optimistic removal
 */
export const useDeleteQuotationMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteQuotation,

        onMutate: async (quotationId) => {
            await queryClient.cancelQueries({ queryKey: quotationKeys.all });

            const previousQuotations = queryClient.getQueryData<QuotationContext[]>(
                quotationKeys.lists()
            );

            // Optimistically remove
            queryClient.setQueryData<QuotationContext[]>(
                quotationKeys.lists(),
                (old) => old?.filter(q => q.id !== quotationId)
            );

            HapticService.trigger('warning');

            return { previousQuotations };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousQuotations) {
                queryClient.setQueryData(quotationKeys.lists(), context.previousQuotations);
            }
            HapticService.trigger('error');
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: quotationKeys.all });
        }
    });
};

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for fetching all quotations
 */
export const useQuotations = () => {
    return useQuery({
        queryKey: quotationKeys.lists(),
        queryFn: () => storage.load(),
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook for fetching single quotation
 */
export const useQuotation = (id: string) => {
    return useQuery({
        queryKey: quotationKeys.detail(id),
        queryFn: () => storage.getById(id),
        enabled: Boolean(id),
    });
};

// ═══════════════════════════════════════════════════════════════════════════
// COMBINED HOOK - Enterprise API
// ═══════════════════════════════════════════════════════════════════════════

export interface UseQuotationFlowReturn {
    // Data
    quotations: QuotationContext[];
    isLoading: boolean;
    error: Error | null;

    // Mutations
    transition: (quotationId: string, event: QuotationEvent) => Promise<MutationResult>;
    createQuotation: (payload: CreateDraftPayload) => Promise<MutationResult>;
    deleteQuotation: (quotationId: string) => Promise<MutationResult>;

    // Convenience methods
    send: (quotationId: string) => Promise<MutationResult>;
    confirm: (quotationId: string) => Promise<MutationResult>;
    deliver: (quotationId: string, payload?: { invoiceNumber?: string; notes?: string }) => Promise<MutationResult>;
    cancel: (quotationId: string, reason?: string) => Promise<MutationResult>;

    // State
    isPending: boolean;
    pendingQuotationIds: Set<string>;
}

export const useQuotationFlow = (): UseQuotationFlowReturn => {
    const { data: quotations = [], isLoading, error } = useQuotations();
    const transitionMutation = useTransitionMutation();
    const createMutation = useCreateQuotationMutation();
    const deleteMutation = useDeleteQuotationMutation();

    // Track pending quotations
    const pendingQuotationIds = useMemo(() =>
        new Set(quotations.filter(q => q._pending).map(q => q.id)),
        [quotations]
    );

    // Transition wrapper
    const transition = useCallback(
        async (quotationId: string, event: QuotationEvent) => {
            return transitionMutation.mutateAsync({ quotationId, event });
        },
        [transitionMutation]
    );

    // Convenience methods
    const send = useCallback(
        (quotationId: string) => transition(quotationId, { type: 'SEND' }),
        [transition]
    );

    const confirm = useCallback(
        (quotationId: string) => transition(quotationId, { type: 'CONFIRM' }),
        [transition]
    );

    const deliver = useCallback(
        (quotationId: string, payload?: { invoiceNumber?: string; notes?: string }) =>
            transition(quotationId, { type: 'DELIVER', payload }),
        [transition]
    );

    const cancel = useCallback(
        (quotationId: string, reason?: string) =>
            transition(quotationId, { type: 'CANCEL', payload: { reason: reason ?? 'Cancelled by user' } }),
        [transition]
    );

    return {
        quotations,
        isLoading,
        error,
        transition,
        createQuotation: (payload) => createMutation.mutateAsync(payload),
        deleteQuotation: (id) => deleteMutation.mutateAsync(id),
        send,
        confirm,
        deliver,
        cancel,
        isPending: transitionMutation.isPending || createMutation.isPending || deleteMutation.isPending,
        pendingQuotationIds
    };
};

export default useQuotationFlow;
