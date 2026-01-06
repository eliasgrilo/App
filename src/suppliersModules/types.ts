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

export interface SupplierFormData {
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

export interface LocalSupplier {
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

export interface ViewingDocument {
    doc: SupplierDocument
    originRect: DOMRect
}

// Default form data
export const DEFAULT_FORM_DATA: SupplierFormData = {
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
