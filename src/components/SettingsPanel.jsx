import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { FormatService } from '../services/formatService'
import { FirebaseService } from '../services/firebaseService'
import { TaxConfigService, PROVINCE_TAX_RATES, PROVINCE_TIMEZONES } from '../services/taxConfigService'
import { HapticService } from '../services/hapticService'

/**
 * Settings Panel V11 - VIBRANT INTELLIGENCE
 * 
 * Design: Apple Intelligence Aesthetic
 * Colors: Radiant Gradients, Semantic System Colors
 * 
 * Features:
 * - Radiant AI Header (Indigo/Purple/Pink Gradient)
 * - Vibrant Segmented Controls (Context-aware active states)
 * - Semantic Icons (Blue for Territory, Green for Money)
 */

// --- Assets ---
const Icons = {
    X: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
    Globe: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
    Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
    ChevronRight: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>,
    Settings: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Sparkles: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>
}

// --- Components ---

const VibrantSegmentedControl = ({ options, value, onChange, thumbColor = "bg-white", activeTextColor = "text-black" }) => (
    <div className="relative bg-[#E3E3E8] dark:bg-[#1C1C1E] rounded-lg p-[2px] h-[32px] flex w-full">
        {/* The Active Thumb - Absolute Positioned */}
        <motion.div
            layoutId={`segment-thumb-${options.map(o => o.v).join('')}`}
            className={`absolute top-[2px] bottom-[2px] rounded-[6px] shadow-sm z-0 ${thumbColor}`}
            initial={false}
            animate={{
                x: `${options.findIndex(o => o.v === value) * 100}%`,
                width: `${100 / options.length}%`
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />

        {/* The Clickable Areas */}
        {options.map((opt) => {
            const isActive = value === opt.v
            return (
                <button
                    key={opt.v}
                    onClick={(e) => { e.stopPropagation(); onChange(opt.v); HapticService.trigger('selection'); }}
                    className={`
                        relative z-10 flex-1 flex items-center justify-center text-[13px] font-medium transition-colors
                        ${isActive ? activeTextColor : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'}
                    `}
                    style={{ width: `${100 / options.length}%` }}
                >
                    {opt.l}
                </button>
            )
        })}
    </div>
)

const SystemRow = ({ label, value, onPress, icon: Icon, active, iconColor = "text-zinc-900", hasChevron = true }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onPress?.(); }}
        className={`w-full flex items-center justify-between py-3 px-4 ${active ? 'bg-zinc-100 dark:bg-white/10' : 'hover:bg-zinc-50 dark:hover:bg-white/5'} transition-colors active:scale-[0.99]`}
    >
        <div className="flex items-center gap-3">
            {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
            <span className="text-[15px] font-medium text-zinc-900 dark:text-white">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[15px] text-zinc-500 dark:text-zinc-400">{value}</span>
            {hasChevron && <Icons.ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />}
            {active && <Icons.Check className="w-4 h-4 text-blue-500" />}
        </div>
    </button>
)

const Header = ({ title, onClose }) => (
    <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <h2 className="text-[20px] font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">{title}</h2>
        <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
            <Icons.X className="w-4 h-4 text-zinc-500" />
        </button>
    </div>
)

// --- Main Panel ---

const SettingsPanel = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState({
        province: TaxConfigService.getConfig().province,
        currency: 'CAD',
        aiMode: 'manual'
    })

    // Sub-view navigation state
    const [view, setView] = useState('main')

    useScrollLock(isOpen)

    useEffect(() => {
        if (isOpen) {
            const base = {
                province: TaxConfigService.getConfig().province,
                currency: FormatService.getSettings().currency || 'CAD',
            }
            // Load persisted AI mode
            let extra = {}
            try {
                const saved = localStorage.getItem('padoca_settings_extra')
                if (saved) extra = JSON.parse(saved)
            } catch (e) { }

            setConfig({ ...base, ...extra, aiMode: extra.aiMode || 'manual' })
            setView('main')
        }
    }, [isOpen])

    const update = (key, val) => {
        const newConfig = { ...config, [key]: val }
        setConfig(newConfig)

        // Persist extra logic
        localStorage.setItem('padoca_settings_extra', JSON.stringify({ aiMode: newConfig.aiMode }))

        if (key === 'province') {
            TaxConfigService.setProvince(val)
            FirebaseService.syncGlobalSettings({
                province: val,
                currency: config.currency,
                taxRate: PROVINCE_TAX_RATES[val].totalRate,
                timezone: PROVINCE_TIMEZONES[val]
            })
        }
        if (key === 'currency') {
            FormatService.updateSettings({ currency: val, locale: 'en-CA' })
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none">

            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            />

            {/* The V11 "Vibrant" Compact Pill */}
            <motion.div
                layout
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="
                    pointer-events-auto relative
                    w-[360px] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl
                    rounded-[32px] overflow-hidden
                    shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)]
                    border border-white/20 dark:border-white/10
                "
                style={{ maxHeight: '80vh' }}
            >
                {/* Subtle Ambient Glow */}
                <div className="absolute top-0 right-0 w-full h-[60%] bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />

                <AnimatePresence mode="wait" initial={false}>

                    {/* VIEW: MAIN */}
                    {view === 'main' && (
                        <motion.div
                            key="main"
                            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pb-6 relative z-10"
                        >
                            <Header title="Settings" onClose={onClose} />

                            <div className="px-4 mt-2 space-y-8">

                                {/* AI Autopilot Section -- The "Radiant" Feature */}
                                <div className="space-y-3">
                                    <div className="px-2 flex items-center gap-2">
                                        <div className="bg-gradient-to-r from-indigo-500 to-pink-500 p-0.5 rounded-full">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        </div>
                                        <h3 className="text-[11px] uppercase tracking-wider font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                            Intelligence
                                        </h3>
                                    </div>
                                    <VibrantSegmentedControl
                                        options={[
                                            { v: 'manual', l: 'Manual' },
                                            { v: 'hybrid', l: 'Hybrid' },
                                            { v: 'auto', l: 'Auto' }
                                        ]}
                                        value={config.aiMode}
                                        onChange={(v) => update('aiMode', v)}
                                        thumbColor="bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20"
                                        activeTextColor="text-white font-semibold"
                                    />
                                    <p className="px-2 text-[11px] font-medium text-zinc-400 leading-tight">
                                        {config.aiMode === 'manual' && "AI assists. You decide."}
                                        {config.aiMode === 'hybrid' && "AI handles basics. You verify."}
                                        {config.aiMode === 'auto' && "AI manages full inventory lifecycle."}
                                    </p>
                                </div>

                                {/* System Core Section -- The "Semantic" Colors */}
                                <div className="space-y-2">
                                    <div className="px-2">
                                        <h3 className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">System Core</h3>
                                    </div>

                                    <div className="bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50 backdrop-blur-sm rounded-[14px] overflow-hidden border border-black/5 dark:border-white/5 divide-y divide-zinc-200 dark:divide-zinc-700">
                                        {/* Province Selector Row */}
                                        <SystemRow
                                            icon={Icons.Globe}
                                            iconColor="text-blue-500"
                                            label="Territory"
                                            value={PROVINCE_TAX_RATES[config.province].name}
                                            onPress={() => setView('region')}
                                        />

                                        {/* Currency Row (Emerald Accent on Toggle) */}
                                        <div className="py-2.5 px-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 flex justify-center text-emerald-500 font-bold">$</div>
                                                <span className="text-[15px] font-medium text-zinc-900 dark:text-white">Currency</span>
                                            </div>
                                            <div className="w-[140px]">
                                                <VibrantSegmentedControl
                                                    options={[{ v: 'CAD', l: 'CAD' }, { v: 'USD', l: 'USD' }]}
                                                    value={config.currency}
                                                    onChange={(v) => update('currency', v)}
                                                    thumbColor="bg-emerald-500 shadow-sm shadow-emerald-500/20"
                                                    activeTextColor="text-white font-semibold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center pt-2 pb-1">
                                    <p className="text-[10px] font-medium text-zinc-300 dark:text-zinc-600 flex items-center justify-center gap-1">
                                        Padoca Inc.
                                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                        v11.0
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* VIEW: REGION SELECTION */}
                    {view === 'region' && (
                        <motion.div
                            key="region"
                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-full flex flex-col relative z-10"
                        >
                            <div className="flex items-center px-4 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                <button
                                    onClick={() => setView('main')}
                                    className="flex items-center text-blue-500 font-medium text-[15px] active:opacity-60"
                                >
                                    <span className="mr-1">‹</span> Back
                                </button>
                                <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-[17px] text-zinc-900 dark:text-white">Select Territory</span>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto p-4 space-y-1">
                                {Object.entries(PROVINCE_TAX_RATES).map(([code, info]) => (
                                    <div key={code} className="bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50 first:rounded-t-[14px] last:rounded-b-[14px] overflow-hidden">
                                        <SystemRow
                                            label={info.name}
                                            value={info.displayRate}
                                            active={config.province === code}
                                            hasChevron={false}
                                            onPress={() => {
                                                update('province', code);
                                                HapticService.trigger('selection');
                                                setTimeout(() => setView('main'), 200);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </motion.div>

        </div>,
        document.body
    )
}

// --- Exports ---
export const SettingsIcon = ({ className = "w-5 h-5" }) => <Icons.Settings className={className} />
export const SettingsButton = ({ onClick }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.92 }}
        className="w-10 h-10 flex items-center justify-center rounded-full text-black/60 hover:text-black hover:bg-black/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-all"
    >
        <Icons.Settings className="w-5 h-5" />
    </motion.button>
)

export default SettingsPanel
