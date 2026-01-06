// ═══════════════════════════════════════════════════════════════════
// QUOTATION PILL — Re-exports from modules
// Refactored: 627 → ~20 lines (barrel export only)
// ═══════════════════════════════════════════════════════════════════

export { PillInput, PillSelector, PillStepper, PillToggle, PillBadge, PillCard } from '../quotationPillModules'
export type { PillInputProps, PillSelectorProps, PillStepperProps, PillToggleProps, PillBadgeProps, PillCardProps, PillSize, PillVariant, BadgeType, CardVariant, TextAlign } from '../quotationPillModules'

// Default export for backward compatibility
export { PillBadge as default } from '../quotationPillModules'
