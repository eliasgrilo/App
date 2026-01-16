/**
 * ═══════════════════════════════════════════════════════════════════
 * STORES — Barrel Export for all Zustand Stores
 * ═══════════════════════════════════════════════════════════════════
 */

// App Store (existing - data entities)
export { default as useAppStore } from './useAppStore'
export { useRecipes, useIngredients, useProducts, useSuppliers, useExpenses, useSettings, useStockMovements } from './useAppStore'
export type { MovementType, ReasonCode, StockMovement } from './useAppStore'

// Currency Store (new - migrated from CurrencyContext)
export { default as useCurrencyStore, useCurrency, useCurrencyComputed } from './useCurrencyStore'

// Theme Store (new - app-wide theme management)
export { default as useThemeStore, useTheme, initTheme } from './useThemeStore'
export type { ThemeMode } from './useThemeStore'

// UI Store (new - migrated from ModalContext + ToastContext)
export { default as useUIStore, useModal, useToast, useConfirmState, useToasts } from './useUIStore'
export type { ConfirmOptions, ConfirmState } from './useUIStore'

// Global UI Components
export { GlobalUIComponents } from './GlobalUIComponents'
