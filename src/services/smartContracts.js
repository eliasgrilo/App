/**
 * Smart Contracts Service - Self-Executing Contracts
 * 
 * PREMIUM FEATURE #27: Smart Contracts
 * 
 * Code is Law. Rules become self-executing digital contracts.
 * "If delivery delays 24h, automatic 5% penalty."
 * 
 * @module smartContracts
 */

const ContractStatus = Object.freeze({
    DRAFT: 'draft', PENDING: 'pending', ACTIVE: 'active',
    EXECUTED: 'executed', VIOLATED: 'violated', EXPIRED: 'expired'
});

const ConditionType = Object.freeze({
    DELIVERY_TIME: 'delivery_time', QUALITY_SCORE: 'quality_score',
    PRICE_CAP: 'price_cap', QUANTITY_MIN: 'quantity_min', PAYMENT_TERMS: 'payment_terms'
});

const ActionType = Object.freeze({
    APPLY_DISCOUNT: 'apply_discount', APPLY_PENALTY: 'apply_penalty',
    RELEASE_PAYMENT: 'release_payment', HOLD_PAYMENT: 'hold_payment',
    NOTIFY: 'notify', TERMINATE: 'terminate'
});

class ContractCondition {
    constructor(config) {
        this.id = `cond_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.type = config.type;
        this.operator = config.operator; // 'gt', 'lt', 'eq', 'gte', 'lte'
        this.value = config.value;
        this.unit = config.unit;
        this.description = config.description;
    }

    evaluate(actualValue) {
        const ops = {
            gt: (a, b) => a > b, lt: (a, b) => a < b, eq: (a, b) => a === b,
            gte: (a, b) => a >= b, lte: (a, b) => a <= b
        };
        return ops[this.operator]?.(actualValue, this.value) ?? false;
    }
}

class ContractAction {
    constructor(config) {
        this.id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.type = config.type;
        this.value = config.value;
        this.description = config.description;
        this.executedAt = null;
    }
}

class SmartContract {
    constructor(config) {
        this.id = config.id || `contract_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        this.name = config.name;
        this.parties = config.parties; // [{ id, role: 'buyer'|'seller' }]
        this.conditions = config.conditions || [];
        this.thenActions = config.thenActions || [];
        this.elseActions = config.elseActions || [];
        this.status = ContractStatus.DRAFT;
        this.createdAt = Date.now();
        this.activatedAt = null;
        this.expiresAt = config.expiresAt;
        this.executionLog = [];
        this.metadata = config.metadata || {};
    }

    addCondition(conditionConfig) {
        const condition = new ContractCondition(conditionConfig);
        this.conditions.push(condition);
        return condition;
    }

    addThenAction(actionConfig) {
        const action = new ContractAction(actionConfig);
        this.thenActions.push(action);
        return action;
    }

    addElseAction(actionConfig) {
        const action = new ContractAction(actionConfig);
        this.elseActions.push(action);
        return action;
    }
}

class SmartContractsService {
    constructor() {
        this.contracts = new Map();
        this.templates = new Map();
        this.executionQueue = [];
        this.metrics = { contractsCreated: 0, contractsExecuted: 0, penaltiesApplied: 0, totalSaved: 0 };
    }

    initialize() {
        this.registerDefaultTemplates();
        console.log('[SmartContracts] Initialized');
    }

    registerDefaultTemplates() {
        this.registerTemplate({
            id: 'delivery_penalty',
            name: 'Multa por Atraso na Entrega',
            description: 'Aplica multa automática se entrega atrasar',
            conditions: [{ type: ConditionType.DELIVERY_TIME, operator: 'gt', value: 24, unit: 'hours', description: 'Atraso > 24h' }],
            thenActions: [],
            elseActions: [{ type: ActionType.APPLY_PENALTY, value: 5, description: 'Aplicar 5% de multa' }]
        });

        this.registerTemplate({
            id: 'quality_guarantee',
            name: 'Garantia de Qualidade',
            description: 'Desconto automático se qualidade inferior',
            conditions: [{ type: ConditionType.QUALITY_SCORE, operator: 'gte', value: 8, unit: 'score', description: 'Qualidade >= 8' }],
            thenActions: [{ type: ActionType.RELEASE_PAYMENT, value: 100, description: 'Liberar pagamento total' }],
            elseActions: [{ type: ActionType.APPLY_DISCOUNT, value: 10, description: 'Aplicar 10% de desconto' }]
        });

        this.registerTemplate({
            id: 'price_protection',
            name: 'Proteção de Preço',
            description: 'Mantém preço máximo acordado',
            conditions: [{ type: ConditionType.PRICE_CAP, operator: 'lte', value: 0, unit: 'price', description: 'Preço <= acordado' }],
            thenActions: [{ type: ActionType.RELEASE_PAYMENT, value: 100, description: 'Pagar preço cotado' }],
            elseActions: [{ type: ActionType.HOLD_PAYMENT, value: 0, description: 'Reter diferença' }]
        });
    }

    registerTemplate(template) {
        this.templates.set(template.id, template);
    }

    createFromTemplate(templateId, config) {
        const template = this.templates.get(templateId);
        if (!template) throw new Error(`Template not found: ${templateId}`);

        const contract = new SmartContract({
            name: config.name || template.name,
            parties: config.parties,
            expiresAt: config.expiresAt,
            metadata: config.metadata
        });

        for (const c of template.conditions) {
            contract.addCondition({ ...c, value: config.conditionValues?.[c.type] ?? c.value });
        }
        for (const a of template.thenActions) {
            contract.addThenAction({ ...a, value: config.actionValues?.then?.[a.type] ?? a.value });
        }
        for (const a of template.elseActions) {
            contract.addElseAction({ ...a, value: config.actionValues?.else?.[a.type] ?? a.value });
        }

        this.contracts.set(contract.id, contract);
        this.metrics.contractsCreated++;
        return contract;
    }

    createContract(config) {
        const contract = new SmartContract(config);
        this.contracts.set(contract.id, contract);
        this.metrics.contractsCreated++;
        return contract;
    }

    activateContract(contractId) {
        const contract = this.contracts.get(contractId);
        if (!contract) throw new Error(`Contract not found: ${contractId}`);

        contract.status = ContractStatus.ACTIVE;
        contract.activatedAt = Date.now();
        contract.executionLog.push({ event: 'activated', timestamp: Date.now() });

        return contract;
    }

    evaluateContract(contractId, actualValues) {
        const contract = this.contracts.get(contractId);
        if (!contract || contract.status !== ContractStatus.ACTIVE) {
            throw new Error(`Contract not active: ${contractId}`);
        }

        const results = { conditionsMet: true, evaluations: [], actionsToExecute: [] };

        for (const condition of contract.conditions) {
            const actualValue = actualValues[condition.type];
            const met = condition.evaluate(actualValue);
            results.evaluations.push({
                condition: condition.description,
                expected: `${condition.operator} ${condition.value}`,
                actual: actualValue,
                met
            });
            if (!met) results.conditionsMet = false;
        }

        results.actionsToExecute = results.conditionsMet ? contract.thenActions : contract.elseActions;

        contract.executionLog.push({
            event: 'evaluated',
            timestamp: Date.now(),
            conditionsMet: results.conditionsMet,
            evaluations: results.evaluations
        });

        return results;
    }

    executeActions(contractId, actionsToExecute, context = {}) {
        const contract = this.contracts.get(contractId);
        const results = [];

        for (const action of actionsToExecute) {
            const result = this.executeAction(action, context);
            action.executedAt = Date.now();
            results.push(result);

            if (action.type === ActionType.APPLY_PENALTY) {
                this.metrics.penaltiesApplied++;
                this.metrics.totalSaved += (context.originalAmount || 0) * (action.value / 100);
            }
        }

        contract.status = ContractStatus.EXECUTED;
        contract.executionLog.push({ event: 'executed', timestamp: Date.now(), results });
        this.metrics.contractsExecuted++;

        return results;
    }

    executeAction(action, context) {
        const originalAmount = context.originalAmount || 0;

        switch (action.type) {
            case ActionType.APPLY_DISCOUNT:
                return {
                    action: action.type,
                    description: action.description,
                    discount: action.value,
                    newAmount: originalAmount * (1 - action.value / 100),
                    saved: originalAmount * (action.value / 100)
                };

            case ActionType.APPLY_PENALTY:
                return {
                    action: action.type,
                    description: action.description,
                    penalty: action.value,
                    newAmount: originalAmount * (1 - action.value / 100),
                    penaltyAmount: originalAmount * (action.value / 100)
                };

            case ActionType.RELEASE_PAYMENT:
                return { action: action.type, description: action.description, released: true, amount: originalAmount };

            case ActionType.HOLD_PAYMENT:
                return { action: action.type, description: action.description, held: true, amount: originalAmount };

            case ActionType.NOTIFY:
                return { action: action.type, description: action.description, notified: true };

            case ActionType.TERMINATE:
                return { action: action.type, description: action.description, terminated: true };

            default:
                return { action: action.type, executed: true };
        }
    }

    evaluateAndExecute(contractId, actualValues, context = {}) {
        const evaluation = this.evaluateContract(contractId, actualValues);
        const results = this.executeActions(contractId, evaluation.actionsToExecute, context);
        return { evaluation, results };
    }

    getContract(contractId) {
        return this.contracts.get(contractId);
    }

    getActiveContracts() {
        return Array.from(this.contracts.values()).filter(c => c.status === ContractStatus.ACTIVE);
    }

    getTemplates() {
        return Array.from(this.templates.values());
    }

    getMetrics() {
        return this.metrics;
    }
}

export const smartContracts = new SmartContractsService();
export { ContractStatus, ConditionType, ActionType, ContractCondition, ContractAction, SmartContract, SmartContractsService };
export default smartContracts;
