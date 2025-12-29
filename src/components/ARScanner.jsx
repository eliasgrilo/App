/**
 * ARScanner Component - Augmented Reality Stock Scanner
 * Camera-based stock verification with haptic feedback
 * Apple 2025 Liquid Glass Design
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { HapticService } from '../services/hapticService'

// Scan states
const SCAN_STATES = {
    IDLE: 'idle',
    SCANNING: 'scanning',
    FOUND: 'found',
    NOT_FOUND: 'not_found',
    ERROR: 'error'
}

// Camera viewfinder overlay
function Viewfinder({ scanState }) {
    const cornerSize = 24
    const cornerStyle = "absolute w-6 h-6 border-white"

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Scan zone */}
            <div className="relative w-64 h-64">
                {/* Corners */}
                <div className={`${cornerStyle} top-0 left-0 border-t-4 border-l-4 rounded-tl-lg`} />
                <div className={`${cornerStyle} top-0 right-0 border-t-4 border-r-4 rounded-tr-lg`} />
                <div className={`${cornerStyle} bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg`} />
                <div className={`${cornerStyle} bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg`} />

                {/* Scanning line animation */}
                {scanState === SCAN_STATES.SCANNING && (
                    <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent"
                        initial={{ top: '0%' }}
                        animate={{ top: '100%' }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear'
                        }}
                    />
                )}

                {/* Status indicator */}
                <div className="absolute -bottom-16 left-0 right-0 flex justify-center">
                    <div className={`px-4 py-2 rounded-full backdrop-blur-xl flex items-center gap-2 ${scanState === SCAN_STATES.FOUND ? 'bg-emerald-500/80' :
                            scanState === SCAN_STATES.NOT_FOUND ? 'bg-amber-500/80' :
                                scanState === SCAN_STATES.ERROR ? 'bg-rose-500/80' :
                                    'bg-white/20'
                        }`}>
                        {scanState === SCAN_STATES.SCANNING && (
                            <>
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Escaneando...</span>
                            </>
                        )}
                        {scanState === SCAN_STATES.FOUND && (
                            <>
                                <span className="text-sm">✓</span>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Produto Encontrado</span>
                            </>
                        )}
                        {scanState === SCAN_STATES.NOT_FOUND && (
                            <>
                                <span className="text-sm">?</span>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Não Encontrado</span>
                            </>
                        )}
                        {scanState === SCAN_STATES.IDLE && (
                            <span className="text-xs font-medium text-white/80">Posicione o código de barras</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Product Info Overlay
function ProductOverlay({ product, onAdjust, onClose }) {
    const [quantity, setQuantity] = useState(0)
    const [adjustmentType, setAdjustmentType] = useState('add')

    const handleConfirm = () => {
        HapticService.trigger('success')
        onAdjust?.({
            productId: product.id,
            type: adjustmentType,
            quantity: Number(quantity)
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-3xl rounded-t-[2rem] p-6 border-t border-zinc-200/50 dark:border-white/10 shadow-2xl"
        >
            {/* Drag Handle */}
            <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Product Info */}
            <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl">
                    📦
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{product.name}</h3>
                    <p className="text-sm text-zinc-500">{product.category}</p>
                    <div className="flex gap-4 mt-2">
                        <div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Estoque Sistema</span>
                            <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{product.currentStock}</p>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Preço</span>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                R$ {(product.currentPrice || 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"
                >
                    <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>
            </div>

            {/* Quick Adjustment */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 mb-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Ajuste Rápido</p>

                {/* Type Toggle */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setAdjustmentType('add')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${adjustmentType === 'add'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                            }`}
                    >
                        ↓ Adicionar
                    </button>
                    <button
                        onClick={() => setAdjustmentType('remove')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${adjustmentType === 'remove'
                                ? 'bg-rose-500 text-white'
                                : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                            }`}
                    >
                        ↑ Remover
                    </button>
                </div>

                {/* Quantity Input */}
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            HapticService.trigger('impactLight')
                            setQuantity(Math.max(0, quantity - 1))
                        }}
                        className="w-14 h-14 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-600 dark:text-zinc-300 shadow-sm"
                    >
                        −
                    </motion.button>
                    <input
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(Math.max(0, Number(e.target.value) || 0))}
                        className="flex-1 h-14 text-center text-2xl font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-700 rounded-xl border-0 outline-none tabular-nums"
                    />
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            HapticService.trigger('impactLight')
                            setQuantity(quantity + 1)
                        }}
                        className="w-14 h-14 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-600 dark:text-zinc-300 shadow-sm"
                    >
                        +
                    </motion.button>
                </div>

                {/* New Stock Preview */}
                {quantity > 0 && (
                    <div className="mt-3 text-center">
                        <span className="text-sm text-zinc-500">
                            Novo estoque: {' '}
                            <span className="font-bold text-zinc-900 dark:text-white">
                                {adjustmentType === 'add'
                                    ? product.currentStock + quantity
                                    : Math.max(0, product.currentStock - quantity)}
                            </span>
                        </span>
                    </div>
                )}
            </div>

            {/* Confirm Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={quantity === 0}
                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold uppercase tracking-widest disabled:opacity-30 transition-all"
            >
                Confirmar Ajuste
            </motion.button>
        </motion.div>
    )
}

// Main AR Scanner Component
export default function ARScanner({ products = [], onAdjust, onClose }) {
    const videoRef = useRef(null)
    const [hasPermission, setHasPermission] = useState(null)
    const [scanState, setScanState] = useState(SCAN_STATES.IDLE)
    const [foundProduct, setFoundProduct] = useState(null)
    const [error, setError] = useState(null)

    // Request camera permission
    const requestCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }

            HapticService.trigger('success')
            setHasPermission(true)
            setScanState(SCAN_STATES.SCANNING)
        } catch (err) {
            console.error('Camera error:', err)
            HapticService.trigger('error')
            setHasPermission(false)
            setError(err.name === 'NotAllowedError'
                ? 'Permissão de câmera negada'
                : 'Erro ao acessar câmera')
        }
    }, [])

    // Stop camera
    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
            videoRef.current.srcObject = null
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => stopCamera()
    }, [stopCamera])

    // Simulate barcode detection (placeholder for real implementation)
    const simulateScan = useCallback(() => {
        if (products.length === 0) return

        HapticService.trigger('scanSuccess')
        setScanState(SCAN_STATES.FOUND)

        // Pick random product for demo
        const randomProduct = products[Math.floor(Math.random() * products.length)]
        setFoundProduct(randomProduct)
    }, [products])

    // Handle adjustment
    const handleAdjust = (adjustment) => {
        onAdjust?.(adjustment)
        HapticService.trigger('approval')
        setFoundProduct(null)
        setScanState(SCAN_STATES.SCANNING)
    }

    // Handle close overlay
    const handleCloseOverlay = () => {
        setFoundProduct(null)
        setScanState(SCAN_STATES.SCANNING)
    }

    // Handle close scanner
    const handleClose = () => {
        stopCamera()
        onClose?.()
    }

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[20000] bg-black"
        >
            {/* Camera View */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
            />

            {/* Viewfinder Overlay */}
            <Viewfinder scanState={scanState} />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex justify-between items-start">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center"
                >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>

                <div className="px-4 py-2 rounded-full bg-black/30 backdrop-blur-xl">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Scanner AR
                    </span>
                </div>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center"
                >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </motion.button>
            </div>

            {/* Permission Request */}
            <AnimatePresence>
                {hasPermission === null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-8"
                    >
                        <div className="text-center max-w-sm">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                                <span className="text-4xl">📷</span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Acesso à Câmera</h2>
                            <p className="text-sm text-white/60 mb-8">
                                Permita o acesso à câmera para escanear códigos de barras e verificar o estoque
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={requestCamera}
                                className="w-full py-4 bg-violet-500 text-white rounded-2xl text-sm font-bold uppercase tracking-widest"
                            >
                                Permitir Câmera
                            </motion.button>
                            <button
                                onClick={handleClose}
                                className="mt-4 text-sm text-white/40 font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                )}

                {hasPermission === false && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-8"
                    >
                        <div className="text-center max-w-sm">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-500/20 flex items-center justify-center">
                                <span className="text-4xl">⚠️</span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Câmera Indisponível</h2>
                            <p className="text-sm text-white/60 mb-8">{error}</p>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleClose}
                                className="w-full py-4 bg-zinc-800 text-white rounded-2xl text-sm font-bold uppercase tracking-widest"
                            >
                                Fechar
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Demo Scan Button (for testing without real barcode) */}
            {hasPermission && !foundProduct && (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={simulateScan}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 bg-violet-500 text-white rounded-2xl text-sm font-bold uppercase tracking-widest shadow-2xl"
                >
                    🔍 Simular Scan
                </motion.button>
            )}

            {/* Product Overlay */}
            <AnimatePresence>
                {foundProduct && (
                    <ProductOverlay
                        product={foundProduct}
                        onAdjust={handleAdjust}
                        onClose={handleCloseOverlay}
                    />
                )}
            </AnimatePresence>
        </motion.div>,
        document.body
    )
}
