/**
 * AppleStepper — iOS-style numeric stepper
 * Used for quantity inputs with +/- buttons
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export interface AppleStepperProps {
    /** Current numeric value */
    value: number
    /** Change handler */
    onChange: (value: number) => void
    /** Minimum value (default: 0) */
    min?: number
    /** Maximum value (default: 9999) */
    max?: number
    /** Step increment (default: 1) */
    step?: number
    /** Optional unit label */
    unit?: string
}

const MinusIcon: React.FC = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </svg>
)

const PlusIcon: React.FC = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
)

export const AppleStepper: React.FC<AppleStepperProps> = ({
    value,
    onChange,
    min = 0,
    max = 9999,
    step = 1,
    unit
}) => {
    const [inputValue, setInputValue] = useState(String(value))
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
        if (!isFocused) {
            setInputValue(String(value))
        }
    }, [value, isFocused])

    const decrease = () => {
        const newVal = Math.max(min, value - step)
        onChange(newVal)
        setInputValue(String(newVal))
    }

    const increase = () => {
        const newVal = Math.min(max, value + step)
        onChange(newVal)
        setInputValue(String(newVal))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const handleBlur = () => {
        setIsFocused(false)
        const numVal = Number(inputValue)
        if (inputValue === '' || isNaN(numVal)) {
            onChange(min)
            setInputValue(String(min))
        } else {
            const clamped = Math.max(min, Math.min(max, numVal))
            onChange(clamped)
            setInputValue(String(clamped))
        }
    }

    return (
        <div className="flex items-center gap-2">
            {unit && <span className="text-[13px] font-medium text-zinc-400">{unit}</span>}
            <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-700/50 rounded-xl overflow-hidden">
                <motion.button
                    type="button"
                    onClick={decrease}
                    whileTap={{ scale: 0.85, backgroundColor: 'rgba(0,0,0,0.1)' }}
                    className="w-9 h-9 flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
                >
                    <MinusIcon />
                </motion.button>
                <input
                    type="text"
                    inputMode="numeric"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    className="w-14 h-9 bg-transparent text-center text-[15px] font-bold text-zinc-900 dark:text-white border-x border-zinc-200/50 dark:border-zinc-600/50 outline-none"
                />
                <motion.button
                    type="button"
                    onClick={increase}
                    whileTap={{ scale: 0.85, backgroundColor: 'rgba(0,0,0,0.1)' }}
                    className="w-9 h-9 flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
                >
                    <PlusIcon />
                </motion.button>
            </div>
        </div>
    )
}

export default AppleStepper
