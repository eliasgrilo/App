// ═══════════════════════════════════════════════════════════════════
// QuotesView — Quotes/Quotations view tab
// Refactored: 157 → ~35 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import type { SupplierDocument } from '../types'
import { QuotesViewProps, EmptyQuotes, SupplierQuoteCard } from './quotesViewModules'

export function QuotesView({ suppliers, quotesFileInputRef, quotesUploadingFor, setQuotesUploadingFor, updateSupplier, setViewingDocument, downloadDocument, showToast, setActiveView }: QuotesViewProps) {
    const suppliersWithQuotes = suppliers.filter(s => (s.documents || []).some(d => d.category === 'cotacao'))

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length && quotesUploadingFor) {
            const file = e.target.files[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { showToast('Arquivo muito grande (máx 5MB)', 'error'); return }
            const reader = new FileReader()
            reader.onload = (ev) => { const newDoc: SupplierDocument = { id: `doc_${Date.now()}`, name: file.name, type: file.type, size: file.size, dataUrl: (ev.target?.result as string) || '', uploadedAt: new Date().toISOString(), category: 'cotacao' }; const existingSupplier = suppliers.find(s => s.id === quotesUploadingFor); if (existingSupplier) { updateSupplier(quotesUploadingFor, { documents: [...(existingSupplier.documents || []), newDoc] }) }; showToast('Cotação adicionada'); setQuotesUploadingFor(null) }
            reader.readAsDataURL(file)
        }
        e.target.value = ''
    }

    return (
        <section className="relative z-10">
            <input ref={quotesFileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileChange} />
            {suppliersWithQuotes.length === 0 ? <EmptyQuotes setActiveView={setActiveView} /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">{suppliersWithQuotes.map(supplier => (
                    <SupplierQuoteCard key={supplier.id} supplier={supplier} quotesFileInputRef={quotesFileInputRef} setQuotesUploadingFor={setQuotesUploadingFor} updateSupplier={updateSupplier} setViewingDocument={setViewingDocument} downloadDocument={downloadDocument} showToast={showToast} />
                ))}</div>
            )}
        </section>
    )
}

export default QuotesView
