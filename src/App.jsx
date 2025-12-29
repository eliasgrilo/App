import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UnitToggle from './UnitToggle.jsx'
import Costs from './Costs.jsx'
import FichaTecnica from './FichaTecnica.jsx'
import Inventory from './Inventory.jsx'
import Production from './Production.jsx'
import Recipes from './Recipes.jsx'
import Kanban from './Kanban.jsx'
import Suppliers from './Suppliers.jsx'
import Products from './Products.jsx'
import AI from './AI.jsx'

/**
 * App - Premium Navigation Shell
 * Apple-quality navigation with refined micro-interactions
 */

// Navigation items configuration
const NAV_ITEMS = [
  { key: 'ai', label: 'IA', icon: AIIcon },
  { key: 'kanban', label: 'Kanban', icon: KanbanIcon },
  { key: 'recipes', label: 'Receitas', icon: RecipesIcon },
  { key: 'products', label: 'Produtos', icon: ProductsIcon },
  { key: 'inventory', label: 'Estoque', icon: InventoryIcon },
  { key: 'suppliers', label: 'Fornecedores', icon: SuppliersIcon },
  { key: 'costs', label: 'Financeiro', icon: CostsIcon },
  { key: 'ficha', label: 'Ficha', icon: FichaIcon },
  { key: 'calculator', label: 'Produção', icon: ProductionIcon }
]

// Premium Icon Components
function KanbanIcon({ active }) {
  return (
    <svg className={`w-4 h-4 transition-all ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  )
}

function RecipesIcon({ active }) {
  return (
    <svg className={`w-4 h-4 transition-all ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function InventoryIcon({ active }) {
  return (
    <svg className={`w-4 h-4 transition-all ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function CostsIcon({ active }) {
  return (
    <svg className={`w-4 h-4 transition-all ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function FichaIcon({ active }) {
  return (
    <svg className={`w-4 h-4 transition-all ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function ProductionIcon({ active }) {
  return (
    <svg className={`w-4 h-4 transition-all ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

function SuppliersIcon({ active }) {
  return (
    <svg className={`w-4 h-4 transition-all ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function ProductsIcon({ active }) {
  return (
    <svg className={`w-4 h-4 transition-all ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  )
}

function AIIcon({ active }) {
  return (
    <svg className={`w-4 h-4 transition-all ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

// Spring animation configuration
const spring = {
  type: "spring",
  stiffness: 500,
  damping: 35,
  mass: 0.8
}

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 8, scale: 0.99 },
  enter: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.99 }
}

export default function App() {
  const [inputMode, setInputMode] = useState('pct')
  const [view, setView] = useState(() => {
    const saved = localStorage.getItem('padoca_view')
    return saved || 'recipes'
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Smooth initial load
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleViewChange = (newView) => {
    if (newView === view) {
      setMobileMenuOpen(false)
      return
    }
    setView(newView)
    setMobileMenuOpen(false)
    localStorage.setItem('padoca_view', newView)
  }

  // Get current view label
  const currentLabel = NAV_ITEMS.find(item => item.key === view)?.label || 'Menu'

  return (
    <div className={`min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 text-zinc-900 dark:from-black dark:via-zinc-950 dark:to-black dark:text-zinc-100 transition-colors duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
        {/* Primary gradient orb */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-indigo-500/[0.03] via-purple-500/[0.02] to-transparent blur-[100px] rounded-full" />
        {/* Secondary gradient orb */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-violet-500/[0.03] via-rose-500/[0.02] to-transparent blur-[100px] rounded-full" />
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjAzIiBkPSJNMCAwaDMwMHYzMDBIMHoiLz48L3N2Zz4=')] opacity-50 dark:opacity-30" />
      </div>

      {/* Main Container */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pb-8">

        {/* Premium Header */}
        <header className="sticky top-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-2 mb-2 md:relative md:pt-8 md:pb-4 md:mb-6">

          {/* Glass Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-2xl md:bg-transparent md:backdrop-blur-none border-b border-zinc-200/50 dark:border-white/5 md:border-none"
          />

          <div className="relative flex flex-col gap-0 md:gap-5">

            {/* Title Row */}
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, ...spring }}
              >
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Padoca Pizza
                </h1>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1 tracking-wide uppercase hidden md:block">
                  Sistema de Produção & Gestão
                </p>
              </motion.div>

              {/* Mobile: Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative w-11 h-11 flex items-center justify-center -mr-2 md:hidden"
                aria-label="Menu"
              >
                <div className="relative w-[18px] h-[10px]">
                  <motion.span
                    animate={mobileMenuOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute top-0 left-0 right-0 h-[1.5px] bg-zinc-800 dark:bg-zinc-200 origin-center"
                  />
                  <motion.span
                    animate={mobileMenuOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-zinc-800 dark:bg-zinc-200 origin-center"
                  />
                </div>
              </button>

              {/* Unit Toggle - Desktop */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, ...spring }}
                className="hidden md:flex items-center gap-3"
              >
                <AnimatePresence mode="wait">
                  {view === 'calculator' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={spring}
                    >
                      <UnitToggle value={inputMode} onChange={setInputMode} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Full-Screen Mobile Menu Overlay */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="fixed inset-0 z-[9999] bg-white/95 dark:bg-black/95 backdrop-blur-xl md:hidden"
                  style={{ top: 0 }}
                >
                  {/* Close Button */}
                  <div className="absolute top-4 right-4 z-10">
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>

                  {/* Menu Items */}
                  <div className="flex flex-col justify-center h-full px-6 pb-20">
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6"
                    >
                      Navegação
                    </motion.p>

                    <div className="space-y-1">
                      {NAV_ITEMS.map(({ key, label, icon: Icon }, index) => {
                        const isActive = view === key
                        return (
                          <motion.button
                            key={key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{
                              delay: index * 0.04,
                              duration: 0.25,
                              ease: [0.25, 0.46, 0.45, 0.94]
                            }}
                            onClick={() => handleViewChange(key)}
                            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${isActive
                              ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white'
                              : 'text-zinc-600 dark:text-zinc-400 active:bg-zinc-100 dark:active:bg-white/5'
                              }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive
                                ? 'bg-indigo-500 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                              }`}>
                              <Icon active={isActive} />
                            </div>
                            <span className="text-[17px] font-semibold tracking-tight">
                              {label}
                            </span>
                            {isActive && (
                              <motion.div
                                layoutId="mobile-active-check"
                                className="ml-auto"
                              >
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
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="absolute bottom-6 left-0 right-0 text-center"
                  >
                    <p className="text-[10px] text-zinc-300 dark:text-zinc-700 uppercase tracking-widest font-medium">
                      Padoca Pizza • 2024
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop Navigation */}
            <nav className="relative hidden md:block">
              <motion.nav
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, ...spring }}
                className="inline-flex items-center p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-2xl border border-zinc-200/50 dark:border-white/10 shadow-lg"
              >
                {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
                  const isActive = view === key
                  return (
                    <button
                      key={key}
                      onClick={() => handleViewChange(key)}
                      className={`relative px-4 py-2.5 rounded-xl transition-colors duration-200 ${isActive
                        ? 'text-indigo-600 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-active-desktop"
                          className="absolute inset-0 bg-indigo-50 dark:bg-white/10 rounded-xl"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon active={isActive} />
                        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
                      </span>
                    </button>
                  )
                })}
              </motion.nav>

              {/* Unit Toggle - Mobile */}
              <AnimatePresence mode="wait">
                {view === 'calculator' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                    transition={spring}
                    className="md:hidden flex-shrink-0 mt-3"
                  >
                    <UnitToggle value={inputMode} onChange={setInputMode} />
                  </motion.div>
                )}
              </AnimatePresence>
            </nav>
          </div>
        </header>

        {/* Content Area with Page Transitions */}
        <AnimatePresence mode="wait">
          <motion.main
            key={view}
            initial="initial"
            animate="enter"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10"
          >
            {view === 'ai' ? (
              <AI />
            ) : view === 'kanban' ? (
              <Kanban />
            ) : view === 'recipes' ? (
              <Recipes />
            ) : view === 'products' ? (
              <Products />
            ) : view === 'inventory' ? (
              <Inventory />
            ) : view === 'suppliers' ? (
              <Suppliers />
            ) : view === 'costs' ? (
              <Costs />
            ) : view === 'ficha' ? (
              <FichaTecnica />
            ) : (
              <Production inputMode={inputMode} setInputMode={setInputMode} />
            )}
          </motion.main>
        </AnimatePresence>
      </div >
    </div >
  )
}