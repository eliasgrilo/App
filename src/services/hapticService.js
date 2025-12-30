/**
 * Haptic Service - iOS Haptic Feedback & Vibration Patterns
 * Apple-quality tactile feedback for Pro interactions
 */

// Haptic patterns (milliseconds) - tuned for iOS feel
const HAPTIC_PATTERNS = {
    // Success - short affirming pulse
    success: [10],

    // Warning - double pulse
    warning: [15, 50, 15],

    // Error - longer buzz
    error: [30, 100, 30],

    // Selection - micro tap
    selection: [5],

    // Impact - light thud
    impactLight: [8],
    impactMedium: [15],
    impactHeavy: [25],

    // Timeline scrub - rapid ticks
    scrub: [3],

    // Scan success - triple pulse
    scanSuccess: [10, 30, 10, 30, 10],

    // Approval - satisfying confirmation
    approval: [10, 50, 20, 50, 10],

    // Notification - attention grab
    notification: [15, 100, 15, 100, 30],

    // ═══════════════════════════════════════════════════════════════
    // Invoice Scanning Haptics - Apple-quality tactile orchestration
    // ═══════════════════════════════════════════════════════════════

    // Invoice capture - camera shutter feel
    invoiceCapture: [15, 30, 15],

    // Item recognized - triple confirm as items appear
    itemRecognized: [5, 20, 5, 20, 5],

    // Batch commit - satisfying DB commit success
    batchCommit: [10, 50, 20, 100, 30],

    // Validation error - warning shake
    validationError: [50, 100, 50],

    // Price spike detected - attention alert
    priceSpike: [30, 50, 30, 50, 30],

    // Semantic match found - subtle confirmation
    semanticMatch: [8, 25, 8],

    // Review required - needs attention
    reviewRequired: [20, 80, 20]
}

// Check if haptics are supported
export function isHapticsSupported() {
    return 'vibrate' in navigator
}

// Check if device is iOS (for enhanced haptics via Taptic Engine)
export function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

/**
 * Trigger haptic feedback
 * @param {string} type - Haptic pattern type
 * @returns {boolean} - Whether haptic was triggered
 */
export function triggerHaptic(type = 'selection') {
    if (!isHapticsSupported()) return false

    const pattern = HAPTIC_PATTERNS[type]
    if (!pattern) {
        console.warn(`Unknown haptic type: ${type}`)
        return false
    }

    try {
        navigator.vibrate(pattern)
        return true
    } catch (e) {
        console.warn('Haptic feedback failed:', e)
        return false
    }
}

/**
 * Trigger haptic with custom pattern
 * @param {number[]} pattern - Vibration pattern in milliseconds
 */
export function triggerCustomHaptic(pattern) {
    if (!isHapticsSupported()) return false

    try {
        navigator.vibrate(pattern)
        return true
    } catch (e) {
        return false
    }
}

/**
 * Cancel any ongoing haptic
 */
export function cancelHaptic() {
    if (isHapticsSupported()) {
        navigator.vibrate(0)
    }
}

/**
 * Continuous haptic feedback for timeline scrubbing
 * Call repeatedly as user scrubs
 */
let lastScrubTime = 0
const SCRUB_THROTTLE = 50 // ms between scrub haptics

export function triggerScrubHaptic() {
    const now = Date.now()
    if (now - lastScrubTime < SCRUB_THROTTLE) return false
    lastScrubTime = now
    return triggerHaptic('scrub')
}

// Web Authentication API for biometric security
export async function authenticateWithBiometric(options = {}) {
    const {
        reason = 'Confirme sua identidade',
        timeout = 60000
    } = options

    // Check if Web Authentication is supported
    if (!window.PublicKeyCredential) {
        throw new Error('Autenticação biométrica não suportada neste navegador')
    }

    // Check if biometric authenticator is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    if (!available) {
        throw new Error('Nenhum autenticador biométrico disponível')
    }

    // Create credential challenge
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const publicKeyOptions = {
        challenge,
        rp: {
            name: 'Padoca App',
            id: window.location.hostname
        },
        user: {
            id: new Uint8Array(16),
            name: 'padoca-user',
            displayName: 'Usuário Padoca'
        },
        pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
        },
        timeout
    }

    try {
        // Request biometric authentication
        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions
        })

        if (credential) {
            triggerHaptic('approval')
            return {
                success: true,
                timestamp: new Date().toISOString()
            }
        }

        throw new Error('Autenticação cancelada')
    } catch (error) {
        triggerHaptic('error')

        if (error.name === 'NotAllowedError') {
            throw new Error('Autenticação negada pelo usuário')
        }
        if (error.name === 'SecurityError') {
            throw new Error('Contexto de segurança inválido')
        }

        throw error
    }
}

// Quick biometric check without full credential creation
export async function quickBiometricCheck() {
    if (!window.PublicKeyCredential) return false

    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        return available
    } catch {
        return false
    }
}

// Haptic Service object
export const HapticService = {
    isSupported: isHapticsSupported,
    isIOS: isIOSDevice,
    trigger: triggerHaptic,
    triggerCustom: triggerCustomHaptic,
    cancel: cancelHaptic,
    scrub: triggerScrubHaptic,
    authenticate: authenticateWithBiometric,
    canUseBiometric: quickBiometricCheck,
    patterns: HAPTIC_PATTERNS
}

export default HapticService
