import { ChangeEvent, ReactNode } from 'react'

// ═══ TYPES ═══
type YeastTypeValue = 'None' | 'ADY' | 'IDY' | 'CY'

interface YeastData {
  yeastPct?: number | string
}

interface YeastDataSet {
  ADY?: YeastData
  IDY?: YeastData
  CY?: YeastData
  [key: string]: YeastData | undefined
}

interface FermentacaoProps {
  value: YeastTypeValue
  onChange?: (type: YeastTypeValue) => void
  data: YeastDataSet
  onDataChange?: (data: YeastDataSet) => void
}

export default function Fermentacao({ value, onChange, data, onDataChange }: FermentacaoProps): ReactNode {
  const types: YeastTypeValue[] = ['None', 'ADY', 'IDY', 'CY']

  function set(key: string, field: string, val: number): void {
    onDataChange?.({
      ...data,
      [key]: { ...data[key], [field]: (Number.isNaN(val) ? '' : val) }
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
          <label className="block">
            <div className="label mb-1">Active Dry Yeast (%)</div>
            <input
              className="input text-right"
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              value={data.ADY?.yeastPct ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set('ADY', 'yeastPct', parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}

      {value === 'IDY' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <label className="block">
            <div className="label mb-1">Instant Dry Yeast (%)</div>
            <input
              className="input text-right"
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              value={data.IDY?.yeastPct ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set('IDY', 'yeastPct', parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}

      {value === 'CY' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <label className="block">
            <div className="label mb-1">Compressed Yeast (%)</div>
            <input
              className="input text-right"
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              value={data.CY?.yeastPct ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set('CY', 'yeastPct', parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}

      {value === 'None' && (
        <p className="text-sm opacity-70">Sem Fermento. Prosseguir apenas com o Pré-Fermento.</p>
      )}
    </div>
  )
}