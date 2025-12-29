import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import { FirebaseService } from './services/firebaseService'
import { motion, AnimatePresence } from 'framer-motion'
import { useInventoryItems } from './Inventory'

// Pro Feature Components
import TimelineAudit, { useTimelineAudit } from './components/TimelineAudit'
import PredictiveInsights, { usePredictiveInsights } from './components/PredictiveInsights'
import ARScanner from './components/ARScanner'
import DigitalTwinMap from './components/DigitalTwinMap'
import SmartSourcing from './components/SmartSourcing'
import SmartSourcingWorkflow from './components/SmartSourcingWorkflow'
import { HapticService } from './services/hapticService'

/**
 * Products - Apple-Quality Audit System
 * Historical registry of all inventory movements
 * Features: Sparklines, Anomaly Detection, Notes, Report Export
 */

const STORAGE_KEY = 'padoca_products_audit'

const formatCurrency = (val) => {
    const n = Number(val) || 0
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR')
}

const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const now = new Date()
    const date = new Date(dateStr)
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'hoje'
    if (days === 1) return 'ontem'
    if (days < 7) return `há ${days} dias`
    if (days < 30) return `há ${Math.floor(days / 7)} semanas`
    return `há ${Math.floor(days / 30)} meses`
}

// Sparkline Component - Pure SVG
function Sparkline({ data, color = '#8b5cf6', height = 40, showGradient = true }) {
    if (!data || data.length < 2) return null

    const width = 120
    const padding = 4
    const values = data.map(d => Number(d.price) || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const points = values.map((v, i) => {
        const x = padding + (i / (values.length - 1)) * (width - 2 * padding)
        const y = height - padding - ((v - min) / range) * (height - 2 * padding)
        return `${x},${y}`
    }).join(' ')

    const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`
    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`

    const trend = values[values.length - 1] > values[0] ? 'up' : values[values.length - 1] < values[0] ? 'down' : 'stable'
    const trendColor = trend === 'up' ? '#ef4444' : trend === 'down' ? '#22c55e' : color

    return (
        <svg width={width} height={height} className="overflow-visible">
            {showGradient && (
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
                    </linearGradient>
                </defs>
            )}
            {showGradient && (
                <polygon points={areaPoints} fill={`url(#${gradientId})`} />
            )}
            <polyline
                points={points}
                fill="none"
                stroke={trendColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx={width - padding}
                cy={height - padding - ((values[values.length - 1] - min) / range) * (height - 2 * padding)}
                r="3"
                fill={trendColor}
            />
        </svg>
    )
}

// Anomaly Detection Helper
const detectAnomalies = (product, movements) => {
    const anomalies = []

    // Price history analysis
    if (product.priceHistory && product.priceHistory.length >= 2) {
        const prices = product.priceHistory.map(p => Number(p.price) || 0)
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
        const currentPrice = product.currentPrice
        const lastPrice = prices[prices.length - 1]
        const prevPrice = prices.length >= 2 ? prices[prices.length - 2] : lastPrice

        // Price spike detection (>20% above average)
        if (currentPrice > avgPrice * 1.2 && avgPrice > 0) {
            anomalies.push({
                type: 'price_spike',
                severity: 'warning',
                message: `Preço ${((currentPrice / avgPrice - 1) * 100).toFixed(0)}% acima da média`,
                icon: '📈'
            })
        }

        // Price drop detection (>20% below average)
        if (currentPrice < avgPrice * 0.8 && avgPrice > 0) {
            anomalies.push({
                type: 'price_drop',
                severity: 'info',
                message: `Preço ${((1 - currentPrice / avgPrice) * 100).toFixed(0)}% abaixo da média`,
                icon: '📉'
            })
        }

        // Sudden price change (>15% from last purchase)
        if (prevPrice > 0 && Math.abs(lastPrice - prevPrice) / prevPrice > 0.15) {
            const change = ((lastPrice - prevPrice) / prevPrice * 100).toFixed(0)
            anomalies.push({
                type: 'price_change',
                severity: 'info',
                message: `Variação de ${change > 0 ? '+' : ''}${change}% na última compra`,
                icon: change > 0 ? '🔺' : '🔻'
            })
        }
    }

    // Low stock alert
    if (product.minStock > 0 && product.currentStock < product.minStock) {
        anomalies.push({
            type: 'low_stock',
            severity: 'danger',
            message: `Estoque ${product.currentStock}/${product.minStock} ${product.unit}`,
            icon: '⚠️'
        })
    }

    // High stock alert (over maximum)
    if (product.maxStock > 0 && product.currentStock > product.maxStock) {
        anomalies.push({
            type: 'high_stock',
            severity: 'warning',
            message: `Estoque acima do máximo (${product.maxStock} ${product.unit})`,
            icon: '📦'
        })
    }

    // Inactivity alert (no movements in 60+ days)
    if (product.lastMovementDate) {
        const daysSinceLastMov = Math.floor((Date.now() - new Date(product.lastMovementDate)) / (1000 * 60 * 60 * 24))
        if (daysSinceLastMov > 60) {
            anomalies.push({
                type: 'inactive',
                severity: 'info',
                message: `Sem movimentação há ${daysSinceLastMov} dias`,
                icon: '💤'
            })
        }
    } else if (product.createdAt) {
        const daysSinceCreation = Math.floor((Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24))
        if (daysSinceCreation > 30 && product.totalMovements === 0) {
            anomalies.push({
                type: 'no_movement',
                severity: 'info',
                message: 'Produto sem nenhuma movimentação',
                icon: '❓'
            })
        }
    }

    return anomalies
}

// Note categories
const NOTE_CATEGORIES = [
    { id: 'general', label: 'Geral', color: 'zinc', icon: '📝' },
    { id: 'quality', label: 'Qualidade', color: 'amber', icon: '⭐' },
    { id: 'delivery', label: 'Entrega', color: 'blue', icon: '🚚' },
    { id: 'price', label: 'Preço', color: 'emerald', icon: '💰' }
]

export default function Products() {
    const inventoryItems = useInventoryItems()
    const [movements, setMovements] = useState([])
    const [notes, setNotes] = useState({}) // { productId: [notes] }
    const [isCloudSynced, setIsCloudSynced] = useState(false)
    const [syncStatus, setSyncStatus] = useState('synced')

    // UI State
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')
    const [sortBy, setSortBy] = useState('recent')
    const [viewingProduct, setViewingProduct] = useState(null)
    const [showExportMenu, setShowExportMenu] = useState(false)
    const [exportDateRange, setExportDateRange] = useState({ start: '', end: '' })
    const [statsPeriod, setStatsPeriod] = useState('month') // 'week', 'month', 'quarter'

    // Pro Features State
    const [activeView, setActiveView] = useState('products') // 'products', 'timeline', 'insights', 'map', 'sourcing'
    const [showARScanner, setShowARScanner] = useState(false)

    // Load data from Firebase
    useEffect(() => {
        const loadData = async () => {
            try {
                const [movData, auditData] = await Promise.all([
                    FirebaseService.getProductMovements(),
                    FirebaseService.getProductAuditData()
                ])
                if (movData) setMovements(movData)
                if (auditData?.notes) setNotes(auditData.notes)
            } catch (e) {
                console.error('Error loading data:', e)
            } finally {
                setIsCloudSynced(true)
            }
        }
        loadData()
    }, [])

    // Save movements to Firebase
    useEffect(() => {
        if (!isCloudSynced) return
        setSyncStatus('syncing')
        const timer = setTimeout(async () => {
            const ok = await FirebaseService.syncProductMovements(movements)
            setSyncStatus(ok ? 'synced' : 'error')
        }, 1500)
        return () => clearTimeout(timer)
    }, [movements, isCloudSynced])

    // Save notes to Firebase
    useEffect(() => {
        if (!isCloudSynced) return
        const timer = setTimeout(async () => {
            await FirebaseService.syncProductAuditData({ notes })
        }, 1500)
        return () => clearTimeout(timer)
    }, [notes, isCloudSynced])

    // Products with audit data
    const products = useMemo(() => {
        if (!Array.isArray(inventoryItems)) return []
        return inventoryItems.map(item => {
            const productMovements = movements.filter(m => m.productId === item.id)
            const entries = productMovements.filter(m => m.type === 'entry')
            const exits = productMovements.filter(m => m.type === 'exit')
            const lastMovement = productMovements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
            const priceChanges = productMovements.filter(m => m.price != null).map(m => ({ date: m.createdAt, price: m.price }))

            const product = {
                id: item.id,
                name: item.name,
                category: item.category || 'Outros',
                subcategory: item.subcategory || '',
                supplier: item.supplierName || '',
                supplierId: item.supplierId,
                unit: item.unit || 'un',
                currentStock: (Number(item.packageQuantity) || 0) * (Number(item.packageCount) || 1),
                currentPrice: item.pricePerUnit || 0,
                minStock: item.minStock || 0,
                maxStock: item.maxStock || 0,
                createdAt: item.createdAt,
                movements: productMovements,
                entriesCount: entries.length,
                exitsCount: exits.length,
                totalMovements: productMovements.length,
                lastMovementDate: lastMovement?.createdAt,
                priceHistory: priceChanges,
                totalEntriesQty: entries.reduce((sum, e) => sum + (Number(e.quantity) || 0), 0),
                totalExitsQty: exits.reduce((sum, e) => sum + (Number(e.quantity) || 0), 0),
                notes: notes[item.id] || []
            }
            product.anomalies = detectAnomalies(product, movements)
            return product
        })
    }, [inventoryItems, movements, notes])

    // Supplier stats with enhanced metrics
    const supplierStats = useMemo(() => {
        const stats = {}
        const now = new Date()
        const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000)

        products.forEach(p => {
            if (p.supplier) {
                if (!stats[p.supplier]) {
                    stats[p.supplier] = {
                        name: p.supplier,
                        totalValue: 0,
                        productCount: 0,
                        movementCount: 0,
                        recentMovements: 0,
                        lastDelivery: null
                    }
                }
                stats[p.supplier].totalValue += p.currentStock * p.currentPrice
                stats[p.supplier].productCount += 1
                stats[p.supplier].movementCount += p.totalMovements

                // Count recent movements (last 30 days)
                const recentMov = p.movements.filter(m => new Date(m.createdAt) >= last30Days)
                stats[p.supplier].recentMovements += recentMov.length

                // Track last delivery
                const lastEntry = p.movements.filter(m => m.type === 'entry').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
                if (lastEntry && (!stats[p.supplier].lastDelivery || new Date(lastEntry.createdAt) > new Date(stats[p.supplier].lastDelivery))) {
                    stats[p.supplier].lastDelivery = lastEntry.createdAt
                }
            }
        })

        // Calculate reliability score (based on movement frequency)
        const maxMovements = Math.max(...Object.values(stats).map(s => s.recentMovements), 1)
        Object.values(stats).forEach(s => {
            s.frequencyScore = Math.round((s.recentMovements / maxMovements) * 100)
            s.avgOrderValue = s.movementCount > 0 ? s.totalValue / s.movementCount : 0
        })

        return Object.values(stats).sort((a, b) => b.totalValue - a.totalValue).slice(0, 5)
    }, [products])

    const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))].sort(), [products])

    const filteredProducts = useMemo(() => {
        let result = [...products]
        if (activeCategory !== 'all') result = result.filter(p => p.category === activeCategory)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(p => p.name?.toLowerCase().includes(q) || p.supplier?.toLowerCase().includes(q))
        }
        if (dateFilter !== 'all') {
            const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90
            const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            result = result.filter(p => p.movements.some(m => new Date(m.createdAt) >= cutoff) || new Date(p.createdAt) >= cutoff)
        }
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name': return (a.name || '').localeCompare(b.name || '')
                case 'value': return (b.currentStock * b.currentPrice) - (a.currentStock * a.currentPrice)
                case 'movements': return b.totalMovements - a.totalMovements
                default: return new Date(b.lastMovementDate || b.createdAt || 0) - new Date(a.lastMovementDate || a.createdAt || 0)
            }
        })
        return result
    }, [products, activeCategory, searchQuery, dateFilter, sortBy])

    const stats = useMemo(() => {
        const now = new Date()
        const getDateRange = (period, offset = 0) => {
            const start = new Date(now)
            const end = new Date(now)
            if (period === 'week') {
                start.setDate(now.getDate() - 7 * (offset + 1))
                end.setDate(now.getDate() - 7 * offset)
            } else if (period === 'month') {
                start.setMonth(now.getMonth() - offset - 1)
                end.setMonth(now.getMonth() - offset)
            } else {
                start.setMonth(now.getMonth() - 3 * (offset + 1))
                end.setMonth(now.getMonth() - 3 * offset)
            }
            return { start, end }
        }
        const current = getDateRange(statsPeriod, 0)
        const previous = getDateRange(statsPeriod, 1)

        const filterByRange = (m, range) => {
            const d = new Date(m.createdAt)
            return d >= range.start && d <= range.end
        }

        const currentMov = movements.filter(m => filterByRange(m, current))
        const previousMov = movements.filter(m => filterByRange(m, previous))
        const anomalyCount = products.reduce((sum, p) => sum + (p.anomalies?.length || 0), 0)

        const entriesCurrent = currentMov.filter(m => m.type === 'entry').length
        const exitsCurrent = currentMov.filter(m => m.type === 'exit').length
        const entriesPrevious = previousMov.filter(m => m.type === 'entry').length
        const exitsPrevious = previousMov.filter(m => m.type === 'exit').length

        const calcTrend = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0
            return ((curr - prev) / prev * 100).toFixed(0)
        }

        return {
            totalProducts: products.length,
            totalValue: products.reduce((sum, p) => sum + (p.currentStock * p.currentPrice), 0),
            entriesCurrent,
            exitsCurrent,
            entriesPrevious,
            exitsPrevious,
            entriesTrend: calcTrend(entriesCurrent, entriesPrevious),
            exitsTrend: calcTrend(exitsCurrent, exitsPrevious),
            totalMovements: movements.length,
            anomalyCount,
            periodLabel: statsPeriod === 'week' ? 'esta semana' : statsPeriod === 'month' ? 'este mês' : 'este trimestre',
            previousLabel: statsPeriod === 'week' ? 'semana anterior' : statsPeriod === 'month' ? 'mês anterior' : 'trimestre anterior'
        }
    }, [products, movements, statsPeriod])

    const handleAddMovement = useCallback((productId, movement) => {
        setMovements(prev => [...prev, { ...movement, productId, id: Date.now(), createdAt: new Date().toISOString() }])
    }, [])

    const handleAddNote = useCallback((productId, note) => {
        setNotes(prev => ({
            ...prev,
            [productId]: [...(prev[productId] || []), { ...note, id: Date.now(), createdAt: new Date().toISOString() }]
        }))
    }, [])

    const handleDeleteNote = useCallback((productId, noteId) => {
        setNotes(prev => ({
            ...prev,
            [productId]: (prev[productId] || []).filter(n => n.id !== noteId)
        }))
    }, [])

    // Export CSV with date range filtering
    const exportCSV = useCallback(() => {
        const rows = [['Produto', 'Categoria', 'Fornecedor', 'Data', 'Tipo', 'Quantidade', 'Preço', 'Motivo']]
        const startDate = exportDateRange.start ? new Date(exportDateRange.start) : null
        const endDate = exportDateRange.end ? new Date(exportDateRange.end + 'T23:59:59') : null

        products.forEach(p => {
            p.movements.forEach(m => {
                const movDate = new Date(m.createdAt)
                // Apply date filter if set
                if (startDate && movDate < startDate) return
                if (endDate && movDate > endDate) return

                rows.push([
                    p.name, p.category, p.supplier,
                    formatDateTime(m.createdAt),
                    m.type === 'entry' ? 'Entrada' : 'Saída',
                    `${m.quantity} ${p.unit}`,
                    m.price ? formatCurrency(m.price) : '',
                    m.reason || ''
                ])
            })
        })

        const dateLabel = startDate && endDate
            ? `_${exportDateRange.start}_${exportDateRange.end}`
            : startDate ? `_desde_${exportDateRange.start}`
                : endDate ? `_ate_${exportDateRange.end}`
                    : ''

        const csv = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `auditoria_produtos${dateLabel}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        setShowExportMenu(false)
    }, [products, exportDateRange])

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-32 md:pb-16 relative font-sans selection:bg-violet-500/20">
            {/* Ultra-Subtle Background - Liquid Glass Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Header: Identity & Actions - Apple Pro */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Produtos</h1>
                        {/* Sync Status Badge */}
                        <div className={`mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 ${syncStatus === 'syncing' ? 'bg-amber-500/5 border-amber-500/10 text-amber-500 animate-pulse' :
                            syncStatus === 'error' ? 'bg-red-500/5 border-red-500/10 text-red-500' :
                                'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80'
                            }`}>
                            <div className={`w-1 h-1 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500' : syncStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                {syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'error' ? 'Error' : 'Cloud Active'}
                            </span>
                        </div>
                        {stats.anomalyCount > 0 && (
                            <div className="mt-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-pulse">
                                <span className="text-[10px] font-bold uppercase tracking-widest">⚠️ {stats.anomalyCount} alertas</span>
                            </div>
                        )}
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Histórico de Auditoria & Análise de Estoque</p>
                </div>

                {/* Export Button - 44pt Touch Target */}
                <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Exportar Relatório
                </button>
            </div>

            {/* Export Menu - Liquid Glass Dropdown */}
            <AnimatePresence>
                {showExportMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-20 md:pt-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowExportMenu(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative bg-white/95 dark:bg-zinc-900/95 backdrop-blur-3xl rounded-[2rem] shadow-2xl border border-zinc-200/50 dark:border-white/10 w-full max-w-sm p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Período do Relatório</h4>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1.5">Data Início</label>
                                    <input
                                        type="date"
                                        value={exportDateRange.start}
                                        onChange={e => setExportDateRange(p => ({ ...p, start: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1.5">Data Fim</label>
                                    <input
                                        type="date"
                                        value={exportDateRange.end}
                                        onChange={e => setExportDateRange(p => ({ ...p, end: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                                    />
                                </div>
                            </div>
                            {/* Quick Period Selector */}
                            <div className="p-1 bg-zinc-100 dark:bg-black/40 rounded-xl flex gap-1 mb-4 shadow-inner">
                                {[{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }, { label: 'Tudo', days: 0 }].map(opt => (
                                    <button
                                        key={opt.label}
                                        onClick={() => {
                                            const end = new Date().toISOString().split('T')[0]
                                            const start = opt.days > 0 ? new Date(Date.now() - opt.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : ''
                                            setExportDateRange({ start, end: opt.days > 0 ? end : '' })
                                        }}
                                        className="flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white hover:shadow-sm transition-all"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <div className="border-t border-zinc-100 dark:border-white/5 pt-4 space-y-2">
                                <button
                                    onClick={() => { exportCSV(); setShowExportMenu(false); }}
                                    className="w-full px-4 py-4 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-2xl flex items-center gap-4 transition-all group"
                                >
                                    <div className="w-11 h-11 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="text-lg">📊</span>
                                    </div>
                                    <div>
                                        <p className="font-bold">Exportar CSV</p>
                                        <p className="text-[10px] text-zinc-400 font-medium">Movimentações completas</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { exportCSV(); setShowExportMenu(false); }}
                                    className="w-full px-4 py-4 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-2xl flex items-center gap-4 transition-all group"
                                >
                                    <div className="w-11 h-11 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="text-lg">📋</span>
                                    </div>
                                    <div>
                                        <p className="font-bold">Resumo por Produto</p>
                                        <p className="text-[10px] text-zinc-400 font-medium">Snapshot atual do estoque</p>
                                    </div>
                                </button>
                            </div>
                            <button
                                onClick={() => setShowExportMenu(false)}
                                className="w-full py-3 mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition-colors"
                            >
                                Cancelar
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pro Features Navigation - Apple Pro Aesthetic */}
            <section className="relative z-10 mb-6">
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
                    {[
                        { id: 'products', label: 'Produtos', icon: '📦' },
                        { id: 'timeline', label: 'Time Travel', icon: '⏱️' },
                        { id: 'insights', label: 'Previsões', icon: '🔮' },
                        { id: 'map', label: 'Digital Twin', icon: '🗺️' },
                        { id: 'sourcing', label: 'Pedidos', icon: '🛒' }
                    ].map(tab => (
                        <motion.button
                            key={tab.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                HapticService.trigger('selection')
                                setActiveView(tab.id)
                            }}
                            className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-2xl text-sm font-bold tracking-wide transition-all ${activeView === tab.id
                                ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                                : 'bg-white/80 dark:bg-zinc-800/50 backdrop-blur-xl text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/5'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </motion.button>
                    ))}

                    {/* AR Scanner Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            HapticService.trigger('impactMedium')
                            setShowARScanner(true)
                        }}
                        className="flex-shrink-0 flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-2xl text-sm font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl"
                    >
                        <span>📷</span>
                        Scanner AR
                    </motion.button>
                </div>
            </section>

            {/* AR Scanner Modal */}
            <AnimatePresence>
                {showARScanner && (
                    <ARScanner
                        products={products}
                        onAdjust={(adjustment) => {
                            console.log('Adjustment:', adjustment)
                            // Handle stock adjustment here
                            setShowARScanner(false)
                        }}
                        onClose={() => setShowARScanner(false)}
                    />
                )}
            </AnimatePresence>

            {/* Conditional Content Based on Active View */}
            {activeView === 'products' && (
                <>
                    {/* Dashboard Cards - Apple Pro Aesthetic */}
                    <section className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                        {/* Period Selector - Segmented Control */}
                        <div className="md:col-span-4 flex justify-start mb-2">
                            <div className="p-1 bg-zinc-100/80 dark:bg-black/40 backdrop-blur-md rounded-xl flex gap-1 shadow-inner">
                                {['week', 'month', 'quarter'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setStatsPeriod(p)}
                                        className={`px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${statsPeriod === p
                                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Trimestre'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Total Value - Premium Investment Card */}
                        <div className="md:col-span-2 relative group">
                            <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                                {/* Mesh Gradient on Hover */}
                                <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/[0.03] dark:bg-violet-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                <div className="relative">
                                    <div className="flex justify-between items-start mb-10 md:mb-12">
                                        <div>
                                            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-violet-300/60 uppercase tracking-widest mb-1">Valor Total em Estoque</h3>
                                            <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide">Status: Sincronizado</p>
                                        </div>
                                        <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live Data</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <span className="text-[9px] font-bold text-violet-500/60 uppercase tracking-widest ml-1">Capital Total</span>
                                        <div className="text-4xl md:text-6xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none tabular-nums">
                                            {formatCurrency(stats.totalValue)}
                                        </div>
                                    </div>
                                </div>

                                <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-16 pt-8 md:pt-10 border-t border-zinc-100 dark:border-white/5">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Total Produtos</span>
                                        <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{stats.totalProducts}</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[9px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest">Movimentações</span>
                                        <span className="text-2xl md:text-3xl font-semibold text-violet-600 dark:text-violet-400 tracking-tight tabular-nums">{stats.totalMovements}</span>
                                    </div>
                                    {stats.anomalyCount > 0 && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Alertas Ativos</span>
                                            <span className="text-2xl md:text-3xl font-semibold text-amber-600 dark:text-amber-400 tracking-tight tabular-nums">{stats.anomalyCount}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Entries Card - Liquid Glass */}
                        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                    <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">Entradas</h3>
                                </div>
                                <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                                    +{stats.entriesCurrent}
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-1.5 px-0.5">
                                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{stats.periodLabel}</span>
                                    {stats.entriesTrend !== '0' && (
                                        <span className={`text-[8px] font-bold ${Number(stats.entriesTrend) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {Number(stats.entriesTrend) > 0 ? '↑' : '↓'} {Math.abs(Number(stats.entriesTrend))}%
                                        </span>
                                    )}
                                </div>
                                <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500/80 transition-all duration-1000 rounded-full" style={{ width: `${Math.min(100, (stats.entriesCurrent / (stats.entriesPrevious || 1)) * 50)}%` }} />
                                </div>
                                {stats.entriesPrevious > 0 && (
                                    <p className="text-[10px] text-zinc-400 mt-2">{stats.previousLabel}: {stats.entriesPrevious}</p>
                                )}
                            </div>
                        </div>

                        {/* Exits Card - Liquid Glass */}
                        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                    <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">Saídas</h3>
                                </div>
                                <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                                    -{stats.exitsCurrent}
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-1.5 px-0.5">
                                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{stats.periodLabel}</span>
                                    {stats.exitsTrend !== '0' && (
                                        <span className={`text-[8px] font-bold ${Number(stats.exitsTrend) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {Number(stats.exitsTrend) > 0 ? '↑' : '↓'} {Math.abs(Number(stats.exitsTrend))}%
                                        </span>
                                    )}
                                </div>
                                <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500/80 transition-all duration-1000 rounded-full" style={{ width: `${Math.min(100, (stats.exitsCurrent / (stats.exitsPrevious || 1)) * 50)}%` }} />
                                </div>
                                {stats.exitsPrevious > 0 && (
                                    <p className="text-[10px] text-zinc-400 mt-2">{stats.previousLabel}: {stats.exitsPrevious}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Supplier Analytics - Premium Ledger */}
                    {supplierStats.length > 0 && (
                        <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[3rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
                            <div className="p-6 md:p-10 pb-4 md:pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
                                <div>
                                    <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Supplier Protocol</h2>
                                    <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">Análise de Fornecedores</h3>
                                </div>
                                <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Últimos 30d</span>
                                </div>
                            </div>

                            <div className="px-6 md:px-10 pb-6 md:pb-10">
                                <div className="space-y-3">
                                    {supplierStats.map((s, i) => {
                                        const maxVal = supplierStats[0]?.totalValue || 1
                                        const pct = (s.totalValue / maxVal * 100).toFixed(0)
                                        return (
                                            <div key={s.name} className="group bg-zinc-50 dark:bg-white/[0.02] rounded-2xl p-5 border border-zinc-100 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-all">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg group-hover:scale-110 transition-transform">{i + 1}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-base font-semibold text-zinc-800 dark:text-white truncate block">{s.name}</span>
                                                        <span className="text-[10px] text-zinc-400 font-medium">{s.productCount} produtos • {s.movementCount} movimentações</span>
                                                    </div>
                                                    <span className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">{formatCurrency(s.totalValue)}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="text-center p-3 bg-white dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-white/5">
                                                        <p className="text-[8px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest mb-1">Frequência</p>
                                                        <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{s.frequencyScore}%</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-white dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-white/5">
                                                        <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Entregas</p>
                                                        <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{s.recentMovements}</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-white dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-white/5">
                                                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Última</p>
                                                        <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">{s.lastDelivery ? timeAgo(s.lastDelivery) : '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 h-1 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Filters - Premium Minimal */}
                    <section className="relative z-10 space-y-4">
                        {/* Search with Liquid Glass */}
                        <div className="relative">
                            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar produto, fornecedor..."
                                className="w-full pl-14 pr-6 py-5 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-2xl text-base text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none border border-zinc-200/50 dark:border-white/5 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
                            />
                        </div>

                        {/* Category Pills - 44pt Touch */}
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`flex-shrink-0 px-5 py-3 min-h-[48px] rounded-full text-sm font-bold tracking-wide transition-all ${activeCategory === 'all' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg' : 'bg-white/80 dark:bg-zinc-800/50 backdrop-blur-xl text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/5'}`}
                            >
                                Todos
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`flex-shrink-0 px-5 py-3 min-h-[48px] rounded-full text-sm font-bold tracking-wide transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg' : 'bg-white/80 dark:bg-zinc-800/50 backdrop-blur-xl text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/5'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Filter Dropdowns - 44pt Touch */}
                        <div className="flex gap-3 flex-wrap">
                            <select
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                className="px-5 py-3 min-h-[48px] rounded-xl bg-white/80 dark:bg-zinc-800/60 backdrop-blur-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-white/5 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                            >
                                <option value="all">Todo período</option>
                                <option value="7d">Últimos 7 dias</option>
                                <option value="30d">Últimos 30 dias</option>
                                <option value="90d">Últimos 90 dias</option>
                            </select>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="px-5 py-3 min-h-[48px] rounded-xl bg-white/80 dark:bg-zinc-800/60 backdrop-blur-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-white/5 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                            >
                                <option value="recent">Mais recentes</option>
                                <option value="name">Nome A-Z</option>
                                <option value="value">Maior valor</option>
                                <option value="movements">Mais movimentações</option>
                            </select>
                        </div>
                    </section>

                    {/* Product List */}
                    <section className="relative z-10 space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product, index) => (
                                <ProductCard key={product.id} product={product} index={index} onClick={() => setViewingProduct(product)} />
                            ))}
                        </AnimatePresence>
                        {filteredProducts.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">{searchQuery ? 'Nenhum resultado' : 'Sem produtos'}</h3>
                            </motion.div>
                        )}
                    </section>

                    {/* Product Detail Modal */}
                    <AnimatePresence>
                        {viewingProduct && (
                            <ProductDetailModal
                                product={viewingProduct}
                                onClose={() => setViewingProduct(null)}
                                onAddMovement={handleAddMovement}
                                onAddNote={handleAddNote}
                                onDeleteNote={handleDeleteNote}
                            />
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* Timeline View - Time Travel UI */}
            {activeView === 'timeline' && (
                <TimelineAudit
                    entries={movements.map((m, i) => ({
                        id: m.id || `mov-${i}`,
                        timestamp: m.createdAt,
                        action: m.type === 'entry' ? 'ENTRY' : 'EXIT',
                        productName: products.find(p => p.id === m.productId)?.name || 'Produto',
                        stock: m.quantity,
                        price: m.price,
                        userName: m.userName || 'Sistema'
                    }))}
                    onSelectEntry={(entry) => {
                        HapticService.trigger('selection')
                        console.log('Selected:', entry)
                    }}
                    isFromPostgres={false} // Will be true when connected to Data Connect
                    isLoading={false}
                />
            )}

            {/* Predictive Insights View */}
            {activeView === 'insights' && (
                <PredictiveInsights
                    products={products}
                    movements={movements}
                    onCreateOrder={(prediction) => {
                        console.log('Create order for:', prediction)
                        HapticService.trigger('success')
                    }}
                    onDismiss={(productId) => console.log('Dismissed:', productId)}
                />
            )}

            {/* Digital Twin Map View */}
            {activeView === 'map' && (
                <DigitalTwinMap
                    products={products}
                    movements={movements}
                />
            )}

            {/* Smart Sourcing View - AI Powered Workflow */}
            {activeView === 'sourcing' && (
                <SmartSourcingWorkflow
                    products={products}
                    movements={movements}
                    onCreateQuotation={async (supplier, items) => {
                        console.log('Creating quotation for:', supplier, items)
                        HapticService.trigger('success')
                    }}
                    userId="user_1"
                    userName="Operador"
                />
            )}
        </div>
    )
}
function ProductCard({ product, index, onClick }) {
    const stockValue = product.currentStock * product.currentPrice
    const hasAnomalies = product.anomalies?.length > 0

    // Calculate price change percentage
    const priceChange = useMemo(() => {
        if (!product.priceHistory || product.priceHistory.length < 2) return null
        const prices = product.priceHistory.map(p => Number(p.price) || 0)
        const current = prices[prices.length - 1]
        const previous = prices[prices.length - 2]
        if (!previous) return null
        const change = ((current - previous) / previous * 100)
        return change
    }, [product.priceHistory])

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={onClick}
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-5 cursor-pointer border transition-all duration-300 ${hasAnomalies
                ? 'border-amber-300/60 dark:border-amber-500/30 shadow-amber-500/5'
                : 'border-zinc-200/60 dark:border-white/5'
                } hover:shadow-2xl hover:shadow-violet-500/5 dark:hover:shadow-violet-500/10`}
        >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/0 to-indigo-500/0 group-hover:from-violet-500/[0.02] group-hover:to-indigo-500/[0.02] transition-all duration-500" />

            {/* Anomaly badges */}
            {hasAnomalies && (
                <div className="absolute top-4 right-4 flex gap-1.5">
                    {product.anomalies.slice(0, 3).map((a, i) => (
                        <motion.span
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="text-base drop-shadow-sm"
                            title={a.message}
                        >
                            {a.icon}
                        </motion.span>
                    ))}
                </div>
            )}

            <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Product name and badges */}
                    <div className="flex items-center gap-2.5 mb-2">
                        <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-white truncate leading-tight tracking-tight">
                            {product.name}
                        </h3>
                        {product.totalMovements > 0 && (
                            <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-violet-100/80 dark:bg-violet-500/20 text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">
                                {product.totalMovements} mov
                            </span>
                        )}
                    </div>

                    {/* Category and supplier */}
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-3 font-medium">
                        {product.category}{product.supplier && <span className="text-zinc-300 dark:text-zinc-600"> • </span>}
                        {product.supplier && <span className="text-zinc-400 dark:text-zinc-500">{product.supplier}</span>}
                    </p>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wide">
                        <span>Cadastro: {formatDate(product.createdAt)}</span>
                        {product.lastMovementDate && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                <span>Última: {timeAgo(product.lastMovementDate)}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right side: stock and price */}
                <div className="text-right flex-shrink-0 min-w-[100px]">
                    <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
                        {product.currentStock}
                        <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500 ml-1">{product.unit}</span>
                    </p>
                    <p className="text-[15px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                        {formatCurrency(stockValue)}
                    </p>

                    {/* Price change indicator */}
                    {priceChange !== null && Math.abs(priceChange) >= 1 && (
                        <div className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold tabular-nums ${priceChange > 0
                            ? 'bg-rose-100/80 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            }`}>
                            {priceChange > 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(1)}%
                        </div>
                    )}

                    {/* Sparkline */}
                    {product.priceHistory.length >= 2 && (
                        <div className="mt-3 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Sparkline data={product.priceHistory} height={32} />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-violet-500/0 to-transparent group-hover:via-violet-500/30 transition-all duration-500" />
        </motion.div>
    )
}

// Product Detail Modal
function ProductDetailModal({ product, onClose, onAddMovement, onAddNote, onDeleteNote }) {
    useScrollLock(true)
    const [activeTab, setActiveTab] = useState('resumo')
    const [showAddMovement, setShowAddMovement] = useState(false)
    const [newMovement, setNewMovement] = useState({ type: 'entry', quantity: '', price: '', reason: '' })
    const [newNote, setNewNote] = useState({ text: '', category: 'general' })

    const tabs = [
        { id: 'resumo', label: 'Resumo', icon: '📊' },
        { id: 'movimentacoes', label: 'Movimentos', icon: '↕️' },
        { id: 'precos', label: 'Preços', icon: '💵' },
        { id: 'notas', label: 'Notas', icon: '📝' }
    ]

    const handleSubmitMovement = () => {
        if (!newMovement.quantity) return
        onAddMovement(product.id, {
            type: newMovement.type,
            quantity: Number(newMovement.quantity),
            price: newMovement.price ? Number(newMovement.price) : null,
            reason: newMovement.reason || null
        })
        setNewMovement({ type: 'entry', quantity: '', price: '', reason: '' })
        setShowAddMovement(false)
    }

    const handleSubmitNote = () => {
        if (!newNote.text.trim()) return
        onAddNote(product.id, { text: newNote.text.trim(), category: newNote.category })
        setNewNote({ text: '', category: 'general' })
    }

    const stockValue = product.currentStock * product.currentPrice

    // Calculate average price and price trend
    const priceStats = useMemo(() => {
        if (!product.priceHistory || product.priceHistory.length < 1) return null
        const prices = product.priceHistory.map(p => Number(p.price) || 0).filter(p => p > 0)
        if (prices.length === 0) return null
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        return { avg, min, max, count: prices.length }
    }, [product.priceHistory])

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
            />
            <motion.div
                initial={{ y: '100%', opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: "spring", damping: 32, stiffness: 400 }}
                className="relative w-full md:max-w-lg bg-white dark:bg-zinc-900 md:rounded-3xl rounded-t-[28px] overflow-hidden shadow-2xl"
                style={{ maxHeight: '92vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Drag handle for mobile */}
                <div className="flex justify-center pt-3 pb-1 md:hidden">
                    <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                </div>

                {/* Header */}
                <div className="px-6 pb-4 pt-2 md:pt-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-[22px] font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                                    {product.name}
                                </h2>
                                {product.anomalies?.slice(0, 3).map((a, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1 * i }}
                                        className="text-base"
                                        title={a.message}
                                    >
                                        {a.icon}
                                    </motion.span>
                                ))}
                            </div>
                            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                                {product.category}
                                {product.subcategory && <span className="text-zinc-300 dark:text-zinc-600"> • </span>}
                                {product.subcategory && <span>{product.subcategory}</span>}
                                {product.supplier && <span className="text-zinc-300 dark:text-zinc-600"> • </span>}
                                {product.supplier && <span className="text-zinc-400 dark:text-zinc-500">{product.supplier}</span>}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    {/* Segmented Control Tabs */}
                    <div className="flex gap-1 mt-5 p-1 bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur rounded-2xl">
                        {tabs.map(tab => (
                            <motion.button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex-1 px-2 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-colors ${activeTab === tab.id
                                    ? 'text-zinc-900 dark:text-white'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-sm"
                                        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center justify-center gap-1">
                                    {tab.label}
                                    {tab.id === 'notas' && product.notes?.length > 0 && (
                                        <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] flex items-center justify-center">
                                            {product.notes.length}
                                        </span>
                                    )}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 220px)' }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'resumo' && (
                            <motion.div
                                key="resumo"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-5"
                            >
                                {/* Main Stats Grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 }}
                                        className="bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-800 dark:to-zinc-800/50 rounded-2xl p-4 text-center"
                                    >
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Estoque</p>
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
                                            {product.currentStock}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{product.unit}</p>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-800 dark:to-zinc-800/50 rounded-2xl p-4 text-center"
                                    >
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Preço Unit.</p>
                                        <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
                                            {formatCurrency(product.currentPrice)}
                                        </p>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/15 dark:to-emerald-500/5 rounded-2xl p-4 text-center"
                                    >
                                        <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">Valor Total</p>
                                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums tracking-tight">
                                            {formatCurrency(stockValue)}
                                        </p>
                                    </motion.div>
                                </div>

                                {/* Price Statistics */}
                                {priceStats && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-violet-50/50 dark:bg-violet-500/5 rounded-2xl p-4 border border-violet-100 dark:border-violet-500/10"
                                    >
                                        <h4 className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-3">
                                            📊 Estatísticas de Preço ({priceStats.count} registros)
                                        </h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-center">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase">Mínimo</p>
                                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(priceStats.min)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase">Média</p>
                                                <p className="text-sm font-bold text-violet-600 dark:text-violet-400 tabular-nums">{formatCurrency(priceStats.avg)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase">Máximo</p>
                                                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatCurrency(priceStats.max)}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Anomaly Alerts */}
                                {product.anomalies?.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                        className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 rounded-2xl p-4 border border-amber-200/60 dark:border-amber-500/20"
                                    >
                                        <h4 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">⚠️</span>
                                            Alertas Detectados
                                        </h4>
                                        <div className="space-y-2">
                                            {product.anomalies.map((a, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-white/50 dark:bg-zinc-900/30 rounded-xl px-3 py-2">
                                                    <span>{a.icon}</span>
                                                    <span className="font-medium">{a.message}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Details List */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl p-4 space-y-0"
                                >
                                    {product.supplier && (
                                        <div className="flex justify-between items-center py-3 border-b border-zinc-200/50 dark:border-zinc-700/50">
                                            <span className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">Fornecedor</span>
                                            <span className="text-[13px] font-semibold text-zinc-900 dark:text-white">{product.supplier}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-3 border-b border-zinc-200/50 dark:border-zinc-700/50">
                                        <span className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">Cadastrado em</span>
                                        <span className="text-[13px] font-semibold text-zinc-900 dark:text-white">{formatDate(product.createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-zinc-200/50 dark:border-zinc-700/50">
                                        <span className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">Total de Movimentações</span>
                                        <span className="text-[13px] font-semibold text-zinc-900 dark:text-white tabular-nums">{product.totalMovements}</span>
                                    </div>
                                    {product.minStock > 0 && (
                                        <div className="flex justify-between items-center py-3 border-b border-zinc-200/50 dark:border-zinc-700/50">
                                            <span className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">Estoque Mínimo</span>
                                            <span className="text-[13px] font-semibold text-zinc-900 dark:text-white">{product.minStock} {product.unit}</span>
                                        </div>
                                    )}
                                    {product.maxStock > 0 && (
                                        <div className="flex justify-between items-center py-3">
                                            <span className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">Estoque Máximo</span>
                                            <span className="text-[13px] font-semibold text-zinc-900 dark:text-white">{product.maxStock} {product.unit}</span>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}

                        {activeTab === 'movimentacoes' && (
                            <motion.div
                                key="movimentacoes"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {!showAddMovement ? (
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setShowAddMovement(true)}
                                        className="w-full py-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-500 hover:border-violet-400 hover:text-violet-600 transition-all"
                                    >
                                        + Registrar Movimentação
                                    </motion.button>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 space-y-4"
                                    >
                                        <div className="flex gap-2">
                                            <button onClick={() => setNewMovement(p => ({ ...p, type: 'entry' }))} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${newMovement.type === 'entry' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>↓ Entrada</button>
                                            <button onClick={() => setNewMovement(p => ({ ...p, type: 'exit' }))} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${newMovement.type === 'exit' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>↑ Saída</button>
                                        </div>
                                        <input type="number" placeholder={`Quantidade (${product.unit})`} value={newMovement.quantity} onChange={e => setNewMovement(p => ({ ...p, quantity: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-medium border-0 focus:ring-2 focus:ring-violet-500/20" />
                                        {newMovement.type === 'entry' && <input type="number" placeholder="Preço pago (opcional)" value={newMovement.price} onChange={e => setNewMovement(p => ({ ...p, price: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white border-0 focus:ring-2 focus:ring-violet-500/20" />}
                                        <input type="text" placeholder="Motivo (opcional)" value={newMovement.reason} onChange={e => setNewMovement(p => ({ ...p, reason: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white border-0 focus:ring-2 focus:ring-violet-500/20" />
                                        <div className="flex gap-3">
                                            <button onClick={() => setShowAddMovement(false)} className="flex-1 py-3.5 rounded-xl bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold">Cancelar</button>
                                            <button onClick={handleSubmitMovement} className="flex-1 py-3.5 rounded-xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-500/20">Registrar</button>
                                        </div>
                                    </motion.div>
                                )}

                                {product.movements.length === 0 ? (
                                    <p className="text-center text-sm text-zinc-400 py-12">Nenhuma movimentação registrada</p>
                                ) : (
                                    <div className="space-y-2">
                                        {[...product.movements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((mov, i) => (
                                            <motion.div
                                                key={mov.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="flex items-center gap-3 p-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl"
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mov.type === 'entry' ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/20'}`}>
                                                    <span className={`text-lg font-bold ${mov.type === 'entry' ? 'text-emerald-600' : 'text-rose-600'}`}>{mov.type === 'entry' ? '↓' : '↑'}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                                                        {mov.type === 'entry' ? 'Entrada' : 'Saída'}
                                                        <span className={`ml-2 font-bold ${mov.type === 'entry' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {mov.type === 'exit' ? '-' : '+'}{mov.quantity} {product.unit}
                                                        </span>
                                                    </p>
                                                    <p className="text-[11px] text-zinc-400">{formatDateTime(mov.createdAt)}{mov.reason && ` • ${mov.reason}`}</p>
                                                </div>
                                                {mov.price && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(mov.price)}</span>}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'precos' && (
                            <motion.div
                                key="precos"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-5"
                            >
                                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/5 rounded-2xl p-5 text-center">
                                    <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">Preço Atual</p>
                                    <p className="text-4xl font-bold text-violet-700 dark:text-violet-300 tabular-nums tracking-tight">{formatCurrency(product.currentPrice)}</p>
                                </div>

                                {product.priceHistory.length >= 2 && (
                                    <div className="bg-white dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-700/50">
                                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-4">📈 Tendência de Preços</h4>
                                        <div className="flex justify-center"><Sparkline data={product.priceHistory} height={80} /></div>
                                    </div>
                                )}

                                {product.priceHistory.length === 0 ? (
                                    <p className="text-center text-sm text-zinc-400 py-8">Nenhum histórico de preços</p>
                                ) : (
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Histórico de Preços</h4>
                                        <div className="bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl overflow-hidden">
                                            {product.priceHistory.slice().reverse().map((ph, i) => (
                                                <div key={i} className="flex justify-between items-center py-3 px-4 border-b border-zinc-200/50 dark:border-zinc-700/50 last:border-0">
                                                    <span className="text-[13px] text-zinc-500 font-medium">{formatDate(ph.date)}</span>
                                                    <span className="text-[13px] font-bold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(ph.price)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'notas' && (
                            <motion.div
                                key="notas"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-5"
                            >
                                {/* Add Note Form */}
                                <div className="bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl p-5 space-y-4">
                                    <textarea
                                        value={newNote.text}
                                        onChange={e => setNewNote(p => ({ ...p, text: e.target.value }))}
                                        placeholder="Adicionar observação..."
                                        rows={3}
                                        className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white resize-none border-0 focus:ring-2 focus:ring-violet-500/20 text-[14px]"
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {NOTE_CATEGORIES.map(cat => (
                                            <motion.button
                                                key={cat.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setNewNote(p => ({ ...p, category: cat.id }))}
                                                className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${newNote.category === cat.id ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}
                                            >
                                                {cat.icon} {cat.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={handleSubmitNote}
                                        disabled={!newNote.text.trim()}
                                        className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        Adicionar Nota
                                    </motion.button>
                                </div>

                                {/* Notes List */}
                                {product.notes?.length === 0 ? (
                                    <p className="text-center text-sm text-zinc-400 py-12">Nenhuma nota adicionada</p>
                                ) : (
                                    <div className="space-y-3">
                                        {product.notes?.slice().reverse().map((note, i) => {
                                            const cat = NOTE_CATEGORIES.find(c => c.id === note.category) || NOTE_CATEGORIES[0]
                                            return (
                                                <motion.div
                                                    key={note.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="bg-white dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-700/50"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-base">{cat.icon}</span>
                                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{cat.label}</span>
                                                                <span className="text-[10px] text-zinc-400">• {timeAgo(note.createdAt)}</span>
                                                            </div>
                                                            <p className="text-[14px] text-zinc-700 dark:text-zinc-200 leading-relaxed">{note.text}</p>
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => onDeleteNote(product.id, note.id)}
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl text-[15px] font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                    >
                        Fechar
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}
