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

// Default tax values for Brazil
const DEFAULT_TAX_RATE = 0
const DEFAULT_TAX_DISPLAY = '0%'
const DEFAULT_PROVINCE_NAME = 'Brasil'

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
    // Filter State
    search: string
    setSearch: (search: string) => void
    period: 'today' | '7d' | '30d' | 'all' | 'custom'
    setPeriod: (period: 'today' | '7d' | '30d' | 'all' | 'custom') => void
    customStartDate: string
    setCustomStartDate: (date: string) => void
    customEndDate: string
    setCustomEndDate: (date: string) => void
    categoryFilter: string
    setCategoryFilter: (category: string) => void
    typeFilter: 'all' | 'Fixo' | 'Variável'
    setTypeFilter: (type: 'all' | 'Fixo' | 'Variável') => void
    // Computed
    totals: CostTotals
    groupedCosts: GroupedCosts
    filteredCosts: Expense[]
    // Toast
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function useCostsState(): CostsStateReturn {
    // Currency from Store (simplified - no longer has tax properties)
    const { formatCurrency } = useCurrency()

    // Use default values for removed tax properties
    const taxRate = DEFAULT_TAX_RATE
    const taxDisplay = DEFAULT_TAX_DISPLAY
    const provinceName = DEFAULT_PROVINCE_NAME

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

    // Filter State
    const [search, setSearch] = useState('')
    const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all' | 'custom'>('all')
    const [customStartDate, setCustomStartDate] = useState('')
    const [customEndDate, setCustomEndDate] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState<'all' | 'Fixo' | 'Variável'>('all')

    // Toast
    const { toast } = useToast()
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    // Filtered costs
    const filteredCosts = useMemo(() => {
        let result = costs
        const now = new Date()

        // Search filter
        if (search.trim()) {
            const query = search.toLowerCase()
            result = result.filter(c =>
                c.description.toLowerCase().includes(query) ||
                c.category.toLowerCase().includes(query) ||
                c.type.toLowerCase().includes(query) ||
                c.date.includes(query)
            )
        }

        // Period filter with custom support
        if (period === 'custom' && customStartDate && customEndDate) {
            const start = new Date(customStartDate)
            const end = new Date(customEndDate)
            end.setHours(23, 59, 59, 999)
            result = result.filter(c => {
                const date = new Date(c.date)
                return date >= start && date <= end
            })
        } else if (period !== 'all') {
            result = result.filter(c => {
                const diff = (now.getTime() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24)
                if (period === 'today') return diff <= 1
                if (period === '7d') return diff <= 7
                if (period === '30d') return diff <= 30
                return true
            })
        }

        // Category filter
        if (categoryFilter !== 'all') {
            result = result.filter(c => c.category === categoryFilter)
        }

        // Type filter
        if (typeFilter !== 'all') {
            result = result.filter(c => c.type === typeFilter)
        }

        return result
    }, [costs, search, period, customStartDate, customEndDate, categoryFilter, typeFilter])

    // Computed totals
    const totals = useMemo((): CostTotals => {
        const subtotal = filteredCosts.reduce((acc, curr) => {
            const qty = Number(curr.quantity) || 1
            const val = (Number(curr.amount) || 0) * qty
            acc.total += val
            if (curr.type === 'Fixo') acc.fixed += val
            else acc.variable += val
            return acc
        }, { total: 0, fixed: 0, variable: 0 })

        const tax = subtotal.total * taxRate
        return { ...subtotal, tax, grandTotal: subtotal.total + tax }
    }, [filteredCosts, taxRate])

    // Group costs by category
    const groupedCosts = useMemo((): GroupedCosts => {
        return categories.reduce((acc: GroupedCosts, cat) => {
            const items = filteredCosts.filter((c: Expense) => c.category === cat)
            if (items.length > 0) acc[cat] = items
            return acc
        }, {})
    }, [filteredCosts, categories])

    return {
        costs, addExpense, updateExpense, removeExpense,
        formatCurrency, taxRate, taxDisplay, provinceName,
        categories, setCategories,
        isModalOpen, setIsModalOpen,
        editingId, setEditingId,
        formData, setFormData,
        dashboardTitle, setDashboardTitle,
        isEditingTitle, setIsEditingTitle,
        search, setSearch,
        period, setPeriod,
        customStartDate, setCustomStartDate,
        customEndDate, setCustomEndDate,
        categoryFilter, setCategoryFilter,
        typeFilter, setTypeFilter,
        totals, groupedCosts, filteredCosts,
        showToast
    }
}

