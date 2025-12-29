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
        `${GEMINI_API_BASE}/models/gemini-pro:generateContent?key=${geminiApiKey}`,
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

    const prompt = `
Você é um assistente especializado em análise de emails comerciais de fornecedores. 
Analise a resposta do fornecedor e extraia TODAS as informações em formato JSON.

IMPORTANTE: Identifique problemas como:
- Itens indisponíveis ou em falta
- Atrasos na entrega
- Quantidades parciais disponíveis
- Preços alterados

Email do fornecedor:
"""
${emailBody}
"""

Itens esperados na cotação: ${itemNames || 'não especificados'}

Extraia as seguintes informações em JSON válido:
{
    "hasQuote": boolean, // true se o email contém cotação/resposta
    "items": [
        {
            "name": "nome do item",
            "unitPrice": number, // preço unitário em reais, null se não informado
            "availableQuantity": number, // quantidade DISPONÍVEL, null se não informado
            "requestedQuantity": number, // quantidade solicitada originalmente, null se não mencionado
            "unit": "unidade de medida",
            "available": boolean, // true se disponível, false se em falta
            "partialAvailability": boolean, // true se só parte está disponível
            "unavailableReason": "motivo da indisponibilidade", // null se disponível
            "alternativeOffered": "produto alternativo oferecido" // null se não há alternativa
        }
    ],
    "deliveryDate": "YYYY-MM-DD", // data de entrega prometida, null se não informada
    "deliveryDays": number, // dias úteis para entrega, null se não informado
    "hasDelay": boolean, // true se há atraso ou prazo maior que esperado
    "delayReason": "motivo do atraso", // null se não há atraso
    "originalDeliveryDate": "YYYY-MM-DD", // data original prometida se mencionada
    "paymentTerms": "condições de pagamento", // null se não informado
    "totalQuote": number, // valor total da cotação, null se não informado
    "supplierNotes": "observações importantes do fornecedor",
    "hasProblems": boolean, // true se há qualquer problema (falta, atraso, indisponibilidade)
    "problemSummary": "resumo dos problemas identificados", // null se não há problemas
    "sentiment": "positive" | "neutral" | "negative", // tom geral da resposta
    "urgency": "low" | "medium" | "high", // urgência baseada nos problemas
    "needsFollowUp": boolean, // true se precisa de esclarecimento ou ação
    "followUpReason": "motivo do follow-up necessário",
    "suggestedAction": "ação sugerida: confirm | negotiate | cancel | wait"
}

Responda APENAS com o JSON, sem explicações ou markdown.
`;

    try {
        const result = await generateContent(prompt);

        // Clean and parse JSON
        const cleanJson = result
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleanJson);

        return {
            success: true,
            data: parsed,
            rawResponse: emailBody
        };
    } catch (error) {
        console.error('Gemini email analysis failed:', error);
        return {
            success: false,
            error: error.message,
            data: {
                hasQuote: false,
                items: [],
                needsFollowUp: true,
                followUpReason: 'Não foi possível processar a resposta automaticamente'
            },
            rawResponse: emailBody
        };
    }
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
