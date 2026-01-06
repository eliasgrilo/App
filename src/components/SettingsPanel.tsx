// ═══════════════════════════════════════════════════════════════════
// SETTINGS PANEL — Apple HIG Premium Design
// Refactored: 694 → ~100 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useCurrency } from '../stores/useCurrencyStore'
import { CurrencyCode, ProvinceCode } from '../currencyModules/types'
import { MODAL_ANIMATIONS } from '../utils/animations'
import { Icons, MainView, TerritoryView } from '../settingsModules'

interface SettingsPanelProps { isOpen: boolean; onClose: () => void }

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null)
    const { currency, setCurrency, province, setProvince, taxDisplay, provinceName } = useCurrency()
    const [view, setView] = useState<'main' | 'territory'>('main')
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto')
    const [showClearConfirm, setShowClearConfirm] = useState(false)
    const [isClearing, setIsClearing] = useState(false)

    useScrollLock(isOpen); useFocusTrap(isOpen, modalRef)

    useEffect(() => { if (isOpen) { setTheme('auto'); setView('main'); setShowClearConfirm(false) } }, [isOpen])

    const updateTheme = useCallback((newTheme: 'light' | 'dark' | 'auto') => {
        setTheme(newTheme)
        if (newTheme === 'dark') document.documentElement.classList.add('dark')
        else if (newTheme === 'light') document.documentElement.classList.remove('dark')
        else { if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark') }
    }, [])

    const exportAllData = useCallback(() => {
        try {
            const data = { version: '2.0', exportDate: new Date().toISOString(), settings: { currency, province, theme }, costs: [], categories: [] }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `padoca_backup_${new Date().toISOString().split('T')[0]}.json`; a.click()
        } catch (e) { console.error('Export failed:', e) }
    }, [currency, province, theme])

    const clearQuotations = useCallback(async () => { setIsClearing(true); localStorage.removeItem('padoca-storage'); setTimeout(() => window.location.reload(), 500) }, [])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50"
                style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} onClick={onClose} />
            <motion.div ref={modalRef} role="dialog" aria-modal="true" initial={{ y: '100%', scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: '100%', scale: 0.95 }}
                transition={MODAL_ANIMATIONS.spring} className="relative w-full max-w-[440px] max-h-[90vh] bg-[#f2f2f7] dark:bg-[#000] rounded-t-[32px] md:rounded-[32px] overflow-hidden flex flex-col"
                style={{ boxShadow: '0 -12px 100px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between h-[56px] px-5 border-b border-[#c6c6c8]/20 dark:border-[#38383a]/50" style={{ background: 'rgba(242,242,247,0.9)', backdropFilter: 'blur(20px)' }}>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-[5px] rounded-full bg-[#78788c]/40 md:hidden" />
                    <div className="w-16" /><span className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">Settings</span>
                    <button onClick={onClose} className="w-16 text-right text-[17px] font-semibold text-[#007aff]">Done</button>
                </div>
                <AnimatePresence mode="wait">
                    {view === 'main' && <MainView provinceName={provinceName} taxDisplay={taxDisplay} currency={currency} theme={theme}
                        setView={setView} setCurrency={setCurrency} updateTheme={updateTheme} exportAllData={exportAllData} setShowClearConfirm={setShowClearConfirm} />}
                    {view === 'territory' && <TerritoryView province={province} setProvince={setProvince} setView={setView} />}
                </AnimatePresence>
                <AnimatePresence>
                    {showClearConfirm && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 flex items-center justify-center p-6">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-[280px] bg-white dark:bg-[#1c1c1e] rounded-[20px] overflow-hidden">
                                <div className="p-5 text-center">
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#ff3b30]/10 flex items-center justify-center"><span className="text-[#ff3b30]">{Icons.trash}</span></div>
                                    <h3 className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">Clear Quotations?</h3>
                                    <p className="mt-2 text-[14px] text-[#8e8e93]">This will permanently remove all quotation data. The app will reload.</p>
                                </div>
                                <div className="border-t border-[#e5e5ea] dark:border-[#38383a]">
                                    <button onClick={() => setShowClearConfirm(false)} className="w-full py-3.5 text-[17px] text-[#007aff] font-medium border-b border-[#e5e5ea] dark:border-[#38383a]">Cancel</button>
                                    <button onClick={clearQuotations} disabled={isClearing} className="w-full py-3.5 text-[17px] text-[#ff3b30] font-bold disabled:opacity-50">{isClearing ? 'Clearing...' : 'Clear All'}</button>
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

export const SettingsIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
)

export const SettingsButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <motion.button onClick={onClick} whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
        className="w-11 h-11 flex items-center justify-center rounded-full bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl shadow-lg border border-black/5 dark:border-white/10 text-[#8e8e93] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
        <SettingsIcon className="w-5 h-5" />
    </motion.button>
)

export default SettingsPanel
