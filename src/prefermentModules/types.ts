// ═══════════════════════════════════════════════════════════════════
// PREFERMENT MODULES — Types
// ═══════════════════════════════════════════════════════════════════

export type PrefermentType = 'None' | 'Poolish' | 'Biga' | 'Levain'
export type InputMode = 'pct' | 'grams'

export interface PrefermentData { pct?: number | string; hydration?: number | string; yeastPct?: number | string; inoculationPct?: number | string; time_h?: number | string; temp_C?: number | string }

export interface PrefermentDataSet { poolish?: PrefermentData; biga?: PrefermentData; levain?: PrefermentData;[key: string]: PrefermentData | undefined }

export interface PrefermentProps { value: PrefermentType; onChange?: (type: PrefermentType) => void; data: PrefermentDataSet; onDataChange?: (data: PrefermentDataSet) => void; inputMode?: InputMode; flourWeight?: number }

export const PREFERMENT_TYPES: PrefermentType[] = ['None', 'Poolish', 'Biga', 'Levain']

export const getPrefermentFlourWeight = (flourWeight: number, d: PrefermentData | undefined): number => flourWeight * (Number(d?.pct) || 0) / 100

export const formatNumber = (val: number | string | undefined, decimals: number = 0, unit: string = ''): string => {
    let n = Number(val); if (!Number.isFinite(n)) return '—'
    let displayUnit = unit; let displayDecimals = decimals
    if (unit === 'g' && Math.abs(n) >= 1000) { n = n / 1000; displayUnit = 'kg'; displayDecimals = 2 }
    const s = n.toLocaleString('pt-BR', { minimumFractionDigits: displayDecimals, maximumFractionDigits: displayDecimals })
    return displayUnit ? `${s} ${displayUnit}` : s
}
