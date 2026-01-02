/**
 * CQRS Service - Command Query Responsibility Segregation
 * 
 * Separates read and write operations for improved scalability,
 * performance, and maintainability.
 * 
 * Architecture Pattern: CQRS
 * - Commands: Write operations that change state
 * - Queries: Read operations that return data
 * - Command Bus: Routes commands to handlers
 * - Query Bus: Routes queries to handlers
 * 
 * @module CQRSService
 * @version 1.0.0
 */

import { EventStoreService, EventType } from './eventStoreService';

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const CommandType = Object.freeze({
    // Quotation Commands
    CREATE_QUOTATION: 'CreateQuotation',
    SEND_QUOTATION: 'SendQuotation',
    CONFIRM_QUOTATION: 'ConfirmQuotation',
    CANCEL_QUOTATION: 'CancelQuotation',

    // Order Commands
    CREATE_ORDER: 'CreateOrder',
    UPDATE_ORDER_STATUS: 'UpdateOrderStatus',
    CANCEL_ORDER: 'CancelOrder',
    MARK_ORDER_DELIVERED: 'MarkOrderDelivered',

    // Inventory Commands
    ADJUST_STOCK: 'AdjustStock',
    RESERVE_STOCK: 'ReserveStock',
    RELEASE_STOCK: 'ReleaseStock',

    // Supplier Commands
    CREATE_SUPPLIER: 'CreateSupplier',
    UPDATE_SUPPLIER: 'UpdateSupplier'
});

// ═══════════════════════════════════════════════════════════════════════════
// QUERY TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const QueryType = Object.freeze({
    // Quotation Queries
    GET_QUOTATION: 'GetQuotation',
    LIST_QUOTATIONS: 'ListQuotations',
    GET_QUOTATION_HISTORY: 'GetQuotationHistory',

    // Order Queries
    GET_ORDER: 'GetOrder',
    LIST_ORDERS: 'ListOrders',
    GET_ORDER_SUMMARY: 'GetOrderSummary',

    // Analytics Queries
    GET_SUPPLIER_ANALYTICS: 'GetSupplierAnalytics',
    GET_PENDING_ORDERS: 'GetPendingOrders',
    GET_DELIVERY_SCHEDULE: 'GetDeliverySchedule'
});

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class Command {
    constructor(type, payload, metadata = {}) {
        this.id = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.type = type;
        this.payload = payload;
        this.metadata = {
            timestamp: new Date().toISOString(),
            correlationId: metadata.correlationId || null,
            userId: metadata.userId || null,
            userName: metadata.userName || null,
            ...metadata
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class Query {
    constructor(type, parameters = {}, options = {}) {
        this.id = `qry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.type = type;
        this.parameters = parameters;
        this.options = {
            cache: options.cache !== false, // Cache by default
            cacheKey: options.cacheKey || null,
            cacheTTL: options.cacheTTL || 60000, // 1 minute default
            ...options
        };
        this.metadata = {
            timestamp: new Date().toISOString()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND BUS
// ═══════════════════════════════════════════════════════════════════════════

class CommandBus {
    constructor() {
        this.handlers = new Map();
        this.middleware = [];
        this.metrics = {
            totalCommands: 0,
            successfulCommands: 0,
            failedCommands: 0,
            averageExecutionTime: 0
        };
    }

    /**
     * Register a command handler
     * @param {string} commandType - Command type to handle
     * @param {Function} handler - Handler function (async)
     */
    register(commandType, handler) {
        if (this.handlers.has(commandType)) {
            console.warn(`⚠️ Overwriting handler for command: ${commandType}`);
        }
        this.handlers.set(commandType, handler);
        console.log(`📝 Registered command handler: ${commandType}`);
    }

    /**
     * Add middleware for command processing
     * @param {Function} middleware - Middleware function
     */
    use(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Dispatch a command to its handler
     * @param {Command} command - Command to dispatch
     * @returns {Promise<Object>} - Command result
     */
    async dispatch(command) {
        const startTime = Date.now();
        this.metrics.totalCommands++;

        console.log(`📤 Dispatching command: ${command.type} [${command.id}]`);

        // Validate command type
        if (!this.handlers.has(command.type)) {
            this.metrics.failedCommands++;
            throw new Error(`No handler registered for command: ${command.type}`);
        }

        try {
            // Execute middleware pipeline
            let processedCommand = command;
            for (const mw of this.middleware) {
                processedCommand = await mw(processedCommand) || processedCommand;
            }

            // Get and execute handler
            const handler = this.handlers.get(command.type);
            const result = await handler(processedCommand.payload, processedCommand.metadata);

            // Update metrics
            const executionTime = Date.now() - startTime;
            this.metrics.successfulCommands++;
            this.updateAverageTime(executionTime);

            // Emit command executed event
            await this.emitEvent(command, result, executionTime);

            console.log(`✅ Command completed: ${command.type} (${executionTime}ms)`);

            return {
                success: true,
                commandId: command.id,
                result,
                executionTime
            };

        } catch (error) {
            this.metrics.failedCommands++;
            console.error(`❌ Command failed: ${command.type}`, error.message);

            return {
                success: false,
                commandId: command.id,
                error: error.message,
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Emit command event to Event Store
     */
    async emitEvent(command, result, executionTime) {
        try {
            await EventStoreService.append({
                eventType: 'COMMAND_EXECUTED',
                aggregateId: command.id,
                aggregateType: 'Command',
                payload: {
                    commandType: command.type,
                    success: true,
                    executionTime
                },
                metadata: command.metadata,
                correlationId: command.metadata.correlationId
            });
        } catch (e) {
            console.warn('Command event emission failed:', e.message);
        }
    }

    /**
     * Update rolling average execution time
     */
    updateAverageTime(newTime) {
        const n = this.metrics.successfulCommands;
        const oldAvg = this.metrics.averageExecutionTime;
        this.metrics.averageExecutionTime = oldAvg + (newTime - oldAvg) / n;
    }

    /**
     * Get bus metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY BUS
// ═══════════════════════════════════════════════════════════════════════════

class QueryBus {
    constructor() {
        this.handlers = new Map();
        this.cache = new Map();
        this.metrics = {
            totalQueries: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageExecutionTime: 0
        };
    }

    /**
     * Register a query handler
     * @param {string} queryType - Query type to handle
     * @param {Function} handler - Handler function (async)
     */
    register(queryType, handler) {
        if (this.handlers.has(queryType)) {
            console.warn(`⚠️ Overwriting handler for query: ${queryType}`);
        }
        this.handlers.set(queryType, handler);
        console.log(`🔍 Registered query handler: ${queryType}`);
    }

    /**
     * Execute a query
     * @param {Query} query - Query to execute
     * @returns {Promise<Object>} - Query result
     */
    async execute(query) {
        const startTime = Date.now();
        this.metrics.totalQueries++;

        console.log(`🔍 Executing query: ${query.type} [${query.id}]`);

        // Validate query type
        if (!this.handlers.has(query.type)) {
            throw new Error(`No handler registered for query: ${query.type}`);
        }

        // Check cache if enabled
        if (query.options.cache) {
            const cached = this.getFromCache(query);
            if (cached !== null) {
                this.metrics.cacheHits++;
                console.log(`  📦 Cache hit for: ${query.type}`);
                return {
                    success: true,
                    queryId: query.id,
                    data: cached,
                    fromCache: true,
                    executionTime: Date.now() - startTime
                };
            }
            this.metrics.cacheMisses++;
        }

        try {
            // Get and execute handler
            const handler = this.handlers.get(query.type);
            const result = await handler(query.parameters, query.options);

            // Update metrics
            const executionTime = Date.now() - startTime;
            this.updateAverageTime(executionTime);

            // Cache result if enabled
            if (query.options.cache) {
                this.setCache(query, result);
            }

            console.log(`✅ Query completed: ${query.type} (${executionTime}ms)`);

            return {
                success: true,
                queryId: query.id,
                data: result,
                fromCache: false,
                executionTime
            };

        } catch (error) {
            console.error(`❌ Query failed: ${query.type}`, error.message);

            return {
                success: false,
                queryId: query.id,
                error: error.message,
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Get cached result
     */
    getFromCache(query) {
        const cacheKey = query.options.cacheKey || this.generateCacheKey(query);
        const cached = this.cache.get(cacheKey);

        if (!cached) return null;

        // Check if expired
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(cacheKey);
            return null;
        }

        return cached.data;
    }

    /**
     * Set cache entry
     */
    setCache(query, data) {
        const cacheKey = query.options.cacheKey || this.generateCacheKey(query);
        this.cache.set(cacheKey, {
            data,
            expiresAt: Date.now() + query.options.cacheTTL
        });
    }

    /**
     * Generate cache key from query
     */
    generateCacheKey(query) {
        return `${query.type}:${JSON.stringify(query.parameters)}`;
    }

    /**
     * Clear cache
     */
    clearCache(pattern = null) {
        if (!pattern) {
            this.cache.clear();
            return;
        }

        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Update rolling average execution time
     */
    updateAverageTime(newTime) {
        const n = this.metrics.totalQueries - this.metrics.cacheHits;
        if (n <= 0) return;
        const oldAvg = this.metrics.averageExecutionTime;
        this.metrics.averageExecutionTime = oldAvg + (newTime - oldAvg) / n;
    }

    /**
     * Get bus metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            hitRate: this.metrics.totalQueries > 0
                ? (this.metrics.cacheHits / this.metrics.totalQueries * 100).toFixed(2) + '%'
                : '0%'
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

function validationMiddleware(command) {
    // Validate userId is present for write operations
    if (!command.metadata.userId) {
        console.warn(`⚠️ Command ${command.type} missing userId`);
    }

    // Validate payload exists
    if (!command.payload || Object.keys(command.payload).length === 0) {
        throw new Error(`Command ${command.type} requires a payload`);
    }

    return command;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

function loggingMiddleware(command) {
    console.log(`  📋 Command payload keys: ${Object.keys(command.payload).join(', ')}`);
    return command;
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCES
// ═══════════════════════════════════════════════════════════════════════════

const commandBus = new CommandBus();
const queryBus = new QueryBus();

// Add default middleware
commandBus.use(validationMiddleware);
commandBus.use(loggingMiddleware);

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE HANDLERS REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════

// These would be registered by the actual services
// Example: commandBus.register('CreateOrder', createOrderHandler);

// ═══════════════════════════════════════════════════════════════════════════
// CQRS SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const CQRSService = {
    // Command operations
    command: {
        register: (type, handler) => commandBus.register(type, handler),
        dispatch: (command) => commandBus.dispatch(command),
        create: (type, payload, metadata) => new Command(type, payload, metadata),
        getMetrics: () => commandBus.getMetrics()
    },

    // Query operations
    query: {
        register: (type, handler) => queryBus.register(type, handler),
        execute: (query) => queryBus.execute(query),
        create: (type, parameters, options) => new Query(type, parameters, options),
        clearCache: (pattern) => queryBus.clearCache(pattern),
        getMetrics: () => queryBus.getMetrics()
    },

    // Convenience methods
    dispatchCommand: async (type, payload, metadata = {}) => {
        const command = new Command(type, payload, metadata);
        return commandBus.dispatch(command);
    },

    executeQuery: async (type, parameters = {}, options = {}) => {
        const query = new Query(type, parameters, options);
        return queryBus.execute(query);
    },

    // Types
    CommandType,
    QueryType,

    // Classes for advanced usage
    Command,
    Query
};

export default CQRSService;
