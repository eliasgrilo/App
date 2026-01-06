// ═══════════════════════════════════════════════════════════════════
// SUPPLIER FORM INPUTS — Contact Inputs
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icons } from '../../Icons'
import { formatPhone, isValidEmail } from '../../formatters'

export interface PhoneInputProps { value: string; onChange: (e: { target: { value: string } }) => void; placeholder?: string; onCall?: (phone: string) => void }

export function PhoneInput({ value, onChange, placeholder, onCall }: PhoneInputProps) {
    const [focused, setFocused] = useState(false); const hasValue = value && value.replace(/\D/g, '').length >= 10
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange({ target: { value: formatPhone(e.target.value) } })
    return <div className="flex items-center gap-2 flex-1"><motion.div className="flex-1 relative" animate={{ boxShadow: focused ? '0 0 0 4px rgba(0,122,255,0.12), 0 0 20px rgba(0,122,255,0.1)' : '0 0 0 0px rgba(0,122,255,0)' }} style={{ borderRadius: 10 }}><input type="tel" inputMode="tel" value={value} onChange={handleChange} placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} className={`w-full h-[36px] px-3 text-[17px] font-medium tabular-nums bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px] text-[#007aff] placeholder:text-[#aeaeb2] outline-none transition-colors duration-[250ms] ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}`} /></motion.div>{hasValue && onCall && <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.9 }} onClick={() => onCall(value)} className="w-9 h-9 rounded-full bg-[#34c759] flex items-center justify-center text-white shadow-md" style={{ boxShadow: '0 2px 8px rgba(52,199,89,0.4)' }}>{Icons.call}</motion.button>}</div>
}

export interface EmailInputProps { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; onEmail?: (email: string) => void }

export function EmailInput({ value, onChange, placeholder, onEmail }: EmailInputProps) {
    const [focused, setFocused] = useState(false); const validState = isValidEmail(value); const hasValue = value && value.length > 0
    return <div className="flex items-center gap-2 flex-1"><motion.div className="flex-1 relative" animate={{ boxShadow: focused ? (validState === false ? '0 0 0 4px rgba(255,59,48,0.15), 0 0 20px rgba(255,59,48,0.1)' : '0 0 0 4px rgba(0,122,255,0.12), 0 0 20px rgba(0,122,255,0.1)') : '0 0 0 0px rgba(0,122,255,0)' }} style={{ borderRadius: 10 }}><input type="email" inputMode="email" value={value} onChange={onChange} placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} className={`w-full h-[36px] px-3 pr-9 text-[17px] font-medium bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px] placeholder:text-[#aeaeb2] outline-none transition-colors duration-[250ms] ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''} ${validState === true ? 'text-[#34c759]' : validState === false ? 'text-[#ff3b30]' : 'text-[#007aff]'}`} />{hasValue && <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className={`absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center ${validState ? 'bg-[#34c759]/15 text-[#34c759]' : 'bg-[#ff3b30]/15 text-[#ff3b30]'}`}>{validState ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}</motion.div>}</motion.div>{validState && onEmail && <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.9 }} onClick={() => onEmail(value)} className="w-9 h-9 rounded-full bg-[#007aff] flex items-center justify-center text-white shadow-md" style={{ boxShadow: '0 2px 8px rgba(0,122,255,0.4)' }}>{Icons.mail}</motion.button>}</div>
}

export interface WhatsAppInputProps { value: string; onChange: (e: { target: { value: string } }) => void; placeholder?: string; onWhatsApp?: (whatsapp: string) => void }

export function WhatsAppInput({ value, onChange, placeholder, onWhatsApp }: WhatsAppInputProps) {
    const [focused, setFocused] = useState(false); const hasValue = value && value.replace(/\D/g, '').length >= 10
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange({ target: { value: formatPhone(e.target.value) } })
    return <div className="flex items-center gap-2 flex-1"><motion.div className="flex-1 relative" animate={{ boxShadow: focused ? '0 0 0 4px rgba(37,211,102,0.15), 0 0 20px rgba(37,211,102,0.1)' : '0 0 0 0px rgba(37,211,102,0)' }} style={{ borderRadius: 10 }}><input type="tel" inputMode="tel" value={value} onChange={handleChange} placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} className={`w-full h-[36px] px-3 text-[17px] font-medium tabular-nums bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-[10px] text-[#25D366] placeholder:text-[#aeaeb2] outline-none transition-colors duration-[250ms] ${focused ? 'bg-white dark:bg-[#3a3a3c]' : ''}`} /></motion.div>{hasValue && onWhatsApp && <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.9 }} onClick={() => onWhatsApp(value)} className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md" style={{ boxShadow: '0 2px 8px rgba(37,211,102,0.4)' }}>{Icons.whatsapp}</motion.button>}</div>
}
