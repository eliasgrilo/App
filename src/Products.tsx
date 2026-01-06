// ═══════════════════════════════════════════════════════════════════
// PRODUCTS — Stock Movements Dashboard
// Refactored: 471 → <200 lines
// ═══════════════════════════════════════════════════════════════════

import { useCurrency } from './stores/useCurrencyStore'
import {
    useProductsState,
    useProductsHandlers,
    ProductsFilters,
    MovementList,
    MovementModal
} from './productsModules'

export default function Products() {
    const { formatCurrency } = useCurrency()
    const state = useProductsState()

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

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Movimentações</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium mt-1">Histórico e controle de estoque</p>
                </div>
            </div>

            {/* List with Filters */}
            <div className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden">
                <ProductsFilters
                    search={state.search}
                    setSearch={state.setSearch}
                    period={state.period}
                    setPeriod={state.setPeriod}
                    typeFilter={state.typeFilter}
                    setTypeFilter={state.setTypeFilter}
                    onOpenForm={() => state.setOpen(true)}
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
