import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useCurrency, CANADA_PROVINCES, ProvinceCode, CurrencyCode } from '../contexts/CurrencyContext'
import { MODAL_ANIMATIONS } from '../utils/animations'

// ═══ TYPES ═══
interface SectionProps {
    icon: ReactNode
    gradient: string
    title: string
    children: ReactNode
    footer?: string
}

interface RowProps {
    label: string
    value?: string
    onClick?: () => void
    last?: boolean
    rightElement?: ReactNode
    destructive?: boolean
}

interface SegmentedOption {
    id: string
    label: string
}

interface SegmentedControlProps {
    value: string
    options: SegmentedOption[]
    onChange: (value: string) => void
}

interface ProvinceData {
    name: string
    display: string
    region: string
    gst: number
    pst: number
    hst: number
}

interface ProvinceCardProps {
    code: string
    province: ProvinceData
    isSelected: boolean
    onClick: () => void
}

interface SettingsPanelProps {
    isOpen: boolean
    onClose: () => void
}

interface SettingsIconProps {
    className?: string
}

interface SettingsButtonProps {
    onClick: () => void
}

/**
 * Settings Panel — Apple HIG Premium Design
 * 
 * Features:
 * - 13 Canadian provinces/territories with accurate taxes
 * - Global currency selection (CAD/USD)
 * - Premium section design with gradient icons
 * - Theme selection
 * - Data management
 * - Spring physics animations
 * - Focus trap for accessibility (WCAG 2.1)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SF SYMBOLS (Premium SVG Icons)
// ═══════════════════════════════════════════════════════════════════════════════

const Icons = {
    globe: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
    dollar: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    percent: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
    ),
    palette: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
        </svg>
    ),
    database: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    ),
    download: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    upload: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    refresh: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    ),
    trash: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    check: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    chevronRight: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    chevronLeft: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    ),
    sun: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    ),
    moon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    ),
    mapPin: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
    )
}

// Section icon gradients
const sectionGradients = {
    regional: 'from-blue-500 to-cyan-500',
    appearance: 'from-purple-500 to-pink-500',
    data: 'from-emerald-500 to-green-500',
    danger: 'from-red-500 to-orange-500'
}

// Region colors for province picker
const regionColors = {
    west: { bg: 'from-amber-500 to-orange-500', label: 'Western Canada' },
    central: { bg: 'from-blue-500 to-indigo-500', label: 'Central Canada' },
    atlantic: { bg: 'from-cyan-500 to-teal-500', label: 'Atlantic Canada' },
    north: { bg: 'from-violet-500 to-purple-500', label: 'Northern Territories' }
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Section with gradient icon
const Section: React.FC<SectionProps> = ({ icon, gradient, title, children, footer }) => (
    <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2.5 px-4">
            <div
                className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-white bg-gradient-to-br ${gradient}`}
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            >
                {icon}
            </div>
            <span className="text-[13px] font-semibold text-[#8e8e93] uppercase tracking-wide">
                {title}
            </span>
        </div>
        <div className="mx-4 bg-white dark:bg-[#1c1c1e] rounded-[14px] overflow-hidden shadow-sm border border-black/[0.04] dark:border-white/[0.06]">
            {children}
        </div>
        {footer && (
            <p className="px-5 pt-2 text-[13px] text-[#8e8e93] leading-relaxed">
                {footer}
            </p>
        )}
    </div>
)

// Settings Row
const Row: React.FC<RowProps> = ({ label, value, onClick, last, rightElement, destructive }) => {
    const hasInteraction = !!onClick
    const Component = hasInteraction ? motion.button : 'div'

    const baseProps = {
        className: `
            w-full flex items-center justify-between min-h-[52px] px-4
            ${!last ? 'border-b border-[#e5e5ea]/60 dark:border-[#38383a]/60' : ''}
            ${hasInteraction ? 'cursor-pointer active:bg-[#f5f5f7] dark:active:bg-[#2c2c2e]' : 'cursor-default'}
            transition-colors
        `
    }

    const motionProps = hasInteraction ? {
        type: 'button' as const,
        onClick,
        whileTap: { backgroundColor: 'rgba(0,0,0,0.03)' }
    } : {}

    return (
        <Component {...baseProps} {...motionProps}>
            <span className={`text-[17px] ${destructive ? 'text-[#ff3b30]' : 'text-[#1d1d1f] dark:text-white'}`}>
                {label}
            </span>
            <div className="flex items-center gap-2">
                {rightElement}
                {value && !rightElement && (
                    <span className="text-[17px] text-[#8e8e93]">{value}</span>
                )}
                {onClick && !rightElement && (
                    <span className="text-[#c7c7cc] dark:text-[#48484a]">{Icons.chevronRight}</span>
                )}
            </div>
        </Component>
    )
}

// Segmented Control
const SegmentedControl: React.FC<SegmentedControlProps> = ({ value, options, onChange }) => {
    const selectedIndex = options.findIndex(o => o.id === value)

    return (
        <div className="relative p-[2px] rounded-[9px] bg-[#e9e9eb] dark:bg-[#39393d]" style={{ display: 'flex' }}>
            <motion.div
                className="absolute top-[2px] bottom-[2px] rounded-[7px] bg-white dark:bg-[#636366]"
                style={{
                    width: `calc(${100 / options.length}% - 2px)`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                }}
                animate={{ x: `calc(${selectedIndex * 100}% + ${selectedIndex * 2}px)` }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
            {options.map((opt) => (
                <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange(opt.id)}
                    className={`
                        relative z-10 flex-1 h-[32px] text-[13px] font-semibold transition-colors
                        ${opt.id === value ? 'text-[#1d1d1f] dark:text-white' : 'text-[#8e8e93]'}
                    `}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

// Province Card for Grid
const ProvinceCard: React.FC<ProvinceCardProps> = ({ code, province, isSelected, onClick }) => {
    const colors = regionColors[province.region as keyof typeof regionColors]

    return (
        <motion.button
            type="button"
            onClick={onClick}
            whileTap={{ scale: 0.95 }}
            className={`
                relative p-4 rounded-2xl text-left transition-all
                ${isSelected
                    ? `bg-gradient-to-br ${colors.bg} shadow-lg`
                    : 'bg-[#f5f5f7] dark:bg-[#2c2c2e] hover:bg-[#ebebf0] dark:hover:bg-[#3a3a3c]'
                }
            `}
        >
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md"
                >
                    <span className="text-[#34c759]">{Icons.check}</span>
                </motion.div>
            )}
            <div className={`text-[13px] font-bold ${isSelected ? 'text-white/80' : 'text-[#8e8e93]'}`}>
                {code}
            </div>
            <div className={`text-[15px] font-semibold mt-0.5 ${isSelected ? 'text-white' : 'text-[#1d1d1f] dark:text-white'}`}>
                {province.name}
            </div>
            <div className={`text-[12px] mt-1 ${isSelected ? 'text-white/70' : 'text-[#8e8e93]'}`}>
                {province.display}
            </div>
        </motion.button>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null)
    const { currency, setCurrency, province, setProvince, taxDisplay, provinceName } = useCurrency()
    const [view, setView] = useState<'main' | 'territory'>('main')
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto')
    const [showClearConfirm, setShowClearConfirm] = useState(false)
    const [isClearing, setIsClearing] = useState(false)

    useScrollLock(isOpen)
    useFocusTrap(isOpen, modalRef)

    // Initialize panel state when opened
    useEffect(() => {
        if (isOpen) {
            setTheme('auto')
            setView('main')
            setShowClearConfirm(false)
        }
    }, [isOpen])

    // Update theme - applies immediately to document
    const updateTheme = useCallback((newTheme: 'light' | 'dark' | 'auto'): void => {
        setTheme(newTheme)

        // Apply theme to document
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else if (newTheme === 'light') {
            document.documentElement.classList.remove('dark')
        } else {
            // Auto - follow system
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
        }
    }, [])

    // Export all data - TODO: integrate with Zustand store for full data export
    const exportAllData = useCallback((): void => {
        try {
            const data = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                settings: { currency, province, theme },
                // Data export can be enhanced to include Zustand store data
                costs: [] as unknown[],
                categories: [] as unknown[],
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `padoca_backup_${new Date().toISOString().split('T')[0]}.json`
            a.click()
        } catch (e) {
            console.error('Export failed:', e)
        }
    }, [currency, province, theme])

    // Clear quotations and reload - TODO: integrate with Zustand store clearAll action
    const clearQuotations = useCallback(async (): Promise<void> => {
        setIsClearing(true)
        try {
            // Clear localStorage and reload
            localStorage.removeItem('padoca-storage')
            setTimeout(() => {
                window.location.reload()
            }, 500)
        } catch (e) {
            console.error('Clear failed:', e)
        }
        setIsClearing(false)
    }, [])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50"
                style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-modal-title"
                initial={{ y: '100%', scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: '100%', scale: 0.95 }}
                transition={MODAL_ANIMATIONS.spring}
                className="relative w-full max-w-[440px] max-h-[90vh] bg-[#f2f2f7] dark:bg-[#000] rounded-t-[32px] md:rounded-[32px] overflow-hidden flex flex-col"
                style={{ boxShadow: '0 -12px 100px rgba(0,0,0,0.5)' }}
            >
                <AnimatePresence mode="wait">
                    {/* MAIN VIEW */}
                    {view === 'main' && (
                        <motion.div
                            key="main"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="flex flex-col h-full"
                        >
                            {/* Header */}
                            <div
                                className="flex items-center justify-between h-[56px] px-5 border-b border-[#c6c6c8]/20 dark:border-[#38383a]/50"
                                style={{
                                    background: 'var(--header-bg)',
                                    '--header-bg': 'rgba(242,242,247,0.9)',
                                    backdropFilter: 'blur(20px)'
                                } as React.CSSProperties}
                            >
                                {/* Mobile pill handle */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-[5px] rounded-full bg-[#78788c]/40 md:hidden" />

                                <div className="w-16" />
                                <span id="settings-modal-title" className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">Settings</span>
                                <button
                                    onClick={onClose}
                                    aria-label="Fechar configurações"
                                    className="w-16 text-right text-[17px] font-semibold text-[#007aff]"
                                >
                                    Done
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto py-5">
                                {/* Regional Section */}
                                <Section
                                    icon={Icons.globe}
                                    gradient={sectionGradients.regional}
                                    title="Regional"
                                    footer={`Current tax rate: ${taxDisplay}`}
                                >
                                    <Row
                                        label="Territory"
                                        value={provinceName}
                                        onClick={() => setView('territory')}
                                    />
                                    <Row
                                        label="Currency"
                                        last
                                        rightElement={
                                            <div className="w-[100px]">
                                                <SegmentedControl
                                                    value={currency}
                                                    options={[
                                                        { id: 'CAD', label: 'CAD' },
                                                        { id: 'USD', label: 'USD' }
                                                    ]}
                                                    onChange={(v) => setCurrency(v as CurrencyCode)}
                                                />
                                            </div>
                                        }
                                    />
                                </Section>

                                {/* Appearance Section */}
                                <Section
                                    icon={Icons.palette}
                                    gradient={sectionGradients.appearance}
                                    title="Appearance"
                                    footer="Theme applies immediately across all screens."
                                >
                                    <Row
                                        label="Theme"
                                        last
                                        rightElement={
                                            <div className="w-[140px]">
                                                <SegmentedControl
                                                    value={theme}
                                                    options={[
                                                        { id: 'light', label: 'Light' },
                                                        { id: 'dark', label: 'Dark' },
                                                        { id: 'auto', label: 'Auto' }
                                                    ]}
                                                    onChange={(v) => updateTheme(v as 'light' | 'dark' | 'auto')}
                                                />
                                            </div>
                                        }
                                    />
                                </Section>

                                {/* Data Section */}
                                <Section
                                    icon={Icons.database}
                                    gradient={sectionGradients.data}
                                    title="Data"
                                    footer="Export creates a complete backup of all your data."
                                >
                                    <Row
                                        label="Export All Data"
                                        onClick={exportAllData}
                                        rightElement={<span className="text-[#8e8e93]">{Icons.download}</span>}
                                    />
                                    <Row
                                        label="Sync Now"
                                        onClick={() => window.location.reload()}
                                        last
                                        rightElement={<span className="text-[#8e8e93]">{Icons.refresh}</span>}
                                    />
                                </Section>

                                {/* Danger Section */}
                                <Section
                                    icon={Icons.trash}
                                    gradient={sectionGradients.danger}
                                    title="Danger Zone"
                                    footer="Clearing quotations removes all quotation data permanently."
                                >
                                    <Row
                                        label="Clear Quotations"
                                        onClick={() => setShowClearConfirm(true)}
                                        last
                                        destructive
                                        rightElement={<span className="text-[#ff3b30]">{Icons.trash}</span>}
                                    />
                                </Section>

                                {/* Version */}
                                <div className="mt-8 text-center pb-8">
                                    <p className="text-[13px] text-[#8e8e93]">
                                        Padoca v15.0 • Canada Edition
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TERRITORY VIEW */}
                    {view === 'territory' && (
                        <motion.div
                            key="territory"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="flex flex-col h-full"
                        >
                            {/* Header */}
                            <div
                                className="flex items-center justify-between h-[56px] px-5 border-b border-[#c6c6c8]/20"
                                style={{
                                    background: 'rgba(242,242,247,0.9)',
                                    backdropFilter: 'blur(20px)'
                                }}
                            >
                                <button
                                    onClick={() => setView('main')}
                                    className="flex items-center gap-0.5 text-[17px] font-medium text-[#007aff]"
                                >
                                    {Icons.chevronLeft}
                                    <span>Back</span>
                                </button>
                                <span className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">Territory</span>
                                <div className="w-16" />
                            </div>

                            {/* Province Grid */}
                            <div className="flex-1 overflow-y-auto p-5">
                                {Object.entries(regionColors).map(([region, colors]) => (
                                    <div key={region} className="mb-6">
                                        <h3 className="text-[13px] font-semibold text-[#8e8e93] uppercase tracking-wide mb-3 px-1">
                                            {colors.label}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(CANADA_PROVINCES)
                                                .filter(([, prov]) => prov.region === region)
                                                .map(([code, prov]) => (
                                                    <ProvinceCard
                                                        key={code}
                                                        code={code}
                                                        province={prov}
                                                        isSelected={province === code}
                                                        onClick={() => {
                                                            setProvince(code as ProvinceCode)
                                                            setTimeout(() => setView('main'), 200)
                                                        }}
                                                    />
                                                ))
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Clear Confirmation */}
                <AnimatePresence>
                    {showClearConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center p-6"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="w-full max-w-[280px] bg-white dark:bg-[#1c1c1e] rounded-[20px] overflow-hidden"
                            >
                                <div className="p-5 text-center">
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#ff3b30]/10 flex items-center justify-center">
                                        <span className="text-[#ff3b30]">{Icons.trash}</span>
                                    </div>
                                    <h3 className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">
                                        Clear Quotations?
                                    </h3>
                                    <p className="mt-2 text-[14px] text-[#8e8e93]">
                                        This will permanently remove all quotation data. The app will reload.
                                    </p>
                                </div>
                                <div className="border-t border-[#e5e5ea] dark:border-[#38383a]">
                                    <button
                                        onClick={() => setShowClearConfirm(false)}
                                        className="w-full py-3.5 text-[17px] text-[#007aff] font-medium border-b border-[#e5e5ea] dark:border-[#38383a]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={clearQuotations}
                                        disabled={isClearing}
                                        className="w-full py-3.5 text-[17px] text-[#ff3b30] font-bold disabled:opacity-50"
                                    >
                                        {isClearing ? 'Clearing...' : 'Clear All'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>,
        document.body
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const SettingsIcon: React.FC<SettingsIconProps> = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
)

export const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        className="w-11 h-11 flex items-center justify-center rounded-full bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl shadow-lg border border-black/5 dark:border-white/10 text-[#8e8e93] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
    >
        <SettingsIcon className="w-5 h-5" />
    </motion.button>
)

export default SettingsPanel
