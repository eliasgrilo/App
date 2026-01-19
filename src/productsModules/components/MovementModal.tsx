// ═══════════════════════════════════════════════════════════════════
// MovementModal — ABSOLUTE APPLE PERFECTION
// Every pixel matters. Every animation has purpose. Every detail is magic.
// ═══════════════════════════════════════════════════════════════════

import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import ModalScrollLock from '../../components/ModalScrollLock'
import { MovementModalProps, TypeSelector, ItemSearchField, QuantityFields, ReasonFields } from './movementModalModules'

export function MovementModal({
    open, form, itemSearch, filteredItems, selectedItem, showItemResults, getStock,
    setForm, setItemSearch, setShowItemResults, setOpen, onSave, onSelectItem, onClearItem, onChangeType
}: MovementModalProps) {
    // DEBUG - Track modal state
    console.log('🔍 MovementModal render - open:', open, 'form:', form)

    // ═══════════════════════════════════════════════════════════════
    // INTELLIGENT STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════
    const [isValidating, setIsValidating] = useState(false)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Smart refs for focus management
    const firstInputRef = useRef<HTMLButtonElement | null>(null)
    const itemSearchRef = useRef<HTMLInputElement | null>(null)

    // Animation controls for advanced choreography
    const controls = useAnimationControls()

    // ═══════════════════════════════════════════════════════════════
    // INTELLIGENT VALIDATION (Real-time)
    // ═══════════════════════════════════════════════════════════════
    const validateForm = useCallback(() => {
        const errors: string[] = []

        if (!form.itemId || form.itemId === 0) {
            errors.push('Selecione um ingrediente')
        }

        const qty = parseFloat(form.qty)
        if (!form.qty || isNaN(qty) || qty <= 0) {
            errors.push('Quantidade deve ser maior que zero')
        }

        if (qty > 10000) {
            errors.push('Quantidade muito alta (máx: 10.000)')
        }

        if (!form.reasonLabel && !form.reasonNote.trim()) {
            errors.push('Informe o motivo da movimentação')
        }

        setValidationErrors(errors)
        return errors.length === 0
    }, [form])

    // Real-time validation on form changes
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => validateForm(), 300)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [form, open, validateForm])

    // ═══════════════════════════════════════════════════════════════
    // AUTO-FOCUS INTELLIGENCE
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (open) {
            // Smart focus: if no item selected, focus search. Otherwise, focus quantity
            const timer = setTimeout(() => {
                if (!selectedItem && itemSearchRef.current) {
                    itemSearchRef.current.focus()
                } else if (firstInputRef.current) {
                    firstInputRef.current.focus()
                }
            }, 300) // After modal animation completes
            return () => clearTimeout(timer)
        }
        return undefined
    }, [open, selectedItem])

    // ═══════════════════════════════════════════════════════════════
    // KEYBOARD SHORTCUTS (⌘ + shortcuts)
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!open) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + S to save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                handleSaveWithValidation()
            }

            // Escape to close
            if (e.key === 'Escape') {
                setOpen(false)
            }

            // Tab navigation enhancement (future)
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, form])

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
            setIsValidating(false)
            return
        }

        // Simulate save (replace with actual save)
        setIsSaving(true)

        try {
            await new Promise(resolve => setTimeout(resolve, 600)) // Simulated API call
            onSave()

            // Success celebration
            setSaveSuccess(true)

            // Close after success animation
            setTimeout(() => {
                setOpen(false)
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
        setIsValidating(false)
        setIsSaving(false)
        setSaveSuccess(false)
        setOpen(false)
    }, [setOpen])

    // ═══════════════════════════════════════════════════════════════
    // RENDER: THE MASTERPIECE
    // ═══════════════════════════════════════════════════════════════
    console.log('🎬 Rendering portal, open:', open)

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[10000] flex items-start justify-center">
                    <ModalScrollLock />

                    {/* PREMIUM BACKDROP — Enhanced Blur */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(32px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute inset-0 bg-black/60 dark:bg-black/75"
                        onClick={handleClose}
                        style={{ WebkitBackdropFilter: 'blur(32px)' }}
                    />

                    {/* MODAL CONTAINER — Physics-based Animation */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 40,
                            mass: 1,
                            velocity: 2
                        }}
                        className="
                            relative w-full max-w-md
                            mx-4 mt-16 md:mt-20
                            rounded-[32px]
                            overflow-hidden
                        "
                        style={{
                            marginTop: 'max(calc(env(safe-area-inset-top, 0px) + 64px), 64px)',
                        }}
                    >
                        {/* GLASSMORPHISM — True Frosted Glass */}
                        <div className="
                            absolute inset-0
                            bg-white/[0.85] dark:bg-zinc-900/[0.85]
                            backdrop-blur-[40px] backdrop-saturate-[180%]
                            border border-white/20 dark:border-white/10
                        "
                            style={{
                                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                                boxShadow: `
                                    0 24px 80px rgba(0, 0, 0, 0.15),
                                    0 12px 32px rgba(0, 0, 0, 0.12),
                                    0 0 0 0.5px rgba(0, 0, 0, 0.06),
                                    inset 0 0 0 0.5px rgba(255, 255, 255, 0.1)
                                `
                            }}
                        />

                        {/* CONTENT — Relative to glass background + Shake animation */}
                        <motion.div
                            className="relative"
                            animate={controls}
                        >
                            {/* SUCCESS OVERLAY — Celebration Animation */}
                            <AnimatePresence>
                                {saveSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-500/95 backdrop-blur-xl"
                                    >
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 20
                                            }}
                                            className="flex flex-col items-center gap-4"
                                        >
                                            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-white text-xl font-bold">Salvo com sucesso!</p>
                                                <p className="text-white/80 text-sm mt-1">Movimentação registrada</p>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* HEADER — Refined with Subtitle */}
                            <div className="px-6 pt-6 pb-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 text-center pt-1">
                                        <motion.h3
                                            className="text-[20px] font-bold text-zinc-900 dark:text-white tracking-tight"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            Nova Movimentação
                                        </motion.h3>
                                        <motion.p
                                            className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mt-1"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.15 }}
                                        >
                                            Registre entradas e saídas de estoque
                                        </motion.p>

                                        {/* Keyboard Hint */}
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-[11px] text-zinc-400 mt-2 flex items-center justify-center gap-1.5"
                                        >
                                            <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold">⌘S</kbd>
                                            <span>para salvar</span>
                                        </motion.p>
                                    </div>

                                    {/* CLOSE BUTTON — Premium */}
                                    <motion.button
                                        onClick={handleClose}
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        className="
                                            w-10 h-10 -mt-1 -mr-1
                                            flex items-center justify-center 
                                            rounded-full 
                                            text-zinc-400 dark:text-zinc-500
                                            hover:text-zinc-600 dark:hover:text-zinc-300
                                            hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50
                                            transition-colors duration-200
                                        "
                                        aria-label="Fechar (Esc)"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                            </div>

                            {/* DIVIDER — Gradient */}
                            <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700/50 to-transparent mx-6" />

                            {/* VALIDATION ERRORS — Inline Premium Alert */}
                            <AnimatePresence>
                                {validationErrors.length > 0 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl">
                                            <div className="flex items-start gap-3">
                                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">
                                                        Atenção
                                                    </p>
                                                    <ul className="space-y-1">
                                                        {validationErrors.map((error, i) => (
                                                            <li key={i} className="text-xs text-red-700 dark:text-red-400">
                                                                • {error}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* FORM CONTENT */}
                            <div className="px-6 py-6 space-y-6 max-h-[calc(100vh-340px)] overflow-y-auto">
                                <TypeSelector form={form} onChangeType={onChangeType} firstInputRef={firstInputRef} />
                                <ItemSearchField
                                    selectedItem={selectedItem}
                                    itemSearch={itemSearch}
                                    filteredItems={filteredItems}
                                    showItemResults={showItemResults}
                                    getStock={getStock}
                                    setItemSearch={setItemSearch}
                                    setForm={setForm}
                                    setShowItemResults={setShowItemResults}
                                    onSelectItem={onSelectItem}
                                    onClearItem={onClearItem}
                                    inputRef={itemSearchRef}
                                />
                                <QuantityFields form={form} setForm={setForm} selectedItem={selectedItem} />
                                <ReasonFields form={form} setForm={setForm} />
                            </div>

                            {/* ACTIONS FOOTER — Premium Buttons */}
                            <div className="px-6 pb-6 pt-4 bg-gradient-to-t from-zinc-50/50 dark:from-zinc-800/30">
                                <div className="flex gap-3">
                                    {/* Cancel */}
                                    <motion.button
                                        onClick={handleClose}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isSaving}
                                        className="
                                            flex-1 h-14
                                            rounded-[17px]
                                            font-semibold text-[16px]
                                            text-zinc-700 dark:text-zinc-300
                                            bg-zinc-100/90 dark:bg-zinc-800/90
                                            hover:bg-zinc-200 dark:hover:bg-zinc-700
                                            active:bg-zinc-300/90 dark:active:bg-zinc-600/90
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            transition-all duration-200
                                            border border-zinc-200/60 dark:border-zinc-700/60
                                        "
                                    >
                                        Cancelar
                                    </motion.button>

                                    {/* Save — With Loading State */}
                                    <motion.button
                                        onClick={handleSaveWithValidation}
                                        whileHover={{ scale: isSaving ? 1 : 1.02 }}
                                        whileTap={{ scale: isSaving ? 1 : 0.98 }}
                                        disabled={isSaving || saveSuccess}
                                        className="
                                            relative flex-[1.6] h-14
                                            rounded-[17px]
                                            font-bold text-[16px]
                                            text-white dark:text-zinc-900
                                            bg-gradient-to-b from-zinc-800 to-zinc-900 dark:from-white dark:to-zinc-50
                                            hover:from-zinc-700 hover:to-zinc-800 dark:hover:from-zinc-50 dark:hover:to-zinc-100
                                            disabled:opacity-70 disabled:cursor-not-allowed
                                            transition-all duration-200
                                            shadow-lg shadow-zinc-900/30 dark:shadow-white/20
                                            overflow-hidden
                                        "
                                    >
                                        {/* Loading Spinner */}
                                        <AnimatePresence>
                                            {isSaving && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 flex items-center justify-center bg-inherit"
                                                >
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        className="w-5 h-5 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <span className={isSaving ? 'opacity-0' : ''}>
                                            Salvar Movimentação
                                        </span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
