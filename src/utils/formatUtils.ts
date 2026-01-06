/**
 * Format Utilities - Padoca Pizza
 * Canadian Dollar (CAD) formatting and Calgary timezone
 */

// Calgary timezone (Mountain Time)
const TIMEZONE = 'America/Edmonton'
const LOCALE = 'en-CA'
const CURRENCY = 'CAD'

/**
 * Format currency in Canadian Dollars
 */
export const formatCurrency = (value: number | string): string => {
    const num = Number(value) || 0
    return new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency: CURRENCY,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num)
}

/**
 * Format currency without symbol (just the number)
 */
export const formatNumber = (value: number | string): string => {
    const num = Number(value) || 0
    return new Intl.NumberFormat(LOCALE, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num)
}

/**
 * Format date in Calgary timezone
 */
export const formatDate = (
    date: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = {}
): string => {
    if (!date) return '—'

    const defaultOptions: Intl.DateTimeFormatOptions = {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        ...options
    }

    try {
        return new Date(date).toLocaleDateString(LOCALE, defaultOptions)
    } catch {
        return '—'
    }
}

/**
 * Format date and time in Calgary timezone
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return '—'

    try {
        return new Date(date).toLocaleString(LOCALE, {
            timeZone: TIMEZONE,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return '—'
    }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
    if (!date) return '—'

    try {
        const now = new Date()
        const then = new Date(date)
        const diffMs = now.getTime() - then.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'agora'
        if (diffMins < 60) return `${diffMins} min atrás`
        if (diffHours < 24) return `${diffHours}h atrás`
        if (diffDays < 7) return `${diffDays} dias atrás`

        return formatDate(date)
    } catch {
        return '—'
    }
}

/**
 * Get current Calgary time
 */
export const getCalgaryTime = (): string => {
    return new Date().toLocaleString(LOCALE, { timeZone: TIMEZONE })
}

/**
 * Format time only in Calgary timezone
 */
export const formatTime = (date: string | Date | null | undefined): string => {
    if (!date) return '—'

    try {
        return new Date(date).toLocaleTimeString(LOCALE, {
            timeZone: TIMEZONE,
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return '—'
    }
}

export default {
    formatCurrency,
    formatNumber,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    formatTime,
    getCalgaryTime,
    TIMEZONE,
    LOCALE,
    CURRENCY
}
