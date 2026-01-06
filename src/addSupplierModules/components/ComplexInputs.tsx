// ═══════════════════════════════════════════════════════════════════
// SUPPLIER FORM — Complex Components
// LinkedItemsSearch, FileUploadZone
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icons } from '../Icons'
import { formatFileSize } from '../formatters'

interface LinkedItem { itemId: string | number; itemName?: string }

export interface LinkedItemsSearchProps {
    inventoryItems: any[]
    linkedItems: any[]
    onLink: (item: any) => void
    onUnlink: (itemId: any) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
}

export function LinkedItemsSearch({ inventoryItems, linkedItems, onLink, onUnlink, searchQuery, setSearchQuery }: LinkedItemsSearchProps) {
    const [isOpen, setIsOpen] = useState(false)
    const filtered = inventoryItems.filter((item: any) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !linkedItems.find((li: LinkedItem) => li.itemId === item.id)
    ).slice(0, 5)

    return (
        <div className="space-y-3">
            <div className="relative">
                <input type="text" value={searchQuery}
                    onChange={(e: any) => { setSearchQuery(e.target.value); setIsOpen(true) }}
                    onFocus={() => setIsOpen(true)} placeholder="Buscar item do estoque..."
                    className="w-full h-[44px] px-4 pr-10 text-[16px] bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder:text-[#aeaeb2] outline-none" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c7c7cc]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                </div>
                <AnimatePresence>
                    {isOpen && filtered.length > 0 && (
                        <>
                            <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#2c2c2e] rounded-[14px] shadow-2xl overflow-hidden z-50 border border-black/[0.04] dark:border-white/[0.06]"
                                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                                {filtered.map((item, i) => (
                                    <motion.button key={item.id} onClick={() => { onLink(item); setSearchQuery(''); setIsOpen(false) }}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                        whileHover={{ backgroundColor: 'rgba(52,199,89,0.08)' }} whileTap={{ scale: 0.98 }}
                                        className={`w-full h-[48px] px-4 text-left flex items-center justify-between text-[15px] text-[#1d1d1f] dark:text-white ${i < filtered.length - 1 ? 'border-b border-[#f5f5f7] dark:border-[#3a3a3c]' : ''}`}>
                                        <span className="font-medium">{item.name}</span>
                                        <div className="w-6 h-6 rounded-full bg-[#34c759]/15 flex items-center justify-center text-[#34c759]">{Icons.plus}</div>
                                    </motion.button>
                                ))}
                            </motion.div>
                            <button type="button" aria-label="Fechar lista" className="fixed inset-0 z-40 bg-transparent border-none cursor-default" onClick={() => setIsOpen(false)} />
                        </>
                    )}
                </AnimatePresence>
            </div>
            {linkedItems.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {linkedItems.map((item, i) => (
                        <motion.div key={item.itemId} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-2 px-3 py-2 bg-[#34c759]/10 rounded-xl border border-[#34c759]/20">
                            <span className="text-[14px] font-medium text-[#34c759]">{item.itemName}</span>
                            <button onClick={() => onUnlink(item.itemId)} className="w-5 h-5 rounded-full bg-[#ff3b30]/10 flex items-center justify-center text-[#ff3b30] hover:bg-[#ff3b30]/20 transition-colors">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}

export interface FileUploadZoneProps {
    documents: any[]
    onFileSelect: (files: FileList) => void
    onDelete: (docId: any) => void
    uploadingFile: boolean
    uploadProgress: number
}

export function FileUploadZone({ documents, onFileSelect, onDelete, uploadingFile, uploadProgress }: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }, [])
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }, [])
    const handleDrop = useCallback((e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files?.length) onFileSelect(e.dataTransfer.files) }, [onFileSelect])

    return (
        <div className="space-y-3">
            {documents?.length > 0 && (
                <div className="space-y-2">
                    {documents.map(doc => (
                        <motion.div key={doc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl">
                            {doc.type?.startsWith('image/') ? (
                                <div className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${doc.dataUrl})` }} />
                            ) : (
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${doc.type === 'application/pdf' ? 'bg-red-100 dark:bg-red-500/20' : doc.type?.includes('spreadsheet') || doc.type?.includes('excel') ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-blue-100 dark:bg-blue-500/20'}`}>
                                    {doc.type === 'application/pdf' ? <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="2" width="16" height="20" rx="2" /><text x="12" y="13" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">PDF</text></svg>
                                        : <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-medium text-[#1d1d1f] dark:text-white truncate">{doc.name}</p>
                                <p className="text-[12px] text-[#8e8e93]">{formatFileSize(doc.size)}</p>
                            </div>
                            <button onClick={() => onDelete(doc.id)} aria-label={`Remover arquivo ${doc.name}`}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#c7c7cc] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-colors">{Icons.xmark}</button>
                        </motion.div>
                    ))}
                </div>
            )}
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden"
                onChange={(e: any) => e.target.files?.length && onFileSelect(e.target.files)} />
            <motion.button type="button" onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} disabled={!!uploadingFile}
                className={`w-full py-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${isDragging ? 'border-[#007aff] bg-[#007aff]/5' : 'border-[#c7c7cc] dark:border-[#48484a] hover:border-[#007aff] hover:bg-[#007aff]/5'}`} whileTap={{ scale: 0.99 }}>
                {uploadingFile ? (
                    <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-2 border-[#007aff] border-t-transparent rounded-full" />
                        <span className="text-[14px] font-medium text-[#007aff]">{uploadingFile}</span>
                        <div className="w-32 h-1 bg-[#e5e5ea] dark:bg-[#3a3a3c] rounded-full overflow-hidden"><motion.div className="h-full bg-[#007aff] rounded-full" style={{ width: `${uploadProgress}%` }} /></div>
                    </>
                ) : (
                    <>
                        <div className="text-[#007aff]">{Icons.upload}</div>
                        <span className="text-[14px] font-medium text-[#007aff]">{isDragging ? 'Solte para anexar' : 'Anexar arquivos'}</span>
                        <span className="text-[12px] text-[#8e8e93]">Arraste ou clique para selecionar</span>
                    </>
                )}
            </motion.button>
        </div>
    )
}
