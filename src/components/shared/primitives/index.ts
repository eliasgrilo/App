/**
 * Shared UI Primitives — Barrel Export
 * Apple-quality components for consistent design across the app
 */

// Animation System
export {
    SPRING,
    SPRING_BOUNCY,
    SPRING_SMOOTH,
    backdropVariants,
    modalVariants,
    staggerContainer,
    staggerItem
} from './animations'

// Design Tokens
export { GRADIENTS, type GradientKey } from './tokens'

// Components
export { GlassCard, type GlassCardProps } from './GlassCard'
export { SectionHeader, type SectionHeaderProps } from './SectionHeader'
export { FormRow, type FormRowProps } from './FormRow'
export { AppleInput, type AppleInputProps } from './AppleInput'
export { AppleToggle, type AppleToggleProps } from './AppleToggle'
export { AppleTextarea, type AppleTextareaProps } from './AppleTextarea'
