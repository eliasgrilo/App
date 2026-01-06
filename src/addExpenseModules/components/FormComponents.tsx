// ═══════════════════════════════════════════════════════════════════
// ADD EXPENSE MODULE — Form Components
// Section, Row, NameInput, SmartInput, SegmentedControl
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, ChangeEvent, ReactNode } from 'react'
import { motion } from 'framer-motion'

// Section
export interface SectionProps { icon: ReactNode; title: string; children: ReactNode; delay?: number }
export function Section({ icon, title, children, delay = 0 }: SectionProps) {
    return (
        <motion.section className="mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: delay * 0.06 }}>
            <div className="flex items-center gap-2.5 mb-2.5 px-4">
                <span className="text-[#007aff]">{icon}</span>
                <span className="text-[13px] font-semibold text-[#8e8e93] uppercase tracking-wide">{title}</span>
            </div>
            <div className="mx-4 bg-white dark:bg-[#1c1c1e] rounded-[14px] overflow-hidden shadow-sm border border-black/[0.04] dark:border-white/[0.06]">{children}</div>
        </motion.section>
    )
}

// Row
export interface RowProps { label: string; last?: boolean; children: ReactNode; onClick?: () => void }
export function Row({ label, last, children, onClick }: RowProps) {
    const baseClasses = `flex items-center justify-between min-h-[52px] px-4 ${!last ? 'border-b border-[#e5e5ea]/60 dark:border-[#38383a]/80' : ''}`

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={`${baseClasses} w-full text-left active:bg-[#f5f5f7] dark:active:bg-[#2c2c2e] cursor-pointer transition-colors`}>
                <span className="text-[17px] text-[#1d1d1f] dark:text-white">{label}</span>
                <div className="flex items-center gap-2">{children}</div>
            </button>
        )
    }

    return (
        <div className={baseClasses}>
            <span className="text-[17px] text-[#1d1d1f] dark:text-white">{label}</span>
            <div className="flex items-center gap-2">{children}</div>
        </div>
    )
}

// NameInput
export interface NameInputProps { value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; placeholder?: string; autoFocus?: boolean }
export function NameInput({ value, onChange, placeholder, autoFocus }: NameInputProps) {
    const [focused, setFocused] = useState(false)
    return (
        <motion.div className="relative" animate={{ backgroundColor: focused ? 'rgba(0,122,255,0.02)' : 'transparent' }} transition={{ duration: 0.2 }}>
            <input type="text" value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                className="w-full h-[52px] px-4 text-[17px] font-medium bg-transparent text-[#1d1d1f] dark:text-white placeholder:text-[#aeaeb2] outline-none transition-all duration-[250ms]" />
        </motion.div>
    )
}

// SmartInput
export interface SmartInputProps { value: string | number; onChange: (e: { target: { value: string } }) => void; placeholder?: string; inputMode?: 'text' | 'decimal' | 'numeric'; format?: 'integer' | 'number' | 'currency'; suffix?: string; prefix?: string; width?: string }
export function SmartInput({ value, onChange, placeholder, inputMode = 'text', format, suffix, prefix, width = 'w-24' }: SmartInputProps) {
    const [focused, setFocused] = useState(false)
    const [localValue, setLocalValue] = useState(String(value))
    useEffect(() => { setLocalValue(String(value)) }, [value])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value
        if (format === 'integer') val = val.replace(/\D/g, '')
        else if (format === 'number' || format === 'currency') { val = val.replace(/[^\d.]/g, ''); const parts = val.split('.'); if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('') }
        setLocalValue(val); onChange({ target: { value: val } })
    }

    return (
        <div className="flex items-center gap-1.5">
            {prefix && <motion.span className="text-[17px] font-medium" animate={{ color: focused ? '#007aff' : '#8e8e93' }}>{prefix}</motion.span>}
            <motion.div animate={{ boxShadow: focused ? '0 0 0 4px rgba(0,122,255,0.15)' : '0 0 0 0px rgba(0,122,255,0)' }} style={{ borderRadius: 10 }} transition={{ duration: 0.2 }}>
                <input type="text" inputMode={inputMode} value={localValue} onChange={handleChange} placeholder={placeholder}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    className={`${width} h-[36px] px-3 text-[17px] font-medium tabular-nums text-right bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px] text-[#007aff] placeholder:text-[#aeaeb2] outline-none transition-colors duration-[250ms] ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}`} />
            </motion.div>
            {suffix && <span className="text-[15px] font-medium text-[#8e8e93]">{suffix}</span>}
        </div>
    )
}

// SegmentedControl
export interface SegmentedControlProps { value: string; options: { id: string; label: string }[]; onChange: (value: string) => void }
export function SegmentedControl({ value, options, onChange }: SegmentedControlProps) {
    const selectedIndex = options.findIndex(o => o.id === value)
    return (
        <div className="relative p-[2px] rounded-[9px] bg-[#e9e9eb] dark:bg-[#39393d]" style={{ display: 'flex' }}>
            <motion.div className="absolute top-[2px] bottom-[2px] rounded-[7px] bg-white dark:bg-[#636366]"
                style={{ width: `calc(${100 / options.length}% - 2px)`, boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)' }}
                animate={{ x: `calc(${selectedIndex * 100}% + ${selectedIndex * 2}px)` }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
            {options.map(opt => (
                <button key={opt.id} type="button" onClick={() => onChange(opt.id)}
                    className={`relative z-10 flex-1 h-[32px] text-[13px] font-semibold transition-colors duration-[250ms] ${opt.id === value ? 'text-[#1d1d1f] dark:text-white' : 'text-[#8e8e93] dark:text-[#98989d]'}`}>{opt.label}</button>
            ))}
        </div>
    )
}
