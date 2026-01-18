/**
 * ═══════════════════════════════════════════════════════════════════
 * Suppliers — Apple-Quality Supplier Management
 * Refactored: ~140 lines (lean orchestrator)
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import AddSupplierModal from './components/AddSupplierModal'
import { useSuppliersState, useSuppliersHandlers, SuppliersGrid, QuotesView } from './suppliersModules'
import { useCurrency } from './stores/useCurrencyStore'

// Purchase status filter options
const PURCHASE_FILTERS = ['Todos', 'Pendência Financeira', 'Inativos']

// Mock purchases data (notas de compra de fornecedores)
const MOCK_PURCHASES = [
    { id: 1, supplierName: 'Moinho Globo', fantasyName: 'Globo Farinhas', cnpj: '12.345.678/0001-90', phone: '+55 11 3333-1111', sellerName: 'Roberto Silva', products: ['Farinha de Trigo Tipo 00', 'Fermento Biológico'], noteNumber: 'NF-001234', value: 2580.00, date: '2025-01-08', status: 'pago' },
    { id: 2, supplierName: 'Importadora Italia', fantasyName: 'Italia Foods', cnpj: '98.765.432/0001-10', phone: '+55 11 4444-2222', sellerName: 'Marco Antonio', products: ['Molho San Marzano', 'Azeite Extra Virgem'], noteNumber: 'NF-001235', value: 4200.00, date: '2025-01-07', status: 'pendente' },
    { id: 3, supplierName: 'Laticínios Premium', fantasyName: 'Premium Lácteos', cnpj: '11.222.333/0001-44', phone: '+55 11 5555-3333', sellerName: 'Ana Paula', products: ['Mussarela', 'Parmesão', 'Gorgonzola'], noteNumber: 'NF-001236', value: 3150.00, date: '2025-01-06', status: 'pago' },
    { id: 4, supplierName: 'Distribuidora Carnes', fantasyName: 'DC Carnes', cnpj: '44.555.666/0001-77', phone: '+55 11 6666-4444', sellerName: 'Carlos Eduardo', products: ['Calabresa', 'Bacon', 'Pepperoni'], noteNumber: 'NF-001237', value: 5800.00, date: '2025-01-05', status: 'pendente' },
    { id: 5, supplierName: 'Hortifruti Central', fantasyName: 'Central Verde', cnpj: '77.888.999/0001-22', phone: '+55 11 7777-5555', sellerName: 'Maria José', products: ['Tomate', 'Manjericão', 'Rúcula', 'Cebola'], noteNumber: 'NF-001238', value: 890.00, date: '2025-01-08', status: 'pago' },
    { id: 6, supplierName: 'Bebidas Express', fantasyName: 'Express Drinks', cnpj: '33.444.555/0001-88', phone: '+55 11 8888-6666', sellerName: 'Pedro Henrique', products: ['Coca-Cola', 'Guaraná', 'Água Mineral'], noteNumber: 'NF-001239', value: 1200.00, date: '2025-01-04', status: 'inativo' },
    { id: 7, supplierName: 'Embalagens Master', fantasyName: 'Master Pack', cnpj: '66.777.888/0001-11', phone: '+55 11 9999-7777', sellerName: 'Fernanda Lima', products: ['Caixas Pizza', 'Guardanapos', 'Sacolas'], noteNumber: 'NF-001240', value: 750.00, date: '2025-01-03', status: 'pago' },
]

export default function Suppliers() {
    const state = useSuppliersState()
    const handlers = useSuppliersHandlers({ suppliers: state.suppliers, addSupplier: state.addSupplier, updateSupplier: state.updateSupplier, removeSupplier: state.removeSupplier, formData: state.formData, setFormData: state.setFormData, editingSupplier: state.editingSupplier, setEditingSupplier: state.setEditingSupplier, setSelectedSupplier: state.setSelectedSupplier, setIsModalOpen: state.setIsModalOpen, setItemSearchQuery: state.setItemSearchQuery, selectedDocCategory: state.selectedDocCategory, setUploadingFile: state.setUploadingFile, setUploadingFileType: state.setUploadingFileType, setUploadProgress: state.setUploadProgress, modal: state.modal, showToast: state.showToast })
    const { formatCurrency } = useCurrency()

    // Purchases state (aba Compras)
    const [purchaseSearchQuery, setPurchaseSearchQuery] = useState('')
    const [purchaseFilter, setPurchaseFilter] = useState<string>('Todos')
    const [purchasePeriod, setPurchasePeriod] = useState<'today' | '7d' | '30d' | 'all'>('all')

    // Filtered purchases with smart search
    const filteredPurchases = useMemo(() => {
        let purchases = MOCK_PURCHASES
        const now = new Date()

        // Period filter
        if (purchasePeriod !== 'all') {
            purchases = purchases.filter(p => {
                const diff = (now.getTime() - new Date(p.date).getTime()) / (1000 * 60 * 60 * 24)
                if (purchasePeriod === 'today') return diff <= 1
                if (purchasePeriod === '7d') return diff <= 7
                if (purchasePeriod === '30d') return diff <= 30
                return true
            })
        }

        // Smart search: nome, fantasia, cnpj, telefone, vendedor, produto, nota, valor, data, status
        if (purchaseSearchQuery.trim()) {
            const query = purchaseSearchQuery.toLowerCase()
            purchases = purchases.filter(p =>
                p.supplierName.toLowerCase().includes(query) ||
                p.fantasyName.toLowerCase().includes(query) ||
                p.cnpj.includes(query) ||
                p.phone.includes(query) ||
                p.sellerName.toLowerCase().includes(query) ||
                p.products.some(prod => prod.toLowerCase().includes(query)) ||
                p.noteNumber.toLowerCase().includes(query) ||
                p.value.toString().includes(query.replace(',', '.')) ||
                new Date(p.date).toLocaleDateString('pt-BR').includes(query) ||
                p.status.toLowerCase().includes(query)
            )
        }

        // Status filter
        if (purchaseFilter === 'Pendência Financeira') {
            purchases = purchases.filter(p => p.status === 'pendente')
        } else if (purchaseFilter === 'Inativos') {
            purchases = purchases.filter(p => p.status === 'inativo')
        }
        // "Todos" shows all

        return purchases
    }, [purchaseSearchQuery, purchaseFilter, purchasePeriod])

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-violet-500/20">
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40"><div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[120px] rounded-full"></div><div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div></div>
            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div><div className="flex items-center gap-3 mb-1"><h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">{state.activeView === 'clients' ? 'Compras' : 'Fornecedores'}</h1></div><p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">{state.activeView === 'clients' ? 'Gestão de compras e notas fiscais' : 'Gestão de fornecedores e parceiros'}</p></div>
                <button onClick={state.activeView === 'clients' ? () => state.showToast('Em breve: Registrar Compra') : handlers.openAddModal} className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"><svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>{state.activeView === 'clients' ? 'Registrar Compra' : 'Adicionar Fornecedor'}</button>
            </div>
            {/* Segmented Control */}
            <section className="relative z-10"><div className="bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl inline-flex"><button onClick={() => state.setActiveView('clients')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${state.activeView === 'clients' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}>Compras</button><button onClick={() => state.setActiveView('suppliers')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${state.activeView === 'suppliers' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}>Fornecedores</button><button onClick={() => state.setActiveView('quotes')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${state.activeView === 'quotes' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}>Orçamentos</button></div></section>

            {/* Purchases Search & Filters */}
            {state.activeView === 'clients' && (
                <section className="relative z-10">
                    <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-5 border border-zinc-200/50 dark:border-white/10 shadow-lg">
                        {/* Search Input */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-white/5 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all placeholder:text-zinc-400"
                                placeholder="Buscar por nome, CNPJ, telefone, vendedor ou produto (ex: farinha)..."
                                value={purchaseSearchQuery}
                                onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                            />
                            {purchaseSearchQuery && (
                                <button
                                    onClick={() => setPurchaseSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Quick Filters */}
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            {PURCHASE_FILTERS.map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setPurchaseFilter(filter)}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${purchaseFilter === filter
                                        ? filter === 'Todos' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {/* Results Indicator */}
                        {purchaseSearchQuery && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100/80 dark:border-zinc-800">
                                <span className="text-xs text-zinc-500">
                                    {filteredPurchases.length} {filteredPurchases.length === 1 ? 'resultado' : 'resultados'}
                                </span>
                                <button
                                    onClick={() => { setPurchaseSearchQuery(''); setPurchaseFilter('Todos'); }}
                                    className="text-xs font-medium text-violet-500 hover:text-violet-600 transition-colors"
                                >
                                    Limpar filtros
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Suppliers Search */}
            {state.activeView === 'suppliers' && <section className="relative z-10"><div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-5 border border-zinc-200/50 dark:border-white/10 shadow-lg"><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div><input type="text" className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-white/5 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all placeholder:text-zinc-400" placeholder="Buscar fornecedor..." value={state.searchQuery} onChange={(e) => state.setSearchQuery(e.target.value)} /></div></div></section>}

            {/* Views & Modals */}
            {state.activeView === 'suppliers' && <section className="relative z-10"><SuppliersGrid suppliers={state.filteredSuppliers} onSupplierClick={state.setSelectedSupplier} onEditClick={handlers.openEditModal} onAddClick={handlers.openAddModal} /></section>}
            {state.activeView === 'quotes' && <QuotesView suppliers={state.suppliers} quotesFileInputRef={state.quotesFileInputRef} quotesUploadingFor={state.quotesUploadingFor} setQuotesUploadingFor={state.setQuotesUploadingFor} updateSupplier={state.updateSupplier} setViewingDocument={state.setViewingDocument} downloadDocument={handlers.downloadDocument} showToast={state.showToast} setActiveView={state.setActiveView} />}
            {/* Purchases Table */}
            {state.activeView === 'clients' && (
                <section className="relative z-10">
                    <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10 shadow-lg overflow-hidden">
                        {/* Period Filters */}
                        <div className="flex items-center mb-4">
                            <div className="inline-flex gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                                {(['today', '7d', '30d', 'all'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPurchasePeriod(p)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${purchasePeriod === p ? 'text-zinc-900 dark:text-white bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                                    >
                                        {p === 'all' ? 'Todos' : p === 'today' ? 'Hoje' : p === '7d' ? '7 dias' : '30 dias'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredPurchases.length > 0 ? (
                            <div className="space-y-6">
                                {(() => {
                                    // Group purchases by date
                                    const grouped = filteredPurchases.reduce((acc, purchase) => {
                                        const dateKey = new Date(purchase.date).toDateString()
                                        if (!acc[dateKey]) acc[dateKey] = []
                                        acc[dateKey].push(purchase)
                                        return acc
                                    }, {} as Record<string, typeof filteredPurchases>)

                                    // Format date label
                                    const formatDateLabel = (dateStr: string) => {
                                        const date = new Date(dateStr)
                                        const today = new Date()
                                        const yesterday = new Date(today)
                                        yesterday.setDate(yesterday.getDate() - 1)

                                        if (date.toDateString() === today.toDateString()) return 'HOJE'
                                        if (date.toDateString() === yesterday.toDateString()) return 'ONTEM'
                                        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).toUpperCase()
                                    }

                                    // Sort dates descending
                                    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

                                    // Refined Apple Design Cards
                                    return sortedDates.map(dateKey => (
                                        <div key={dateKey}>
                                            {/* Date Divider - Refined */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                                <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">{formatDateLabel(dateKey)}</span>
                                                <div className="flex-1 h-px bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent dark:from-zinc-700 dark:via-zinc-800 dark:to-transparent" />
                                            </div>

                                            {/* Purchases - Refined Cards */}
                                            <div className="space-y-2">
                                                {(grouped[dateKey] ?? []).map(purchase => {
                                                    // Find real supplier to get photo
                                                    const supplier = state.suppliers.find(s =>
                                                        s.name.toLowerCase() === purchase.supplierName.toLowerCase() ||
                                                        s.company?.toLowerCase() === purchase.fantasyName.toLowerCase()
                                                    )

                                                    return (
                                                        <div
                                                            key={purchase.id}
                                                            className="
                                                                bg-white dark:bg-zinc-900 
                                                                rounded-2xl 
                                                                border border-zinc-200/60 dark:border-zinc-700/60
                                                                p-4
                                                                transition-all duration-200
                                                                hover:border-zinc-300 dark:hover:border-zinc-600
                                                                hover:shadow-sm
                                                                cursor-pointer
                                                                group
                                                            "
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {/* Delicate Avatar */}
                                                                {supplier?.image ? (
                                                                    <img
                                                                        src={supplier.image}
                                                                        alt={purchase.supplierName}
                                                                        className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-500 font-semibold text-xs flex-shrink-0">
                                                                        {purchase.supplierName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                                                                    </div>
                                                                )}

                                                                {/* Refined Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-baseline gap-2">
                                                                        <p className="text-[15px] font-semibold text-zinc-900 dark:text-white truncate leading-tight">
                                                                            {purchase.supplierName}
                                                                        </p>
                                                                        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                                                                            {purchase.noteNumber}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                                                        {purchase.products.join(', ')}
                                                                    </p>
                                                                </div>

                                                                {/* Elegant Status */}
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`
                                                                        px-2 py-1 rounded-lg text-[11px] font-semibold
                                                                        ${purchase.status === 'pago'
                                                                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                                                            : purchase.status === 'pendente'
                                                                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                                                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                                                        }
                                                                    `}>
                                                                        {purchase.status === 'pago' ? 'Pago' : purchase.status === 'pendente' ? 'Pendente' : 'N/A'}
                                                                    </div>

                                                                    {/* Refined Value */}
                                                                    <span className="text-[17px] font-semibold tabular-nums text-zinc-900 dark:text-white">
                                                                        {formatCurrency(purchase.value)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))
                                })()}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                    <svg className="w-7 h-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Nenhuma compra encontrada</h4>
                                <p className="text-sm text-zinc-400 max-w-xs">Ajuste seus filtros ou registre novas compras.</p>
                            </div>
                        )}
                    </div>
                </section>
            )}
            <AddSupplierModal isOpen={state.isModalOpen} onClose={() => state.setIsModalOpen(false)} onSave={handlers.handleSave} formData={state.formData} setFormData={state.setFormData} inventoryItems={state.inventoryItems} isEditing={!!state.editingSupplier} onFileSelect={handlers.handleFileSelect} uploadingFile={!!state.uploadingFile} uploadProgress={state.uploadProgress} onDeleteDocument={handlers.deleteDocument} />

            {/* Document Preview Modal */}
            {state.viewingDocument && createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => state.setViewingDocument(null)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <div
                        className="relative w-full max-w-4xl h-[85vh] mx-4 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-white">{state.viewingDocument.doc.name}</h3>
                                    <p className="text-xs text-zinc-500">{(state.viewingDocument.doc.size / 1024).toFixed(1)} KB • {new Date(state.viewingDocument.doc.uploadedAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Download Button */}
                                <button
                                    onClick={() => handlers.downloadDocument(state.viewingDocument!.doc)}
                                    className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    title="Baixar arquivo"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                                {/* Close Button */}
                                <button
                                    onClick={() => state.setViewingDocument(null)}
                                    className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors"
                                    title="Fechar"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content Preview */}
                        <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 p-4">
                            {state.viewingDocument.doc.type.startsWith('image/') ? (
                                <img
                                    src={state.viewingDocument.doc.dataUrl}
                                    alt={state.viewingDocument.doc.name}
                                    className="max-w-full max-h-full mx-auto rounded-lg shadow-lg object-contain"
                                />
                            ) : state.viewingDocument.doc.type === 'application/pdf' ? (
                                <iframe
                                    src={state.viewingDocument.doc.dataUrl}
                                    className="w-full h-full rounded-lg"
                                    title={state.viewingDocument.doc.name}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-20 h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                        <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                    </div>
                                    <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Preview não disponível</h4>
                                    <p className="text-sm text-zinc-500 mb-4">Este tipo de arquivo não pode ser visualizado diretamente.</p>
                                    <button
                                        onClick={() => handlers.downloadDocument(state.viewingDocument!.doc)}
                                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
                                    >
                                        Baixar arquivo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </div>
    )
}
