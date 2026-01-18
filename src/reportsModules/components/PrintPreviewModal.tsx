/**
 * PrintPreviewModal — In-App Print Preview
 * 
 * Shows a modal preview of the print content before printing.
 * This replaces the browser popup approach with a reliable in-app solution.
 */

import React, { useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Printer, ZoomIn, ZoomOut } from 'lucide-react'

interface PrintPreviewModalProps {
    isOpen: boolean
    onClose: () => void
    htmlContent: string
    title?: string
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
    isOpen,
    onClose,
    htmlContent,
    title = 'Visualização de Impressão'
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [scale, setScale] = React.useState(0.75)

    const handlePrint = useCallback(() => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.focus()
            iframeRef.current.contentWindow.print()
        }
    }, [])

    const zoomIn = () => setScale(s => Math.min(s + 0.1, 1.5))
    const zoomOut = () => setScale(s => Math.max(s - 0.1, 0.3))

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-4 md:inset-8 z-[101] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                                {title}
                            </h2>

                            <div className="flex items-center gap-3">
                                {/* Zoom Controls */}
                                <div className="flex items-center gap-1 bg-white dark:bg-zinc-700 rounded-lg px-2 py-1 border border-zinc-200 dark:border-zinc-600">
                                    <button
                                        onClick={zoomOut}
                                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-600 rounded"
                                    >
                                        <ZoomOut className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                                    </button>
                                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 min-w-[40px] text-center">
                                        {Math.round(scale * 100)}%
                                    </span>
                                    <button
                                        onClick={zoomIn}
                                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-600 rounded"
                                    >
                                        <ZoomIn className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                                    </button>
                                </div>

                                {/* Print Button */}
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] hover:bg-[#0066DD] text-white font-semibold rounded-lg transition-colors"
                                >
                                    <Printer className="w-4 h-4" />
                                    Imprimir
                                </button>

                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-500" />
                                </button>
                            </div>
                        </div>

                        {/* Preview Container */}
                        <div className="flex-1 overflow-auto bg-zinc-200 dark:bg-zinc-800 p-8">
                            <div
                                className="mx-auto bg-white shadow-xl origin-top transition-transform"
                                style={{
                                    width: '210mm',
                                    minHeight: '297mm',
                                    transform: `scale(${scale})`,
                                    marginBottom: `${(1 - scale) * -100}%`
                                }}
                            >
                                <iframe
                                    ref={iframeRef}
                                    srcDoc={htmlContent}
                                    className="w-full h-full min-h-[297mm] border-0"
                                    title="Print Preview"
                                />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default PrintPreviewModal
