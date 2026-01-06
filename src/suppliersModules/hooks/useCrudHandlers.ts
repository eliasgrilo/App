// ═══════════════════════════════════════════════════════════════════
// SUPPLIERS CRUD HANDLERS
// ═══════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react'
import type { LocalSupplier, SupplierFormData } from '../types'
import { DEFAULT_FORM_DATA } from '../types'
import { ID, Ingredient } from '../../types'

interface ModalContext { confirm: (opts: { title: string; message: string; isDangerous?: boolean; onConfirm: () => void }) => void }

export interface UseCrudHandlersProps {
    addSupplier: (s: any) => void; updateSupplier: (id: ID, data: any) => void; removeSupplier: (id: ID) => void
    formData: SupplierFormData; setFormData: React.Dispatch<React.SetStateAction<SupplierFormData>>
    editingSupplier: LocalSupplier | null; setEditingSupplier: (s: LocalSupplier | null) => void
    setSelectedSupplier: (s: LocalSupplier | null) => void; setIsModalOpen: (v: boolean) => void; setItemSearchQuery: (v: string) => void
    modal: ModalContext; showToast: (message: string, type?: string) => void
}

export function useCrudHandlers({ addSupplier, updateSupplier, removeSupplier, formData, setFormData, editingSupplier, setEditingSupplier, setSelectedSupplier, setIsModalOpen, setItemSearchQuery, modal, showToast }: UseCrudHandlersProps) {
    const openAddModal = useCallback(() => { setFormData(DEFAULT_FORM_DATA); setEditingSupplier(null); setIsModalOpen(true) }, [setFormData, setEditingSupplier, setIsModalOpen])

    const openEditModal = useCallback((supplier: LocalSupplier) => {
        setFormData({ name: supplier.name || '', company: supplier.company || '', email: supplier.email || '', phone: supplier.phone || '', whatsapp: supplier.whatsapp || '', address: supplier.address || '', notes: supplier.notes || '', linkedItems: supplier.linkedItems || [], documents: supplier.documents || [], autoOrderEnabled: supplier.autoOrderEnabled || false })
        setEditingSupplier(supplier); setSelectedSupplier(null); setIsModalOpen(true)
    }, [setFormData, setEditingSupplier, setSelectedSupplier, setIsModalOpen])

    const handleSave = useCallback(() => {
        if (!formData.name.trim()) { showToast('Nome é obrigatório', 'error'); return }
        if (editingSupplier) { updateSupplier(editingSupplier.id, { ...formData, updatedAt: new Date().toISOString() }); showToast('Fornecedor atualizado!') }
        else { const newSupplier = { id: Date.now().toString(), ...formData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; addSupplier(newSupplier); showToast('Fornecedor adicionado!') }
        setIsModalOpen(false); setEditingSupplier(null)
    }, [formData, editingSupplier, addSupplier, updateSupplier, setIsModalOpen, setEditingSupplier, showToast])

    const handleDelete = useCallback((supplier: LocalSupplier) => {
        modal.confirm({ title: 'Excluir Fornecedor', message: `Deseja excluir "${supplier.name}"? Esta ação não pode ser desfeita.`, isDangerous: true, onConfirm: () => { removeSupplier(supplier.id); setSelectedSupplier(null); showToast('Fornecedor excluído') } })
    }, [modal, removeSupplier, setSelectedSupplier, showToast])

    const linkItem = useCallback((item: Ingredient) => {
        if (formData.linkedItems.find(i => i.itemId === item.id)) return
        setFormData(prev => ({ ...prev, linkedItems: [...prev.linkedItems, { itemId: item.id, itemName: item.name }] })); setItemSearchQuery('')
    }, [formData.linkedItems, setFormData, setItemSearchQuery])

    const unlinkItem = useCallback((itemId: ID) => { setFormData(prev => ({ ...prev, linkedItems: prev.linkedItems.filter(i => i.itemId !== itemId) })) }, [setFormData])

    const handleCall = useCallback((phone: string) => { window.open(`tel:${phone}`, '_self') }, [])
    const handleEmail = useCallback((email: string) => { window.open(`mailto:${email}`, '_self') }, [])
    const handleWhatsApp = useCallback((whatsapp: string) => { const cleanNumber = whatsapp.replace(/\D/g, ''); window.open(`https://wa.me/${cleanNumber}`, '_blank') }, [])

    return { openAddModal, openEditModal, handleSave, handleDelete, linkItem, unlinkItem, handleCall, handleEmail, handleWhatsApp }
}
