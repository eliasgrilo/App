/**
 * SuccessCheckmark — Animated success indicator
 * Apple-style celebration animation for form submission success
 */

import React from 'react'
import { motion } from 'framer-motion'
import { SPRING_BOUNCY } from './animations'

const CheckmarkIcon: React.FC = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
)

export interface SuccessCheckmarkProps {
    /** Custom size class (default: 'w-16 h-16') */
    size?: string
}

export const SuccessCheckmark: React.FC<SuccessCheckmarkProps> = ({ size = 'w-16 h-16' }) => (
    <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={SPRING_BOUNCY}
        className={`${size} rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-xl`}
    >
        <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
        >
            <CheckmarkIcon />
        </motion.div>
    </motion.div>
)

export default SuccessCheckmark
