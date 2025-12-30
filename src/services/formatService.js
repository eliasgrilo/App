/**
 * FormatService - Centralized Formatting for Currency, Date, and Numbers
 * Forces CAD (Canadian Dollar) globally as per user requirement
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION - Calgary, Alberta Defaults
// ═══════════════════════════════════════════════════════════════

const DEFAULT_LOCALE = 'en-CA'
const DEFAULT_CURRENCY = 'CAD'
const DEFAULT_TIMEZONE = 'America/Edmonton' // Mountain Time (Calgary)

// Alberta Tax: 5% GST only (no PST)
export const ALBERTA_GST_RATE = 0.05
export const ALBERTA_PST_RATE = 0  // Alberta has no provincial sales tax
export const ALBERTA_TOTAL_TAX_RATE = ALBERTA_GST_RATE + ALBERTA_PST_RATE

// These can be updated via Settings panel
let currentLocale = DEFAULT_LOCALE
let currentCurrency = DEFAULT_CURRENCY
let currentTimezone = DEFAULT_TIMEZONE

// ═══════════════════════════════════════════════════════════════
// CURRENCY FORMATTING
// ═══════════════════════════════════════════════════════════════

/**
 * Format a value as currency (CAD by default)
 * @param {number} value - The value to format
 * @param {object} options - Optional overrides
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, options = {}) => {
    const n = Number(value) || 0
    const locale = options.locale || currentLocale
    const currency = options.currency || currentCurrency

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(n)
}

/**
 * Format a value as compact currency (e.g., $1.2K, $3.4M)
 */
export const formatCurrencyCompact = (value, options = {}) => {
    const n = Number(value) || 0
    const locale = options.locale || currentLocale
    const currency = options.currency || currentCurrency

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
    }).format(n)
}

// ═══════════════════════════════════════════════════════════════
// NUMBER FORMATTING
// ═══════════════════════════════════════════════════════════════

/**
 * Format a number with locale-specific separators
 */
export const formatNumber = (value, options = {}) => {
    const n = Number(value) || 0
    const locale = options.locale || currentLocale

    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: options.decimals ?? 0,
        maximumFractionDigits: options.decimals ?? 2
    }).format(n)
}

/**
 * Format a percentage
 */
export const formatPercent = (value, options = {}) => {
    const n = Number(value) || 0
    const locale = options.locale || currentLocale

    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: options.decimals ?? 0,
        maximumFractionDigits: options.decimals ?? 1
    }).format(n / 100)
}

// ═══════════════════════════════════════════════════════════════
// DATE/TIME FORMATTING
// ═══════════════════════════════════════════════════════════════

/**
 * Format a date
 */
export const formatDate = (date, options = {}) => {
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return '—'

    const locale = options.locale || currentLocale
    const style = options.style || 'medium'

    const styleMap = {
        short: { dateStyle: 'short' },
        medium: { dateStyle: 'medium' },
        long: { dateStyle: 'long' },
        full: { dateStyle: 'full' }
    }

    return new Intl.DateTimeFormat(locale, {
        ...styleMap[style],
        timeZone: options.timezone || currentTimezone
    }).format(d)
}

/**
 * Format a date and time
 */
export const formatDateTime = (date, options = {}) => {
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return '—'

    const locale = options.locale || currentLocale

    return new Intl.DateTimeFormat(locale, {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: options.timezone || currentTimezone
    }).format(d)
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export const formatRelativeTime = (date) => {
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return '—'

    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffSecs = Math.round(diffMs / 1000)
    const diffMins = Math.round(diffSecs / 60)
    const diffHours = Math.round(diffMins / 60)
    const diffDays = Math.round(diffHours / 24)

    const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' })

    if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, 'second')
    if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute')
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')
    return rtf.format(diffDays, 'day')
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Update format settings (called from Settings panel)
 */
export const updateSettings = (settings) => {
    if (settings.locale) currentLocale = settings.locale
    if (settings.currency) currentCurrency = settings.currency
    if (settings.timezone) currentTimezone = settings.timezone

    // Persist to localStorage
    localStorage.setItem('padoca_format_settings', JSON.stringify({
        locale: currentLocale,
        currency: currentCurrency,
        timezone: currentTimezone
    }))
}

/**
 * Get current settings
 */
export const getSettings = () => ({
    locale: currentLocale,
    currency: currentCurrency,
    timezone: currentTimezone
})

/**
 * Load settings from localStorage (call on app init)
 */
export const loadSettings = () => {
    try {
        const saved = localStorage.getItem('padoca_format_settings')
        if (saved) {
            const settings = JSON.parse(saved)
            if (settings.locale) currentLocale = settings.locale
            if (settings.currency) currentCurrency = settings.currency
            if (settings.timezone) currentTimezone = settings.timezone
        }
    } catch (e) {
        console.warn('Failed to load format settings:', e)
    }
}

// Auto-load on import
loadSettings()

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export const FormatService = {
    // Currency
    currency: formatCurrency,
    currencyCompact: formatCurrencyCompact,

    // Numbers
    number: formatNumber,
    percent: formatPercent,

    // Dates
    date: formatDate,
    dateTime: formatDateTime,
    relativeTime: formatRelativeTime,

    // Settings
    updateSettings,
    getSettings,
    loadSettings
}

export default FormatService
