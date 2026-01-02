/**
 * Logger Service - Configurable Logging for Development/Production
 * 
 * BUG #8 FIX: Replaces raw console.log with configurable logging
 * that can be disabled in production.
 * 
 * Usage:
 *   import { logger } from './services/loggerService';
 *   logger.info('Message');
 *   logger.debug('Debug info');
 *   logger.error('Error occurred');
 */

// Check if we're in production mode
const IS_PRODUCTION = import.meta.env.PROD || import.meta.env.MODE === 'production';
const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || (IS_PRODUCTION ? 'error' : 'debug');

const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    none: 4
};

const currentLevel = LOG_LEVELS[LOG_LEVEL] ?? LOG_LEVELS.debug;

/**
 * Configurable logger that respects production mode
 */
export const logger = {
    /**
     * Debug level - only in development
     */
    debug(...args) {
        if (currentLevel <= LOG_LEVELS.debug) {
            console.log('[DEBUG]', ...args);
        }
    },

    /**
     * Info level - general information
     */
    info(...args) {
        if (currentLevel <= LOG_LEVELS.info) {
            console.log('[INFO]', ...args);
        }
    },

    /**
     * Warning level - potential issues
     */
    warn(...args) {
        if (currentLevel <= LOG_LEVELS.warn) {
            console.warn('[WARN]', ...args);
        }
    },

    /**
     * Error level - always shown
     */
    error(...args) {
        if (currentLevel <= LOG_LEVELS.error) {
            console.error('[ERROR]', ...args);
        }
    },

    /**
     * Group logging (for complex objects)
     */
    group(label) {
        if (currentLevel <= LOG_LEVELS.debug) {
            console.group(label);
        }
    },

    groupEnd() {
        if (currentLevel <= LOG_LEVELS.debug) {
            console.groupEnd();
        }
    },

    /**
     * Table logging (for arrays/objects)
     */
    table(data) {
        if (currentLevel <= LOG_LEVELS.debug) {
            console.table(data);
        }
    },

    /**
     * Time tracking
     */
    time(label) {
        if (currentLevel <= LOG_LEVELS.debug) {
            console.time(label);
        }
    },

    timeEnd(label) {
        if (currentLevel <= LOG_LEVELS.debug) {
            console.timeEnd(label);
        }
    },

    /**
     * Check current log level
     */
    getLevel() {
        return LOG_LEVEL;
    },

    /**
     * Check if we're in production
     */
    isProduction() {
        return IS_PRODUCTION;
    }
};

export default logger;
