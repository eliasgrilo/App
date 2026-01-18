/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SALES HEATMAP CHART — Premium Apple HIG Design
 * 
 * Premium temporal sales visualization featuring:
 * - 7-day × 17-hour interactive heatmap grid
 * - Peak/slow period identification with animated highlights
 * - Summary cards with key metrics
 * - Insights panel with actionable recommendations
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Clock, TrendingUp, Moon, Lightbulb, ChevronDown, Sun, Zap } from 'lucide-react'
import type { SalesHeatmapData, DayOfWeekFull, HeatmapCell } from '../types'
import { GlassCard, AnimatedCurrency, HeroMetricCard, MagneticHover, ElasticScale, Depth3DCard } from './PremiumComponents'

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const DAYS: DayOfWeekFull[] = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6am to 10pm

const generateMockHeatmapData = (): SalesHeatmapData => {
    const cells: HeatmapCell[] = []
    let maxValue = 0

    DAYS.forEach(day => {
        HOURS.forEach(hour => {
            let baseValue = 500
            if (day === 'Sáb' || day === 'Dom') baseValue *= 1.4
            if (hour >= 11 && hour <= 14) baseValue *= 1.8
            if (hour >= 18 && hour <= 21) baseValue *= 1.6
            if (hour >= 7 && hour <= 9) baseValue *= 1.3
            if (hour >= 15 && hour <= 17) baseValue *= 0.7

            const value = Math.round(baseValue * (0.8 + Math.random() * 0.4))
            const orders = Math.round(value / 45)
            if (value > maxValue) maxValue = value

            cells.push({
                day, hour, value, intensity: 0, orders,
                avgTicket: Math.round(value / orders)
            })
        })
    })

    cells.forEach(cell => { cell.intensity = cell.value / maxValue })

    const sortedCells = [...cells].sort((a, b) => b.value - a.value)
    const peakCell = sortedCells[0]
    const slowCell = sortedCells[sortedCells.length - 1]

    return {
        cells,
        summary: {
            peakDay: peakCell?.day || 'Sáb',
            peakHour: peakCell?.hour || 12,
            peakValue: peakCell?.value || 0,
            slowestDay: slowCell?.day || 'Ter',
            slowestHour: slowCell?.hour || 16,
            totalSales: cells.reduce((sum, c) => sum + c.value, 0),
            avgHourlySales: Math.round(cells.reduce((sum, c) => sum + c.value, 0) / cells.length)
        },
        patterns: [
            { type: 'peak', description: 'Horário de almoço (12-13h) é o pico de vendas', recommendation: 'Aumentar equipe no horário' },
            { type: 'slow', description: 'Período da tarde (15-17h) tem baixo movimento', recommendation: 'Promoções happy hour podem aumentar vendas' },
            { type: 'opportunity', description: 'Sábado à noite tem potencial não explorado', recommendation: 'Considere eventos ou promoções especiais' }
        ]
    }
}

export const MOCK_SALES_HEATMAP = generateMockHeatmapData()

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY CARD
// ═══════════════════════════════════════════════════════════════════════════════

const SummaryCard: React.FC<{
    icon: React.ReactNode
    iconBg: string
    label: string
    value: string
    subtitle: string
}> = ({ icon, iconBg, label, value, subtitle }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="
            relative rounded-2xl p-5 border overflow-hidden
            bg-white/80 dark:bg-zinc-900/80
            backdrop-blur-xl
            border-zinc-200/60 dark:border-white/[0.08]
            shadow-sm
        "
    >
        <div className="flex items-start gap-4">
            <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                ${iconBg} shadow-lg
            `}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {label}
                </p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
                    {value}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
            </div>
        </div>
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// HEATMAP CELL
// ═══════════════════════════════════════════════════════════════════════════════

interface HeatmapCellProps {
    cell: HeatmapCell
    onHover: (cell: HeatmapCell | null, e: React.MouseEvent) => void
    isHovered: boolean
    isPeak: boolean
    isSlow: boolean
}

const HeatmapCellComponent: React.FC<HeatmapCellProps> = ({
    cell, onHover, isHovered, isPeak, isSlow
}) => {
    // Apple Official System Colors with refined opacity
    const getStyle = (intensity: number) => {
        if (intensity < 0.2) return { bg: '#007AFF', opacity: 0.15, ring: '#007AFF' }
        if (intensity < 0.4) return { bg: '#5AC8FA', opacity: 0.25, ring: '#5AC8FA' }
        if (intensity < 0.6) return { bg: '#34C759', opacity: 0.30, ring: '#34C759' }
        if (intensity < 0.8) return { bg: '#FF9500', opacity: 0.38, ring: '#FF9500' }
        return { bg: '#FF3B30', opacity: 0.50, ring: '#FF3B30' }
    }

    const style = getStyle(cell.intensity)

    return (
        <motion.div
            onMouseEnter={(e) => onHover(cell, e)}
            onMouseLeave={(e) => onHover(null, e)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{
                scale: 1.15,
                zIndex: 30,
                transition: { type: 'spring', stiffness: 600, damping: 25 }
            }}
            whileTap={{ scale: 0.92 }}
            className={`
                relative flex-1 h-11 min-w-[42px] rounded-[10px] cursor-pointer
                overflow-hidden
                transition-all duration-200
                ${isHovered ? 'shadow-2xl z-30' : 'shadow-sm hover:shadow-md'}
            `}
            style={{
                backgroundColor: style.bg,
                boxShadow: isHovered
                    ? `0 0 0 3px white, 0 0 0 5px ${style.ring}, 0 20px 40px -10px rgba(0,0,0,0.3)`
                    : isPeak
                        ? `0 0 0 2px #FF3B30, 0 4px 12px rgba(255,59,48,0.3)`
                        : isSlow
                            ? `0 0 0 2px #007AFF, 0 4px 12px rgba(0,122,255,0.3)`
                            : undefined
            }}
        >
            {/* Inner glass effect */}
            <div
                className="absolute inset-0 rounded-[10px]"
                style={{
                    backgroundColor: style.bg,
                    opacity: style.opacity
                }}
            />

            {/* Top highlight */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-[10px]" />

            {/* Peak indicator */}
            {isPeak && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                >
                    <Flame className="w-5 h-5 text-white drop-shadow-lg" />
                </motion.div>
            )}

            {/* Slow indicator */}
            {isSlow && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-white drop-shadow-lg" />
                </div>
            )}
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

const HeatmapTooltip: React.FC<{
    cell: HeatmapCell | null
    position: { x: number; y: number }
}> = ({ cell, position }) => {
    if (!cell) return null

    return createPortal(
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="
                bg-white/95 dark:bg-zinc-900/95
                backdrop-blur-xl
                border border-zinc-200/60 dark:border-white/[0.08]
                rounded-2xl p-4 shadow-2xl
                min-w-[200px]
            "
            style={{
                position: 'fixed',
                left: position.x + 20,
                top: position.y - 100,
                zIndex: 99999,
                pointerEvents: 'none'
            }}
        >
            <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-zinc-400" />
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    {cell.day}, {cell.hour}:00
                </p>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Vendas</span>
                    <span className="text-sm font-bold text-emerald-600">
                        R$ {cell.value.toLocaleString('pt-BR')}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Pedidos</span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {cell.orders}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Ticket Médio</span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        R$ {cell.avgTicket}
                    </span>
                </div>
            </div>
            {/* Intensity bar */}
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Intensidade</span>
                    <span>{(cell.intensity * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cell.intensity * 100}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-red-500 rounded-full"
                    />
                </div>
            </div>
        </motion.div>,
        document.body
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const InsightCard: React.FC<{
    pattern: SalesHeatmapData['patterns'][0]
    index: number
}> = ({ pattern, index }) => {
    const config = {
        peak: { icon: Flame, gradient: 'from-red-500 to-rose-600', bg: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30', border: 'border-red-200/60 dark:border-red-800/30' },
        slow: { icon: Moon, gradient: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30', border: 'border-blue-200/60 dark:border-blue-800/30' },
        opportunity: { icon: Lightbulb, gradient: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30', border: 'border-amber-200/60 dark:border-amber-800/30' }
    }[pattern.type]
    const Icon = config.icon

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
                relative rounded-2xl p-4 border overflow-hidden
                bg-gradient-to-br ${config.bg} ${config.border}
            `}
        >
            <div className="flex items-start gap-3">
                <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    bg-gradient-to-br ${config.gradient} shadow-lg
                `}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {pattern.description}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {pattern.recommendation}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SalesHeatmapChartProps {
    data: SalesHeatmapData
    showTitle?: boolean
}

export const SalesHeatmapChart: React.FC<SalesHeatmapChartProps> = ({
    data,
    showTitle = true
}) => {
    const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [showInsights, setShowInsights] = useState(true)

    const handleHover = (cell: HeatmapCell | null, e: React.MouseEvent) => {
        setHoveredCell(cell)
        setMousePos({ x: e.clientX, y: e.clientY })
    }

    const grid = useMemo(() => {
        const gridMap = new Map<string, HeatmapCell>()
        data.cells.forEach(cell => {
            gridMap.set(`${cell.day}-${cell.hour}`, cell)
        })
        return gridMap
    }, [data.cells])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            {showTitle && (
                <div className="flex items-center gap-4">
                    <MagneticHover strength={0.03}>
                        <ElasticScale scale={1.02}>
                            <div className="
                                w-14 h-14 rounded-2xl
                                bg-gradient-to-br from-orange-500 to-red-600
                                flex items-center justify-center
                                shadow-xl shadow-orange-500/30
                            ">
                                <Flame className="w-7 h-7 text-white" />
                            </div>
                        </ElasticScale>
                    </MagneticHover>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                            Mapa de Calor de Vendas
                        </h2>
                        <p className="text-sm text-zinc-500">
                            Padrões de vendas por hora e dia da semana
                        </p>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <SummaryCard
                    icon={<Flame className="w-6 h-6 text-white" />}
                    iconBg="bg-gradient-to-br from-red-500 to-rose-600"
                    label="Horário de Pico"
                    value={`${data.summary.peakDay} ${data.summary.peakHour}h`}
                    subtitle={`R$ ${data.summary.peakValue.toLocaleString('pt-BR')}`}
                />
                <SummaryCard
                    icon={<Moon className="w-6 h-6 text-white" />}
                    iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
                    label="Menor Movimento"
                    value={`${data.summary.slowestDay} ${data.summary.slowestHour}h`}
                    subtitle="Melhor para reposição"
                />
                <SummaryCard
                    icon={<TrendingUp className="w-6 h-6 text-white" />}
                    iconBg="bg-gradient-to-br from-emerald-500 to-green-600"
                    label="Média por Hora"
                    value={`R$ ${data.summary.avgHourlySales.toLocaleString('pt-BR')}`}
                    subtitle="Ticket médio"
                />
            </div>

            {/* Heatmap Grid */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-zinc-400" />
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Distribuição Semanal de Vendas
                    </span>
                </div>

                {/* Hour Labels */}
                <div className="flex ml-14 mb-3">
                    {HOURS.map(hour => (
                        <div
                            key={hour}
                            className="flex-1 min-w-[40px] text-center text-[11px] font-semibold text-zinc-500"
                        >
                            {hour}h
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="space-y-2">
                    {DAYS.map((day, dayIdx) => (
                        <motion.div
                            key={day}
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: dayIdx * 0.05 }}
                        >
                            <div className="w-11 text-sm font-bold text-zinc-600 dark:text-zinc-400">
                                {day}
                            </div>
                            <div className="flex gap-1.5 flex-1">
                                {HOURS.map(hour => {
                                    const cell = grid.get(`${day}-${hour}`)
                                    if (!cell) return null
                                    const isPeak = day === data.summary.peakDay && hour === data.summary.peakHour
                                    const isSlow = day === data.summary.slowestDay && hour === data.summary.slowestHour
                                    return (
                                        <HeatmapCellComponent
                                            key={`${day}-${hour}`}
                                            cell={cell}
                                            onHover={handleHover}
                                            isHovered={hoveredCell === cell}
                                            isPeak={isPeak}
                                            isSlow={isSlow}
                                        />
                                    )
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Legend - Apple System Colors */}
                <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-[#007AFF]" />
                        <span className="text-xs font-medium text-zinc-500">Baixo</span>
                    </div>
                    <div className="flex items-center gap-0.5 h-4">
                        <div className="w-8 h-full rounded-l-full bg-[#007AFF]/20" />
                        <div className="w-8 h-full bg-[#5AC8FA]/30" />
                        <div className="w-8 h-full bg-[#34C759]/30" />
                        <div className="w-8 h-full bg-[#FF9500]/35" />
                        <div className="w-8 h-full rounded-r-full bg-[#FF3B30]/40" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-500">Alto</span>
                        <Flame className="w-4 h-4 text-[#FF3B30]" />
                    </div>
                </div>
            </GlassCard>

            {/* Tooltip */}
            <AnimatePresence>
                {hoveredCell && (
                    <HeatmapTooltip cell={hoveredCell} position={mousePos} />
                )}
            </AnimatePresence>

            {/* Insights Toggle */}
            <button
                onClick={() => setShowInsights(!showInsights)}
                className="w-full"
            >
                <GlassCard className="p-4" hover>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                                <Lightbulb className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    Insights e Recomendações
                                </p>
                                <p className="text-xs text-zinc-500">
                                    {data.patterns.length} padrões identificados
                                </p>
                            </div>
                        </div>
                        <motion.div animate={{ rotate: showInsights ? 180 : 0 }}>
                            <ChevronDown className="w-5 h-5 text-zinc-400" />
                        </motion.div>
                    </div>
                </GlassCard>
            </button>

            <AnimatePresence>
                {showInsights && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3 overflow-hidden"
                    >
                        {data.patterns.map((pattern, index) => (
                            <InsightCard key={index} pattern={pattern} index={index} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ PRINT-ONLY SECTION ═══ */}
            <div className="hidden print:block mt-6">
                <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                        <p className="text-xl font-bold text-green-600">R$ {(data.summary.totalSales / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-gray-600">Total Vendas</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-black">R$ {data.summary.avgHourlySales.toFixed(0)}</p>
                        <p className="text-xs text-gray-600">Média/Hora</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-blue-600">{data.summary.peakDay} {data.summary.peakHour}h</p>
                        <p className="text-xs text-gray-600">Pico (R${data.summary.peakValue})</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-amber-600">{data.summary.slowestDay} {data.summary.slowestHour}h</p>
                        <p className="text-xs text-gray-600">Período Fraco</p>
                    </div>
                </div>
                <div className="mb-4">
                    <h4 className="text-sm font-bold text-black mb-2 uppercase">Padrões Identificados</h4>
                    <ul className="space-y-2">
                        {data.patterns.map((pattern, idx) => (
                            <li key={idx} className={`p-2 rounded border ${pattern.type === 'peak' ? 'bg-green-50 border-green-200' : pattern.type === 'slow' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                                <p className="text-xs font-semibold text-black">{pattern.description}</p>
                                <p className="text-[10px] text-gray-600">{pattern.recommendation}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.div>
    )
}

export default SalesHeatmapChart
