// ═══════════════════════════════════════════════════════════════════
// Preferment — Preferment type selector and inputs
// Refactored: 203 → ~35 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import { ReactNode } from 'react'
import { PrefermentType, PrefermentDataSet, PrefermentInputs, PREFERMENT_TYPES } from './prefermentModules'

export { type PrefermentDataSet } from './prefermentModules'

interface PrefermentProps { value: PrefermentType; onChange?: (type: PrefermentType) => void; data: PrefermentDataSet; onDataChange?: (data: PrefermentDataSet) => void; inputMode?: 'pct' | 'grams'; flourWeight?: number }

export default function Preferment({ value, onChange, data, onDataChange, inputMode = 'pct', flourWeight = 1000 }: PrefermentProps): ReactNode {
  const set = (key: string, field: string, val: number): void => onDataChange?.({ ...data, [key]: { ...data[key], [field]: (Number.isNaN(val) ? '' : val) } })

  return (
    <div className="space-y-3">
      <div className="label">Tipo de Fermentação</div>
      <div className="flex flex-wrap gap-2">{PREFERMENT_TYPES.map(t => (<label key={t} className={"button " + (value === t ? "primary" : "")}><input type="radio" className="sr-only" name="prefermentType" value={t} checked={value === t} onChange={() => onChange?.(t)} />{t}</label>))}</div>
      {value === 'Poolish' && <PrefermentInputs dataKey="poolish" data={data} inputMode={inputMode} flourWeight={flourWeight} onSet={set} />}
      {value === 'Biga' && <PrefermentInputs dataKey="biga" data={data} inputMode={inputMode} flourWeight={flourWeight} onSet={set} />}
      {value === 'Levain' && <PrefermentInputs dataKey="levain" data={data} inputMode={inputMode} flourWeight={flourWeight} onSet={set} />}
      {value === 'None' && <p className="text-sm opacity-70">Sem pré-fermento. Prosseguir com fermentação direta.</p>}
    </div>
  )
}