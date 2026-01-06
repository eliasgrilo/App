// ═══════════════════════════════════════════════════════════════════
// ADD SUPPLIER MODAL — True Apple + Google HIG Design
// Refactored: 1318 → ~150 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { MODAL_ANIMATIONS } from '../utils/animations'
import {
    Icons, Section, Row, SmartInput, PhoneInput, EmailInput,
    WhatsAppInput, NameInput, Toggle, PremiumTextarea,
    LinkedItemsSearch, FileUploadZone
} from '../addSupplierModules'

interface AddSupplierModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: () => void
    formData: any
    setFormData: React.Dispatch<React.SetStateAction<any>>
    inventoryItems?: any[]
    isEditing?: boolean
    onFileSelect?: (files: FileList) => void
    uploadingFile?: boolean
    uploadProgress?: number
    onDeleteDocument?: (docId: string) => void
}

export default function AddSupplierModal({
    isOpen, onClose, onSave, formData, setFormData, inventoryItems = [],
    isEditing = false, onFileSelect, uploadingFile, uploadProgress, onDeleteDocument
}: AddSupplierModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    useScrollLock(isOpen)
    useFocusTrap(isOpen, modalRef)
    const [itemSearchQuery, setItemSearchQuery] = useState('')
    const valid = formData.name?.trim()

    const handleCall = (phone: string) => window.open(`tel:${phone.replace(/\D/g, '')}`, '_self')
    const handleEmail = (email: string) => window.open(`mailto:${email}`, '_self')
    const handleWhatsApp = (w: string) => window.open(`https://wa.me/55${w.replace(/\D/g, '')}`, '_blank')
    const linkItem = (item: any) => !formData.linkedItems?.find((i: any) => i.itemId === item.id) && setFormData((p: any) => ({ ...p, linkedItems: [...(p.linkedItems || []), { itemId: item.id, itemName: item.name }] }))
    const unlinkItem = (id: string) => setFormData((p: any) => ({ ...p, linkedItems: (p.linkedItems || []).filter((i: any) => i.itemId !== id) }))

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)' }} onClick={onClose} />
                    <motion.div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="supplier-modal-title"
                        initial={{ y: '100%', scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: '100%', scale: 0.95, opacity: 0 }}
                        transition={MODAL_ANIMATIONS.spring} className="relative w-full max-w-[440px] max-h-[92vh] bg-[#f2f2f7] dark:bg-[#000] rounded-t-[32px] md:rounded-[32px] overflow-hidden flex flex-col"
                        style={{ boxShadow: '0 -8px 80px rgba(0,0,0,0.5)' }}>
                        <div className="flex justify-center pt-2.5 pb-1 md:hidden"><motion.div className="w-10 h-[5px] rounded-full" style={{ background: 'linear-gradient(90deg, rgba(120,120,128,0.3), rgba(120,120,128,0.5), rgba(120,120,128,0.3))' }} whileHover={{ scaleX: 1.2 }} whileTap={{ scaleX: 0.9 }} /></div>
                        <div className="flex items-center justify-between h-[58px] px-5 border-b border-[#c6c6c8]/20 dark:border-[#38383a]/50" style={{ background: 'rgba(242,242,247,0.8)', backdropFilter: 'blur(20px)' }}>
                            <motion.button onClick={onClose} whileTap={{ scale: 0.95 }} aria-label="Cancelar" className="text-[17px] text-[#007aff] font-medium">Cancelar</motion.button>
                            <span id="supplier-modal-title" className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">{isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</span>
                            <motion.button onClick={() => valid && onSave()} disabled={!valid} whileTap={{ scale: valid ? 0.95 : 1 }} className={`text-[17px] font-bold ${valid ? 'text-[#007aff]' : 'text-[#007aff]/30'}`}>Salvar</motion.button>
                        </div>
                        <div className="flex-1 overflow-y-auto py-5">
                            <Section icon={Icons.person} iconKey="identification" title="Identificação" delay={0}>
                                <NameInput value={formData.name || ''} onChange={e => setFormData((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nome do contato *" autoFocus />
                                <div className="border-t border-[#e5e5ea]/60 dark:border-[#38383a]/80"><Row label="Empresa" last><SmartInput value={formData.company || ''} onChange={e => setFormData((p: any) => ({ ...p, company: e.target.value }))} placeholder="Opcional" width="w-40" align="right" /></Row></div>
                            </Section>
                            <Section icon={Icons.phone} iconKey="contact" title="Contato" delay={1}>
                                <Row label="Telefone"><PhoneInput value={formData.phone || ''} onChange={e => setFormData((p: any) => ({ ...p, phone: e.target.value }))} placeholder="(00) 00000-0000" onCall={handleCall} /></Row>
                                <Row label="Email"><EmailInput value={formData.email || ''} onChange={e => setFormData((p: any) => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" onEmail={handleEmail} /></Row>
                                <Row label="Tem WhatsApp?" last={!formData.hasWhatsApp}><Toggle on={formData.hasWhatsApp || false} onChange={v => setFormData((p: any) => ({ ...p, hasWhatsApp: v }))} /></Row>
                                {formData.hasWhatsApp && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}><Row label="WhatsApp" last><WhatsAppInput value={formData.whatsapp || formData.phone || ''} onChange={e => setFormData((p: any) => ({ ...p, whatsapp: e.target.value }))} placeholder="(00) 00000-0000" onWhatsApp={handleWhatsApp} /></Row></motion.div>}
                            </Section>
                            <Section icon={Icons.mappin} iconKey="address" title="Endereço" delay={2} expandable defaultExpanded={!!formData.address}><div className="p-4"><PremiumTextarea value={formData.address || ''} onChange={e => setFormData((p: any) => ({ ...p, address: e.target.value }))} placeholder="Endereço completo..." rows={2} /></div></Section>
                            <Section icon={Icons.link} iconKey="links" title="Itens Vinculados" footer={formData.linkedItems?.length === 0 ? "Vincule itens do estoque a este fornecedor." : undefined} delay={3}>
                                <div className="p-4"><LinkedItemsSearch inventoryItems={inventoryItems} linkedItems={formData.linkedItems || []} onLink={linkItem} onUnlink={unlinkItem} searchQuery={itemSearchQuery} setSearchQuery={setItemSearchQuery} /></div>
                            </Section>
                            <Section icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>} iconKey="commercial" title="Condições Comerciais" delay={4} expandable defaultExpanded={!!(formData.paymentTerms || formData.minimumOrder)} footer="Informações para automação.">
                                <Row label="Prazo Pagamento"><SmartInput value={formData.paymentTerms || ''} onChange={e => setFormData((p: any) => ({ ...p, paymentTerms: e.target.value }))} placeholder="30 dias" width="w-28" align="right" /></Row>
                                <Row label="Pedido Mínimo" last><SmartInput value={formData.minimumOrder || ''} onChange={e => setFormData((p: any) => ({ ...p, minimumOrder: e.target.value }))} placeholder="$ 500" width="w-28" align="right" /></Row>
                            </Section>
                            <Section icon={Icons.bolt} iconKey="automation" title="Automação" delay={5}>
                                <Row label="Solicitação Automática" last><Toggle on={formData.autoOrderEnabled || false} onChange={v => setFormData((p: any) => ({ ...p, autoOrderEnabled: v }))} /></Row>
                                {formData.autoOrderEnabled && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-4 pb-4"><div className="p-3 bg-[#34c759]/10 rounded-xl border border-[#34c759]/20"><p className="text-[13px] text-[#34c759] font-medium">Quando um item vinculado atingir o estoque mínimo, uma cotação será criada automaticamente.</p></div></motion.div>}
                            </Section>
                            <Section icon={Icons.paperclip} iconKey="attachments" title="Anexos" delay={6} expandable defaultExpanded={formData.documents?.length > 0}>
                                <div className="p-4"><FileUploadZone documents={formData.documents || []} onFileSelect={onFileSelect!} onDelete={onDeleteDocument!} uploadingFile={uploadingFile!} uploadProgress={uploadProgress!} /></div>
                            </Section>
                            <Section icon={Icons.text} iconKey="notes" title="Observações" delay={7} expandable defaultExpanded={!!formData.notes}><div className="p-4"><PremiumTextarea value={formData.notes || ''} onChange={e => setFormData((p: any) => ({ ...p, notes: e.target.value }))} placeholder="Notas adicionais..." rows={3} /></div></Section>
                            <div className="h-8" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
