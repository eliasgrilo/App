/**
 * ═══════════════════════════════════════════════════════════════════
 * useSuppliersState — Local UI state for Suppliers
 * Extracted from Suppliers.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useMemo, useCallback } from 'react'
import { useAppStore, useSuppliers as useStoreSuppliers, useIngredients } from '../../stores/useAppStore'
import { useModal } from '../../stores/useUIStore'
import { useToast } from '../../stores/useUIStore'
import type { LocalSupplier, SupplierFormData, ViewingDocument } from '../types'
import { DEFAULT_FORM_DATA } from '../types'
import { ID, Ingredient } from '../../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface SuppliersStateReturn {
    // Store data
    suppliers: LocalSupplier[]
    inventoryItems: Ingredient[]
    addSupplier: (s: any) => void
    updateSupplier: (id: ID, data: any) => void
    removeSupplier: (id: ID) => void

    // UI State
    isModalOpen: boolean
    setIsModalOpen: (v: boolean) => void
    editingSupplier: LocalSupplier | null
    setEditingSupplier: (s: LocalSupplier | null) => void
    selectedSupplier: LocalSupplier | null
    setSelectedSupplier: (s: LocalSupplier | null) => void
    searchQuery: string
    setSearchQuery: (v: string) => void
    activeView: 'suppliers' | 'quotes' | 'clients'
    setActiveView: (v: 'suppliers' | 'quotes' | 'clients') => void

    // Form state
    formData: SupplierFormData
    setFormData: React.Dispatch<React.SetStateAction<SupplierFormData>>

    // File upload state
    isDragging: boolean
    setIsDragging: (v: boolean) => void
    uploadingFile: string | null
    setUploadingFile: (v: string | null) => void
    uploadingFileType: string | null
    setUploadingFileType: (v: string | null) => void
    uploadProgress: number
    setUploadProgress: (v: number) => void
    viewingDocument: ViewingDocument | null
    setViewingDocument: (v: ViewingDocument | null) => void
    selectedDocCategory: string
    setSelectedDocCategory: (v: string) => void
    fileInputRef: React.RefObject<HTMLInputElement>

    // Quotes view
    quotesFileInputRef: React.RefObject<HTMLInputElement>
    quotesUploadingFor: ID | null
    setQuotesUploadingFor: (id: ID | null) => void

    // Item search
    itemSearchQuery: string
    setItemSearchQuery: (v: string) => void

    // Contexts
    modal: ReturnType<typeof useModal>['modal']
    showToast: (message: string, type?: string) => void

    // Derived
    filteredSuppliers: LocalSupplier[]
    filteredInventoryItems: Ingredient[]
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useSuppliersState(): SuppliersStateReturn {
    // Zustand store
    const suppliers = useStoreSuppliers() as LocalSupplier[]
    const inventoryItems = useIngredients()
    const { addSupplier, updateSupplier, removeSupplier } = useAppStore()

    // Contexts
    const { modal } = useModal()
    const { toast } = useToast()

    // UI state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<LocalSupplier | null>(null)
    const [selectedSupplier, setSelectedSupplier] = useState<LocalSupplier | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeView, setActiveView] = useState<'suppliers' | 'quotes' | 'clients'>('suppliers')

    // Form state
    const [formData, setFormData] = useState<SupplierFormData>(DEFAULT_FORM_DATA)

    // File upload state
    const [isDragging, setIsDragging] = useState(false)
    const [uploadingFile, setUploadingFile] = useState<string | null>(null)
    const [uploadingFileType, setUploadingFileType] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [viewingDocument, setViewingDocument] = useState<ViewingDocument | null>(null)
    const [selectedDocCategory, setSelectedDocCategory] = useState('cotacao')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Quotes view
    const quotesFileInputRef = useRef<HTMLInputElement>(null)
    const [quotesUploadingFor, setQuotesUploadingFor] = useState<ID | null>(null)

    // Item search
    const [itemSearchQuery, setItemSearchQuery] = useState('')

    // Toast helper
    const showToast = useCallback((message: string, type: string = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    // Derived state
    const filteredSuppliers = useMemo(() => {
        if (!searchQuery.trim()) return suppliers
        const query = searchQuery.toLowerCase()
        return suppliers.filter(s =>
            s.name?.toLowerCase().includes(query) ||
            s.company?.toLowerCase().includes(query) ||
            s.email?.toLowerCase().includes(query)
        )
    }, [suppliers, searchQuery])

    const filteredInventoryItems = useMemo(() => {
        if (!itemSearchQuery.trim()) return inventoryItems.slice(0, 10)
        const query = itemSearchQuery.toLowerCase()
        return inventoryItems.filter(item =>
            item.name?.toLowerCase().includes(query)
        ).slice(0, 10)
    }, [inventoryItems, itemSearchQuery])

    return {
        // Store
        suppliers,
        inventoryItems,
        addSupplier,
        updateSupplier,
        removeSupplier,

        // UI State
        isModalOpen,
        setIsModalOpen,
        editingSupplier,
        setEditingSupplier,
        selectedSupplier,
        setSelectedSupplier,
        searchQuery,
        setSearchQuery,
        activeView,
        setActiveView,

        // Form
        formData,
        setFormData,

        // File upload
        isDragging,
        setIsDragging,
        uploadingFile,
        setUploadingFile,
        uploadingFileType,
        setUploadingFileType,
        uploadProgress,
        setUploadProgress,
        viewingDocument,
        setViewingDocument,
        selectedDocCategory,
        setSelectedDocCategory,
        fileInputRef: fileInputRef as any,

        // Quotes
        quotesFileInputRef: quotesFileInputRef as any,
        quotesUploadingFor,
        setQuotesUploadingFor,

        // Item search
        itemSearchQuery,
        setItemSearchQuery,

        // Contexts
        modal,
        showToast,

        // Derived
        filteredSuppliers,
        filteredInventoryItems
    }
}

export default useSuppliersState
