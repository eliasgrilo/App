import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { FormatService } from '../services/formatService'
import { FirebaseService } from '../services/firebaseService'
import { TaxConfigService, PROVINCE_TAX_RATES, PROVINCE_TIMEZONES } from '../services/taxConfigService'
import { HapticService } from '../services/hapticService'

/**
 * Settings Panel V15 - Apple Human Interface Guidelines
 * 
 * Design Philosophy:
 * - Clarity: Content is king. Every pixel serves a purpose.
 * - Deference: The UI helps, never competes with content.
 * - Depth: Visual layers and motion create hierarchy.
 * 
 * Key Apple Design Patterns:
 * - SF Pro typography with optical weight adjustments
 * - Consistent 8pt grid spacing
 * - Natural motion with spring physics
 * - Semantic colors that adapt to light/dark mode
 * - Grouped settings with inset rounded rectangles
 * 
 * @version 15.0.0 - Apple Premium Redesign
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS - SF Symbols Style
// ═══════════════════════════════════════════════════════════════════════════════

const Icons = {
    X: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Globe: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
    Check: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    ),
    ChevronRight: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    ),
    Settings: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Sparkles: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zm9-3a.75.75 0 01.728.568l.258 1.036a2.63 2.63 0 001.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258a2.63 2.63 0 00-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.63 2.63 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.63 2.63 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
        </svg>
    ),
    Currency: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Trash: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    ),
    ArrowPath: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
    ),
    Shield: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    ),
    Bolt: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
        </svg>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPLE-STYLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Apple-style Toggle Switch
 * Matches iOS toggle behavior and aesthetics
 */
const AppleToggle = ({ enabled, onChange, disabled = false }) => (
    <motion.button
        onClick={() => !disabled && onChange(!enabled)}
        className={`
            relative w-[51px] h-[31px] rounded-full transition-colors duration-200
            ${enabled
                ? 'bg-[#34C759]'
                : 'bg-gray-200 dark:bg-gray-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        whileTap={!disabled ? { scale: 0.95 } : {}}
    >
        <motion.div
            className="absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)]"
            animate={{ x: enabled ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
    </motion.button>
)

/**
 * Segmented Control - iOS Style
 */
const SegmentedControl = ({ options, value, onChange }) => {
    const activeIndex = options.findIndex(o => o.value === value)

    return (
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-[9px] p-[2px] flex">
            {/* Sliding background */}
            <motion.div
                className="absolute top-[2px] bottom-[2px] bg-white dark:bg-gray-600 rounded-[7px] shadow-sm"
                initial={false}
                animate={{
                    x: `calc(${activeIndex * 100}% + ${activeIndex * 2}px)`,
                    width: `calc(${100 / options.length}% - 2px)`
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => { onChange(opt.value); HapticService.trigger('selection'); }}
                    className={`
                        relative z-10 flex-1 py-[6px] px-3 text-[13px] font-semibold
                        transition-colors duration-200 rounded-[7px]
                        ${value === opt.value
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }
                    `}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

/**
 * Settings Row - Apple Grouped Style
 */
const SettingsRow = ({
    icon: Icon,
    iconBg = "bg-gray-500",
    label,
    value,
    onClick,
    isFirst = false,
    isLast = false,
    showChevron = true,
    rightElement = null,
    destructive = false
}) => (
    <motion.button
        onClick={onClick}
        whileTap={onClick ? { backgroundColor: 'rgba(0,0,0,0.05)' } : {}}
        className={`
            w-full flex items-center justify-between px-4 py-[11px]
            bg-white dark:bg-[#1C1C1E]
            ${isFirst ? 'rounded-t-[10px]' : ''}
            ${isLast ? 'rounded-b-[10px]' : 'border-b border-gray-200/60 dark:border-gray-700/60'}
            ${onClick ? 'active:bg-gray-100 dark:active:bg-gray-800' : ''}
            transition-colors duration-150
        `}
        style={{ marginLeft: Icon ? 0 : 0 }}
    >
        <div className="flex items-center gap-3">
            {Icon && (
                <div className={`w-[29px] h-[29px] ${iconBg} rounded-[6px] flex items-center justify-center`}>
                    <Icon className="w-[17px] h-[17px] text-white" />
                </div>
            )}
            <span className={`text-[17px] ${destructive ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                {label}
            </span>
        </div>
        <div className="flex items-center gap-2">
            {rightElement}
            {value && !rightElement && (
                <span className="text-[17px] text-gray-500 dark:text-gray-400">{value}</span>
            )}
            {showChevron && onClick && (
                <Icons.ChevronRight className="w-[14px] h-[14px] text-gray-300 dark:text-gray-600" />
            )}
        </div>
    </motion.button>
)

/**
 * Section Header - Apple Style
 */
const SectionHeader = ({ title, subtitle }) => (
    <div className="px-4 pt-6 pb-2">
        <h3 className="text-[13px] font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {title}
        </h3>
        {subtitle && (
            <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1">
                {subtitle}
            </p>
        )}
    </div>
)

/**
 * Section Footer - Apple Style
 */
const SectionFooter = ({ text }) => (
    <p className="px-4 pt-2 pb-4 text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
        {text}
    </p>
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const SettingsPanel = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState({
        province: 'ON',
        currency: 'CAD'
    })
    const [view, setView] = useState('main')
    const [isClearing, setIsClearing] = useState(false)
    const [showClearConfirm, setShowClearConfirm] = useState(false)

    useScrollLock(isOpen)

    // Load settings on open
    useEffect(() => {
        if (isOpen) {
            const taxConfig = TaxConfigService.getConfig()
            const formatSettings = FormatService.getSettings()

            setConfig({
                province: taxConfig.province || 'ON',
                currency: formatSettings.currency || 'CAD'
            })
            setView('main')
            setShowClearConfirm(false)
        }
    }, [isOpen])

    // Update handlers
    const updateProvince = useCallback((province) => {
        setConfig(prev => ({ ...prev, province }))
        TaxConfigService.setProvince(province)
        FirebaseService.syncGlobalSettings({
            province,
            currency: config.currency,
            taxRate: PROVINCE_TAX_RATES[province]?.totalRate,
            timezone: PROVINCE_TIMEZONES[province]
        })
        HapticService.trigger('success')
    }, [config.currency])

    const updateCurrency = useCallback((currency) => {
        setConfig(prev => ({ ...prev, currency }))
        FormatService.updateSettings({ currency, locale: 'en-CA' })
        HapticService.trigger('selection')
    }, [])

    // Clear all quotation data
    const clearAllQuotationData = useCallback(async () => {
        setIsClearing(true)
        HapticService.trigger('warning')

        try {
            // Clear localStorage quotation data
            localStorage.removeItem('padoca_sent_emails')

            // Clear Firestore quotations if available
            if (typeof FirebaseService.clearQuotations === 'function') {
                await FirebaseService.clearQuotations()
            }

            // Dispatch storage event for cross-tab sync
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'padoca_sent_emails',
                newValue: null
            }))

            HapticService.trigger('success')
            setShowClearConfirm(false)

            // Force reload to reset all state
            setTimeout(() => {
                window.location.reload()
            }, 500)

        } catch (error) {
            console.error('Failed to clear quotation data:', error)
            HapticService.trigger('error')
        } finally {
            setIsClearing(false)
        }
    }, [])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="
                    relative w-full max-w-[400px] mx-4
                    bg-[#F2F2F7] dark:bg-[#000000]
                    rounded-[14px] overflow-hidden
                    shadow-2xl
                "
                style={{ maxHeight: '85vh' }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {/* MAIN VIEW */}
                    {view === 'main' && (
                        <motion.div
                            key="main"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-[#F2F2F7] dark:bg-[#000000]">
                                <div className="w-[60px]" />
                                <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                                    Settings
                                </h1>
                                <button
                                    onClick={onClose}
                                    className="w-[60px] text-right text-[17px] font-normal text-[#007AFF]"
                                >
                                    Done
                                </button>
                            </div>

                            {/* Content */}
                            <div className="px-4 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>

                                {/* Automation Status - Always Active */}
                                <div className="mt-4 bg-gradient-to-r from-[#5856D6] to-[#AF52DE] rounded-[12px] p-4 shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            <Icons.Bolt className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-[15px] font-semibold text-white">
                                                Padoca Intelligence
                                            </h3>
                                            <p className="text-[13px] text-white/80">
                                                Automação completa ativada
                                            </p>
                                        </div>
                                        <div className="px-3 py-1 bg-white/20 rounded-full">
                                            <span className="text-[12px] font-semibold text-white">
                                                AUTO
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Region & Currency */}
                                <SectionHeader title="Regional" />
                                <div className="rounded-[10px] overflow-hidden">
                                    <SettingsRow
                                        icon={Icons.Globe}
                                        iconBg="bg-[#007AFF]"
                                        label="Território"
                                        value={PROVINCE_TAX_RATES[config.province]?.name || 'Ontario'}
                                        onClick={() => setView('region')}
                                        isFirst
                                    />
                                    <SettingsRow
                                        icon={Icons.Currency}
                                        iconBg="bg-[#34C759]"
                                        label="Moeda"
                                        showChevron={false}
                                        isLast
                                        rightElement={
                                            <div className="w-[100px]">
                                                <SegmentedControl
                                                    options={[
                                                        { value: 'CAD', label: 'CAD' },
                                                        { value: 'USD', label: 'USD' }
                                                    ]}
                                                    value={config.currency}
                                                    onChange={updateCurrency}
                                                />
                                            </div>
                                        }
                                    />
                                </div>
                                <SectionFooter text={`Taxa de imposto: ${PROVINCE_TAX_RATES[config.province]?.displayRate || '13%'}`} />

                                {/* Data Management */}
                                <SectionHeader title="Dados" />
                                <div className="rounded-[10px] overflow-hidden">
                                    <SettingsRow
                                        icon={Icons.ArrowPath}
                                        iconBg="bg-[#5856D6]"
                                        label="Sincronizar Dados"
                                        onClick={() => {
                                            HapticService.trigger('selection')
                                            window.location.reload()
                                        }}
                                        isFirst
                                    />
                                    <SettingsRow
                                        icon={Icons.Trash}
                                        iconBg="bg-[#FF3B30]"
                                        label="Limpar Cotações"
                                        onClick={() => setShowClearConfirm(true)}
                                        showChevron={false}
                                        isLast
                                        destructive
                                    />
                                </div>
                                <SectionFooter text="Limpar cotações remove todos os dados de cotação e pedidos pendentes. Esta ação não pode ser desfeita." />

                                {/* Version */}
                                <div className="mt-8 text-center">
                                    <p className="text-[13px] text-gray-400 dark:text-gray-600">
                                        Padoca v15.0 • Apple Design
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* REGION VIEW */}
                    {view === 'region' && (
                        <motion.div
                            key="region"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-[#F2F2F7] dark:bg-[#000000]">
                                <button
                                    onClick={() => setView('main')}
                                    className="w-[60px] text-left text-[17px] font-normal text-[#007AFF] flex items-center"
                                >
                                    <span className="text-[22px] mr-1">‹</span> Back
                                </button>
                                <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                                    Território
                                </h1>
                                <div className="w-[60px]" />
                            </div>

                            {/* Province List */}
                            <div className="px-4 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
                                <SectionHeader title="Selecione sua província" />
                                <div className="rounded-[10px] overflow-hidden">
                                    {Object.entries(PROVINCE_TAX_RATES).map(([code, info], index, arr) => (
                                        <SettingsRow
                                            key={code}
                                            label={info.name}
                                            value={info.displayRate}
                                            onClick={() => {
                                                updateProvince(code)
                                                setTimeout(() => setView('main'), 150)
                                            }}
                                            showChevron={false}
                                            isFirst={index === 0}
                                            isLast={index === arr.length - 1}
                                            rightElement={
                                                config.province === code && (
                                                    <Icons.Check className="w-5 h-5 text-[#007AFF]" />
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Clear Confirmation Dialog */}
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
                                className="w-full max-w-[270px] bg-white dark:bg-[#1C1C1E] rounded-[14px] overflow-hidden"
                            >
                                <div className="p-4 text-center">
                                    <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                                        Limpar Cotações?
                                    </h3>
                                    <p className="mt-2 text-[13px] text-gray-500 dark:text-gray-400">
                                        Esta ação irá remover permanentemente todos os dados de cotação. O aplicativo será recarregado.
                                    </p>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => setShowClearConfirm(false)}
                                        className="w-full py-3 text-[17px] text-[#007AFF] font-normal border-b border-gray-200 dark:border-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={clearAllQuotationData}
                                        disabled={isClearing}
                                        className="w-full py-3 text-[17px] text-[#FF3B30] font-semibold disabled:opacity-50"
                                    >
                                        {isClearing ? 'Limpando...' : 'Limpar Tudo'}
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

export const SettingsIcon = ({ className = "w-5 h-5" }) => <Icons.Settings className={className} />

export const SettingsButton = ({ onClick }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        className="
            w-11 h-11 flex items-center justify-center rounded-full 
            bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl
            shadow-lg border border-gray-200/50 dark:border-gray-700/50
            text-gray-600 dark:text-gray-300 
            hover:bg-white dark:hover:bg-gray-700
            transition-all duration-200
        "
    >
        <Icons.Settings className="w-5 h-5" />
    </motion.button>
)

export default SettingsPanel
