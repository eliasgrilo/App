// ═══════════════════════════════════════════════════════════════════
// COSTS MODULE — Type Definitions
// ═══════════════════════════════════════════════════════════════════

import type { Expense } from '../types'

export interface CostFormData {
    description: string
    amount: string
    quantity: number
    category: string
    type: 'Fixo' | 'Variável'
    link: string
    date: string
}

export interface GroupedCosts {
    [key: string]: Expense[]
}

export interface CostTotals {
    total: number
    fixed: number
    variable: number
    tax: number
    grandTotal: number
}

export const DEFAULT_CATEGORIES = ['Maquinário', 'Insumos', 'Operacional', 'Marketing', 'Impostos', 'Outros']

export const DEFAULT_FORM_DATA: CostFormData = {
    description: '',
    amount: '',
    quantity: 1,
    category: 'Maquinário',
    type: 'Variável',
    link: '',
    date: new Date().toISOString().split('T')[0] ?? ''
}
