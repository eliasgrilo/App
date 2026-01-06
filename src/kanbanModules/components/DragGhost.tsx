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
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1, opacity: 1 }}
                    transition={spring.ghost}
                    style={{
                        x: ghostX, y: ghostY, position: 'fixed', top: 0, left: 0,
                        width: dragState.active.rect.width, zIndex: 10000, pointerEvents: 'none',
                        willChange: 'transform', cursor: 'grabbing'
                    }}
                    className="rounded-2xl"
                >
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/10 p-5 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none" />
                        <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 pointer-events-none" />
                        {dragState.active.data.labels?.length > 0 && (
                            <div className="flex gap-1.5 mb-3 relative z-10">
                                {dragState.active.data.labels.map((l, i) => (
                                    <div key={i} className="h-2 w-12 rounded-full shadow-sm" style={{ backgroundColor: l.color }} />
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
