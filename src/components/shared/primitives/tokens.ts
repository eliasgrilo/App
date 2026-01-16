/**
 * Design Tokens — Apple-style gradients and visual constants
 * Shared across all modal and component implementations
 */

export const GRADIENTS = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-violet-500 to-violet-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    cyan: 'from-cyan-500 to-cyan-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-400 to-teal-500',
} as const

export type GradientKey = keyof typeof GRADIENTS
