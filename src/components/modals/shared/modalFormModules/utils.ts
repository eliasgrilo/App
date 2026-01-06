// ═══════════════════════════════════════════════════════════════════
// MODAL FORM MODULES — Utils & Types
// ═══════════════════════════════════════════════════════════════════

import React from 'react'

export const formatPhone = (value: string): string => {
    if (!value) return ''
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return `(${numbers}`
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

export const isValidEmail = (email: string | null | undefined): boolean | null => {
    if (!email) return null
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export interface SectionProps { icon: React.ReactNode; iconKey: string; title: string; children: React.ReactNode; footer?: string; delay?: number; expandable?: boolean; defaultExpanded?: boolean }
export interface RowProps { label: string; last?: boolean; children: React.ReactNode }
export interface SmartInputProps { value: string; onChange: (e: { target: { value: string } }) => void; placeholder?: string; type?: string; inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none'; align?: 'left' | 'right'; width?: string; autoFocus?: boolean; formatter?: (val: string) => string; fullWidth?: boolean }
export interface ToggleProps { on: boolean; onChange: (value: boolean) => void; label?: string }
export interface PremiumTextareaProps { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; rows?: number }
