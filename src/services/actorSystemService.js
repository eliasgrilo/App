/**
 * Actor System Service - Cérebro AI Brain
 * 
 * PREMIUM FEATURE: Actor Model for Concurrent Processing
 * 
 * Implements the Actor Model pattern for:
 * - Concurrent message processing without race conditions
 * - Mailbox pattern for ordered message delivery
 * - Supervision strategies for fault tolerance
 * - Location transparency and scalability
 * 
 * Actors: QuotationActor, SupplierActor, InventoryActor
 * 
 * @module actorSystemService
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const ACTOR_STATUS = {
    IDLE: 'idle',
    PROCESSING: 'processing',
    STOPPED: 'stopped',
    FAILED: 'failed'
}

const SUPERVISION_STRATEGY = {
    RESTART: 'restart',         // Restart the failed actor
    STOP: 'stop',               // Stop the actor permanently
    ESCALATE: 'escalate',       // Escalate to parent supervisor
    RESUME: 'resume'            // Ignore failure, continue processing
}

const MESSAGE_PRIORITY = {
    HIGH: 0,
    NORMAL: 1,
    LOW: 2
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Message envelope for actor communication
 */
class Message {
    constructor(type, payload, options = {}) {
        this.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        this.type = type
        this.payload = payload
        this.sender = options.sender || null
        this.replyTo = options.replyTo || null
        this.priority = options.priority ?? MESSAGE_PRIORITY.NORMAL
        this.createdAt = Date.now()
        this.correlationId = options.correlationId || this.id
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAILBOX CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Priority queue mailbox for actors
 */
class Mailbox {
    constructor() {
        this.queue = []
        this.processing = false
    }

    /**
     * Add message to mailbox (sorted by priority)
     */
    enqueue(message) {
        // Insert in priority order
        let inserted = false
        for (let i = 0; i < this.queue.length; i++) {
            if (message.priority < this.queue[i].priority) {
                this.queue.splice(i, 0, message)
                inserted = true
                break
            }
        }
        if (!inserted) {
            this.queue.push(message)
        }
    }

    /**
     * Get next message from mailbox
     */
    dequeue() {
        return this.queue.shift() || null
    }

    /**
     * Check if mailbox has messages
     */
    hasMessages() {
        return this.queue.length > 0
    }

    /**
     * Get pending message count
     */
    size() {
        return this.queue.length
    }

    /**
     * Clear all messages
     */
    clear() {
        this.queue = []
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTOR BASE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Base Actor class with mailbox pattern
 */
class Actor {
    constructor(name, system) {
        this.name = name
        this.system = system
        this.mailbox = new Mailbox()
        this.status = ACTOR_STATUS.IDLE
        this.processedCount = 0
        this.failedCount = 0
        this.createdAt = Date.now()
        this.lastActive = null
        this.handlers = new Map()

        // Supervision
        this.supervisor = null
        this.supervisionStrategy = SUPERVISION_STRATEGY.RESTART
        this.maxRestarts = 3
        this.restartCount = 0
        this.restartWindow = 60000 // 1 minute
        this.lastRestartAt = null
    }

    /**
     * Register a message handler
     */
    on(messageType, handler) {
        this.handlers.set(messageType, handler)
        return this
    }

    /**
     * Send a message to this actor
     */
    send(message) {
        if (this.status === ACTOR_STATUS.STOPPED) {
            console.warn(`Actor ${this.name} is stopped, message dropped`)
            return false
        }

        this.mailbox.enqueue(message)
        this.processNext()
        return true
    }

    /**
     * Send message to another actor
     */
    tell(actorName, messageType, payload, options = {}) {
        const message = new Message(messageType, payload, {
            ...options,
            sender: this.name
        })
        return this.system.tell(actorName, message)
    }

    /**
     * Send message and wait for reply
     */
    async ask(actorName, messageType, payload, timeout = 5000) {
        return this.system.ask(actorName, messageType, payload, {
            sender: this.name,
            timeout
        })
    }

    /**
     * Process next message in mailbox
     */
    async processNext() {
        if (this.mailbox.processing || !this.mailbox.hasMessages()) {
            return
        }

        this.mailbox.processing = true
        this.status = ACTOR_STATUS.PROCESSING

        while (this.mailbox.hasMessages()) {
            const message = this.mailbox.dequeue()

            try {
                await this.handleMessage(message)
                this.processedCount++
                this.lastActive = Date.now()
            } catch (error) {
                this.failedCount++
                await this.handleFailure(error, message)
            }
        }

        this.mailbox.processing = false
        this.status = ACTOR_STATUS.IDLE
    }

    /**
     * Handle a single message
     */
    async handleMessage(message) {
        const handler = this.handlers.get(message.type)

        if (!handler) {
            // Check for default handler
            const defaultHandler = this.handlers.get('*')
            if (defaultHandler) {
                return defaultHandler(message.payload, message)
            }
            console.warn(`Actor ${this.name}: No handler for message type "${message.type}"`)
            return
        }

        const result = await handler(message.payload, message)

        // If message expects reply, send it back
        if (message.replyTo) {
            this.system.reply(message.replyTo, result)
        }

        return result
    }

    /**
     * Handle processing failure
     */
    async handleFailure(error, message) {
        console.error(`Actor ${this.name} failed on message:`, message.type, error)

        // Apply supervision strategy
        switch (this.supervisionStrategy) {
            case SUPERVISION_STRATEGY.RESTART:
                await this.restart()
                // Re-queue failed message
                this.mailbox.enqueue(message)
                break

            case SUPERVISION_STRATEGY.STOP:
                this.stop()
                break

            case SUPERVISION_STRATEGY.ESCALATE:
                if (this.supervisor) {
                    this.supervisor.handleChildFailure(this, error, message)
                }
                break

            case SUPERVISION_STRATEGY.RESUME:
                // Just continue
                break
        }
    }

    /**
     * Restart the actor
     */
    async restart() {
        const now = Date.now()

        // Check restart window
        if (this.lastRestartAt && (now - this.lastRestartAt) < this.restartWindow) {
            this.restartCount++
        } else {
            this.restartCount = 1
        }

        if (this.restartCount > this.maxRestarts) {
            console.error(`Actor ${this.name} exceeded max restarts, stopping`)
            this.stop()
            return
        }

        this.lastRestartAt = now
        this.status = ACTOR_STATUS.IDLE

        // Call lifecycle hook
        if (typeof this.onRestart === 'function') {
            await this.onRestart()
        }
    }

    /**
     * Stop the actor
     */
    stop() {
        this.status = ACTOR_STATUS.STOPPED
        this.mailbox.clear()

        // Call lifecycle hook
        if (typeof this.onStop === 'function') {
            this.onStop()
        }
    }

    /**
     * Get actor stats
     */
    getStats() {
        return {
            name: this.name,
            status: this.status,
            mailboxSize: this.mailbox.size(),
            processedCount: this.processedCount,
            failedCount: this.failedCount,
            restartCount: this.restartCount,
            uptime: Date.now() - this.createdAt,
            lastActive: this.lastActive
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTOR SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Actor System - manages actor lifecycle and communication
 */
class ActorSystem {
    constructor(name = 'padoca-actors') {
        this.name = name
        this.actors = new Map()
        this.pendingReplies = new Map()
        this.isShutdown = false
        this.createdAt = Date.now()
    }

    /**
     * Create and register an actor
     */
    createActor(name, ActorClass = Actor) {
        if (this.actors.has(name)) {
            throw new Error(`Actor "${name}" already exists`)
        }

        const actor = new ActorClass(name, this)
        this.actors.set(name, actor)
        return actor
    }

    /**
     * Get an actor by name
     */
    getActor(name) {
        return this.actors.get(name) || null
    }

    /**
     * Send message to an actor (fire-and-forget)
     */
    tell(actorName, message) {
        const actor = this.actors.get(actorName)

        if (!actor) {
            console.warn(`Actor "${actorName}" not found`)
            return false
        }

        return actor.send(message)
    }

    /**
     * Send message and wait for reply
     */
    ask(actorName, messageType, payload, options = {}) {
        return new Promise((resolve, reject) => {
            const { timeout = 5000, sender } = options

            const replyId = `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // Store pending reply handler
            this.pendingReplies.set(replyId, { resolve, reject })

            // Set timeout
            const timer = setTimeout(() => {
                this.pendingReplies.delete(replyId)
                reject(new Error(`Ask timeout for actor "${actorName}"`))
            }, timeout)

            // Create message with reply address
            const message = new Message(messageType, payload, {
                sender,
                replyTo: replyId
            })

            // Send message
            if (!this.tell(actorName, message)) {
                clearTimeout(timer)
                this.pendingReplies.delete(replyId)
                reject(new Error(`Failed to send to actor "${actorName}"`))
            }
        })
    }

    /**
     * Handle reply from actor
     */
    reply(replyId, result) {
        const pending = this.pendingReplies.get(replyId)

        if (pending) {
            this.pendingReplies.delete(replyId)
            pending.resolve(result)
        }
    }

    /**
     * Shutdown all actors
     */
    shutdown() {
        this.isShutdown = true

        for (const actor of this.actors.values()) {
            actor.stop()
        }

        this.actors.clear()
        this.pendingReplies.clear()

        console.log(`🎭 ActorSystem "${this.name}" shutdown`)
    }

    /**
     * Get system stats
     */
    getStats() {
        const actorStats = []
        for (const actor of this.actors.values()) {
            actorStats.push(actor.getStats())
        }

        return {
            name: this.name,
            actorCount: this.actors.size,
            pendingReplies: this.pendingReplies.size,
            uptime: Date.now() - this.createdAt,
            actors: actorStats
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED ACTORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quotation Actor - handles quotation processing
 */
class QuotationActor extends Actor {
    constructor(name, system) {
        super(name, system)
        this.initHandlers()
    }

    initHandlers() {
        this.on('CREATE_QUOTATION', async (payload) => {
            console.log('📋 Creating quotation:', payload.supplierId)
            // Process quotation creation
            return { status: 'created', quotationId: `q_${Date.now()}` }
        })

        this.on('SEND_QUOTATION', async (payload) => {
            console.log('📤 Sending quotation:', payload.quotationId)
            // Notify supplier actor
            await this.tell('supplier', 'QUOTATION_SENT', payload)
            return { status: 'sent' }
        })

        this.on('PROCESS_REPLY', async (payload) => {
            console.log('🤖 Processing supplier reply')
            // AI analysis would happen here
            return { status: 'processed', extractedData: {} }
        })
    }
}

/**
 * Supplier Actor - handles supplier operations
 */
class SupplierActor extends Actor {
    constructor(name, system) {
        super(name, system)
        this.initHandlers()
    }

    initHandlers() {
        this.on('QUOTATION_SENT', async (payload) => {
            console.log('📧 Supplier notified of quotation:', payload.quotationId)
            return { acknowledged: true }
        })

        this.on('RATE_SUPPLIER', async (payload) => {
            console.log('⭐ Rating supplier:', payload.supplierId)
            return { rated: true }
        })

        this.on('FIND_ALTERNATIVES', async (payload) => {
            console.log('🔍 Finding alternative suppliers for:', payload.productId)
            return { alternatives: [] }
        })
    }
}

/**
 * Inventory Actor - handles stock operations
 */
class InventoryActor extends Actor {
    constructor(name, system) {
        super(name, system)
        this.initHandlers()
    }

    initHandlers() {
        this.on('CHECK_STOCK', async (payload) => {
            console.log('📦 Checking stock for:', payload.productId)
            return { inStock: true, quantity: 100 }
        })

        this.on('UPDATE_STOCK', async (payload) => {
            console.log('🔄 Updating stock:', payload.productId, payload.delta)
            return { updated: true }
        })

        this.on('LOW_STOCK_ALERT', async (payload) => {
            console.log('⚠️ Low stock alert:', payload.productId)
            // Trigger auto-quotation
            await this.tell('quotation', 'CREATE_QUOTATION', {
                productId: payload.productId,
                reason: 'low_stock'
            })
            return { alertSent: true }
        })
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

let systemInstance = null

/**
 * Get or create the actor system singleton
 */
function getActorSystem() {
    if (!systemInstance) {
        systemInstance = new ActorSystem('padoca-cerebro')

        // Create default actors
        systemInstance.createActor('quotation', QuotationActor)
        systemInstance.createActor('supplier', SupplierActor)
        systemInstance.createActor('inventory', InventoryActor)

        console.log('🎭 ActorSystem initialized with default actors')
    }
    return systemInstance
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const ActorSystemService = {
    // System
    getActorSystem,

    // Classes (for extension)
    Actor,
    ActorSystem,
    Mailbox,
    Message,

    // Specialized Actors
    QuotationActor,
    SupplierActor,
    InventoryActor,

    // Constants
    ACTOR_STATUS,
    SUPERVISION_STRATEGY,
    MESSAGE_PRIORITY
}

export default ActorSystemService
