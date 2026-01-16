/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EXPORT MENU — Apple-Style Advanced Export Options
 * 
 * Premium export menu with:
 * - Multiple format options (PDF, Excel, CSV)
 * - Email scheduling
 * - WhatsApp share
 * - Animated dropdown
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Download,
    FileSpreadsheet,
    FileText,
    Mail,
    MessageCircle,
    ChevronDown,
    Calendar,
    Share2,
    Printer,
    Check
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type ExportFormat = 'pdf' | 'excel' | 'csv' | 'email' | 'whatsapp' | 'print'

interface ExportOption {
    id: ExportFormat
    label: string
    description: string
    icon: React.ReactNode
    available: boolean
}

interface ExportMenuProps {
    onExport: (format: ExportFormat) => void
    disabled?: boolean
    className?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const EXPORT_OPTIONS: ExportOption[] = [
    {
        id: 'print',
        label: 'Imprimir',
        description: 'Visualização de impressão',
        icon: <Printer className="w-4 h-4" />,
        available: true
    },
    {
        id: 'pdf',
        label: 'Exportar PDF',
        description: 'Documento com formatação',
        icon: <FileText className="w-4 h-4" />,
        available: true
    },
    {
        id: 'excel',
        label: 'Exportar Excel',
        description: 'Planilha editável (.xlsx)',
        icon: <FileSpreadsheet className="w-4 h-4" />,
        available: true
    },
    {
        id: 'csv',
        label: 'Exportar CSV',
        description: 'Dados brutos separados por vírgula',
        icon: <Download className="w-4 h-4" />,
        available: true
    },
    {
        id: 'email',
        label: 'Enviar por Email',
        description: 'Agendar envio automático',
        icon: <Mail className="w-4 h-4" />,
        available: true
    },
    {
        id: 'whatsapp',
        label: 'Compartilhar WhatsApp',
        description: 'Enviar via WhatsApp Business',
        icon: <MessageCircle className="w-4 h-4" />,
        available: true
    }
]

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const ExportMenu: React.FC<ExportMenuProps> = ({
    onExport,
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [recentExport, setRecentExport] = useState<ExportFormat | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleExport = (format: ExportFormat) => {
        setRecentExport(format)
        onExport(format)
        setIsOpen(false)

        // Clear recent indicator after 2 seconds
        setTimeout(() => setRecentExport(null), 2000)
    }

    return (
        <div ref={menuRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center gap-2 px-4 py-2.5
                    rounded-xl font-medium text-sm
                    bg-zinc-900 dark:bg-white
                    text-white dark:text-zinc-900
                    hover:bg-zinc-800 dark:hover:bg-zinc-100
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors duration-150
                    shadow-lg shadow-zinc-900/20
                `}
            >
                <Share2 className="w-4 h-4" />
                <span>Exportar</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-4 h-4" />
                </motion.span>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="
                            absolute right-0 top-full mt-2 z-50
                            w-72 p-2
                            bg-white dark:bg-zinc-900
                            border border-zinc-200 dark:border-zinc-700
                            rounded-2xl shadow-2xl
                        "
                    >
                        {/* Header */}
                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                Opções de Exportação
                            </p>
                        </div>

                        {/* Options */}
                        <div className="space-y-0.5">
                            {EXPORT_OPTIONS.map((option) => (
                                <motion.button
                                    key={option.id}
                                    whileHover={{ x: 4 }}
                                    onClick={() => handleExport(option.id)}
                                    disabled={!option.available}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2.5
                                        rounded-xl text-left
                                        hover:bg-zinc-100 dark:hover:bg-zinc-800
                                        disabled:opacity-40 disabled:cursor-not-allowed
                                        transition-colors duration-150
                                        ${recentExport === option.id ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''}
                                    `}
                                >
                                    {/* Icon */}
                                    <div className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                        ${recentExport === option.id
                                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                        }
                                    `}>
                                        {recentExport === option.id
                                            ? <Check className="w-4 h-4" />
                                            : option.icon
                                        }
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                            {option.label}
                                        </p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                            {option.description}
                                        </p>
                                    </div>

                                    {/* Status badge */}
                                    {!option.available && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                            Em breve
                                        </span>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                                className="
                                    w-full flex items-center gap-2 px-3 py-2
                                    rounded-lg text-left text-xs
                                    text-zinc-500 dark:text-zinc-400
                                    hover:bg-zinc-50 dark:hover:bg-zinc-800/50
                                    transition-colors
                                "
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Agendar envio automático...</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ExportMenu
