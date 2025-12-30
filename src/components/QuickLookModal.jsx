import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform } from 'framer-motion'
import { useScrollLock } from '../hooks/useScrollLock'
import { HapticService } from '../services/hapticService'

/**
 * QuickLookModal - Apple-style Document Viewer (Full Implementation)
 * Features:
 * - Ultra Thin Material blur background (SystemUltraThinMaterial)
 * - Expand/shrink animation from origin point
 * - Hash-preserving file download (Raw Blob integrity)
 * - Share button (iOS style - square with arrow)
 * - Drag-to-dismiss gesture
 * - "Concluído" (Done) button
 * - SF Symbol-style icons per file type
 * - Inline PDF/image viewing
 */

// SF Symbol-style File Icons
const FileIcons = {
    pdf: () => (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="2" width="16" height="20" rx="2" className="fill-red-500" />
            <path d="M8 12h8M8 16h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <text x="12" y="9" textAnchor="middle" className="fill-white text-[6px] font-bold">PDF</text>
        </svg>
    ),
    doc: () => (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="2" width="16" height="20" rx="2" className="fill-blue-500" />
            <path d="M8 8h8M8 12h8M8 16h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    xls: () => (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="2" width="16" height="20" rx="2" className="fill-emerald-500" />
            <path d="M7 7h4v3H7zM13 7h4v3h-4zM7 12h4v3H7zM13 12h4v3h-4z" stroke="white" strokeWidth="1" />
        </svg>
    ),
    image: () => (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2" className="fill-purple-500" />
            <circle cx="9" cy="10" r="2" className="fill-white/80" />
            <path d="M20 16l-4-4-3 3-2-2-7 7h16v-4z" className="fill-white/60" />
        </svg>
    ),
    default: () => (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="2" width="16" height="20" rx="2" className="fill-zinc-400" />
            <path d="M8 8h8M8 12h8M8 16h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

// Get icon by file type
const getFileIcon = (type) => {
    if (type === 'application/pdf') return FileIcons.pdf
    if (type.includes('word') || type.includes('document')) return FileIcons.doc
    if (type.includes('excel') || type.includes('spreadsheet')) return FileIcons.xls
    if (type.startsWith('image/')) return FileIcons.image
    return FileIcons.default
}

export default function QuickLookModal({
    document,
    originRect,
    onClose,
    onDownload
}) {
    useScrollLock(true)
    const [isLoaded, setIsLoaded] = useState(false)
    const containerRef = useRef(null)
    const dragControls = useDragControls()

    // Drag-to-dismiss motion values
    const y = useMotionValue(0)
    const opacity = useTransform(y, [0, 300], [1, 0])
    const scale = useTransform(y, [0, 300], [1, 0.8])
    const backgroundOpacity = useTransform(y, [0, 300], [1, 0])

    // Calculate initial transform from origin
    const getOriginTransform = () => {
        if (!originRect) return { x: 0, y: 0, scale: 0.1 }
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2
        const originCenterX = originRect.x + originRect.width / 2
        const originCenterY = originRect.y + originRect.height / 2
        return {
            x: originCenterX - centerX,
            y: originCenterY - centerY,
            scale: 0.1
        }
    }

    const origin = getOriginTransform()

    useEffect(() => {
        HapticService.trigger('impact')
        if (document?.type?.startsWith('image/')) {
            const img = new Image()
            img.onload = () => setIsLoaded(true)
            img.src = document.dataUrl
        } else {
            setIsLoaded(true)
        }
    }, [document])

    // Handle keyboard
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    // Handle drag end - dismiss if dragged far enough
    const handleDragEnd = (event, info) => {
        if (info.offset.y > 150 || info.velocity.y > 500) {
            HapticService.trigger('selection')
            onClose()
        }
    }

    // Download with preserved binary integrity (Raw Blob)
    const handleDownload = () => {
        HapticService.trigger('success')
        const link = window.document.createElement('a')
        link.href = document.dataUrl
        link.download = document.name
        // Set proper headers via download attribute
        link.setAttribute('type', 'application/octet-stream')
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)
        onDownload?.()
    }

    // Share functionality (Web Share API)
    const handleShare = async () => {
        HapticService.trigger('selection')

        // Convert dataUrl to Blob for sharing
        const response = await fetch(document.dataUrl)
        const blob = await response.blob()
        const file = new File([blob], document.name, { type: document.type })

        if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: document.name
                })
            } catch (err) {
                if (err.name !== 'AbortError') {
                    // Fallback to download
                    handleDownload()
                }
            }
        } else {
            // Fallback to download if Web Share not supported
            handleDownload()
        }
    }

    // Format file size
    const formatSize = (bytes) => {
        if (!bytes) return ''
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    // Get file preview display
    const getFileDisplay = () => {
        const type = document?.type || ''
        const IconComponent = getFileIcon(type)

        if (type.startsWith('image/')) {
            return (
                <motion.img
                    src={document.dataUrl}
                    alt={document.name}
                    className="max-w-full max-h-[65vh] rounded-2xl object-contain shadow-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLoaded ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    draggable={false}
                />
            )
        }
        if (type === 'application/pdf') {
            return (
                <div className="w-full max-w-3xl h-[70vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <iframe
                        src={document.dataUrl}
                        title={document.name}
                        className="w-full h-full border-0"
                    />
                </div>
            )
        }
        // For other files (Word, Excel), show icon with info
        return (
            <motion.div
                className="flex flex-col items-center gap-6 p-12 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl rounded-3xl shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
            >
                <IconComponent />
                <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900 dark:text-white mb-1 max-w-[250px] truncate">
                        {document.name}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatSize(document.size)}
                    </p>
                </div>
                <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar para Visualizar
                </button>
            </motion.div>
        )
    }

    if (!document) return null

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[100000] flex flex-col"
                onClick={onClose}
            >
                {/* SystemUltraThinMaterial Blur Background */}
                <motion.div
                    style={{ opacity: backgroundOpacity }}
                    className="absolute inset-0"
                >
                    <div
                        className="absolute inset-0 bg-black/50"
                        style={{
                            backdropFilter: 'blur(60px) saturate(2.0) brightness(0.8)',
                            WebkitBackdropFilter: 'blur(60px) saturate(2.0) brightness(0.8)'
                        }}
                    />
                </motion.div>

                {/* Header Bar - iOS Style */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 30 }}
                    className="relative z-10 flex items-center justify-between px-4 py-3 safe-area-top"
                    style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Done Button (Concluído) - iOS Style */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="px-4 py-2 text-blue-400 font-semibold text-[17px] hover:text-blue-300 transition-colors"
                    >
                        Concluído
                    </motion.button>

                    {/* File Name */}
                    <div className="flex-1 text-center px-4">
                        <p className="text-white/90 text-sm font-semibold truncate">
                            {document.name}
                        </p>
                        {document.size && (
                            <p className="text-white/50 text-xs">
                                {formatSize(document.size)}
                            </p>
                        )}
                    </div>

                    {/* Share Button - iOS Style (Square with Arrow) */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleShare}
                        className="w-10 h-10 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </motion.button>
                </motion.div>

                {/* Draggable Content Container */}
                <motion.div
                    ref={containerRef}
                    drag="y"
                    dragControls={dragControls}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.7}
                    onDragEnd={handleDragEnd}
                    style={{ y, opacity, scale }}
                    initial={{
                        x: origin.x,
                        y: origin.y,
                        scale: origin.scale,
                        opacity: 0
                    }}
                    animate={{
                        x: 0,
                        y: 0,
                        scale: 1,
                        opacity: 1
                    }}
                    exit={{
                        x: origin.x,
                        y: origin.y,
                        scale: origin.scale,
                        opacity: 0
                    }}
                    transition={{
                        type: 'spring',
                        damping: 28,
                        stiffness: 350
                    }}
                    className="relative flex-1 flex flex-col items-center justify-center px-4 cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Drag Handle Indicator */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2">
                        <div className="w-10 h-1 bg-white/30 rounded-full" />
                    </div>

                    {/* File Preview */}
                    <div className="max-w-full">
                        {getFileDisplay()}
                    </div>

                    {/* Footer Hint */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="absolute bottom-8 text-white/30 text-xs"
                    >
                        Arraste para baixo para fechar
                    </motion.p>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        window.document.body
    )
}
