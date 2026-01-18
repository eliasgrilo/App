/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INVENTORY PULSE — Revolutionary Apple-Inspired Inventory Visualization
 * 
 * A living, breathing dashboard that transforms inventory data into an 
 * emotional experience. Inspired by Apple Watch Activity Rings, Health app 
 * insights, and the premium feel of Apple Card.
 * 
 * Design Philosophy:
 * - Inventory as a living organism that breathes and pulses
 * - Progressive disclosure revealing complexity on demand
 * - Emotional design: calm when healthy, subtle urgency when critical
 * - Every pixel crafted with intention
 * - Celebrates success, guides improvement
 * 
 * @author Padoca Engineering Team — Senior Design Implementation
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion'
import {
    Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
    Warehouse, Scale, Clock, Sparkles, ChevronDown, ArrowUpRight,
    Zap, Shield, Target, BarChart3
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & DATA STRUCTURES
// ═════════════════════════════════════════════════════════════════════════════════

interface InventoryCategory {
    id: string
    name: string
    emoji: string
    color: string
    gradient: string
    currentStock: number
    maxCapacity: number
    value: number
    trend: 'up' | 'down' | 'stable'
    trendPercent: number
    avgDaysSupply: number
    itemCount: number
}

interface InventoryItem {
    id: string
    name: string
    category: string
    currentQty: number
    minQty: number
    maxQty: number
    unit: string
    unitCost: number
    status: 'critical' | 'low' | 'optimal' | 'excess'
    daysUntilEmpty: number
    lastRestocked: string
}

interface InventoryPulseData {
    healthScore: number
    totalValue: number
    totalItems: number
    utilizationPercent: number
    categories: InventoryCategory[]
    items: InventoryItem[]
    alerts: {
        critical: number
        low: number
        excess: number
    }
    forecast: {
        daysUntilRestock: number
        projectedSpend: number
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA — Premium Bakery Inventory
// ═══════════════════════════════════════════════════════════════════════════════

const generateMockData = (): InventoryPulseData => ({
    healthScore: 87,
    totalValue: 45780.50,
    totalItems: 156,
    utilizationPercent: 73,
    categories: [
        {
            id: 'flours',
            name: 'Farinhas',
            emoji: '🌾',
            color: '#FF9500',
            gradient: 'from-amber-400 to-orange-500',
            currentStock: 850,
            maxCapacity: 1000,
            value: 12450,
            trend: 'stable',
            trendPercent: 2.3,
            avgDaysSupply: 14,
            itemCount: 12
        },
        {
            id: 'dairy',
            name: 'Laticínios',
            emoji: '🥛',
            color: '#007AFF',
            gradient: 'from-blue-400 to-indigo-500',
            currentStock: 320,
            maxCapacity: 500,
            value: 8920,
            trend: 'down',
            trendPercent: -8.5,
            avgDaysSupply: 5,
            itemCount: 18
        },
        {
            id: 'sugars',
            name: 'Açúcares',
            emoji: '🍬',
            color: '#FF2D55',
            gradient: 'from-pink-400 to-rose-500',
            currentStock: 420,
            maxCapacity: 600,
            value: 6780,
            trend: 'up',
            trendPercent: 5.2,
            avgDaysSupply: 21,
            itemCount: 8
        },
        {
            id: 'yeasts',
            name: 'Fermentos',
            emoji: '🫧',
            color: '#34C759',
            gradient: 'from-emerald-400 to-green-500',
            currentStock: 180,
            maxCapacity: 200,
            value: 4560,
            trend: 'stable',
            trendPercent: 0.8,
            avgDaysSupply: 12,
            itemCount: 6
        },
        {
            id: 'fats',
            name: 'Gorduras',
            emoji: '🧈',
            color: '#AF52DE',
            gradient: 'from-purple-400 to-violet-500',
            currentStock: 290,
            maxCapacity: 400,
            value: 7890,
            trend: 'down',
            trendPercent: -3.2,
            avgDaysSupply: 9,
            itemCount: 14
        },
        {
            id: 'spices',
            name: 'Temperos',
            emoji: '🌿',
            color: '#5856D6',
            gradient: 'from-indigo-400 to-purple-500',
            currentStock: 95,
            maxCapacity: 150,
            value: 3280,
            trend: 'up',
            trendPercent: 12.4,
            avgDaysSupply: 45,
            itemCount: 22
        }
    ],
    items: [
        { id: '1', name: 'Farinha de Trigo T55', category: 'flours', currentQty: 250, minQty: 100, maxQty: 400, unit: 'kg', unitCost: 4.50, status: 'optimal', daysUntilEmpty: 12, lastRestocked: '3 dias' },
        { id: '2', name: 'Leite Integral', category: 'dairy', currentQty: 45, minQty: 60, maxQty: 120, unit: 'L', unitCost: 5.80, status: 'low', daysUntilEmpty: 3, lastRestocked: '1 dia' },
        { id: '3', name: 'Fermento Biológico', category: 'yeasts', currentQty: 15, minQty: 20, maxQty: 50, unit: 'kg', unitCost: 28.90, status: 'critical', daysUntilEmpty: 2, lastRestocked: '5 dias' },
        { id: '4', name: 'Açúcar Cristal', category: 'sugars', currentQty: 180, minQty: 50, maxQty: 200, unit: 'kg', unitCost: 3.20, status: 'optimal', daysUntilEmpty: 25, lastRestocked: '2 dias' },
        { id: '5', name: 'Manteiga sem Sal', category: 'fats', currentQty: 35, minQty: 40, maxQty: 80, unit: 'kg', unitCost: 45.00, status: 'low', daysUntilEmpty: 4, lastRestocked: '2 dias' },
        { id: '6', name: 'Creme de Leite', category: 'dairy', currentQty: 8, minQty: 15, maxQty: 40, unit: 'L', unitCost: 12.50, status: 'critical', daysUntilEmpty: 1, lastRestocked: '4 dias' },
        { id: '7', name: 'Chocolate 70%', category: 'sugars', currentQty: 25, minQty: 10, maxQty: 40, unit: 'kg', unitCost: 85.00, status: 'optimal', daysUntilEmpty: 18, lastRestocked: '1 dia' },
        { id: '8', name: 'Farinha Integral', category: 'flours', currentQty: 120, minQty: 30, maxQty: 150, unit: 'kg', unitCost: 6.80, status: 'excess', daysUntilEmpty: 35, lastRestocked: '1 dia' },
    ],
    alerts: {
        critical: 2,
        low: 3,
        excess: 1
    },
    forecast: {
        daysUntilRestock: 4,
        projectedSpend: 2850
    }
})

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED HEALTH RING — Apple Watch Activity Ring Inspired
// ═══════════════════════════════════════════════════════════════════════════════

interface HealthRingProps {
    percentage: number
    size: number
    strokeWidth: number
    color: string
    delay?: number
    children?: React.ReactNode
}

const HealthRing: React.FC<HealthRingProps> = ({
    percentage,
    size,
    strokeWidth,
    color,
    delay = 0,
    children
}) => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const springValue = useSpring(0, { stiffness: 50, damping: 15, mass: 0.5 })
    const strokeDashoffset = useTransform(springValue, v => circumference - (v / 100) * circumference)

    useEffect(() => {
        const timeout = setTimeout(() => {
            springValue.set(Math.min(percentage, 100))
        }, delay)
        return () => clearTimeout(timeout)
    }, [percentage, delay, springValue])

    return (
        <div className="relative print:!block" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90 print:!block"
            >
                {/* Background Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    className="text-zinc-200 dark:text-zinc-800"
                    strokeWidth={strokeWidth}
                />
                {/* Animated Progress Ring */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset }}
                    className="drop-shadow-lg print:drop-shadow-none"
                />
                {/* Glow Filter */}
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
            </svg>
            {/* Center Content */}
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY RING — Nested Concentric Rings for Categories
// ═══════════════════════════════════════════════════════════════════════════════

interface CategoryRingsProps {
    categories: InventoryCategory[]
}

const CategoryRings: React.FC<CategoryRingsProps> = ({ categories }) => {
    const sortedCategories = [...categories].sort((a, b) => b.value - a.value).slice(0, 5)
    const baseSize = 280
    const ringSpacing = 20
    const strokeWidth = 12

    return (
        <div className="relative flex items-center justify-center" style={{ width: baseSize, height: baseSize }}>
            {sortedCategories.map((category, index) => {
                const size = baseSize - (index * ringSpacing * 2)
                const percentage = (category.currentStock / category.maxCapacity) * 100

                return (
                    <div
                        key={category.id}
                        className="absolute"
                        style={{
                            width: size,
                            height: size
                        }}
                    >
                        <HealthRing
                            percentage={percentage}
                            size={size}
                            strokeWidth={strokeWidth}
                            color={category.color}
                            delay={index * 150}
                        />
                    </div>
                )
            })}

            {/* Center Legend */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                className="absolute z-10 text-center"
            >
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Saúde</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white">
                    {Math.round(sortedCategories.reduce((acc, c) => acc + (c.currentStock / c.maxCapacity) * 100, 0) / sortedCategories.length)}%
                </p>
            </motion.div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PULSE INDICATOR — Breathing Animation for Live Status
// ═══════════════════════════════════════════════════════════════════════════════

interface PulseIndicatorProps {
    status: 'healthy' | 'warning' | 'critical'
    size?: number
}

const PulseIndicator: React.FC<PulseIndicatorProps> = ({ status, size = 12 }) => {
    const colors = {
        healthy: { bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
        warning: { bg: 'bg-amber-500', ring: 'ring-amber-400' },
        critical: { bg: 'bg-red-500', ring: 'ring-red-400' }
    }

    return (
        <span className="relative flex">
            <motion.span
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 0, 0.7]
                }}
                transition={{
                    duration: status === 'critical' ? 1 : 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
                className={`absolute inline-flex h-full w-full rounded-full ${colors[status].bg} opacity-75`}
                style={{ width: size, height: size }}
            />
            <span
                className={`relative inline-flex rounded-full ${colors[status].bg}`}
                style={{ width: size, height: size }}
            />
        </span>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER — Counting Animation for Numbers
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedCounterProps {
    value: number
    prefix?: string
    suffix?: string
    decimals?: number
    duration?: number
    className?: string
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    prefix = '',
    suffix = '',
    decimals = 0,
    duration = 1.5,
    className = ''
}) => {
    const springValue = useSpring(0, { stiffness: 50, damping: 15, mass: 0.5 })
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
        springValue.set(value)
        const unsubscribe = springValue.on('change', (latest) => {
            setDisplayValue(latest)
        })
        return () => unsubscribe()
    }, [value, springValue])

    const formattedValue = decimals > 0
        ? displayValue.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : Math.round(displayValue).toLocaleString('pt-BR')

    return (
        <span className={`tabular-nums ${className}`}>
            {prefix}{formattedValue}{suffix}
        </span>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLASS METRIC CARD — Premium Glassmorphism Card
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassMetricCardProps {
    icon: React.ReactNode
    label: string
    value: React.ReactNode
    subtitle?: string
    trend?: { value: number; positive?: boolean }
    gradient?: string
    delay?: number
    className?: string
}

const GlassMetricCard: React.FC<GlassMetricCardProps> = ({
    icon,
    label,
    value,
    subtitle,
    trend,
    gradient = 'from-blue-500 to-indigo-600',
    delay = 0,
    className = ''
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                delay,
                type: 'spring',
                stiffness: 200,
                damping: 20
            }}
            whileHover={{
                y: -4,
                transition: { duration: 0.2 }
            }}
            className={`
                relative overflow-hidden
                bg-white/80 dark:bg-zinc-900/80
                backdrop-blur-xl
                rounded-3xl
                border border-white/20 dark:border-white/10
                shadow-[0_8px_32px_rgba(0,0,0,0.08)]
                hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]
                transition-shadow duration-300
                p-5
                ${className}
            `}
        >
            {/* Gradient Accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} rounded-t-3xl`} />

            {/* Icon */}
            <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`
                    w-11 h-11 rounded-2xl
                    bg-gradient-to-br ${gradient}
                    flex items-center justify-center
                    shadow-lg mb-4
                `}
            >
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 text-white' })}
            </motion.div>

            {/* Label */}
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                {label}
            </p>

            {/* Value */}
            <div className="text-2xl font-black text-zinc-900 dark:text-white mb-1">
                {value}
            </div>

            {/* Subtitle & Trend */}
            <div className="flex items-center justify-between">
                {subtitle && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">{subtitle}</p>
                )}
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trend.value).toFixed(1)}%
                    </div>
                )}
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY BUBBLE — Organic Category Visualization
// ═══════════════════════════════════════════════════════════════════════════════

interface CategoryBubbleProps {
    category: InventoryCategory
    index: number
    isSelected: boolean
    onClick: () => void
}

const CategoryBubble: React.FC<CategoryBubbleProps> = ({
    category,
    index,
    isSelected,
    onClick
}) => {
    const fillPercent = (category.currentStock / category.maxCapacity) * 100
    const TrendIcon = category.trend === 'up' ? TrendingUp : category.trend === 'down' ? TrendingDown : null

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                delay: index * 0.1,
                type: 'spring',
                stiffness: 300,
                damping: 20
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`
                relative group
                flex flex-col items-center justify-center
                w-full aspect-square max-w-[140px]
                rounded-3xl
                transition-all duration-300
                ${isSelected
                    ? 'ring-4 ring-offset-2 dark:ring-offset-zinc-900'
                    : 'hover:ring-2 hover:ring-offset-2 dark:hover:ring-offset-zinc-900'
                }
            `}
            style={{
                background: `linear-gradient(135deg, ${category.color}15, ${category.color}05)`,
                borderColor: category.color,
                // @ts-ignore
                '--tw-ring-color': category.color
            } as React.CSSProperties}
        >
            {/* Fill Level Indicator */}
            <div
                className="absolute bottom-0 left-0 right-0 rounded-b-3xl transition-all duration-500 opacity-20"
                style={{
                    height: `${fillPercent}%`,
                    background: `linear-gradient(to top, ${category.color}, transparent)`
                }}
            />

            {/* Emoji */}
            <motion.span
                className="text-3xl mb-1"
                animate={{
                    y: [0, -3, 0]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.2
                }}
            >
                {category.emoji}
            </motion.span>

            {/* Name */}
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{category.name}</p>

            {/* Fill Percentage */}
            <div className="flex items-center gap-1 mt-1">
                <span className="text-lg font-black" style={{ color: category.color }}>
                    {Math.round(fillPercent)}%
                </span>
                {TrendIcon && (
                    <TrendIcon
                        className={`w-3 h-3 ${category.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}
                    />
                )}
            </div>
        </motion.button>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT ITEM ROW — Premium Alert List Item
// ═══════════════════════════════════════════════════════════════════════════════

interface AlertItemRowProps {
    item: InventoryItem
    index: number
}

const AlertItemRow: React.FC<AlertItemRowProps> = ({ item, index }) => {
    const statusConfig = {
        critical: {
            bg: 'bg-red-50 dark:bg-red-950/30',
            border: 'border-red-200 dark:border-red-900/50',
            badge: 'bg-red-500',
            text: 'Crítico'
        },
        low: {
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            border: 'border-amber-200 dark:border-amber-900/50',
            badge: 'bg-amber-500',
            text: 'Baixo'
        },
        optimal: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            border: 'border-emerald-200 dark:border-emerald-900/50',
            badge: 'bg-emerald-500',
            text: 'Ótimo'
        },
        excess: {
            bg: 'bg-purple-50 dark:bg-purple-950/30',
            border: 'border-purple-200 dark:border-purple-900/50',
            badge: 'bg-purple-500',
            text: 'Excesso'
        }
    }

    const config = statusConfig[item.status]
    const fillPercent = (item.currentQty / item.maxQty) * 100

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            className={`
                relative overflow-hidden
                flex items-center gap-4
                p-4 rounded-2xl
                ${config.bg} ${config.border} border
                group cursor-pointer
                hover:scale-[1.01] transition-transform
            `}
        >
            {/* Status Pulse */}
            <div className="flex-shrink-0">
                <PulseIndicator
                    status={item.status === 'critical' ? 'critical' : item.status === 'low' ? 'warning' : 'healthy'}
                    size={10}
                />
            </div>

            {/* Item Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                    {item.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${fillPercent}%` }}
                            transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                            className={`h-full rounded-full ${config.badge}`}
                        />
                    </div>
                    <span className="text-xs text-zinc-500">
                        {item.currentQty}/{item.maxQty} {item.unit}
                    </span>
                </div>
            </div>

            {/* Days Remaining */}
            <div className="text-right flex-shrink-0">
                <p className={`text-lg font-black ${item.daysUntilEmpty <= 2 ? 'text-red-600' : item.daysUntilEmpty <= 5 ? 'text-amber-600' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {item.daysUntilEmpty}d
                </p>
                <p className="text-[10px] text-zinc-500 uppercase">restantes</p>
            </div>

            {/* Status Badge */}
            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold text-white ${config.badge} shadow-lg flex-shrink-0`}>
                {config.text}
            </span>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHT CARD — AI-Powered Recommendation Card
// ═══════════════════════════════════════════════════════════════════════════════

interface InsightCardProps {
    icon: React.ReactNode
    title: string
    description: string
    action?: string
    gradient: string
    index: number
}

const InsightCard: React.FC<InsightCardProps> = ({
    icon,
    title,
    description,
    action,
    gradient,
    index
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: 0.5 + index * 0.1,
                type: 'spring',
                stiffness: 200,
                damping: 20
            }}
            whileHover={{ y: -4 }}
            className={`
                relative overflow-hidden
                p-5 rounded-3xl
                bg-gradient-to-br ${gradient}
                text-white
                shadow-xl
                cursor-pointer
                group
            `}
        >
            {/* Shimmer Effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                animate={{ translateX: ['100%', '-100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />

            {/* Icon */}
            <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3"
            >
                {icon}
            </motion.div>

            {/* Content */}
            <h4 className="text-sm font-bold mb-1">{title}</h4>
            <p className="text-xs text-white/80 leading-relaxed">{description}</p>

            {/* Action */}
            {action && (
                <div className="flex items-center gap-1 mt-3 text-xs font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
                    {action}
                    <ArrowUpRight className="w-3 h-3" />
                </div>
            )}
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — INVENTORY PULSE
// ═══════════════════════════════════════════════════════════════════════════════

export const InventoryPulseChart: React.FC<{ showTitle?: boolean }> = ({ showTitle = true }) => {
    const [data] = useState<InventoryPulseData>(generateMockData)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [showAllItems, setShowAllItems] = useState(false)

    // Filter items if category is selected
    const displayItems = useMemo(() => {
        let items = selectedCategory
            ? data.items.filter(i => i.category === selectedCategory)
            : data.items

        // Sort by status priority
        const priority = { critical: 0, low: 1, optimal: 2, excess: 3 }
        items = [...items].sort((a, b) => priority[a.status] - priority[b.status])

        return showAllItems ? items : items.slice(0, 5)
    }, [data.items, selectedCategory, showAllItems])

    // Health status derived from score
    const healthStatus: 'healthy' | 'warning' | 'critical' =
        data.healthScore >= 80 ? 'healthy' : data.healthScore >= 60 ? 'warning' : 'critical'

    // Smart insights based on data
    const insights = useMemo(() => [
        {
            icon: <AlertTriangle className="w-5 h-5" />,
            title: `${data.alerts.critical} itens críticos`,
            description: 'Fermento e Creme de Leite precisam reposição urgente. Considere pedido emergencial.',
            action: 'Ver fornecedores',
            gradient: 'from-red-500 to-rose-600'
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: 'Economia identificada',
            description: 'Compra antecipada de farinhas pode economizar R$450 este mês baseado nas tendências.',
            action: 'Simular compra',
            gradient: 'from-emerald-500 to-teal-600'
        },
        {
            icon: <Clock className="w-5 h-5" />,
            title: 'Próxima reposição: 4 dias',
            description: 'Baseado no consumo atual, laticínios e fermentos precisarão reposição em breve.',
            action: 'Programar pedido',
            gradient: 'from-blue-500 to-indigo-600'
        }
    ], [data.alerts.critical])

    return (
        <div className="print:break-inside-avoid">
            {showTitle && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-8 print:mb-4"
                >
                    <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="
                            relative w-12 h-12 rounded-2xl
                            bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600
                            flex items-center justify-center
                            shadow-xl shadow-blue-500/30
                            print:bg-gray-200 print:shadow-none
                        "
                    >
                        <Warehouse className="w-6 h-6 text-white print:text-black" />
                        <div className="absolute -top-1 -right-1">
                            <PulseIndicator status={healthStatus} size={10} />
                        </div>
                    </motion.div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight print:text-black">
                                Pulse do Estoque
                            </h3>
                            <motion.span
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                            >
                                LIVE
                            </motion.span>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-gray-600">
                            Visão holística do seu inventário em tempo real
                        </p>
                    </div>
                </motion.div>
            )}

            {/* ═══ HERO SECTION — Health Overview ═══ */}
            <div className="grid grid-cols-12 gap-6 mb-8">
                {/* Main Health Ring */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="
                        col-span-12 lg:col-span-4
                        flex items-center justify-center
                        p-6 rounded-[32px]
                        bg-gradient-to-br from-white/80 to-white/40
                        dark:from-zinc-800/80 dark:to-zinc-900/40
                        backdrop-blur-xl
                        border border-white/20 dark:border-white/5
                        shadow-[0_8px_32px_rgba(0,0,0,0.08)]
                        print:bg-white print:backdrop-blur-none print:shadow-none print:border-gray-200
                    "
                >
                    <div className="text-center">
                        <motion.div
                            animate={{
                                scale: [1, 1.02, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        >
                            <HealthRing
                                percentage={data.healthScore}
                                size={180}
                                strokeWidth={16}
                                color={healthStatus === 'healthy' ? '#34C759' : healthStatus === 'warning' ? '#FF9500' : '#FF3B30'}
                            >
                                <div className="text-center">
                                    <motion.p
                                        className="text-4xl font-black text-zinc-900 dark:text-white"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <AnimatedCounter value={data.healthScore} suffix="%" />
                                    </motion.p>
                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Saúde
                                    </p>
                                </div>
                            </HealthRing>
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className={`
                                mt-4 text-sm font-semibold
                                ${healthStatus === 'healthy' ? 'text-emerald-600' : healthStatus === 'warning' ? 'text-amber-600' : 'text-red-600'}
                            `}
                        >
                            {healthStatus === 'healthy' ? '✨ Excelente! Estoque saudável' : healthStatus === 'warning' ? '⚡ Atenção necessária' : '🚨 Ação imediata requerida'}
                        </motion.p>
                    </div>
                </motion.div>

                {/* Key Metrics */}
                <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <GlassMetricCard
                        icon={<Scale />}
                        label="Valor Total"
                        value={<AnimatedCounter value={data.totalValue} prefix="R$ " decimals={0} />}
                        subtitle="Investimento atual"
                        gradient="from-emerald-400 to-green-500"
                        delay={0.1}
                    />
                    <GlassMetricCard
                        icon={<Package />}
                        label="Itens"
                        value={<AnimatedCounter value={data.totalItems} />}
                        subtitle="SKUs ativos"
                        gradient="from-blue-400 to-indigo-500"
                        delay={0.2}
                    />
                    <GlassMetricCard
                        icon={<BarChart3 />}
                        label="Utilização"
                        value={<AnimatedCounter value={data.utilizationPercent} suffix="%" />}
                        subtitle="Capacidade usada"
                        gradient="from-purple-400 to-violet-500"
                        delay={0.3}
                    />
                    <GlassMetricCard
                        icon={<Shield />}
                        label="Alertas"
                        value={
                            <div className="flex items-center gap-2">
                                <span className="text-red-600 font-black">{data.alerts.critical}</span>
                                <span className="text-amber-600">/ {data.alerts.low}</span>
                            </div>
                        }
                        subtitle="Críticos / Baixos"
                        gradient="from-amber-400 to-orange-500"
                        delay={0.4}
                    />
                </div>
            </div>

            {/* ═══ CATEGORY BUBBLES ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Categorias
                    </h4>
                    {selectedCategory && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setSelectedCategory(null)}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                            Limpar filtro ✕
                        </motion.button>
                    )}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {data.categories.map((category, index) => (
                        <CategoryBubble
                            key={category.id}
                            category={category}
                            index={index}
                            isSelected={selectedCategory === category.id}
                            onClick={() => setSelectedCategory(
                                selectedCategory === category.id ? null : category.id
                            )}
                        />
                    ))}
                </div>
            </motion.div>

            {/* ═══ TOGGLE DETAILS ═══ */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors print:hidden"
            >
                <motion.div animate={{ rotate: showDetails ? 180 : 0 }}>
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
                {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
            </button>

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        {/* ═══ ITEMS LIST ═══ */}
                        <div className="mb-8">
                            <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4">
                                {selectedCategory
                                    ? `Itens: ${data.categories.find(c => c.id === selectedCategory)?.name}`
                                    : 'Todos os Itens'
                                }
                            </h4>
                            <div className="space-y-3">
                                {displayItems.map((item, index) => (
                                    <AlertItemRow key={item.id} item={item} index={index} />
                                ))}
                            </div>
                            {data.items.length > 5 && !showAllItems && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => setShowAllItems(true)}
                                    className="w-full mt-4 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                                >
                                    Ver todos ({data.items.length - 5} mais)
                                </motion.button>
                            )}
                        </div>

                        {/* ═══ SMART INSIGHTS ═══ */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                                    Insights Inteligentes
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {insights.map((insight, index) => (
                                    <InsightCard key={index} {...insight} index={index} />
                                ))}
                            </div>
                        </div>

                        {/* ═══ CATEGORY RINGS VISUALIZATION ═══ */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col lg:flex-row items-center justify-center gap-8 p-8 rounded-[32px] bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-800/50 dark:to-zinc-900/50"
                        >
                            <CategoryRings categories={data.categories} />
                            <div className="space-y-3">
                                {data.categories.slice(0, 5).map((category, index) => (
                                    <motion.div
                                        key={category.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8 + index * 0.1 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full shadow-lg"
                                            style={{ backgroundColor: category.color }}
                                        />
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                            {category.emoji} {category.name}
                                        </span>
                                        <span className="text-xs text-zinc-500">
                                            {Math.round((category.currentStock / category.maxCapacity) * 100)}%
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ PRINT-ONLY SECTION — Full inventory display for printing ═══ */}
            <div className="hidden print:block mt-8">
                {/* Print Summary */}
                <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-black">{data.healthScore}%</p>
                        <p className="text-xs text-gray-600">Saúde do Estoque</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-black">R$ {(data.totalValue / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-gray-600">Valor Total</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-black">{data.totalItems}</p>
                        <p className="text-xs text-gray-600">Total de Itens</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-black">{data.utilizationPercent}%</p>
                        <p className="text-xs text-gray-600">Utilização</p>
                    </div>
                </div>

                {/* Print Categories */}
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-black mb-3 uppercase">Categorias</h4>
                    <div className="grid grid-cols-3 gap-3">
                        {data.categories.map(cat => (
                            <div key={cat.id} className="p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <span>{cat.emoji}</span>
                                    <span className="font-semibold text-sm text-black">{cat.name}</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    <span>{cat.currentStock} / {cat.maxCapacity} ({Math.round((cat.currentStock / cat.maxCapacity) * 100)}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Print Items Table */}
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-black mb-3 uppercase">Itens do Estoque</h4>
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="text-left p-2 border border-gray-200 font-semibold">Item</th>
                                <th className="text-left p-2 border border-gray-200 font-semibold">Categoria</th>
                                <th className="text-right p-2 border border-gray-200 font-semibold">Qtd. Atual</th>
                                <th className="text-right p-2 border border-gray-200 font-semibold">Mínimo</th>
                                <th className="text-right p-2 border border-gray-200 font-semibold">Máximo</th>
                                <th className="text-center p-2 border border-gray-200 font-semibold">Status</th>
                                <th className="text-right p-2 border border-gray-200 font-semibold">Dias Rest.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map(item => (
                                <tr key={item.id} className={item.status === 'critical' ? 'bg-red-50' : item.status === 'low' ? 'bg-amber-50' : ''}>
                                    <td className="p-2 border border-gray-200 font-medium text-black">{item.name}</td>
                                    <td className="p-2 border border-gray-200 text-gray-700">{item.category}</td>
                                    <td className="p-2 border border-gray-200 text-right font-semibold text-black">{item.currentQty} {item.unit}</td>
                                    <td className="p-2 border border-gray-200 text-right text-gray-600">{item.minQty}</td>
                                    <td className="p-2 border border-gray-200 text-right text-gray-600">{item.maxQty}</td>
                                    <td className="p-2 border border-gray-200 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.status === 'critical' ? 'bg-red-600 text-white' :
                                                item.status === 'low' ? 'bg-amber-500 text-white' :
                                                    item.status === 'excess' ? 'bg-purple-500 text-white' :
                                                        'bg-green-500 text-white'
                                            }`}>
                                            {item.status === 'critical' ? 'CRÍTICO' :
                                                item.status === 'low' ? 'BAIXO' :
                                                    item.status === 'excess' ? 'EXCESSO' : 'OK'}
                                        </span>
                                    </td>
                                    <td className="p-2 border border-gray-200 text-right text-gray-700">{item.daysUntilEmpty} dias</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Print Alerts Summary */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-black mb-2 uppercase">Resumo de Alertas</h4>
                    <div className="flex gap-6 text-sm">
                        <span><strong className="text-red-600">{data.alerts.critical}</strong> Críticos</span>
                        <span><strong className="text-amber-600">{data.alerts.low}</strong> Baixos</span>
                        <span><strong className="text-purple-600">{data.alerts.excess}</strong> Em excesso</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InventoryPulseChart
