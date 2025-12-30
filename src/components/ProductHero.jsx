/**
 * ProductHero — Apple-Quality Hero Section
 * 
 * Design Philosophy:
 * - Immersive full-bleed visual hierarchy
 * - Scroll-linked kinetic typography with Apple SF Pro Display
 * - Multi-layered glassmorphism (SystemUltraThinMaterial)
 * - Orchestrated entrance animations with spring physics
 * - Premium gradient mesh backgrounds
 * - 3D perspective transforms on hover
 */

import { memo, useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
import { HapticService } from '../services/hapticService'
import { formatCurrency, FormatService } from '../services/formatService'

// Premium Apple color palette
const COLORS = {
    // Primary gradients
    violet: { start: '#7c3aed', end: '#4f46e5' },
    emerald: { start: '#10b981', end: '#059669' },
    amber: { start: '#f59e0b', end: '#d97706' },
    rose: { start: '#f43f5e', end: '#e11d48' },

    // Subtle background tints
    mesh1: 'rgba(124, 58, 237, 0.08)',
    mesh2: 'rgba(79, 70, 229, 0.06)',
    mesh3: 'rgba(16, 185, 129, 0.05)',
}

// Spring configs matching Apple's motion design
const SPRING = {
    stiff: { type: 'spring', stiffness: 400, damping: 30 },
    gentle: { type: 'spring', stiffness: 200, damping: 25 },
    bouncy: { type: 'spring', stiffness: 300, damping: 20 },
}

// Currency formatting handled by global FormatService

// Animated counter component
const AnimatedNumber = memo(({ value, prefix = '', suffix = '', duration = 1.5 }) => {
    const [displayValue, setDisplayValue] = useState(0)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-100px' })

    useEffect(() => {
        if (!isInView) return

        let startTime
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayValue(Math.floor(value * eased))

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }, [value, duration, isInView])

    return (
        <span ref={ref} className="tabular-nums">
            {prefix}{displayValue.toLocaleString()}{suffix}
        </span>
    )
})
AnimatedNumber.displayName = 'AnimatedNumber'

// Premium Stat Card with 3D effects
const StatCard = memo(({
    label,
    value,
    prefix = '',
    suffix = '',
    trend,
    trendLabel,
    color = 'violet',
    delay = 0,
    large = false
}) => {
    const cardRef = useRef(null)
    const isInView = useInView(cardRef, { once: true, margin: '-50px' })
    const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })

    const handleMouseMove = (e) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        setMousePosition({
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height
        })
    }

    const handleMouseLeave = () => {
        setMousePosition({ x: 0.5, y: 0.5 })
    }

    const gradientColors = COLORS[color] || COLORS.violet

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ ...SPRING.gentle, delay }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`
                relative group ${large ? 'col-span-2' : ''} 
                overflow-hidden rounded-[28px] 
                bg-white/[0.65] dark:bg-zinc-900/[0.65]
                backdrop-blur-2xl backdrop-saturate-200
                border border-white/60 dark:border-white/[0.08]
                shadow-[0_8px_32px_-4px_rgba(0,0,0,0.08),0_4px_16px_-2px_rgba(0,0,0,0.04)]
                dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),0_4px_16px_-2px_rgba(0,0,0,0.2)]
                transition-all duration-500 ease-out
                hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15),0_8px_24px_-4px_rgba(0,0,0,0.08)]
                dark:hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6),0_8px_24px_-4px_rgba(0,0,0,0.4)]
            `}
            style={{
                transform: `perspective(1000px) rotateX(${(mousePosition.y - 0.5) * -5}deg) rotateY(${(mousePosition.x - 0.5) * 5}deg)`,
                transition: 'transform 0.3s ease-out'
            }}
        >
            {/* Gradient glow on hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                    background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, ${gradientColors.start}15 0%, transparent 60%)`
                }}
            />

            {/* Content */}
            <div className={`relative ${large ? 'p-10 md:p-12' : 'p-6 md:p-8'}`}>
                {/* Label */}
                <div className="flex items-center justify-between mb-4">
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ ...SPRING.gentle, delay: delay + 0.1 }}
                        className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500"
                    >
                        {label}
                    </motion.span>

                    {/* Live indicator */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ ...SPRING.bouncy, delay: delay + 0.2 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.05]"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[9px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
                            Live
                        </span>
                    </motion.div>
                </div>

                {/* Value */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ ...SPRING.gentle, delay: delay + 0.15 }}
                    className={`${large ? 'text-5xl md:text-7xl' : 'text-3xl md:text-4xl'} font-semibold tracking-tight text-zinc-900 dark:text-white`}
                    style={{
                        fontFeatureSettings: '"tnum" on, "lnum" on',
                        letterSpacing: '-0.025em'
                    }}
                >
                    {typeof value === 'number' ? (
                        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
                    ) : (
                        `${prefix}${value}${suffix}`
                    )}
                </motion.div>

                {/* Trend indicator */}
                {trend !== undefined && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ ...SPRING.gentle, delay: delay + 0.25 }}
                        className={`
                            inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full text-xs font-bold
                            ${trend >= 0
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }
                        `}
                    >
                        <svg
                            className={`w-3.5 h-3.5 ${trend < 0 ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7 7 7" />
                        </svg>
                        <span>{Math.abs(trend)}%</span>
                        {trendLabel && <span className="text-current/60 font-medium">{trendLabel}</span>}
                    </motion.div>
                )}
            </div>

            {/* Bottom gradient line */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `linear-gradient(90deg, transparent, ${gradientColors.start}, ${gradientColors.end}, transparent)`
                }}
            />
        </motion.div>
    )
})
StatCard.displayName = 'StatCard'

// Main Hero Component
function ProductHero({
    totalProducts = 0,
    totalValue = 0,
    totalMovements = 0,
    anomalyCount = 0
}) {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start']
    })

    // Smooth spring-based scroll values
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 20 })

    // Parallax transforms
    const titleY = useTransform(smoothProgress, [0, 1], [0, -100])
    const subtitleY = useTransform(smoothProgress, [0, 1], [0, -60])
    const titleOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0])
    const titleScale = useTransform(smoothProgress, [0, 0.3], [1, 0.95])
    const meshRotate = useTransform(smoothProgress, [0, 1], [0, 45])

    return (
        <section
            ref={containerRef}
            className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 mb-8 md:mb-12 overflow-hidden"
        >
            {/* Premium Mesh Gradient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 via-white to-zinc-50/0 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950/0" />

                {/* Animated mesh blobs */}
                <motion.div
                    className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full"
                    style={{
                        background: `radial-gradient(ellipse, ${COLORS.mesh1} 0%, transparent 70%)`,
                        rotate: meshRotate
                    }}
                />
                <motion.div
                    className="absolute -top-[20%] -right-[30%] w-[70%] h-[70%] rounded-full"
                    style={{
                        background: `radial-gradient(ellipse, ${COLORS.mesh2} 0%, transparent 70%)`,
                        rotate: useTransform(meshRotate, v => -v * 0.7)
                    }}
                />
                <motion.div
                    className="absolute top-[30%] left-[20%] w-[50%] h-[50%] rounded-full"
                    style={{
                        background: `radial-gradient(ellipse, ${COLORS.mesh3} 0%, transparent 70%)`,
                        rotate: useTransform(meshRotate, v => v * 0.5)
                    }}
                />

                {/* Noise texture overlay */}
                <div
                    className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:pt-16 md:pb-20">
                {/* Title Block */}
                <motion.div
                    className="max-w-4xl mx-auto text-center mb-12 md:mb-16"
                    style={{
                        y: titleY,
                        opacity: titleOpacity,
                        scale: titleScale
                    }}
                >
                    {/* Overline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...SPRING.gentle, delay: 0.1 }}
                        className="text-[11px] font-bold tracking-[0.3em] uppercase text-violet-600 dark:text-violet-400 mb-4"
                    >
                        Sistema de Inventário
                    </motion.p>

                    {/* Main title with gradient */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...SPRING.gentle, delay: 0.15 }}
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-6"
                        style={{
                            fontFeatureSettings: '"ss01" on, "ss02" on',
                            letterSpacing: '-0.035em'
                        }}
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-900 dark:from-white dark:via-zinc-300 dark:to-white">
                            Produtos
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...SPRING.gentle, delay: 0.2 }}
                        style={{ y: subtitleY }}
                        className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto"
                    >
                        Controle completo do seu estoque com análise preditiva,
                        <br className="hidden md:block" /> movimentações em tempo real e auditoria avançada.
                    </motion.p>
                </motion.div>

                {/* Stats Grid */}
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <StatCard
                        label="Valor em Estoque"
                        value={totalValue}
                        prefix="$ "
                        color="violet"
                        delay={0.3}
                        large
                    />

                    <StatCard
                        label="Produtos"
                        value={totalProducts}
                        color="emerald"
                        trend={12}
                        trendLabel="este mês"
                        delay={0.35}
                    />

                    <StatCard
                        label="Movimentações"
                        value={totalMovements}
                        color="violet"
                        delay={0.4}
                    />

                    {anomalyCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ ...SPRING.gentle, delay: 0.45 }}
                            onClick={() => HapticService.trigger('warning')}
                            className="
                                relative col-span-2 md:col-span-1 overflow-hidden rounded-[28px] p-6 md:p-8
                                bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10
                                dark:from-amber-500/20 dark:via-orange-500/15 dark:to-red-500/10
                                backdrop-blur-2xl
                                border border-amber-500/20 dark:border-amber-500/30
                                cursor-pointer group
                                hover:shadow-[0_20px_60px_-10px_rgba(245,158,11,0.25)]
                                dark:hover:shadow-[0_20px_60px_-10px_rgba(245,158,11,0.15)]
                                transition-all duration-500
                            "
                        >
                            {/* Pulsing glow */}
                            <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />

                            {/* Alert icon */}
                            <div className="relative flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-600/80 dark:text-amber-400/80">
                                    Atenção Necessária
                                </span>
                            </div>

                            <div className="relative text-3xl md:text-4xl font-semibold text-amber-700 dark:text-amber-300 tabular-nums tracking-tight">
                                <AnimatedNumber value={anomalyCount} suffix=" alertas" />
                            </div>

                            <p className="relative mt-2 text-sm text-amber-600/70 dark:text-amber-400/70 font-medium">
                                Requer revisão imediata
                            </p>

                            {/* Arrow indicator */}
                            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none" />
        </section>
    )
}

export default memo(ProductHero)
