/**
 * Animation System — Apple-quality springs
 * Shared across all modal and component implementations
 */

export const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 }
export const SPRING_BOUNCY = { type: 'spring' as const, stiffness: 600, damping: 25, mass: 0.5 }
export const SPRING_SMOOTH = { type: 'spring' as const, stiffness: 300, damping: 35, mass: 1 }

export const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: SPRING },
    exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
}

export const staggerContainer = {
    visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
}

export const staggerItem = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: SPRING_SMOOTH },
}
