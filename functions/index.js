/**
 * Firebase Cloud Functions - Padoca Pizza
 * Email sending via nodemailer with Gmail
 * 
 * SETUP REQUIRED:
 * Run: firebase functions:config:set gmail.email="padocainc@gmail.com" gmail.password="YOUR_APP_PASSWORD"
 * Then: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });
const { google } = require('googleapis');

admin.initializeApp();

// Pub/Sub configuration for Gmail notifications
const PUBSUB_TOPIC = 'projects/padoca-96688/topics/gmail-notifications';
const GMAIL_USER_ID = 'me'; // 'me' refers to the authenticated user

// Gmail configuration from environment variables
// To set: firebase functions:config:set gmail.email="x" gmail.password="y"
const gmailConfig = functions.config().gmail || {};
const GMAIL_EMAIL = gmailConfig.email || process.env.GMAIL_EMAIL || 'padocainc@gmail.com';
const GMAIL_APP_PASSWORD = gmailConfig.password || process.env.GMAIL_APP_PASSWORD;

// Validate config
if (!GMAIL_APP_PASSWORD) {
    console.error('⚠️ GMAIL_APP_PASSWORD not configured. Set via: firebase functions:config:set gmail.password="YOUR_APP_PASSWORD"');
}

// ===================================================================
// EMAIL MATCHING HELPERS - Robust email comparison
// ===================================================================

/**
 * Extract and normalize email address from various formats
 * Handles: "Name <email@domain.com>", "email@domain.com", etc.
 */
function normalizeEmail(emailStr) {
    if (!emailStr) return '';
    // Extract email from "Name <email>" format
    const match = emailStr.match(/<([^>]+)>/) || [null, emailStr];
    return (match[1] || emailStr).toLowerCase().trim();
}

/**
 * Check if two emails match (exact or domain-level)
 * Returns: 'exact', 'domain', or false
 */
function emailsMatch(email1, email2) {
    const e1 = normalizeEmail(email1);
    const e2 = normalizeEmail(email2);

    if (!e1 || !e2) return false;

    // Exact match
    if (e1 === e2) return 'exact';

    // Domain-level match (same company)
    const domain1 = e1.split('@')[1];
    const domain2 = e2.split('@')[1];
    if (domain1 && domain2 && domain1 === domain2) return 'domain';

    return false;
}

// ===================================================================
// GEMINI AI CONFIGURATION
// ===================================================================

const { GoogleGenerativeAI } = require('@google/generative-ai');
const geminiConfig = functions.config().gemini || {};
const GEMINI_API_KEY = geminiConfig.key || process.env.GEMINI_API_KEY;

let genAI = null;
const getGeminiClient = () => {
    if (!GEMINI_API_KEY) {
        console.error('⚠️ GEMINI_API_KEY not configured. Set via: firebase functions:config:set gemini.key="YOUR_KEY"');
        return null;
    }
    if (!genAI) {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }
    return genAI;
};

/**
 * Analyze supplier email using Gemini AI
 * Extracts: price, delivery date, availability, problems
 * @param {string} emailBody - Full email text
 * @param {Array} expectedItems - Items we requested quotes for
 * @returns {Object} - Structured extraction result
 */
async function analyzeEmailWithGemini(emailBody, expectedItems = []) {
    const ai = getGeminiClient();
    if (!ai) {
        return { success: false, error: 'Gemini not configured' };
    }

    const itemNames = expectedItems.map(i => i.name || i.productName).join(', ');

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
    "hasQuote": boolean,
    "items": [
        {
            "name": "nome do item",
            "unitPrice": number,
            "availableQuantity": number,
            "unit": "unidade",
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
    "suggestedAction": "confirm" | "negotiate" | "cancel" | "wait"
}

Responda APENAS com o JSON, sem explicações ou markdown.`;

    try {
        const model = ai.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean and parse JSON
        const cleanJson = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleanJson);
        console.log('✅ Gemini analysis complete:', JSON.stringify(parsed, null, 2));

        return { success: true, data: parsed };
    } catch (error) {
        console.error('❌ Gemini analysis failed:', error.message);
        return {
            success: false,
            error: error.message,
            data: { hasQuote: false, hasProblems: true, suggestedAction: 'wait' }
        };
    }
}

// Create transporter (lazy initialization)
let transporter = null;
const getTransporter = () => {
    if (!transporter && GMAIL_APP_PASSWORD) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_EMAIL,
                pass: GMAIL_APP_PASSWORD
            }
        });
    }
    return transporter;
};

/**
 * Send email to supplier via Gmail API (OAuth) with nodemailer fallback
 * POST /sendEmail
 * Body: { to, subject, body, supplierName }
 * 
 * Uses OAuth tokens from Firestore (synced from frontend) for reliable email sending
 */
exports.sendEmail = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        // Only allow POST
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        const { to, subject, body, supplierName } = req.body;

        if (!to || !subject || !body) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: to, subject, body'
            });
            return;
        }

        console.log(`📧 Sending email to: ${to}`);

        // Try Gmail API with OAuth first (more reliable)
        try {
            const auth = await getGmailAuth();
            if (auth) {
                const gmail = google.gmail({ version: 'v1', auth });

                // Create RFC 2822 formatted email
                const email = [
                    `To: ${to}`,
                    `From: "Padoca Pizza" <${GMAIL_EMAIL}>`,
                    `Subject: ${subject}`,
                    'MIME-Version: 1.0',
                    'Content-Type: text/plain; charset=UTF-8',
                    '',
                    body
                ].join('\r\n');

                // Base64url encode
                const encodedMessage = Buffer.from(email)
                    .toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');

                const result = await gmail.users.messages.send({
                    userId: 'me',
                    requestBody: { raw: encodedMessage }
                });

                console.log('✅ Email sent via Gmail API:', result.data.id);

                // Log to Firestore
                await admin.firestore().collection('emailLogs').add({
                    to,
                    subject,
                    supplierName: supplierName || 'Unknown',
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    messageId: result.data.id,
                    method: 'gmail_api',
                    status: 'sent'
                });

                res.json({
                    success: true,
                    messageId: result.data.id,
                    method: 'gmail_api'
                });
                return;
            } else {
                console.log('⚠️ Gmail OAuth not available, trying nodemailer...');
            }
        } catch (gmailError) {
            console.error('❌ Gmail API error:', gmailError.message);
            // Fall through to nodemailer
        }

        // Fallback to nodemailer (App Password)
        try {
            const emailTransporter = getTransporter();

            if (!emailTransporter) {
                console.error('❌ No email method available');
                res.status(500).json({
                    success: false,
                    error: 'Email not configured. Authorize Gmail from the app first, then sync tokens.'
                });
                return;
            }

            const info = await emailTransporter.sendMail({
                from: `"Padoca Pizza" <${GMAIL_EMAIL}>`,
                to: to,
                subject: subject,
                text: body,
                html: body.replace(/\n/g, '<br>')
            });

            console.log('✅ Email sent via nodemailer:', info.messageId);

            await admin.firestore().collection('emailLogs').add({
                to,
                subject,
                supplierName: supplierName || 'Unknown',
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                messageId: info.messageId,
                method: 'nodemailer',
                status: 'sent'
            });

            res.json({
                success: true,
                messageId: info.messageId,
                method: 'nodemailer'
            });
        } catch (error) {
            console.error('❌ Email send error:', error.message);

            let userMessage = error.message;
            if (error.code === 'EAUTH') {
                userMessage = 'Gmail authentication failed. Please reconnect Gmail from the app.';
            } else if (error.code === 'ECONNECTION') {
                userMessage = 'Could not connect to Gmail servers.';
            }

            res.status(500).json({
                success: false,
                error: userMessage,
                code: error.code
            });
        }
    });
});

/**
 * Health check endpoint
 */
exports.health = functions.https.onRequest((req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Gmail Status endpoint - Check if Gmail integration is working
 */
exports.gmailStatus = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            // Check if tokens exist
            const tokenDoc = await admin.firestore()
                .collection('gmailTokens')
                .doc('padocainc')
                .get();

            if (!tokenDoc.exists) {
                res.json({
                    status: 'not_configured',
                    message: 'Gmail tokens not found. Connect Gmail from the app.',
                    canSendEmail: false,
                    canReceiveEmail: false
                });
                return;
            }

            const tokens = tokenDoc.data();
            const now = Date.now();
            const isExpired = tokens.expiryDate && tokens.expiryDate < now;
            const hasRefreshToken = !!tokens.refreshToken;

            // Check watch config
            const watchDoc = await admin.firestore()
                .collection('gmailConfig')
                .doc('watchConfig')
                .get();

            const watchActive = watchDoc.exists &&
                watchDoc.data().expiration &&
                watchDoc.data().expiration > now;

            let canAutoRefresh = false;
            if (isExpired && hasRefreshToken) {
                // Try to refresh
                const auth = await getGmailAuth();
                canAutoRefresh = !!auth;
            }

            res.json({
                status: isExpired && !canAutoRefresh ? 'expired' : 'ok',
                userEmail: tokens.userEmail || 'padocainc@gmail.com',
                tokenExpiry: tokens.expiryDate
                    ? new Date(tokens.expiryDate).toISOString()
                    : null,
                isExpired,
                hasRefreshToken,
                canAutoRefresh,
                watchActive,
                watchExpiry: watchDoc.exists
                    ? new Date(watchDoc.data().expiration).toISOString()
                    : null,
                canSendEmail: !isExpired || canAutoRefresh,
                canReceiveEmail: watchActive,
                lastUpdated: tokens.updatedAt?.toDate?.()?.toISOString() || null
            });
        } catch (error) {
            console.error('Gmail status error:', error);
            res.status(500).json({
                status: 'error',
                error: error.message,
                canSendEmail: false,
                canReceiveEmail: false
            });
        }
    });
});

// ===================================================================
// SMART SOURCING AI - Automated Stock Monitoring
// ===================================================================

/**
 * Firestore Trigger: Auto-detect low stock items
 * When inventory item is updated, check if stock < minimum
 * If so, create a quotation request automatically
 */
exports.onStockLow = functions.firestore
    .document('inventory/{itemId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const itemId = context.params.itemId;

        // Calculate current stock
        const currentStock = (after.packageQuantity || 0) * (after.packageCount || 1);
        const minStock = after.minStock || 0;
        const maxStock = after.maxStock || minStock * 3;

        // Skip if stock is OK or if we already notified recently
        if (currentStock > minStock) return null;

        // Check if we already have a pending quotation for this item
        const existingQuotation = await admin.firestore()
            .collection('quotations')
            .where('itemIds', 'array-contains', itemId)
            .where('status', 'in', ['pending', 'sent', 'quoted'])
            .limit(1)
            .get();

        if (!existingQuotation.empty) {
            console.log(`⏭️ Item ${itemId} already has pending quotation`);
            return null;
        }

        // Get supplier info
        const supplierId = after.supplierId;
        if (!supplierId) {
            console.log(`⚠️ Item ${itemId} has no linked supplier`);
            return null;
        }

        const supplierDoc = await admin.firestore()
            .collection('suppliers')
            .doc(supplierId)
            .get();

        if (!supplierDoc.exists) {
            console.log(`⚠️ Supplier ${supplierId} not found`);
            return null;
        }

        const supplier = supplierDoc.data();

        // Check if supplier has autoRequest enabled
        if (!supplier.autoRequest) {
            console.log(`⏭️ Supplier ${supplier.name} has autoRequest disabled`);
            return null;
        }

        const quantityToOrder = maxStock - currentStock;

        // Generate unique Request-ID for email tracking
        const requestId = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create auto-quotation
        const quotation = {
            requestId,  // Unique ID for email correlation
            itemIds: [itemId],
            items: [{
                id: itemId,
                name: after.name,
                currentStock,
                maxStock,
                quantityToOrder,
                unit: after.unit || ''
            }],
            supplierId,
            supplierName: supplier.name,
            supplierEmail: supplier.email,
            status: 'draft',
            autoGenerated: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const quotationRef = await admin.firestore()
            .collection('quotations')
            .add(quotation);

        console.log(`📝 Auto-quotation created: ${quotationRef.id} for ${after.name}`);

        // Create audit log
        await admin.firestore().collection('auditLogs').add({
            entityType: 'quotation',
            entityId: quotationRef.id,
            action: 'AUTO_CREATE',
            trigger: 'LOW_STOCK',
            data: {
                itemName: after.name,
                currentStock,
                minStock,
                quantityToOrder,
                supplierName: supplier.name
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, quotationId: quotationRef.id };
    });

/**
 * Firestore Trigger: Log all quotation status changes
 * Creates immutable audit trail
 */
exports.onQuotationUpdate = functions.firestore
    .document('quotations/{quotationId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const quotationId = context.params.quotationId;

        // Only log status changes
        if (before.status === after.status) return null;

        await admin.firestore().collection('auditLogs').add({
            entityType: 'quotation',
            entityId: quotationId,
            action: 'STATUS_CHANGE',
            previousStatus: before.status,
            newStatus: after.status,
            supplierName: after.supplierName,
            quotedValue: after.quotedValue || null,
            expectedDelivery: after.expectedDelivery || null,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userId: after.updatedBy || 'system',
            userName: after.updatedByName || 'Sistema'
        });

        console.log(`📋 Audit: Quotation ${quotationId} changed from ${before.status} to ${after.status}`);
        return null;
    });

/**
 * HTTP Callable: Process supplier email with AI
 * Called from frontend when new reply is detected
 */
exports.processSupplierEmail = functions.https.onCall(async (data, context) => {
    const { quotationId, emailBody, emailSubject, emailFrom } = data;

    if (!quotationId || !emailBody) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Log the processing attempt
    await admin.firestore().collection('auditLogs').add({
        entityType: 'quotation',
        entityId: quotationId,
        action: 'EMAIL_RECEIVED',
        data: {
            from: emailFrom,
            subject: emailSubject,
            bodyLength: emailBody.length
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Note: Gemini processing happens on frontend for now
    // Future: Add Gemini API call here for backend processing

    return {
        success: true,
        message: 'Email logged for processing',
        quotationId
    };
});

/**
 * HTTP Callable: Mark Quotation as Received
 * Updates inventory quantities + writes to audit log atomically
 * Called when user clicks "Mark Received" on a delivered order
 */
exports.markQuotationReceived = functions.https.onCall(async (data, context) => {
    const { quotationId, receivedItems, notes } = data;

    if (!quotationId || !receivedItems || !Array.isArray(receivedItems)) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing quotationId or receivedItems');
    }

    console.log(`📦 Marking quotation ${quotationId} as received with ${receivedItems.length} items`);

    // Get quotation to verify it exists and is in correct state
    const quotationRef = admin.firestore().collection('quotations').doc(quotationId);
    const quotationDoc = await quotationRef.get();

    if (!quotationDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Quotation not found');
    }

    const quotation = quotationDoc.data();

    // Prevent duplicate receipt processing
    if (quotation.status === 'received' || quotation.receivedAt) {
        throw new functions.https.HttpsError('already-exists', 'Quotation already marked as received');
    }

    // Atomic batch write for all updates
    const batch = admin.firestore().batch();

    // 1. Update inventory quantities for each received item
    for (const item of receivedItems) {
        if (!item.productId || typeof item.quantity !== 'number') continue;

        const productRef = admin.firestore().collection('inventory').doc(item.productId);

        // Increment package count (or custom quantity field)
        batch.update(productRef, {
            packageCount: admin.firestore.FieldValue.increment(item.quantity),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`   📦 Product ${item.productId}: +${item.quantity}`);
    }

    // 2. Update quotation status to received
    batch.update(quotationRef, {
        status: 'received',
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        receivedItems: receivedItems,
        receivedNotes: notes || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Write comprehensive audit log
    const auditRef = admin.firestore().collection('auditLogs').doc();
    batch.set(auditRef, {
        entityType: 'quotation',
        entityId: quotationId,
        action: 'RECEIVED',
        data: {
            supplierName: quotation.supplierName,
            requestId: quotation.requestId || null,
            itemCount: receivedItems.length,
            items: receivedItems.map(i => ({
                productId: i.productId,
                productName: i.productName || 'Unknown',
                quantity: i.quantity,
                unitPrice: i.unitPrice || null
            })),
            notes: notes || null
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: context.auth?.uid || 'system',
        userName: context.auth?.token?.name || 'Sistema'
    });

    // Commit all changes atomically
    await batch.commit();

    console.log(`✅ Quotation ${quotationId} marked as received successfully`);

    return {
        success: true,
        quotationId,
        itemsUpdated: receivedItems.length,
        message: 'Inventory updated and quotation marked as received'
    };
});

/**
 * HTTP: Get audit logs for a quotation
 */
exports.getAuditLogs = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const quotationId = req.query.quotationId;

        if (!quotationId) {
            res.status(400).json({ error: 'Missing quotationId' });
            return;
        }

        try {
            const logs = await admin.firestore()
                .collection('auditLogs')
                .where('entityId', '==', quotationId)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            const auditTrail = logs.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate?.() || null
            }));

            res.json({ success: true, logs: auditTrail });
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// ===================================================================
// GMAIL PUB/SUB - Real-time Email Notifications
// ===================================================================

/**
 * Get OAuth2 client for Gmail API
 * Uses stored access token from Firestore (synced from frontend)
 */
const getGmailAuth = async () => {
    // Try to get stored OAuth tokens from Firestore
    const tokenDoc = await admin.firestore()
        .collection('gmailTokens')
        .doc('padocainc')
        .get();

    if (!tokenDoc.exists) {
        console.error('❌ Gmail OAuth tokens not found in Firestore');
        console.log('💡 Frontend needs to sync tokens by calling saveGmailToken');
        return null;
    }

    const tokens = tokenDoc.data();

    // Check if token is expired
    const now = Date.now();
    const expiryDate = tokens.expiryDate || 0;

    if (expiryDate && expiryDate < now) {
        console.warn('⚠️ Access token expired. Frontend needs to refresh and sync.');

        // If we have refresh token, try to refresh
        if (tokens.refreshToken && tokens.clientId && tokens.clientSecret) {
            const oauth2Client = new google.auth.OAuth2(
                tokens.clientId,
                tokens.clientSecret,
                'https://padoca-96688.web.app/oauth-callback'
            );

            oauth2Client.setCredentials({
                refresh_token: tokens.refreshToken
            });

            try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                console.log('🔄 Token refreshed successfully');

                // Save new tokens
                await admin.firestore()
                    .collection('gmailTokens')
                    .doc('padocainc')
                    .update({
                        accessToken: credentials.access_token,
                        expiryDate: credentials.expiry_date || (Date.now() + 3600000)
                    });

                oauth2Client.setCredentials(credentials);
                return oauth2Client;
            } catch (e) {
                console.error('❌ Token refresh failed:', e.message);
                return null;
            }
        }

        return null;
    }

    // Use access token directly (no refresh token needed for short operations)
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        expiry_date: tokens.expiryDate
    });

    return oauth2Client;
};

/**
 * HTTP: Save Gmail OAuth token from frontend
 * Called by frontend after OAuth authorization to sync token for Cloud Functions
 */
exports.saveGmailToken = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        const { accessToken, expiryDate, userEmail, refreshToken, clientId, clientSecret } = req.body;

        if (!accessToken) {
            res.status(400).json({ error: 'Missing accessToken' });
            return;
        }

        try {
            const tokenData = {
                accessToken,
                expiryDate: expiryDate || (Date.now() + 3600000),
                userEmail: userEmail || 'padocainc@gmail.com',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // Include refresh token if provided (for full OAuth flow)
            if (refreshToken) tokenData.refreshToken = refreshToken;
            if (clientId) tokenData.clientId = clientId;
            if (clientSecret) tokenData.clientSecret = clientSecret;

            await admin.firestore()
                .collection('gmailTokens')
                .doc('padocainc')
                .set(tokenData, { merge: true });

            console.log('✅ Gmail token saved to Firestore');

            res.json({
                success: true,
                message: 'Token saved successfully',
                expiresIn: Math.round((tokenData.expiryDate - Date.now()) / 1000 / 60) + ' minutes'
            });
        } catch (error) {
            console.error('❌ Error saving token:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

/**
 * HTTP: Exchange OAuth authorization code for access + refresh tokens
 * This is the KEY function for 24/7 automation - it gets the refresh token!
 */
exports.exchangeGmailCode = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        const { code, redirectUri } = req.body;

        if (!code) {
            res.status(400).json({ error: 'Missing authorization code' });
            return;
        }

        console.log('🔑 Exchanging authorization code for tokens...');

        // OAuth2 client configuration
        const CLIENT_ID = '689278956648-ti708lsamubui9d33hcohhr6es3tag34.apps.googleusercontent.com';

        // Get client secret from config or environment
        const oauthConfig = functions.config().oauth || {};
        const CLIENT_SECRET = oauthConfig.secret || process.env.OAUTH_CLIENT_SECRET;

        if (!CLIENT_SECRET) {
            console.error('❌ OAuth client secret not configured');
            res.status(500).json({
                error: 'OAuth not configured. Run: firebase functions:config:set oauth.secret="YOUR_CLIENT_SECRET"'
            });
            return;
        }

        const oauth2Client = new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            redirectUri || 'http://localhost:5173/oauth-callback.html'
        );

        try {
            // Exchange code for tokens
            const { tokens } = await oauth2Client.getToken(code);
            console.log('✅ Tokens received:', {
                hasAccessToken: !!tokens.access_token,
                hasRefreshToken: !!tokens.refresh_token,
                expiryDate: tokens.expiry_date
            });

            if (!tokens.access_token) {
                throw new Error('No access token received');
            }

            // Get user email
            oauth2Client.setCredentials(tokens);
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            const profile = await gmail.users.getProfile({ userId: 'me' });
            const userEmail = profile.data.emailAddress;

            console.log('📧 Authorized email:', userEmail);

            // Save tokens to Firestore for Cloud Functions
            const tokenData = {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date || (Date.now() + 3600000),
                userEmail: userEmail,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await admin.firestore()
                .collection('gmailTokens')
                .doc('padocainc')
                .set(tokenData, { merge: true });

            console.log('✅ Tokens saved to Firestore');

            // Automatically setup Gmail Watch for real-time notifications
            try {
                console.log('🔔 Setting up Gmail watch...');
                const watchResponse = await gmail.users.watch({
                    userId: 'me',
                    requestBody: {
                        topicName: PUBSUB_TOPIC,
                        labelIds: ['INBOX'],
                        labelFilterAction: 'include'
                    }
                });

                const watchData = watchResponse.data;
                console.log('✅ Gmail watch activated:', watchData);

                // Save watch config
                await admin.firestore()
                    .collection('gmailConfig')
                    .doc('watchConfig')
                    .set({
                        historyId: watchData.historyId,
                        expiration: parseInt(watchData.expiration),
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                        email: userEmail
                    }, { merge: true });

                console.log('✅ Watch config saved, notifications active!');
            } catch (watchError) {
                console.error('⚠️ Gmail watch setup failed:', watchError.message);
                // Don't fail the whole operation
            }

            res.json({
                success: true,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date,
                email: userEmail,
                message: 'Gmail connected with 24/7 automation!'
            });

        } catch (error) {
            console.error('❌ Token exchange failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
});

/**
 * Pub/Sub Trigger: Receive Gmail push notifications
 * This is triggered by Google Pub/Sub when Gmail receives a new email
 */
exports.onGmailNotification = functions.pubsub
    .topic('gmail-notifications')
    .onPublish(async (message) => {
        console.log('📬 Gmail notification received');

        // Decode the Pub/Sub message
        const data = message.json;
        const emailAddress = data.emailAddress;
        const historyId = data.historyId;

        console.log(`📧 Email: ${emailAddress}, History ID: ${historyId}`);

        // Get Gmail auth
        const auth = await getGmailAuth();
        if (!auth) {
            console.error('❌ Gmail authentication failed');
            return null;
        }

        const gmail = google.gmail({ version: 'v1', auth });

        try {
            // Get stored last history ID
            const configDoc = await admin.firestore()
                .collection('gmailConfig')
                .doc('watchConfig')
                .get();

            const lastHistoryId = configDoc.exists ? configDoc.data().lastHistoryId : null;

            // Fetch history changes since last known ID
            const historyResponse = await gmail.users.history.list({
                userId: GMAIL_USER_ID,
                startHistoryId: lastHistoryId || historyId,
                historyTypes: ['messageAdded'],
                labelId: 'INBOX'
            });

            const history = historyResponse.data.history || [];
            console.log(`📋 Found ${history.length} history changes`);

            // Process new messages
            for (const record of history) {
                const messagesAdded = record.messagesAdded || [];

                for (const messageData of messagesAdded) {
                    const messageId = messageData.message.id;
                    console.log(`📩 Processing message: ${messageId}`);

                    // ═══════════════════════════════════════════════════════════
                    // IDEMPOTENCY CHECK - Prevent duplicate email processing
                    // Uses dedicated collection to track processed messages
                    // This handles: Pub/Sub retries, duplicate webhooks, race conditions
                    // ═══════════════════════════════════════════════════════════
                    const processedEmailRef = admin.firestore()
                        .collection('processedEmails')
                        .doc(messageId);

                    try {
                        // Atomic check-and-set using Firestore transaction
                        const wasAlreadyProcessed = await admin.firestore().runTransaction(async (transaction) => {
                            const doc = await transaction.get(processedEmailRef);

                            if (doc.exists) {
                                console.log(`⏭️ [IDEMPOTENT] Message ${messageId} already processed at ${doc.data().processedAt?.toDate?.()}`);
                                return true; // Already processed
                            }

                            // Mark as processed BEFORE actually processing
                            // If processing fails, we'll clean up or retry via manual intervention
                            transaction.set(processedEmailRef, {
                                messageId,
                                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                                ttl: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day TTL for cleanup
                                status: 'processing'
                            });

                            return false; // Not yet processed
                        });

                        if (wasAlreadyProcessed) {
                            continue; // Skip to next message
                        }
                    } catch (idempotencyError) {
                        // If transaction fails, log and skip to be safe (avoid duplicates)
                        console.error(`⚠️ Idempotency check failed for ${messageId}:`, idempotencyError.message);
                        continue;
                    }

                    // Fetch full message content
                    const messageResponse = await gmail.users.messages.get({
                        userId: GMAIL_USER_ID,
                        id: messageId,
                        format: 'full'
                    });

                    const msg = messageResponse.data;
                    const headers = msg.payload.headers || [];

                    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
                    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
                    const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';

                    // Extract email body using ROBUST parsing (same as frontend)
                    let body = '';

                    // Helper: Decode URL-safe base64 (Gmail uses - and _ instead of + and /)
                    const decodeBase64Body = (data) => {
                        if (!data) return '';
                        try {
                            // Gmail uses URL-safe base64
                            const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
                            return Buffer.from(normalized, 'base64').toString('utf-8');
                        } catch (e) {
                            console.error('Base64 decode error:', e);
                            return '';
                        }
                    };

                    // Method 1: Direct body.data
                    if (msg.payload.body?.data) {
                        body = decodeBase64Body(msg.payload.body.data);
                    }

                    // Method 2: Multipart - try text/plain first
                    if ((!body || body.length < 10) && msg.payload.parts) {
                        for (const part of msg.payload.parts) {
                            if (part.mimeType === 'text/plain' && part.body?.data) {
                                body = decodeBase64Body(part.body.data);
                                if (body.length > 10) break;
                            }
                        }
                    }

                    // Method 3: Multipart - try text/html as fallback
                    if ((!body || body.length < 10) && msg.payload.parts) {
                        for (const part of msg.payload.parts) {
                            if (part.mimeType === 'text/html' && part.body?.data) {
                                let html = decodeBase64Body(part.body.data);
                                // Remove scripts and styles first
                                html = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
                                html = html.replace(/<style[^>]*>.*?<\/style>/gi, '');
                                // Strip HTML tags
                                let text = html.replace(/<[^>]*>/g, ' ');
                                // Decode HTML entities
                                text = text.replace(/&nbsp;/gi, ' ');
                                text = text.replace(/&amp;/gi, '&');
                                text = text.replace(/&lt;/gi, '<');
                                text = text.replace(/&gt;/gi, '>');
                                text = text.replace(/&quot;/gi, '"');
                                text = text.replace(/&#39;/gi, "'");
                                text = text.replace(/&rsquo;/gi, "'");
                                text = text.replace(/&lsquo;/gi, "'");
                                // Normalize whitespace
                                body = text.replace(/\s+/g, ' ').trim();
                                if (body.length > 10) break;
                            }
                        }
                    }

                    // Method 4: Nested multipart - try text/plain first, then text/html
                    if ((!body || body.length < 10) && msg.payload.parts) {
                        for (const part of msg.payload.parts) {
                            if (part.mimeType?.startsWith('multipart/') && part.parts) {
                                // Try text/plain in nested parts
                                for (const nested of part.parts) {
                                    if (nested.mimeType === 'text/plain' && nested.body?.data) {
                                        body = decodeBase64Body(nested.body.data);
                                        if (body.length > 10) break;
                                    }
                                }
                                // Fallback to text/html in nested parts
                                if ((!body || body.length < 10)) {
                                    for (const nested of part.parts) {
                                        if (nested.mimeType === 'text/html' && nested.body?.data) {
                                            let html = decodeBase64Body(nested.body.data);
                                            html = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
                                            html = html.replace(/<style[^>]*>.*?<\/style>/gi, '');
                                            let text = html.replace(/<[^>]*>/g, ' ');
                                            text = text.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&');
                                            text = text.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
                                            text = text.replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
                                            body = text.replace(/\s+/g, ' ').trim();
                                            if (body.length > 10) break;
                                        }
                                    }
                                }
                                if (body.length > 10) break;
                            }
                        }
                    }

                    // Fallback to snippet
                    if (!body || body.length < 10) {
                        body = msg.snippet || '';
                    }

                    console.log(`📄 Extracted body length: ${body.length} chars`);
                    console.log(`📊 [DEBUG] Email processing metadata:`, JSON.stringify({
                        messageId,
                        bodyPreview: body.substring(0, 100),
                        timestamp: new Date().toISOString()
                    }));


                    // Extract sender email
                    const senderEmail = from.match(/<([^>]+)>/)?.[1] || from.split(/\s/)[0];

                    console.log(`📧 From: ${senderEmail}, Subject: ${subject}`);

                    // BUG #5 FIX: Check if this message has already been processed
                    const duplicateCheck = await admin.firestore()
                        .collection('quotations')
                        .where('replyMessageId', '==', messageId)
                        .limit(1)
                        .get();

                    if (!duplicateCheck.empty) {
                        console.log(`⏭️ Message ${messageId} already processed, skipping...`);
                        continue;
                    }

                    // Find matching quotation by supplier email
                    // BUG #1/#2 FIX: Use JavaScript-side matching for robust case-insensitive comparison
                    // This avoids composite index issues and handles capitalization differences
                    const normalizedSender = normalizeEmail(senderEmail);

                    console.log(`🔍 Looking for quotation matching sender: ${normalizedSender}`);

                    // Get all pending quotations and match in JavaScript for robustness
                    // This avoids Firestore composite index requirements and handles case differences
                    let quotationsSnapshot = { empty: true, docs: [] };

                    try {
                        // REENGINEERED: Comprehensive status matching
                        // Include ALL statuses that could potentially receive supplier replies
                        const RECEIVABLE_STATUSES = [
                            'sent', 'pending', 'awaiting', 'draft', 'quoted',
                            'PENDENTE', 'AGUARDANDO', 'ABERTO', 'ENVIADO', 'COTADO'
                        ];

                        const allPendingSnapshot = await admin.firestore()
                            .collection('quotations')
                            .where('status', 'in', RECEIVABLE_STATUSES)
                            .orderBy('createdAt', 'desc')
                            .limit(100)
                            .get();


                        console.log(`📋 Found ${allPendingSnapshot.docs.length} pending quotations to check`);

                        // Find matching quotation using robust email matching
                        const matchingDoc = allPendingSnapshot.docs.find(doc => {
                            const quotationData = doc.data();
                            const supplierEmail = quotationData.supplierEmail || '';
                            const matchType = emailsMatch(senderEmail, supplierEmail);

                            if (matchType) {
                                console.log(`✅ Found ${matchType} match: ${supplierEmail} (ID: ${doc.id})`);
                                return true;
                            }
                            return false;
                        });

                        if (matchingDoc) {
                            quotationsSnapshot = { empty: false, docs: [matchingDoc] };
                        } else {
                            console.log(`⚠️ No matching quotation in pending statuses for ${normalizedSender}`);
                            console.log(`   Pending quotation emails:`, allPendingSnapshot.docs.map(d => d.data().supplierEmail));

                            // FALLBACK: Search ALL quotations regardless of status
                            // This catches edge cases where status was manually changed
                            console.log(`🔄 Attempting fallback query (all statuses)...`);
                            const fallbackSnapshot = await admin.firestore()
                                .collection('quotations')
                                .orderBy('createdAt', 'desc')
                                .limit(100)
                                .get();

                            const fallbackMatch = fallbackSnapshot.docs.find(doc => {
                                const quotationData = doc.data();
                                const supplierEmail = quotationData.supplierEmail || '';
                                return emailsMatch(senderEmail, supplierEmail);
                            });

                            if (fallbackMatch) {
                                console.log(`✅ Fallback found match: ${fallbackMatch.id} (status: ${fallbackMatch.data().status})`);
                                quotationsSnapshot = { empty: false, docs: [fallbackMatch] };
                            } else {
                                console.log(`❌ No quotation found for ${normalizedSender} in any status`);
                            }
                        }
                    } catch (queryError) {
                        console.error('❌ Query failed:', queryError.message);
                        console.error('   Stack:', queryError.stack);
                    }

                    if (!quotationsSnapshot.empty) {
                        const quotationDoc = quotationsSnapshot.docs[0];
                        const quotationId = quotationDoc.id;
                        const quotation = quotationDoc.data();

                        console.log(`✅ Found matching quotation: ${quotationId}`);
                        console.log(`🤖 Processing with Gemini AI...`);

                        // Process email with Gemini AI
                        const aiResult = await analyzeEmailWithGemini(body, quotation.items || []);
                        const aiData = aiResult.data || {};

                        // ═══════════════════════════════════════════════════════════════
                        // CRITICAL FIX: ALWAYS create order when email is processed
                        // Orders appear in Orders tab regardless of auto-confirm status
                        // Status indicates whether manual review is needed
                        // ═══════════════════════════════════════════════════════════════
                        const shouldAutoConfirm = aiResult.success &&
                            aiData.hasQuote &&
                            (aiData.suggestedAction === 'confirm' || aiData.suggestedAction === 'accept') &&
                            !aiData.hasProblems &&
                            !aiData.hasDelay;

                        // Set quotation status based on AI analysis
                        // 'ordered' = auto-confirmed, ready for fulfillment
                        // 'quoted' = needs manual review in Orders tab
                        const newStatus = shouldAutoConfirm ? 'ordered' : 'quoted';
                        const needsManualReview = !aiResult.success || !aiData.hasQuote || aiData.hasProblems;

                        // CRITICAL FIX: ALWAYS generate order ID - not just for auto-confirmed
                        // Order will have different status based on shouldAutoConfirm
                        // REENGINEERED: Use deterministic ID based on quotationId for consistency
                        const orderId = `order_${quotationId.replace('quot_', '')}`;
                        const orderStatus = shouldAutoConfirm ? 'confirmed' : 'pending_confirmation';
                        const confirmedAt = shouldAutoConfirm ? admin.firestore.FieldValue.serverTimestamp() : null;

                        console.log(`📋 Status Decision: quotation=${newStatus} | order=${orderStatus} | Auto-confirm: ${shouldAutoConfirm} | Problems: ${aiData.hasProblems || false}`);

                        // Calculate quoted total from AI-extracted items
                        let quotedTotal = aiData.totalQuote || 0;
                        if (!quotedTotal && aiData.items?.length) {
                            quotedTotal = aiData.items.reduce((sum, item) => {
                                const qty = item.availableQuantity || 0;
                                const price = item.unitPrice || 0;
                                return sum + (qty * price);
                            }, 0);
                        }

                        // VALIDATION: Fallback to estimated total if quotedTotal is still invalid
                        if (!quotedTotal || quotedTotal <= 0) {
                            console.warn('⚠️ No valid quotedTotal from AI, using estimated total');
                            quotedTotal = quotation.estimatedTotal || quotation.items?.reduce((sum, item) => {
                                return sum + ((item.estimatedUnitPrice || 0) * (item.quantityToOrder || 0));
                            }, 0) || 0;
                        }


                        // BUG FIX: Update items array directly with quoted prices
                        // This ensures frontend can read quotedUnitPrice from items
                        const updatedItems = (quotation.items || []).map((item, index) => {
                            const quotedItem = aiData.items?.find(qi =>
                                qi.name?.toLowerCase().includes(item.productName?.toLowerCase()) ||
                                (item.productName && qi.name && item.productName.toLowerCase().includes(qi.name.toLowerCase()))
                            ) || aiData.items?.[index] || {};

                            // CRITICAL FIX 2026-01-01: Use ?? instead of || to preserve 0 values
                            // This was THE ROOT CAUSE - || converted 0 prices to null
                            return {
                                ...item,
                                quotedUnitPrice: quotedItem.unitPrice ?? item.quotedUnitPrice ?? null,
                                quotedAvailability: quotedItem.availableQuantity ?? item.quotedAvailability ?? null
                            };
                        });

                        // ═══════════════════════════════════════════════════
                        // ATOMIC BATCH WRITE - All or nothing
                        // ═══════════════════════════════════════════════════
                        const batch = admin.firestore().batch();

                        // 1. Update quotation with AI-extracted data
                        const updateData = {
                            status: newStatus,
                            replyFrom: from,
                            replySubject: subject,
                            replyBody: body,
                            replyDate: date,
                            replyMessageId: messageId,
                            replyReceivedAt: admin.firestore.FieldValue.serverTimestamp(),
                            responseReceivedAt: admin.firestore.FieldValue.serverTimestamp(),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),

                            // AI-extracted fields
                            aiProcessed: true,
                            needsManualReview: needsManualReview,
                            aiSuccess: aiResult.success,
                            quotedTotal: quotedTotal,
                            deliveryDate: aiData.deliveryDate || null,
                            deliveryDays: aiData.deliveryDays || null,
                            paymentTerms: aiData.paymentTerms || null,
                            hasDelay: aiData.hasDelay || false,
                            delayReason: aiData.delayReason || null,
                            hasProblems: aiData.hasProblems || false,
                            problemSummary: aiData.problemSummary || null,
                            supplierNotes: aiData.supplierNotes || null,
                            suggestedAction: aiData.suggestedAction || 'wait',

                            // Store AI analysis for reference
                            aiAnalysis: aiData,

                            // Update items with quoted prices
                            items: updatedItems,
                            quotedItems: aiData.items || [],

                            // Order linkage (if auto-confirmed)
                            orderId: orderId,
                            confirmedAt: confirmedAt,
                            autoConfirmed: shouldAutoConfirm
                        };

                        const quotationRef = admin.firestore()
                            .collection('quotations')
                            .doc(quotationId);
                        batch.update(quotationRef, updateData);

                        // 2. Create idempotency record (prevents reprocessing)
                        const idempotencyRef = admin.firestore()
                            .collection('emailIdempotency')
                            .doc(messageId);
                        batch.set(idempotencyRef, {
                            messageId,
                            quotationId,
                            processedAt: admin.firestore.FieldValue.serverTimestamp(),
                            senderEmail,
                            subject
                        });

                        // 3. Create audit log
                        const auditRef = admin.firestore()
                            .collection('auditLogs')
                            .doc();
                        batch.set(auditRef, {
                            entityType: 'quotation',
                            entityId: quotationId,
                            action: shouldAutoConfirm ? 'ORDER_AUTO_CREATED' : 'EMAIL_PROCESSED_AI',
                            data: {
                                from: senderEmail,
                                subject,
                                bodyLength: body.length,
                                messageId,
                                aiSuccess: aiResult.success,
                                newStatus,
                                quotedTotal,
                                deliveryDate: aiData.deliveryDate,
                                hasProblems: aiData.hasProblems,
                                itemsExtracted: aiData.items?.length || 0,
                                orderId: orderId,
                                autoConfirmed: shouldAutoConfirm
                            },
                            timestamp: admin.firestore.FieldValue.serverTimestamp()
                        });

                        // 4. ALWAYS CREATE ORDER - regardless of auto-confirm status
                        // IDEMPOTENCY: Double-check to prevent duplicates
                        // Check 1: By quotationId field (catches variations in order ID format)
                        const existingOrderSnapshot = await admin.firestore()
                            .collection('orders')
                            .where('quotationId', '==', quotationId)
                            .limit(1)
                            .get();

                        let finalOrderId = orderId;
                        let orderAlreadyExists = false;

                        if (!existingOrderSnapshot.empty) {
                            // Order already exists - use existing orderId
                            const existingOrder = existingOrderSnapshot.docs[0];
                            finalOrderId = existingOrder.id;
                            orderAlreadyExists = true;
                            console.log(`⏭️ Order already exists for quotation ${quotationId}: ${finalOrderId}`);

                            // Update the quotation's orderId reference if it's different
                            if (updateData.orderId !== finalOrderId) {
                                updateData.orderId = finalOrderId;
                                updateData.confirmedAt = existingOrder.data().confirmedAt;
                            }
                        } else {
                            // Check 2: By predicted order document ID (handles edge cases)
                            const predictedOrderRef = admin.firestore().collection('orders').doc(orderId);
                            const predictedOrderDoc = await predictedOrderRef.get();

                            if (predictedOrderDoc.exists) {
                                finalOrderId = orderId;
                                orderAlreadyExists = true;
                                console.log(`⏭️ Order document already exists: ${orderId}`);
                                updateData.orderId = finalOrderId;
                                updateData.confirmedAt = predictedOrderDoc.data().confirmedAt;
                            }
                        }

                        if (!orderAlreadyExists) {
                            console.log(`📦 Creating order: ${orderId} with status: ${orderStatus}`);

                            const orderRef = admin.firestore()
                                .collection('orders')
                                .doc(orderId);

                            batch.set(orderRef, {
                                // Order identification
                                orderId: orderId,
                                quotationId: quotationId,

                                // Supplier info
                                supplierEmail: senderEmail,
                                supplierName: quotation.supplierName || '',
                                supplierId: quotation.supplierId || null,

                                // Items with quoted prices
                                items: updatedItems.map(item => ({
                                    productId: item.productId,
                                    productName: item.productName,
                                    name: item.productName, // Alias for frontend compatibility
                                    quantityOrdered: item.quantityToOrder || item.neededQuantity,
                                    quantityToOrder: item.quantityToOrder || item.neededQuantity, // Alias
                                    unit: item.unit || '',
                                    quotedUnitPrice: item.quotedUnitPrice,
                                    quotedAvailability: item.quotedAvailability,
                                    subtotal: (item.quotedUnitPrice || 0) * (item.quantityToOrder || item.neededQuantity || 0)
                                })),

                                // Totals and terms
                                quotedTotal: quotedTotal,
                                quotedValue: quotedTotal, // Alias for frontend compatibility
                                deliveryDate: aiData.deliveryDate || null,
                                expectedDelivery: aiData.deliveryDate || null, // Alias
                                deliveryDays: aiData.deliveryDays || null,
                                paymentTerms: aiData.paymentTerms || null,

                                // Status tracking - CRITICAL: Use orderStatus not hardcoded 'confirmed'
                                status: orderStatus,
                                autoConfirmed: shouldAutoConfirm,
                                needsManualReview: needsManualReview,
                                hasProblems: aiData.hasProblems || false,
                                problemSummary: aiData.problemSummary || null,
                                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                confirmedAt: confirmedAt,

                                // Email reference
                                sourceEmailId: messageId,
                                sourceEmailSubject: subject,

                                // AI analysis summary
                                aiSuggestedAction: aiData.suggestedAction,
                                supplierNotes: aiData.supplierNotes || null
                            });

                            console.log(`✅ Order ${orderId} added to batch with status: ${orderStatus}`);
                        }

                        // ATOMIC COMMIT - All writes succeed or all fail
                        await batch.commit();

                        // Mark email as fully processed (idempotency lifecycle complete)
                        await processedEmailRef.update({
                            status: 'completed',
                            quotationId: quotationId,
                            completedAt: admin.firestore.FieldValue.serverTimestamp()
                        });

                        console.log(`✅ Quotation ${quotationId} auto-processed: ${newStatus}`);
                        console.log(`   💰 Total: ${quotedTotal}, 📅 Delivery: ${aiData.deliveryDate || 'N/A'}`);
                    } else {
                        console.log(`⚠️ No matching quotation found for ${senderEmail}`);
                    }
                }
            }


            // Update last history ID
            await admin.firestore()
                .collection('gmailConfig')
                .doc('watchConfig')
                .set({
                    lastHistoryId: historyId,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

            return { success: true, processed: history.length };
        } catch (error) {
            console.error('❌ Error processing Gmail notification:', error);
            return { error: error.message };
        }
    });

/**
 * HTTP: Setup Gmail watch for push notifications
 * Call this once to start receiving notifications
 */
exports.setupGmailWatch = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        console.log('🔔 Setting up Gmail watch...');

        const auth = await getGmailAuth();
        if (!auth) {
            res.status(500).json({ error: 'Gmail authentication failed' });
            return;
        }

        const gmail = google.gmail({ version: 'v1', auth });

        try {
            const watchResponse = await gmail.users.watch({
                userId: GMAIL_USER_ID,
                requestBody: {
                    topicName: PUBSUB_TOPIC,
                    labelIds: ['INBOX'],
                    labelFilterAction: 'include'
                }
            });

            const watchData = watchResponse.data;
            console.log('✅ Gmail watch set up:', watchData);

            // Store watch config
            await admin.firestore()
                .collection('gmailConfig')
                .doc('watchConfig')
                .set({
                    historyId: watchData.historyId,
                    expiration: watchData.expiration,
                    topic: PUBSUB_TOPIC,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    lastRenewed: admin.firestore.FieldValue.serverTimestamp()
                });

            res.json({
                success: true,
                historyId: watchData.historyId,
                expiration: new Date(parseInt(watchData.expiration)).toISOString(),
                message: 'Gmail watch configured successfully'
            });
        } catch (error) {
            console.error('❌ Error setting up Gmail watch:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

/**
 * Scheduled: Renew Gmail watch every 6 days
 * Gmail watch expires after 7 days, so we renew proactively
 */
exports.renewGmailWatch = functions.pubsub
    .schedule('every 144 hours')  // Every 6 days
    .onRun(async (context) => {
        console.log('🔄 Renewing Gmail watch...');

        const auth = await getGmailAuth();
        if (!auth) {
            console.error('❌ Gmail authentication failed during renewal');
            return null;
        }

        const gmail = google.gmail({ version: 'v1', auth });

        try {
            // Stop existing watch
            await gmail.users.stop({ userId: GMAIL_USER_ID });
            console.log('⏹️ Stopped existing watch');

            // Create new watch
            const watchResponse = await gmail.users.watch({
                userId: GMAIL_USER_ID,
                requestBody: {
                    topicName: PUBSUB_TOPIC,
                    labelIds: ['INBOX'],
                    labelFilterAction: 'include'
                }
            });

            const watchData = watchResponse.data;

            // Update config
            await admin.firestore()
                .collection('gmailConfig')
                .doc('watchConfig')
                .update({
                    historyId: watchData.historyId,
                    expiration: watchData.expiration,
                    lastRenewed: admin.firestore.FieldValue.serverTimestamp()
                });

            console.log('✅ Gmail watch renewed:', watchData);
            return { success: true };
        } catch (error) {
            console.error('❌ Error renewing Gmail watch:', error);

            // Log failure for monitoring
            await admin.firestore().collection('auditLogs').add({
                entityType: 'system',
                action: 'GMAIL_WATCH_RENEWAL_FAILED',
                error: error.message,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            return { error: error.message };
        }
    });
