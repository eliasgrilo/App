// ═══════════════════════════════════════════════════════════════════
// ADD EXPENSE MODAL — True Apple HIG Design
// Refactored: 940 → ~90 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useRef, Dispatch, SetStateAction, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useCurrency } from '../stores/useCurrencyStore'
import { MODAL_ANIMATIONS } from '../utils/animations'
import {
    Icons, EXPENSE_TYPES, DEFAULT_CATEGORIES, ExpenseFormData, CategoryOption,
    Section, Row, NameInput, SmartInput, SegmentedControl,
    AppleDatePicker, CategoryGrid, SummaryCard
} from '../addExpenseModules'

export type { ExpenseFormData } from '../addExpenseModules'

interface AddExpenseModalProps {
    isOpen: boolean; onClose: () => void; onSave: (e?: FormEvent) => void
    formData: ExpenseFormData; setFormData: Dispatch<SetStateAction<ExpenseFormData>>
    categories?: CategoryOption[]; editingId?: string | number | null
}

export default function AddExpenseModal({ isOpen, onClose, onSave, formData, setFormData, categories = [], editingId = null }: AddExpenseModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    useScrollLock(isOpen); useFocusTrap(isOpen, modalRef)
    const { formatCurrency } = useCurrency()
    const valid = formData.description?.trim() && formData.amount
    const categoryOptions = categories.length > 0 ? categories : DEFAULT_CATEGORIES

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0"
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)' }} onClick={onClose} />
                    <motion.div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="expense-modal-title"
                        initial={{ y: '100%', scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: '100%', scale: 0.95, opacity: 0 }}
                        transition={MODAL_ANIMATIONS.spring} className="relative w-full max-w-[440px] max-h-[94vh] bg-[#f2f2f7] dark:bg-[#000] rounded-t-[36px] md:rounded-[36px] overflow-hidden flex flex-col"
                        style={{ boxShadow: '0 -12px 100px rgba(0,0,0,0.6)' }}>
                        <div className="flex justify-center pt-3 pb-1 md:hidden"><motion.div className="w-11 h-[5px] rounded-full" style={{ background: 'linear-gradient(90deg, rgba(120,120,128,0.2), rgba(120,120,128,0.5), rgba(120,120,128,0.2))' }} /></div>
                        <div className="flex items-center justify-between h-[56px] px-5 border-b border-[#c6c6c8]/20 dark:border-[#38383a]/50"
                            style={{ background: 'rgba(242,242,247,0.85)', backdropFilter: 'blur(30px) saturate(150%)' }}>
                            <motion.button onClick={onClose} whileTap={{ scale: 0.95 }} aria-label="Cancelar" className="text-[17px] text-[#007aff] font-medium">Cancelar</motion.button>
                            <span id="expense-modal-title" className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">{editingId ? 'Editar Despesa' : 'Nova Despesa'}</span>
                            <motion.button onClick={() => valid && onSave()} disabled={!valid} whileTap={{ scale: valid ? 0.95 : 1 }}
                                className={`text-[17px] font-bold transition-all duration-[250ms] ${valid ? 'text-[#007aff]' : 'text-[#007aff]/30'}`}>Salvar</motion.button>
                        </div>
                        <div className="flex-1 overflow-y-auto py-5">
                            <Section icon={Icons.calendar} title="Identificação" delay={0}>
                                <NameInput value={formData.description || ''} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Nome da despesa" autoFocus />
                                <Row label="Data" last><AppleDatePicker value={formData.date} onChange={date => setFormData(p => ({ ...p, date }))} /></Row>
                            </Section>
                            <Section icon={Icons.dollar} title="Valor" delay={1}>
                                <div className="px-4 py-3"><SegmentedControl value={formData.type || 'Variável'} options={EXPENSE_TYPES} onChange={type => setFormData(p => ({ ...p, type: type as 'Fixo' | 'Variável' }))} /></div>
                                <Row label="Valor Unitário"><SmartInput value={formData.amount || ''} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" inputMode="decimal" format="currency" prefix="R$" width="w-28" /></Row>
                                <Row label="Quantidade" last><SmartInput value={formData.quantity || '1'} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} placeholder="1" inputMode="numeric" format="integer" width="w-16" /></Row>
                            </Section>
                            <Section icon={Icons.tag} title="Categoria" delay={2}><CategoryGrid value={formData.category} options={categoryOptions} onChange={category => setFormData(p => ({ ...p, category }))} /></Section>
                            <Section icon={Icons.link} title="Anexos" delay={3}>
                                <Row label="Link" last><input type="url" value={formData.link || ''} onChange={e => setFormData(p => ({ ...p, link: e.target.value }))} placeholder="Opcional"
                                    className="bg-transparent text-[17px] text-[#007aff] font-medium outline-none text-right w-44 placeholder:text-[#aeaeb2]" /></Row>
                            </Section>
                            <SummaryCard total={formData.amount} quantity={formData.quantity} formatCurrency={formatCurrency} />
                            <div className="h-10" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
