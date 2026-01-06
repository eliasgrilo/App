// ═══════════════════════════════════════════════════════════════════
// ADD INGREDIENT MODAL — True Apple HIG Design
// Refactored: 1169 → ~100 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useCurrency } from '../stores/useCurrencyStore'
import { MODAL_ANIMATIONS } from '../utils/animations'
import {
    Icons, PRODUCT_TYPES, STORAGE_LOCATIONS,
    Section, Row, ExpandableSection,
    SmartInput, NameInput, SegmentedControl, UnitSelector, Toggle, SupplierSearch, SummaryCard
} from '../addIngredientModules'

interface AddIngredientModalProps {
    isOpen: boolean; onClose: () => void; onAdd: () => void
    newItem: any; setNewItem: React.Dispatch<React.SetStateAction<any>>
    suppliers?: Array<{ id: number | string; name?: string }>; units?: string[]
}

export default function AddIngredientModal({ isOpen, onClose, onAdd, newItem, setNewItem, suppliers = [], units = ['kg', 'g', 'L', 'ml', 'un'] }: AddIngredientModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    useScrollLock(isOpen); useFocusTrap(isOpen, modalRef)
    const { formatCurrency } = useCurrency()
    const total = (Number(newItem.packageQuantity) || 0) * (Number(newItem.packageCount) || 1)
    const value = (Number(newItem.packageCount) || 1) * (Number(newItem.pricePerUnit) || 0)
    const valid = newItem.name?.trim()

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)' }} onClick={onClose} />
                    <motion.div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="ingredient-modal-title"
                        initial={{ y: '100%', scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: '100%', scale: 0.95, opacity: 0 }}
                        transition={MODAL_ANIMATIONS.spring} className="relative w-full max-w-[440px] max-h-[92vh] bg-[#f2f2f7] dark:bg-[#000] rounded-t-[32px] md:rounded-[32px] overflow-hidden flex flex-col"
                        style={{ boxShadow: '0 -8px 80px rgba(0,0,0,0.5)' }}>
                        <div className="flex justify-center pt-2.5 pb-1 md:hidden"><motion.div className="w-10 h-[5px] rounded-full" style={{ background: 'linear-gradient(90deg, rgba(120,120,128,0.3), rgba(120,120,128,0.5), rgba(120,120,128,0.3))' }} whileHover={{ scaleX: 1.2 }} whileTap={{ scaleX: 0.9 }} /></div>
                        <div className="flex items-center justify-between h-[58px] px-5 border-b border-[#c6c6c8]/20 dark:border-[#38383a]/50" style={{ background: 'rgba(242,242,247,0.8)', backdropFilter: 'blur(20px)' }}>
                            <motion.button onClick={onClose} whileTap={{ scale: 0.95 }} aria-label="Cancelar" className="text-[17px] text-[#007aff] font-medium">Cancelar</motion.button>
                            <div className="flex flex-col items-center">
                                <span id="ingredient-modal-title" className="text-[17px] font-bold text-[#1d1d1f] dark:text-white">Novo Insumo</span>
                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
                                    <span className="text-[11px] font-medium text-[#34c759]">Entrada: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </motion.div>
                            </div>
                            <motion.button onClick={() => valid && onAdd()} disabled={!valid} whileTap={{ scale: valid ? 0.95 : 1 }} className={`text-[17px] font-bold ${valid ? 'text-[#007aff]' : 'text-[#007aff]/30'}`}>Salvar</motion.button>
                        </div>
                        <div className="flex-1 overflow-y-auto py-5">
                            <Section icon={Icons.layers} iconKey="identification" title="Identificação" delay={0}>
                                <NameInput value={newItem.name || ''} onChange={e => setNewItem((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nome do ingrediente" autoFocus />
                                <SegmentedControl value={newItem.type || 'secos'} options={PRODUCT_TYPES} onChange={type => setNewItem((p: any) => ({ ...p, type }))} />
                            </Section>
                            <Section icon={Icons.cube} iconKey="quantity" title="Quantidade & Preço" delay={1}>
                                <Row label="Tamanho"><SmartInput value={newItem.packageQuantity || ''} onChange={e => setNewItem((p: any) => ({ ...p, packageQuantity: e.target.value }))} placeholder="0" inputMode="decimal" format="number" width="w-16" />
                                    <UnitSelector options={units} value={newItem.unit || 'kg'} onChange={u => setNewItem((p: any) => ({ ...p, unit: u }))} /></Row>
                                <Row label="Pacotes"><SmartInput value={newItem.packageCount || ''} onChange={e => setNewItem((p: any) => ({ ...p, packageCount: e.target.value }))} placeholder="1" inputMode="numeric" format="integer" width="w-14" /></Row>
                                <Row label="Preço/Pacote" last><SmartInput value={newItem.pricePerUnit || ''} onChange={e => setNewItem((p: any) => ({ ...p, pricePerUnit: e.target.value }))} placeholder="0.00" inputMode="decimal" format="currency" prefix="$" width="w-20" /></Row>
                            </Section>
                            <Section icon={Icons.grid} iconKey="storage" title="Controle de Estoque" delay={2}>
                                <SegmentedControl value={newItem.storageLocation || 'prateleira'} options={STORAGE_LOCATIONS} onChange={loc => setNewItem((p: any) => ({ ...p, storageLocation: loc }))} />
                                <Row label="Estoque Mínimo"><SmartInput value={newItem.minStock || ''} onChange={e => setNewItem((p: any) => ({ ...p, minStock: e.target.value }))} placeholder="0" inputMode="numeric" format="integer" suffix={newItem.unit || 'kg'} width="w-14" /></Row>
                                <Row label="Data de Validade" last><input type="date" value={newItem.expirationDate || ''} onChange={e => setNewItem((p: any) => ({ ...p, expirationDate: e.target.value }))} className="w-[140px] px-3 py-2 text-[15px] font-medium text-[#1d1d1f] dark:text-white bg-transparent text-right focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100" /></Row>
                            </Section>
                            <ExpandableSection icon={Icons.building} iconKey="supplier" title="Fornecedor" delay={3}>
                                <SupplierSearch suppliers={suppliers} selected={newItem.supplierName} onSelect={s => setNewItem((p: any) => ({ ...p, supplierId: s.id, supplierName: s.name }))} onClear={() => setNewItem((p: any) => ({ ...p, supplierId: null, supplierName: '' }))} />
                                {newItem.supplierId && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-[#e5e5ea]/60 dark:border-[#38383a]/80">
                                    <Row label="Cotação automática"><Toggle on={newItem.enableAutoQuotation || false} onChange={v => setNewItem((p: any) => ({ ...p, enableAutoQuotation: v }))} /></Row>
                                    <Row label="Prazo de Entrega" last><SmartInput value={newItem.leadTimeDays || ''} onChange={e => setNewItem((p: any) => ({ ...p, leadTimeDays: e.target.value }))} placeholder="3" inputMode="numeric" format="integer" suffix="dias" width="w-12" /></Row>
                                </motion.div>)}
                            </ExpandableSection>
                            <ExpandableSection icon={Icons.sliders} iconKey="advanced" title="Avançado" delay={4}><Row label="Código EAN" last><SmartInput value={newItem.barcode || ''} onChange={e => setNewItem((p: any) => ({ ...p, barcode: e.target.value }))} placeholder="—" inputMode="numeric" format="integer" width="w-32" /></Row></ExpandableSection>
                            <AnimatePresence>{total > 0 && <SummaryCard total={total} unit={newItem.unit || 'kg'} value={value} hasAutoQuote={newItem.enableAutoQuotation} formatCurrency={formatCurrency} />}</AnimatePresence>
                            <div className="h-8" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
