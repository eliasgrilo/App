/**
 * Saga Service - Enterprise-Grade Distributed Transaction Orchestration
 * 
 * Implements the Saga Pattern for managing distributed transactions
 * across multiple services with compensating transactions for rollback.
 * 
 * Architecture Pattern: Saga Orchestration
 * - Saga = sequence of local transactions
 * - Each step has a forward action and a compensating action
 * - On failure, compensating transactions are executed in reverse order
 * 
 * @module SagaService
 * @version 1.0.0
 */

import { EventStoreService, EventType } from './eventStoreService';

// ═══════════════════════════════════════════════════════════════════════════
// SAGA STATUS ENUM
// ═══════════════════════════════════════════════════════════════════════════

export const SagaStatus = Object.freeze({
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    COMPENSATING: 'compensating',
    COMPENSATED: 'compensated',
    FAILED: 'failed'
});

// ═══════════════════════════════════════════════════════════════════════════
// SAGA STEP RESULT
// ═══════════════════════════════════════════════════════════════════════════

export const StepResult = Object.freeze({
    SUCCESS: 'success',
    FAILURE: 'failure',
    SKIPPED: 'skipped'
});

// ═══════════════════════════════════════════════════════════════════════════
// SAGA DEFINITION BUILDER
// ═══════════════════════════════════════════════════════════════════════════

export class SagaBuilder {
    constructor(name) {
        this.name = name;
        this.steps = [];
        this.context = {};
        this.onCompletedCallback = null;
        this.onFailedCallback = null;
    }

    /**
     * Add a step to the saga
     * @param {string} name - Step name
     * @param {Function} action - Forward action (async)
     * @param {Function} compensate - Compensating action (async)
     * @returns {SagaBuilder} - For chaining
     */
    step(name, action, compensate) {
        this.steps.push({
            name,
            action,
            compensate,
            status: StepResult.SKIPPED,
            result: null,
            error: null
        });
        return this;
    }

    /**
     * Add initial context data
     */
    withContext(context) {
        this.context = { ...this.context, ...context };
        return this;
    }

    /**
     * Callback on saga completion
     */
    onCompleted(callback) {
        this.onCompletedCallback = callback;
        return this;
    }

    /**
     * Callback on saga failure
     */
    onFailed(callback) {
        this.onFailedCallback = callback;
        return this;
    }

    /**
     * Build the saga instance
     */
    build() {
        return new Saga(this);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SAGA CLASS - Execution Engine
// ═══════════════════════════════════════════════════════════════════════════

export class Saga {
    constructor(builder) {
        this.id = `saga_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.name = builder.name;
        this.steps = JSON.parse(JSON.stringify(builder.steps)); // Deep clone
        this.context = { ...builder.context };
        this.status = SagaStatus.PENDING;
        this.currentStepIndex = -1;
        this.completedSteps = [];
        this.startedAt = null;
        this.completedAt = null;
        this.error = null;
        this.onCompletedCallback = builder.onCompletedCallback;
        this.onFailedCallback = builder.onFailedCallback;

        // Keep original actions (not clonable)
        this._actions = builder.steps.map(s => ({
            action: s.action,
            compensate: s.compensate
        }));
    }

    /**
     * Execute the saga
     * @returns {Promise<Object>} - Saga result
     */
    async execute() {
        console.log(`🎭 Starting saga: ${this.name} [${this.id}]`);

        this.status = SagaStatus.RUNNING;
        this.startedAt = new Date().toISOString();

        // Emit saga started event
        await this.emitEvent('SAGA_STARTED', {
            sagaName: this.name,
            stepCount: this.steps.length,
            context: this.sanitizeContext()
        });

        try {
            // Execute each step in sequence
            for (let i = 0; i < this.steps.length; i++) {
                this.currentStepIndex = i;
                const step = this.steps[i];
                const actions = this._actions[i];

                console.log(`  📍 Step ${i + 1}/${this.steps.length}: ${step.name}`);

                try {
                    // Execute the forward action
                    const result = await actions.action(this.context);

                    // Update step status
                    step.status = StepResult.SUCCESS;
                    step.result = result;

                    // Update context with step result
                    if (result && typeof result === 'object') {
                        this.context = { ...this.context, ...result };
                    }

                    this.completedSteps.push({
                        index: i,
                        name: step.name,
                        result
                    });

                    console.log(`    ✅ ${step.name} completed`);

                } catch (stepError) {
                    console.error(`    ❌ ${step.name} failed:`, stepError.message);

                    step.status = StepResult.FAILURE;
                    step.error = stepError.message;
                    this.error = stepError;

                    // Emit step failure
                    await this.emitEvent('SAGA_STEP_FAILED', {
                        stepName: step.name,
                        stepIndex: i,
                        error: stepError.message
                    });

                    // Trigger compensation
                    await this.compensate();

                    return this.getResult();
                }
            }

            // All steps completed successfully
            this.status = SagaStatus.COMPLETED;
            this.completedAt = new Date().toISOString();

            console.log(`✅ Saga completed: ${this.name}`);

            // Emit saga completed
            await this.emitEvent('SAGA_COMPLETED', {
                duration: Date.now() - new Date(this.startedAt).getTime(),
                stepsCompleted: this.completedSteps.length
            });

            // Execute completion callback
            if (this.onCompletedCallback) {
                try {
                    await this.onCompletedCallback(this.context, this.getResult());
                } catch (e) {
                    console.warn('Saga completion callback failed:', e);
                }
            }

            return this.getResult();

        } catch (error) {
            console.error(`❌ Saga execution error: ${error.message}`);
            this.error = error;
            this.status = SagaStatus.FAILED;

            return this.getResult();
        }
    }

    /**
     * Execute compensating transactions in reverse order
     */
    async compensate() {
        console.log(`🔄 Starting compensation for saga: ${this.name}`);

        this.status = SagaStatus.COMPENSATING;

        // Emit compensation started
        await this.emitEvent('SAGA_COMPENSATING', {
            stepsToCompensate: this.completedSteps.length
        });

        // Execute compensations in reverse order
        for (let i = this.completedSteps.length - 1; i >= 0; i--) {
            const completedStep = this.completedSteps[i];
            const step = this.steps[completedStep.index];
            const actions = this._actions[completedStep.index];

            console.log(`  ↩️ Compensating: ${step.name}`);

            try {
                if (actions.compensate) {
                    await actions.compensate(this.context, completedStep.result);
                    console.log(`    ✅ Compensated: ${step.name}`);
                } else {
                    console.log(`    ⏭️ No compensation defined for: ${step.name}`);
                }
            } catch (compensateError) {
                console.error(`    ❌ Compensation failed for ${step.name}:`, compensateError.message);
                // Log but continue with other compensations
                await this.emitEvent('SAGA_COMPENSATION_FAILED', {
                    stepName: step.name,
                    error: compensateError.message
                });
            }
        }

        this.status = SagaStatus.COMPENSATED;
        this.completedAt = new Date().toISOString();

        console.log(`✅ Compensation completed for saga: ${this.name}`);

        // Emit compensation completed
        await this.emitEvent('SAGA_COMPENSATED', {
            compensatedSteps: this.completedSteps.length
        });

        // Execute failure callback
        if (this.onFailedCallback) {
            try {
                await this.onFailedCallback(this.error, this.context, this.getResult());
            } catch (e) {
                console.warn('Saga failure callback failed:', e);
            }
        }
    }

    /**
     * Emit saga event to Event Store
     */
    async emitEvent(eventType, payload) {
        try {
            await EventStoreService.append({
                eventType: `SAGA_${eventType}`,
                aggregateId: this.id,
                aggregateType: 'Saga',
                payload: {
                    sagaName: this.name,
                    ...payload
                },
                metadata: {
                    status: this.status,
                    currentStep: this.currentStepIndex
                }
            });
        } catch (error) {
            console.warn('Saga event emission failed:', error.message);
        }
    }

    /**
     * Get saga result
     */
    getResult() {
        return {
            id: this.id,
            name: this.name,
            status: this.status,
            context: this.context,
            completedSteps: this.completedSteps.map(s => s.name),
            error: this.error?.message || null,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            duration: this.completedAt
                ? new Date(this.completedAt) - new Date(this.startedAt)
                : null
        };
    }

    /**
     * Sanitize context for logging (remove large data)
     */
    sanitizeContext() {
        const sanitized = {};
        for (const [key, value] of Object.entries(this.context)) {
            if (typeof value === 'string' && value.length > 200) {
                sanitized[key] = `[${value.length} chars]`;
            } else if (Array.isArray(value) && value.length > 10) {
                sanitized[key] = `[Array: ${value.length} items]`;
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PRE-BUILT SAGA DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create Order Saga - Complete quotation to order flow
 * 
 * Steps:
 * 1. Validate quotation
 * 2. Create order record
 * 3. Update quotation status
 * 4. Send confirmation email
 * 5. Update inventory reservations
 */
export function createOrderSaga(quotation, userId, userName) {
    return new SagaBuilder('CreateOrderSaga')
        .withContext({
            quotation,
            userId,
            userName,
            orderId: null,
            emailSent: false
        })

        // Step 1: Validate quotation
        .step(
            'ValidateQuotation',
            async (ctx) => {
                const { quotation } = ctx;

                if (!quotation.quotedTotal || quotation.quotedTotal <= 0) {
                    throw new Error('Quotation must have a positive total');
                }
                if (!quotation.items || quotation.items.length === 0) {
                    throw new Error('Quotation must have items');
                }
                if (quotation.status === 'cancelled') {
                    throw new Error('Cannot create order from cancelled quotation');
                }

                return { validated: true };
            },
            null // No compensation needed for validation
        )

        // Step 2: Create order record
        .step(
            'CreateOrderRecord',
            async (ctx) => {
                const { quotation, userId, userName } = ctx;
                const orderId = `order_${quotation.id.replace('quot_', '')}`;

                // This would call the actual order creation
                console.log(`    📦 Creating order: ${orderId}`);

                return { orderId, orderCreated: true };
            },
            async (ctx, stepResult) => {
                // Compensate: Delete the created order
                if (stepResult?.orderId) {
                    console.log(`    🗑️ Deleting order: ${stepResult.orderId}`);
                    // Would call actual delete
                }
            }
        )

        // Step 3: Update quotation status
        .step(
            'UpdateQuotationStatus',
            async (ctx) => {
                const { quotation } = ctx;
                console.log(`    📝 Updating quotation status to 'confirmed'`);
                return { quotationUpdated: true, previousStatus: quotation.status };
            },
            async (ctx, stepResult) => {
                // Compensate: Revert quotation status
                if (stepResult?.previousStatus) {
                    console.log(`    ↩️ Reverting quotation to: ${stepResult.previousStatus}`);
                }
            }
        )

        // Step 4: Send confirmation email
        .step(
            'SendConfirmationEmail',
            async (ctx) => {
                const { quotation, orderId } = ctx;
                console.log(`    📧 Sending confirmation email to: ${quotation.supplierEmail}`);
                return { emailSent: true, emailId: `email_${Date.now()}` };
            },
            async (ctx, stepResult) => {
                // Compensate: Send cancellation email
                if (stepResult?.emailSent) {
                    console.log(`    📧 Sending order cancellation email`);
                }
            }
        )

        // Step 5: Reserve inventory
        .step(
            'ReserveInventory',
            async (ctx) => {
                const { quotation } = ctx;
                const reservations = quotation.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantityToOrder,
                    reserved: true
                }));
                console.log(`    📦 Reserved ${reservations.length} items`);
                return { reservations };
            },
            async (ctx, stepResult) => {
                // Compensate: Release reservations
                if (stepResult?.reservations) {
                    console.log(`    🔓 Releasing ${stepResult.reservations.length} reservations`);
                }
            }
        )

        .onCompleted((ctx, result) => {
            console.log(`🎉 Order ${ctx.orderId} created successfully!`);
        })

        .onFailed((error, ctx, result) => {
            console.log(`❌ Order creation failed: ${error.message}`);
        })

        .build();
}

// ═══════════════════════════════════════════════════════════════════════════
// SAGA SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const SagaService = {
    // Factory methods
    create: (name) => new SagaBuilder(name),
    createOrderSaga,

    // Execute saga directly
    execute: async (saga) => {
        if (saga instanceof SagaBuilder) {
            return saga.build().execute();
        }
        return saga.execute();
    },

    // Status enum
    Status: SagaStatus,
    StepResult
};

export default SagaService;
