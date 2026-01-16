/**
 * Suppliers types and interfaces
 */

import { ID } from '../types'

export interface LinkedItem {
    itemId: ID
    itemName: string
}

export interface SupplierDocument {
    id: string
    name: string
    type: string
    size: number
    dataUrl: string
    uploadedAt: string
    category: string
}

export interface SupplierFormData extends Record<string, unknown> {
    id?: ID
    name?: string
    company?: string
    email?: string
    phone?: string
    whatsapp?: string
    hasWhatsApp?: boolean
    address?: string
    addressStreet?: string
    addressUnit?: string
    addressCity?: string
    addressProvince?: string
    addressPostalCode?: string
    notes?: string
    linkedItems?: LinkedItem[]
    documents?: SupplierDocument[]
    autoOrderEnabled?: boolean
    paymentTerms?: string
    minimumOrder?: string
    deliveryDays?: string[]
    image?: string
}

export interface LocalSupplier {
    id: ID
    name: string
    company?: string
    email?: string
    phone?: string
    whatsapp?: string
    hasWhatsApp?: boolean
    address?: string
    addressStreet?: string
    addressUnit?: string
    addressCity?: string
    addressProvince?: string
    addressPostalCode?: string
    notes?: string
    linkedItems?: LinkedItem[]
    documents?: SupplierDocument[]
    autoOrderEnabled?: boolean
    paymentTerms?: string
    minimumOrder?: string
    deliveryDays?: string[]
    image?: string
    createdAt?: string
    updatedAt?: string
}

export interface ViewingDocument {
    doc: SupplierDocument
    originRect: DOMRect
}

export interface DocumentCategory {
    id: string
    label: string
    icon: string
}

// Document categories
export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
    { id: 'cotacao', label: 'Cotação', icon: '💰' },
    { id: 'catalogo', label: 'Catálogo', icon: '📚' },
    { id: 'contrato', label: 'Contrato', icon: '📋' },
    { id: 'tecnico', label: 'Técnico', icon: '⚙️' },
    { id: 'outros', label: 'Outros', icon: '📄' }
]

// Default form data
export const DEFAULT_FORM_DATA: SupplierFormData = {
    id: undefined,
    name: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    notes: '',
    linkedItems: [],
    documents: [],
    autoOrderEnabled: true
}

// File utilities
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('image')) return '🖼️'
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊'
    if (type.includes('document') || type.includes('word')) return '📝'
    return '📎'
}
