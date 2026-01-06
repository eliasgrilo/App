// ═══════════════════════════════════════════════════════════════════
// APP MODULE — Desktop Navigation Component
// ═══════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion'
import UnitToggle from '../../UnitToggle'
import { NAV_ITEMS, spring, type UnitMode } from '../types'

interface DesktopNavProps {
    currentView: string
    inputMode: UnitMode
    onViewChange: (view: string) => void
    onInputModeChange: (mode: UnitMode) => void
}

export function DesktopNav({ currentView, inputMode, onViewChange, onInputModeChange }: DesktopNavProps) {
    return (
        <nav className="relative hidden md:block">
            <motion.nav
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, ...spring }}
                className="inline-flex items-center p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-2xl border border-zinc-200/50 dark:border-white/10 shadow-lg"
            >
                {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
                    const isActive = currentView === key
                    return (
                        <button key={key} onClick={() => onViewChange(key)}
                            className={`relative px-4 py-2.5 rounded-xl transition-colors duration-[250ms] ${isActive ? 'text-indigo-600 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                            {isActive && (
                                <motion.div layoutId="nav-active-desktop"
                                    className="absolute inset-0 bg-indigo-50 dark:bg-white/10 rounded-xl"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <Icon active={isActive} />
                                <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
                            </span>
                        </button>
                    )
                })}
            </motion.nav>

            {/* Unit Toggle for Calculator */}
            <AnimatePresence mode="wait">
                {currentView === 'calculator' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, width: 0 }}
                        animate={{ opacity: 1, scale: 1, width: 'auto' }}
                        exit={{ opacity: 0, scale: 0.8, width: 0 }}
                        transition={spring}
                        className="md:hidden flex-shrink-0 mt-3"
                    >
                        <UnitToggle value={inputMode} onChange={onInputModeChange} />
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
