// ═══════════════════════════════════════════════════════════════════
// useSuppliersHandlers — Composite hook combining CRUD and file handlers
// Refactored: 347 → ~50 lines
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import type { LocalSupplier, SupplierFormData, SupplierDocument } from '../types'
import { ID, Ingredient } from '../../types'
import { useFileHandlers } from './useFileHandlers'
import { useCrudHandlers } from './useCrudHandlers'

interface ModalContext { confirm: (opts: { title: string; message: string; isDangerous?: boolean; onConfirm: () => void }) => void }

export interface UseSuppliersHandlersProps {
    suppliers: LocalSupplier[]; addSupplier: (s: Partial<LocalSupplier>) => void; updateSupplier: (id: ID, data: Partial<LocalSupplier>) => void; removeSupplier: (id: ID) => void
    formData: SupplierFormData; setFormData: React.Dispatch<React.SetStateAction<SupplierFormData>>
    editingSupplier: LocalSupplier | null; setEditingSupplier: (s: LocalSupplier | null) => void
    setSelectedSupplier: (s: LocalSupplier | null) => void; setIsModalOpen: (v: boolean) => void; setItemSearchQuery: (v: string) => void
    selectedDocCategory: string; setUploadingFile: (v: string | null) => void; setUploadingFileType: (v: string | null) => void; setUploadProgress: (v: number) => void
    modal: ModalContext; showToast: (message: string, type?: string) => void
}

export interface SuppliersHandlersReturn {
    openAddModal: () => void; openEditModal: (supplier: LocalSupplier) => void; handleSave: () => void; handleDelete: (supplier: LocalSupplier) => void
    linkItem: (item: Ingredient) => void; unlinkItem: (itemId: ID) => void
    handleFileSelect: (files: FileList) => void; handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void; handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => void; deleteDocument: (docId: string) => void; downloadDocument: (doc: SupplierDocument) => void
    handleCall: (phone: string) => void; handleEmail: (email: string) => void; handleWhatsApp: (whatsapp: string) => void
}

export function useSuppliersHandlers(props: UseSuppliersHandlersProps): SuppliersHandlersReturn {
    const { addSupplier, updateSupplier, removeSupplier, formData, setFormData, editingSupplier, setEditingSupplier, setSelectedSupplier, setIsModalOpen, setItemSearchQuery, modal, showToast } = props
    const { selectedDocCategory, setUploadingFile, setUploadingFileType, setUploadProgress } = props

    const fileHandlers = useFileHandlers({ setFormData, selectedDocCategory, setUploadingFile, setUploadingFileType, setUploadProgress, showToast })
    const crudHandlers = useCrudHandlers({ addSupplier, updateSupplier, removeSupplier, formData, setFormData, editingSupplier, setEditingSupplier, setSelectedSupplier, setIsModalOpen, setItemSearchQuery, modal, showToast })

    return { ...crudHandlers, ...fileHandlers }
}

export default useSuppliersHandlers
