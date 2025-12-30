/**
 * LiquidNavigation — Apple-Quality Tab Navigation
 * 
 * Design Philosophy:
 * - Morphing indicator with liquid motion physics
 * - Spring-based transitions (Apple's exact easing curves)
 * - Badge system with semantic colors
 * - Haptic feedback integration
 * - 44pt minimum touch targets (iOS HIG)
 * - Glassmorphism with depth layers
 */

import { memo, useRef, useState, useLayoutEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HapticService } from '../services/hapticService'

// SF Symbol-style icons for each tab
const TabIcons = {
    products: (active) => (
        <svg className={`w-[18px] h-[18px] ${active ? 'text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    ),
    timeline: (active) => (
        <svg className={`w-[18px] h-[18px] ${active ? 'text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    insights: (active) => (
        <svg className={`w-[18px] h-[18px] ${active ? 'text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
    ),
    map: (active) => (
        <svg className={`w-[18px] h-[18px] ${active ? 'text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
    ),
    sourcing: (active) => (
        <svg className={`w-[18px] h-[18px] ${active ? 'text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    )
}

// Tab configuration with labels
export const PRODUCT_TABS = [
    { id: 'products', label: 'Produtos', shortLabel: 'Produtos' },
    { id: 'timeline', label: 'Timeline', shortLabel: 'Timeline' },
    { id: 'insights', label: 'Insights', shortLabel: 'Insights' },
    { id: 'map', label: 'Mapa', shortLabel: 'Mapa' },
    { id: 'sourcing', label: 'Cotações', shortLabel: 'Cotar' }
]

// Spring physics matching Apple's motion design
const SPRING = {
    indicator: { type: 'spring', stiffness: 400, damping: 35 },
    tab: { type: 'spring', stiffness: 500, damping: 30 },
    badge: { type: 'spring', stiffness: 300, damping: 20 }
}

// Badge component with semantic styling
const TabBadge = memo(({ count, type = 'default' }) => {
    const colors = {
        default: 'bg-violet-500 text-white',
        warning: 'bg-amber-500 text-white',
        danger: 'bg-rose-500 text-white',
        success: 'bg-emerald-500 text-white'
    }

    return (
        <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={SPRING.badge}
            className={`
                absolute -top-1 -right-1.5 
                min-w-[18px] h-[18px] px-1
                flex items-center justify-center
                text-[10px] font-bold tabular-nums
                rounded-full shadow-sm
                ${colors[type] || colors.default}
            `}
        >
            {count > 99 ? '99+' : count}
        </motion.span>
    )
})
TabBadge.displayName = 'TabBadge'

// Individual tab button
const TabButton = memo(({
    tab,
    isActive,
    onClick,
    onMouseEnter,
    tabRef
}) => {
    const Icon = TabIcons[tab.id]

    return (
        <motion.button
            ref={tabRef}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            whileTap={{ scale: 0.95 }}
            className={`
                relative flex items-center gap-2 
                px-4 md:px-5 py-3 min-h-[48px]
                text-sm font-semibold tracking-tight
                rounded-2xl
                transition-colors duration-200
                ${isActive
                    ? 'text-white'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }
            `}
        >
            {/* Icon */}
            {Icon && Icon(isActive)}

            {/* Label - hidden on mobile for compact tabs */}
            <span className={`hidden md:inline ${isActive ? 'text-white' : ''}`}>
                {tab.label}
            </span>
            <span className="inline md:hidden">
                {tab.shortLabel || tab.label}
            </span>

            {/* Badge */}
            <AnimatePresence mode="wait">
                {tab.badge && (
                    <TabBadge count={tab.badge} type={tab.badgeType} />
                )}
            </AnimatePresence>
        </motion.button>
    )
})
TabButton.displayName = 'TabButton'

// Main navigation component
function LiquidNavigation({
    tabs = PRODUCT_TABS,
    activeTab = 'products',
    onTabChange,
    className = ''
}) {
    const containerRef = useRef(null)
    const tabRefs = useRef({})
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
    const [hoveredTab, setHoveredTab] = useState(null)

    // Calculate indicator position
    const updateIndicator = useCallback(() => {
        const targetTab = hoveredTab || activeTab
        const tabElement = tabRefs.current[targetTab]
        const containerElement = containerRef.current

        if (tabElement && containerElement) {
            const tabRect = tabElement.getBoundingClientRect()
            const containerRect = containerElement.getBoundingClientRect()

            setIndicatorStyle({
                left: tabRect.left - containerRect.left,
                width: tabRect.width
            })
        }
    }, [activeTab, hoveredTab])

    // Update on mount and changes
    useLayoutEffect(() => {
        updateIndicator()

        // Also update after fonts load
        if (document.fonts?.ready) {
            document.fonts.ready.then(updateIndicator)
        }

        // Update on resize
        const handleResize = () => updateIndicator()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [updateIndicator])

    const handleTabClick = useCallback((tabId) => {
        HapticService.trigger('selection')
        onTabChange?.(tabId)
    }, [onTabChange])

    const handleMouseLeave = useCallback(() => {
        setHoveredTab(null)
    }, [])

    return (
        <div
            ref={containerRef}
            onMouseLeave={handleMouseLeave}
            className={`
                relative flex items-center gap-1
                p-1.5 rounded-[20px]
                bg-zinc-100/80 dark:bg-zinc-900/60
                backdrop-blur-xl backdrop-saturate-150
                border border-zinc-200/60 dark:border-white/[0.06]
                shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]
                dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)]
                overflow-x-auto overflow-y-hidden
                scrollbar-hide
                ${className}
            `}
        >
            {/* Morphing indicator */}
            <motion.div
                layout
                layoutId="tab-indicator"
                initial={false}
                animate={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width
                }}
                transition={SPRING.indicator}
                className="
                    absolute top-1.5 bottom-1.5
                    bg-gradient-to-br from-zinc-800 via-zinc-900 to-black
                    dark:from-zinc-100 dark:via-white dark:to-zinc-200
                    rounded-[16px]
                    shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3),0_2px_4px_-1px_rgba(0,0,0,0.2)]
                    dark:shadow-[0_4px_12px_-2px_rgba(255,255,255,0.1),0_2px_4px_-1px_rgba(255,255,255,0.05)]
                "
                style={{
                    zIndex: 0,
                    // Subtle inner glow
                    boxShadow: `
                        inset 0 1px 0 rgba(255,255,255,0.1),
                        0 4px 12px -2px rgba(0,0,0,0.3),
                        0 2px 4px -1px rgba(0,0,0,0.2)
                    `
                }}
            />

            {/* Tab buttons */}
            {tabs.map((tab) => (
                <TabButton
                    key={tab.id}
                    tab={tab}
                    isActive={activeTab === tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    onMouseEnter={() => setHoveredTab(tab.id)}
                    tabRef={(el) => tabRefs.current[tab.id] = el}
                />
            ))}
        </div>
    )
}

export default memo(LiquidNavigation)
