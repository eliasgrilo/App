/**
 * InvoiceScanner Component - Premium Invoice Scanning Experience
 * Apple-Google Symbiosis: Gemini Vision + Apple Human Interface Guidelines
 * 
 * Features:
 * - Camera-based invoice capture with glassmorphism overlay
 * - AI-powered item extraction with confidence scoring
 * - Semantic product matching with existing inventory
 * - 60fps animations for imperceptible camera→DB transition
 * - Haptic orchestration at key moments
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { HapticService } from '../services/hapticService'
import { InvoiceScannerService } from '../services/invoiceScannerService'
import { ValidationService } from '../services/validationService'
import { PriceHistoryService } from '../services/priceHistoryService'
import { formatCurrency } from '../services/formatService'

// ═══════════════════════════════════════════════════════════════
// SEMANTIC ALIGNMENT BANNER - Interactive Name Confirmation
// ═══════════════════════════════════════════════════════════════

function SemanticAlignmentBanner({ suggestion, onAction }) {
    if (!suggestion) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
        >
            <div
                className="mx-4 mb-3 p-4 rounded-2xl border border-indigo-500/30"
                style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))',
                    backdropFilter: 'blur(10px)'
                }}
            >
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Mapeamento Semântico</span>
                        <p className="text-white/80 text-sm">{suggestion.messageShort}</p>
                    </div>
                    <span className="ml-auto text-xs text-indigo-400/70 font-medium">
                        {suggestion.data.confidencePercent}% match
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {suggestion.options.map((option) => (
                        <motion.button
                            key={option.id}
                            onClick={() => onAction(option.action)}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5
                                ${option.action === 'UPDATE_NAME'
                                    ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                                    : 'bg-white/10 text-white/80 hover:bg-white/15'
                                }`}
                            whileTap={{ scale: 0.97 }}
                        >
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════
// SCANNER STATES
// ═══════════════════════════════════════════════════════════════

const SCANNER_STATES = {
    CAMERA: 'camera',           // Frame 0: Camera viewfinder
    CAPTURING: 'capturing',     // Frame 1-10: Capture animation
    PROCESSING: 'processing',   // Frame 11-30: AI processing
    REVIEW: 'review',           // Frame 31-50: Review extracted items
    COMMITTING: 'committing',   // Frame 51-60: Commit animation
    SUCCESS: 'success',         // Complete
    ERROR: 'error'
}

// ═══════════════════════════════════════════════════════════════
// CAMERA VIEWFINDER COMPONENT
// ═══════════════════════════════════════════════════════════════

function CameraViewfinder({ onCapture, onClose }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [isReady, setIsReady] = useState(false)
    const [isSteady, setIsSteady] = useState(false)
    const steadyTimeoutRef = useRef(null)

    // Initialize camera
    useEffect(() => {
        let stream = null

        async function initCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                })

                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    await videoRef.current.play()
                    setIsReady(true)
                    HapticService.trigger('selection')
                }
            } catch (err) {
                console.error('Camera init failed:', err)
                HapticService.trigger('error')
            }
        }

        initCamera()

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    // Detect steadiness (simulated via timeout after focus)
    useEffect(() => {
        if (isReady) {
            steadyTimeoutRef.current = setTimeout(() => {
                setIsSteady(true)
                HapticService.trigger('selection')
            }, 1500)
        }

        return () => {
            if (steadyTimeoutRef.current) {
                clearTimeout(steadyTimeoutRef.current)
            }
        }
    }, [isReady])

    // Capture image
    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return

        HapticService.trigger('invoiceCapture')

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        onCapture(imageData)
    }, [onCapture])

    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            {/* Video Feed */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
            />

            {/* Hidden Canvas for Capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Corner Guides */}
                <div className="absolute inset-8 md:inset-16">
                    {/* Top Left */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-l-3 border-t-3 border-white/60 rounded-tl-2xl" />
                    {/* Top Right */}
                    <div className="absolute top-0 right-0 w-12 h-12 border-r-3 border-t-3 border-white/60 rounded-tr-2xl" />
                    {/* Bottom Left */}
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-l-3 border-b-3 border-white/60 rounded-bl-2xl" />
                    {/* Bottom Right */}
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-r-3 border-b-3 border-white/60 rounded-br-2xl" />
                </div>

                {/* Center Scanning Line (animated) */}
                {isReady && (
                    <motion.div
                        className="absolute left-8 right-8 md:left-16 md:right-16 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                        initial={{ top: '20%', opacity: 0 }}
                        animate={{
                            top: ['20%', '80%', '20%'],
                            opacity: [0.3, 0.8, 0.3]
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                )}
            </div>

            {/* Top Bar - Glassmorphism */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-safe">
                <div
                    className="flex items-center justify-between px-5 py-4 rounded-2xl"
                    style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex flex-col items-center">
                        <span className="text-white/90 text-sm font-semibold">Escanear Nota Fiscal</span>
                        <span className="text-white/50 text-xs">
                            {!isReady ? 'Iniciando câmera...' : isSteady ? 'Pronto para capturar' : 'Alinhe o documento'}
                        </span>
                    </div>

                    <div className="w-10 h-10" /> {/* Spacer */}
                </div>
            </div>

            {/* Bottom Controls - Glassmorphism */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe">
                <div
                    className="flex items-center justify-center py-6 rounded-3xl"
                    style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                >
                    {/* Capture Button */}
                    <motion.button
                        onClick={handleCapture}
                        disabled={!isReady}
                        className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl disabled:opacity-50"
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        {/* Inner ring */}
                        <div className="absolute inset-1 rounded-full border-4 border-black/10" />
                        {/* Ready indicator */}
                        {isSteady && (
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-emerald-500"
                                initial={{ scale: 1, opacity: 0 }}
                                animate={{ scale: [1, 1.2], opacity: [0.8, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════
// PROCESSING INDICATOR
// ═══════════════════════════════════════════════════════════════

function ProcessingIndicator({ imagePreview }) {
    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
            {/* Background Image (blurred) */}
            {imagePreview && (
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${imagePreview})`,
                        filter: 'blur(20px) brightness(0.3)'
                    }}
                />
            )}

            {/* Glassmorphism Card */}
            <motion.div
                className="relative z-10 flex flex-col items-center p-10 rounded-[2.5rem]"
                style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 25 }}
            >
                {/* AI Processing Animation */}
                <div className="relative w-24 h-24 mb-6">
                    {/* Outer ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-white/20"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Inner gradient ring */}
                    <motion.div
                        className="absolute inset-2 rounded-full"
                        style={{
                            background: 'conic-gradient(from 0deg, transparent, rgba(99, 102, 241, 0.8), transparent)'
                        }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Center icon */}
                    <div className="absolute inset-4 rounded-full bg-white/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                <h3 className="text-white text-xl font-semibold mb-2">Analisando com IA</h3>
                <p className="text-white/60 text-sm text-center max-w-xs">
                    Gemini está extraindo itens e valores da sua nota fiscal...
                </p>

                {/* Shimmer Effect */}
                <motion.div
                    className="mt-6 w-48 h-1.5 rounded-full bg-white/10 overflow-hidden"
                >
                    <motion.div
                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                        animate={{ x: ['-100%', '400%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                </motion.div>
            </motion.div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════
// ITEM REVIEW LIST
// ═══════════════════════════════════════════════════════════════

function ItemReviewList({
    items,
    existingProducts,
    onItemUpdate,
    onItemRemove,
    onCommit,
    onCancel,
    isCommitting
}) {
    // Track which items have pending semantic alignment decisions
    const [pendingSuggestions, setPendingSuggestions] = useState({})

    // Generate suggestions for items with matches that need review
    useEffect(() => {
        const suggestions = {}
        items.forEach((item, index) => {
            // Skip if already has alignment decision or if already matched with high confidence
            if (item.semanticAlignment || item.status === 'matched') return

            // Check if this item has a match that needs confirmation
            if (item.matchResult?.matchFound && item.matchResult?.confidence >= 0.7) {
                const suggestion = InvoiceScannerService.generateSuggestion(
                    item.rawName,
                    item.matchResult.matchedProduct,
                    item.matchResult.confidence
                )
                if (suggestion) {
                    suggestions[index] = suggestion
                }
            }
        })
        setPendingSuggestions(suggestions)
    }, [items])

    // Handle alignment action for an item
    const handleAlignmentAction = useCallback((itemIndex, action) => {
        const suggestion = pendingSuggestions[itemIndex]
        if (!suggestion) return

        const item = items[itemIndex]
        const alignedItem = InvoiceScannerService.applyAlignment(item, action, suggestion)

        // Update the item via parent callback
        onItemUpdate(itemIndex, alignedItem)

        // Remove from pending
        setPendingSuggestions(prev => {
            const next = { ...prev }
            delete next[itemIndex]
            return next
        })
    }, [items, pendingSuggestions, onItemUpdate])

    // Find the first item index with a pending suggestion
    const firstPendingSuggestionIndex = Object.keys(pendingSuggestions).map(Number)[0] ?? null

    const getStatusColor = (status) => {
        switch (status) {
            case 'matched': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
            case 'review': return 'bg-amber-500/20 text-amber-500 border-amber-500/30'
            case 'new': return 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30'
            default: return 'bg-zinc-500/20 text-zinc-500 border-zinc-500/30'
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'matched': return 'Encontrado'
            case 'review': return 'Revisar'
            case 'new': return 'Novo'
            default: return 'Desconhecido'
        }
    }

    const totalValue = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    const matchedCount = items.filter(i => i.status === 'matched').length
    const reviewCount = items.filter(i => i.status === 'review').length
    const newCount = items.filter(i => i.status === 'new').length

    return (
        <div className="flex flex-col h-full">
            {/* Header Stats */}
            <div
                className="flex-shrink-0 p-6 border-b border-white/10"
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)'
                }}
            >
                <h2 className="text-white text-2xl font-bold mb-4">Itens Extraídos</h2>

                <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 rounded-2xl bg-white/5">
                        <div className="text-2xl font-bold text-white">{items.length}</div>
                        <div className="text-[10px] text-white/50 uppercase tracking-wider">Total</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-emerald-500/10">
                        <div className="text-2xl font-bold text-emerald-400">{matchedCount}</div>
                        <div className="text-[10px] text-emerald-400/60 uppercase tracking-wider">Match</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-amber-500/10">
                        <div className="text-2xl font-bold text-amber-400">{reviewCount}</div>
                        <div className="text-[10px] text-amber-400/60 uppercase tracking-wider">Revisar</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-indigo-500/10">
                        <div className="text-2xl font-bold text-indigo-400">{newCount}</div>
                        <div className="text-[10px] text-indigo-400/60 uppercase tracking-wider">Novo</div>
                    </div>
                </div>
            </div>

            {/* Semantic Alignment Banner - Shows when AI finds matches needing confirmation */}
            <AnimatePresence>
                {firstPendingSuggestionIndex !== null && (
                    <SemanticAlignmentBanner
                        suggestion={pendingSuggestions[firstPendingSuggestionIndex]}
                        onAction={(action) => handleAlignmentAction(firstPendingSuggestionIndex, action)}
                    />
                )}
            </AnimatePresence>

            {/* Scrollable Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative rounded-2xl overflow-hidden"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}
                        >
                            <div className="p-4">
                                {/* Status Badge */}
                                <div className="flex items-start justify-between mb-2">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(item.status)}`}>
                                        {getStatusLabel(item.status)}
                                    </span>
                                    <button
                                        onClick={() => onItemRemove(index)}
                                        className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Product Name */}
                                <h4 className="text-white font-semibold text-lg mb-1">
                                    {item.canonicalName || item.rawName}
                                </h4>

                                {/* Original name if different */}
                                {item.canonicalName && item.rawName !== item.canonicalName && (
                                    <p className="text-white/40 text-xs mb-2">
                                        Original: {item.rawName}
                                    </p>
                                )}

                                {/* Matched Product Info */}
                                {item.matchResult?.matchedProduct && (
                                    <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-emerald-400 text-sm">
                                            Match: {item.matchResult.matchedProduct.name}
                                        </span>
                                        <span className="text-emerald-400/60 text-xs ml-auto">
                                            {Math.round(item.matchResult.confidence * 100)}%
                                        </span>
                                    </div>
                                )}

                                {/* Quantity & Price */}
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-white/70 text-sm">
                                            {item.quantity} {item.unit}
                                        </span>
                                        <span className="text-white/30">×</span>
                                        <span className="text-white/70 text-sm">
                                            {formatCurrency(item.unitPrice)}
                                        </span>
                                    </div>
                                    <span className="text-white font-bold text-lg">
                                        {formatCurrency(item.totalPrice)}
                                    </span>
                                </div>

                                {/* Confidence Bar */}
                                {item.confidence && (
                                    <div className="mt-3">
                                        <div className="flex justify-between text-[10px] mb-1">
                                            <span className="text-white/40">Confiança da Extração</span>
                                            <span className="text-white/60">{Math.round(item.confidence * 100)}%</span>
                                        </div>
                                        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                            <motion.div
                                                className={`h-full ${item.confidence >= 0.9 ? 'bg-emerald-500' : item.confidence >= 0.7 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.confidence * 100}%` }}
                                                transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Bottom Action Bar */}
            <div
                className="flex-shrink-0 p-4 border-t border-white/10"
                style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(20px)'
                }}
            >
                {/* Total */}
                <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-sm">Total da Nota</span>
                    <span className="text-white text-2xl font-bold">{formatCurrency(totalValue)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isCommitting}
                        className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-semibold hover:bg-white/15 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <motion.button
                        onClick={onCommit}
                        disabled={isCommitting || items.length === 0}
                        className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        whileTap={{ scale: 0.98 }}
                    >
                        {isCommitting ? (
                            <>
                                <motion.div
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Adicionar ao Estoque
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════
// SUCCESS VIEW
// ═══════════════════════════════════════════════════════════════

function SuccessView({ itemCount, totalValue, onClose }) {
    useEffect(() => {
        HapticService.trigger('batchCommit')
    }, [])

    return (
        <motion.div
            className="flex flex-col items-center justify-center h-full p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Success Animation */}
            <motion.div
                className="w-32 h-32 rounded-full bg-emerald-500/20 flex items-center justify-center mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, delay: 0.1 }}
            >
                <motion.div
                    className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                >
                    <motion.svg
                        className="w-12 h-12 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <motion.path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                        />
                    </motion.svg>
                </motion.div>
            </motion.div>

            <motion.h2
                className="text-white text-3xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                Estoque Atualizado!
            </motion.h2>

            <motion.p
                className="text-white/60 text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                {itemCount} {itemCount === 1 ? 'item adicionado' : 'itens adicionados'} ao inventário
            </motion.p>

            <motion.div
                className="text-emerald-400 text-4xl font-bold mb-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
            >
                +{formatCurrency(totalValue)}
            </motion.div>

            <motion.button
                onClick={onClose}
                className="px-8 py-4 rounded-2xl bg-white text-zinc-900 font-bold shadow-lg hover:bg-zinc-100 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileTap={{ scale: 0.98 }}
            >
                Concluído
            </motion.button>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════
// MAIN INVOICE SCANNER COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function InvoiceScanner({
    existingProducts = [],
    onComplete,
    onClose,
    apiKey
}) {
    const [state, setState] = useState(SCANNER_STATES.CAMERA)
    const [capturedImage, setCapturedImage] = useState(null)
    const [extractedData, setExtractedData] = useState(null)
    const [processedItems, setProcessedItems] = useState([])
    const [error, setError] = useState(null)
    const [commitResult, setCommitResult] = useState(null)

    // Initialize scanner with API key
    useEffect(() => {
        if (apiKey) {
            InvoiceScannerService.initialize(apiKey)
        }
    }, [apiKey])

    // Handle image capture
    const handleCapture = useCallback(async (imageData) => {
        setCapturedImage(imageData)
        setState(SCANNER_STATES.CAPTURING)

        // Brief capture animation
        await new Promise(resolve => setTimeout(resolve, 200))
        setState(SCANNER_STATES.PROCESSING)

        try {
            // AI extraction
            const result = await InvoiceScannerService.scan(imageData)
            setExtractedData(result)

            // Validate extraction
            const validation = InvoiceScannerService.validate(result)
            if (!validation.valid) {
                setError(`Erro na extração: ${validation.errors[0]?.message}`)
                setState(SCANNER_STATES.ERROR)
                return
            }

            // Process items with semantic matching
            const processed = await InvoiceScannerService.processItems(
                result.items,
                existingProducts
            )

            // Add unique IDs
            const itemsWithIds = processed.map((item, idx) => ({
                ...item,
                id: `scanned_${Date.now()}_${idx}`
            }))

            setProcessedItems(itemsWithIds)
            setState(SCANNER_STATES.REVIEW)

        } catch (err) {
            console.error('Scan error:', err)
            setError(err.message || 'Erro ao processar nota fiscal')
            setState(SCANNER_STATES.ERROR)
            HapticService.trigger('error')
        }
    }, [existingProducts])

    // Handle item update
    const handleItemUpdate = useCallback((index, updates) => {
        setProcessedItems(prev => prev.map((item, i) =>
            i === index ? { ...item, ...updates } : item
        ))
    }, [])

    // Handle item remove
    const handleItemRemove = useCallback((index) => {
        HapticService.trigger('selection')
        setProcessedItems(prev => prev.filter((_, i) => i !== index))
    }, [])

    // Handle commit to inventory
    const handleCommit = useCallback(async () => {
        setState(SCANNER_STATES.COMMITTING)

        try {
            // Final validation
            const validation = ValidationService.validateBatch(processedItems, existingProducts)
            if (!validation.valid) {
                HapticService.trigger('validationError')
                setError(validation.errors[0]?.message || 'Erro de validação')
                setState(SCANNER_STATES.REVIEW)
                return
            }

            // Prepare items for inventory
            const inventoryItems = processedItems.map(item => ({
                name: item.canonicalName || item.rawName,
                packageQuantity: item.quantity,
                packageCount: 1,
                unit: item.unit || 'un',
                pricePerUnit: item.unitPrice || 0,
                category: 'Ingredientes',
                subcategory: 'Outros Ingredientes',
                purchaseDate: new Date().toISOString().split('T')[0],
                confidenceScore: item.confidence || 0,
                semanticMapping: JSON.stringify({
                    canonical: item.canonicalName,
                    aliases: [item.rawName]
                }),
                aiMetadata: JSON.stringify({
                    source: 'invoice_scan',
                    scannedAt: new Date().toISOString(),
                    vendor: extractedData?.metadata?.vendor
                }),
                // Link to matched product if exists
                matchedProductId: item.matchResult?.matchedProduct?.id || null
            }))

            // Calculate totals
            const totalValue = processedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)

            setCommitResult({
                items: inventoryItems,
                count: inventoryItems.length,
                totalValue
            })

            // Trigger success callback
            if (onComplete) {
                await onComplete(inventoryItems, {
                    vendor: extractedData?.metadata?.vendor,
                    invoiceNumber: extractedData?.metadata?.invoiceNumber,
                    totalValue
                })
            }

            setState(SCANNER_STATES.SUCCESS)

        } catch (err) {
            console.error('Commit error:', err)
            HapticService.trigger('error')
            setError(err.message || 'Erro ao salvar itens')
            setState(SCANNER_STATES.REVIEW)
        }
    }, [processedItems, existingProducts, extractedData, onComplete])

    // Handle retry
    const handleRetry = useCallback(() => {
        setError(null)
        setCapturedImage(null)
        setExtractedData(null)
        setProcessedItems([])
        setState(SCANNER_STATES.CAMERA)
    }, [])

    // Render content based on state
    const renderContent = () => {
        switch (state) {
            case SCANNER_STATES.CAMERA:
                return (
                    <CameraViewfinder
                        onCapture={handleCapture}
                        onClose={onClose}
                    />
                )

            case SCANNER_STATES.CAPTURING:
            case SCANNER_STATES.PROCESSING:
                return <ProcessingIndicator imagePreview={capturedImage} />

            case SCANNER_STATES.REVIEW:
                return (
                    <ItemReviewList
                        items={processedItems}
                        existingProducts={existingProducts}
                        onItemUpdate={handleItemUpdate}
                        onItemRemove={handleItemRemove}
                        onCommit={handleCommit}
                        onCancel={onClose}
                        isCommitting={state === SCANNER_STATES.COMMITTING}
                    />
                )

            case SCANNER_STATES.COMMITTING:
                return (
                    <ItemReviewList
                        items={processedItems}
                        existingProducts={existingProducts}
                        onItemUpdate={handleItemUpdate}
                        onItemRemove={handleItemRemove}
                        onCommit={handleCommit}
                        onCancel={onClose}
                        isCommitting={true}
                    />
                )

            case SCANNER_STATES.SUCCESS:
                return (
                    <SuccessView
                        itemCount={commitResult?.count || 0}
                        totalValue={commitResult?.totalValue || 0}
                        onClose={onClose}
                    />
                )

            case SCANNER_STATES.ERROR:
                return (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                        <div className="w-24 h-24 rounded-full bg-rose-500/20 flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-white text-xl font-bold mb-2">Erro no Escaneamento</h3>
                        <p className="text-white/60 text-center mb-6 max-w-xs">{error}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRetry}
                                className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold"
                            >
                                Tentar Novamente
                            </button>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return createPortal(
        <motion.div
            className="fixed inset-0 z-[99999] bg-zinc-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {renderContent()}
        </motion.div>,
        document.body
    )
}

export { InvoiceScanner, SCANNER_STATES }
