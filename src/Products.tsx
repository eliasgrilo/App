// ═══════════════════════════════════════════════════════════════════
// PRODUCTS — Stock Movements Dashboard
// Refactored: 471 → <200 lines
// ═══════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react'
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

    // Tab state - matches Suppliers pattern
    const [activeTab, setActiveTab] = useState<'movements' | 'fiscal'>('movements')

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
                <div className="flex items-center gap-3">
                    {/* Invoice Scanner Button */}
                    <button
                        onClick={() => alert('📸 Scan Nota - Funcionalidade em desenvolvimento!')}
                        className="flex w-auto px-4 md:px-6 py-3 md:py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all items-center justify-center gap-2 group"
                    >
                        <svg className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="hidden md:inline">Scan Nota</span>
                        <span className="md:hidden">Scan</span>
                    </button>

                    {/* Add Movement Button */}
                    <button onClick={() => state.setOpen(true)} className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                        <svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Nova Movimentação
                    </button>
                </div>
            </div>

            {/* Segmented Control - Exact pattern from Suppliers */}
            <section className="relative z-10">
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl inline-flex">
                    <button
                        onClick={() => setActiveTab('movements')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${activeTab === 'movements'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                    >
                        Movimentações
                    </button>
                    <button
                        onClick={() => setActiveTab('fiscal')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${activeTab === 'fiscal'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                    >
                        Documentos Fiscais
                    </button>
                </div>
            </section>

            {/* Dashboard */}
            <section className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                <AIHealthCard stats={stats} scoreColor={scoreColor} />
                <AIStatsCards stats={stats} />
            </section>

            {/* List with Filters - Only in Movimentações tab */}
            {activeTab === 'movements' && (
                <div className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden">
                    <ProductsFilters
                        search={state.search}
                        setSearch={state.setSearch}
                        period={state.period}
                        setPeriod={state.setPeriod}
                        typeFilter={state.typeFilter}
                        setTypeFilter={state.setTypeFilter}
                        customStartDate={state.customStartDate}
                        customEndDate={state.customEndDate}
                        onCustomDateChange={(start, end) => {
                            state.setCustomStartDate(start)
                            state.setCustomEndDate(end)
                        }}
                    />

                    <MovementList
                        grouped={state.grouped}
                        formatCurrency={formatCurrency}
                        onRemove={handlers.remove}
                    />
                </div>
            )}

            {/* Documentos Fiscais tab - Placeholder */}
            {activeTab === 'fiscal' && (
                <div className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden p-16 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Documentos Fiscais</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Gestão de notas fiscais e documentos de compra.</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-semibold">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Em breve
                        </div>
                    </div>
                </div>
            )}

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
