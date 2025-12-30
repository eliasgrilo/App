/**
 * Tax Configuration Service - Province-based Dynamic Tax Rates
 * Supports GST, PST, HST for Canadian provinces
 */

// ═══════════════════════════════════════════════════════════════
// CANADIAN PROVINCE TAX RATES (2024)
// ═══════════════════════════════════════════════════════════════

export const PROVINCE_TAX_RATES = {
    AB: {
        name: 'Alberta',
        city: 'Calgary',
        gst: 0.05,
        pst: 0,
        hst: 0,
        totalRate: 0.05,
        taxType: 'GST',
        displayRate: '5% GST'
    },
    ON: {
        name: 'Ontario',
        city: 'Toronto',
        gst: 0,
        pst: 0,
        hst: 0.13,
        totalRate: 0.13,
        taxType: 'HST',
        displayRate: '13% HST'
    },
    BC: {
        name: 'British Columbia',
        city: 'Vancouver',
        gst: 0.05,
        pst: 0.07,
        hst: 0,
        totalRate: 0.12,
        taxType: 'GST+PST',
        displayRate: '5% GST + 7% PST'
    },
    QC: {
        name: 'Quebec',
        city: 'Montreal',
        gst: 0.05,
        pst: 0.09975,
        hst: 0,
        totalRate: 0.14975,
        taxType: 'GST+QST',
        displayRate: '5% GST + 9.975% QST'
    },
    MB: {
        name: 'Manitoba',
        city: 'Winnipeg',
        gst: 0.05,
        pst: 0.07,
        hst: 0,
        totalRate: 0.12,
        taxType: 'GST+PST',
        displayRate: '5% GST + 7% PST'
    },
    SK: {
        name: 'Saskatchewan',
        city: 'Regina',
        gst: 0.05,
        pst: 0.06,
        hst: 0,
        totalRate: 0.11,
        taxType: 'GST+PST',
        displayRate: '5% GST + 6% PST'
    },
    NS: {
        name: 'Nova Scotia',
        city: 'Halifax',
        gst: 0,
        pst: 0,
        hst: 0.15,
        totalRate: 0.15,
        taxType: 'HST',
        displayRate: '15% HST'
    },
    NB: {
        name: 'New Brunswick',
        city: 'Fredericton',
        gst: 0,
        pst: 0,
        hst: 0.15,
        totalRate: 0.15,
        taxType: 'HST',
        displayRate: '15% HST'
    },
    NL: {
        name: 'Newfoundland & Labrador',
        city: "St. John's",
        gst: 0,
        pst: 0,
        hst: 0.15,
        totalRate: 0.15,
        taxType: 'HST',
        displayRate: '15% HST'
    },
    PE: {
        name: 'Prince Edward Island',
        city: 'Charlottetown',
        gst: 0,
        pst: 0,
        hst: 0.15,
        totalRate: 0.15,
        taxType: 'HST',
        displayRate: '15% HST'
    }
}

// ═══════════════════════════════════════════════════════════════
// TIMEZONE MAPPING
// ═══════════════════════════════════════════════════════════════

export const PROVINCE_TIMEZONES = {
    AB: 'America/Edmonton',
    ON: 'America/Toronto',
    BC: 'America/Vancouver',
    QC: 'America/Toronto',
    MB: 'America/Winnipeg',
    SK: 'America/Regina',
    NS: 'America/Halifax',
    NB: 'America/Halifax',
    NL: 'America/St_Johns',
    PE: 'America/Halifax'
}

// ═══════════════════════════════════════════════════════════════
// TAX CONFIG STATE
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'padoca_province_config'
const DEFAULT_PROVINCE = 'AB' // Calgary, Alberta

let currentProvince = DEFAULT_PROVINCE
let taxConfig = PROVINCE_TAX_RATES[DEFAULT_PROVINCE]
let listeners = []

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Get current tax configuration
 */
export const getTaxConfig = () => ({
    province: currentProvince,
    ...taxConfig
})

/**
 * Get tax rate for current province
 */
export const getTaxRate = () => taxConfig.totalRate

/**
 * Get formatted tax display string
 */
export const getTaxDisplay = () => taxConfig.displayRate

/**
 * Calculate tax for a given amount
 */
export const calculateTax = (amount) => {
    const n = Number(amount) || 0
    return n * taxConfig.totalRate
}

/**
 * Calculate total with tax
 */
export const calculateWithTax = (amount) => {
    const n = Number(amount) || 0
    return n * (1 + taxConfig.totalRate)
}

/**
 * Format price with tax note
 */
export const formatPriceWithTaxNote = (amount, formatCurrency) => {
    const subtotal = Number(amount) || 0
    const tax = calculateTax(subtotal)
    const total = subtotal + tax

    return {
        subtotal,
        tax,
        total,
        note: `Includes ${formatCurrency(tax)} ${taxConfig.taxType} for ${taxConfig.name}`
    }
}

/**
 * Set province and update tax config
 */
export const setProvince = (provinceCode) => {
    if (!PROVINCE_TAX_RATES[provinceCode]) {
        console.warn(`Unknown province: ${provinceCode}`)
        return false
    }

    currentProvince = provinceCode
    taxConfig = PROVINCE_TAX_RATES[provinceCode]

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        province: provinceCode,
        updatedAt: new Date().toISOString()
    }))

    // Notify listeners
    listeners.forEach(fn => fn(getTaxConfig()))

    // Dispatch global event for components not using the hook
    window.dispatchEvent(new CustomEvent('tax-config-updated', {
        detail: getTaxConfig()
    }))

    return true
}

/**
 * Subscribe to tax config changes
 */
export const subscribe = (callback) => {
    listeners.push(callback)
    return () => {
        listeners = listeners.filter(fn => fn !== callback)
    }
}

/**
 * Load province from localStorage
 */
export const loadSavedProvince = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const { province } = JSON.parse(saved)
            if (PROVINCE_TAX_RATES[province]) {
                currentProvince = province
                taxConfig = PROVINCE_TAX_RATES[province]
            }
        }
    } catch (e) {
        console.warn('Failed to load province config:', e)
    }
}

// Auto-load on import
loadSavedProvince()

// ═══════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'

export const useTaxConfig = () => {
    const [config, setConfig] = useState(getTaxConfig())

    useEffect(() => {
        const unsubscribe = subscribe(setConfig)
        return unsubscribe
    }, [])

    return {
        ...config,
        setProvince,
        calculateTax,
        calculateWithTax,
        formatPriceWithTaxNote
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT SERVICE OBJECT
// ═══════════════════════════════════════════════════════════════

export const TaxConfigService = {
    getConfig: getTaxConfig,
    getRate: getTaxRate,
    getDisplay: getTaxDisplay,
    calculateTax,
    calculateWithTax,
    formatPriceWithTaxNote,
    setProvince,
    subscribe,
    loadSaved: loadSavedProvince,
    PROVINCES: PROVINCE_TAX_RATES,
    TIMEZONES: PROVINCE_TIMEZONES
}

export default TaxConfigService
