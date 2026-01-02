/**
 * Gemini AI Service - Cognitive Email Processing
 * Uses Google Gemini API for intelligent email analysis
 * Extracts pricing, delivery dates, and availability from supplier responses
 */

// Gemini API configuration
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Initialize Gemini with API key
 * @param {string} apiKey - Google AI API key
 */
let geminiApiKey = null;

export function initializeGemini(apiKey) {
    geminiApiKey = apiKey;
    console.log('✅ Gemini AI initialized');
}

/**
 * Check if Gemini is initialized
 */
export function isGeminiReady() {
    return !!geminiApiKey;
}

/**
 * Generate content using Gemini
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} - Generated text
 */
async function generateContent(prompt) {
    if (!geminiApiKey) {
        throw new Error('Gemini API key not configured. Call initializeGemini() first.');
    }

    const response = await fetch(
        `${GEMINI_API_BASE}/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.2, // Low temperature for extraction accuracy
                    maxOutputTokens: 1024
                }
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Generate a professional quotation email
 * @param {Object} options - Email options
 * @param {string} options.supplierName - Supplier name
 * @param {Array} options.items - Items to quote
 * @param {string} options.senderName - Sender name
 * @returns {Promise<Object>} - Generated email { subject, body }
 */
export async function generateQuotationEmail({ supplierName, items, senderName = 'Equipe Padoca' }) {
    const itemsList = items.map(item =>
        `- ${item.name}: ${item.quantityToOrder} ${item.unit || 'unidades'}`
    ).join('\n');

    const prompt = `
Você é um assistente de compras profissional. Gere um email formal em português brasileiro 
solicitando cotação para os seguintes itens:

Fornecedor: ${supplierName}
Itens:
${itemsList}

Requisitos:
1. Tom profissional mas cordial
2. Solicitar preço unitário e prazo de entrega
3. Mencionar que aguarda resposta em até 48h
4. Assinar como "${senderName}"

Responda APENAS com o email, sem explicações adicionais.
Formato:
ASSUNTO: [linha de assunto]
CORPO:
[corpo do email]
`;

    try {
        const result = await generateContent(prompt);

        // Parse the response
        const subjectMatch = result.match(/ASSUNTO:\s*(.+)/i);
        const bodyMatch = result.match(/CORPO:\s*([\s\S]+)/i);

        return {
            subject: subjectMatch?.[1]?.trim() || `Solicitação de Cotação - ${new Date().toLocaleDateString('pt-BR')}`,
            body: bodyMatch?.[1]?.trim() || result
        };
    } catch (error) {
        console.error('Gemini email generation failed:', error);
        // Fallback to template
        return {
            subject: `Solicitação de Cotação - ${new Date().toLocaleDateString('pt-BR')}`,
            body: `Prezado(a) ${supplierName},\n\nSolicitamos cotação para os seguintes itens:\n${itemsList}\n\nAguardamos retorno.\n\nAtenciosamente,\n${senderName}`
        };
    }
}

/**
 * Analyze supplier email response using AI
 * Extracts structured data from free-form email text
 * @param {string} emailBody - The email body text
 * @param {Array} expectedItems - Items we requested quotes for
 * @returns {Promise<Object>} - Extracted data
 */
export async function analyzeSupplierResponse(emailBody, expectedItems = []) {
    const itemNames = expectedItems.map(i => i.name).join(', ');

    const prompt = `You are a specialized assistant for analyzing commercial emails from suppliers.
The email may be in ENGLISH or PORTUGUESE - analyze it in whichever language it is written.

CRITICAL EXTRACTION RULES:
1. PRICES: Output as decimal number (12.50 format). Convert from any format (R$ 12,50 → 12.50, $12.50 → 12.50)
2. ITEMS: Use EXACTLY the names as they appear in the email
3. DATES: Convert to YYYY-MM-DD format
4. If an item does NOT have an explicit price, return unitPrice: null (DO NOT invent prices)

Supplier email:
"""
${emailBody}
"""

${itemNames ? `Itens esperados na cotação: ${itemNames}\nTente encontrar correspondência para cada um destes itens no email.` : ''}

PROBLEMAS A IDENTIFICAR:
- Itens indisponíveis ou em falta
- Atrasos na entrega
- Quantidades parciais disponíveis
- Preços alterados ou condições especiais

Retorne APENAS JSON válido (SEM markdown, SEM \`\`\`, SEM texto explicativo):
{
    "hasQuote": boolean,
    "items": [
        {
            "name": "nome EXATO do item como aparece no email",
            "unitPrice": number | null,
            "availableQuantity": number | null,
            "requestedQuantity": number | null,
            "unit": "kg | un | cx | L | etc",
            "available": boolean,
            "partialAvailability": boolean,
            "unavailableReason": "motivo" | null
        }
    ],
    "deliveryDate": "YYYY-MM-DD" | null,
    "deliveryDays": number | null,
    "hasDelay": boolean,
    "delayReason": "motivo" | null,
    "paymentTerms": "condições" | null,
    "totalQuote": number | null,
    "supplierNotes": "observações importantes",
    "hasProblems": boolean,
    "problemSummary": "resumo dos problemas" | null,
    "suggestedAction": "confirm" | "negotiate" | "cancel" | "wait",
    "confidence": number
}`;

    // ═══════════════════════════════════════════════════════════════════════════
    // CRITICAL FIX 2026-01-01: Use regex fallback when Gemini API is not available
    // This ensures paymentTerms, deliveryDays, supplierNotes are ALWAYS extracted
    // ═══════════════════════════════════════════════════════════════════════════

    // Try Gemini AI first, fall back to local extraction
    if (!geminiApiKey) {
        console.warn('⚠️ Gemini API key not configured. Using local regex extraction.');
        return extractWithRegex(emailBody, expectedItems);
    }

    try {
        const result = await generateContent(prompt);

        // Clean and parse JSON
        const cleanJson = result
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleanJson);

        console.log('🤖 Gemini extracted fields:', {
            paymentTerms: parsed.paymentTerms,
            deliveryDays: parsed.deliveryDays,
            supplierNotes: parsed.supplierNotes
        });

        return {
            success: true,
            data: parsed,
            rawResponse: emailBody
        };
    } catch (error) {
        console.error('Gemini email analysis failed:', error);
        // FALLBACK: Use local regex extraction when AI fails
        console.log('🔄 Falling back to regex extraction...');
        return extractWithRegex(emailBody, expectedItems);
    }
}

/**
 * CRITICAL FALLBACK: Extract email data using regex patterns
 * Used when Gemini API is not available or fails
 * @param {string} emailBody - The email body text  
 * @param {Array} expectedItems - Items we requested quotes for
 * @returns {Object} - Extracted data
 */
function extractWithRegex(emailBody, expectedItems = []) {
    console.log('📧 REGEX EXTRACTION: Processing email body...');

    const text = emailBody || '';

    // ═══════════════════════════════════════════════════════════════════════════
    // EXTRACT PAYMENT TERMS
    // ═══════════════════════════════════════════════════════════════════════════
    let paymentTerms = null;
    const paymentPatterns = [
        // Portuguese patterns
        /pagamento[:\s]*(.+?)(?:\n|$)/i,
        /condi[çc][õo]es?\s*de\s*pagamento[:\s]*(.+?)(?:\n|$)/i,
        /prazo\s*de\s*pagamento[:\s]*(.+?)(?:\n|$)/i,
        /(\d+)\s*dias?\s*(?:boleto|faturado|líquido|net)/i,
        /boleto\s*(?:em\s*)?(\d+)\s*dias?/i,
        // English patterns
        /payment\s*terms?[:\s]*(.+?)(?:\n|$)/i,
        /net\s*(\d+)/i,
        /payment[:\s]*(.+?)(?:\n|$)/i
    ];

    for (const pattern of paymentPatterns) {
        const match = text.match(pattern);
        if (match) {
            paymentTerms = match[1]?.trim() || match[0]?.trim();
            // Clean up common patterns
            if (/^\d+$/.test(paymentTerms)) {
                paymentTerms = `${paymentTerms} dias`;
            }
            console.log(`✓ Payment terms found: "${paymentTerms}"`);
            break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXTRACT DELIVERY DAYS / DELIVERY DATE
    // ═══════════════════════════════════════════════════════════════════════════
    let deliveryDays = null;
    let deliveryDate = null;

    const deliveryPatterns = [
        // "3 dias úteis", "5 dias", "em 3 dias"
        /(?:prazo|entrega|delivery)[\s:]*(?:em\s*)?(\d+)\s*dias?\s*(?:úteis|uteis)?/i,
        /(\d+)\s*dias?\s*(?:úteis|uteis)?\s*(?:após|depois|after)/i,
        /(\d+)\s*business\s*days?/i,
        /(\d+)\s*days?\s*(?:delivery|after)/i
    ];

    for (const pattern of deliveryPatterns) {
        const match = text.match(pattern);
        if (match) {
            deliveryDays = parseInt(match[1], 10);
            console.log(`✓ Delivery days found: ${deliveryDays}`);
            break;
        }
    }

    // Try to find explicit date
    const datePatterns = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/   // YYYY-MM-DD
    ];

    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            if (match[1].length === 4) {
                deliveryDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
            } else {
                deliveryDate = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
            }
            console.log(`✓ Delivery date found: ${deliveryDate}`);
            break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXTRACT PRICES FROM EMAIL
    // ═══════════════════════════════════════════════════════════════════════════
    const items = [];
    const pricePatterns = [
        // "Farinha: R$ 5,80/kg" or "Farinha: R$ 5.80 por kg"
        /([^:\n]+)[:\s]+R?\$?\s*(\d+[.,]\d{2})\s*(?:\/|por)\s*(\w+)/gi,
        // "- Produto: R$ 10,50"
        /[-•]\s*([^:]+)[:\s]+R?\$?\s*(\d+[.,]\d{2})/gi
    ];

    for (const pattern of pricePatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const name = match[1].trim();
            const priceStr = match[2].replace(',', '.');
            const price = parseFloat(priceStr);
            const unit = match[3] || 'un';

            if (price > 0 && name.length > 1) {
                items.push({
                    name,
                    unitPrice: price,
                    unit,
                    available: true
                });
            }
        }
    }

    console.log(`✓ Items found: ${items.length}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // EXTRACT SUPPLIER NOTES / OBSERVATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    let supplierNotes = null;
    const notesPatterns = [
        /observa[çc][ãa]o[:\s]*(.+?)(?:\n\n|atenciosamente|$)/is,
        /obs[:\s]*(.+?)(?:\n\n|atenciosamente|$)/is,
        /nota[:\s]*(.+?)(?:\n\n|atenciosamente|$)/is,
        /note[:\s]*(.+?)(?:\n\n|regards|$)/is,
        /válido\s*até[:\s]*(.+?)(?:\n|$)/i,
        /frete[:\s]*(.+?)(?:\n|$)/i
    ];

    for (const pattern of notesPatterns) {
        const match = text.match(pattern);
        if (match && match[1]?.trim().length > 3) {
            supplierNotes = match[1].trim();
            console.log(`✓ Supplier notes found: "${supplierNotes.substring(0, 50)}..."`);
            break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CALCULATE TOTAL AND CONFIDENCE
    // ═══════════════════════════════════════════════════════════════════════════
    const totalQuote = items.reduce((sum, i) => sum + (i.unitPrice || 0), 0);

    // Calculate confidence based on what was extracted
    let confidence = 0.5; // Base
    if (items.length > 0) confidence += 0.2;
    if (paymentTerms) confidence += 0.1;
    if (deliveryDays || deliveryDate) confidence += 0.1;
    if (supplierNotes) confidence += 0.05;

    const result = {
        success: true,
        data: {
            hasQuote: items.length > 0 || paymentTerms || deliveryDays,
            items,
            deliveryDate,
            deliveryDays,
            paymentTerms,
            totalQuote: totalQuote > 0 ? totalQuote : null,
            supplierNotes,
            hasProblems: false,
            confidence,
            suggestedAction: items.length > 0 ? 'confirm' : 'wait',
            extractionMethod: 'regex_fallback'  // Flag that we used regex
        },
        rawResponse: emailBody
    };

    console.log('📧 REGEX EXTRACTION COMPLETE:', {
        paymentTerms: result.data.paymentTerms,
        deliveryDays: result.data.deliveryDays,
        supplierNotes: result.data.supplierNotes,
        itemsCount: result.data.items.length,
        confidence: result.data.confidence
    });

    return result;
}

/**
 * Generate a thank you / confirmation email
 * @param {Object} options - Options
 */
export async function generateConfirmationEmail({ supplierName, orderedItems, deliveryDate }) {
    const itemsList = orderedItems.map(item =>
        `- ${item.name}: ${item.quantity} ${item.unit || 'unidades'} @ R$ ${item.unitPrice?.toFixed(2) || 'N/A'}`
    ).join('\n');

    const prompt = `
Gere um email curto de confirmação de pedido em português brasileiro.

Fornecedor: ${supplierName}
Itens confirmados:
${itemsList}
Data de entrega: ${deliveryDate || 'a confirmar'}

O email deve:
1. Agradecer pela cotação
2. Confirmar o pedido
3. Reforçar a data de entrega
4. Ser breve e profissional

Responda apenas com o corpo do email, sem assunto.
`;

    try {
        const result = await generateContent(prompt);
        return {
            subject: `Confirmação de Pedido - ${new Date().toLocaleDateString('pt-BR')}`,
            body: result.trim()
        };
    } catch (error) {
        return {
            subject: `Confirmação de Pedido - ${new Date().toLocaleDateString('pt-BR')}`,
            body: `Prezado(a) ${supplierName},\n\nConfirmamos o pedido conforme cotação enviada.\n\nAtenciosamente,\nEquipe Padoca`
        };
    }
}

/**
 * Generate a follow-up email for alternative date
 */
export async function generateFollowUpEmail({ supplierName, reason, originalDeliveryDate }) {
    const prompt = `
Gere um email curto de follow-up em português brasileiro para:

Fornecedor: ${supplierName}
Situação: ${reason}
Data original prometida: ${originalDeliveryDate || 'não especificada'}

O email deve:
1. Ser educado mas firme
2. Solicitar nova data ou esclarecimento
3. Manter tom profissional

Responda apenas com o corpo do email.
`;

    try {
        const result = await generateContent(prompt);
        return {
            subject: `Re: Acompanhamento de Pedido`,
            body: result.trim()
        };
    } catch (error) {
        return {
            subject: `Re: Acompanhamento de Pedido`,
            body: `Prezado(a) ${supplierName},\n\nGostaríamos de um status atualizado sobre nosso pedido.\n\nAguardamos retorno.\n\nEquipe Padoca`
        };
    }
}

// ===================================================================
// GEMINI SERVICE EXPORT
// ===================================================================

export const GeminiService = {
    initialize: initializeGemini,
    isReady: isGeminiReady,

    // Email generation
    generateQuotationEmail,
    generateConfirmationEmail,
    generateFollowUpEmail,

    // Email analysis
    analyzeSupplierResponse,

    // Raw generation
    generate: generateContent
};

export default GeminiService;
