import React from 'react'
import DualInput from './DualInput.jsx'

export default function Preferment({ value, onChange, data, onDataChange, inputMode = 'pct', flourWeight = 1000 }) {
  const types = ['None', 'Poolish', 'Biga', 'Levain']

  function set(key, field, val) {
    onDataChange?.({
      ...data,
      [key]: { ...data[key], [field]: (Number.isNaN(val) ? '' : val) }
    })
  }

  // Dynamic label based on mode
  const unitLabel = inputMode === 'grams' ? 'g' : '%'

  // Calculate preferment flour weight
  const getPrefermentFlourWeight = (d) => {
    return flourWeight * (Number(d?.pct) || 0) / 100
  }

  // Format number for display with dynamic g/kg conversion
  const formatNumber = (val, decimals = 0, unit = '') => {
    let n = Number(val)
    if (!Number.isFinite(n)) return '—'

    let displayUnit = unit
    let displayDecimals = decimals

    // Dynamic Unit Conversion: g -> kg
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

  // Render inputs for a specific preferment type
  const renderInputs = (key) => {
    const d = data[key]
    if (!d) return null

    const prefFlourWeight = getPrefermentFlourWeight(d)
    const prefWaterWeight = prefFlourWeight * (Number(d.hydration) || 0) / 100

    return (
      <div className="space-y-4">
        {/* Inputs grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <DualInput
            label={`Farinha Pref. (${unitLabel})`}
            value={d.pct}
            onChange={(v) => set(key, 'pct', v)}
            mode={inputMode}
            flourWeight={flourWeight}
            name={`${key}-pct`}
          />
          <DualInput
            label={`Água (${unitLabel})`}
            value={d.hydration}
            onChange={(v) => set(key, 'hydration', Math.min(200, Math.max(0, v)))}
            mode={inputMode}
            flourWeight={prefFlourWeight > 0 ? prefFlourWeight : flourWeight}
            name={`${key}-hydration`}
          />
          {typeof d.yeastPct !== 'undefined' && (
            <DualInput
              label={`Fermento (${unitLabel})`}
              value={d.yeastPct}
              onChange={(v) => set(key, 'yeastPct', v)}
              mode={inputMode}
              flourWeight={prefFlourWeight > 0 ? prefFlourWeight : flourWeight}
              name={`${key}-yeast`}
              decimals={2}
            />
          )}
          {typeof d.inoculationPct !== 'undefined' && (
            <label className="block">
              <div className="label mb-1">Inoculação (%)</div>
              <div className="relative">
                <input
                  className="input text-right pr-8"
                  type="number"
                  inputMode="decimal"
                  value={d.inoculationPct}
                  onChange={(e) => set(key, 'inoculationPct', parseFloat(e.target.value))}
                  step={1}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-gray-500 dark:text-gray-400 font-medium">%</span>
              </div>
            </label>
          )}
          <label className="block">
            <div className="label mb-1">Tempo</div>
            <div className="relative">
              <input
                className="input text-right pr-8"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={d.time_h}
                onChange={(e) => set(key, 'time_h', parseFloat(e.target.value))}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-gray-500 dark:text-gray-400 font-medium">h</span>
            </div>
          </label>
          <label className="block">
            <div className="label mb-1">Temp.</div>
            <div className="relative">
              <input
                className="input text-right pr-8"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={d.temp_C}
                onChange={(e) => set(key, 'temp_C', parseFloat(e.target.value))}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-gray-500 dark:text-gray-400 font-medium">°C</span>
            </div>
          </label>
        </div>

        {/* Summary display - only show in grams mode */}
        {inputMode === 'grams' && (
          <div className="rounded-lg bg-gray-100 dark:bg-zinc-800 p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Resumo do Pré-fermento:</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Farinha:</span>
                <span className="ml-2 font-semibold">{formatNumber(prefFlourWeight, 0, 'g')}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Água:</span>
                <span className="ml-2 font-semibold">{formatNumber(prefWaterWeight, 0, 'g')}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total:</span>
                <span className="ml-2 font-semibold">{formatNumber(prefFlourWeight + prefWaterWeight, 0, 'g')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="label">Tipo de Fermentação</div>
      <div className="flex flex-wrap gap-2">
        {types.map(t => (
          <label key={t} className={"button " + (value === t ? "primary" : "")}>
            <input type="radio" className="sr-only" name="prefermentType" value={t} checked={value === t} onChange={() => onChange?.(t)} />
            {t}
          </label>
        ))}
      </div>

      {value === 'Poolish' && renderInputs('poolish')}
      {value === 'Biga' && renderInputs('biga')}
      {value === 'Levain' && renderInputs('levain')}

      {value === 'None' && (
        <p className="text-sm opacity-70">Sem pré-fermento. Prosseguir com fermentação direta.</p>
      )}
    </div>
  )
}