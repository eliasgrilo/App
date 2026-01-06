// ═══════════════════════════════════════════════════════════════════
// SETTINGS MODULES — Views
// MainView, TerritoryView
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { Icons, sectionGradients, regionColors } from '../Icons'
import { Section, Row, SegmentedControl, ProvinceCard, ProvinceData } from './FormComponents'
import { CANADA_PROVINCES, ProvinceCode, CurrencyCode } from '../../currencyModules/types'

interface MainViewProps {
    provinceName: string; taxDisplay: string; currency: string; theme: string
    setView: (v: 'main' | 'territory') => void; setCurrency: (c: CurrencyCode) => void
    updateTheme: (t: 'light' | 'dark' | 'auto') => void; exportAllData: () => void
    setShowClearConfirm: (v: boolean) => void
}

export function MainView({ provinceName, taxDisplay, currency, theme, setView, setCurrency, updateTheme, exportAllData, setShowClearConfirm }: MainViewProps) {
    return (
        <motion.div key="main" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-5">
                <Section icon={Icons.globe} gradient={sectionGradients.regional} title="Regional" footer={`Current tax rate: ${taxDisplay}`}>
                    <Row label="Territory" value={provinceName} onClick={() => setView('territory')} />
                    <Row label="Currency" last rightElement={<div className="w-[100px]"><SegmentedControl value={currency} options={[{ id: 'CAD', label: 'CAD' }, { id: 'USD', label: 'USD' }]} onChange={v => setCurrency(v as CurrencyCode)} /></div>} />
                </Section>
                <Section icon={Icons.palette} gradient={sectionGradients.appearance} title="Appearance" footer="Theme applies immediately across all screens.">
                    <Row label="Theme" last rightElement={<div className="w-[140px]"><SegmentedControl value={theme} options={[{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'auto', label: 'Auto' }]} onChange={v => updateTheme(v as 'light' | 'dark' | 'auto')} /></div>} />
                </Section>
                <Section icon={Icons.database} gradient={sectionGradients.data} title="Data" footer="Export creates a complete backup of all your data.">
                    <Row label="Export All Data" onClick={exportAllData} rightElement={<span className="text-[#8e8e93]">{Icons.download}</span>} />
                    <Row label="Sync Now" onClick={() => window.location.reload()} last rightElement={<span className="text-[#8e8e93]">{Icons.refresh}</span>} />
                </Section>
                <Section icon={Icons.trash} gradient={sectionGradients.danger} title="Danger Zone" footer="Clearing quotations removes all quotation data permanently.">
                    <Row label="Clear Quotations" onClick={() => setShowClearConfirm(true)} last destructive rightElement={<span className="text-[#ff3b30]">{Icons.trash}</span>} />
                </Section>
                <div className="mt-8 text-center pb-8"><p className="text-[13px] text-[#8e8e93]">Padoca v15.0 • Canada Edition</p></div>
            </div>
        </motion.div>
    )
}

interface TerritoryViewProps { province: string; setProvince: (p: ProvinceCode) => void; setView: (v: 'main' | 'territory') => void }

export function TerritoryView({ province, setProvince, setView }: TerritoryViewProps) {
    return (
        <motion.div key="territory" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="flex flex-col h-full">
            <div className="flex items-center justify-between h-[56px] px-5 border-b border-[#c6c6c8]/20" style={{ background: 'rgba(242,242,247,0.9)', backdropFilter: 'blur(20px)' }}>
                <button onClick={() => setView('main')} className="flex items-center gap-0.5 text-[17px] font-medium text-[#007aff]">{Icons.chevronLeft}<span>Back</span></button>
                <span className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">Territory</span>
                <div className="w-16" />
            </div>
            <div className="flex-1 overflow-y-auto p-5">
                {Object.entries(regionColors).map(([region, colors]) => (
                    <div key={region} className="mb-6">
                        <h3 className="text-[13px] font-semibold text-[#8e8e93] uppercase tracking-wide mb-3 px-1">{colors.label}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(CANADA_PROVINCES).filter(([, prov]) => prov.region === region).map(([code, prov]) => (
                                <ProvinceCard key={code} code={code} province={prov as ProvinceData} isSelected={province === code}
                                    onClick={() => { setProvince(code as ProvinceCode); setTimeout(() => setView('main'), 200) }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}
