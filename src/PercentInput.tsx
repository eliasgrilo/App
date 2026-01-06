import { ChangeEvent, ReactNode } from 'react'

interface PercentInputProps {
  label: string
  value?: number | string
  onChange?: (value: number) => void
  name?: string
  min?: number
  max?: number
  step?: number
}

export default function PercentInput({
  label,
  value,
  onChange,
  name,
  min = 0,
  max = 100,
  step = 0.1
}: PercentInputProps): ReactNode {
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onChange?.(parseFloat(e.target.value))
  }

  return (
    <label className="block">
      <div className="label mb-1">{label}</div>
      <div className="relative">
        <input
          className="input text-right"
          type="number"
          inputMode="decimal"
          pattern="[0-9]*"
          name={name}
          min={min}
          max={max}
          step={step}
          value={value ?? ''}
          onChange={handleChange}
          placeholder="0"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-gray-500">%</span>
      </div>
    </label>
  )
}