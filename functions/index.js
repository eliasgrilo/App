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
 * Send email to supplier
 * POST /sendEmail
 * Body: { to, subject, body, supplierName }
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

        try {
            const emailTransporter = getTransporter();

            if (!emailTransporter) {
                console.error('❌ Email transporter not configured');
                res.status(500).json({
                    success: false,
                    error: 'Email service not configured. Run: firebase functions:config:set gmail.password="YOUR_APP_PASSWORD"'
                });
                return;
            }

            // Send email
            const info = await emailTransporter.sendMail({
                from: `"Padoca Pizza" <${GMAIL_EMAIL}>`,
                to: to,
                subject: subject,
                text: body,
                html: body.replace(/\n/g, '<br>')
            });

            console.log('✅ Email sent:', info.messageId);

            // Log to Firestore for tracking
            await admin.firestore().collection('emailLogs').add({
                to,
                subject,
                supplierName: supplierName || 'Unknown',
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                messageId: info.messageId,
                status: 'sent'
            });

            res.json({
                success: true,
                messageId: info.messageId
            });
        } catch (error) {
            console.error('❌ Email send error:', error.message);

            // Provide more helpful error messages
            let userMessage = error.message;
            if (error.code === 'EAUTH') {
                userMessage = 'Gmail authentication failed. App Password may be invalid or revoked.';
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
        const quantityToOrder = maxStock - currentStock;

        // Create auto-quotation
        const quotation = {
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

                    // Extract email body
                    let body = '';
                    if (msg.payload.body?.data) {
                        body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
                    } else if (msg.payload.parts) {
                        for (const part of msg.payload.parts) {
                            if (part.mimeType === 'text/plain' && part.body?.data) {
                                body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                                break;
                            }
                        }
                    }

                    // Extract sender email
                    const senderEmail = from.match(/<([^>]+)>/)?.[1] || from.split(/\s/)[0];

                    console.log(`📧 From: ${senderEmail}, Subject: ${subject}`);

                    // Find matching quotation by supplier email
                    const quotationsSnapshot = await admin.firestore()
                        .collection('quotations')
                        .where('supplierEmail', '==', senderEmail.toLowerCase())
                        .where('status', '==', 'sent')
                        .orderBy('createdAt', 'desc')
                        .limit(1)
                        .get();

                    if (!quotationsSnapshot.empty) {
                        const quotationDoc = quotationsSnapshot.docs[0];
                        const quotationId = quotationDoc.id;
                        const quotation = quotationDoc.data();

                        console.log(`✅ Found matching quotation: ${quotationId}`);

                        // Store email for AI processing
                        await admin.firestore()
                            .collection('quotations')
                            .doc(quotationId)
                            .update({
                                status: 'reply_received',
                                replyFrom: from,
                                replySubject: subject,
                                replyBody: body,
                                replyDate: date,
                                replyMessageId: messageId,
                                replyReceivedAt: admin.firestore.FieldValue.serverTimestamp(),
                                updatedAt: admin.firestore.FieldValue.serverTimestamp()
                            });

                        // Create audit log
                        await admin.firestore().collection('auditLogs').add({
                            entityType: 'quotation',
                            entityId: quotationId,
                            action: 'EMAIL_RECEIVED_PUBSUB',
                            data: {
                                from: senderEmail,
                                subject,
                                bodyLength: body.length,
                                messageId
                            },
                            timestamp: admin.firestore.FieldValue.serverTimestamp()
                        });

                        console.log(`✅ Quotation ${quotationId} updated with reply`);
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
