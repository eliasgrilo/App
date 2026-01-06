// ═══════════════════════════════════════════════════════════════════
// COSTS — Financial Management Dashboard
// Refactored: 549 → <200 lines
// ═══════════════════════════════════════════════════════════════════

import { useRef } from 'react'
import AddExpenseModal from './components/AddExpenseModal'
import {
    useCostsState,
    useCostsHandlers,
    CostsHeader,
    CostsDashboardCards,
    CostsLedgerSection,
    CostsToolsSection
} from './costsModules'

export default function Costs() {
    const fileRef = useRef<HTMLInputElement>(null)

    // State management hook
    const state = useCostsState()

    // Handlers hook
    const handlers = useCostsHandlers({
        costs: state.costs,
        categories: state.categories,
        setCategories: state.setCategories,
        formData: state.formData,
        setFormData: state.setFormData,
        editingId: state.editingId,
        setEditingId: state.setEditingId,
        setIsModalOpen: state.setIsModalOpen,
        addExpense: state.addExpense,
        updateExpense: state.updateExpense,
        removeExpense: state.removeExpense,
        showToast: state.showToast,
        taxRate: state.taxRate,
        fileRef: fileRef as React.RefObject<HTMLInputElement>
    })

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <CostsHeader onAddExpense={() => state.setIsModalOpen(true)} />

            {/* Dashboard Cards */}
            <CostsDashboardCards
                totals={state.totals}
                formatCurrency={state.formatCurrency}
                taxDisplay={state.taxDisplay}
                provinceName={state.provinceName}
                dashboardTitle={state.dashboardTitle}
                setDashboardTitle={state.setDashboardTitle}
                isEditingTitle={state.isEditingTitle}
                setIsEditingTitle={state.setIsEditingTitle}
            />

            {/* Ledger */}
            <CostsLedgerSection
                costs={state.costs}
                groupedCosts={state.groupedCosts}
                formatCurrency={state.formatCurrency}
                taxRate={state.taxRate}
                onEdit={handlers.openEdit}
                onDelete={handlers.deleteCost}
            />

            {/* Tools */}
            <CostsToolsSection
                fileRef={fileRef as React.RefObject<HTMLInputElement>}
                onExportCSV={handlers.exportCSV}
                onExportJSON={handlers.exportJSON}
                onImportJSON={handlers.importJSON}
                onClearAll={handlers.clearAllData}
            />

            {/* Modal */}
            <AddExpenseModal
                isOpen={state.isModalOpen}
                onClose={handlers.closeModal}
                onSave={handlers.handleSave}
                formData={state.formData}
                setFormData={state.setFormData}
                categories={state.categories.map(cat => ({ id: cat, label: cat }))}
                editingId={state.editingId}
            />
        </div>
    )
}
