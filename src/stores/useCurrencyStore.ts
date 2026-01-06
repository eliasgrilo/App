import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
    CurrencyCode,
    ProvinceCode,
    CurrencyConfig,
    ProvinceData,
    CANADA_PROVINCES,
    CURRENCY_CONFIG
} from '../currencyModules'

/**
 * ═══════════════════════════════════════════════════════════════════
 * CURRENCY STORE — Zustand-based Currency Management
 * Migrated from CurrencyContext with full persistence
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ STATE INTERFACE ═══
interface CurrencyState {
    currency: CurrencyCode
    province: ProvinceCode
}

interface CurrencyActions {
    setCurrency: (currency: CurrencyCode) => void
    setProvince: (province: ProvinceCode) => void
    formatCurrency: (value: number | string | null | undefined) => string
}

interface CurrencyComputed {
    taxRate: number
    taxDisplay: string
    provinceName: string
    provinces: Record<ProvinceCode, ProvinceData>
    currencies: Record<CurrencyCode, CurrencyConfig>
}

type CurrencyStore = CurrencyState & CurrencyActions

// ═══ INITIAL STATE ═══
const initialState: CurrencyState = {
    currency: 'CAD',
    province: 'ON'
}

// ═══ STORE ═══
export const useCurrencyStore = create<CurrencyStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            setCurrency: (currency) => {
                if (CURRENCY_CONFIG[currency]) {
                    set({ currency })
                }
            },

            setProvince: (province) => {
                if (CANADA_PROVINCES[province]) {
                    set({ province })
                }
            },

            formatCurrency: (value) => {
                const config = CURRENCY_CONFIG[get().currency]
                const numValue = typeof value === 'string' ? parseFloat(value) : value
                return new Intl.NumberFormat(config.locale, {
                    style: 'currency',
                    currency: config.currency,
                    minimumFractionDigits: 2
                }).format(numValue || 0)
            }
        }),
        {
            name: 'padoca-currency',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                currency: state.currency,
                province: state.province
            })
        }
    )
)

// ═══ COMPUTED SELECTORS ═══
export const useCurrencyComputed = (): CurrencyComputed => {
    const province = useCurrencyStore((state) => state.province)
    const provinceData = CANADA_PROVINCES[province]

    return {
        taxRate: provinceData?.total || 0.13,
        taxDisplay: provinceData?.display || '13% HST',
        provinceName: provinceData?.name || 'Ontario',
        provinces: CANADA_PROVINCES,
        currencies: CURRENCY_CONFIG
    }
}

// ═══ CONVENIENCE HOOK (backward compatibility) ═══
export const useCurrency = () => {
    const currency = useCurrencyStore((state) => state.currency)
    const province = useCurrencyStore((state) => state.province)
    const setCurrency = useCurrencyStore((state) => state.setCurrency)
    const setProvince = useCurrencyStore((state) => state.setProvince)
    const formatCurrency = useCurrencyStore((state) => state.formatCurrency)
    const computed = useCurrencyComputed()

    return {
        currency,
        province,
        setCurrency,
        setProvince,
        formatCurrency,
        ...computed
    }
}

export default useCurrencyStore
