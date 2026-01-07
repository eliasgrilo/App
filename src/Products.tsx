// ═══════════════════════════════════════════════════════════════════
// PRODUCTS — Stock Movements Dashboard
// Refactored: 471 → <200 lines
// ═══════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { useCurrency } from './stores/useCurrencyStore'
import { useIngredients } from './stores/useAppStore'
import {
    useProductsState,
    useProductsHandlers,
    ProductsFilters,
    MovementList,
    MovementModal
} from './productsModules'
import { AIHealthCard, AIStatsCards, type AIStats } from './aiModules'

// Helper functions for stock calculations
const getTotalQuantity = (item: { packageQuantity?: number; packageCount?: number }): number => {
    return (Number(item.packageQuantity) || 0) * (Number(item.packageCount) || 1)
}

const getStockStatus = (item: { packageQuantity?: number; packageCount?: number; minStock?: number }): 'critical' | 'warning' | 'ok' => {
    const total = getTotalQuantity(item)
    const min = Number(item.minStock) || 0
    if (min === 0) return 'ok'
    if (total < min) return 'critical'
    if (total <= min * 1.2) return 'warning'
    return 'ok'
}

export default function Products() {
    const { formatCurrency } = useCurrency()
    const state = useProductsState()
    const inventory = useIngredients()

    const handlers = useProductsHandlers({
        items: state.items,
        form: state.form,
        setForm: state.setForm,
        setOpen: state.setOpen,
        setItemSearch: state.setItemSearch,
        addMovement: state.addMovement,
        deleteMovement: state.deleteMovement,
        updateIngredient: state.updateIngredient
    })

    // Stats for dashboard
    const stats: AIStats = useMemo(() => {
        const total = inventory.length
        const critical = inventory.filter(i => getStockStatus(i) === 'critical').length
        const warning = inventory.filter(i => getStockStatus(i) === 'warning').length
        const suppliersWithAlerts = 0 // Not needed for this view
        const healthScore = total > 0 ? Math.max(0, Math.round(100 - (critical * 20) - (warning * 5))) : 100
        return { total, critical, warning, suppliersWithAlerts, healthScore }
    }, [inventory])

    const scoreColor: 'emerald' | 'amber' | 'rose' = stats.healthScore >= 80 ? 'emerald' : stats.healthScore >= 60 ? 'amber' : 'rose'

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Header - Standard layout like other pages */}
            <div className="relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Compras</h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Histórico e controle de estoque</p>
                </div>
                <button onClick={() => state.setOpen(true)} className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                    <svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Nova Movimentação
                </button>
            </div>

            {/* Dashboard */}
            <section className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                <AIHealthCard stats={stats} scoreColor={scoreColor} />
                <AIStatsCards stats={stats} />
            </section>

            {/* List with Filters */}
            <div className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden">
                <ProductsFilters
                    search={state.search}
                    setSearch={state.setSearch}
                    period={state.period}
                    setPeriod={state.setPeriod}
                    typeFilter={state.typeFilter}
                    setTypeFilter={state.setTypeFilter}
                />

                <MovementList
                    grouped={state.grouped}
                    formatCurrency={formatCurrency}
                    onRemove={handlers.remove}
                />
            </div>

            {/* Modal */}
            <MovementModal
                open={state.open}
                form={state.form}
                itemSearch={state.itemSearch}
                filteredItems={state.filteredItems}
                selectedItem={state.selectedItem}
                showItemResults={state.showItemResults}
                getStock={state.getStock}
                setForm={state.setForm}
                setItemSearch={state.setItemSearch}
                setShowItemResults={state.setShowItemResults}
                setOpen={state.setOpen}
                onSave={handlers.save}
                onSelectItem={handlers.selectItem}
                onClearItem={handlers.clearItem}
                onChangeType={handlers.changeType}
            />
        </div>
    )
}
