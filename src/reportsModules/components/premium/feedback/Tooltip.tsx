/**
 * Tooltip Components — Floating UI Elements
 * 
 * Tooltip and spring-based floating elements.
 * @author Padoca Engineering Team
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence, useSpring } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING TOOLTIP — Apple-Style Blur Tooltip
// ═══════════════════════════════════════════════════════════════════════════════

interface FloatingTooltipProps {
    children: React.ReactNode
    content: React.ReactNode
    position?: 'top' | 'bottom' | 'left' | 'right'
}

export const FloatingTooltip: React.FC<FloatingTooltipProps> = ({
    children,
    content,
    position = 'top'
}) => {
    const [show, setShow] = useState(false)

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    }

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className={`
                            absolute ${positionClasses[position]}
                            px-3 py-2 rounded-xl
                            bg-zinc-900/90 dark:bg-white/90
                            backdrop-blur-xl
                            text-xs text-white dark:text-zinc-900
                            font-medium
                            shadow-2xl
                            whitespace-nowrap
                            z-50
                        `}
                    >
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPRING TOOLTIP — Chart tooltip with spring physics
// ═══════════════════════════════════════════════════════════════════════════════

interface SpringTooltipProps {
    visible: boolean
    x: number
    y: number
    children: React.ReactNode
}

export const SpringTooltip: React.FC<SpringTooltipProps> = ({
    visible,
    x,
    y,
    children
}) => {
    const springX = useSpring(x, { stiffness: 400, damping: 30 })
    const springY = useSpring(y, { stiffness: 400, damping: 30 })

    useEffect(() => {
        springX.set(x)
        springY.set(y)
    }, [x, y, springX, springY])

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed pointer-events-none z-50"
                    style={{ x: springX, y: springY }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-black/[0.05] dark:border-white/[0.1] p-4 min-w-[200px]">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
