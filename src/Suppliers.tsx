/**
 * ═══════════════════════════════════════════════════════════════════
 * Suppliers — Apple-Quality Supplier Management
 * Refactored: ~140 lines (lean orchestrator)
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import AddSupplierModal from './components/AddSupplierModal'
import { useSuppliersState, useSuppliersHandlers, SuppliersGrid, QuotesView, SupplierDetailModal } from './suppliersModules'

export default function Suppliers() {
    const state = useSuppliersState()
    const handlers = useSuppliersHandlers({ suppliers: state.suppliers, addSupplier: state.addSupplier, updateSupplier: state.updateSupplier, removeSupplier: state.removeSupplier, formData: state.formData, setFormData: state.setFormData, editingSupplier: state.editingSupplier, setEditingSupplier: state.setEditingSupplier, setSelectedSupplier: state.setSelectedSupplier, setIsModalOpen: state.setIsModalOpen, setItemSearchQuery: state.setItemSearchQuery, selectedDocCategory: state.selectedDocCategory, setUploadingFile: state.setUploadingFile, setUploadingFileType: state.setUploadingFileType, setUploadProgress: state.setUploadProgress, modal: state.modal, showToast: state.showToast })

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-violet-500/20">
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40"><div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[120px] rounded-full"></div><div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div></div>
            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div><div className="flex items-center gap-3 mb-1"><h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Parceiros</h1></div><p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Gestão de fornecedores e clientes</p></div>
                <button onClick={handlers.openAddModal} className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"><svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>Adicionar Fornecedor</button>
            </div>
            {/* Segmented Control */}
            <section className="relative z-10"><div className="bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl inline-flex"><button onClick={() => state.setActiveView('suppliers')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${state.activeView === 'suppliers' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}>Fornecedores</button><button onClick={() => state.setActiveView('quotes')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${state.activeView === 'quotes' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}>Orçamentos</button><button onClick={() => state.setActiveView('clients')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${state.activeView === 'clients' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}>Clientes</button></div></section>
            {/* Search */}
            {state.activeView === 'suppliers' && <section className="relative z-10"><div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-5 border border-zinc-200/50 dark:border-white/10 shadow-lg"><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div><input type="text" className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-white/5 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all placeholder:text-zinc-400" placeholder="Buscar fornecedor..." value={state.searchQuery} onChange={(e) => state.setSearchQuery(e.target.value)} /></div></div></section>}
            {/* Views & Modals */}
            {state.activeView === 'suppliers' && <section className="relative z-10"><SuppliersGrid suppliers={state.filteredSuppliers} onSupplierClick={state.setSelectedSupplier} onEditClick={handlers.openEditModal} onAddClick={handlers.openAddModal} /></section>}
            {state.activeView === 'quotes' && <QuotesView suppliers={state.suppliers} quotesFileInputRef={state.quotesFileInputRef} quotesUploadingFor={state.quotesUploadingFor} setQuotesUploadingFor={state.setQuotesUploadingFor} updateSupplier={state.updateSupplier} setViewingDocument={state.setViewingDocument} downloadDocument={handlers.downloadDocument} showToast={state.showToast} setActiveView={state.setActiveView} />}
            {state.activeView === 'clients' && (
                <section className="relative z-10">
                    <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-8 border border-zinc-200/50 dark:border-white/10 shadow-lg">
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Gestão de Clientes</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 max-w-md">Em breve você poderá gerenciar sua base de clientes, histórico de pedidos e preferências.</p>
                        </div>
                    </div>
                </section>
            )}
            <AddSupplierModal isOpen={state.isModalOpen} onClose={() => state.setIsModalOpen(false)} onSave={handlers.handleSave} formData={state.formData} setFormData={state.setFormData} inventoryItems={state.inventoryItems} isEditing={!!state.editingSupplier} onFileSelect={handlers.handleFileSelect} uploadingFile={!!state.uploadingFile} uploadProgress={state.uploadProgress} onDeleteDocument={handlers.deleteDocument} />
            <SupplierDetailModal supplier={state.selectedSupplier} onClose={() => state.setSelectedSupplier(null)} onEdit={handlers.openEditModal} onDelete={handlers.handleDelete} handleCall={handlers.handleCall} handleEmail={handlers.handleEmail} handleWhatsApp={handlers.handleWhatsApp} downloadDocument={handlers.downloadDocument} />
        </div>
    )
}
