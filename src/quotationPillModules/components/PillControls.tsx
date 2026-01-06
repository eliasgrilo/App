// ═══════════════════════════════════════════════════════════════════
// QUOTATION PILL MODULES — PillSelector, PillStepper, PillToggle
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { PillSelectorProps, PillStepperProps, PillToggleProps, PillSize } from '../types'

export const PillSelector: React.FC<PillSelectorProps> = ({ options = [], value, onChange, label, size = 'md' }) => {
    const sizes: Record<PillSize, string> = { sm: 'h-8 text-[12px]', md: 'h-9 text-[13px]', lg: 'h-11 text-[15px]' }
    return (
        <div className="flex flex-col gap-1.5">
            {label && <span className="text-[11px] font-semibold text-[#86868b] dark:text-[#8e8e93] uppercase tracking-widest ml-3">{label}</span>}
            <div className="flex gap-1 p-1 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-full">
                {options.map(opt => {
                    const isActive = value === opt
                    return (
                        <motion.button key={opt} type="button" onClick={() => onChange(opt)} whileTap={{ scale: 0.95 }}
                            className={`relative px-3.5 ${sizes[size]} rounded-full font-semibold transition-colors z-10 ${isActive ? 'text-white' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'}`}>
                            {isActive && <motion.div layoutId="pillSelector" className="absolute inset-0 bg-[#007aff] rounded-full" style={{ boxShadow: '0 2px 8px rgba(0,122,255,0.4)' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />}
                            <span className="relative z-10">{opt}</span>
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}

export const PillStepper: React.FC<PillStepperProps> = ({ value = 1, onChange, min = 0, max = 99, step = 1, label, suffix }) => {
    const canDecrement = value > min, canIncrement = value < max
    return (
        <div className="flex flex-col gap-1.5">
            {label && <span className="text-[11px] font-semibold text-[#86868b] dark:text-[#8e8e93] uppercase tracking-widest ml-3">{label}</span>}
            <div className="flex items-center gap-3 px-3 h-11 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-full">
                <motion.button type="button" onClick={() => canDecrement && onChange(Math.max(min, value - step))} disabled={!canDecrement}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[20px] leading-none transition-all ${canDecrement ? 'bg-[#007aff] text-white' : 'bg-[#e5e5e7] dark:bg-[#3a3a3c] text-[#c7c7cc]'}`}
                    style={{ boxShadow: canDecrement ? '0 2px 8px rgba(0,122,255,0.35)' : 'none' }} whileTap={{ scale: canDecrement ? 0.88 : 1 }} whileHover={{ scale: canDecrement ? 1.08 : 1 }}>−</motion.button>
                <div className="flex items-baseline gap-1 min-w-[56px] justify-center">
                    <motion.span key={value} initial={{ opacity: 0, y: -12, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="text-[22px] font-bold text-[#1d1d1f] dark:text-white tabular-nums" style={{ fontFamily: '-apple-system, SF Pro Display, system-ui' }}>{value}</motion.span>
                    {suffix && <span className="text-[13px] text-[#86868b] font-semibold">{suffix}</span>}
                </div>
                <motion.button type="button" onClick={() => canIncrement && onChange(Math.min(max, value + step))} disabled={!canIncrement}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[20px] leading-none transition-all ${canIncrement ? 'bg-[#007aff] text-white' : 'bg-[#e5e5e7] dark:bg-[#3a3a3c] text-[#c7c7cc]'}`}
                    style={{ boxShadow: canIncrement ? '0 2px 8px rgba(0,122,255,0.35)' : 'none' }} whileTap={{ scale: canIncrement ? 0.88 : 1 }} whileHover={{ scale: canIncrement ? 1.08 : 1 }}>+</motion.button>
            </div>
        </div>
    )
}

export const PillToggle: React.FC<PillToggleProps> = ({ on = false, onChange, label, onLabel = 'On', offLabel = 'Off' }) => {
    return (
        <div className="flex flex-col gap-1.5">
            {label && <span className="text-[11px] font-semibold text-[#86868b] dark:text-[#8e8e93] uppercase tracking-widest ml-3">{label}</span>}
            <motion.button type="button" onClick={() => onChange(!on)} className={`relative h-11 rounded-full px-1 flex items-center transition-colors duration-300 ${on ? 'bg-[#34c759]' : 'bg-[#e5e5e7] dark:bg-[#3a3a3c]'}`}
                style={{ width: '84px', boxShadow: on ? '0 4px 16px rgba(52,199,89,0.35)' : 'none' }} whileTap={{ scale: 0.97 }}>
                <motion.span className="absolute left-3 text-[10px] font-bold uppercase tracking-wider" animate={{ opacity: on ? 1 : 0, x: on ? 0 : -5 }} style={{ color: 'white' }}>{onLabel}</motion.span>
                <motion.span className="absolute right-3 text-[10px] font-bold uppercase tracking-wider text-[#86868b]" animate={{ opacity: !on ? 1 : 0, x: !on ? 0 : 5 }}>{offLabel}</motion.span>
                <motion.div className="w-9 h-9 bg-white rounded-full flex items-center justify-center" animate={{ x: on ? 42 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <motion.svg width="14" height="14" viewBox="0 0 14 14" animate={{ opacity: 1 }}>
                        {on ? <motion.path d="M2 7L5.5 10.5L12 4" stroke="#34c759" strokeWidth="2.5" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25, ease: 'easeOut' }} />
                            : <path d="M3 7H11" stroke="#c7c7cc" strokeWidth="2" strokeLinecap="round" />}
                    </motion.svg>
                </motion.div>
            </motion.button>
        </div>
    )
}
