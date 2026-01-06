// ═══════════════════════════════════════════════════════════════════
// ADD EXPENSE MODULES — Barrel Export
// ═══════════════════════════════════════════════════════════════════

// Icons and types
export { Icons, CategoryIcons, CategoryColors, EXPENSE_TYPES, DEFAULT_CATEGORIES } from './Icons'
export type { CategoryOption, ExpenseFormData } from './Icons'

// Form Components
export { Section, Row, NameInput, SmartInput, SegmentedControl } from './components/FormComponents'
export type { SectionProps, RowProps, NameInputProps, SmartInputProps, SegmentedControlProps } from './components/FormComponents'

// Complex Components
export { AppleDatePicker, CategoryGrid, SummaryCard } from './components/ComplexComponents'
export type { AppleDatePickerProps, CategoryGridProps, SummaryCardProps } from './components/ComplexComponents'
