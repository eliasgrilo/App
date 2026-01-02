/**
 * Environment Schema - Fail-Fast Validation
 * 
 * THE INVENTORY SINGULARITY - PHASE 0
 * 
 * If any required variable is missing, the system CRASHES on boot
 * with a clear, actionable error message.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT VARIABLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const ENV_SCHEMA = {
    // Firebase Configuration (Required)
    VITE_FIREBASE_API_KEY: {
        required: true,
        description: 'Firebase API Key',
        example: 'AIzaSy...'
    },
    VITE_FIREBASE_AUTH_DOMAIN: {
        required: true,
        description: 'Firebase Auth Domain',
        example: 'your-app.firebaseapp.com'
    },
    VITE_FIREBASE_PROJECT_ID: {
        required: true,
        description: 'Firebase Project ID',
        example: 'your-project-id'
    },
    VITE_FIREBASE_STORAGE_BUCKET: {
        required: true,
        description: 'Firebase Storage Bucket',
        example: 'your-app.appspot.com'
    },
    VITE_FIREBASE_MESSAGING_SENDER_ID: {
        required: true,
        description: 'Firebase Messaging Sender ID',
        example: '123456789'
    },
    VITE_FIREBASE_APP_ID: {
        required: true,
        description: 'Firebase App ID',
        example: '1:123456789:web:abc123'
    },

    // Google OAuth (Required for Gmail integration)
    VITE_GOOGLE_CLIENT_ID: {
        required: true,
        description: 'Google OAuth Client ID',
        example: '123456789.apps.googleusercontent.com'
    },

    // EmailJS (Optional fallback)
    VITE_EMAILJS_SERVICE_ID: {
        required: false,
        description: 'EmailJS Service ID',
        example: 'service_abc123'
    },
    VITE_EMAILJS_TEMPLATE_ID: {
        required: false,
        description: 'EmailJS Template ID',
        example: 'template_xyz789'
    },
    VITE_EMAILJS_PUBLIC_KEY: {
        required: false,
        description: 'EmailJS Public Key',
        example: 'public_key_123'
    },

    // Gemini AI (Optional)
    VITE_GEMINI_API_KEY: {
        required: false,
        description: 'Google Gemini AI API Key',
        example: 'AIzaSy...'
    },

    // Federation Layer (New)
    VITE_POSTGRES_URL: {
        required: false,
        description: 'PostgreSQL Connection URL for Federation',
        example: 'postgresql://user:pass@localhost:5432/padoca'
    },
    VITE_REDIS_URL: {
        required: false,
        description: 'Redis URL for Idempotency Cache',
        example: 'redis://localhost:6379'
    },

    // Logging
    VITE_LOG_LEVEL: {
        required: false,
        description: 'Log level (debug, info, warn, error)',
        example: 'info',
        default: 'info'
    },

    // Sender Email (New)
    VITE_SENDER_EMAIL: {
        required: false,
        description: 'Default sender email address',
        example: 'padocainc@gmail.com'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION RESULT TYPE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether all required vars are present
 * @property {string[]} missing - List of missing required variables
 * @property {string[]} warnings - List of missing optional variables
 * @property {Object} values - Validated environment values
 */

export default ENV_SCHEMA;
