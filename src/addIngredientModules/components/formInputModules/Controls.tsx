// ═══════════════════════════════════════════════════════════════════
// FORM INPUTS MODULES — Controls (SegmentedControl, UnitSelector)
// Toggle re-exported from shared/inputs
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icons } from '../../Icons'

// Re-export Toggle from shared
export { Toggle, type ToggleProps } from '../../../components/shared/inputs'

export interface SegmentedControlOption { id: string; label: string }
export interface SegmentedControlProps { value: string; options: SegmentedControlOption[]; onChange: (id: string) => void }

export function SegmentedControl({ value, options, onChange }: SegmentedControlProps) {
    const selectedIndex = options.findIndex(o => o.id === value)
    return (
        <div className="relative mx-4 my-3 p-[2px] rounded-[9px] bg-[#e9e9eb] dark:bg-[#39393d]" style={{ display: 'flex' }}>
            <motion.div className="absolute top-[2px] bottom-[2px] rounded-[7px] bg-white dark:bg-[#636366]" style={{ width: `calc(${100 / options.length}% - 2px)`, boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)' }} animate={{ x: `calc(${selectedIndex * 100}% + ${selectedIndex * 2}px)` }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
            {options.map(opt => <button key={opt.id} type="button" onClick={() => onChange(opt.id)} className={`relative z-10 flex-1 h-[32px] text-[13px] font-semibold transition-colors duration-[250ms] ${opt.id === value ? 'text-[#1d1d1f] dark:text-white' : 'text-[#8e8e93] dark:text-[#98989d]'}`}>{opt.label}</button>)}
        </div>
    )
}

export interface UnitSelectorProps { options: string[]; value: string; onChange: (unit: string) => void }

export function UnitSelector({ options, value, onChange }: UnitSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <div className="relative">
            <motion.button type="button" onClick={() => setIsOpen(!isOpen)} whileTap={{ scale: 0.97 }} className="flex items-center gap-1 h-[36px] px-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px] min-w-[60px]"><span className="text-[15px] font-semibold text-[#007aff]">{value}</span><motion.div className="text-[#c7c7cc]" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>{Icons.chevronDown}</motion.div></motion.button>
            <AnimatePresence>{isOpen && (<><motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="absolute right-0 top-full mt-2 bg-white dark:bg-[#2c2c2e] rounded-[12px] shadow-2xl overflow-hidden z-50 border border-black/[0.04] dark:border-white/[0.06]" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>{options.map((opt, i) => (<motion.button key={opt} type="button" onClick={() => { onChange(opt); setIsOpen(false) }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} whileHover={{ backgroundColor: 'rgba(0,122,255,0.08)' }} whileTap={{ scale: 0.98 }} className={`w-full h-[44px] px-5 text-left flex items-center justify-between text-[16px] font-medium text-[#1d1d1f] dark:text-white ${i < options.length - 1 ? 'border-b border-[#f5f5f7] dark:border-[#3a3a3c]' : ''}`}><span>{opt}</span>{opt === value && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[#007aff]">{Icons.check}</motion.div>}</motion.button>))}</motion.div><button type="button" aria-label="Fechar menu" className="fixed inset-0 z-40 bg-transparent border-none cursor-default" onClick={() => setIsOpen(false)} /></>)}</AnimatePresence>
        </div>
    )
}
