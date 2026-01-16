/**
 * ImageLightbox — Full-screen image viewer
 */

import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useScrollLock } from '../../hooks/useScrollLock'

interface ImageLightboxProps {
    src: string
    onClose: () => void
}

export const ImageLightbox = ({ src, onClose }: ImageLightboxProps): React.ReactElement => {
    useScrollLock(true)

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-4"
        >
            <button
                onClick={onClose}
                className="absolute top-8 right-8 z-50 p-4 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md border border-white/5 hover:border-white/20 active:scale-95 group"
            >
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <motion.img
                src={src}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl"
                draggable={false}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                transition={{ type: "spring", stiffness: 250, damping: 35 }}
            />
        </motion.div>,
        document.body
    )
}

export default ImageLightbox
