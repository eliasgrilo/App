/**
 * AppleToggle — iOS authentic toggle with scale bounce
 * Used across modals for boolean switches
 */

import React from 'react'
import { motion, useSpring } from 'framer-motion'
import { SPRING_BOUNCY } from './animations'

export interface AppleToggleProps {
    checked: boolean
    onChange: (v: boolean) => void
}

export const AppleToggle: React.FC<AppleToggleProps> = ({ checked, onChange }) => {
    const scale = useSpring(1, { stiffness: 500, damping: 30 })

    return (
        <motion.button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            onTapStart={() => scale.set(0.95)}
            onTap={() => scale.set(1)}
            onTapCancel={() => scale.set(1)}
            style={{ scale }}
            className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-300 ${checked ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
        >
            <motion.div
                animate={{ x: checked ? 20 : 0 }}
                transition={SPRING_BOUNCY}
                className="absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-lg"
            />
        </motion.button>
    )
}

export default AppleToggle
