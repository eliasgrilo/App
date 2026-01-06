import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollLock } from './hooks/useScrollLock'
import UISwitch from './components/UISwitch'
import AddSupplierModal from './components/AddSupplierModal'
// Mock data removed - now using Zustand store
import { useModal } from './contexts/ModalContext'
import { useToast } from './contexts/ToastContext'
import ModalScrollLock from './components/ModalScrollLock'
import { useAppStore, useSuppliers as useStoreSuppliers, useIngredients } from './stores/useAppStore'
import { Supplier, Ingredient, ID, NewSupplier } from './types'

// ═══ LOCAL TYPE DEFINITIONS ═══
interface LinkedItem {
    itemId: ID
    itemName: string
}

interface SupplierDocument {
    id: string
    name: string
    type: string
    size: number
    dataUrl: string
    uploadedAt: string
    category: string
}

interface SupplierFormData {
    name: string
    company: string
    email: string
    phone: string
    whatsapp: string
    address: string
    notes: string
    linkedItems: LinkedItem[]
    documents: SupplierDocument[]
    autoOrderEnabled: boolean
}

interface LocalSupplier {
    id: ID
    name: string
    company?: string
    email?: string
    phone?: string
    whatsapp?: string
    address?: string
    notes?: string
    linkedItems?: LinkedItem[]
    documents?: SupplierDocument[]
    autoOrderEnabled?: boolean
    createdAt?: string
    updatedAt?: string
}

interface ViewingDocument {
    doc: SupplierDocument
    originRect: DOMRect
}

/**
 * Suppliers - Apple-Quality Supplier Management
 * Premium design with full contact management and linked inventory items
 */

// Storage now handled by Zustand persistence

export default function Suppliers() {
    // Zustand Store - persistent state
     
    const suppliers = useStoreSuppliers() as LocalSupplier[]
    const inventoryItems = useIngredients()
    const { addSupplier, updateSupplier, removeSupplier } = useAppStore()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<LocalSupplier | null>(null)
    const [selectedSupplier, setSelectedSupplier] = useState<LocalSupplier | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeView, setActiveView] = useState<'suppliers' | 'quotes'>('suppliers')
    const { modal } = useModal()
    const { toast } = useToast()
    const quotesFileInputRef = useRef<HTMLInputElement>(null)
    const [quotesUploadingFor, setQuotesUploadingFor] = useState<ID | null>(null)

    // Form state
    const [formData, setFormData] = useState<SupplierFormData>({
        name: '',
        company: '',
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        notes: '',
        linkedItems: [],
        documents: [],
        autoOrderEnabled: false
    })

    // Document categories
    const documentCategories = [
        { id: 'cotacao', label: 'Cotação', icon: '💰' },
        { id: 'catalogo', label: 'Catálogo', icon: '📚' },
        { id: 'contrato', label: 'Contrato', icon: '📋' },
        { id: 'tecnico', label: 'Técnico', icon: '⚙️' },
        { id: 'outros', label: 'Outros', icon: '📄' }
    ]

    // File upload state
    const [isDragging, setIsDragging] = useState(false)
    const [uploadingFile, setUploadingFile] = useState<string | null>(null)
    const [uploadingFileType, setUploadingFileType] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [viewingDocument, setViewingDocument] = useState<ViewingDocument | null>(null)
    const [selectedDocCategory, setSelectedDocCategory] = useState('cotacao')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Using inventoryItems from Zustand store (declared above)
    const [itemSearchQuery, setItemSearchQuery] = useState('')

    // Show toast
    const showToast = useCallback((message: string, type: string = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    // Filter suppliers
    const filteredSuppliers = useMemo(() => {
        if (!searchQuery.trim()) return suppliers
        const query = searchQuery.toLowerCase()
        return suppliers.filter(s =>
            s.name?.toLowerCase().includes(query) ||
            s.company?.toLowerCase().includes(query) ||
            s.email?.toLowerCase().includes(query)
        )
    }, [suppliers, searchQuery])

    // Filter inventory items for linking
    const filteredInventoryItems = useMemo(() => {
        if (!itemSearchQuery.trim()) return inventoryItems.slice(0, 10)
        const query = itemSearchQuery.toLowerCase()
        return inventoryItems.filter(item =>
            item.name?.toLowerCase().includes(query)
        ).slice(0, 10)
    }, [inventoryItems, itemSearchQuery])

    // Open add modal
    const openAddModal = () => {
        setFormData({
            name: '',
            company: '',
            email: '',
            phone: '',
            whatsapp: '',
            address: '',
            notes: '',
            linkedItems: [],
            documents: [],
            autoOrderEnabled: false
        })
        setEditingSupplier(null)
        setIsModalOpen(true)
    }

    // Open edit modal
    const openEditModal = (supplier: LocalSupplier): void => {
        setFormData({
            name: supplier.name || '',
            company: supplier.company || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            whatsapp: supplier.whatsapp || '',
            address: supplier.address || '',
            notes: supplier.notes || '',
            linkedItems: supplier.linkedItems || [],
            documents: supplier.documents || [],
            autoOrderEnabled: supplier.autoOrderEnabled || false
        })
        setEditingSupplier(supplier)
        setSelectedSupplier(null)
        setIsModalOpen(true)
    }

    // Save supplier
    const handleSave = (): void => {
        if (!formData.name.trim()) {
            showToast('Nome é obrigatório', 'error')
            return
        }

        if (editingSupplier) {
             
            updateSupplier(editingSupplier.id, { ...formData, updatedAt: new Date().toISOString() })
            showToast('Fornecedor atualizado!')
        } else {
            const newSupplier = {
                id: Date.now().toString(),
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
             
            addSupplier(newSupplier)
            showToast('Fornecedor adicionado!')
        }

        setIsModalOpen(false)
        setEditingSupplier(null)
    }

    // Delete supplier
    const handleDelete = (supplier: LocalSupplier): void => {
        modal.confirm({
            title: 'Excluir Fornecedor',
            message: `Deseja excluir "${supplier.name}"? Esta ação não pode ser desfeita.`,
            isDangerous: true,
            onConfirm: () => {
                removeSupplier(supplier.id)
                setSelectedSupplier(null)
                showToast('Fornecedor excluído')
            }
        })
    }

    // Link item to supplier
    const linkItem = (item: Ingredient): void => {
        if (formData.linkedItems.find(i => i.itemId === item.id)) return
        setFormData(prev => ({
            ...prev,
            linkedItems: [...prev.linkedItems, { itemId: item.id, itemName: item.name }]
        }))
        setItemSearchQuery('')
    }

    // Unlink item
    const unlinkItem = (itemId: ID): void => {
        setFormData(prev => ({
            ...prev,
            linkedItems: prev.linkedItems.filter(i => i.itemId !== itemId)
        }))
    }

    // ========== DOCUMENT MANAGEMENT ==========

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    // Get file icon based on type
    const getFileIcon = (type: string): string => {
        if (type.startsWith('image/')) return '🖼️'
        if (type === 'application/pdf') return '📕'
        if (type.includes('spreadsheet') || type.includes('excel')) return '📊'
        if (type.includes('document') || type.includes('word')) return '📝'
        return '📄'
    }

    // Handle file selection with progress tracking
    const handleFileSelect = useCallback((files: FileList): void => {
        const maxSize = 5 * 1024 * 1024 // 5MB limit
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

        Array.from(files).forEach((file: File) => {
            // Validate file size
            if (file.size > maxSize) {
                showToast(`${file.name} excede 5MB`, 'error')
                return
            }

            // Validate file type
            if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
                showToast('Formato não suportado', 'error')
                return
            }

            setUploadingFile(file.name)
            setUploadingFileType(file.type)
            setUploadProgress(0)

            const reader = new FileReader()

            // Track progress (Safari-style progress bar)
            reader.onprogress = (e: ProgressEvent<FileReader>): void => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100)
                    setUploadProgress(progress)
                }
            }

            reader.onload = (e: ProgressEvent<FileReader>): void => {
                setUploadProgress(100)

                const newDoc: SupplierDocument = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    dataUrl: (e.target?.result as string) || '',
                    uploadedAt: new Date().toISOString(),
                    category: selectedDocCategory
                }

                // Small delay to show 100% before clearing
                setTimeout(() => {
                    setFormData(prev => ({
                        ...prev,
                        documents: [...prev.documents, newDoc]
                    }))
                    setUploadingFile(null)
                    setUploadingFileType(null)
                    setUploadProgress(0)
                    showToast('Documento anexado!')
                }, 200)
            }

            reader.onerror = (): void => {
                setUploadingFile(null)
                setUploadingFileType(null)
                setUploadProgress(0)
                showToast('Erro ao ler arquivo', 'error')
            }

            reader.readAsDataURL(file)
        })
    }, [selectedDocCategory, showToast])

    // Handle drag events
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFileSelect(files)
        }
    }, [handleFileSelect])

    // Delete document
    const deleteDocument = (docId: string): void => {
        setFormData(prev => ({
            ...prev,
            documents: prev.documents.filter(d => d.id !== docId)
        }))
        showToast('Documento removido')
    }

    // Download document with binary integrity (Raw Blob)
    const downloadDocument = (doc: SupplierDocument): void => {
        try {
            // Parse base64 data URL
            const dataUrl = doc.dataUrl
            if (!dataUrl) {
                showToast('Arquivo não disponível', 'error')
                return
            }

            // Extract base64 data and MIME type from data URL
            const matches = dataUrl.match(/^data:(.+?);base64,(.*)$/)
            if (!matches) {
                // If not a data URL, try direct download
                const link = document.createElement('a')
                link.href = dataUrl
                link.download = doc.name
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                return
            }

            const mimeType = matches[1] || doc.type || 'application/octet-stream'
            const base64Data = matches[2]

            // Convert base64 to binary
            if (!base64Data) {
                showToast('Dados do arquivo inválidos', 'error')
                return
            }
            const binaryString = atob(base64Data)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }

            // Create blob with correct MIME type
            const blob = new Blob([bytes], { type: mimeType })
            const blobUrl = URL.createObjectURL(blob)

            // Ensure filename has correct extension
            let fileName = doc.name
            const mimeToExt: Record<string, string> = {
                'application/pdf': '.pdf',
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/webp': '.webp',
                'application/vnd.ms-excel': '.xls',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
                'application/msword': '.doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
            }

            const expectedExt = mimeToExt[mimeType]
            if (expectedExt && !fileName.toLowerCase().endsWith(expectedExt)) {
                // Add extension if missing
                const hasAnyExt = /\.[a-zA-Z0-9]+$/.test(fileName)
                if (!hasAnyExt) {
                    fileName += expectedExt
                }
            }

            const link = document.createElement('a')
            link.href = blobUrl
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Cleanup blob URL
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
            showToast('Arquivo baixado!')
        } catch (error) {
            console.error('Download error:', error)
            showToast('Erro ao baixar arquivo', 'error')
        }
    }

    // Contact actions
    const handleCall = (phone: string): void => {
        window.open(`tel:${phone}`, '_self')
    }

    const handleEmail = (email: string): void => {
        window.open(`mailto:${email}`, '_self')
    }

    const handleWhatsApp = (whatsapp: string): void => {
        const cleanNumber = whatsapp.replace(/\D/g, '')
        window.open(`https://wa.me/${cleanNumber}`, '_blank')
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-violet-500/20">
            {/* Ultra-Subtle Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Fornecedores</h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Gestão de fornecedores e contatos</p>
                </div>

                <button
                    onClick={openAddModal}
                    className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                    <svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Fornecedor
                </button>
            </div>

            {/* Segmented Control - Apple Style */}
            <section className="relative z-10">
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl inline-flex">
                    <button
                        onClick={() => setActiveView('suppliers')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${activeView === 'suppliers'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                    >
                        Fornecedores
                    </button>
                    <button
                        onClick={() => setActiveView('quotes')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${activeView === 'quotes'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                    >
                        Orçamentos
                    </button>
                </div>
            </section>

            {/* Search */}
            {activeView === 'suppliers' && (
                <section className="relative z-10">
                    <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-5 border border-zinc-200/50 dark:border-white/10 shadow-lg">
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-white/5 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all placeholder:text-zinc-400"
                                placeholder="Buscar fornecedor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Suppliers Grid */}
            {activeView === 'suppliers' && (
                <section className="relative z-10">
                    {filteredSuppliers.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-12 border border-zinc-200/50 dark:border-white/10 text-center">
                            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Nenhum fornecedor</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Adicione seu primeiro fornecedor para começar</p>
                            <button
                                onClick={openAddModal}
                                className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all"
                            >
                                Adicionar Fornecedor
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {filteredSuppliers.map((supplier) => (
                                <motion.div
                                    key={supplier.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -4 }}
                                    onClick={() => setSelectedSupplier(supplier)}
                                    className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
                                >
                                    {/* Avatar + Name + Quick Edit */}
                                    <div className="flex items-start gap-4 mb-4 relative">
                                        {/* Quick Edit Button - Always visible for mobile accessibility */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                openEditModal(supplier)
                                            }}
                                            className="absolute top-0 right-0 w-10 h-10 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-indigo-500 transition-all shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 touch-manipulation z-10"
                                            style={{ minWidth: '44px', minHeight: '44px' }}
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-violet-500/25">
                                            {supplier.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-12">
                                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{supplier.name}</h3>
                                            {supplier.company && (
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{supplier.company}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-2 mb-4">
                                        {supplier.phone && (
                                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span className="truncate">{supplier.phone}</span>
                                            </div>
                                        )}
                                        {(supplier.linkedItems?.length ?? 0) > 0 && (
                                            <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                                {supplier.linkedItems?.length ?? 0} {(supplier.linkedItems?.length ?? 0) === 1 ? 'item' : 'itens'}                                       </div>
                                        )}
                                        {supplier.email && (
                                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="truncate">{supplier.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Linked Items Badge */}
                                    {(supplier.linkedItems?.length ?? 0) > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-100 dark:border-violet-500/20">
                                            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                                {supplier.linkedItems?.length ?? 0} {(supplier.linkedItems?.length ?? 0) === 1 ? 'item' : 'itens'}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Quotes View - Apple Card Design */}
            {activeView === 'quotes' && (() => {
                // Filter suppliers with at least 1 quote
                const suppliersWithQuotes = suppliers.filter(s =>
                    (s.documents || []).some(d => d.category === 'cotacao')
                )

                return (
                    <section className="relative z-10">
                        {/* Hidden File Input for Quotes */}
                        <input
                            ref={quotesFileInputRef}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.length && quotesUploadingFor) {
                                    const file = e.target.files[0]
                                    if (!file) return
                                    if (file.size > 5 * 1024 * 1024) {
                                        showToast('Arquivo muito grande (máx 5MB)', 'error')
                                        return
                                    }
                                    const reader = new FileReader()
                                    reader.onload = (ev) => {
                                        const newDoc: SupplierDocument = {
                                            id: `doc_${Date.now()}`,
                                            name: file.name,
                                            type: file.type,
                                            size: file.size,
                                            dataUrl: (ev.target?.result as string) || '',
                                            uploadedAt: new Date().toISOString(),
                                            category: 'cotacao'
                                        }
                                        // Find the supplier and update via Zustand
                                        const existingSupplier = suppliers.find(s => s.id === quotesUploadingFor)
                                        if (existingSupplier) {
                                            updateSupplier(quotesUploadingFor!, {
                                                documents: [...(existingSupplier.documents || []), newDoc]
                                            })
                                        }
                                        showToast('Cotação adicionada')
                                        setQuotesUploadingFor(null)
                                    }
                                    reader.readAsDataURL(file)
                                }
                                e.target.value = ''
                            }}
                        />

                        {suppliersWithQuotes.length === 0 ? (
                            /* Empty State - Apple Card Style */
                            <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-12 border border-zinc-200/50 dark:border-white/10 text-center shadow-lg">
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/10 dark:to-orange-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Nenhuma cotação</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 mb-6">Adicione cotações aos seus fornecedores</p>
                                <button
                                    onClick={() => setActiveView('suppliers')}
                                    className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all"
                                >
                                    Ver Fornecedores
                                </button>
                            </div>
                        ) : (
                            /* Quotes List - Apple Card Grid */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {suppliersWithQuotes.map(supplier => {
                                    const quotes = (supplier.documents || []).filter(d => d.category === 'cotacao')
                                    return (
                                        <motion.div
                                            key={supplier.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileHover={{ y: -4 }}
                                            className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all"
                                        >
                                            {/* Header: Avatar + Supplier Name + Add Button */}
                                            <div className="flex items-start gap-4 mb-5">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-amber-500/25">
                                                    {supplier.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{supplier.name}</h3>
                                                    {supplier.company && (
                                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{supplier.company}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setQuotesUploadingFor(supplier.id)
                                                        quotesFileInputRef.current?.click()
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors touch-manipulation"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Badge showing count */}
                                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20 mb-4">
                                                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                                    {quotes.length} {quotes.length === 1 ? 'cotação' : 'cotações'}
                                                </span>
                                            </div>

                                            {/* Quote Files List */}
                                            <div className="space-y-2">
                                                {quotes.map(doc => (
                                                    <div
                                                        key={doc.id}
                                                        className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl group hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                                        onClick={(e) => {
                                                            // Open Quick Look preview on file click
                                                            setViewingDocument({ doc, originRect: e.currentTarget.getBoundingClientRect() })
                                                        }}
                                                    >
                                                        {/* File Icon - SF Symbol Style */}
                                                        {doc.type.startsWith('image/') ? (
                                                            <div
                                                                className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0 shadow-sm ring-1 ring-black/5"
                                                                style={{ backgroundImage: `url(${doc.dataUrl})` }}
                                                            />
                                                        ) : (
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 relative ${doc.type === 'application/pdf'
                                                                ? 'bg-red-100 dark:bg-red-500/20'
                                                                : doc.type.includes('spreadsheet') || doc.type.includes('excel')
                                                                    ? 'bg-emerald-100 dark:bg-emerald-500/20'
                                                                    : 'bg-blue-100 dark:bg-blue-500/20'
                                                                }`}>
                                                                {doc.type === 'application/pdf' ? (
                                                                    /* PDF Icon - SF Symbol style */
                                                                    <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none">
                                                                        <rect x="4" y="2" width="16" height="20" rx="2" fill="currentColor" />
                                                                        <text x="12" y="13" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">PDF</text>
                                                                    </svg>
                                                                ) : doc.type.includes('spreadsheet') || doc.type.includes('excel') ? (
                                                                    /* Excel Icon - tablecells SF Symbol style */
                                                                    <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none">
                                                                        <rect x="4" y="2" width="16" height="20" rx="2" fill="currentColor" />
                                                                        <rect x="6" y="6" width="4" height="3" rx="0.5" fill="white" opacity="0.9" />
                                                                        <rect x="11" y="6" width="4" height="3" rx="0.5" fill="white" opacity="0.9" />
                                                                        <rect x="6" y="10" width="4" height="3" rx="0.5" fill="white" opacity="0.9" />
                                                                        <rect x="11" y="10" width="4" height="3" rx="0.5" fill="white" opacity="0.9" />
                                                                        <rect x="6" y="14" width="4" height="3" rx="0.5" fill="white" opacity="0.9" />
                                                                        <rect x="11" y="14" width="4" height="3" rx="0.5" fill="white" opacity="0.9" />
                                                                    </svg>
                                                                ) : (
                                                                    /* Word/Doc Icon - doc.text SF Symbol style */
                                                                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none">
                                                                        <rect x="4" y="2" width="16" height="20" rx="2" fill="currentColor" />
                                                                        <path d="M8 8h8M8 12h8M8 16h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* File Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{doc.name}</p>
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                                {formatFileSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    downloadDocument(doc)
                                                                }}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors touch-manipulation"
                                                                title="Baixar"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    updateSupplier(supplier.id, {
                                                                        documents: (supplier.documents?.filter(d => d.id !== doc.id) || [])
                                                                    })
                                                                    showToast('Cotação removida')
                                                                }}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors touch-manipulation"
                                                                title="Remover"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </section>
                )
            })()}

            {/* Add/Edit Modal - Premium Apple + Google HIG Design */}
            <AddSupplierModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                formData={formData}
                setFormData={setFormData}
                inventoryItems={inventoryItems}
                isEditing={!!editingSupplier}
                onFileSelect={handleFileSelect}
                uploadingFile={!!uploadingFile}
                uploadProgress={uploadProgress}
                onDeleteDocument={deleteDocument}
            />

            {/* Supplier Detail Modal */}
            {createPortal(
                <AnimatePresence>
                    {selectedSupplier && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto p-4"
                            style={{ paddingTop: '80px', paddingBottom: '40px' }}
                        >
                            <ModalScrollLock />
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                                onClick={() => setSelectedSupplier(null)}
                            />

                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 30, scale: 0.98 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-lg mx-4 my-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                                style={{ maxHeight: 'calc(100vh - 100px)' }}
                            >
                                {/* Header with Avatar and Close Button */}
                                <div className="relative px-6 py-8 text-center border-b border-zinc-100/80 dark:border-white/5">
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setSelectedSupplier(null)}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>

                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-violet-500/30 mx-auto mb-4">
                                        {selectedSupplier.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{selectedSupplier.name}</h2>
                                    {selectedSupplier.company && (
                                        <p className="text-zinc-500 dark:text-zinc-400">{selectedSupplier.company}</p>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="px-6 py-4 border-b border-zinc-100/80 dark:border-white/5">
                                    <div className="flex gap-3">
                                        {selectedSupplier.phone && (
                                            <button
                                                onClick={() => selectedSupplier.phone && handleCall(selectedSupplier.phone)}
                                                className="flex-1 py-4 px-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 touch-manipulation"
                                            >
                                                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Ligar</span>
                                            </button>
                                        )}
                                        {selectedSupplier.email && (
                                            <button
                                                onClick={() => selectedSupplier.email && handleEmail(selectedSupplier.email)}
                                                className="flex-1 py-4 px-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 touch-manipulation"
                                            >
                                                <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Email</span>
                                            </button>
                                        )}
                                        {selectedSupplier.whatsapp && (
                                            <button
                                                onClick={() => selectedSupplier.whatsapp && handleWhatsApp(selectedSupplier.whatsapp)}
                                                className="flex-1 py-4 px-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95 touch-manipulation"
                                            >
                                                <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                </svg>
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">WhatsApp</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="px-6 py-5 space-y-4">
                                    {selectedSupplier.address && (
                                        <div>
                                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Endereço</h4>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedSupplier.address}</p>
                                        </div>
                                    )}

                                    {(selectedSupplier.linkedItems?.length ?? 0) > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Itens Fornecidos</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {(selectedSupplier.linkedItems ?? []).map(item => (
                                                    <span key={item.itemId} className="px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-bold">
                                                        {item.itemName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents Section in Detail View */}
                                    {(selectedSupplier.documents?.length ?? 0) > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Documentos</h4>
                                            <div className="space-y-2">
                                                {(selectedSupplier.documents ?? []).map(doc => {
                                                    const category = documentCategories.find(c => c.id === doc.category)
                                                    return (
                                                        <div
                                                            key={doc.id}
                                                            onClick={() => downloadDocument(doc)}
                                                            className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100/80 dark:border-zinc-700 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all touch-manipulation active:scale-[0.98]"
                                                        >
                                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center text-xl shrink-0">
                                                                {getFileIcon(doc.type)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h5 className="text-sm font-medium text-zinc-900 dark:text-white truncate mb-0.5">{doc.name}</h5>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-zinc-400">{formatFileSize(doc.size)}</span>
                                                                    {category && (
                                                                        <span className="text-[10px] font-bold text-violet-500">{category.icon} {category.label}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <svg className="w-5 h-5 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {selectedSupplier.notes && (
                                        <div>
                                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Observações</h4>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedSupplier.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="px-6 py-5 border-t border-zinc-100/80 dark:border-white/5 flex gap-3">
                                    <button
                                        onClick={() => openEditModal(selectedSupplier)}
                                        className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.98] transition-all touch-manipulation"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedSupplier)}
                                        className="py-4 px-6 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-[0.98] touch-manipulation"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    )
}
