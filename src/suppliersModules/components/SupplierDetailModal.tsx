/**
 * ═══════════════════════════════════════════════════════════════════
 * SupplierDetailModal — Detail view modal for supplier
 * Extracted from Suppliers.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import type { LocalSupplier, SupplierDocument } from '../types'
import { formatFileSize, getFileIcon, DOCUMENT_CATEGORIES } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface SupplierDetailModalProps {
    supplier: LocalSupplier | null
    onClose: () => void
    onEdit: (supplier: LocalSupplier) => void
    onDelete: (supplier: LocalSupplier) => void
    handleCall: (phone: string) => void
    handleEmail: (email: string) => void
    handleWhatsApp: (whatsapp: string) => void
    downloadDocument: (doc: SupplierDocument) => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function SupplierDetailModal({ supplier, onClose, onEdit, onDelete, handleCall, handleEmail, handleWhatsApp, downloadDocument }: SupplierDetailModalProps) {
    if (!supplier) return null

    return createPortal(
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto p-4" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
                <ModalScrollLock />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-lg mx-4 my-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                    {/* Header */}
                    <div className="relative px-6 py-8 text-center border-b border-zinc-100/80 dark:border-white/5">
                        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-violet-500/30 mx-auto mb-4">
                            {supplier.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{supplier.name}</h2>
                        {supplier.company && <p className="text-zinc-500 dark:text-zinc-400">{supplier.company}</p>}
                    </div>

                    {/* Quick Actions */}
                    <div className="px-6 py-4 border-b border-zinc-100/80 dark:border-white/5">
                        <div className="flex gap-3">
                            {supplier.phone && (
                                <button onClick={() => handleCall(supplier.phone!)} className="flex-1 py-4 px-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 touch-manipulation">
                                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Ligar</span>
                                </button>
                            )}
                            {supplier.email && (
                                <button onClick={() => handleEmail(supplier.email!)} className="flex-1 py-4 px-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 touch-manipulation">
                                    <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Email</span>
                                </button>
                            )}
                            {supplier.whatsapp && (
                                <button onClick={() => handleWhatsApp(supplier.whatsapp!)} className="flex-1 py-4 px-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95 touch-manipulation">
                                    <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">WhatsApp</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                        {supplier.address && (
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Endereço</h4>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300">{supplier.address}</p>
                            </div>
                        )}
                        {(supplier.linkedItems?.length ?? 0) > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Itens Fornecidos</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(supplier.linkedItems ?? []).map(item => (
                                        <span key={item.itemId} className="px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-bold">{item.itemName}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(supplier.documents?.length ?? 0) > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Documentos</h4>
                                <div className="space-y-2">
                                    {(supplier.documents ?? []).map(doc => {
                                        const category = DOCUMENT_CATEGORIES.find(c => c.id === doc.category)
                                        return (
                                            <div key={doc.id} onClick={() => downloadDocument(doc)} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100/80 dark:border-zinc-700 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all touch-manipulation active:scale-[0.98]">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center text-xl shrink-0">{getFileIcon(doc.type)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-sm font-medium text-zinc-900 dark:text-white truncate mb-0.5">{doc.name}</h5>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-zinc-400">{formatFileSize(doc.size)}</span>
                                                        {category && <span className="text-[10px] font-bold text-violet-500">{category.icon} {category.label}</span>}
                                                    </div>
                                                </div>
                                                <svg className="w-5 h-5 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                        {supplier.notes && (
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Observações</h4>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300">{supplier.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-5 border-t border-zinc-100/80 dark:border-white/5 flex gap-3">
                        <button onClick={() => onEdit(supplier)} className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.98] transition-all touch-manipulation">Editar</button>
                        <button onClick={() => onDelete(supplier)} className="py-4 px-6 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-[0.98] touch-manipulation">Excluir</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

export default SupplierDetailModal
