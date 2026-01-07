// ═══════════════════════════════════════════════════════════════════
// PRODUCTION — Premium Dough Calculator with Tabbed Navigation
// Includes: Produção, Kanban, Ficha Técnica, Receitas
// ═══════════════════════════════════════════════════════════════════

import { useCallback } from 'react'
import { useModal, useToast } from './stores/useUIStore'
import {
    useProductionState,
    useProductionHandlers,
    ProductionContent,
    type ProductionProps,
    type ProductionViewType
} from './productionModules'

// Lazy imports for other views
import Kanban from './Kanban'
import FichaTecnica from './FichaTecnica'
import Recipes from './Recipes'

// Tab configuration with titles and subtitles
const PRODUCTION_TABS: { key: ProductionViewType; label: string; title: string; subtitle: string }[] = [
    { key: 'producao', label: 'Produção', title: 'Produção', subtitle: 'Calculadora de massa premium' },
    { key: 'kanban', label: 'Kanban', title: 'Kanban', subtitle: 'Gestão visual de tarefas e projetos' },
    { key: 'ficha', label: 'Ficha', title: 'Ficha Técnica', subtitle: 'Gestão premium de receitas e custos' },
    { key: 'receitas', label: 'Receitas', title: 'Receitas', subtitle: 'Biblioteca completa de receitas' }
]

export default function Production({ inputMode }: ProductionProps) {
    const { modal } = useModal()
    const { toast } = useToast()
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    const state = useProductionState()
    const handlers = useProductionHandlers({
        inputs: state.inputs,
        setInputs: state.setInputs,
        recipes: state.recipes,
        setRecipes: state.setRecipes,
        setInputModal: state.setInputModal,
        modal: { confirm: modal.confirm },
        showToast
    })

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Segmented Control Tabs */}
            <section className="relative z-10">
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl inline-flex">
                    {PRODUCTION_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => state.setActiveView(tab.key)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${state.activeView === tab.key
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Header - Dynamic based on active tab */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            {PRODUCTION_TABS.find(tab => tab.key === state.activeView)?.title || 'Produção'}
                        </h1>
                        {state.activeView === 'ficha' && (
                            <div className="mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Cloud Active</span>
                            </div>
                        )}
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">
                        {PRODUCTION_TABS.find(tab => tab.key === state.activeView)?.subtitle || 'Calculadora de massa premium'}
                    </p>
                </div>
            </div>

            {/* Tab Content */}
            {state.activeView === 'producao' && (
                <ProductionContent inputMode={inputMode} state={state} handlers={handlers} />
            )}
            {state.activeView === 'kanban' && <Kanban />}
            {state.activeView === 'ficha' && <FichaTecnica />}
            {state.activeView === 'receitas' && <Recipes />}
        </div>
    )
}
