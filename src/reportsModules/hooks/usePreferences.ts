/**
 * usePreferences — Auto-save User Preferences Hook
 * 
 * Manages user preferences with auto-save and persistence.
 * @author Padoca Engineering Team
 */

import { useState, useCallback, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface ChartAnnotation {
    id: string
    chartId: string
    x: number
    y: number
    text: string
    createdAt: string
    color: string
}

export interface ReportPreferences {
    selectedReports: string[]
    reportOrder: string[]
    bookmarkedReports: string[]
    dateRangePreset: 'last7days' | 'thisMonth' | 'lastMonth' | 'custom'
    comparisonPeriod: 'none' | 'lastMonth' | 'lastQuarter' | 'lastYear'
    collapsedSections: string[]
    chartZoomLevels: Record<string, number>
    annotations: Record<string, ChartAnnotation[]>
}

const DEFAULT_PREFERENCES: ReportPreferences = {
    selectedReports: ['abc', 'breakage', 'velocity', 'margin', 'forecast', 'efficiency', 'suppliers', 'cashflow'],
    reportOrder: ['abc', 'breakage', 'velocity', 'margin', 'forecast', 'efficiency', 'suppliers', 'cashflow'],
    bookmarkedReports: [],
    dateRangePreset: 'thisMonth',
    comparisonPeriod: 'none',
    collapsedSections: [],
    chartZoomLevels: {},
    annotations: {}
}

interface UsePreferencesReturn {
    preferences: ReportPreferences
    updatePreference: <K extends keyof ReportPreferences>(key: K, value: ReportPreferences[K]) => void
    resetPreferences: () => void
    lastSaved: Date | null
    isSaving: boolean
}

export function usePreferences(): UsePreferencesReturn {
    const [preferences, setPreferences] = useLocalStorage<ReportPreferences>('padoca-report-preferences', DEFAULT_PREFERENCES)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const updatePreference = useCallback(<K extends keyof ReportPreferences>(
        key: K,
        value: ReportPreferences[K]
    ) => {
        setIsSaving(true)
        setPreferences(prev => ({ ...prev, [key]: value }))

        // Debounced save indicator
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
            setIsSaving(false)
            setLastSaved(new Date())
        }, 500)
    }, [setPreferences])

    const resetPreferences = useCallback(() => {
        setPreferences(DEFAULT_PREFERENCES)
        setLastSaved(new Date())
    }, [setPreferences])

    return { preferences, updatePreference, resetPreferences, lastSaved, isSaving }
}
