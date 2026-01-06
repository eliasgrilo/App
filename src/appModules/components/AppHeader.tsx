// ═══════════════════════════════════════════════════════════════════
// APP MODULE — App Header Component
// ═══════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { SettingsButton } from '../../components/SettingsPanel'
import { MobileMenu } from './MobileMenu'
import { DesktopNav } from './DesktopNav'
import { spring, type UnitMode } from '../types'

interface AppHeaderProps {
    currentView: string
    inputMode: UnitMode
    mobileMenuOpen: boolean
    onViewChange: (view: string) => void
    onInputModeChange: (mode: UnitMode) => void
    onMobileMenuToggle: () => void
    onSettingsOpen: () => void
}

export function AppHeader({
    currentView, inputMode, mobileMenuOpen,
    onViewChange, onInputModeChange, onMobileMenuToggle, onSettingsOpen
}: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-2 mb-2 md:relative md:pt-8 md:pb-4 md:mb-6">
            {/* Glass Background */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-2xl md:bg-transparent md:backdrop-blur-none border-b border-zinc-200/50 dark:border-white/5 md:border-none"
            />

            <div className="relative flex flex-col gap-0 md:gap-5">
                {/* Title Row */}
                <div className="flex items-center justify-between">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, ...spring }}>
                        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Padoca Pizza</h1>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1 tracking-wide uppercase hidden md:block">
                            Sistema de Produção & Gestão
                        </p>
                    </motion.div>

                    {/* Mobile Hamburger */}
                    <button onClick={onMobileMenuToggle}
                        className="relative w-11 h-11 flex items-center justify-center md:hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                        aria-label="Menu">
                        <div className="relative w-[18px] h-[10px]">
                            <motion.span animate={mobileMenuOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                                className="absolute top-0 left-0 right-0 h-[1.5px] bg-zinc-800 dark:bg-zinc-200 origin-center" />
                            <motion.span animate={mobileMenuOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
                                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                                className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-zinc-800 dark:bg-zinc-200 origin-center" />
                        </div>
                    </button>

                    {/* Desktop Settings */}
                    <div className="hidden md:block">
                        <SettingsButton onClick={onSettingsOpen} />
                    </div>
                </div>

                {/* Mobile Menu */}
                <MobileMenu isOpen={mobileMenuOpen} currentView={currentView}
                    onViewChange={onViewChange} onClose={onMobileMenuToggle} />

                {/* Desktop Nav */}
                <DesktopNav currentView={currentView} inputMode={inputMode}
                    onViewChange={onViewChange} onInputModeChange={onInputModeChange} />
            </div>
        </header>
    )
}
