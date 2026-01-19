// ═══════════════════════════════════════════════════════════════════
// APP — Premium Navigation Shell
// Migrated to Zustand Stores (no Context Providers)
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SettingsPanel from './components/SettingsPanel'
import CommandPalette, { useCommandPalette } from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import { GlobalUIComponents, initTheme } from './stores'
import {
  AppHeader,
  AmbientBackground,
  PageLoader,
  MobileSettingsFAB,
  pageVariants,
  type UnitMode
} from './appModules'

// Lazy loaded pages (code splitting)
const Costs = lazy(() => import('./Costs'))
const FichaTecnica = lazy(() => import('./FichaTecnica'))
const Inventory = lazy(() => import('./Inventory'))
const Production = lazy(() => import('./Production'))
const Recipes = lazy(() => import('./Recipes'))
const Suppliers = lazy(() => import('./Suppliers'))
const Products = lazy(() => import('./Products'))
const AI = lazy(() => import('./AI'))
const ReportsPage = lazy(() => import('./reportsModules/ReportsPage'))
const SalesPage = lazy(() => import('./salesModules').then(m => ({ default: m.SalesPage })))
const SearchTest = lazy(() => import('./SearchTest'))
const GmailOAuthCallback = lazy(() => import('./components/GmailOAuthCallback').then(m => ({ default: m.GmailOAuthCallback })))
export default function App() {
  const [inputMode, setInputMode] = useState<UnitMode>('pct')
  const [view, setView] = useState<string>('ai')
  const [isLoaded, setIsLoaded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const commandPalette = useCommandPalette()

  useEffect(() => {
    setIsLoaded(true)
    // Initialize theme and set up system preference listener
    const cleanupTheme = initTheme()
    return cleanupTheme
  }, [])

  // Handle Gmail OAuth callback
  if (window.location.pathname === '/auth/gmail/callback') {
    return <Suspense fallback={<PageLoader />}><GmailOAuthCallback /></Suspense>
  }

  const handleViewChange = (newView: string): void => {
    if (newView !== view) setView(newView)
    setMobileMenuOpen(false)
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 text-zinc-900 dark:from-black dark:via-zinc-950 dark:to-black dark:text-zinc-100 transition-colors duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <AmbientBackground />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pb-8">
        <AppHeader
          currentView={view}
          inputMode={inputMode}
          mobileMenuOpen={mobileMenuOpen}
          onViewChange={handleViewChange}
          onInputModeChange={setInputMode}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onSettingsOpen={() => setSettingsOpen(true)}
        />

        {/* Page Content */}
        {/* CRITICAL: Do NOT use layout prop on motion.main! */}
        {/* Layout animations apply transforms that create stacking contexts, */}
        {/* which breaks position: sticky for all child elements. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main key={view} initial="initial" animate="enter" exit="exit"
            variants={pageVariants} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10">
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                {view === 'ai' ? <AI />
                  : view === 'sales' ? <SalesPage />
                    : view === 'recipes' ? <Recipes />
                      : view === 'products' ? <Products />
                        : view === 'inventory' ? <Inventory />
                          : view === 'reports' ? <ReportsPage />
                            : view === 'suppliers' ? <Suppliers />
                              : view === 'costs' ? <Costs />
                                : view === 'ficha' ? <FichaTecnica />
                                  : view === 'test' ? <SearchTest />
                                    : <Production inputMode={inputMode === "pct" ? "percent" : "grams"} setInputMode={(m) => setInputMode(m === "percent" ? "pct" : "grams")} />}
              </Suspense>
            </ErrorBoundary>
          </motion.main>
        </AnimatePresence>
      </div>

      <MobileSettingsFAB onOpen={() => setSettingsOpen(true)} />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        onNavigate={(newView: string) => { setView(newView); commandPalette.close() }}
        onAction={(action: string, data: unknown) => console.log('Action:', action, data)}
        data={{}}
      />

      {/* Global UI Components (Modal + Toast) */}
      <GlobalUIComponents />
    </div>
  )
}