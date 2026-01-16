/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INVENTORY REPORT PAGE — Premium Dashboard + Print Report Hybrid
 * 
 * A flagship Apple HIG-compliant inventory dashboard that transforms into a
 * perfectly formatted formal report when printed. Built with obsessive attention
 * to typography, spacing, and print engineering.
 * 
 * Design Philosophy:
 * - Screen: Interactive bento grid dashboard with Swift Charts-style visualizations
 * - Print: Formal business report with proper headers, pagination, and ink-saving
 * 
 * @author Padoca Engineering Team
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useCallback } from 'react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS — Robust TypeScript interfaces for inventory domain
// ═══════════════════════════════════════════════════════════════════════════════

interface InventoryItem {
    id: number
    name: string
    category: string
    subcategory?: string
    unit: string
    packageQuantity: number
    packageCount: number
    minStock?: number
    maxStock?: number
    pricePerUnit: number
    supplier?: string
    supplierId?: number
    notes?: string
    expiryDate?: string
    createdAt?: string
    updatedAt?: string
}

interface COGSTrend {
    month: string
    value: number
}

interface CategoryBreakdown {
    name: string
    value: number
    percentage: number
    itemCount: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA — Realistic Brazilian bakery inventory
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_INVENTORY_ITEMS: InventoryItem[] = [
    { id: 1, name: 'Farinha de Trigo 50kg', category: 'Farináceos', subcategory: 'Farinhas', unit: 'kg', packageQuantity: 50, packageCount: 8, minStock: 200, pricePerUnit: 4.20, supplier: 'Moinho Globo', expiryDate: '2026-03-15' },
    { id: 2, name: 'Fermento Biológico Seco', category: 'Fermentos', subcategory: 'Fermentos', unit: 'kg', packageQuantity: 0.5, packageCount: 12, minStock: 3, pricePerUnit: 89.90, supplier: 'Fleischmann', expiryDate: '2026-01-16' },
    { id: 3, name: 'Leite Integral Tipo A', category: 'Laticínios', subcategory: 'Leites', unit: 'L', packageQuantity: 1, packageCount: 48, minStock: 30, pricePerUnit: 5.49, supplier: 'Itambé', expiryDate: '2026-01-20' },
    { id: 4, name: 'Manteiga sem Sal 5kg', category: 'Laticínios', subcategory: 'Manteigas', unit: 'kg', packageQuantity: 5, packageCount: 4, minStock: 10, pricePerUnit: 42.00, supplier: 'Aviação', expiryDate: '2026-02-28' },
    { id: 5, name: 'Açúcar Cristal 50kg', category: 'Açúcares', subcategory: 'Açúcares', unit: 'kg', packageQuantity: 50, packageCount: 3, minStock: 100, pricePerUnit: 3.80, supplier: 'Caravelas', expiryDate: '2027-01-01' },
    { id: 6, name: 'Ovos Brancos (360un)', category: 'Ovos', subcategory: 'Ovos', unit: 'un', packageQuantity: 360, packageCount: 2, minStock: 360, pricePerUnit: 0.65, supplier: 'Granja Real', expiryDate: '2026-01-25' },
    { id: 7, name: 'Chocolate 70% Callebaut', category: 'Chocolates', subcategory: 'Chocolates', unit: 'kg', packageQuantity: 2.5, packageCount: 6, minStock: 10, pricePerUnit: 98.00, supplier: 'Callebaut', expiryDate: '2026-06-30' },
    { id: 8, name: 'Creme de Leite UHT', category: 'Laticínios', subcategory: 'Cremes', unit: 'L', packageQuantity: 1, packageCount: 24, minStock: 12, pricePerUnit: 8.90, supplier: 'Nestlé', expiryDate: '2026-02-15' },
    { id: 9, name: 'Essência de Baunilha', category: 'Essências', subcategory: 'Aromáticos', unit: 'L', packageQuantity: 1, packageCount: 3, minStock: 1, pricePerUnit: 145.00, supplier: 'Mago', expiryDate: '2027-06-01' },
    { id: 10, name: 'Sal Refinado 1kg', category: 'Temperos', subcategory: 'Sais', unit: 'kg', packageQuantity: 1, packageCount: 20, minStock: 5, pricePerUnit: 2.50, supplier: 'Cisne', expiryDate: '2028-01-01' },
    { id: 11, name: 'Óleo de Canola 5L', category: 'Óleos', subcategory: 'Óleos', unit: 'L', packageQuantity: 5, packageCount: 6, minStock: 15, pricePerUnit: 28.90, supplier: 'Liza', expiryDate: '2026-08-20' },
    { id: 12, name: 'Polvilho Azedo 25kg', category: 'Farináceos', subcategory: 'Polvilhos', unit: 'kg', packageQuantity: 25, packageCount: 2, minStock: 25, pricePerUnit: 12.50, supplier: 'Yoki', expiryDate: '2026-05-10' },
]

const MOCK_COGS_TREND: COGSTrend[] = [
    { month: 'Ago', value: 45200 },
    { month: 'Set', value: 48900 },
    { month: 'Out', value: 52100 },
    { month: 'Nov', value: 49800 },
    { month: 'Dez', value: 54300 },
    { month: 'Jan', value: 51200 },
]

const BAKERY_INFO = {
    name: 'Padoca Artesanal',
    cnpj: '12.345.678/0001-90',
    address: 'Rua das Padarias, 123 - Centro, São Paulo - SP',
    phone: '(11) 99999-9999',
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS — Domain logic for inventory calculations
// ═══════════════════════════════════════════════════════════════════════════════

const getTotalStock = (item: InventoryItem): number => item.packageQuantity * item.packageCount

const getItemValue = (item: InventoryItem): number => getTotalStock(item) * item.pricePerUnit

const getDaysOnHand = (item: InventoryItem): number => {
    // Simulated daily consumption based on category velocity
    const velocityMap: Record<string, number> = {
        'Farináceos': 15, 'Fermentos': 0.3, 'Laticínios': 8, 'Açúcares': 10,
        'Ovos': 40, 'Chocolates': 2, 'Essências': 0.1, 'Temperos': 0.5, 'Óleos': 1.5
    }
    const dailyUsage = velocityMap[item.category] || 5
    return Math.round(getTotalStock(item) / dailyUsage)
}

const getStockStatus = (item: InventoryItem): 'critical' | 'warning' | 'ok' | 'excess' => {
    const stock = getTotalStock(item)
    const min = item.minStock || 0
    if (stock <= min * 0.25) return 'critical'
    if (stock <= min * 0.75) return 'warning'
    if (item.maxStock && stock > item.maxStock) return 'excess'
    return 'ok'
}

const isExpiringIn48h = (expiryDate?: string): boolean => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffHours = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)
    return diffHours > 0 && diffHours <= 48
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS — Modular UI building blocks
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PrintHeader — Formal document header, hidden on screen, visible on print
 * Includes bakery branding, CNPJ, date, and printed-by information
 */
const PrintHeader: React.FC = () => (
    <header className="hidden print:block print:mb-8 print:pb-6 print:border-b-2 print:border-black">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-black tracking-tight">{BAKERY_INFO.name}</h1>
                <p className="text-sm text-gray-700 mt-1">CNPJ: {BAKERY_INFO.cnpj}</p>
                <p className="text-sm text-gray-700">{BAKERY_INFO.address}</p>
            </div>
            <div className="text-right">
                <p className="text-lg font-semibold text-black">Relatório de Inventário</p>
                <p className="text-sm text-gray-700 mt-1">Data: {formatDate(new Date())}</p>
                <p className="text-sm text-gray-700">Impresso por: Administrador</p>
            </div>
        </div>
    </header>
)

/**
 * SummaryCard — Bento-style metric card with Apple Health aesthetics
 * Uses subtle shadows and precise spacing for premium feel
 */
interface SummaryCardProps {
    title: string
    value: string | number
    subtitle?: string
    trend?: { value: number; isPositive: boolean }
    variant?: 'default' | 'warning' | 'danger' | 'success'
    children?: React.ReactNode
}

const SummaryCard: React.FC<SummaryCardProps> = ({
    title, value, subtitle, trend, variant = 'default', children
}) => {
    const variantStyles = {
        default: 'bg-white dark:bg-zinc-900/80 border-zinc-200/60 dark:border-white/[0.08]',
        warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/30',
        danger: 'bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-800/30',
        success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/30',
    }

    const titleStyles = {
        default: 'text-zinc-500 dark:text-zinc-400',
        warning: 'text-amber-700 dark:text-amber-400',
        danger: 'text-red-700 dark:text-red-400',
        success: 'text-emerald-700 dark:text-emerald-400',
    }

    return (
        <div className={`
      relative rounded-3xl border p-6 
      ${variantStyles[variant]}
      /* Using highly diffuse shadows mimicking Apple's frosted glass effect */
      shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.02)]
      dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.15)]
      transition-all duration-300 hover:shadow-lg
      /* Print: simplified styling for clean document output */
      print:bg-white print:border-gray-300 print:shadow-none print:rounded-none print:p-4
    `}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${titleStyles[variant]} print:text-gray-600`}>
                {title}
            </p>
            <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white mt-2 tabular-nums print:text-black print:text-2xl">
                {value}
            </p>
            {subtitle && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 print:text-gray-600">
                    {subtitle}
                </p>
            )}
            {trend && (
                <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span>{trend.isPositive ? '↑' : '↓'}</span>
                    <span>{Math.abs(trend.value).toFixed(1)}%</span>
                    <span className="text-zinc-400 font-normal">vs. mês anterior</span>
                </div>
            )}
            {children}
        </div>
    )
}

/**
 * MiniTrendChart — Swift Charts-inspired sparkline using pure SVG
 * Minimal axes, smooth bézier curves, elegant hover states
 */
interface MiniTrendChartProps {
    data: COGSTrend[]
    height?: number
}

const MiniTrendChart: React.FC<MiniTrendChartProps> = ({ data, height = 80 }) => {
    const width = 200
    const padding = { top: 10, bottom: 20, left: 10, right: 10 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const values = data.map(d => d.value)
    const min = Math.min(...values) * 0.95
    const max = Math.max(...values) * 1.05

    const points = data.map((d, i) => ({
        x: padding.left + (i / (data.length - 1)) * chartWidth,
        y: padding.top + chartHeight - ((d.value - min) / (max - min)) * chartHeight,
        value: d.value,
        label: d.month,
    }))

    // Generate smooth bézier path - with proper null safety for TypeScript
    const pathD = points.reduce((acc, point, i, arr) => {
        if (i === 0) return `M ${point.x} ${point.y}`
        const prev = arr[i - 1]
        if (!prev) return acc
        const cpx = (prev.x + point.x) / 2
        return `${acc} C ${cpx} ${prev.y}, ${cpx} ${point.y}, ${point.x} ${point.y}`
    }, '')

    // Gradient fill path - safely access first and last points
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const fillPath = firstPoint && lastPoint
        ? `${pathD} L ${lastPoint.x} ${height - padding.bottom} L ${firstPoint.x} ${height - padding.bottom} Z`
        : ''

    return (
        <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="print:opacity-80"
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.02" />
                </linearGradient>
            </defs>

            {/* Gradient fill under curve */}
            <path d={fillPath} fill="url(#chartGradient)" className="print:fill-gray-100" />

            {/* Main curve with smooth bézier interpolation */}
            <path
                d={pathD}
                fill="none"
                stroke="rgb(99, 102, 241)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="print:stroke-gray-700"
            />

            {/* Data points */}
            {points.map((point, i) => (
                <g key={i} className="group">
                    <circle
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="white"
                        stroke="rgb(99, 102, 241)"
                        strokeWidth="2"
                        className="transition-all duration-200 hover:r-6 print:stroke-gray-700"
                    />
                    {/* Month labels */}
                    <text
                        x={point.x}
                        y={height - 4}
                        textAnchor="middle"
                        className="text-[9px] fill-zinc-400 dark:fill-zinc-500 print:fill-gray-600"
                    >
                        {point.label}
                    </text>
                </g>
            ))}
        </svg>
    )
}

/**
 * LowStockAlert — Urgent call-to-action card for items needing reorder
 * Uses Apple System Red for critical alerts
 */
interface LowStockAlertProps {
    items: InventoryItem[]
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ items }) => {
    const criticalItems = items.filter(item => getStockStatus(item) === 'critical')
    const warningItems = items.filter(item => getStockStatus(item) === 'warning')

    if (criticalItems.length === 0 && warningItems.length === 0) {
        return (
            <SummaryCard title="Status de Estoque" value="✓ OK" variant="success">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                    Todos os itens dentro dos níveis adequados
                </p>
            </SummaryCard>
        )
    }

    return (
        <SummaryCard
            title="Alerta de Estoque Baixo"
            value={criticalItems.length + warningItems.length}
            subtitle="itens precisam de atenção"
            variant={criticalItems.length > 0 ? 'danger' : 'warning'}
        >
            <div className="mt-4 space-y-2">
                {criticalItems.slice(0, 3).map(item => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between text-sm bg-red-100/50 dark:bg-red-900/20 rounded-xl px-3 py-2 print:bg-gray-100"
                    >
                        <span className="font-medium text-red-800 dark:text-red-300 print:text-black">{item.name}</span>
                        <span className="text-red-600 dark:text-red-400 tabular-nums print:text-gray-700">
                            {getTotalStock(item)} {item.unit}
                        </span>
                    </div>
                ))}
                {(criticalItems.length + warningItems.length) > 3 && (
                    <p className="text-xs text-zinc-500 text-center pt-1 print:hidden">
                        +{criticalItems.length + warningItems.length - 3} itens adicionais
                    </p>
                )}
            </div>
        </SummaryCard>
    )
}

/**
 * ExpirationAlert — Items approaching expiry within 48h
 * Highlighted with amber warning styling
 */
interface ExpirationAlertProps {
    items: InventoryItem[]
}

const ExpirationAlert: React.FC<ExpirationAlertProps> = ({ items }) => {
    const expiringItems = items.filter(item => isExpiringIn48h(item.expiryDate))

    if (expiringItems.length === 0) return null

    return (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/30 rounded-3xl p-6 print:bg-white print:border-gray-300 print:rounded-none">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                    <span className="text-xl">⚠️</span>
                </div>
                <div>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-300 print:text-black">
                        Validade Próxima (48h)
                    </h3>
                    <p className="text-sm text-amber-600 dark:text-amber-400/80 print:text-gray-600">
                        {expiringItems.length} {expiringItems.length === 1 ? 'item precisa' : 'itens precisam'} de atenção
                    </p>
                </div>
            </div>
            <div className="space-y-2">
                {expiringItems.map(item => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between bg-white/60 dark:bg-white/5 rounded-xl px-4 py-3 print:bg-gray-50"
                    >
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 print:text-black">{item.name}</span>
                        <span className="text-sm text-amber-600 dark:text-amber-400 font-medium print:text-gray-700">
                            Vence: {new Date(item.expiryDate!).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — InventoryReportPage
// ═══════════════════════════════════════════════════════════════════════════════

export const InventoryReportPage: React.FC = () => {
    const items = MOCK_INVENTORY_ITEMS
    const cogsTrend = MOCK_COGS_TREND

    // Computed metrics
    const totals = useMemo(() => {
        const totalValue = items.reduce((sum, item) => sum + getItemValue(item), 0)
        const itemCount = items.length
        const criticalCount = items.filter(i => getStockStatus(i) === 'critical').length
        const warningCount = items.filter(i => getStockStatus(i) === 'warning').length

        const byCategory = items.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + getItemValue(item)
            return acc
        }, {} as Record<string, number>)

        const categoryBreakdown: CategoryBreakdown[] = Object.entries(byCategory)
            .map(([name, value]) => ({
                name,
                value,
                percentage: (value / totalValue) * 100,
                itemCount: items.filter(i => i.category === name).length
            }))
            .sort((a, b) => b.value - a.value)

        // COGS calculation (last month value from trend)
        const currentCOGS = cogsTrend[cogsTrend.length - 1]?.value || 0
        const previousCOGS = cogsTrend[cogsTrend.length - 2]?.value || 0
        const cogsTrendPercent = previousCOGS ? ((currentCOGS - previousCOGS) / previousCOGS) * 100 : 0

        // Breakage/waste estimate (simulated at 2.5% of inventory value)
        const breakageValue = totalValue * 0.025

        return {
            totalValue,
            itemCount,
            criticalCount,
            warningCount,
            categoryBreakdown,
            currentCOGS,
            cogsTrendPercent,
            breakageValue,
        }
    }, [items, cogsTrend])

    // Print handler - invokes system print dialog showing only the report
    const handlePrint = useCallback(() => {
        window.print()
    }, [])

    return (
        <div className="bg-gray-50 dark:bg-black print:bg-white">
            {/* Print Header - Hidden on screen, visible on print */}
            <PrintHeader />

            {/* Screen-only Header with navigation */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-white/[0.06] print:hidden">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                            Relatório de Inventário
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Atualizado em {formatDate(new Date())}
                        </p>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="
              inline-flex items-center gap-2 px-5 py-3 
              bg-zinc-900 dark:bg-white text-white dark:text-zinc-900
              text-[11px] font-bold uppercase tracking-[0.06em]
              rounded-2xl shadow-lg
              transition-all duration-200
              hover:bg-zinc-800 dark:hover:bg-zinc-100
              hover:shadow-xl hover:-translate-y-0.5
              active:scale-[0.98]
            "
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir Relatório
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-none">
                {/* Bento Grid Summary Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 print:grid-cols-2 print:gap-4 print:mb-6">
                    {/* Total Inventory Value */}
                    <SummaryCard
                        title="Valor Total do Inventário"
                        value={formatCurrency(totals.totalValue)}
                        subtitle={`${totals.itemCount} itens em estoque`}
                    />

                    {/* COGS with Trend */}
                    <SummaryCard
                        title="CMV Mensal"
                        value={formatCurrency(totals.currentCOGS)}
                        trend={{ value: totals.cogsTrendPercent, isPositive: totals.cogsTrendPercent < 0 }}
                    >
                        <div className="mt-4 -mx-2 print:hidden">
                            <MiniTrendChart data={cogsTrend} />
                        </div>
                        {/* Print-only static trend indicator */}
                        <div className="hidden print:block mt-2 text-sm text-gray-600">
                            Tendência: {totals.cogsTrendPercent > 0 ? '+' : ''}{totals.cogsTrendPercent.toFixed(1)}% vs. mês anterior
                        </div>
                    </SummaryCard>

                    {/* Breakage/Waste Alert */}
                    <SummaryCard
                        title="Quebra / Desperdício"
                        value={formatCurrency(totals.breakageValue)}
                        subtitle="2.5% do valor total (estimado)"
                        variant={totals.breakageValue > totals.totalValue * 0.03 ? 'warning' : 'default'}
                    />

                    {/* Low Stock Alert */}
                    <LowStockAlert items={items} />
                </section>

                {/* Expiration Alert */}
                <ExpirationAlert items={items} />

                {/* Category Breakdown */}
                <section className="mt-8 print:mt-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 tracking-tight print:text-black print:text-base print:mb-3">
                        Distribuição por Categoria
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
                        {totals.categoryBreakdown.map(cat => (
                            <div
                                key={cat.name}
                                className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-white/[0.08] rounded-2xl p-5 print:bg-white print:border-gray-300 print:rounded-none print:p-3"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200 print:text-black">{cat.name}</span>
                                    <span className="text-sm text-zinc-500 tabular-nums print:text-gray-600">{cat.itemCount} itens</span>
                                </div>
                                <p className="text-xl font-semibold text-zinc-900 dark:text-white tabular-nums print:text-black">
                                    {formatCurrency(cat.value)}
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden print:bg-gray-200">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-500 print:bg-gray-600"
                                            style={{ width: `${cat.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-zinc-500 tabular-nums print:text-gray-600">
                                        {cat.percentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Detailed Inventory Table */}
                <section className="mt-8 print:mt-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 tracking-tight print:text-black print:text-base print:mb-3">
                        Inventário Detalhado
                    </h2>
                    <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-sm print:bg-white print:border-gray-300 print:rounded-none print:shadow-none">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] print:bg-gray-100 print:border-gray-300">
                                        <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400 px-6 py-4 print:text-gray-700 print:px-3 print:py-2">
                                            Item
                                        </th>
                                        <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400 px-6 py-4 print:text-gray-700 print:px-3 print:py-2">
                                            Categoria
                                        </th>
                                        <th className="text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400 px-6 py-4 print:text-gray-700 print:px-3 print:py-2">
                                            Estoque
                                        </th>
                                        <th className="text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400 px-6 py-4 print:text-gray-700 print:px-3 print:py-2">
                                            Valor Unit.
                                        </th>
                                        <th className="text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400 px-6 py-4 print:text-gray-700 print:px-3 print:py-2">
                                            Valor Total
                                        </th>
                                        <th className="text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400 px-6 py-4 print:text-gray-700 print:px-3 print:py-2">
                                            Dias Est.
                                        </th>
                                        <th className="text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400 px-6 py-4 print:text-gray-700 print:px-3 print:py-2">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => {
                                        const status = getStockStatus(item)
                                        const stock = getTotalStock(item)
                                        const value = getItemValue(item)
                                        const daysOnHand = getDaysOnHand(item)
                                        const isExpiring = isExpiringIn48h(item.expiryDate)

                                        const statusStyles = {
                                            critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                            warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                            ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                            excess: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                        }

                                        const statusLabels = {
                                            critical: 'Crítico',
                                            warning: 'Baixo',
                                            ok: 'OK',
                                            excess: 'Excesso',
                                        }

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`
                          border-b border-zinc-100/50 dark:border-white/[0.03] 
                          hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]
                          transition-colors duration-150
                          ${isExpiring ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''}
                          print:border-gray-200 print:hover:bg-transparent
                          /* Prevent table rows from being split across pages */
                          print:break-inside-avoid
                        `}
                                            >
                                                <td className="px-6 py-4 print:px-3 print:py-2">
                                                    <div className="font-medium text-zinc-900 dark:text-white print:text-black">
                                                        {item.name}
                                                    </div>
                                                    {item.supplier && (
                                                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 print:text-gray-600">
                                                            {item.supplier}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300 print:px-3 print:py-2 print:text-gray-700">
                                                    {item.category}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums font-medium text-zinc-900 dark:text-white print:px-3 print:py-2 print:text-black">
                                                    {stock.toLocaleString('pt-BR')} {item.unit}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums text-zinc-600 dark:text-zinc-300 print:px-3 print:py-2 print:text-gray-700">
                                                    {formatCurrency(item.pricePerUnit)}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums font-medium text-zinc-900 dark:text-white print:px-3 print:py-2 print:text-black">
                                                    {formatCurrency(value)}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums text-zinc-600 dark:text-zinc-300 print:px-3 print:py-2 print:text-gray-700">
                                                    {daysOnHand}
                                                </td>
                                                <td className="px-6 py-4 text-center print:px-3 print:py-2">
                                                    <span className={`
                            inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide
                            ${statusStyles[status]}
                            print:bg-transparent print:px-0 print:py-0
                            ${status === 'critical' ? 'print:text-black print:font-bold' : 'print:text-gray-700'}
                          `}>
                                                        {statusLabels[status]}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.02] print:bg-gray-100 print:border-gray-400">
                                        <td colSpan={4} className="px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 print:px-3 print:py-2 print:text-black">
                                            Total Geral
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums text-lg font-bold text-zinc-900 dark:text-white print:px-3 print:py-2 print:text-black">
                                            {formatCurrency(totals.totalValue)}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Print Footer */}
                <footer className="hidden print:block print:mt-8 print:pt-4 print:border-t print:border-gray-300">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Relatório gerado por Padoca - Sistema de Gestão para Padarias</span>
                        <span>Página 1 de 1</span>
                    </div>
                </footer>
            </main>

            {/* Print Styles - Comprehensive @media print block */}
            <style>{`
        @media print {
          /* Force color printing for status badges */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Hide interactive elements */
          nav, button, .print\\:hidden {
            display: none !important;
          }

          /* Force white background and black text */
          body {
            background: white !important;
            color: black !important;
          }

          /* Remove shadows and decorative elements */
          .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl {
            box-shadow: none !important;
          }

          /* Ensure table headers repeat on new pages */
          thead {
            display: table-header-group;
          }

          /* Prevent orphaned table rows */
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Add page margins */
          @page {
            margin: 1.5cm;
            size: A4;
          }

          /* Force black borders on tables */
          table, th, td {
            border-color: #d1d5db !important;
          }
        }
      `}</style>
        </div>
    )
}

export default InventoryReportPage
