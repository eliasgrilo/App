// ═══════════════════════════════════════════════════════════════════
// SETTINGS MODULES — Form Components
// Section, Row, SegmentedControl, ProvinceCard
// ═══════════════════════════════════════════════════════════════════

import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Icons, regionColors } from '../Icons'

// Section
export interface SectionProps { icon: ReactNode; gradient: string; title: string; children: ReactNode; footer?: string }
export function Section({ icon, gradient, title, children, footer }: SectionProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-2.5 px-4">
                <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-white bg-gradient-to-br ${gradient}`} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{icon}</div>
                <span className="text-[13px] font-semibold text-[#8e8e93] uppercase tracking-wide">{title}</span>
            </div>
            <div className="mx-4 bg-white dark:bg-[#1c1c1e] rounded-[14px] overflow-hidden shadow-sm border border-black/[0.04] dark:border-white/[0.06]">{children}</div>
            {footer && <p className="px-5 pt-2 text-[13px] text-[#8e8e93] leading-relaxed">{footer}</p>}
        </div>
    )
}

// Row
export interface RowProps { label: string; value?: string; onClick?: () => void; last?: boolean; rightElement?: ReactNode; destructive?: boolean }
export function Row({ label, value, onClick, last, rightElement, destructive }: RowProps) {
    const hasInteraction = !!onClick
    const Component = hasInteraction ? motion.button : 'div'
    const baseProps = { className: `w-full flex items-center justify-between min-h-[52px] px-4 ${!last ? 'border-b border-[#e5e5ea]/60 dark:border-[#38383a]/60' : ''} ${hasInteraction ? 'cursor-pointer active:bg-[#f5f5f7] dark:active:bg-[#2c2c2e]' : 'cursor-default'} transition-colors` }
    const motionProps = hasInteraction ? { type: 'button' as const, onClick, whileTap: { backgroundColor: 'rgba(0,0,0,0.03)' } } : {}

    return (
        <Component {...baseProps} {...motionProps}>
            <span className={`text-[17px] ${destructive ? 'text-[#ff3b30]' : 'text-[#1d1d1f] dark:text-white'}`}>{label}</span>
            <div className="flex items-center gap-2">
                {rightElement}
                {value && !rightElement && <span className="text-[17px] text-[#8e8e93]">{value}</span>}
                {onClick && !rightElement && <span className="text-[#c7c7cc] dark:text-[#48484a]">{Icons.chevronRight}</span>}
            </div>
        </Component>
    )
}

// SegmentedControl
export interface SegmentedOption { id: string; label: string }
export interface SegmentedControlProps { value: string; options: SegmentedOption[]; onChange: (value: string) => void }
export function SegmentedControl({ value, options, onChange }: SegmentedControlProps) {
    const selectedIndex = options.findIndex(o => o.id === value)
    return (
        <div className="relative p-[2px] rounded-[9px] bg-[#e9e9eb] dark:bg-[#39393d]" style={{ display: 'flex' }}>
            <motion.div className="absolute top-[2px] bottom-[2px] rounded-[7px] bg-white dark:bg-[#636366]"
                style={{ width: `calc(${100 / options.length}% - 2px)`, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}
                animate={{ x: `calc(${selectedIndex * 100}% + ${selectedIndex * 2}px)` }} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
            {options.map(opt => (
                <button key={opt.id} type="button" onClick={() => onChange(opt.id)} className={`relative z-10 flex-1 h-[32px] text-[13px] font-semibold transition-colors ${opt.id === value ? 'text-[#1d1d1f] dark:text-white' : 'text-[#8e8e93]'}`}>{opt.label}</button>
            ))}
        </div>
    )
}

// Province Card
export interface ProvinceData { name: string; display: string; region: string; gst: number; pst: number; hst: number }
export interface ProvinceCardProps { code: string; province: ProvinceData; isSelected: boolean; onClick: () => void }
export function ProvinceCard({ code, province, isSelected, onClick }: ProvinceCardProps) {
    const colors = regionColors[province.region as keyof typeof regionColors] || regionColors.west
    return (
        <motion.button type="button" onClick={onClick} whileTap={{ scale: 0.95 }}
            className={`relative p-4 rounded-2xl text-left transition-all ${isSelected ? `bg-gradient-to-br ${colors.bg} shadow-lg` : 'bg-[#f5f5f7] dark:bg-[#2c2c2e] hover:bg-[#ebebf0] dark:hover:bg-[#3a3a3c]'}`}>
            {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md"><span className="text-[#34c759]">{Icons.check}</span></motion.div>}
            <div className={`text-[13px] font-bold ${isSelected ? 'text-white/80' : 'text-[#8e8e93]'}`}>{code}</div>
            <div className={`text-[15px] font-semibold mt-0.5 ${isSelected ? 'text-white' : 'text-[#1d1d1f] dark:text-white'}`}>{province.name}</div>
            <div className={`text-[12px] mt-1 ${isSelected ? 'text-white/70' : 'text-[#8e8e93]'}`}>{province.display}</div>
        </motion.button>
    )
}
