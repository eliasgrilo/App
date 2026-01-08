/**
 * ═══════════════════════════════════════════════════════════════════
 * SuppliersGrid — Magnificent Apple-Quality Hero Card Animation
 * Two-phase animation: FLY to center → EXPAND dimensions
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { createPortal } from 'react-dom'
import type { LocalSupplier } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface SuppliersGridProps {
    suppliers: LocalSupplier[]
    onSupplierClick: (supplier: LocalSupplier) => void
    onEditClick: (supplier: LocalSupplier) => void
    onAddClick: () => void
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATION CONFIG — Apple-Quality Refined Timings
// ═══════════════════════════════════════════════════════════════════

// Entry: Fast and fluid
const SPRING_ENTRY = {
    type: 'spring' as const,
    stiffness: 450,
    damping: 35,
    mass: 0.6
}

// Exit: Elegant and refined 
const EASE_EXIT = {
    type: 'tween' as const,
    duration: 0.35,
    ease: [0.32, 0.72, 0, 1] as [number, number, number, number]
}

const SPRING_SMOOTH = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 38,
    mass: 0.6
}

// ═══════════════════════════════════════════════════════════════════
// HERO EXPANDED CARD — Two-phase magnificent animation
// ═══════════════════════════════════════════════════════════════════

interface HeroCardProps {
    supplier: LocalSupplier
    originRect: DOMRect
    onClose: () => void
    onEdit: (supplier: LocalSupplier) => void
}

function HeroExpandedCard({ supplier, originRect, onClose, onEdit }: HeroCardProps) {
    const controls = useAnimation()
    const [phase, setPhase] = useState<'flying' | 'expanding' | 'ready' | 'closing'>('flying')

    const hasLinkedItems = (supplier.linkedItems?.length ?? 0) > 0
    const hasNotes = !!supplier.notes?.trim()
    const hasAddress = !!supplier.address?.trim()

    // Calculate dimensions
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 768

    // Expanded dimensions — LARGER to avoid scrollbar
    const expandedWidth = Math.min(620, windowWidth - 48)
    const expandedHeight = Math.min(680, windowHeight - 60)
    const expandedX = (windowWidth - expandedWidth) / 2
    const expandedY = (windowHeight - expandedHeight) / 2

    // Lock scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    // Run single fluid entry animation
    useEffect(() => {
        const runAnimation = async () => {
            // Single fluid motion: fly AND expand together
            await controls.start({
                x: expandedX,
                y: expandedY,
                width: expandedWidth,
                height: expandedHeight,
                transition: SPRING_ENTRY
            })
            setPhase('ready')
        }
        runAnimation()
    }, [controls, expandedX, expandedY, expandedWidth, expandedHeight])

    // Action handlers
    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (supplier.phone) window.location.href = `tel:${supplier.phone}`
    }

    const handleEmail = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (supplier.email) window.location.href = `mailto:${supplier.email}`
    }

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation()
        const phone = supplier.whatsapp || supplier.phone
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '')
            window.open(`https://wa.me/55${cleanPhone}`, '_blank')
        }
    }

    const handleClose = async () => {
        setPhase('closing')

        // Apple exit: card stays visible, animates back to origin fully
        // Only fades at the very end for seamless merge with grid card
        await controls.start({
            width: originRect.width,
            height: originRect.height,
            x: originRect.left,
            y: originRect.top,
            scale: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 400,
                damping: 35,
                mass: 0.7
            }
        })

        // Quick final fade
        await controls.start({
            opacity: 0,
            transition: { duration: 0.1 }
        })

        onClose()
    }

    return createPortal(
        <div className="fixed inset-0 z-[60000]">
            {/* Backdrop — fades with slight delay during closing */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === 'closing' ? 0 : 1 }}
                transition={{ duration: phase === 'closing' ? 0.3 : 0.25 }}
                className="absolute inset-0 bg-black/40"
                style={{
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                }}
                onClick={handleClose}
            />

            {/* The Magnificent Hero Card */}
            <motion.div
                animate={controls}
                initial={{
                    x: originRect.left,
                    y: originRect.top,
                    width: originRect.width,
                    height: originRect.height,
                    opacity: 1,
                }}
                className="fixed bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden"
                style={{
                    boxShadow: phase === 'ready'
                        ? '0 60px 120px -20px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.1) inset'
                        : '0 25px 50px -12px rgba(0,0,0,0.25)',
                    willChange: 'transform, width, height',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Content Container */}
                <div className="w-full h-full overflow-y-auto overflow-x-hidden">

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* HEADER — Visible during all phases */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <div className="p-6">
                        {/* Close Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: phase !== 'flying' ? 1 : 0, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            onClick={handleClose}
                            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-zinc-100/90 dark:bg-zinc-800/90 backdrop-blur-sm flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all z-20"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>

                        {/* Avatar + Name */}
                        <div className="flex items-start gap-5 pr-14">
                            <motion.div
                                animate={{
                                    width: phase === 'ready' ? 72 : 56,
                                    height: phase === 'ready' ? 72 : 56,
                                }}
                                transition={SPRING_SMOOTH}
                                className="rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-xl shadow-violet-500/30 shrink-0"
                                style={{ fontSize: phase === 'ready' ? '28px' : '20px' }}
                            >
                                {supplier.name?.charAt(0)?.toUpperCase() || '?'}
                            </motion.div>
                            <div className="flex-1 min-w-0 pt-1">
                                <motion.h2
                                    animate={{ fontSize: phase === 'ready' ? '24px' : '18px' }}
                                    transition={SPRING_SMOOTH}
                                    className="font-bold text-zinc-900 dark:text-white tracking-tight"
                                >
                                    {supplier.name}
                                </motion.h2>
                                {supplier.company && (
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {supplier.company}
                                    </p>
                                )}

                                {/* Contact pills */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: phase === 'ready' ? 1 : 0, y: phase === 'ready' ? 0 : 10 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex flex-wrap gap-2 mt-3"
                                >
                                    {supplier.phone && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400">
                                            📞 {supplier.phone}
                                        </span>
                                    )}
                                    {supplier.email && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">
                                            ✉️ {supplier.email}
                                        </span>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* EXPANDED CONTENT — Only visible when ready */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <AnimatePresence>
                        {phase === 'ready' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.25 }}
                                className="px-6 pb-6 space-y-5"
                            >
                                {/* Quick Actions Row */}
                                <div className="flex gap-3">
                                    <motion.button
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 }}
                                        onClick={handleCall}
                                        disabled={!supplier.phone}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex-1 flex items-center justify-center gap-3 px-5 py-4 rounded-2xl transition-all ${supplier.phone
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                            : 'bg-zinc-100 dark:bg-zinc-800/50 opacity-40 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${supplier.phone
                                            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25'
                                            : 'bg-zinc-300 dark:bg-zinc-700'
                                            }`}>
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <span className={`text-sm font-semibold ${supplier.phone ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-400'}`}>
                                            Ligar
                                        </span>
                                    </motion.button>

                                    <motion.button
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        onClick={handleEmail}
                                        disabled={!supplier.email}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex-1 flex items-center justify-center gap-3 px-5 py-4 rounded-2xl transition-all ${supplier.email
                                            ? 'bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                                            : 'bg-zinc-100 dark:bg-zinc-800/50 opacity-40 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${supplier.email
                                            ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/25'
                                            : 'bg-zinc-300 dark:bg-zinc-700'
                                            }`}>
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className={`text-sm font-semibold ${supplier.email ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-400'}`}>
                                            Email
                                        </span>
                                    </motion.button>

                                    <motion.button
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        onClick={handleWhatsApp}
                                        disabled={!supplier.whatsapp && !supplier.phone}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex-1 flex items-center justify-center gap-3 px-5 py-4 rounded-2xl transition-all ${(supplier.whatsapp || supplier.phone)
                                            ? 'bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20'
                                            : 'bg-zinc-100 dark:bg-zinc-800/50 opacity-40 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${(supplier.whatsapp || supplier.phone)
                                            ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/25'
                                            : 'bg-zinc-300 dark:bg-zinc-700'
                                            }`}>
                                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                        </div>
                                        <span className={`text-sm font-semibold ${(supplier.whatsapp || supplier.phone) ? 'text-green-700 dark:text-green-400' : 'text-zinc-400'}`}>
                                            WhatsApp
                                        </span>
                                    </motion.button>
                                </div>

                                {/* Address */}
                                {hasAddress && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Endereço</span>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{supplier.address}</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Linked Items */}
                                {hasLinkedItems && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                            <span className="text-base font-bold text-zinc-900 dark:text-white">
                                                {supplier.linkedItems?.length} Itens Vinculados
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {supplier.linkedItems?.slice(0, 8).map((item) => (
                                                <span
                                                    key={item.itemId}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 text-sm font-medium text-violet-800 dark:text-violet-200"
                                                >
                                                    📦 {item.itemName}
                                                </span>
                                            ))}
                                            {(supplier.linkedItems?.length ?? 0) > 8 && (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-500">
                                                    +{(supplier.linkedItems?.length ?? 0) - 8} mais
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Notes */}
                                {hasNotes && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl px-4 py-4 border border-amber-200/50 dark:border-amber-500/20"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-amber-500">📝</span>
                                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Observações</span>
                                        </div>
                                        <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                                            {supplier.notes}
                                        </p>
                                    </motion.div>
                                )}

                                {/* Edit Button */}
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.35 }}
                                    onClick={(e) => { e.stopPropagation(); onEdit(supplier); handleClose() }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm hover:opacity-90 transition-opacity"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Editar Fornecedor
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>,
        document.body
    )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function SuppliersGrid({ suppliers, onSupplierClick, onEditClick, onAddClick }: SuppliersGridProps) {
    const [selectedSupplier, setSelectedSupplier] = useState<LocalSupplier | null>(null)
    const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null)
    const [expandedItemsId, setExpandedItemsId] = useState<string | number | null>(null)
    const cardRefs = useRef<Map<string | number, HTMLDivElement>>(new Map())

    const handleCardClick = (supplier: LocalSupplier) => {
        const cardEl = cardRefs.current.get(supplier.id)
        if (cardEl) {
            setSelectedRect(cardEl.getBoundingClientRect())
            setSelectedSupplier(supplier)
        }
    }

    const handleClose = () => {
        setSelectedSupplier(null)
        setSelectedRect(null)
    }

    const toggleItemsExpand = (e: React.MouseEvent, supplierId: string | number) => {
        e.stopPropagation()
        setExpandedItemsId(prev => prev === supplierId ? null : supplierId)
    }

    if (suppliers.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-12 border border-zinc-200/50 dark:border-white/10 text-center">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Nenhum fornecedor</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">Adicione seu primeiro fornecedor para começar</p>
                <button onClick={onAddClick} className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all">
                    Adicionar Fornecedor
                </button>
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">
                {suppliers.map((supplier) => {
                    const isItemsExpanded = expandedItemsId === supplier.id
                    const hasLinkedItems = (supplier.linkedItems?.length ?? 0) > 0
                    const isHidden = selectedSupplier?.id === supplier.id

                    return (
                        <motion.div
                            key={supplier.id}
                            ref={(el) => { if (el) cardRefs.current.set(supplier.id, el) }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity: isHidden ? 0 : 1,
                                y: 0,
                            }}
                            whileHover={{ y: -4, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            transition={SPRING_SMOOTH}
                            onClick={() => handleCardClick(supplier)}
                            className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10 shadow-lg hover:shadow-2xl transition-shadow cursor-pointer"
                        >
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-4 relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEditClick(supplier) }}
                                    className="absolute top-0 right-0 w-10 h-10 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-indigo-500 transition-all shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 z-10"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-violet-500/25">
                                    {supplier.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0 pr-12">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{supplier.name}</h3>
                                    {supplier.company && <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{supplier.company}</p>}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2 mb-4">
                                {supplier.phone && (
                                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="truncate">{supplier.phone}</span>
                                    </div>
                                )}
                                {supplier.email && (
                                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="truncate">{supplier.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Linked Items Badge */}
                            {hasLinkedItems && (
                                <div className="space-y-2 relative z-50">
                                    <motion.button
                                        data-supplier-btn={supplier.id}
                                        onClick={(e) => toggleItemsExpand(e, supplier.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border transition-all ${isItemsExpanded
                                            ? 'bg-violet-100 dark:bg-violet-500/20 border-violet-200 dark:border-violet-500/30'
                                            : 'bg-violet-50/80 dark:bg-violet-500/10 border-violet-100/80 dark:border-violet-500/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                                                {supplier.linkedItems?.length ?? 0} itens
                                            </span>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isItemsExpanded ? 180 : 0 }}
                                            transition={SPRING_SMOOTH}
                                            className="w-6 h-6 rounded-full bg-violet-200/80 dark:bg-violet-500/20 flex items-center justify-center"
                                        >
                                            <svg className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </motion.div>
                                    </motion.button>

                                    {/* Portal Dropdown - Renders above everything */}
                                    {isItemsExpanded && createPortal(
                                        <div
                                            className="fixed inset-0 z-[99999]"
                                            onClick={(e) => { e.stopPropagation(); toggleItemsExpand(e as any, supplier.id) }}
                                        >
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                className="fixed bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                                                style={{
                                                    top: (() => {
                                                        const btn = document.querySelector(`[data-supplier-btn="${supplier.id}"]`)
                                                        if (btn) {
                                                            const rect = btn.getBoundingClientRect()
                                                            return rect.bottom + 8
                                                        }
                                                        return 200
                                                    })(),
                                                    left: (() => {
                                                        const btn = document.querySelector(`[data-supplier-btn="${supplier.id}"]`)
                                                        if (btn) {
                                                            const rect = btn.getBoundingClientRect()
                                                            return rect.left
                                                        }
                                                        return 100
                                                    })(),
                                                    width: (() => {
                                                        const btn = document.querySelector(`[data-supplier-btn="${supplier.id}"]`)
                                                        if (btn) {
                                                            const rect = btn.getBoundingClientRect()
                                                            return Math.max(rect.width, 280)
                                                        }
                                                        return 280
                                                    })(),
                                                    maxHeight: 280,
                                                    boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)'
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Scrollable Container */}
                                                <div className="overflow-y-auto max-h-[280px]">
                                                    {supplier.linkedItems?.map((item, index) => (
                                                        <div
                                                            key={item.itemId}
                                                            className={`flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${index !== (supplier.linkedItems?.length ?? 1) - 1
                                                                ? 'border-b border-zinc-100 dark:border-zinc-800'
                                                                : ''
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                                                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                    </svg>
                                                                </div>
                                                                <span className="text-[15px] font-semibold text-zinc-900 dark:text-white truncate">
                                                                    {item.itemName}
                                                                </span>
                                                            </div>

                                                            {/* Price */}
                                                            {(item as any).price !== undefined && (item as any).price > 0 && (
                                                                <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                                    ${(item as any).price.toFixed(2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </div>,
                                        document.body
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Hero Expanded Card */}
            <AnimatePresence>
                {selectedSupplier && selectedRect && (
                    <HeroExpandedCard
                        supplier={selectedSupplier}
                        originRect={selectedRect}
                        onClose={handleClose}
                        onEdit={onEditClick}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

export default SuppliersGrid
