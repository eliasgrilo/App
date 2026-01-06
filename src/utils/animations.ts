/**
 * Animation Constants — Apple HIG Consistency
 * 
 * Centralized animation configurations for modals, toasts, and transitions.
 * Based on Apple's Human Interface Guidelines spring physics.
 */

import type { Transition } from 'framer-motion'

// ═══ TYPES ═══
type HapticType = 'impact' | 'success' | 'error' | 'selection'

interface HapticServiceType {
    impact: () => void
    success: () => void
    error: () => void
    selection: () => void
    trigger: (type?: HapticType) => void
}

// Standard modal animations
export const MODAL_ANIMATIONS = {
    // Fade in/out for backdrops
    fade: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94] as const
    },

    // Spring physics for modal cards
    spring: {
        type: 'spring' as const,
        damping: 30,
        stiffness: 350
    } satisfies Transition,

    // Gentler spring for smaller elements
    springGentle: {
        type: 'spring' as const,
        damping: 25,
        stiffness: 300
    } satisfies Transition,

    // Quick spring for buttons and toggles
    springQuick: {
        type: 'spring' as const,
        damping: 20,
        stiffness: 400
    } satisfies Transition
}

// Bottom sheet animations
export const SHEET_ANIMATIONS = {
    initial: { y: '100%', scale: 0.95 },
    animate: { y: 0, scale: 1 },
    exit: { y: '100%', scale: 0.95, opacity: 0 }
}

// Centered modal animations
export const CENTERED_MODAL_ANIMATIONS = {
    initial: { scale: 0.9, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.9, opacity: 0, y: 20 }
}

// Toast animations
export const TOAST_ANIMATIONS = {
    initial: { opacity: 0, y: -20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 }
}

// Stagger children animations
export const STAGGER_CHILDREN = {
    container: {
        animate: {
            transition: {
                staggerChildren: 0.05
            }
        }
    },
    item: {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 }
    }
}

/**
 * HapticService — Real haptic feedback for PWA
 * 
 * Uses the Vibration API when available.
 * Falls back to no-op for unsupported browsers.
 */
export const HapticService: HapticServiceType = {
    // Light impact
    impact: (): void => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10)
        }
    },

    // Success feedback
    success: (): void => {
        if ('vibrate' in navigator) {
            navigator.vibrate([10, 30, 10])
        }
    },

    // Error feedback
    error: (): void => {
        if ('vibrate' in navigator) {
            navigator.vibrate([30, 50, 30])
        }
    },

    // Selection change
    selection: (): void => {
        if ('vibrate' in navigator) {
            navigator.vibrate(5)
        }
    },

    // Generic trigger (backward compatible)
    trigger: (type: HapticType = 'impact'): void => {
        const hapticFn = HapticService[type]
        if (hapticFn && typeof hapticFn === 'function') {
            hapticFn()
        } else {
            HapticService.impact()
        }
    }
}

export default {
    MODAL_ANIMATIONS,
    SHEET_ANIMATIONS,
    CENTERED_MODAL_ANIMATIONS,
    TOAST_ANIMATIONS,
    STAGGER_CHILDREN,
    HapticService
}
