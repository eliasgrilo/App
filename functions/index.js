/**
 * Firebase Cloud Functions - Padoca Pizza
 * Email sending via nodemailer with Gmail
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Gmail configuration - using App Password
const GMAIL_EMAIL = 'padocainc@gmail.com';
const GMAIL_APP_PASSWORD = 'qynmebwozja4kaXwon'; // App password without spaces

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_EMAIL,
        pass: GMAIL_APP_PASSWORD
    }
});

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
            // Send email
            const info = await transporter.sendMail({
                from: `"Padoca Pizza" <${GMAIL_EMAIL}>`,
                to: to,
                subject: subject,
                text: body,
                html: body.replace(/\n/g, '<br>')
            });

            console.log('Email sent:', info.messageId);

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
            console.error('Email send error:', error);
            res.status(500).json({
                success: false,
                error: error.message
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
