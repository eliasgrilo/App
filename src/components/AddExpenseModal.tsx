// ═══════════════════════════════════════════════════════════════════
// ADD EXPENSE MODAL — ULTIMATE APPLE PERFECTION
// Responsive Excellence: Mobile → Tablet → Desktop
// Every detail matters. Every pixel is intentional. Every interaction delights.
// ═══════════════════════════════════════════════════════════════════

import React, { useRef, Dispatch, SetStateAction, FormEvent, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
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

export default function AddExpenseModal({
    isOpen, onClose, onSave, formData, setFormData, categories = [], editingId = null
}: AddExpenseModalProps) {
    // ═══════════════════════════════════════════════════════════════
    // INTELLIGENT STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════
    const [isValidating, setIsValidating] = useState(false)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)

    // Refs for focus management and modal interaction
    const modalRef = useRef<HTMLDivElement | null>(null)
    const contentRef = useRef<HTMLDivElement | null>(null)
    const firstInputRef = useRef<HTMLInputElement | null>(null)
    const amountInputRef = useRef<HTMLInputElement | null>(null)
    const errorAlertRef = useRef<HTMLDivElement | null>(null)

    // Hooks
    useScrollLock(isOpen)
    useFocusTrap(isOpen, modalRef)
    const { formatCurrency } = useCurrency()
    const controls = useAnimationControls()

    // Category options
    const categoryOptions = categories.length > 0 ? categories : DEFAULT_CATEGORIES

    // ═══════════════════════════════════════════════════════════════
    // RESPONSIVE DETECTION
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // FIELD-LEVEL VALIDATION (Real-time per field)
    // ═══════════════════════════════════════════════════════════════
    const validateField = useCallback((fieldName: string, value: any) => {
        const errors: Record<string, string> = {}

        switch (fieldName) {
            case 'description':
                if (!value?.trim()) errors.description = 'Obrigatório'
                else if (value.length > 100) errors.description = 'Máx 100 caracteres'
                break

            case 'amount':
                const amount = parseFloat(value || '0')
                if (!value || isNaN(amount) || amount <= 0) errors.amount = 'Deve ser > 0'
                else if (amount > 1000000) errors.amount = 'Máx R$ 1M'
                break

            case 'quantity':
                const qty = parseInt(String(value || '0'))
                if (!value || isNaN(qty) || qty <= 0) errors.quantity = 'Deve ser > 0'
                else if (qty > 10000) errors.quantity = 'Máx 10.000'
                break

            case 'category':
                if (!value) errors.category = 'Obrigatório'
                break

            case 'date':
                if (!value) errors.date = 'Obrigatório'
                break
        }

        setFieldErrors(prev => {
            const newErrors = { ...prev }
            if (errors[fieldName]) {
                newErrors[fieldName] = errors[fieldName]
            } else {
                delete newErrors[fieldName]
            }
            return newErrors
        })

        return Object.keys(errors).length === 0
    }, [])

    // Mark field as touched
    const handleFieldBlur = useCallback((fieldName: string) => {
        setTouchedFields(prev => new Set([...prev, fieldName]))
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // COMPREHENSIVE VALIDATION
    // ═══════════════════════════════════════════════════════════════
    const validateForm = useCallback(() => {
        const errors: string[] = []
        const fields: Record<string, string> = {}

        if (!formData.description?.trim()) {
            errors.push('Informe o nome da despesa')
            fields.description = 'Obrigatório'
        } else if (formData.description.length > 100) {
            errors.push('Nome muito longo (máx: 100 caracteres)')
            fields.description = 'Máx 100 caracteres'
        }

        const amount = parseFloat(formData.amount || '0')
        if (!formData.amount || isNaN(amount) || amount <= 0) {
            errors.push('Valor deve ser maior que zero')
            fields.amount = 'Deve ser > 0'
        } else if (amount > 1000000) {
            errors.push('Valor muito alto (máx: R$ 1.000.000)')
            fields.amount = 'Máx R$ 1M'
        }

        const quantity = parseInt(String(formData.quantity || '0'))
        if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
            errors.push('Quantidade deve ser maior que zero')
            fields.quantity = 'Deve ser > 0'
        } else if (quantity > 10000) {
            errors.push('Quantidade muito alta (máx: 10.000)')
            fields.quantity = 'Máx 10.000'
        }

        if (!formData.category) {
            errors.push('Selecione uma categoria')
            fields.category = 'Obrigatório'
        }

        if (!formData.date) {
            errors.push('Selecione a data')
            fields.date = 'Obrigatório'
        }

        setValidationErrors(errors)
        setFieldErrors(fields)

        // Mark all fields as touched
        setTouchedFields(new Set(['description', 'amount', 'quantity', 'category', 'date']))

        return errors.length === 0
    }, [formData])

    // Real-time validation on form changes
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                // Only validate touched fields
                touchedFields.forEach(field => {
                    validateField(field, formData[field as keyof ExpenseFormData])
                })
            }, 300)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [formData, isOpen, validateField, touchedFields])

    // ═══════════════════════════════════════════════════════════════
    // SCROLL TO ERROR
    // ═══════════════════════════════════════════════════════════════
    const scrollToError = useCallback(() => {
        if (errorAlertRef.current && contentRef.current) {
            errorAlertRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            })
        }
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // AUTO-FOCUS INTELLIGENCE
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                if (firstInputRef.current) {
                    firstInputRef.current.focus()
                }
            }, 300)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [isOpen])

    // ═══════════════════════════════════════════════════════════════
    // KEYBOARD SHORTCUTS (Enhanced with more shortcuts)
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!isOpen) return undefined

        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + S to save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                handleSaveWithValidation()
            }

            // Escape to close
            if (e.key === 'Escape') {
                handleClose()
            }

            // Cmd/Ctrl + Enter to save (alternative)
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleSaveWithValidation()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, formData])

    // ═══════════════════════════════════════════════════════════════
    // SAVE WITH VALIDATION & SUCCESS ANIMATION
    // ═══════════════════════════════════════════════════════════════
    const handleSaveWithValidation = async () => {
        setIsValidating(true)

        // Shake animation for errors
        if (!validateForm()) {
            controls.start({
                x: [0, -10, 10, -10, 10, 0],
                transition: { duration: 0.4 }
            })
            scrollToError()
            setIsValidating(false)
            return
        }

        // Simulate save (replace with actual save)
        setIsSaving(true)

        try {
            await new Promise(resolve => setTimeout(resolve, 600))
            onSave()

            // Success celebration
            setSaveSuccess(true)

            // Close after success animation
            setTimeout(() => {
                handleClose()
                setSaveSuccess(false)
            }, 1200)

        } catch (error) {
            setValidationErrors(['Erro ao salvar. Tente novamente.'])
        } finally {
            setIsSaving(false)
            setIsValidating(false)
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CLOSE HANDLER (with cleanup)
    // ═══════════════════════════════════════════════════════════════
    const handleClose = useCallback(() => {
        setValidationErrors([])
        setFieldErrors({})
        setTouchedFields(new Set())
        setIsValidating(false)
        setIsSaving(false)
        setSaveSuccess(false)
        onClose()
    }, [onClose])

    // ═══════════════════════════════════════════════════════════════
    // DATE SHORTCUTS
    // ═══════════════════════════════════════════════════════════════
    const setDateShortcut = (days: number) => {
        const date = new Date()
        date.setDate(date.getDate() + days)
        setFormData(p => ({ ...p, date: date.toISOString().split('T')[0] }))
        handleFieldBlur('date')
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER: THE ULTIMATE MASTERPIECE
    // ═══════════════════════════════════════════════════════════════
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center p-0 md:p-4">
                    {/* PREMIUM BACKDROP */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute inset-0 bg-black/60 dark:bg-black/75"
                        onClick={handleClose}
                        style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
                    />

                    {/* MODAL CONTAINER — Responsive sizing */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="expense-modal-title"
                        initial={{
                            y: isDesktop ? 20 : '100%',
                            scale: isDesktop ? 0.95 : 1,
                            opacity: 0
                        }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        exit={{
                            y: isDesktop ? 20 : '100%',
                            scale: isDesktop ? 0.95 : 1,
                            opacity: 0
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 40,
                            mass: 1,
                            velocity: 2
                        }}
                        className={`
                            relative w-full 
                            ${isDesktop ? 'max-w-[520px]' : 'max-w-full'}
                            ${isDesktop ? 'max-h-[85vh]' : 'max-h-[94vh]'}
                            ${isDesktop ? 'rounded-[28px]' : 'rounded-t-[36px]'}
                            overflow-hidden
                            flex flex-col
                        `}
                        style={{
                            boxShadow: isDesktop
                                ? `
                                    0 32px 96px rgba(0, 0, 0, 0.2),
                                    0 16px 48px rgba(0, 0, 0, 0.15),
                                    0 0 0 0.5px rgba(0, 0, 0, 0.1),
                                    inset 0 0 0 0.5px rgba(255, 255, 255, 0.1)
                                `
                                : `
                                    0 -12px 100px rgba(0,0,0,0.6)
                                `
                        }}
                    >
                        {/* GLASSMORPHISM BACKGROUND */}
                        <div
                            className="
                                absolute inset-0
                                bg-[#f2f2f7]/[0.97] dark:bg-[#000]/[0.97]
                                backdrop-blur-[50px] backdrop-saturate-[200%]
                            "
                            style={{
                                WebkitBackdropFilter: 'blur(50px) saturate(200%)'
                            }}
                        />

                        {/* CONTENT WITH SHAKE ANIMATION */}
                        <motion.div
                            className="relative flex flex-col h-full"
                            animate={controls}
                        >
                            {/* SUCCESS OVERLAY */}
                            <AnimatePresence>
                                {saveSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 backdrop-blur-xl"
                                    >
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 20
                                            }}
                                            className="flex flex-col items-center gap-5"
                                        >
                                            <motion.div
                                                className="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center"
                                                animate={{
                                                    boxShadow: [
                                                        '0 0 0 0px rgba(255,255,255,0.4)',
                                                        '0 0 0 20px rgba(255,255,255,0)',
                                                    ]
                                                }}
                                                transition={{
                                                    duration: 0.8,
                                                    repeat: Infinity,
                                                    repeatDelay: 0.2
                                                }}
                                            >
                                                <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </motion.div>
                                            <div className="text-center">
                                                <motion.p
                                                    className="text-white text-2xl font-bold"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                >
                                                    {editingId ? 'Atualizado!' : 'Salvo com sucesso!'}
                                                </motion.p>
                                                <motion.p
                                                    className="text-white/90 text-sm mt-2"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.2 }}
                                                >
                                                    Despesa registrada no sistema
                                                </motion.p>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* MOBILE HANDLE */}
                            {!isDesktop && (
                                <div className="flex justify-center pt-3 pb-1">
                                    <motion.div
                                        className="w-11 h-[5px] rounded-full bg-zinc-400/30 dark:bg-zinc-600/50"
                                        whileHover={{ scaleX: 1.2 }}
                                        transition={{ type: 'spring', stiffness: 400 }}
                                    />
                                </div>
                            )}

                            {/* PREMIUM HEADER */}
                            <div
                                className={`
                                    flex items-center justify-between
                                    ${isDesktop ? 'h-[64px] px-6' : 'h-[56px] px-5'}
                                    border-b border-[#c6c6c8]/20 dark:border-[#38383a]/50
                                    bg-gradient-to-b from-[#f2f2f7]/90 to-transparent dark:from-[#1c1c1e]/90
                                    backdrop-blur-[30px]
                                `}
                                style={{ WebkitBackdropFilter: 'blur(30px) saturate(150%)' }}
                            >
                                <motion.button
                                    onClick={handleClose}
                                    whileTap={{ scale: 0.95 }}
                                    whileHover={{ opacity: 0.7, x: -2 }}
                                    disabled={isSaving}
                                    aria-label="Cancelar (Esc)"
                                    className={`
                                        ${isDesktop ? 'text-[16px]' : 'text-[17px]'} 
                                        text-[#007aff] font-medium 
                                        transition-all disabled:opacity-50
                                        flex items-center gap-2
                                    `}
                                >
                                    {isDesktop && (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                    )}
                                    Cancelar
                                </motion.button>

                                <div className="flex flex-col items-center">
                                    <span
                                        id="expense-modal-title"
                                        className={`${isDesktop ? 'text-[18px]' : 'text-[17px]'} font-bold text-[#1d1d1f] dark:text-white`}
                                    >
                                        {editingId ? 'Editar Despesa' : 'Nova Despesa'}
                                    </span>
                                    <span className="text-[11px] text-[#8e8e93] mt-0.5 flex items-center gap-1.5">
                                        <kbd className="px-1.5 py-0.5 bg-[#8e8e93]/10 rounded text-[10px] font-bold">⌘S</kbd>
                                        {isDesktop && <span className="text-[#8e8e93]/50">ou</span>}
                                        {isDesktop && <kbd className="px-1.5 py-0.5 bg-[#8e8e93]/10 rounded text-[10px] font-bold">⌘↵</kbd>}
                                    </span>
                                </div>

                                <motion.button
                                    onClick={handleSaveWithValidation}
                                    disabled={isSaving || saveSuccess}
                                    whileTap={{ scale: (Object.keys(fieldErrors).length === 0 && !isSaving) ? 0.95 : 1 }}
                                    whileHover={{
                                        opacity: (Object.keys(fieldErrors).length === 0 && !isSaving) ? 0.7 : 1,
                                        x: (Object.keys(fieldErrors).length === 0 && !isSaving) ? 2 : 0
                                    }}
                                    className={`
                                        relative ${isDesktop ? 'text-[16px]' : 'text-[17px]'} font-bold
                                        transition-all duration-250
                                        ${(Object.keys(fieldErrors).length === 0 && !isSaving) ? 'text-[#007aff]' : 'text-[#007aff]/30'}
                                        flex items-center gap-2
                                    `}
                                >
                                    <AnimatePresence>
                                        {isSaving && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0 }}
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    className="w-5 h-5 border-2 border-[#007aff]/30 border-t-[#007aff] rounded-full"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <span className={isSaving ? 'opacity-0' : ''}>
                                        Salvar
                                    </span>
                                    {isDesktop && !isSaving && (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    )}
                                </motion.button>
                            </div>

                            {/* VALIDATION ERRORS */}
                            <AnimatePresence>
                                {validationErrors.length > 0 && (
                                    <motion.div
                                        ref={errorAlertRef}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className={`${isDesktop ? 'mx-6 mt-4' : 'mx-4 mt-3'} p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl`}>
                                            <div className="flex items-start gap-3">
                                                <motion.svg
                                                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </motion.svg>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-red-900 dark:text-red-300 mb-1.5">
                                                        {validationErrors.length} {validationErrors.length === 1 ? 'erro encontrado' : 'erros encontrados'}
                                                    </p>
                                                    <ul className="space-y-1">
                                                        {validationErrors.map((error, i) => (
                                                            <motion.li
                                                                key={i}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: i * 0.05 }}
                                                                className="text-xs text-red-700 dark:text-red-400"
                                                            >
                                                                • {error}
                                                            </motion.li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* CONTENT — Scrollable */}
                            <div
                                ref={contentRef}
                                className={`flex-1 overflow-y-auto ${isDesktop ? 'py-6' : 'py-5'} custom-scrollbar`}
                                style={{
                                    scrollBehavior: 'smooth'
                                }}
                            >
                                <Section icon={Icons.calendar} title="Identificação" delay={0}>
                                    <div className="relative">
                                        <NameInput
                                            value={formData.description || ''}
                                            onChange={e => {
                                                setFormData(p => ({ ...p, description: e.target.value }))
                                                handleFieldBlur('description')
                                            }}
                                            placeholder="Nome da despesa"
                                            inputRef={firstInputRef}
                                        />
                                        {touchedFields.has('description') && fieldErrors.description && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                            >
                                                <div className="relative group">
                                                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    <div className="absolute right-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                                            {fieldErrors.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                    <Row label="Data" last>
                                        <div className="flex items-center gap-2">
                                            {isDesktop && (
                                                <div className="flex gap-1">
                                                    <motion.button
                                                        type="button"
                                                        onClick={() => setDateShortcut(0)}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="px-2 py-1 text-[11px] font-medium text-[#007aff] bg-[#007aff]/10 rounded-lg hover:bg-[#007aff]/20 transition-colors"
                                                    >
                                                        Hoje
                                                    </motion.button>
                                                    <motion.button
                                                        type="button"
                                                        onClick={() => setDateShortcut(-1)}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="px-2 py-1 text-[11px] font-medium text-[#8e8e93] bg-[#8e8e93]/10 rounded-lg hover:bg-[#8e8e93]/20 transition-colors"
                                                    >
                                                        Ontem
                                                    </motion.button>
                                                </div>
                                            )}
                                            <AppleDatePicker
                                                value={formData.date}
                                                onChange={date => {
                                                    setFormData(p => ({ ...p, date }))
                                                    handleFieldBlur('date')
                                                }}
                                            />
                                        </div>
                                    </Row>
                                </Section>

                                <Section icon={Icons.dollar} title="Valor" delay={1}>
                                    <div className={`${isDesktop ? 'px-5 py-3' : 'px-4 py-3'}`}>
                                        <SegmentedControl
                                            value={formData.type || 'Variável'}
                                            options={EXPENSE_TYPES}
                                            onChange={type => setFormData(p => ({ ...p, type: type as 'Fixo' | 'Variável' }))}
                                        />
                                    </div>
                                    <Row label="Valor Unitário">
                                        <SmartInput
                                            value={formData.amount || ''}
                                            onChange={e => {
                                                setFormData(p => ({ ...p, amount: e.target.value }))
                                                handleFieldBlur('amount')
                                            }}
                                            placeholder="0.00"
                                            inputMode="decimal"
                                            format="currency"
                                            prefix="R$"
                                            width={isDesktop ? "w-32" : "w-28"}
                                        />
                                    </Row>
                                    <Row label="Quantidade" last>
                                        <SmartInput
                                            value={formData.quantity || '1'}
                                            onChange={e => {
                                                setFormData(p => ({ ...p, quantity: e.target.value }))
                                                handleFieldBlur('quantity')
                                            }}
                                            placeholder="1"
                                            inputMode="numeric"
                                            format="integer"
                                            width="w-16"
                                        />
                                    </Row>
                                </Section>

                                <Section icon={Icons.tag} title="Categoria" delay={2}>
                                    <CategoryGrid
                                        value={formData.category}
                                        options={categoryOptions}
                                        onChange={category => {
                                            setFormData(p => ({ ...p, category }))
                                            handleFieldBlur('category')
                                        }}
                                    />
                                </Section>

                                {isDesktop && (
                                    <Section icon={Icons.link} title="Anexos" delay={3}>
                                        <Row label="Link" last>
                                            <input
                                                type="url"
                                                value={formData.link || ''}
                                                onChange={e => setFormData(p => ({ ...p, link: e.target.value }))}
                                                placeholder="https://..."
                                                className="bg-transparent text-[17px] text-[#007aff] font-medium outline-none text-right w-64 placeholder:text-[#aeaeb2] focus:placeholder:text-[#007aff]/30 transition-all"
                                            />
                                        </Row>
                                    </Section>
                                )}

                                <SummaryCard
                                    total={formData.amount}
                                    quantity={formData.quantity}
                                    formatCurrency={formatCurrency}
                                />

                                <div className="h-10" />
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
