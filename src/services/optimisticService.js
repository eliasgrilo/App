/**
 * Optimistic Updates Service - Apple-Quality UI Responsiveness
 * 
 * Provides instant UI feedback with automatic rollback on errors.
 * Implements retry with exponential backoff and operation queue.
 */

// ═══════════════════════════════════════════════════════════════════════════
// OPERATION QUEUE
// ═══════════════════════════════════════════════════════════════════════════

const operationQueue = new Map()
let operationIdCounter = 0

/**
 * Generate unique operation ID
 */
const generateOperationId = () => {
    return `op_${Date.now()}_${++operationIdCounter}`
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTIMISTIC UPDATE CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class OptimisticUpdate {
    constructor({
        id = generateOperationId(),
        description = 'Operation',
        optimisticState,
        previousState,
        asyncOperation,
        onSuccess,
        onError,
        onRollback,
        maxRetries = 3,
        retryDelayMs = 1000
    }) {
        this.id = id
        this.description = description
        this.optimisticState = optimisticState
        this.previousState = previousState
        this.asyncOperation = asyncOperation
        this.onSuccess = onSuccess
        this.onError = onError
        this.onRollback = onRollback
        this.maxRetries = maxRetries
        this.retryDelayMs = retryDelayMs
        this.retryCount = 0
        this.status = 'pending' // pending, success, failed, rolledback
        this.error = null
        this.createdAt = Date.now()
    }

    /**
     * Execute with retry logic
     */
    async execute() {
        while (this.retryCount <= this.maxRetries) {
            try {
                const result = await this.asyncOperation()
                this.status = 'success'
                this.onSuccess?.(result)
                return { success: true, result }
            } catch (error) {
                this.retryCount++
                this.error = error

                if (this.retryCount > this.maxRetries) {
                    this.status = 'failed'
                    this.onError?.(error)
                    return { success: false, error }
                }

                // Exponential backoff
                const delay = this.retryDelayMs * Math.pow(2, this.retryCount - 1)
                console.log(`⏳ Retry ${this.retryCount}/${this.maxRetries} in ${delay}ms: ${this.description}`)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
    }

    /**
     * Rollback to previous state
     */
    rollback() {
        this.status = 'rolledback'
        this.onRollback?.(this.previousState)
        return this.previousState
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTIMISTIC SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export const OptimisticService = {
    /**
     * Execute an optimistic update
     * @param {Object} config - Update configuration
     * @returns {Promise<{ success: boolean, result?: any, error?: Error }>}
     */
    async execute({
        description,
        getData,          // () => currentState
        setData,          // (newState) => void
        optimisticValue,  // The value to show immediately
        persistOperation, // async () => actual result
        onSuccess,
        onError,
        maxRetries = 3
    }) {
        // 1. Capture current state
        const previousState = getData()

        // 2. Apply optimistic update immediately
        setData(optimisticValue)
        console.log(`⚡ Optimistic: ${description}`)

        // 3. Create operation
        const operation = new OptimisticUpdate({
            description,
            optimisticState: optimisticValue,
            previousState,
            asyncOperation: persistOperation,
            maxRetries,
            onSuccess: (result) => {
                console.log(`✅ Confirmed: ${description}`)
                onSuccess?.(result)
            },
            onError: (error) => {
                console.error(`❌ Failed: ${description}`, error)
                // Rollback on final failure
                setData(previousState)
                onError?.(error)
            },
            onRollback: () => {
                console.log(`↩️ Rolled back: ${description}`)
            }
        })

        // 4. Track operation
        operationQueue.set(operation.id, operation)

        // 5. Execute async operation
        const result = await operation.execute()

        // 6. Cleanup
        operationQueue.delete(operation.id)

        return result
    },

    /**
     * Execute multiple operations in batch
     */
    async executeBatch(operations) {
        const results = await Promise.allSettled(
            operations.map(op => this.execute(op))
        )

        return {
            success: results.every(r => r.status === 'fulfilled' && r.value?.success),
            results: results.map(r => r.value || r.reason)
        }
    },

    /**
     * Get pending operations
     */
    getPendingOperations() {
        return Array.from(operationQueue.values()).filter(op => op.status === 'pending')
    },

    /**
     * Rollback all pending operations
     */
    rollbackAll() {
        const pending = this.getPendingOperations()
        pending.forEach(op => op.rollback())
        operationQueue.clear()
        return pending.length
    },

    /**
     * Create a hook-friendly wrapper
     */
    createUpdater(setState) {
        return {
            update: async (description, newValue, persistFn) => {
                let previousValue
                return this.execute({
                    description,
                    getData: () => previousValue,
                    setData: (val) => {
                        setState(prev => {
                            previousValue = prev
                            return val
                        })
                    },
                    optimisticValue: newValue,
                    persistOperation: persistFn
                })
            },
            updateItem: async (description, id, updateFn, persistFn) => {
                let previousList
                return this.execute({
                    description,
                    getData: () => previousList,
                    setData: (val) => {
                        setState(prev => {
                            previousList = prev
                            return prev.map(item => item.id === id ? updateFn(item) : item)
                        })
                    },
                    optimisticValue: null, // Will be computed in setData
                    persistOperation: persistFn
                })
            },
            removeItem: async (description, id, persistFn) => {
                let previousList
                return this.execute({
                    description,
                    getData: () => previousList,
                    setData: (val) => {
                        setState(prev => {
                            previousList = prev
                            return prev.filter(item => item.id !== id)
                        })
                    },
                    optimisticValue: null,
                    persistOperation: persistFn
                })
            },
            addItem: async (description, newItem, persistFn) => {
                let previousList
                return this.execute({
                    description,
                    getData: () => previousList,
                    setData: (val) => {
                        setState(prev => {
                            previousList = prev
                            return [newItem, ...prev]
                        })
                    },
                    optimisticValue: null,
                    persistOperation: persistFn
                })
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react'

/**
 * React hook for optimistic updates
 * @param {any} initialValue - Initial state value
 * @returns {[any, Function, Object]} - [state, optimisticUpdate, status]
 */
export const useOptimistic = (initialValue) => {
    const [state, setState] = useState(initialValue)
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState(null)
    const previousValue = useRef(initialValue)

    const optimisticUpdate = useCallback(async (newValue, persistFn, options = {}) => {
        const { onSuccess, onError } = options

        // Store previous value for rollback
        previousValue.current = state
        setIsPending(true)
        setError(null)

        // Apply optimistic update
        setState(newValue)

        try {
            const result = await persistFn()
            setIsPending(false)
            onSuccess?.(result)
            return { success: true, result }
        } catch (err) {
            // Rollback
            setState(previousValue.current)
            setIsPending(false)
            setError(err)
            onError?.(err)
            return { success: false, error: err }
        }
    }, [state])

    const rollback = useCallback(() => {
        setState(previousValue.current)
        setIsPending(false)
        setError(null)
    }, [])

    return [
        state,
        optimisticUpdate,
        {
            isPending,
            error,
            rollback,
            setState // For direct updates when needed
        }
    ]
}

/**
 * Hook for list operations with optimistic updates
 */
export const useOptimisticList = (initialList = []) => {
    const [list, setList] = useState(initialList)
    const [pendingOps, setPendingOps] = useState(new Set())
    const previousList = useRef(initialList)

    const addOptimistic = useCallback(async (item, persistFn) => {
        const opId = item.id || generateOperationId()
        previousList.current = list
        setPendingOps(prev => new Set([...prev, opId]))

        setList(prev => [{ ...item, id: opId, _pending: true }, ...prev])

        try {
            const result = await persistFn(item)
            setList(prev => prev.map(i => i.id === opId ? { ...result, _pending: false } : i))
            setPendingOps(prev => { prev.delete(opId); return new Set(prev) })
            return { success: true, result }
        } catch (error) {
            setList(prev => prev.filter(i => i.id !== opId))
            setPendingOps(prev => { prev.delete(opId); return new Set(prev) })
            return { success: false, error }
        }
    }, [list])

    const updateOptimistic = useCallback(async (id, updateFn, persistFn) => {
        previousList.current = list
        setPendingOps(prev => new Set([...prev, id]))

        setList(prev => prev.map(item =>
            item.id === id ? { ...updateFn(item), _pending: true } : item
        ))

        try {
            const result = await persistFn()
            setList(prev => prev.map(item =>
                item.id === id ? { ...item, ...result, _pending: false } : item
            ))
            setPendingOps(prev => { prev.delete(id); return new Set(prev) })
            return { success: true, result }
        } catch (error) {
            setList(previousList.current)
            setPendingOps(prev => { prev.delete(id); return new Set(prev) })
            return { success: false, error }
        }
    }, [list])

    const removeOptimistic = useCallback(async (id, persistFn) => {
        previousList.current = list
        setPendingOps(prev => new Set([...prev, id]))

        setList(prev => prev.filter(item => item.id !== id))

        try {
            await persistFn()
            setPendingOps(prev => { prev.delete(id); return new Set(prev) })
            return { success: true }
        } catch (error) {
            setList(previousList.current)
            setPendingOps(prev => { prev.delete(id); return new Set(prev) })
            return { success: false, error }
        }
    }, [list])

    return {
        list,
        setList,
        addOptimistic,
        updateOptimistic,
        removeOptimistic,
        pendingOps,
        hasPendingOps: pendingOps.size > 0,
        rollback: () => setList(previousList.current)
    }
}

export default OptimisticService
