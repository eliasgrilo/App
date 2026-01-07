// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Barrel Export
// ═══════════════════════════════════════════════════════════════════

// Types
export * from './types'

// Hooks
export { useAIState } from './hooks/useAIState'
export type { AIStateReturn } from './hooks/useAIState'
export { useAIHandlers } from './hooks/useAIHandlers'

// Components
export { AIHeader } from './components/AIHeader'
export { AIHealthCard } from './components/AIHealthCard'
export { AIStatsCards } from './components/AIStatsCards'
export { SupplierAlertsSection } from './components/SupplierAlertsSection'
export { EmailComposerModal } from './components/EmailComposerModal'
export { EmailSuccessModal } from './components/EmailSuccessModal'
export { EmailHistorySection } from './components/EmailHistorySection'
export { EmailFormFields } from './components/EmailFormFields'
export { QuotationManagementSection } from './components/QuotationManagementSection'
export { QuotationCard } from './components/QuotationCard'
export { ReceivedItemsModal } from './components/ReceivedItemsModal'
