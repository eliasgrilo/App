// ═══════════════════════════════════════════════════════════════════
// MODAL FORM MODULES — Input Components
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ModalIcons } from '../ModalIcons'
import { SmartInputProps, ToggleProps, PremiumTextareaProps } from './utils'

export const SmartInput = ({ value, onChange, placeholder, type = 'text', inputMode, align = 'right', width = 'w-full', autoFocus = false, formatter, fullWidth = false }: SmartInputProps): React.ReactElement => {
    const [focused, setFocused] = useState(false)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => { let val = e.target.value; if (formatter) val = formatter(val); onChange({ target: { value: val } }) }
    return (
        <motion.div className={`relative ${fullWidth ? 'flex-1' : ''}`} animate={{ scale: focused ? 1.01 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <motion.div animate={{ boxShadow: focused ? '0 0 0 4px rgba(0,122,255,0.12), 0 0 20px rgba(0,122,255,0.1)' : '0 0 0 0px rgba(0,122,255,0)' }} style={{ borderRadius: 10 }} transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <input type={type} inputMode={inputMode} value={value} onChange={handleChange} placeholder={placeholder} autoFocus={autoFocus} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    className={`${width} h-[36px] px-3 text-[17px] font-medium bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px] text-[#007aff] placeholder:text-[#aeaeb2] outline-none transition-colors duration-[250ms] ${align === 'right' ? 'text-right' : 'text-left'} ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}`} />
            </motion.div>
        </motion.div>
    )
}

export const Toggle = ({ on, onChange, label = "Alternar opção" }: ToggleProps): React.ReactElement => (
    <motion.button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-300 ${on ? 'bg-[#34c759]' : 'bg-[#e9e9eb] dark:bg-[#39393d]'}`} whileTap={{ scale: 0.95 }} style={{ boxShadow: on ? '0 2px 12px rgba(52,199,89,0.4)' : 'none' }}>
        <motion.div className="w-[27px] h-[27px] bg-white rounded-full shadow-md flex items-center justify-center" animate={{ x: on ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
            <motion.div className="text-[#34c759]" animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }}>{ModalIcons.check}</motion.div>
        </motion.div>
    </motion.button>
)

export const PremiumTextarea = ({ value, onChange, placeholder, rows = 3 }: PremiumTextareaProps): React.ReactElement => {
    const [focused, setFocused] = useState(false)
    return (
        <motion.div animate={{ boxShadow: focused ? '0 0 0 4px rgba(0,122,255,0.12), 0 0 20px rgba(0,122,255,0.1)' : '0 0 0 0px rgba(0,122,255,0)' }} style={{ borderRadius: 14 }}>
            <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                className={`w-full px-4 py-3 text-[17px] font-medium bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[14px] text-[#1d1d1f] dark:text-white placeholder:text-[#aeaeb2] outline-none transition-colors duration-[250ms] resize-none ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}`} />
        </motion.div>
    )
}
