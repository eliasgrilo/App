// ═══════════════════════════════════════════════════════════════════
// COSTS MODULE — useCostsState Hook
// State management for Costs component
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react'
import { useAppStore, useExpenses } from '../../stores/useAppStore'
import { useCurrency } from '../../stores/useCurrencyStore'
import { useToast } from '../../stores/useUIStore'
import type { Expense } from '../../types'
import { ExpenseFormData } from '../../components/AddExpenseModal'
import { DEFAULT_CATEGORIES, DEFAULT_FORM_DATA, type CostTotals, type GroupedCosts } from '../types'

export interface CostsStateReturn {
    // Data from Zustand
    costs: Expense[]
    addExpense: (expense: Omit<Expense, 'id'>) => void
    updateExpense: (id: number, updates: Partial<Expense>) => void
    removeExpense: (id: number) => void
    // Currency
    formatCurrency: (val: number) => string
    taxRate: number
    taxDisplay: string
    provinceName: string
    // UI State
    categories: string[]
    setCategories: React.Dispatch<React.SetStateAction<string[]>>
    isModalOpen: boolean
    setIsModalOpen: (open: boolean) => void
    editingId: number | null
    setEditingId: (id: number | null) => void
    formData: ExpenseFormData
    setFormData: React.Dispatch<React.SetStateAction<ExpenseFormData>>
    dashboardTitle: string
    setDashboardTitle: (title: string) => void
    isEditingTitle: boolean
    setIsEditingTitle: (editing: boolean) => void
    // Computed
    totals: CostTotals
    groupedCosts: GroupedCosts
    // Toast
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function useCostsState(): CostsStateReturn {
    // Currency from Context
    const { formatCurrency, taxRate, taxDisplay, provinceName } = useCurrency()

    // Zustand Store
    const costs = useExpenses()
    const { addExpense, updateExpense, removeExpense } = useAppStore()

    // UI State
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formData, setFormData] = useState<ExpenseFormData>(DEFAULT_FORM_DATA)
    const [dashboardTitle, setDashboardTitle] = useState('Investment Matrix')
    const [isEditingTitle, setIsEditingTitle] = useState(false)

    // Toast
    const { toast } = useToast()
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    // Computed totals
    const totals = useMemo((): CostTotals => {
        const subtotal = costs.reduce((acc, curr) => {
            const qty = Number(curr.quantity) || 1
            const val = (Number(curr.amount) || 0) * qty
            acc.total += val
            if (curr.type === 'Fixo') acc.fixed += val
            else acc.variable += val
            return acc
        }, { total: 0, fixed: 0, variable: 0 })

        const tax = subtotal.total * taxRate
        return { ...subtotal, tax, grandTotal: subtotal.total + tax }
    }, [costs, taxRate])

    // Group costs by category
    const groupedCosts = useMemo((): GroupedCosts => {
        return categories.reduce((acc: GroupedCosts, cat) => {
            const items = costs.filter((c: Expense) => c.category === cat)
            if (items.length > 0) acc[cat] = items
            return acc
        }, {})
    }, [costs, categories])

    return {
        costs, addExpense, updateExpense, removeExpense,
        formatCurrency, taxRate, taxDisplay, provinceName,
        categories, setCategories,
        isModalOpen, setIsModalOpen,
        editingId, setEditingId,
        formData, setFormData,
        dashboardTitle, setDashboardTitle,
        isEditingTitle, setIsEditingTitle,
        totals, groupedCosts,
        showToast
    }
}
