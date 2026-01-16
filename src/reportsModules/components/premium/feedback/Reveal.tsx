/**
 * Reveal Components — Scroll and Page Entrance Animations
 * 
 * Components for revealing content with animations.
 * @author Padoca Engineering Team
 */

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// REVEAL ON SCROLL — Element Reveals When Visible (OPTIMIZED)
// ═══════════════════════════════════════════════════════════════════════════════

interface RevealOnScrollProps {
    children: React.ReactNode
    direction?: 'up' | 'down' | 'left' | 'right'
    className?: string
}

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
    children,
    direction = 'up',
    className = ''
}) => {
    const ref = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry && entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.05, rootMargin: '50px' }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    const variants = {
        hidden: {
            opacity: 0,
            y: direction === 'up' ? 12 : direction === 'down' ? -12 : 0,
            x: direction === 'left' ? 12 : direction === 'right' ? -12 : 0
        },
        visible: { opacity: 1, y: 0, x: 0 }
    }

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
            variants={variants}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE ENTRANCE — Orchestrated page animations
// ═══════════════════════════════════════════════════════════════════════════════

interface PageEntranceProps {
    children: React.ReactNode
    className?: string
}

export const PageEntrance: React.FC<PageEntranceProps> = ({
    children,
    className = ''
}) => {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                duration: 0.3,
                ease: 'easeOut'
            }}
        >
            {children}
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLUR TRANSITION — Simple Fade (OPTIMIZED - no blur for performance)
// ═══════════════════════════════════════════════════════════════════════════════

interface BlurTransitionProps {
    children: React.ReactNode
    delay?: number
}

export const BlurTransition: React.FC<BlurTransitionProps> = ({
    children,
    delay = 0
}) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay }}
    >
        {children}
    </motion.div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// STAGGERED LIST — Items Animate In Sequence
// ═══════════════════════════════════════════════════════════════════════════════

interface StaggeredListProps {
    children: React.ReactNode[]
    staggerDelay?: number
    className?: string
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
    children,
    staggerDelay = 0.05,
    className = ''
}) => (
    <div className={className}>
        {children.map((child, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: i * staggerDelay,
                    duration: 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94]
                }}
            >
                {child}
            </motion.div>
        ))}
    </div>
)
