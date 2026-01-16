/**
 * useReportsState — State Management Hook (Apple HIG Compliant)
 * 
 * Manages reports selection, date range, and loading states.
 * Extracted from ReportsPage for clean separation of concerns.
 * 
 * @author Padoca Engineering Team
 */

import { useState, useCallback } from 'react'
import type { DateRange, ReportType } from '../types'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface UseReportsStateReturn {
    // State
    isLoading: boolean
    dateRange: DateRange
    selectedReports: ReportType[]
    showReportMenu: boolean

    // Actions
    setDateRange: (range: DateRange) => void
    toggleReport: (id: ReportType) => void
    selectAllReports: () => void
    selectNoReports: () => void
    setShowReportMenu: (show: boolean) => void

    // Computed
    printButtonLabel: string
    hasSelectedReports: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const ALL_REPORTS: ReportType[] = [
    'abc', 'breakage', 'velocity', 'margin',
    'forecast', 'efficiency', 'suppliers', 'cashflow'
]

const getDefaultDateRange = (): DateRange => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return { start, end, preset: 'custom' }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useReportsState(): UseReportsStateReturn {
    const [isLoading, setIsLoading] = useState(false)
    const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange)
    const [selectedReports, setSelectedReports] = useState<ReportType[]>(ALL_REPORTS)
    const [showReportMenu, setShowReportMenu] = useState(false)

    // Toggle single report
    const toggleReport = useCallback((id: ReportType) => {
        setSelectedReports(prev =>
            prev.includes(id)
                ? prev.filter(r => r !== id)
                : [...prev, id]
        )
    }, [])

    // Select all reports
    const selectAllReports = useCallback(() => {
        setSelectedReports(ALL_REPORTS)
    }, [])

    // Select no reports
    const selectNoReports = useCallback(() => {
        setSelectedReports([])
    }, [])

    // Computed: Print button label
    const printButtonLabel = selectedReports.length === 0
        ? 'Selecione relatórios'
        : selectedReports.length === ALL_REPORTS.length
            ? 'Imprimir Todos (8)'
            : `Imprimir (${selectedReports.length})`

    // Computed: Has selected reports
    const hasSelectedReports = selectedReports.length > 0

    return {
        isLoading,
        dateRange,
        selectedReports,
        showReportMenu,
        setDateRange,
        toggleReport,
        selectAllReports,
        selectNoReports,
        setShowReportMenu,
        printButtonLabel,
        hasSelectedReports
    }
}

export default useReportsState
