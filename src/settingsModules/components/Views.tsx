// ═══════════════════════════════════════════════════════════════════
// SETTINGS MODULES — Views
// MainView (simplified - no Regional/Territory)
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { Icons, sectionGradients } from '../Icons'
import { Section, Row, SegmentedControl } from './FormComponents'

interface MainViewProps {
    theme: string
    updateTheme: (t: 'light' | 'dark' | 'auto') => void
    exportAllData: () => void
    setShowClearConfirm: (v: boolean) => void
}

export function MainView({ theme, updateTheme, exportAllData, setShowClearConfirm }: MainViewProps) {
    return (
        <motion.div key="main" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-5">
                <Section icon={Icons.palette} gradient={sectionGradients.appearance} title="Aparência" footer="O tema é aplicado imediatamente em todas as telas.">
                    <Row label="Tema" last rightElement={<div className="w-[140px]"><SegmentedControl value={theme} options={[{ id: 'light', label: 'Claro' }, { id: 'dark', label: 'Escuro' }, { id: 'auto', label: 'Auto' }]} onChange={v => updateTheme(v as 'light' | 'dark' | 'auto')} /></div>} />
                </Section>
                <Section icon={Icons.database} gradient={sectionGradients.data} title="Dados" footer="Exportar cria um backup completo de todos os seus dados.">
                    <Row label="Exportar Todos os Dados" onClick={exportAllData} rightElement={<span className="text-[#8e8e93]">{Icons.download}</span>} />
                    <Row label="Sincronizar Agora" onClick={() => window.location.reload()} last rightElement={<span className="text-[#8e8e93]">{Icons.refresh}</span>} />
                </Section>
                <Section icon={Icons.trash} gradient={sectionGradients.danger} title="Zona de Perigo" footer="Limpar cotações remove todos os dados de cotação permanentemente.">
                    <Row label="Limpar Cotações" onClick={() => setShowClearConfirm(true)} last destructive rightElement={<span className="text-[#ff3b30]">{Icons.trash}</span>} />
                </Section>
                <div className="mt-8 text-center pb-8"><p className="text-[13px] text-[#8e8e93]">Padoca v15.0 • Brasil Edition</p></div>
            </div>
        </motion.div>
    )
}
