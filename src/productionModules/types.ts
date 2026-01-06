/**
 * ═══════════════════════════════════════════════════════════════════
 * Production Module Types
 * All local types for the Production module
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type InputMode = 'percent' | 'grams'
export type YeastTypeKey = 'ADY' | 'IDY' | 'CY'
export type YeastTypeValue = 'None' | 'ADY' | 'IDY' | 'CY'
export type PrefermentType = 'None' | 'Poolish' | 'Biga' | 'Levain'
export type PrefermentKey = 'poolish' | 'biga' | 'levain'

export interface ProductionProps {
    inputMode: InputMode
    setInputMode: (mode: InputMode) => void
}

export interface YeastDataItem {
    yeastPct: number
}

export interface YeastTypeData {
    ADY: YeastDataItem
    IDY: YeastDataItem
    CY: YeastDataItem
    [key: string]: YeastDataItem | undefined
}

export interface PrefermentDataItem {
    pct: number
    hydration: number
    yeastPct?: number
    inoculationPct?: number
    time_h: number
    temp_C: number
}

export interface PrefermentData {
    poolish: PrefermentDataItem
    biga: PrefermentDataItem
    levain: PrefermentDataItem
    [key: string]: PrefermentDataItem | undefined
}

export interface InputState {
    flour: number
    water: number
    sugar: number
    salt: number
    oliveOil: number
    oil: number
    milk: number
    butter: number
    diastatic: number
    RT_h: number
    RT_C: number
    CT_h: number
    CT_C: number
    doughBalls: number
    ballWeight: number
    yeastType: YeastTypeData
    yeastSelection: YeastTypeValue
    prefermentType: PrefermentType
    preferment: PrefermentData
}

export interface GramsInputState {
    flour: number
    water: number
    sugar: number
    salt: number
    oliveOil: number
    oil: number
    milk: number
    butter: number
    diastatic: number
    yeast: number
}

export interface InputModalState {
    title: string
    placeholder: string
    defaultValue: string
    onConfirm: (value: string) => void
    onCancel: () => void
}

export interface Recipes {
    [name: string]: InputState
}

export interface DisplayGrams {
    flour: number
    water: number
    sugar: number
    salt: number
    oliveOil: number
    oil: number
    milk: number
    butter: number
    diastatic: number
    yeast: number
    total: number
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_INPUT_STATE: InputState = {
    flour: 100,
    water: 70,
    sugar: 0,
    salt: 2.5,
    oliveOil: 0,
    oil: 0,
    milk: 0,
    butter: 0,
    diastatic: 0,
    RT_h: 6,
    RT_C: 21,
    CT_h: 48,
    CT_C: 4,
    doughBalls: 10,
    ballWeight: 300,
    yeastType: {
        ADY: { yeastPct: 0.04 },
        IDY: { yeastPct: 0.12 },
        CY: { yeastPct: 0.05 },
    },
    yeastSelection: 'IDY',
    prefermentType: 'None',
    preferment: {
        poolish: { pct: 30, hydration: 70, yeastPct: 0.05, time_h: 12, temp_C: 22 },
        biga: { pct: 30, hydration: 50, yeastPct: 0.05, time_h: 16, temp_C: 18 },
        levain: { pct: 20, hydration: 100, inoculationPct: 20, time_h: 12, temp_C: 24 },
    },
}

export const DEFAULT_GRAMS_STATE: GramsInputState = {
    flour: 1736,
    water: 1215,
    sugar: 0,
    salt: 43,
    oliveOil: 0,
    oil: 0,
    milk: 0,
    butter: 0,
    diastatic: 0,
    yeast: 2
}

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

export function formatNumber(val: number | string, decimals: number = 0, unit: string = ''): string {
    let n = Number(val)
    if (!Number.isFinite(n)) return '—'

    let displayUnit = unit
    let displayDecimals = decimals

    if (unit === 'g' && Math.abs(n) >= 1000) {
        n = n / 1000
        displayUnit = 'kg'
        displayDecimals = 2
    }

    const s = n.toLocaleString('pt-BR', {
        minimumFractionDigits: displayDecimals,
        maximumFractionDigits: displayDecimals
    })
    return displayUnit ? `${s} ${displayUnit}` : s
}

export function hasValue(val: number | string): boolean {
    return (Number(val) || 0) > 0.001
}
