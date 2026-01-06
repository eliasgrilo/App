// ═══════════════════════════════════════════════════════════════════
// APP MODULE — Mobile Menu Component
// Full-screen mobile menu overlay
// ═══════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion'
import { NAV_ITEMS } from '../types'

interface MobileMenuProps {
    isOpen: boolean
    currentView: string
    onViewChange: (view: string) => void
    onClose: () => void
}

export function MobileMenu({ isOpen, currentView, onViewChange, onClose }: MobileMenuProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[9999] md:hidden overflow-hidden"
                    style={{
                        paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
                        paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)'
                    }}
                >
                    <div className="absolute inset-0 bg-white dark:bg-black" />

                    {/* Close Button */}
                    <div className="absolute top-4 right-4 z-10" style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}>
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    {/* Menu Items */}
                    <div className="relative flex flex-col justify-center h-full px-6 pb-20 overflow-y-auto scrollbar-hide">
                        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">
                            Navegação
                        </motion.p>

                        <div className="space-y-1">
                            {NAV_ITEMS.map(({ key, label, icon: Icon }, index) => {
                                const isActive = currentView === key
                                return (
                                    <motion.button
                                        key={key}
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.04, type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }}
                                        onClick={() => onViewChange(key)}
                                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${isActive ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 active:bg-zinc-100 dark:active:bg-white/5'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                                            <Icon active={isActive} />
                                        </div>
                                        <span className="text-[17px] font-semibold tracking-tight">{label}</span>
                                        {isActive && (
                                            <motion.div layoutId="mobile-active-check" className="ml-auto">
                                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </motion.div>
                                        )}
                                    </motion.button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Bottom Branding */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                        className="absolute bottom-6 left-0 right-0 text-center">
                        <p className="text-[10px] text-zinc-300 dark:text-zinc-700 uppercase tracking-widest font-medium">
                            Padoca Pizza • {new Date().getFullYear()}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
