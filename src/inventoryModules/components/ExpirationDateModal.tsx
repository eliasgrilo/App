// ═══════════════════════════════════════════════════════════════════
// EXPIRATION DATE MODAL — Apple Vision Pro Premium Experience
// Desktop: Native date input | Mobile: iOS Wheel Picker
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import { InventoryItem } from '../types'

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const MODAL_SPRING = { type: 'spring' as const, stiffness: 400, damping: 35, mass: 0.8 }
const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ═══════════════════════════════════════════════════════════════════
// TYPES & UTILS
// ═══════════════════════════════════════════════════════════════════

interface ExpirationDateModalProps {
    item: InventoryItem | null
    onClose: () => void
    onSave: (itemId: number, newDate: string) => void
}

const getDaysUntilExpiration = (date: string): number =>
    Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

const formatDateForInput = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const getDaysInMonth = (month: number, year: number): number => new Date(year, month + 1, 0).getDate()

const getStatusConfig = (days: number | null) => {
    if (days === null) return { color: '#8E8E93', label: 'Sem data' }
    if (days < 0) return { color: '#FF3B30', label: 'Vencido' }
    if (days <= 7) return { color: '#FF3B30', label: 'Crítico' }
    if (days <= 30) return { color: '#FF9F0A', label: 'Atenção' }
    return { color: '#34C759', label: 'OK' }
}

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])
    return isMobile
}

// ═══════════════════════════════════════════════════════════════════
// iOS WHEEL PICKER COLUMN — Smooth scroll with snap
// ═══════════════════════════════════════════════════════════════════

interface WheelColumnProps {
    items: { value: number; label: string }[]
    selectedValue: number
    onChange: (value: number) => void
}

const WheelColumn: React.FC<WheelColumnProps> = ({ items, selectedValue, onChange }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const itemHeight = 36

    useEffect(() => {
        const index = items.findIndex(i => i.value === selectedValue)
        if (containerRef.current && index >= 0) {
            containerRef.current.scrollTop = index * itemHeight
        }
    }, [selectedValue, items])

    const handleScroll = () => {
        if (!containerRef.current) return
        const index = Math.round(containerRef.current.scrollTop / itemHeight)
        if (items[index] && items[index].value !== selectedValue) {
            onChange(items[index].value)
        }
    }

    return (
        <div className="relative flex-1 h-[108px]">
            {/* Fade overlays */}
            <div className="absolute inset-x-0 top-0 h-9 bg-gradient-to-b from-white dark:from-zinc-900 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent z-10 pointer-events-none" />

            {/* Selection indicator */}
            <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-9 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 z-0" />

            {/* Scrollable list */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="absolute inset-0 overflow-y-auto snap-y snap-mandatory hide-scrollbar"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingTop: 36, paddingBottom: 36 }}
            >
                {items.map(item => (
                    <div
                        key={item.value}
                        onClick={() => onChange(item.value)}
                        className={`h-9 flex items-center justify-center snap-center cursor-pointer transition-all ${item.value === selectedValue
                                ? 'text-zinc-900 dark:text-white text-[17px] font-semibold'
                                : 'text-zinc-400 text-[15px]'
                            }`}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// SHORTCUT TILE
// ═══════════════════════════════════════════════════════════════════

const ShortcutTile: React.FC<{ label: string; days: number; onClick: () => void; delay: number }> = ({ label, days, onClick, delay }) => (
    <motion.button
        onClick={onClick}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full text-left bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-2xl p-4 border border-zinc-200/50 dark:border-white/5 flex flex-col group shadow-md hover:shadow-lg transition-all"
    >
        <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
        </div>
        <motion.div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: delay + 0.05 }}>+{days}</motion.div>
        <div className="text-[9px] font-medium text-zinc-400 tabular-nums">{days === 1 ? 'dia' : 'dias'}</div>
        <div className="mt-3"><div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div className="h-full w-full bg-amber-500/80" initial={{ width: 0 }} animate={{ width: '100%' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: delay + 0.1 }} />
        </div></div>
    </motion.button>
)

// ═══════════════════════════════════════════════════════════════════
// ITEM ROW
// ═══════════════════════════════════════════════════════════════════

const ItemRow: React.FC<{ item: InventoryItem; days: number | null; selectedDate: string }> = ({ item, days, selectedDate }) => {
    const status = getStatusConfig(days)
    const progress = days === null ? 0 : days < 0 ? 100 : Math.max(0, Math.min(100, ((30 - days) / 30) * 100))

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
            className="relative overflow-hidden rounded-xl bg-white/85 dark:bg-zinc-800/60"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.02), 0 2px 8px -2px rgba(0,0,0,0.03)' }}>
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 100%, ${status.color}15 0%, transparent 70%)` }} />
            <div className="relative z-10 p-4 flex items-center gap-4">
                <div className="flex-shrink-0"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color, boxShadow: `0 0 8px 2px ${status.color}30` }} /></div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[14px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{item.name}</span>
                        <div className="flex items-baseline gap-1 flex-shrink-0">
                            <span className="text-[16px] font-bold tabular-nums" style={{ color: status.color }}>
                                {days !== null ? (days < 0 ? `${Math.abs(days)}d` : days === 0 ? 'Hoje' : `${days}d`) : '—'}
                            </span>
                            <span className="text-[10px] font-medium text-zinc-400">{days !== null && days < 0 ? 'atrás' : days !== null && days > 0 ? 'rest.' : ''}</span>
                        </div>
                    </div>
                    <div className="mt-2.5 relative">
                        <div className="h-1 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-700">
                            <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${status.color} 0%, ${status.color}CC 100%)`, boxShadow: `0 0 10px 1px ${status.color}40` }}
                                initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} />
                        </div>
                        <div className="flex justify-between mt-1.5">
                            <span className="text-[9px] text-zinc-400 tabular-nums">{selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}</span>
                            <span className="text-[9px] font-medium" style={{ color: status.color }}>{status.label}</span>
                            <span className="text-[9px] text-zinc-400 tabular-nums">{days !== null && days >= 0 ? `${days}d restantes` : ''}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function ExpirationDateModal({ item, onClose, onSave }: ExpirationDateModalProps): React.ReactElement | null {
    const [selectedDate, setSelectedDate] = useState('')
    const [day, setDay] = useState(1)
    const [month, setMonth] = useState(0)
    const [year, setYear] = useState(2026)
    const isMobile = useIsMobile()

    useEffect(() => {
        if (item?.expiryDate) {
            setSelectedDate(item.expiryDate)
            const d = new Date(item.expiryDate)
            setDay(d.getDate()); setMonth(d.getMonth()); setYear(d.getFullYear())
        } else {
            const d = new Date()
            setSelectedDate(formatDateForInput(d))
            setDay(d.getDate()); setMonth(d.getMonth()); setYear(d.getFullYear())
        }
    }, [item])

    // Sync wheel picker to selectedDate for desktop input
    useEffect(() => {
        if (!isMobile && selectedDate) {
            const d = new Date(selectedDate)
            setDay(d.getDate()); setMonth(d.getMonth()); setYear(d.getFullYear())
        }
    }, [selectedDate, isMobile])

    // Sync selectedDate from wheel picker on mobile
    useEffect(() => {
        if (isMobile) {
            const maxDays = getDaysInMonth(month, year)
            const validDay = Math.min(day, maxDays)
            setSelectedDate(formatDateForInput(new Date(year, month, validDay)))
        }
    }, [day, month, year, isMobile])

    const daysRemaining = selectedDate ? getDaysUntilExpiration(selectedDate) : null
    const status = getStatusConfig(daysRemaining)
    const currentYear = new Date().getFullYear()

    // Generate picker items
    const maxDays = getDaysInMonth(month, year)
    const dayItems = useMemo(() => Array.from({ length: maxDays }, (_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, '0') })), [maxDays])
    const monthItems = MONTHS_PT.map((m, i) => ({ value: i, label: m }))
    const yearItems = useMemo(() => Array.from({ length: 5 }, (_, i) => ({ value: currentYear + i, label: String(currentYear + i) })), [currentYear])

    if (!item) return null

    const addDays = (days: number) => {
        const d = new Date(); d.setDate(d.getDate() + days)
        setSelectedDate(formatDateForInput(d))
        setDay(d.getDate()); setMonth(d.getMonth()); setYear(d.getFullYear())
    }

    const handleSave = () => { onSave(item.id, selectedDate); onClose() }

    const shortcuts = [
        { label: 'Amanhã', days: 1 },
        { label: '3 Dias', days: 3 },
        { label: '1 Semana', days: 7 },
        { label: '1 Mês', days: 30 }
    ]

    return createPortal(
        <AnimatePresence mode="wait">
            <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 md:p-6">
                <ModalScrollLock />
                <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={onClose}
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(40px) saturate(180%)' }} />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl pointer-events-none"
                    style={{ background: `radial-gradient(ellipse, ${status.color}40 0%, transparent 60%)` }} />

                <motion.div initial={{ opacity: 0, scale: 0.92, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={MODAL_SPRING} className="relative w-full max-w-[420px]" onClick={e => e.stopPropagation()}>

                    <div className="relative overflow-hidden rounded-[2.5rem] bg-white/95 dark:bg-black"
                        style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.5) inset, 0 25px 50px -12px rgba(0,0,0,0.15), 0 0 80px -20px ${status.color}30`, backdropFilter: 'blur(40px) saturate(180%)' }}>

                        <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none dark:hidden" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 40%)' }} />

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="px-7 pt-7 pb-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">Validade</motion.h2>
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-[11px] text-zinc-400 mt-0.5 font-medium">Definir data de expiração</motion.p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <motion.div whileHover={{ scale: 1.03 }} className="px-3 py-1.5 rounded-lg" style={{ background: `${status.color}10`, boxShadow: `0 0 0 1px ${status.color}15 inset` }}>
                                            <span className="text-[11px] font-semibold tabular-nums" style={{ color: status.color }}>
                                                {daysRemaining !== null ? (daysRemaining >= 0 ? `${daysRemaining}d` : `${Math.abs(daysRemaining)}d atrás`) : '—'}
                                            </span>
                                        </motion.div>
                                        <motion.button onClick={onClose} whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.95 }}
                                            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </motion.button>
                                    </div>
                                </div>
                            </div>

                            {/* Item Row */}
                            <div className="px-7 pb-4"><ItemRow item={item} days={daysRemaining} selectedDate={selectedDate} /></div>

                            {/* Shortcuts */}
                            <div className="px-7 pb-4">
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Atalhos Rápidos</motion.p>
                                <div className="grid grid-cols-4 gap-2">
                                    {shortcuts.map((s, i) => <ShortcutTile key={s.days} label={s.label} days={s.days} onClick={() => addDays(s.days)} delay={0.15 + i * 0.04} />)}
                                </div>
                            </div>

                            {/* Date Picker - Desktop: native input, Mobile: wheel picker */}
                            <div className="px-7 pb-4">
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Ou escolha a data</motion.p>

                                {isMobile ? (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                        className="flex gap-2 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                        <WheelColumn items={dayItems} selectedValue={Math.min(day, maxDays)} onChange={setDay} />
                                        <WheelColumn items={monthItems} selectedValue={month} onChange={setMonth} />
                                        <WheelColumn items={yearItems} selectedValue={year} onChange={setYear} />
                                    </motion.div>
                                ) : (
                                    <motion.input
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 outline-none text-[15px] font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 focus:bg-white dark:focus:bg-zinc-700 transition-all [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-7 pb-7">
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="flex gap-3">
                                    <motion.button onClick={onClose} whileTap={{ scale: 0.98 }} className="flex-1 h-12 px-6 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[15px] font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98]">Cancelar</motion.button>
                                    <motion.button onClick={handleSave} whileTap={{ scale: 0.98 }} className="flex-1 h-12 px-6 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[15px] font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-lg transition-all active:scale-[0.98]">Salvar</motion.button>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    )
}

export default ExpirationDateModal
