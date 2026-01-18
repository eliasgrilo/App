/**
 * ═══════════════════════════════════════════════════════════════════
 * DragGhost — Dragging card ghost component
 * Extracted from Kanban.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion, AnimatePresence, MotionValue } from 'framer-motion'
import type { DragState } from '../types'
import { spring } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface DragGhostProps {
    dragState: DragState
    ghostX: MotionValue<number>
    ghostY: MotionValue<number>
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const DragGhost = React.memo(({ dragState, ghostX, ghostY }: DragGhostProps) => {
    return (
        <AnimatePresence>
            {dragState.isDragging && dragState.active && (
                <motion.div
                    layoutId={dragState.active?.id}
                    initial={{ scale: 1.02, opacity: 0.95 }}
                    animate={{ scale: 1.05, opacity: 1, rotate: 1.5 }}
                    exit={{ scale: 1, opacity: 0, transition: { duration: 0.15, ease: [0.32, 0.72, 0, 1] } }}
                    transition={{ ...spring.ghost, ease: [0.32, 0.72, 0, 1] }}
                    style={{
                        x: ghostX, y: ghostY, position: 'fixed', top: 0, left: 0,
                        width: dragState.active.rect.width, zIndex: 10000, pointerEvents: 'none',
                        willChange: 'transform', cursor: 'grabbing'
                    }}
                    className="rounded-2xl"
                >
                    {/* Premium Glassmorphism Card */}
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-2xl border border-white/50 dark:border-white/15 p-5 overflow-hidden relative shadow-[0_25px_60px_-10px_rgba(0,0,0,0.25),0_8px_20px_-8px_rgba(0,0,0,0.15)]">
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/5 pointer-events-none" />
                        {/* Shine effect */}
                        <motion.div
                            className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 pointer-events-none"
                            animate={{ x: ['0%', '200%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                        />
                        {dragState.active.data.labels?.length > 0 && (
                            <div className="flex gap-1.5 mb-3 relative z-10">
                                {dragState.active.data.labels.map((l, i) => (
                                    <motion.div
                                        key={i}
                                        className="h-2 w-12 rounded-full shadow-sm"
                                        style={{ backgroundColor: l.color }}
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                    />
                                ))}
                            </div>
                        )}
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white leading-relaxed relative z-10">{dragState.active.data.title}</h4>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})

export default DragGhost
