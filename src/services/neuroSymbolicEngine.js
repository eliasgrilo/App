/**
 * Neuro-Symbolic AI Engine - Hybrid Intelligence System
 * 
 * PREMIUM FEATURE #6: Neuro-Symbolic AI
 * 
 * Combines the best of two AI paradigms:
 * - NEURAL: LLM (Gemini) for understanding natural language, context, and intent
 * - SYMBOLIC: Rule engine for precise validation, math, and business logic
 * 
 * This hybrid approach prevents LLM "hallucination" for critical business data
 * while leveraging LLM's powerful language understanding capabilities.
 * 
 * Use cases:
 * - Parse supplier emails (Neural) → Validate extracted data (Symbolic)
 * - Understand product descriptions (Neural) → Match exact products (Symbolic)
 * - Interpret negotiation context (Neural) → Calculate final prices (Symbolic)
 * 
 * @module neuroSymbolicEngine
 */

import { eventStore } from './eventStoreService';
import { vectorEmbedding } from './vectorEmbeddingService';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta',
    MODEL: 'gemini-1.5-flash',
    MAX_TOKENS: 2048,
    TEMPERATURE: 0.3, // Lower for more consistent outputs
    CONFIDENCE_THRESHOLD: 0.75,
    VALIDATION_STRICTNESS: 'medium' // 'strict' | 'medium' | 'lenient'
};

let apiKey = null;

// ═══════════════════════════════════════════════════════════════════════════
// SYMBOLIC RULE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rule Engine - Precise symbolic validation
 * Rules are deterministic and mathematically exact
 */
class RuleEngine {
    constructor() {
        this.rules = new Map();
        this.registerDefaultRules();
    }

    registerDefaultRules() {
        // ─────────────────────────────────────────────────
        // NUMBER VALIDATION RULES
        // ─────────────────────────────────────────────────
        this.registerRule('isPositiveNumber', (value) => ({
            valid: typeof value === 'number' && !isNaN(value) && value > 0,
            message: value > 0 ? 'Valid positive number' : 'Must be a positive number'
        }));

        this.registerRule('isValidPrice', (value, context = {}) => {
            const min = context.minPrice || 0.01;
            const max = context.maxPrice || 1000000;
            const isValid = typeof value === 'number' && value >= min && value <= max;
            return {
                valid: isValid,
                message: isValid ? 'Valid price' : `Price must be between R$${min} and R$${max}`,
                correctedValue: isValid ? value : Math.max(min, Math.min(max, value || min))
            };
        });

        this.registerRule('isValidQuantity', (value) => {
            const num = parseInt(value, 10);
            const isValid = Number.isInteger(num) && num > 0;
            return {
                valid: isValid,
                message: isValid ? 'Valid quantity' : 'Quantity must be a positive integer',
                correctedValue: isValid ? num : Math.max(1, Math.round(Math.abs(num)) || 1)
            };
        });

        // ─────────────────────────────────────────────────
        // DATE VALIDATION RULES
        // ─────────────────────────────────────────────────
        this.registerRule('isValidDate', (value) => {
            const date = new Date(value);
            const isValid = !isNaN(date.getTime());
            return {
                valid: isValid,
                message: isValid ? 'Valid date' : 'Invalid date format',
                parsedDate: isValid ? date.toISOString() : null
            };
        });

        this.registerRule('isFutureDate', (value) => {
            const date = new Date(value);
            const now = new Date();
            const isValid = !isNaN(date.getTime()) && date > now;
            return {
                valid: isValid,
                message: isValid ? 'Valid future date' : 'Date must be in the future'
            };
        });

        this.registerRule('isWithinDays', (value, context = {}) => {
            const date = new Date(value);
            const now = new Date();
            const maxDays = context.maxDays || 30;
            const daysDiff = (date - now) / (1000 * 60 * 60 * 24);
            const isValid = daysDiff >= 0 && daysDiff <= maxDays;
            return {
                valid: isValid,
                message: isValid ? 'Within acceptable range' : `Date must be within ${maxDays} days`,
                daysFromNow: Math.round(daysDiff)
            };
        });

        // ─────────────────────────────────────────────────
        // STRING VALIDATION RULES
        // ─────────────────────────────────────────────────
        this.registerRule('isNonEmptyString', (value) => ({
            valid: typeof value === 'string' && value.trim().length > 0,
            message: value?.trim()?.length > 0 ? 'Valid string' : 'String cannot be empty'
        }));

        this.registerRule('matchesPattern', (value, context = {}) => {
            const pattern = context.pattern || /.+/;
            const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
            const isValid = regex.test(value);
            return {
                valid: isValid,
                message: isValid ? 'Pattern matched' : `Value does not match pattern: ${pattern}`
            };
        });

        // ─────────────────────────────────────────────────
        // BUSINESS LOGIC RULES
        // ─────────────────────────────────────────────────
        this.registerRule('isPriceWithinVariance', (value, context = {}) => {
            const basePrice = context.basePrice || value;
            const maxVariance = context.maxVariance || 0.20; // 20% default
            const variance = Math.abs((value - basePrice) / basePrice);
            const isValid = variance <= maxVariance;
            return {
                valid: isValid,
                message: isValid ? 'Price within acceptable variance' :
                    `Price variance (${(variance * 100).toFixed(1)}%) exceeds maximum (${(maxVariance * 100).toFixed(1)}%)`,
                variance: variance,
                variancePercent: (variance * 100).toFixed(2)
            };
        });

        this.registerRule('isValidSupplier', (value, context = {}) => {
            const knownSuppliers = context.knownSuppliers || [];
            const isKnown = knownSuppliers.length === 0 ||
                knownSuppliers.some(s =>
                    s.id === value ||
                    s.name?.toLowerCase() === value?.toLowerCase()
                );
            return {
                valid: isKnown,
                message: isKnown ? 'Known supplier' : 'Supplier not found in database',
                matchedSupplier: knownSuppliers.find(s =>
                    s.id === value || s.name?.toLowerCase() === value?.toLowerCase()
                )
            };
        });

        this.registerRule('orderTotalMatches', (items, context = {}) => {
            if (!Array.isArray(items)) return { valid: false, message: 'Items must be an array' };

            const calculatedTotal = items.reduce((sum, item) => {
                const price = parseFloat(item.price) ?? 0;
                const quantity = parseInt(item.quantity, 10) || 0;
                return sum + (price * quantity);
            }, 0);

            const declaredTotal = context.declaredTotal || calculatedTotal;
            const tolerance = context.tolerance || 0.01;
            const isValid = Math.abs(calculatedTotal - declaredTotal) <= tolerance;

            return {
                valid: isValid,
                message: isValid ? 'Total matches' : `Total mismatch: calculated R$${calculatedTotal.toFixed(2)}, declared R$${declaredTotal.toFixed(2)}`,
                calculatedTotal,
                declaredTotal,
                difference: Math.abs(calculatedTotal - declaredTotal)
            };
        });
    }

    registerRule(name, validator) {
        this.rules.set(name, validator);
    }

    validate(ruleName, value, context = {}) {
        const rule = this.rules.get(ruleName);
        if (!rule) {
            return { valid: false, message: `Unknown rule: ${ruleName}` };
        }
        return rule(value, context);
    }

    validateMultiple(validations) {
        const results = [];
        let allValid = true;

        for (const { rule, value, context, field } of validations) {
            const result = this.validate(rule, value, context);
            results.push({ field, rule, value, ...result });
            if (!result.valid) allValid = false;
        }

        return {
            allValid,
            results,
            errors: results.filter(r => !r.valid),
            summary: allValid ? 'All validations passed' :
                `${results.filter(r => !r.valid).length} validation(s) failed`
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// NEURAL (LLM) PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Neural Processor - LLM-based understanding
 */
class NeuralProcessor {
    constructor() {
        this.extractionPrompts = {
            quotation: this.getQuotationExtractionPrompt(),
            productMatch: this.getProductMatchPrompt(),
            negotiation: this.getNegotiationPrompt()
        };
    }

    async processWithLLM(input, taskType, context = {}) {
        if (!apiKey) {
            throw new Error('Neuro-Symbolic Engine not initialized. Call initialize(apiKey) first.');
        }

        const prompt = this.buildPrompt(input, taskType, context);

        try {
            const response = await fetch(
                `${CONFIG.GEMINI_API_BASE}/models/${CONFIG.MODEL}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: CONFIG.TEMPERATURE,
                            maxOutputTokens: CONFIG.MAX_TOKENS,
                            responseMimeType: 'application/json'
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`LLM request failed: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('Empty response from LLM');
            }

            // Parse JSON response
            const parsed = JSON.parse(text);
            return {
                success: true,
                result: parsed,
                confidence: parsed.confidence || 0.5,
                source: 'neural'
            };
        } catch (error) {
            console.error('[Neural] LLM processing error:', error);
            return {
                success: false,
                error: error.message,
                source: 'neural'
            };
        }
    }

    buildPrompt(input, taskType, context) {
        const basePrompt = this.extractionPrompts[taskType] || this.getGenericExtractionPrompt();

        return `${basePrompt}

INPUT DATA:
${typeof input === 'string' ? input : JSON.stringify(input, null, 2)}

${context.additionalInstructions ? `ADDITIONAL INSTRUCTIONS:\n${context.additionalInstructions}` : ''}

Respond with valid JSON only.`;
    }

    getQuotationExtractionPrompt() {
        return `You are an AI assistant specialized in extracting structured data from supplier quotation emails for a bakery/pizzeria.

TASK: Extract the following fields from the email text:
- supplierName: The name of the supplier company
- products: Array of products with { name, quantity, unit, unitPrice, totalPrice }
- deliveryDate: Expected delivery date (ISO format if possible)
- paymentTerms: Payment conditions mentioned
- validUntil: Quote expiration date
- totalAmount: Total order value

RULES:
1. All prices should be numbers (not strings)
2. Quantities should be integers
3. Use null for missing information
4. Include a "confidence" field (0 to 1) indicating extraction confidence
5. Include "extractedFields" array listing which fields were successfully extracted

RESPONSE FORMAT:
{
  "supplierName": "string or null",
  "products": [{ "name": "string", "quantity": number, "unit": "string", "unitPrice": number, "totalPrice": number }],
  "deliveryDate": "YYYY-MM-DD or null",
  "paymentTerms": "string or null",
  "validUntil": "YYYY-MM-DD or null",
  "totalAmount": number or null,
  "confidence": 0.0-1.0,
  "extractedFields": ["field1", "field2"]
}`;
    }

    getProductMatchPrompt() {
        return `You are an AI assistant that matches product names from supplier catalogs to internal product database.

TASK: Given a product name from a supplier, identify the best matching product from the internal database.

Consider:
- Variations in spelling (Tomate vs Pomodoro)
- Different naming conventions
- Unit variations (kg vs kilo)
- Brand names vs generic names

RESPONSE FORMAT:
{
  "inputProduct": "original name",
  "bestMatch": { "id": "string", "name": "string", "similarity": 0.0-1.0 },
  "alternativeMatches": [{ "id": "string", "name": "string", "similarity": 0.0-1.0 }],
  "confidence": 0.0-1.0,
  "isNewProduct": boolean
}`;
    }

    getNegotiationPrompt() {
        return `You are an AI assistant that analyzes supplier negotiations and recommends actions.

TASK: Analyze the negotiation context and provide recommendations.

Consider:
- Price trends for this product
- Supplier reliability history
- Current market conditions
- Urgency of need

RESPONSE FORMAT:
{
  "recommendation": "ACCEPT" | "COUNTER_OFFER" | "REJECT" | "WAIT",
  "suggestedCounterPrice": number or null,
  "reasoning": "string explaining the recommendation",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "confidence": 0.0-1.0
}`;
    }

    getGenericExtractionPrompt() {
        return `You are an AI assistant that extracts structured data from text.

TASK: Extract key information from the provided text and return it as structured JSON.

Include a "confidence" field (0 to 1) indicating your confidence in the extraction.`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// NEURO-SYMBOLIC ENGINE (HYBRID)
// ═══════════════════════════════════════════════════════════════════════════

class NeuroSymbolicEngine {
    constructor() {
        this.ruleEngine = new RuleEngine();
        this.neuralProcessor = new NeuralProcessor();
        this.processingHistory = [];
    }

    /**
     * Initialize the engine with API key
     */
    initialize(key) {
        apiKey = key;
        console.log('[NeuroSymbolic] Engine initialized');
    }

    /**
     * Check if engine is ready
     */
    isReady() {
        return !!apiKey;
    }

    /**
     * Hybrid processing: Neural understanding + Symbolic validation
     * 
     * @param {string|Object} input - Raw input (email text, product data, etc.)
     * @param {string} taskType - Type of task ('quotation', 'productMatch', 'negotiation')
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - Validated, structured output
     */
    async process(input, taskType = 'quotation', options = {}) {
        const startTime = Date.now();
        const processingId = `nse_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        try {
            // Step 1: NEURAL - Extract structured data using LLM
            console.log('[NeuroSymbolic] Step 1: Neural extraction...');
            const neuralResult = await this.neuralProcessor.processWithLLM(input, taskType, options);

            if (!neuralResult.success) {
                return this.createFailureResult(processingId, 'NEURAL_FAILED', neuralResult.error, startTime);
            }

            // Step 2: SYMBOLIC - Validate extracted data
            console.log('[NeuroSymbolic] Step 2: Symbolic validation...');
            const validationResult = this.validateExtractedData(neuralResult.result, taskType, options);

            // Step 3: Merge and reconcile
            console.log('[NeuroSymbolic] Step 3: Reconciliation...');
            const finalResult = this.reconcile(neuralResult.result, validationResult, options);

            // Log processing event
            await this.logProcessingEvent(processingId, taskType, finalResult, Date.now() - startTime);

            // Store in history
            this.processingHistory.push({
                id: processingId,
                timestamp: new Date().toISOString(),
                taskType,
                inputPreview: typeof input === 'string' ? input.substring(0, 100) : 'object',
                result: finalResult,
                executionTime: Date.now() - startTime
            });

            return {
                processingId,
                success: true,
                ...finalResult,
                executionTime: Date.now() - startTime
            };

        } catch (error) {
            console.error('[NeuroSymbolic] Processing error:', error);
            return this.createFailureResult(processingId, 'PROCESSING_ERROR', error.message, startTime);
        }
    }

    /**
     * Validate extracted data using symbolic rules
     */
    validateExtractedData(data, taskType, options) {
        const validations = [];

        switch (taskType) {
            case 'quotation':
                // Validate quotation fields
                if (data.totalAmount !== undefined) {
                    validations.push({
                        field: 'totalAmount',
                        rule: 'isValidPrice',
                        value: data.totalAmount,
                        context: { minPrice: 0.01, maxPrice: 10000000 }
                    });
                }

                if (data.products && Array.isArray(data.products)) {
                    data.products.forEach((product, i) => {
                        validations.push({
                            field: `products[${i}].unitPrice`,
                            rule: 'isValidPrice',
                            value: product.unitPrice,
                            context: {}
                        });
                        validations.push({
                            field: `products[${i}].quantity`,
                            rule: 'isValidQuantity',
                            value: product.quantity
                        });
                    });
                }

                if (data.deliveryDate) {
                    validations.push({
                        field: 'deliveryDate',
                        rule: 'isValidDate',
                        value: data.deliveryDate
                    });
                }

                if (data.validUntil) {
                    validations.push({
                        field: 'validUntil',
                        rule: 'isFutureDate',
                        value: data.validUntil
                    });
                }
                break;

            case 'productMatch':
                if (data.bestMatch?.similarity !== undefined) {
                    validations.push({
                        field: 'bestMatch.similarity',
                        rule: 'isPositiveNumber',
                        value: data.bestMatch.similarity
                    });
                }
                break;

            case 'negotiation':
                if (data.suggestedCounterPrice) {
                    validations.push({
                        field: 'suggestedCounterPrice',
                        rule: 'isValidPrice',
                        value: data.suggestedCounterPrice
                    });
                }
                break;
        }

        return this.ruleEngine.validateMultiple(validations);
    }

    /**
     * Reconcile neural outputs with symbolic validation
     */
    reconcile(neuralData, validationResult, options) {
        const reconciled = { ...neuralData };
        const corrections = [];
        const warnings = [];

        for (const result of validationResult.results) {
            if (!result.valid) {
                // If validation failed but we have a corrected value, use it
                if (result.correctedValue !== undefined) {
                    this.setNestedValue(reconciled, result.field, result.correctedValue);
                    corrections.push({
                        field: result.field,
                        original: result.value,
                        corrected: result.correctedValue,
                        reason: result.message
                    });
                } else {
                    warnings.push({
                        field: result.field,
                        issue: result.message
                    });
                }
            }
        }

        // Calculate final confidence
        const neuralConfidence = neuralData.confidence || 0.5;
        const validationPenalty = validationResult.errors.length * 0.1;
        const finalConfidence = Math.max(0, Math.min(1, neuralConfidence - validationPenalty));

        return {
            data: reconciled,
            validation: {
                allValid: validationResult.allValid,
                errorCount: validationResult.errors.length,
                errors: validationResult.errors
            },
            corrections,
            warnings,
            confidence: {
                neural: neuralConfidence,
                final: finalConfidence,
                level: this.getConfidenceLevel(finalConfidence)
            },
            isReliable: finalConfidence >= CONFIG.CONFIDENCE_THRESHOLD && validationResult.allValid
        };
    }

    /**
     * Set a nested value in an object using dot notation
     */
    setNestedValue(obj, path, value) {
        const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current)) current[parts[i]] = {};
            current = current[parts[i]];
        }

        current[parts[parts.length - 1]] = value;
    }

    /**
     * Get confidence level description
     */
    getConfidenceLevel(confidence) {
        if (confidence >= 0.9) return 'VERY_HIGH';
        if (confidence >= 0.75) return 'HIGH';
        if (confidence >= 0.5) return 'MEDIUM';
        if (confidence >= 0.25) return 'LOW';
        return 'VERY_LOW';
    }

    /**
     * Create failure result object
     */
    createFailureResult(processingId, errorType, errorMessage, startTime) {
        return {
            processingId,
            success: false,
            error: {
                type: errorType,
                message: errorMessage
            },
            executionTime: Date.now() - startTime
        };
    }

    /**
     * Log processing event to event store
     */
    async logProcessingEvent(processingId, taskType, result, executionTime) {
        try {
            if (eventStore) {
                await eventStore.append({
                    eventType: 'NEURO_SYMBOLIC_PROCESSED',
                    aggregateType: 'neuroSymbolic',
                    aggregateId: processingId,
                    payload: {
                        taskType,
                        confidence: result.confidence?.final,
                        isReliable: result.isReliable,
                        correctionCount: result.corrections?.length || 0,
                        warningCount: result.warnings?.length || 0,
                        executionTime
                    }
                });
            }
        } catch (error) {
            console.warn('[NeuroSymbolic] Failed to log event:', error.message);
        }
    }

    // ─────────────────────────────────────────────────
    // CONVENIENCE METHODS
    // ─────────────────────────────────────────────────

    /**
     * Parse a quotation email
     */
    async parseQuotationEmail(emailContent, senderInfo = {}) {
        return this.process(emailContent, 'quotation', {
            additionalInstructions: senderInfo.name
                ? `The email is from supplier: ${senderInfo.name}`
                : undefined
        });
    }

    /**
     * Match a product name to database
     */
    async matchProduct(productName, productDatabase = []) {
        const input = {
            productName,
            availableProducts: productDatabase.slice(0, 50).map(p => ({
                id: p.id,
                name: p.name
            }))
        };
        return this.process(input, 'productMatch');
    }

    /**
     * Analyze negotiation and get recommendation
     */
    async analyzeNegotiation(negotiationContext) {
        return this.process(negotiationContext, 'negotiation');
    }

    /**
     * Direct symbolic validation (no LLM)
     */
    validateData(data, rules) {
        return this.ruleEngine.validateMultiple(
            rules.map(r => ({ ...r, value: data[r.field] || r.value }))
        );
    }

    /**
     * Get engine metrics
     */
    getMetrics() {
        const recentProcessing = this.processingHistory.slice(-100);

        return {
            totalProcessed: this.processingHistory.length,
            averageExecutionTime: recentProcessing.length > 0
                ? recentProcessing.reduce((sum, p) => sum + p.executionTime, 0) / recentProcessing.length
                : 0,
            successRate: recentProcessing.length > 0
                ? recentProcessing.filter(p => p.result?.success !== false).length / recentProcessing.length
                : 0,
            averageConfidence: recentProcessing.length > 0
                ? recentProcessing
                    .filter(p => p.result?.confidence?.final)
                    .reduce((sum, p) => sum + p.result.confidence.final, 0) /
                recentProcessing.filter(p => p.result?.confidence?.final).length || 0
                : 0,
            recentTasks: recentProcessing.slice(-10).map(p => ({
                id: p.id,
                taskType: p.taskType,
                confidence: p.result?.confidence?.final,
                executionTime: p.executionTime
            }))
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const neuroSymbolicEngine = new NeuroSymbolicEngine();

// Export classes for custom instantiation
export { RuleEngine, NeuralProcessor, NeuroSymbolicEngine };

export default neuroSymbolicEngine;
