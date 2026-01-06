import { ReactNode } from 'react'
import DualInput from './DualInput'

// ═══ TYPES ═══
type YeastTypeValue = 'None' | 'ADY' | 'IDY' | 'CY'
type InputMode = 'pct' | 'grams'

interface YeastData {
  yeastPct?: number | string
}

export interface YeastDataSet {
  ADY?: YeastData
  IDY?: YeastData
  CY?: YeastData
  [key: string]: YeastData | undefined
}

interface YeastTypeProps {
  value: YeastTypeValue
  onChange?: (type: YeastTypeValue) => void
  data: YeastDataSet
  onDataChange?: (data: YeastDataSet) => void
  inputMode?: InputMode
  flourWeight?: number
}

export default function YeastType({
  value,
  onChange,
  data,
  onDataChange,
  inputMode = 'pct',
  flourWeight = 1000
}: YeastTypeProps): ReactNode {
  const types: YeastTypeValue[] = ['None', 'ADY', 'IDY', 'CY']

  function set(key: string, field: string, val: number): void {
    onDataChange?.({
      ...data,
      [key]: { ...data[key], [field]: val }
    })
  }

  return (
    <div className="space-y-3">
      <div className="label">Tipos de Fermentos</div>
      <div className="flex flex-wrap gap-2">
        {types.map(t => (
          <label key={t} className={"button " + (value === t ? "primary" : "")}>
            <input type="radio" className="sr-only" name="yeastType" value={t} checked={value === t} onChange={() => onChange?.(t)} />
            {t}
          </label>
        ))}
      </div>

      {value === 'ADY' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <DualInput
            label="Active Dry Yeast"
            value={data.ADY?.yeastPct}
            onChange={(v: number) => set('ADY', 'yeastPct', v)}
            mode={inputMode}
            flourWeight={flourWeight}
            name="ADY-yeast"
            decimals={3}
          />
        </div>
      )}

      {value === 'IDY' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <DualInput
            label="Instant Dry Yeast"
            value={data.IDY?.yeastPct}
            onChange={(v: number) => set('IDY', 'yeastPct', v)}
            mode={inputMode}
            flourWeight={flourWeight}
            name="IDY-yeast"
            decimals={3}
          />
        </div>
      )}

      {value === 'CY' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <DualInput
            label="Compressed Yeast"
            value={data.CY?.yeastPct}
            onChange={(v: number) => set('CY', 'yeastPct', v)}
            mode={inputMode}
            flourWeight={flourWeight}
            name="CY-yeast"
            decimals={3}
          />
        </div>
      )}

      {value === 'None' && (
        <p className="text-sm opacity-70">Sem Fermento. Prosseguir apenas com o Pré-Fermento.</p>
      )}
    </div>
  )
}