/**
 * Haptic Language Service - Tactile Communication
 * 
 * PREMIUM FEATURE #28: Haptic Language
 * 
 * Phone vibration patterns communicate complex information.
 * Chef feels order status without looking at phone.
 * 
 * @module hapticLanguage
 */

const HapticPattern = Object.freeze({
    SUCCESS: 'success',           // Short crisp - Confirmed
    ERROR: 'error',               // Long heavy - Critical error
    WARNING: 'warning',           // Double pulse - Attention needed
    PRIORITY: 'priority',         // Triple quick - Urgent message
    NOTIFICATION: 'notification', // Gentle tap - New info
    HEARTBEAT: 'heartbeat',       // Rhythmic - Processing
    CELEBRATION: 'celebration'    // Pattern - Goal achieved
});

const NotificationType = Object.freeze({
    ORDER_CONFIRMED: 'order_confirmed',
    ORDER_DELIVERED: 'order_delivered',
    STOCK_CRITICAL: 'stock_critical',
    PRICE_ALERT: 'price_alert',
    MESSAGE_URGENT: 'message_urgent',
    QUOTATION_RECEIVED: 'quotation_received',
    PAYMENT_SUCCESS: 'payment_success',
    DELIVERY_DELAYED: 'delivery_delayed'
});

const hapticDefinitions = {
    [HapticPattern.SUCCESS]: [50],
    [HapticPattern.ERROR]: [200, 100, 200],
    [HapticPattern.WARNING]: [100, 50, 100],
    [HapticPattern.PRIORITY]: [50, 30, 50, 30, 50],
    [HapticPattern.NOTIFICATION]: [30],
    [HapticPattern.HEARTBEAT]: [100, 100, 100, 100, 100, 300],
    [HapticPattern.CELEBRATION]: [50, 50, 100, 50, 50, 150, 50]
};

const notificationToPattern = {
    [NotificationType.ORDER_CONFIRMED]: HapticPattern.SUCCESS,
    [NotificationType.ORDER_DELIVERED]: HapticPattern.SUCCESS,
    [NotificationType.STOCK_CRITICAL]: HapticPattern.ERROR,
    [NotificationType.PRICE_ALERT]: HapticPattern.WARNING,
    [NotificationType.MESSAGE_URGENT]: HapticPattern.PRIORITY,
    [NotificationType.QUOTATION_RECEIVED]: HapticPattern.NOTIFICATION,
    [NotificationType.PAYMENT_SUCCESS]: HapticPattern.CELEBRATION,
    [NotificationType.DELIVERY_DELAYED]: HapticPattern.WARNING
};

class HapticLanguageService {
    constructor() {
        this.isSupported = 'vibrate' in navigator;
        this.isEnabled = true;
        this.customPatterns = new Map();
        this.queue = [];
        this.isVibrating = false;
        this.metrics = { patternsSent: 0, queuedPatterns: 0 };
        this.learnedPatterns = new Map();
    }

    initialize() {
        if (!this.isSupported) {
            console.warn('[Haptic] Vibration API not supported');
        }
        console.log('[Haptic] Initialized, supported:', this.isSupported);
        return this.isSupported;
    }

    enable() { this.isEnabled = true; }
    disable() { this.isEnabled = false; }

    vibrate(pattern) {
        if (!this.isSupported || !this.isEnabled) return false;

        const patternArray = typeof pattern === 'string'
            ? (hapticDefinitions[pattern] || this.customPatterns.get(pattern) || [50])
            : pattern;

        try {
            navigator.vibrate(patternArray);
            this.metrics.patternsSent++;
            return true;
        } catch (error) {
            console.error('[Haptic] Vibration failed:', error);
            return false;
        }
    }

    stop() {
        if (this.isSupported) {
            navigator.vibrate(0);
            this.isVibrating = false;
        }
    }

    // ─────────────────────────────────────────────────
    // SEMANTIC HAPTICS
    // ─────────────────────────────────────────────────

    success() { return this.vibrate(HapticPattern.SUCCESS); }
    error() { return this.vibrate(HapticPattern.ERROR); }
    warning() { return this.vibrate(HapticPattern.WARNING); }
    priority() { return this.vibrate(HapticPattern.PRIORITY); }
    notification() { return this.vibrate(HapticPattern.NOTIFICATION); }
    heartbeat() { return this.vibrate(HapticPattern.HEARTBEAT); }
    celebration() { return this.vibrate(HapticPattern.CELEBRATION); }

    notify(notificationType) {
        const pattern = notificationToPattern[notificationType];
        if (pattern) {
            return this.vibrate(pattern);
        }
        return this.vibrate(HapticPattern.NOTIFICATION);
    }

    // ─────────────────────────────────────────────────
    // CONTEXT-AWARE HAPTICS
    // ─────────────────────────────────────────────────

    orderStatus(status) {
        const patterns = {
            'pending': HapticPattern.NOTIFICATION,
            'confirmed': HapticPattern.SUCCESS,
            'shipped': HapticPattern.PRIORITY,
            'delivered': HapticPattern.CELEBRATION,
            'delayed': HapticPattern.WARNING,
            'cancelled': HapticPattern.ERROR
        };
        return this.vibrate(patterns[status] || HapticPattern.NOTIFICATION);
    }

    stockLevel(currentStock, minStock) {
        const ratio = currentStock / minStock;
        if (ratio <= 0.2) return this.vibrate(HapticPattern.ERROR);
        if (ratio <= 0.5) return this.vibrate(HapticPattern.WARNING);
        if (ratio <= 1.0) return this.vibrate(HapticPattern.NOTIFICATION);
        return false;
    }

    priceChange(percentChange) {
        if (percentChange <= -10) return this.vibrate(HapticPattern.CELEBRATION);
        if (percentChange <= -5) return this.vibrate(HapticPattern.SUCCESS);
        if (percentChange >= 10) return this.vibrate(HapticPattern.ERROR);
        if (percentChange >= 5) return this.vibrate(HapticPattern.WARNING);
        return false;
    }

    urgencyLevel(level) {
        const patterns = {
            1: [20],
            2: [30, 20, 30],
            3: [50, 30, 50, 30, 50],
            4: [100, 50, 100, 50, 100],
            5: [150, 50, 150, 50, 150, 50, 150]
        };
        return this.vibrate(patterns[Math.min(5, Math.max(1, level))] || [20]);
    }

    // ─────────────────────────────────────────────────
    // NUMERIC COMMUNICATION
    // ─────────────────────────────────────────────────

    communicateNumber(number) {
        // Vibrate the number of times equal to the digit
        if (number < 0 || number > 9) return false;
        const pattern = [];
        for (let i = 0; i < number; i++) {
            pattern.push(80);
            if (i < number - 1) pattern.push(150);
        }
        return this.vibrate(pattern.length > 0 ? pattern : [200]);
    }

    communicateDigits(number) {
        const digits = String(number).split('').map(Number);
        let fullPattern = [];

        for (let i = 0; i < digits.length; i++) {
            for (let j = 0; j < digits[i]; j++) {
                fullPattern.push(60);
                fullPattern.push(100);
            }
            if (digits[i] === 0) fullPattern.push(300);
            if (i < digits.length - 1) fullPattern.push(400);
        }

        return this.vibrate(fullPattern);
    }

    // ─────────────────────────────────────────────────
    // CUSTOM PATTERNS
    // ─────────────────────────────────────────────────

    registerPattern(name, pattern) {
        this.customPatterns.set(name, pattern);
    }

    createMorsePattern(text) {
        const morse = {
            'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.', 'h': '....',
            'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---', 'p': '.--.',
            'q': '--.-', 'r': '.-.', 's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
            'y': '-.--', 'z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
            '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', ' ': ' '
        };

        const pattern = [];
        const dotDuration = 50;
        const dashDuration = 150;
        const pauseDuration = 50;
        const letterPause = 150;
        const wordPause = 350;

        for (const char of text.toLowerCase()) {
            const code = morse[char];
            if (!code) continue;

            if (char === ' ') {
                pattern.push(wordPause);
                continue;
            }

            for (const symbol of code) {
                pattern.push(symbol === '.' ? dotDuration : dashDuration);
                pattern.push(pauseDuration);
            }
            pattern.push(letterPause);
        }

        return pattern;
    }

    sendMorse(text) {
        const pattern = this.createMorsePattern(text);
        return this.vibrate(pattern);
    }

    // ─────────────────────────────────────────────────
    // LEARNING & TRAINING
    // ─────────────────────────────────────────────────

    async trainUser() {
        const training = [
            { name: 'Sucesso', pattern: HapticPattern.SUCCESS, description: 'Vibração curta - Confirmado' },
            { name: 'Erro', pattern: HapticPattern.ERROR, description: 'Vibração longa - Problema crítico' },
            { name: 'Atenção', pattern: HapticPattern.WARNING, description: 'Vibração dupla - Atenção necessária' },
            { name: 'Urgente', pattern: HapticPattern.PRIORITY, description: 'Vibração tripla rápida - Mensagem prioritária' }
        ];

        for (const item of training) {
            this.vibrate(item.pattern);
            await new Promise(r => setTimeout(r, 1500));
        }

        return training;
    }

    getMetrics() {
        return {
            ...this.metrics,
            isSupported: this.isSupported,
            isEnabled: this.isEnabled,
            customPatterns: this.customPatterns.size
        };
    }
}

export const hapticLanguage = new HapticLanguageService();
export { HapticPattern, NotificationType, HapticLanguageService };
export default hapticLanguage;
