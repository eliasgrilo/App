// ═══════════════════════════════════════════════════════════════════
// CURRENCY CONTEXT MODULES — Data & Types
// Brazilian Real (BRL) configuration
// ═══════════════════════════════════════════════════════════════════

import { ReactNode } from 'react'

export type CurrencyCode = 'BRL'

export interface CurrencyConfig { locale: string; currency: string; symbol: string }
export interface CurrencyContextValue { currency: CurrencyCode; setCurrency: (currency: CurrencyCode) => void; formatCurrency: (value: number | string | null | undefined) => string }
export interface CurrencyProviderProps { children: ReactNode }

export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
    BRL: { locale: 'pt-BR', currency: 'BRL', symbol: 'R$' },
}
