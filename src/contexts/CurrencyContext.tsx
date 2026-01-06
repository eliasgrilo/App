import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

/**
 * CurrencyContext — Global Currency Management
 */

// ═══ TYPES ═══
export type CurrencyCode = 'CAD' | 'USD'
export type ProvinceCode = 'AB' | 'BC' | 'SK' | 'MB' | 'ON' | 'QC' | 'NB' | 'NS' | 'PE' | 'NL' | 'YT' | 'NT' | 'NU'

interface ProvinceData {
    name: string
    region: string
    gst: number
    pst: number
    hst: number
    total: number
    display: string
}

interface CurrencyConfig {
    locale: string
    currency: string
    symbol: string
}

interface CurrencyContextValue {
    currency: CurrencyCode
    setCurrency: (currency: CurrencyCode) => void
    province: ProvinceCode
    setProvince: (province: ProvinceCode) => void
    formatCurrency: (value: number | string | null | undefined) => string
    taxRate: number
    taxDisplay: string
    provinceName: string
    provinces: Record<ProvinceCode, ProvinceData>
    currencies: Record<CurrencyCode, CurrencyConfig>
}

interface CurrencyProviderProps {
    children: ReactNode
}

// Canadian Provincial Tax Rates (2024)
export const CANADA_PROVINCES: Record<ProvinceCode, ProvinceData> = {
    // Western Provinces
    AB: { name: 'Alberta', region: 'west', gst: 0.05, pst: 0, hst: 0, total: 0.05, display: '5% GST' },
    BC: { name: 'British Columbia', region: 'west', gst: 0.05, pst: 0.07, hst: 0, total: 0.12, display: '5% GST + 7% PST' },
    SK: { name: 'Saskatchewan', region: 'west', gst: 0.05, pst: 0.06, hst: 0, total: 0.11, display: '5% GST + 6% PST' },
    MB: { name: 'Manitoba', region: 'west', gst: 0.05, pst: 0.07, hst: 0, total: 0.12, display: '5% GST + 7% PST' },

    // Central Provinces
    ON: { name: 'Ontario', region: 'central', gst: 0, pst: 0, hst: 0.13, total: 0.13, display: '13% HST' },
    QC: { name: 'Quebec', region: 'central', gst: 0.05, pst: 0.09975, hst: 0, total: 0.14975, display: '5% GST + 9.975% QST' },

    // Atlantic Provinces
    NB: { name: 'New Brunswick', region: 'atlantic', gst: 0, pst: 0, hst: 0.15, total: 0.15, display: '15% HST' },
    NS: { name: 'Nova Scotia', region: 'atlantic', gst: 0, pst: 0, hst: 0.15, total: 0.15, display: '15% HST' },
    PE: { name: 'Prince Edward Island', region: 'atlantic', gst: 0, pst: 0, hst: 0.15, total: 0.15, display: '15% HST' },
    NL: { name: 'Newfoundland & Labrador', region: 'atlantic', gst: 0, pst: 0, hst: 0.15, total: 0.15, display: '15% HST' },

    // Northern Territories
    YT: { name: 'Yukon', region: 'north', gst: 0.05, pst: 0, hst: 0, total: 0.05, display: '5% GST' },
    NT: { name: 'Northwest Territories', region: 'north', gst: 0.05, pst: 0, hst: 0, total: 0.05, display: '5% GST' },
    NU: { name: 'Nunavut', region: 'north', gst: 0.05, pst: 0, hst: 0, total: 0.05, display: '5% GST' },
}

// Currency Symbols
const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
    CAD: { locale: 'en-CA', currency: 'CAD', symbol: '$' },
    USD: { locale: 'en-US', currency: 'USD', symbol: '$' },
}

// Context
const CurrencyContext = createContext<CurrencyContextValue | null>(null)

// Provider
export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
    const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
        try {
            const saved = localStorage.getItem('padoca-currency')
            return (saved === 'CAD' || saved === 'USD') ? saved : 'CAD'
        } catch {
            return 'CAD'
        }
    })
    const [province, setProvinceState] = useState<ProvinceCode>(() => {
        try {
            const saved = localStorage.getItem('padoca-province')
            return saved && saved in CANADA_PROVINCES ? saved as ProvinceCode : 'ON'
        } catch {
            return 'ON'
        }
    })

    // Set currency with persistence
    const setCurrency = useCallback((newCurrency: CurrencyCode): void => {
        if (CURRENCY_CONFIG[newCurrency]) {
            setCurrencyState(newCurrency)
            try {
                localStorage.setItem('padoca-currency', newCurrency)
            } catch { /* ignore storage errors */ }
        }
    }, [])

    // Set province with persistence
    const setProvince = useCallback((newProvince: ProvinceCode): void => {
        if (CANADA_PROVINCES[newProvince]) {
            setProvinceState(newProvince)
            try {
                localStorage.setItem('padoca-province', newProvince)
            } catch { /* ignore storage errors */ }
        }
    }, [])

    // Format currency value
    const formatCurrency = useCallback((value: number | string | null | undefined): string => {
        const config = CURRENCY_CONFIG[currency]
        const numValue = typeof value === 'string' ? parseFloat(value) : value
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: config.currency,
            minimumFractionDigits: 2
        }).format(numValue || 0)
    }, [currency])

    // Get current tax rate
    const taxRate = CANADA_PROVINCES[province]?.total || 0.13
    const taxDisplay = CANADA_PROVINCES[province]?.display || '13% HST'
    const provinceName = CANADA_PROVINCES[province]?.name || 'Ontario'

    const value: CurrencyContextValue = {
        currency,
        setCurrency,
        province,
        setProvince,
        formatCurrency,
        taxRate,
        taxDisplay,
        provinceName,
        provinces: CANADA_PROVINCES,
        currencies: CURRENCY_CONFIG,
    }

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    )
}

// Hook
export const useCurrency = (): CurrencyContextValue => {
    const context = useContext(CurrencyContext)
    if (!context) {
        // Fallback for components not wrapped in provider
        return {
            currency: 'CAD',
            setCurrency: () => { },
            province: 'ON',
            setProvince: () => { },
            formatCurrency: (v) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(v) || 0),
            taxRate: 0.13,
            taxDisplay: '13% HST',
            provinceName: 'Ontario',
            provinces: CANADA_PROVINCES,
            currencies: CURRENCY_CONFIG,
        }
    }
    return context
}

export default CurrencyContext
