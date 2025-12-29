import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * ReportExport - Apple-Quality Report Export Component
 * Features: CSV export, date filtering, quick presets
 */

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
const formatDateISO = (d) => d ? new Date(d).toISOString().split('T')[0] : ''

// Preset Button
function PresetButton({ label, active, onClick }) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${active
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-500/20'
                }`}
        >
            {label}
        </motion.button>
    )
}

// Export Option Button
function ExportOption({ icon, title, subtitle, onClick }) {
    return (
        <motion.button
            whileHover={{ scale: 1.01, x: 4 }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            className="w-full px-4 py-4 text-left rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex items-center gap-4 transition-colors group"
        >
            <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
            <div className="flex-1">
                <p className="text-[14px] font-semibold text-zinc-900 dark:text-white">{title}</p>
                <p className="text-[11px] text-zinc-400">{subtitle}</p>
            </div>
            <svg className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-violet-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
        </motion.button>
    )
}

// Date Input with Label
function DateInput({ label, value, onChange }) {
    return (
        <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">{label}</label>
            <input
                type="date"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-700 text-sm text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-600 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
            />
        </div>
    )
}

// Export Progress Indicator
function ExportProgress({ isExporting, progress }) {
    if (!isExporting) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-4 border border-violet-200 dark:border-violet-500/20"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Exportando...</p>
                    <div className="mt-2 h-1.5 bg-violet-200 dark:bg-violet-900 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-violet-500 rounded-full"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Main Component
export default function ReportExport({ products = [], movements = [], onClose }) {
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [activePreset, setActivePreset] = useState('all')
    const [isExporting, setIsExporting] = useState(false)
    const [progress, setProgress] = useState(0)

    const presets = [
        { id: '7d', label: '7 Dias', days: 7 },
        { id: '30d', label: '30 Dias', days: 30 },
        { id: '90d', label: '90 Dias', days: 90 },
        { id: 'all', label: 'Tudo', days: 0 }
    ]

    const handlePresetClick = (preset) => {
        setActivePreset(preset.id)
        if (preset.days === 0) {
            setDateRange({ start: '', end: '' })
        } else {
            const end = new Date()
            const start = new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000)
            setDateRange({
                start: formatDateISO(start),
                end: formatDateISO(end)
            })
        }
    }

    // Filter movements by date
    const filteredMovements = useMemo(() => {
        if (!dateRange.start && !dateRange.end) return movements

        return movements.filter(m => {
            const date = new Date(m.createdAt)
            if (dateRange.start && date < new Date(dateRange.start)) return false
            if (dateRange.end && date > new Date(dateRange.end + 'T23:59:59')) return false
            return true
        })
    }, [movements, dateRange])

    // Export CSV
    const exportCSV = useCallback(async () => {
        setIsExporting(true)
        setProgress(0)

        try {
            await new Promise(r => setTimeout(r, 200))
            setProgress(20)

            const rows = [['Produto', 'Categoria', 'Fornecedor', 'Data', 'Tipo', 'Quantidade', 'Preço', 'Motivo']]

            products.forEach(p => {
                const productMovements = filteredMovements.filter(m => m.productId === p.id)
                productMovements.forEach(m => {
                    rows.push([
                        p.name,
                        p.category || '',
                        p.supplier || '',
                        new Date(m.createdAt).toLocaleDateString('pt-BR'),
                        m.type === 'entry' ? 'Entrada' : 'Saída',
                        `${m.quantity} ${p.unit}`,
                        m.price ? formatCurrency(m.price) : '',
                        m.reason || ''
                    ])
                })
            })

            setProgress(60)
            await new Promise(r => setTimeout(r, 200))

            // Build CSV
            const csv = '\uFEFF' + rows.map(r =>
                r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')
            ).join('\n')

            setProgress(80)

            // Create download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')

            const dateLabel = dateRange.start && dateRange.end
                ? `_${dateRange.start}_${dateRange.end}`
                : dateRange.start ? `_desde_${dateRange.start}`
                    : ''

            link.href = url
            link.download = `relatorio_estoque${dateLabel}_${formatDateISO(new Date())}.csv`
            link.click()

            setProgress(100)
            await new Promise(r => setTimeout(r, 300))

        } finally {
            setIsExporting(false)
            setProgress(0)
            onClose?.()
        }
    }, [products, filteredMovements, dateRange, onClose])

    // Export Summary
    const exportSummary = useCallback(async () => {
        setIsExporting(true)
        setProgress(0)

        try {
            await new Promise(r => setTimeout(r, 200))
            setProgress(30)

            const rows = [['Produto', 'Categoria', 'Fornecedor', 'Estoque Atual', 'Unidade', 'Preço', 'Valor Total', 'Movimentações']]

            products.forEach(p => {
                const count = filteredMovements.filter(m => m.productId === p.id).length
                rows.push([
                    p.name,
                    p.category || '',
                    p.supplier || '',
                    p.currentStock,
                    p.unit,
                    formatCurrency(p.currentPrice),
                    formatCurrency((p.currentStock || 0) * (p.currentPrice || 0)),
                    count
                ])
            })

            setProgress(70)

            const csv = '\uFEFF' + rows.map(r =>
                r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')
            ).join('\n')

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `resumo_estoque_${formatDateISO(new Date())}.csv`
            link.click()

            setProgress(100)
            await new Promise(r => setTimeout(r, 300))

        } finally {
            setIsExporting(false)
            setProgress(0)
            onClose?.()
        }
    }, [products, filteredMovements, onClose])

    const stats = useMemo(() => ({
        products: products.length,
        movements: filteredMovements.length,
        entries: filteredMovements.filter(m => m.type === 'entry').length,
        exits: filteredMovements.filter(m => m.type === 'exit').length
    }), [products, filteredMovements])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Exportar Relatório</h3>
                <p className="text-sm text-zinc-400 mt-1">Selecione o período e formato de exportação</p>
            </div>

            {/* Period Selection */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Período</h4>

                <div className="flex gap-2">
                    {presets.map(preset => (
                        <PresetButton
                            key={preset.id}
                            label={preset.label}
                            active={activePreset === preset.id}
                            onClick={() => handlePresetClick(preset)}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <DateInput
                        label="Data Inicial"
                        value={dateRange.start}
                        onChange={v => { setDateRange(d => ({ ...d, start: v })); setActivePreset('custom') }}
                    />
                    <DateInput
                        label="Data Final"
                        value={dateRange.end}
                        onChange={v => { setDateRange(d => ({ ...d, end: v })); setActivePreset('custom') }}
                    />
                </div>
            </div>

            {/* Stats Preview */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Dados Selecionados</h4>
                <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                        <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{stats.products}</p>
                        <p className="text-[10px] text-zinc-400">Produtos</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-violet-600 tabular-nums">{stats.movements}</p>
                        <p className="text-[10px] text-zinc-400">Movimentações</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-emerald-600 tabular-nums">{stats.entries}</p>
                        <p className="text-[10px] text-zinc-400">Entradas</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-rose-600 tabular-nums">{stats.exits}</p>
                        <p className="text-[10px] text-zinc-400">Saídas</p>
                    </div>
                </div>
            </div>

            {/* Export Progress */}
            <AnimatePresence>
                <ExportProgress isExporting={isExporting} progress={progress} />
            </AnimatePresence>

            {/* Export Options */}
            {!isExporting && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Formato de Exportação</h4>

                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <ExportOption
                            icon="📊"
                            title="Movimentações Completas"
                            subtitle="CSV com histórico detalhado de entradas e saídas"
                            onClick={exportCSV}
                        />
                        <ExportOption
                            icon="📋"
                            title="Resumo por Produto"
                            subtitle="CSV com snapshot atual do estoque"
                            onClick={exportSummary}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export { PresetButton, DateInput, ExportOption }
