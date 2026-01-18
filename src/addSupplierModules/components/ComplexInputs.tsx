// ═══════════════════════════════════════════════════════════════════
// SUPPLIER FORM — Complex Components
// LinkedItemsSearch, FileUploadZone
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Icons } from '../Icons'
import { formatFileSize } from '../formatters'

interface LinkedItem { itemId: string | number; itemName?: string; lastPurchasePrice?: number }

interface StockMovement {
    id: string
    itemId: number
    type: string
    quantity: number
    costAtTime?: number
    timestamp: string
}

// Minimal interface for inventory items - intentionally loose to accept Ingredient
interface InventoryItem {
    id: string | number
    name: string
    supplierId?: number
}

export interface LinkedItemsSearchProps {
    inventoryItems: InventoryItem[]
    linkedItems: LinkedItem[]
    onLink: (item: InventoryItem) => void
    onUnlink: (itemId: string | number) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    stockMovements?: StockMovement[]
    supplierId?: number | string
    inventoryItemsFull?: InventoryItem[]
}

// ═══════════════════════════════════════════════════════════════════
// LINKED ITEMS SEARCH — with portal dropdown and match animation
// ═══════════════════════════════════════════════════════════════════

export function LinkedItemsSearch({ inventoryItems, linkedItems, onLink, onUnlink, searchQuery, setSearchQuery, stockMovements = [], supplierId, inventoryItemsFull = [] }: LinkedItemsSearchProps) {
    // Calculate last purchase price for a specific item from the same supplier
    const getLastPurchasePrice = useCallback((itemId: string | number): number | undefined => {
        if (!supplierId || !stockMovements.length) return undefined

        // Find the inventory item to check its supplierId
        const invItem = inventoryItemsFull.find((i) => i.id === itemId)
        if (!invItem || invItem.supplierId !== Number(supplierId)) return undefined

        // Find the most recent 'entrada' movement for this item
        const entryMovements = stockMovements
            .filter(m => m.itemId === Number(itemId) && m.type === 'entrada' && m.costAtTime && m.quantity > 0)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        if (entryMovements.length === 0) return undefined

        // Return price per unit
        const lastEntry = entryMovements[0]
        if (!lastEntry || !lastEntry.costAtTime) return undefined
        return lastEntry.costAtTime / lastEntry.quantity
    }, [stockMovements, supplierId, inventoryItemsFull])

    const [isOpen, setIsOpen] = useState(false)
    const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

    // Minimum characters before showing results
    const minChars = 3
    const hasMinChars = searchQuery.trim().length >= minChars

    // Filter items - exclude already linked, only show if user typed enough
    const filtered = hasMinChars
        ? inventoryItems.filter((item: InventoryItem) => {
            const normalizedQuery = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
            const normalizedName = (item.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

            // Split into words
            const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0)
            const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 0)

            // Query words must be <= name words (allows partial matching)
            if (queryWords.length > nameWords.length) return false

            // Each query word must START the corresponding name word in sequence
            const hasMatch = queryWords.every((qWord, idx) => nameWords[idx]?.startsWith(qWord) ?? false)
            return hasMatch && !linkedItems.find((li: LinkedItem) => li.itemId === item.id)
        }).slice(0, 6)
        : []

    // Check for exact match (same word count and content) - only if typed enough
    const exactMatch = hasMinChars
        ? inventoryItems.find((item: InventoryItem) => {
            const queryWords = searchQuery.toLowerCase().trim().split(/\s+/)
            const itemWords = item.name?.toLowerCase().trim().split(/\s+/) || []
            return queryWords.length === itemWords.length &&
                queryWords.every((word, i) => itemWords[i] === word) &&
                !linkedItems.find((li: LinkedItem) => li.itemId === item.id)
        })
        : null

    // Update dropdown position when input is focused
    const updatePosition = useCallback(() => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect()
            setDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width
            })
        }
    }, [])

    useEffect(() => {
        if (!isOpen) return

        updatePosition()
        window.addEventListener('scroll', updatePosition, true)
        window.addEventListener('resize', updatePosition)
        return () => {
            window.removeEventListener('scroll', updatePosition, true)
            window.removeEventListener('resize', updatePosition)
        }
    }, [isOpen, updatePosition])

    // Handle exact match with animation
    const handleExactMatch = useCallback(() => {
        if (exactMatch) {
            setMatchedItem(exactMatch)
            onLink(exactMatch)
            setSearchQuery('')
            setIsOpen(false)
            // Clear match animation after delay
            setTimeout(() => setMatchedItem(null), 1500)
        }
    }, [exactMatch, onLink, setSearchQuery])

    // Handle Enter key for exact match
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && exactMatch) {
            e.preventDefault()
            handleExactMatch()
        }
        if (e.key === 'Escape') {
            setIsOpen(false)
        }
    }

    return (
        <div className="space-y-3">
            {/* Match Success Animation */}
            <AnimatePresence>
                {matchedItem && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="flex items-center gap-3 p-3 bg-green-500/15 dark:bg-green-500/20 rounded-xl border border-green-500/30"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
                            className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"
                        >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>
                        <span className="text-[14px] font-semibold text-green-700 dark:text-green-300">
                            {matchedItem.name} vinculado com sucesso!
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Input */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setIsOpen(true); updatePosition() }}
                    onFocus={() => { setIsOpen(true); updatePosition() }}
                    onKeyDown={handleKeyDown}
                    placeholder="Buscar item do estoque..."
                    className={`w-full h-[48px] px-4 pr-10 text-[16px] rounded-xl outline-none transition-all duration-200 ${exactMatch
                        ? 'bg-green-500/10 dark:bg-green-500/15 border-2 border-green-500 text-green-700 dark:text-green-300'
                        : 'bg-[#f5f5f7] dark:bg-[#2c2c2e] border-2 border-transparent text-[#1d1d1f] dark:text-white'
                        } placeholder:text-[#aeaeb2]`}
                />
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${exactMatch ? 'text-green-500' : 'text-[#c7c7cc]'}`}>
                    {exactMatch ? (
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                    )}
                </div>

                {/* Exact match hint */}
                {exactMatch && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-6 left-0 text-[12px] font-medium text-green-600 dark:text-green-400"
                    >
                        Pressione Enter para vincular
                    </motion.div>
                )}
            </div>

            {/* Dropdown rendered via Portal */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && filtered.length > 0 && !exactMatch && (
                        <>
                            {/* Backdrop to close */}
                            <div
                                className="fixed inset-0 z-[99998]"
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Dropdown */}
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className="fixed bg-white dark:bg-[#2c2c2e] rounded-[14px] shadow-2xl overflow-hidden z-[99999] border border-black/[0.04] dark:border-white/[0.06]"
                                style={{
                                    top: dropdownPosition.top,
                                    left: dropdownPosition.left,
                                    width: dropdownPosition.width,
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)'
                                }}
                            >
                                {filtered.map((item, i) => (
                                    <motion.button
                                        key={item.id}
                                        type="button"
                                        onClick={() => { onLink(item); setSearchQuery(''); setIsOpen(false) }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        whileHover={{ backgroundColor: 'rgba(52,199,89,0.12)' }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full h-[52px] px-4 text-left flex items-center justify-between text-[15px] text-[#1d1d1f] dark:text-white ${i < filtered.length - 1 ? 'border-b border-[#f5f5f7] dark:border-[#3a3a3c]' : ''
                                            }`}
                                    >
                                        <span className="font-medium">{item.name}</span>
                                        <div className="w-7 h-7 rounded-full bg-[#34c759]/15 flex items-center justify-center text-[#34c759]">
                                            {Icons.plus}
                                        </div>
                                    </motion.button>
                                ))}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Linked Items - Pure Violet Apple Style */}
            {linkedItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {linkedItems.map((item, i) => (
                        <motion.div
                            key={item.itemId}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-500/15 rounded-xl border border-violet-200 dark:border-violet-500/30"
                        >
                            <span className="text-[14px] font-medium tracking-tight text-zinc-800 dark:text-zinc-200">{item.itemName}</span>

                            {/* Last Purchase Price - Apple Style */}
                            {(() => {
                                const lastPrice = item.lastPurchasePrice ?? getLastPurchasePrice(item.itemId)
                                return lastPrice !== undefined && lastPrice > 0 ? (
                                    <>
                                        <span className="text-zinc-300 dark:text-zinc-600">·</span>
                                        <span className="text-[13px] font-normal tracking-tight text-zinc-500 dark:text-zinc-400">
                                            ${lastPrice.toFixed(2)}
                                        </span>
                                    </>
                                ) : null
                            })()}

                            <button
                                type="button"
                                onClick={() => onUnlink(item.itemId)}
                                className="w-5 h-5 rounded-full bg-violet-200/50 dark:bg-violet-500/20 flex items-center justify-center text-violet-500 hover:bg-violet-300/50 dark:hover:bg-violet-500/30 transition-colors"
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// FILE UPLOAD ZONE
// ═══════════════════════════════════════════════════════════════════

interface UploadDocument {
    id: string
    name: string
    type?: string
    size: number
    dataUrl: string
}

export interface FileUploadZoneProps {
    documents: UploadDocument[]
    onFileSelect: (files: FileList) => void
    onDelete: (docId: string) => void
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.length && onFileSelect(e.target.files)} />
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
