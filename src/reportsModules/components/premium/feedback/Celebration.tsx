/**
 * Celebration Components — Visual Feedback Effects
 * 
 * Confetti and celebration animations.
 * @author Padoca Engineering Team
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiCelebrationProps {
    trigger: boolean
    colors?: string[]
}

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
    trigger,
    colors = ['#34C759', '#007AFF', '#FF9500', '#5856D6', '#FF3B30']
}) => {
    const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([])

    useEffect(() => {
        if (trigger) {
            const newParticles = Array.from({ length: 30 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                color: colors[Math.floor(Math.random() * colors.length)] ?? '#007AFF',
                delay: Math.random() * 0.3
            }))
            setParticles(newParticles)
            const timer = setTimeout(() => setParticles([]), 2000)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [trigger, colors])

    return (
        <AnimatePresence>
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute w-2 h-2 rounded-full pointer-events-none z-50"
                    style={{
                        left: `${p.x}%`,
                        top: 0,
                        backgroundColor: p.color
                    }}
                    initial={{ y: -20, opacity: 1, scale: 1 }}
                    animate={{
                        y: 400,
                        opacity: 0,
                        scale: 0,
                        rotate: 720,
                        x: (Math.random() - 0.5) * 100
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 1.5,
                        delay: p.delay,
                        ease: 'easeOut'
                    }}
                />
            ))}
        </AnimatePresence>
    )
}
