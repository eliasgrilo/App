// ═══════════════════════════════════════════════════════════════════
// CURRENCY CONTEXT MODULES — Data & Types
// ═══════════════════════════════════════════════════════════════════

import { ReactNode } from 'react'

export type CurrencyCode = 'CAD' | 'USD'
export type ProvinceCode = 'AB' | 'BC' | 'SK' | 'MB' | 'ON' | 'QC' | 'NB' | 'NS' | 'PE' | 'NL' | 'YT' | 'NT' | 'NU'

export interface ProvinceData { name: string; region: string; gst: number; pst: number; hst: number; total: number; display: string }
export interface CurrencyConfig { locale: string; currency: string; symbol: string }
export interface CurrencyContextValue { currency: CurrencyCode; setCurrency: (currency: CurrencyCode) => void; province: ProvinceCode; setProvince: (province: ProvinceCode) => void; formatCurrency: (value: number | string | null | undefined) => string; taxRate: number; taxDisplay: string; provinceName: string; provinces: Record<ProvinceCode, ProvinceData>; currencies: Record<CurrencyCode, CurrencyConfig> }
export interface CurrencyProviderProps { children: ReactNode }

// Canadian Provincial Tax Rates (2024)
export const CANADA_PROVINCES: Record<ProvinceCode, ProvinceData> = {
    AB: { name: 'Alberta', region: 'west', gst: 0.05, pst: 0, hst: 0, total: 0.05, display: '5% GST' },
    BC: { name: 'British Columbia', region: 'west', gst: 0.05, pst: 0.07, hst: 0, total: 0.12, display: '5% GST + 7% PST' },
    SK: { name: 'Saskatchewan', region: 'west', gst: 0.05, pst: 0.06, hst: 0, total: 0.11, display: '5% GST + 6% PST' },
    MB: { name: 'Manitoba', region: 'west', gst: 0.05, pst: 0.07, hst: 0, total: 0.12, display: '5% GST + 7% PST' },
    ON: { name: 'Ontario', region: 'central', gst: 0, pst: 0, hst: 0.13, total: 0.13, display: '13% HST' },
    QC: { name: 'Quebec', region: 'central', gst: 0.05, pst: 0.09975, hst: 0, total: 0.14975, display: '5% GST + 9.975% QST' },
    NB: { name: 'New Brunswick', region: 'atlantic', gst: 0, pst: 0, hst: 0.15, total: 0.15, display: '15% HST' },
    NS: { name: 'Nova Scotia', region: 'atlantic', gst: 0, pst: 0, hst: 0.15, total: 0.15, display: '15% HST' },
    PE: { name: 'Prince Edward Island', region: 'atlantic', gst: 0, pst: 0, hst: 0.15, total: 0.15, display: '15% HST' },
    NL: { name: 'Newfoundland & Labrador', region: 'atlantic', gst: 0, pst: 0, hst: 0.15, total: 0.15, display: '15% HST' },
    YT: { name: 'Yukon', region: 'north', gst: 0.05, pst: 0, hst: 0, total: 0.05, display: '5% GST' },
    NT: { name: 'Northwest Territories', region: 'north', gst: 0.05, pst: 0, hst: 0, total: 0.05, display: '5% GST' },
    NU: { name: 'Nunavut', region: 'north', gst: 0.05, pst: 0, hst: 0, total: 0.05, display: '5% GST' },
}

export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
    CAD: { locale: 'en-CA', currency: 'CAD', symbol: '$' },
    USD: { locale: 'en-US', currency: 'USD', symbol: '$' },
}
