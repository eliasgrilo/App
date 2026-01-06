/**
 * ═══════════════════════════════════════════════════════════════════
 * suppliersModules barrel exports
 * All components, hooks, types and utilities for Suppliers module
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════
export type {
    LinkedItem, SupplierDocument, SupplierFormData,
    LocalSupplier, ViewingDocument, DocumentCategory
} from './types'

// ═══════════════════════════════════════════════════════════════════
// Constants & Utilities
// ═══════════════════════════════════════════════════════════════════
export {
    DEFAULT_FORM_DATA, DOCUMENT_CATEGORIES,
    formatFileSize, getFileIcon
} from './types'

// ═══════════════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════════════
export { useSuppliersState } from './hooks/useSuppliersState'
export type { SuppliersStateReturn } from './hooks/useSuppliersState'

export { useSuppliersHandlers } from './hooks/useSuppliersHandlers'
export type { SuppliersHandlersReturn, UseSuppliersHandlersProps } from './hooks/useSuppliersHandlers'

// ═══════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════
export { SuppliersGrid } from './components/SuppliersGrid'
export { QuotesView } from './components/QuotesView'
export { SupplierDetailModal } from './components/SupplierDetailModal'
