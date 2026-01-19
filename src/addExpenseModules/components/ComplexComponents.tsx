// ═══════════════════════════════════════════════════════════════════
// ADD EXPENSE MODULE — Responsive DatePicker & CategoryGrid
// Mobile: iOS-style scroll wheel | Desktop: macOS-style calendar popover
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icons, CategoryIcons, CategoryColors, CategoryOption } from '../Icons'

interface DateSelection { day: number; month: number; year: number }

// AppleDatePicker - Responsive (Mobile scroll wheel, Desktop calendar)
export interface AppleDatePickerProps { value: string; onChange: (date: string) => void }

export function AppleDatePicker({ value, onChange }: AppleDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)

    const parseDate = (dateStr: string): DateSelection => {
        if (!dateStr) { const today = new Date(); return { day: today.getDate(), month: today.getMonth(), year: today.getFullYear() } }
        const d = new Date(dateStr + 'T00:00:00'); return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() }
    }
    const [selected, setSelected] = useState(parseDate(value))
    useEffect(() => { setSelected(parseDate(value)) }, [value])

    // Detect screen size changes
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)
    const daysInMonth = new Date(selected.year, selected.month + 1, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const handleConfirm = () => {
        onChange(`${selected.year}-${String(selected.month + 1).padStart(2, '0')}-${String(selected.day).padStart(2, '0')}`)
        setIsOpen(false)
    }

    const handleDateClick = (day: number) => {
        setSelected(prev => ({ ...prev, day }))
        onChange(`${selected.year}-${String(selected.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
        setTimeout(() => setIsOpen(false), 150)
    }

    // Mobile: iOS-style scroll wheel column
    const WheelColumn = ({ items, sel, onSelect, width = 'w-16' }: { items: (number | { label: string; value: number })[]; sel: number; onSelect: (v: number) => void; width?: string }) => (
        <div className={`${width} h-[180px] overflow-y-auto snap-y snap-mandatory`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="h-[60px]" />
            {items.map((item, i) => (
                <motion.button key={i} type="button" onClick={() => onSelect(typeof item === 'object' ? item.value : item)} whileTap={{ scale: 0.95 }}
                    className={`w-full h-[44px] flex items-center justify-center snap-center text-[22px] font-medium transition-all ${(typeof item === 'object' ? item.value : item) === sel ? 'text-white scale-110' : 'text-white/40 scale-90'}`}>
                    {typeof item === 'object' ? item.label : item}
                </motion.button>
            ))}
            <div className="h-[60px]" />
        </div>
    )

    // Desktop: macOS-style calendar grid
    const CalendarGrid = () => {
        const firstDayOfMonth = new Date(selected.year, selected.month, 1).getDay()
        const daysArray = Array.from({ length: 42 }, (_, i) => {
            const dayIndex = i - firstDayOfMonth + 1
            return dayIndex > 0 && dayIndex <= daysInMonth ? dayIndex : null
        })

        const today = new Date()
        const isToday = (day: number | null) =>
            day !== null &&
            day === today.getDate() &&
            selected.month === today.getMonth() &&
            selected.year === today.getFullYear()

        return (
            <div className="p-4">
                {/* Month/Year selector */}
                <div className="flex items-center justify-between mb-4">
                    <motion.button
                        type="button"
                        onClick={() => {
                            const newMonth = selected.month === 0 ? 11 : selected.month - 1
                            const newYear = selected.month === 0 ? selected.year - 1 : selected.year
                            setSelected({ ...selected, month: newMonth, year: newYear })
                        }}
                        whileHover={{ scale: 1.1, x: -2 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </motion.button>

                    <div className="flex items-center gap-2">
                        <select
                            value={selected.month}
                            onChange={e => setSelected({ ...selected, month: parseInt(e.target.value) })}
                            className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-none outline-none cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <select
                            value={selected.year}
                            onChange={e => setSelected({ ...selected, year: parseInt(e.target.value) })}
                            className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-none outline-none cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <motion.button
                        type="button"
                        onClick={() => {
                            const newMonth = selected.month === 11 ? 0 : selected.month + 1
                            const newYear = selected.month === 11 ? selected.year + 1 : selected.year
                            setSelected({ ...selected, month: newMonth, year: newYear })
                        }}
                        whileHover={{ scale: 1.1, x: 2 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </motion.button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="h-8 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 uppercase">{day}</span>
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {daysArray.map((day, i) => (
                        <motion.button
                            key={i}
                            type="button"
                            disabled={day === null}
                            onClick={() => day !== null && handleDateClick(day)}
                            whileHover={day !== null ? { scale: 1.1 } : {}}
                            whileTap={day !== null ? { scale: 0.95 } : {}}
                            className={`
                                h-9 rounded-lg flex items-center justify-center
                                text-sm font-medium transition-all
                                ${day === null ? 'invisible' : ''}
                                ${day === selected.day
                                    ? 'bg-[#007aff] text-white shadow-lg shadow-blue-500/30'
                                    : isToday(day)
                                        ? 'bg-zinc-100 dark:bg-zinc-800 text-[#007aff] font-bold'
                                        : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }
                            `}
                        >
                            {day}
                        </motion.button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            <motion.button type="button" onClick={() => setIsOpen(true)} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] transition-all hover:bg-[#ebebf0] dark:hover:bg-[#3a3a3c]">
                <motion.div className="w-9 h-9 rounded-[11px] flex items-center justify-center relative overflow-hidden"
                    style={{ background: 'linear-gradient(145deg, #ff3b30 0%, #ff2d55 100%)', boxShadow: '0 4px 12px rgba(255,59,48,0.4)' }} whileHover={{ scale: 1.05, rotate: 2 }}>
                    <span className="text-white text-[13px] font-bold">{selected.day}</span>
                </motion.div>
                <div className="flex flex-col items-start">
                    <span className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white">
                        {monthsShort[selected.month]} {selected.day}, {selected.year}
                    </span>
                </div>
                <span className="text-[#8e8e93] ml-1">{Icons.chevronRight}</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div className="absolute inset-0 bg-black/50" style={{ backdropFilter: 'blur(8px)' }} />

                        {/* Mobile: Scroll Wheel */}
                        {!isDesktop && (
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                                onClick={e => e.stopPropagation()}
                                className="relative w-full max-w-[400px] bg-[#1c1c1e] rounded-t-[28px] overflow-hidden"
                                style={{ boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}
                            >
                                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                                    <button type="button" onClick={() => setIsOpen(false)} className="text-[17px] text-[#007aff] font-medium">Cancelar</button>
                                    <span className="text-[17px] font-bold text-white">Selecionar Data</span>
                                    <button type="button" onClick={handleConfirm} className="text-[17px] text-[#007aff] font-bold">Pronto</button>
                                </div>
                                <div className="relative py-4">
                                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[44px] rounded-xl pointer-events-none" style={{ background: 'rgba(120,120,128,0.24)', boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.1)' }} />
                                    <div className="flex justify-center gap-0 px-6">
                                        <WheelColumn items={monthsShort.map((m, i) => ({ label: m, value: i }))} sel={selected.month} onSelect={m => setSelected(prev => ({ ...prev, month: m, day: Math.min(prev.day, new Date(prev.year, m + 1, 0).getDate()) }))} width="w-20" />
                                        <WheelColumn items={days} sel={selected.day} onSelect={d => setSelected(prev => ({ ...prev, day: d }))} width="w-14" />
                                        <WheelColumn items={years} sel={selected.year} onSelect={y => setSelected(prev => ({ ...prev, year: y, day: Math.min(prev.day, new Date(y, prev.month + 1, 0).getDate()) }))} width="w-20" />
                                    </div>
                                </div>
                                <div className="h-8" />
                            </motion.div>
                        )}

                        {/* Desktop: Calendar Popover */}
                        {isDesktop && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                                onClick={e => e.stopPropagation()}
                                className="relative w-full max-w-[360px] bg-white/95 dark:bg-zinc-900/95 rounded-[20px] overflow-hidden backdrop-blur-xl"
                                style={{
                                    boxShadow: `
                                        0 20px 60px rgba(0,0,0,0.2),
                                        0 8px 24px rgba(0,0,0,0.15),
                                        0 0 0 0.5px rgba(0,0,0,0.1),
                                        inset 0 0 0 0.5px rgba(255,255,255,0.1)
                                    `
                                }}
                            >
                                <CalendarGrid />
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

// CategoryGrid - Same as before
export interface CategoryGridProps { value: string; options: CategoryOption[]; onChange: (category: string) => void }

export function CategoryGrid({ value, options, onChange }: CategoryGridProps) {
    const categories = options.map(opt => ({ id: typeof opt === 'string' ? opt : opt.label || opt.id, label: typeof opt === 'string' ? opt : opt.label || opt.id }))

    return (
        <div className="p-4 grid grid-cols-3 gap-3">
            {categories.map((cat, i) => {
                const isSelected = value === cat.id || value === cat.label
                const colors = CategoryColors[cat.label] || CategoryColors['Outros'] || { bg: 'from-gray-500 to-slate-600', glow: 'shadow-gray-500/40' }
                const icon = CategoryIcons[cat.label] || CategoryIcons['Outros']
                return (
                    <motion.button key={cat.id} type="button" onClick={() => onChange(cat.label)}
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 25 }}
                        whileTap={{ scale: 0.92 }}
                        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-300 ${isSelected ? `bg-gradient-to-br ${colors.bg} shadow-lg ${colors.glow}` : 'bg-[#f5f5f7] dark:bg-[#2c2c2e] hover:bg-[#ebebf0] dark:hover:bg-[#3a3a3c]'}`}
                        style={{ boxShadow: isSelected ? '0 8px 24px -8px currentColor' : 'none' }}>
                        <motion.div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-white dark:bg-[#3a3a3c]'}`}
                            animate={{ scale: isSelected ? [1, 1.1, 1] : 1 }} transition={{ duration: 0.3 }}>
                            <span className={isSelected ? 'text-white' : 'text-[#8e8e93]'}>{icon}</span>
                        </motion.div>
                        <span className={`text-[11px] font-semibold tracking-tight ${isSelected ? 'text-white' : 'text-[#1d1d1f] dark:text-white'}`}>{cat.label}</span>
                        {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md"><span className="text-[#34c759]">{Icons.check}</span></motion.div>}
                    </motion.button>
                )
            })}
        </div>
    )
}

// SummaryCard - Same as before
export interface SummaryCardProps { total: string | number; quantity: string | number; formatCurrency: (value: number) => string }

export function SummaryCard({ total, quantity, formatCurrency }: SummaryCardProps) {
    const totalValue = (Number(total) || 0) * (Number(quantity) || 1)
    if (totalValue <= 0) return null

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-4 mb-4 p-5 rounded-[20px] relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #1c1c1e 0%, #000 100%)', boxShadow: '0 20px 60px -20px rgba(0,0,0,0.6)' }}>
            <motion.div className="absolute -top-16 -right-16 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,122,255,0.5) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
            <motion.div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(52,199,89,0.4) 0%, transparent 70%)' }}
                animate={{ scale: [1.3, 1, 1.3], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
            <div className="relative">
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Valor Total</span>
                <motion.div className="flex items-baseline gap-2 mt-2" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                    <span className="text-[36px] font-bold text-white tabular-nums tracking-tight">{formatCurrency(totalValue)}</span>
                </motion.div>
                {Number(quantity) > 1 && <span className="text-[13px] text-white/50 mt-1.5 block">{quantity} × {formatCurrency(Number(total))}</span>}
            </div>
        </motion.div>
    )
}
