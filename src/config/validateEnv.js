/**
 * Environment Validator - Fail-Fast Boot Protection
 * 
 * THE INVENTORY SINGULARITY - PHASE 0
 * 
 * CRITICAL: This module MUST be imported at the very top of main.jsx
 * before any other imports. If validation fails, the app crashes immediately
 * with a clear error message.
 */

import ENV_SCHEMA from './env.schema.js';

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate all environment variables against schema
 * @returns {Object} Validation result with valid flag and issues
 */
export function validateEnvironment() {
    const missing = [];
    const warnings = [];
    const values = {};

    for (const [key, config] of Object.entries(ENV_SCHEMA)) {
        const value = import.meta.env[key];

        if (value) {
            values[key] = value;
        } else if (config.required) {
            missing.push({
                key,
                description: config.description,
                example: config.example
            });
        } else {
            // Optional but missing - add default if exists
            if (config.default) {
                values[key] = config.default;
            }
            warnings.push({
                key,
                description: config.description
            });
        }
    }

    return {
        valid: missing.length === 0,
        missing,
        warnings,
        values
    };
}

/**
 * Format error message for missing variables
 */
function formatMissingVarsError(missing) {
    const header = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🚨 ENVIRONMENT VALIDATION FAILED 🚨                        ║
║                                                                              ║
║  The following REQUIRED environment variables are missing.                   ║
║  The application cannot start without them.                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣`;

    const vars = missing.map(({ key, description, example }) => `
║  ❌ ${key}
║     Description: ${description}
║     Example:     ${example}
║`).join('\n');

    const footer = `
╠══════════════════════════════════════════════════════════════════════════════╣
║  ACTION REQUIRED:                                                            ║
║  1. Copy .env.example to .env                                               ║
║  2. Fill in all required variables                                          ║
║  3. Restart the application                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝`;

    return header + vars + footer;
}

/**
 * Log warnings for missing optional variables
 */
function logWarnings(warnings) {
    if (warnings.length === 0) return;

    console.warn('⚠️ Optional environment variables not configured:');
    warnings.forEach(({ key, description }) => {
        console.warn(`   - ${key}: ${description}`);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAIL-FAST BOOT PROTECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Assert environment is valid or crash with helpful error
 * MUST be called at application startup
 */
export function assertEnvironment() {
    const result = validateEnvironment();

    if (!result.valid) {
        const errorMessage = formatMissingVarsError(result.missing);
        console.error(errorMessage);

        // In development, show visual error
        if (import.meta.env.DEV) {
            document.body.innerHTML = `
                <div style="
                    font-family: monospace;
                    background: #1a1a2e;
                    color: #ff6b6b;
                    padding: 40px;
                    white-space: pre-wrap;
                    min-height: 100vh;
                ">
                    <h1 style="color: #ffd93d;">🚨 Environment Configuration Error</h1>
                    <pre style="color: #6bcb77;">${formatMissingVarsError(result.missing)}</pre>
                </div>
            `;
        }

        // CRASH - Application cannot continue
        throw new Error(`FATAL: Missing ${result.missing.length} required environment variables. See console for details.`);
    }

    // Log warnings for optional vars
    logWarnings(result.warnings);

    console.log('✅ Environment validation passed');
    return result.values;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON VALIDATED ENV
// ═══════════════════════════════════════════════════════════════════════════════

let _validatedEnv = null;

/**
 * Get validated environment (lazy initialization)
 */
export function getEnv() {
    if (!_validatedEnv) {
        _validatedEnv = assertEnvironment();
    }
    return _validatedEnv;
}

/**
 * Check if a specific feature is enabled based on env vars
 */
export function isFeatureEnabled(feature) {
    const featureMap = {
        'gmail': () => !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
        'emailjs': () => !!import.meta.env.VITE_EMAILJS_SERVICE_ID,
        'gemini': () => !!import.meta.env.VITE_GEMINI_API_KEY,
        'postgres': () => !!import.meta.env.VITE_POSTGRES_URL,
        'redis': () => !!import.meta.env.VITE_REDIS_URL
    };

    return featureMap[feature]?.() ?? false;
}

export default {
    validateEnvironment,
    assertEnvironment,
    getEnv,
    isFeatureEnabled
};
