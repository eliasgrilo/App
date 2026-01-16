/**
 * DateRangePicker — The Ultimate Apple Experience
 * 
 * Combines the best of both worlds:
 * - iOS Settings-style radio selection for presets
 * - Full calendar with easy month/year pickers for custom
 * 
 * @author Padoca Engineering Team
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DateRange, DatePreset } from '../types'

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SPRING = { type: 'spring' as const, stiffness: 500, damping: 35 }
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] // Segunda a Domingo (BR)

interface Preset {
    id: DatePreset
    label: string
    getRange: () => { start: Date; end: Date }
}

const PRESETS: Preset[] = [
    { id: 'last7days', label: 'Hoje', getRange: () => { const d = new Date(); return { start: new Date(d.getFullYear(), d.getMonth(), d.getDate()), end: d } } },
    { id: 'thisMonth', label: 'Esta semana', getRange: () => { const e = new Date(), s = new Date(); const day = s.getDay(); s.setDate(s.getDate() - (day === 0 ? 6 : day - 1)); return { start: s, end: e } } },
    { id: 'lastMonth', label: 'Este mês', getRange: () => { const n = new Date(); return { start: new Date(n.getFullYear(), n.getMonth(), 1), end: n } } },
]

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const formatDisplay = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
const getDays = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
const getFirst = (y: number, m: number) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 } // Monday = 0
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

// ═══════════════════════════════════════════════════════════════════════════════
// MONTH PICKER
// ═══════════════════════════════════════════════════════════════════════════════

const MonthPicker: React.FC<{ month: number; onSelect: (m: number) => void }> = ({ month, onSelect }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white dark:bg-[#2c2c2e] z-20 p-2 grid grid-cols-3 gap-1 rounded-[12px] overflow-hidden">
        {MONTHS.map((m, i) => (
            <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => onSelect(i)} className={`py-3 rounded-lg text-[14px] font-medium ${i === month ? 'bg-[#007AFF] text-white' : 'hover:bg-[#f2f2f7] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white'}`}>
                {m}
            </motion.button>
        ))}
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// YEAR PICKER
// ═══════════════════════════════════════════════════════════════════════════════

const YearPicker: React.FC<{ year: number; onSelect: (y: number) => void }> = ({ year, onSelect }) => {
    const current = new Date().getFullYear()
    const years = Array.from({ length: 12 }, (_, i) => current - 5 + i)
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white dark:bg-[#2c2c2e] z-20 p-2 grid grid-cols-3 gap-1 rounded-[12px] overflow-hidden">
            {years.map(y => (
                <motion.button key={y} whileTap={{ scale: 0.95 }} onClick={() => onSelect(y)} className={`py-3 rounded-lg text-[14px] font-medium ${y === year ? 'bg-[#007AFF] text-white' : y === current ? 'text-[#007AFF]' : 'hover:bg-[#f2f2f7] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white'}`}>
                    {y}
                </motion.button>
            ))}
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI CALENDAR
// ═══════════════════════════════════════════════════════════════════════════════

interface CalendarProps {
    start: Date
    end: Date
    onSelect: (d: Date) => void
    selecting: 'start' | 'end'
}

const MiniCalendar: React.FC<CalendarProps> = ({ start, end, onSelect, selecting }) => {
    const [view, setView] = useState(start)
    const [picker, setPicker] = useState<'month' | 'year' | null>(null)

    // Sync view when start changes (e.g., after reset)
    useEffect(() => { setView(start) }, [start])

    const year = view.getFullYear(), month = view.getMonth()
    const days: (number | null)[] = [...Array(getFirst(year, month)).fill(null), ...Array.from({ length: getDays(year, month) }, (_, i) => i + 1)]

    const isInRange = (d: number) => { const date = new Date(year, month, d); return date > start && date < end }
    const isStart = (d: number) => sameDay(new Date(year, month, d), start)
    const isEnd = (d: number) => sameDay(new Date(year, month, d), end)
    const isToday = (d: number) => sameDay(new Date(year, month, d), new Date())

    return (
        <div className="relative p-3 bg-white dark:bg-[#2c2c2e] rounded-[12px] overflow-hidden">
            <AnimatePresence>
                {picker === 'month' && <MonthPicker month={month} onSelect={(m) => { setView(new Date(year, m, 1)); setPicker(null) }} />}
                {picker === 'year' && <YearPicker year={year} onSelect={(y) => { setView(new Date(y, month, 1)); setPicker(null) }} />}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setView(new Date(year, month - 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f2f7] dark:hover:bg-[#3a3a3c]">
                    <ChevronLeft className="w-5 h-5 text-[#007AFF]" />
                </motion.button>

                <div className="flex gap-1">
                    <button onClick={() => setPicker('month')} className="px-2 py-1 rounded-md hover:bg-[#f2f2f7] dark:hover:bg-[#3a3a3c] text-[15px] font-semibold text-[#007AFF]">
                        {MONTHS_FULL[month]}
                    </button>
                    <button onClick={() => setPicker('year')} className="px-2 py-1 rounded-md hover:bg-[#f2f2f7] dark:hover:bg-[#3a3a3c] text-[15px] font-semibold text-[#007AFF]">
                        {year}
                    </button>
                </div>

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setView(new Date(year, month + 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f2f7] dark:hover:bg-[#3a3a3c]">
                    <ChevronRight className="w-5 h-5 text-[#007AFF]" />
                </motion.button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAYS.map((d, i) => <div key={i} className="text-center text-[10px] font-semibold text-[#8e8e93] py-1">{d}</div>)}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-0.5">
                {days.map((d, i) => d ? (
                    <motion.button key={i} whileTap={{ scale: 0.85 }} onClick={() => onSelect(new Date(year, month, d))} className={`aspect-square flex items-center justify-center text-[14px] font-medium rounded-full transition-all ${isStart(d) || isEnd(d) ? 'bg-[#007AFF] text-white' : isInRange(d) ? 'bg-[#007AFF]/15 text-[#007AFF]' : isToday(d) ? 'ring-2 ring-[#007AFF] text-[#007AFF]' : 'hover:bg-[#f2f2f7] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white'}`}>
                        {d}
                    </motion.button>
                ) : <div key={i} />)}
            </div>

            {/* Selection status */}
            <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex justify-center items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${selecting === 'start' ? 'bg-[#007AFF] text-white font-semibold' : 'bg-black/5 dark:bg-white/5 text-[#8e8e93]'}`}>
                    {start.toLocaleDateString('pt-BR')}
                </div>
                <span className="text-[#8e8e93] text-[12px]">→</span>
                <div className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${selecting === 'end' ? 'bg-[#007AFF] text-white font-semibold' : 'bg-black/5 dark:bg-white/5 text-[#8e8e93]'}`}>
                    {end.toLocaleDateString('pt-BR')}
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// RADIO OPTION
// ═══════════════════════════════════════════════════════════════════════════════

const RadioOption: React.FC<{ label: string; selected: boolean; onClick: () => void }> = ({ label, selected, onClick }) => (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick} className="w-full flex items-center justify-between py-3 px-4 bg-white dark:bg-[#1c1c1e] first:rounded-t-[12px] last:rounded-b-[12px] border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e]">
        <span className="text-[17px] text-[#1d1d1f] dark:text-white">{label}</span>
        {selected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING}><Check className="w-5 h-5 text-[#007AFF]" strokeWidth={2.5} /></motion.div>}
    </motion.button>
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface Props { value: DateRange; onChange: (r: DateRange) => void }

export const DateRangePicker: React.FC<Props> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false)
    const [custom, setCustom] = useState(value.preset === 'custom')
    const [selecting, setSelecting] = useState<'start' | 'end'>('start')
    const [tempStart, setTempStart] = useState(value.start)
    const [tempEnd, setTempEnd] = useState(value.end)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    const selectPreset = (p: Preset) => { onChange({ ...p.getRange(), preset: p.id }); setCustom(false); setOpen(false) }

    const openCustom = () => { setCustom(true); setTempStart(value.start); setTempEnd(value.end); setSelecting('start') }

    const handleDateSelect = (d: Date) => {
        if (selecting === 'start') {
            setTempStart(d)
            setTempEnd(d)
            setSelecting('end')
        } else {
            if (d < tempStart) {
                // Clicked before start - make this the new start, old start becomes end
                setTempEnd(tempStart)
                setTempStart(d)
            } else if (sameDay(d, tempStart)) {
                // Clicked on start - reset to select new start
                setSelecting('start')
            } else {
                // Clicked after start - set end
                setTempEnd(d)
            }
        }
    }

    const resetSelection = () => {
        const today = new Date()
        setSelecting('start')
        setTempStart(today)
        setTempEnd(today)
    }

    const applyCustom = () => { onChange({ start: tempStart, end: tempEnd, preset: 'custom' }); setOpen(false); setCustom(false) }

    const display = custom || value.preset === 'custom'
        ? `${formatDisplay(value.start)} – ${formatDisplay(value.end)}`
        : PRESETS.find(p => p.id === value.preset)?.label || 'Período'

    return (
        <div ref={ref} className="relative print:hidden" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" }}>
            {/* Trigger */}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(!open)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[15px] font-medium ${open ? 'bg-[#007AFF] text-white' : 'bg-[#e5e5ea] dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white'}`}>
                <Calendar className="w-4 h-4" />
                <span>{display}</span>
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={SPRING} className="absolute top-full left-0 mt-2 z-50 w-[320px] bg-[#f2f2f7] dark:bg-[#1c1c1e] rounded-[16px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-3">
                            <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-wide mb-2 px-1">Período</p>

                            {/* Presets */}
                            <div className="rounded-[12px] overflow-hidden shadow-sm mb-3">
                                {PRESETS.map(p => <RadioOption key={p.id} label={p.label} selected={value.preset === p.id && !custom} onClick={() => selectPreset(p)} />)}
                                <RadioOption label="Personalizado" selected={custom || value.preset === 'custom'} onClick={openCustom} />
                            </div>

                            {/* Calendar */}
                            <AnimatePresence>
                                {custom && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                        <MiniCalendar start={tempStart} end={tempEnd} onSelect={handleDateSelect} selecting={selecting} />
                                        <div className="flex gap-2 mt-3">
                                            <motion.button whileTap={{ scale: 0.98 }} onClick={resetSelection} className="flex-1 py-3 rounded-[12px] bg-[#e5e5ea] dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white text-[15px] font-medium hover:bg-[#d1d1d6]">
                                                Resetar
                                            </motion.button>
                                            <motion.button whileTap={{ scale: 0.98 }} onClick={applyCustom} className="flex-[2] py-3 rounded-[12px] bg-[#007AFF] text-white text-[17px] font-semibold hover:bg-[#0071e3]">
                                                Aplicar
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

export default DateRangePicker
