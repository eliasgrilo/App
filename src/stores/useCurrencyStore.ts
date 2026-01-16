import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
    CurrencyCode,
    CurrencyConfig,
    CURRENCY_CONFIG
} from '../currencyModules'

/**
 * ═══════════════════════════════════════════════════════════════════
 * CURRENCY STORE — Zustand-based Currency Management
 * Simplified for Brazilian Real (BRL) only
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ STATE INTERFACE ═══
interface CurrencyState {
    currency: CurrencyCode
}

interface CurrencyActions {
    setCurrency: (currency: CurrencyCode) => void
    formatCurrency: (value: number | string | null | undefined) => string
}

interface CurrencyComputed {
    currencies: Record<CurrencyCode, CurrencyConfig>
}

type CurrencyStore = CurrencyState & CurrencyActions

// ═══ INITIAL STATE ═══
const initialState: CurrencyState = {
    currency: 'BRL'
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

            formatCurrency: (value) => {
                const storedCurrency = get().currency
                // Fallback to BRL if stored currency is not in config (handles migration from old currencies)
                const config = CURRENCY_CONFIG[storedCurrency] || CURRENCY_CONFIG['BRL']
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
                currency: state.currency
            }),
            onRehydrateStorage: () => (state) => {
                // Migrate old CAD/USD currencies to BRL
                if (state && !CURRENCY_CONFIG[state.currency]) {
                    state.currency = 'BRL'
                }
            }
        }
    )
)

// ═══ COMPUTED SELECTORS ═══
export const useCurrencyComputed = (): CurrencyComputed => {
    return {
        currencies: CURRENCY_CONFIG
    }
}

// ═══ CONVENIENCE HOOK (backward compatibility) ═══
export const useCurrency = () => {
    const currency = useCurrencyStore((state) => state.currency)
    const setCurrency = useCurrencyStore((state) => state.setCurrency)
    const formatCurrency = useCurrencyStore((state) => state.formatCurrency)
    const computed = useCurrencyComputed()

    return {
        currency,
        setCurrency,
        formatCurrency,
        ...computed
    }
}

export default useCurrencyStore
