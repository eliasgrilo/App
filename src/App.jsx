import React, { useState } from 'react'
import UnitToggle from './UnitToggle.jsx'
import Costs from './Costs.jsx'
import FichaTecnica from './FichaTecnica.jsx'
import Inventory from './Inventory.jsx'
import Production from './Production.jsx'
import Recipes from './Recipes.jsx'
import Kanban from './Kanban.jsx'

/**
 * App - Main application component
 * Premium navigation shell for all modules
 */
export default function App() {
  const [inputMode, setInputMode] = useState('pct') // 'pct' or 'grams'
  const [view, setView] = useState(() => {
    // Persist view selection in localStorage
    const saved = localStorage.getItem('padoca_view')
    return saved || 'recipes'
  })

  // Save view to localStorage when it changes
  const handleViewChange = (newView) => {
    setView(newView)
    localStorage.setItem('padoca_view', newView)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-100">
      {/* Main Container */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-8">
        {/* Header - Sticky on Desktop */}
        <header className="sticky top-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4 pb-4 mb-6 md:relative md:pt-6">
          {/* Glass Background for Sticky Header */}
          <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none" />

          <div className="relative flex flex-col gap-4">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Padoca Pizza
                </h1>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-0.5 hidden md:block">
                  Sistema de produção e gestão
                </p>
              </div>

              {/* Unit Toggle - Desktop only in header */}
              <div className="hidden md:flex items-center gap-3">
                {view === 'calculator' && (
                  <UnitToggle value={inputMode} onChange={setInputMode} />
                )}
              </div>
            </div>

            {/* Navigation Pills */}
            <nav className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1 p-1 bg-zinc-100/90 dark:bg-zinc-800/90 rounded-2xl overflow-x-auto scrollbar-hidden">
                {[
                  { key: 'kanban', label: 'Kanban' },
                  { key: 'recipes', label: 'Receitas' },
                  { key: 'inventory', label: 'Estoque' },
                  { key: 'costs', label: 'Financeiro' },
                  { key: 'ficha', label: 'Ficha' },
                  { key: 'calculator', label: 'Produção' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleViewChange(key)}
                    className={`flex-1 md:flex-none px-4 md:px-5 py-2.5 text-[11px] md:text-xs font-semibold rounded-xl transition-all duration-200 whitespace-nowrap min-w-[70px] ${view === key
                      ? 'bg-white dark:bg-zinc-700 shadow-md text-zinc-900 dark:text-white'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Unit Toggle - Mobile only next to nav */}
              <div className="md:hidden flex-shrink-0">
                {view === 'calculator' && (
                  <UnitToggle value={inputMode} onChange={setInputMode} />
                )}
              </div>
            </nav>
          </div>
        </header>

        {/* Content Area */}
        {view === 'kanban' ? (
          <Kanban />
        ) : view === 'recipes' ? (
          <Recipes />
        ) : view === 'inventory' ? (
          <Inventory />
        ) : view === 'costs' ? (
          <Costs />
        ) : view === 'ficha' ? (
          <FichaTecnica />
        ) : (
          <Production inputMode={inputMode} setInputMode={setInputMode} />
        )}
      </div>
    </div>
  )
}