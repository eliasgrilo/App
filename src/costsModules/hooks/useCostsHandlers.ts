// ═══════════════════════════════════════════════════════════════════
// COSTS MODULE — useCostsHandlers Hook
// Action handlers for Costs component
// ═══════════════════════════════════════════════════════════════════

import { useCallback, ChangeEvent, RefObject, FormEvent } from 'react'
import { useModal } from '../../stores/useUIStore'
import type { Expense } from '../../types'
import type { ExpenseFormData } from '../../components/AddExpenseModal'
import { DEFAULT_FORM_DATA } from '../types'

export interface UseCostsHandlersProps {
    costs: Expense[]
    categories: string[]
    setCategories: React.Dispatch<React.SetStateAction<string[]>>
    formData: ExpenseFormData
    setFormData: React.Dispatch<React.SetStateAction<ExpenseFormData>>
    editingId: number | null
    setEditingId: (id: number | null) => void
    setIsModalOpen: (open: boolean) => void
    addExpense: (expense: Omit<Expense, 'id'>) => void
    updateExpense: (id: number, updates: Partial<Expense>) => void
    removeExpense: (id: number) => void
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
    taxRate: number
    fileRef: RefObject<HTMLInputElement>
}

export interface CostsHandlersReturn {
    handleSave: (e?: FormEvent<Element>) => void
    deleteCost: (id: number) => void
    closeModal: () => void
    openEdit: (cost: Expense) => void
    addCategory: (name: string) => void
    removeCategory: (cat: string) => void
    exportCSV: () => void
    exportJSON: () => void
    importJSON: (e: ChangeEvent<HTMLInputElement>) => void
    clearAllData: () => void
}

export function useCostsHandlers({
    costs, categories, setCategories, formData, setFormData,
    editingId, setEditingId, setIsModalOpen,
    addExpense, updateExpense, removeExpense,
    showToast, taxRate, fileRef
}: UseCostsHandlersProps): CostsHandlersReturn {
    const { modal } = useModal()

    const closeModal = useCallback(() => {
        setIsModalOpen(false)
        setEditingId(null)
        setFormData(DEFAULT_FORM_DATA)
    }, [setIsModalOpen, setEditingId, setFormData])

    const handleSave = useCallback((e?: FormEvent<Element>): void => {
        e?.preventDefault()
        if (!formData.description || !formData.amount) return

        const safeCat = categories.includes(formData.category) ? formData.category : categories[0]
        const payload = {
            ...formData, category: safeCat ?? 'Outros',
            amount: Number(formData.amount), quantity: Number(formData.quantity) || 1,
            supplier: '', recurring: false
        }

        if (editingId) {
            updateExpense(editingId, payload)
            showToast('Despesa atualizada!')
        } else {
            addExpense(payload)
            showToast('Despesa adicionada!')
        }
        closeModal()
    }, [formData, categories, editingId, updateExpense, addExpense, showToast, closeModal])

    const deleteCost = useCallback((id: number): void => {
        modal.confirm({
            title: 'Excluir Despesa', message: 'Esta despesa será removida permanentemente.', isDangerous: true,
            onConfirm: () => { removeExpense(id); showToast('Despesa removida.') }
        })
    }, [modal, removeExpense, showToast])

    const openEdit = useCallback((cost: Expense): void => {
        setFormData({
            description: cost.description ?? '', amount: String(cost.amount ?? ''), quantity: cost.quantity ?? 1,
            category: cost.category ?? categories[0] ?? 'Outros',
            type: (cost.type === 'Fixo' || cost.type === 'Variável') ? cost.type : 'Variável',
            link: cost.link ?? '', date: cost.date ?? new Date().toISOString().split('T')[0] ?? ''
        })
        setEditingId(cost.id)
        setIsModalOpen(true)
    }, [setFormData, setEditingId, setIsModalOpen, categories])

    const addCategory = useCallback((name: string): void => {
        if (!name || categories.includes(name)) return
        setCategories(prev => [...prev, name])
        showToast('Categoria adicionada.')
    }, [categories, setCategories, showToast])

    const removeCategory = useCallback((cat: string): void => {
        modal.confirm({
            title: 'Remover Categoria', message: `A categoria "${cat}" será removida.`, isDangerous: true,
            onConfirm: () => { setCategories(prev => prev.filter(c => c !== cat)); showToast('Categoria removida.') }
        })
    }, [modal, setCategories, showToast])

    const exportCSV = useCallback((): void => {
        try {
            const header = ['ID', 'Data', 'Descrição', 'Qtd', 'Vlr Unit', 'Total', 'Categoria', 'Tipo', 'Link']
            const rows = costs.map(c => {
                const qty = Number(c.quantity) || 1, unitPrice = Number(c.amount) || 0, total = qty * unitPrice
                return [c.id, c.date || '-', `"${c.description.replace(/"/g, '""')}"`, qty, unitPrice.toFixed(2).replace('.', ','), total.toFixed(2).replace('.', ','), `"${c.category}"`, c.type, `"${c.link || ''}"`]
            })
            const csvContent = "\uFEFF" + [header.join(";"), ...rows.map(e => e.join(";"))].join("\n")
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob), link = document.createElement("a")
            link.href = url; link.download = `padoca_financeiro_${new Date().toISOString().split('T')[0]}.csv`; link.click()
            showToast('Relatório Excel exportado!')
        } catch { showToast('Erro ao exportar CSV', 'error') }
    }, [costs, showToast])

    const exportJSON = useCallback((): void => {
        try {
            const data = JSON.stringify({ version: '2', costs, categories, taxRate }, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob), a = document.createElement('a')
            a.href = url; a.download = `padoca_backup_${new Date().toISOString().split('T')[0]}.json`; a.click()
            showToast('Backup realizado!')
        } catch { showToast('Erro ao realizar backup', 'error') }
    }, [costs, categories, taxRate, showToast])

    const importJSON = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = evt => {
            try {
                const parsed = JSON.parse(String(evt.target?.result ?? '{}'))
                if (parsed.costs && Array.isArray(parsed.costs)) {
                    parsed.costs.forEach((cost: Expense) => addExpense(cost))
                    if (parsed.categories) setCategories(parsed.categories)
                    showToast('Dados restaurados!')
                } else throw new Error('Formato inválido')
            } catch { showToast('Arquivo inválido', 'error') }
        }
        reader.readAsText(file)
        e.target.value = ''
    }, [addExpense, setCategories, showToast])

    const clearAllData = useCallback((): void => {
        modal.confirm({
            title: 'Apagar Todos os Dados', message: 'Isso apagará TODOS os dados financeiros permanentemente.', isDangerous: true,
            onConfirm: () => { costs.forEach(cost => removeExpense(cost.id)); showToast('Dados apagados.') }
        })
    }, [modal, costs, removeExpense, showToast])

    return { handleSave, deleteCost, closeModal, openEdit, addCategory, removeCategory, exportCSV, exportJSON, importJSON, clearAllData }
}
