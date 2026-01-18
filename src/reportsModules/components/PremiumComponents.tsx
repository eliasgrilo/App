/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PREMIUM CHART COMPONENTS — Apple HIG Ultra-Premium Design System
 * 
 * This file now serves as a barrel export for the refactored premium components.
 * All components have been organized into focused modules:
 * 
 * - animation/: Sparkline, AnimatedNumber, AnimatedCurrency, AnimatedPercent
 * - display/: GlassCard, MetricCard, StatusBadge, ProgressRing, Skeleton
 * - feedback/: ConfettiCelebration, RevealOnScroll, PageEntrance, Tooltip
 * - interaction/: MagneticHover, ElasticScale, GradientText, HapticButton
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Re-export all components from the organized premium directory
export * from './premium'

// Additional chart-specific components that remain in this file

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// CHART TOGGLE — Show/Hide Chart Component (ABC Style)
// ═══════════════════════════════════════════════════════════════════════════════

interface ChartToggleProps {
    children: React.ReactNode
    label?: string
    defaultOpen?: boolean
}

export const ChartToggle: React.FC<ChartToggleProps> = ({
    children,
    label = 'Gráfico',
    defaultOpen = false
}) => {
    const [isVisible, setIsVisible] = useState(defaultOpen)

    return (
        <>
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors print:hidden"
            >
                <motion.div animate={{ rotate: isVisible ? 180 : 0 }}>
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
                {isVisible ? 'Ocultar' : 'Mostrar'} {label}
            </button>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED BAR — Bar that Animates on Entrance
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedBarProps {
    value: number
    maxValue: number
    color: string
    index: number
    label?: string
    showValue?: boolean
}

export const AnimatedBar: React.FC<AnimatedBarProps> = ({
    value,
    maxValue,
    color,
    index,
    label,
    showValue = true
}) => {
    const percentage = Math.min((value / maxValue) * 100, 100)

    return (
        <div className="flex items-center gap-3">
            {label && (
                <span className="text-xs text-zinc-600 dark:text-zinc-400 w-20 truncate">{label}</span>
            )}
            <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                <motion.div
                    className="h-full rounded-lg"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                        delay: index * 0.08,
                        duration: 0.6,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                />
            </div>
            {showValue && (
                <motion.span
                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 w-12 text-right tabular-nums"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.3 }}
                >
                    {value.toLocaleString('pt-BR')}
                </motion.span>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE LEGEND — Click to Toggle Series
// ═══════════════════════════════════════════════════════════════════════════════

interface LegendItem {
    id: string
    label: string
    color: string
    active: boolean
}

interface InteractiveLegendProps {
    items: LegendItem[]
    onToggle: (id: string) => void
}

export const InteractiveLegend: React.FC<InteractiveLegendProps> = ({
    items,
    onToggle
}) => (
    <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
            <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onToggle(item.id)}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full
                    text-xs font-medium
                    transition-all duration-200
                    ${item.active
                        ? 'bg-zinc-100 dark:bg-zinc-800'
                        : 'bg-zinc-50 dark:bg-zinc-900 opacity-50'
                    }
                `}
            >
                <span
                    className="w-3 h-3 rounded-full"
                    style={{
                        backgroundColor: item.color,
                        opacity: item.active ? 1 : 0.3
                    }}
                />
                <span className={item.active ? '' : 'line-through'}>{item.label}</span>
            </motion.button>
        ))}
    </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE — Beautiful Empty State Design
// ═══════════════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
    icon: React.ReactNode
    title: string
    description: string
    action?: { label: string; onClick: () => void }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4"
        >
            {icon}
        </motion.div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">{title}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">{description}</p>
        {action && (
            <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={action.onClick}
                className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 rounded-xl"
            >
                {action.label}
            </motion.button>
        )}
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// CHART PATH ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedChartPathProps {
    d: string
    stroke?: string
    strokeWidth?: number
    duration?: number
    delay?: number
}

export const AnimatedChartPath: React.FC<AnimatedChartPathProps> = ({
    d,
    stroke = '#007AFF',
    strokeWidth = 2,
    duration = 1.5,
    delay = 0
}) => {
    const pathRef = React.useRef<SVGPathElement>(null)
    const [pathLength, setPathLength] = React.useState(0)

    React.useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength())
        }
    }, [d])

    return (
        <motion.path
            ref={pathRef}
            d={d}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ strokeDasharray: pathLength, strokeDashoffset: pathLength }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration, delay, ease: 'easeOut' }}
        />
    )
}

interface DataPointPopProps {
    cx: number
    cy: number
    r?: number
    fill?: string
    index?: number
    totalPoints?: number
}

export const DataPointPop: React.FC<DataPointPopProps> = ({
    cx,
    cy,
    r = 4,
    fill = '#007AFF',
    index = 0,
    totalPoints = 10
}) => (
    <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
            delay: 0.5 + (index / totalPoints) * 0.8,
            type: 'spring',
            stiffness: 400,
            damping: 15
        }}
    />
)

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND EFFECTS
// ═══════════════════════════════════════════════════════════════════════════════

interface ParticleBackgroundProps {
    particleCount?: number
    colors?: string[]
    className?: string
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
    particleCount = 15,
    colors = ['#007AFF', '#5856D6', '#34C759', '#FF9500'],
    className = ''
}) => {
    const particles = React.useMemo(() =>
        Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 2,
            duration: Math.random() * 25 + 20,
            delay: Math.random() * 10,
            color: colors[Math.floor(Math.random() * colors.length)]
        })),
        [particleCount, colors])

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            <style>{`
                @keyframes particleFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
                    25% { transform: translate(10px, -20px) scale(1.1); opacity: 0.35; }
                    50% { transform: translate(-5px, -10px) scale(0.95); opacity: 0.25; }
                    75% { transform: translate(5px, 15px) scale(1.05); opacity: 0.4; }
                }
            `}</style>
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full will-change-transform"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        animation: `particleFloat ${p.duration}s ease-in-out infinite`,
                        animationDelay: `${p.delay}s`
                    }}
                />
            ))}
        </div>
    )
}

interface MorphingBlobsProps {
    colors?: string[]
    className?: string
}

export const MorphingBlobs: React.FC<MorphingBlobsProps> = ({
    colors = ['#007AFF', '#5856D6', '#AF52DE'],
    className = ''
}) => {
    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            <style>{`
                @keyframes blobMorph1 {
                    0%, 100% { transform: translate(0, 0) scale(1); border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
                    33% { transform: translate(40px, -30px) scale(1.15); border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
                    66% { transform: translate(-20px, 20px) scale(0.95); border-radius: 40% 60% 70% 30% / 40% 70% 30% 60%; }
                }
                @keyframes blobMorph2 {
                    0%, 100% { transform: translate(0, 0) scale(1); border-radius: 50% 50% 50% 50%; }
                    25% { transform: translate(-30px, 40px) scale(1.1); border-radius: 70% 30% 50% 50% / 30% 50% 50% 70%; }
                    75% { transform: translate(30px, -20px) scale(0.9); border-radius: 30% 70% 30% 70% / 70% 30% 70% 30%; }
                }
            `}</style>
            {colors.map((color, i) => (
                <div
                    key={i}
                    className="absolute blur-3xl will-change-transform"
                    style={{
                        width: '35%',
                        height: '35%',
                        left: `${20 + i * 25}%`,
                        top: `${10 + i * 20}%`,
                        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
                        animation: `blobMorph${(i % 2) + 1} ${25 + i * 8}s ease-in-out infinite`,
                        animationDelay: `${i * 3}s`
                    }}
                />
            ))}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYERED SHADOW CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface LayeredShadowCardProps {
    children: React.ReactNode
    depth?: 1 | 2 | 3 | 4 | 5
    className?: string
    hoverLift?: boolean
}

export const LayeredShadowCard: React.FC<LayeredShadowCardProps> = ({
    children,
    depth = 3,
    className = '',
    hoverLift = true
}) => {
    const shadowLayers = {
        1: 'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        2: 'shadow-[0_2px_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.04)]',
        3: 'shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.04)]',
        4: 'shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.03),0_24px_48px_rgba(0,0,0,0.04),0_32px_64px_rgba(0,0,0,0.03)]',
        5: 'shadow-[0_4px_8px_rgba(0,0,0,0.02),0_12px_24px_rgba(0,0,0,0.03),0_24px_48px_rgba(0,0,0,0.04),0_48px_96px_rgba(0,0,0,0.05),0_64px_128px_rgba(0,0,0,0.03)]'
    }

    const hoverShadow: Record<number, string> = hoverLift ? {
        1: 'hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)]',
        2: 'hover:shadow-[0_8px_16px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.06)]',
        3: 'hover:shadow-[0_8px_16px_rgba(0,0,0,0.04),0_24px_48px_rgba(0,0,0,0.06),0_32px_64px_rgba(0,0,0,0.06)]',
        4: 'hover:shadow-[0_8px_16px_rgba(0,0,0,0.03),0_24px_48px_rgba(0,0,0,0.05),0_48px_96px_rgba(0,0,0,0.06),0_64px_128px_rgba(0,0,0,0.04)]',
        5: 'hover:shadow-[0_8px_16px_rgba(0,0,0,0.03),0_24px_48px_rgba(0,0,0,0.04),0_48px_96px_rgba(0,0,0,0.05),0_96px_192px_rgba(0,0,0,0.06),0_128px_256px_rgba(0,0,0,0.04)]'
    } : {}

    return (
        <motion.div
            className={`${shadowLayers[depth]} ${hoverShadow[depth] || ''} transition-all duration-500 ${className}`}
            whileHover={hoverLift ? { y: -4, scale: 1.01 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            {children}
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCROLL CONTAINERS
// ═══════════════════════════════════════════════════════════════════════════════

interface ElasticScrollContainerProps {
    children: React.ReactNode
    className?: string
    maxBounce?: number
}

export const ElasticScrollContainer: React.FC<ElasticScrollContainerProps> = ({
    children,
    className = '',
    maxBounce = 50
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [bounce, setBounce] = React.useState(0)

    React.useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const handleScroll = () => {
            const scrollTop = el.scrollTop
            const scrollHeight = el.scrollHeight - el.clientHeight

            if (scrollTop < 0) {
                setBounce(Math.min(-scrollTop, maxBounce))
            } else if (scrollTop > scrollHeight) {
                setBounce(Math.max(-(scrollTop - scrollHeight), -maxBounce))
            } else {
                setBounce(0)
            }
        }

        el.addEventListener('scroll', handleScroll, { passive: true })
        return () => el.removeEventListener('scroll', handleScroll)
    }, [maxBounce])

    return (
        <div
            ref={containerRef}
            className={`overflow-auto overscroll-contain ${className}`}
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            <motion.div
                animate={{ y: bounce * 0.3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
                {children}
            </motion.div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SVG ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface SVGLineDrawProps {
    d: string
    stroke?: string
    strokeWidth?: number
    duration?: number
    delay?: number
    className?: string
}

export const SVGLineDraw: React.FC<SVGLineDrawProps> = ({
    d,
    stroke = '#007AFF',
    strokeWidth = 2,
    duration = 2,
    delay = 0,
    className = ''
}) => {
    const pathRef = React.useRef<SVGPathElement>(null)
    const [pathLength, setPathLength] = React.useState(0)

    React.useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength())
        }
    }, [d])

    return (
        <motion.path
            ref={pathRef}
            d={d}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            initial={{
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength
            }}
            animate={{
                strokeDashoffset: 0
            }}
            transition={{
                duration,
                delay,
                ease: [0.4, 0, 0.2, 1]
            }}
        />
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLASS BORDERS
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedGlassBorderProps {
    children: React.ReactNode
    colors?: string[]
    borderWidth?: number
    className?: string
}

export const AnimatedGlassBorder: React.FC<AnimatedGlassBorderProps> = ({
    children,
    colors = ['#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#007AFF'],
    borderWidth = 2,
    className = ''
}) => {
    return (
        <motion.div
            className={`relative ${className}`}
            style={{ padding: borderWidth }}
        >
            <motion.div
                className="absolute inset-0 rounded-[inherit]"
                style={{
                    background: `linear-gradient(90deg, ${colors.join(', ')})`,
                    backgroundSize: '300% 100%'
                }}
                animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />
            <div className="relative bg-white/80 dark:bg-black/60 backdrop-blur-xl rounded-[inherit]">
                {children}
            </div>
        </motion.div>
    )
}

interface ColorShiftGradientProps {
    colors?: string[]
    className?: string
    children?: React.ReactNode
}

export const ColorShiftGradient: React.FC<ColorShiftGradientProps> = ({
    colors = ['#667eea', '#764ba2', '#6B8DD6', '#8E37D7'],
    className = '',
    children
}) => {
    return (
        <motion.div
            className={`relative overflow-hidden ${className}`}
            style={{
                background: `linear-gradient(-45deg, ${colors.join(', ')})`,
                backgroundSize: '400% 400%'
            }}
            animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '50% 100%', '0% 50%']
            }}
            transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
        >
            {children}
        </motion.div>
    )
}
