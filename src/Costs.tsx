import { useState, useMemo, useRef, useCallback, ChangeEvent, FormEvent } from 'react'
import AddExpenseModal, { ExpenseFormData } from './components/AddExpenseModal'
import { useCurrency } from './contexts/CurrencyContext'
import { useModal } from './contexts/ModalContext'
import { useToast } from './contexts/ToastContext'
import { useAppStore, useExpenses } from './stores/useAppStore'
import type { Expense } from './types'

// ═══ TYPES ═══
interface FormData {
    description: string
    amount: string
    quantity: number
    category: string
    type: 'Fixo' | 'Variável'
    link: string
    date: string
}

interface GroupedCosts {
    [key: string]: Expense[]
}

export default function Costs() {
    // Global Currency & Tax from Context
    const { formatCurrency, taxRate, taxDisplay, provinceName } = useCurrency()
    const { modal } = useModal()

    // Zustand Store - persistent state
    const costs = useExpenses()
    const { addExpense, updateExpense, removeExpense } = useAppStore()

    const [categories, setCategories] = useState<string[]>(['Maquinário', 'Insumos', 'Operacional', 'Marketing', 'Impostos', 'Outros'])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)

    // Category Edit Mode
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
    const [newCatName, setNewCatName] = useState('')
    const [_isEditingTax, _setIsEditingTax] = useState(false) // Tax edit mode (display only - taxRate comes from context)

    const [dashboardTitle, setDashboardTitle] = useState('Investment Matrix')
    const [isEditingTitle, setIsEditingTitle] = useState(false)

    // Toast from centralized context
    const { toast } = useToast()
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    // Form State
    const [formData, setFormData] = useState<ExpenseFormData>({
        description: '',
        amount: '',
        quantity: 1,
        category: 'Maquinário',
        type: 'Variável',
        link: '',
        date: new Date().toISOString().split('T')[0] ?? ''
    })

    const fileRef = useRef<HTMLInputElement>(null)

    // Note: taxRate is managed by CurrencyContext

    // Computed totals
    const totals = useMemo(() => {
        const subtotal = costs.reduce((acc, curr) => {
            const qty = Number(curr.quantity) || 1
            const val = (Number(curr.amount) || 0) * qty
            acc.total += val
            if (curr.type === 'Fixo') acc.fixed += val
            else acc.variable += val
            return acc
        }, { total: 0, fixed: 0, variable: 0 })

        const tax = subtotal.total * taxRate
        return {
            ...subtotal,
            tax,
            grandTotal: subtotal.total + tax
        }
    }, [costs, taxRate])

    // Group costs by category
    const groupedCosts = useMemo((): GroupedCosts => {
        return categories.reduce((acc: GroupedCosts, cat) => {
            const items = costs.filter((c: Expense) => c.category === cat)
            if (items.length > 0) acc[cat] = items
            return acc
        }, {})
    }, [costs, categories])

    // Actions
    const handleSave = (e?: FormEvent<Element>): void => {
        e?.preventDefault()
        if (!formData.description || !formData.amount) return

        const safeCat = categories.includes(formData.category) ? formData.category : categories[0]
        const payload = {
            ...formData,
            category: safeCat ?? 'Outros',
            amount: Number(formData.amount),
            quantity: Number(formData.quantity) || 1,
            supplier: '',
            recurring: false
        }

        if (editingId) {
            updateExpense(editingId, payload)
            showToast('Despesa atualizada!')
        } else {
            addExpense(payload)
            showToast('Despesa adicionada!')
        }
        closeModal()
    }

    const deleteCost = (id: number): void => {
        modal.confirm({
            title: 'Excluir Despesa',
            message: 'Esta despesa será removida permanentemente.',
            isDangerous: true,
            onConfirm: () => {
                removeExpense(id)
                showToast('Despesa removida.')
            }
        })
    }

    const closeModal = (): void => {
        setIsModalOpen(false)
        setEditingId(null)
        setFormData({
            description: '',
            amount: '',
            quantity: 1,
            category: 'Maquinário',
            type: 'Variável',
            link: '',
            date: new Date().toISOString().split('T')[0] ?? ''
        })
    }

    const openEdit = (cost: Expense): void => {
        setFormData({
            description: cost.description ?? '',
            amount: String(cost.amount ?? ''),
            quantity: cost.quantity ?? 1,
            category: cost.category ?? categories[0] ?? 'Outros',
            type: (cost.type === 'Fixo' || cost.type === 'Variável') ? cost.type : 'Variável',
            link: cost.link ?? '',
            date: cost.date ?? new Date().toISOString().split('T')[0] ?? ''
        })
        setEditingId(cost.id)
        setIsModalOpen(true)
    }

    // Category Manager
    const addCategory = (): void => {
        if (!newCatName) return
        if (!categories.includes(newCatName)) {
            setCategories(prev => [...prev, newCatName])
            showToast('Categoria adicionada.')
        }
        setNewCatName('')
    }

    const removeCategory = (cat: string): void => {
        modal.confirm({
            title: 'Remover Categoria',
            message: `A categoria "${cat}" será removida.`,
            isDangerous: true,
            onConfirm: () => {
                setCategories(prev => prev.filter(c => c !== cat))
                showToast('Categoria removida.')
            }
        })
    }

    // Export/Import Tools
    const exportCSV = (): void => {
        try {
            const header = ['ID', 'Data', 'Descrição', 'Qtd', 'Vlr Unit', 'Total', 'Categoria', 'Tipo', 'Link']
            const rows = costs.map(c => {
                const qty = Number(c.quantity) || 1
                const unitPrice = Number(c.amount) || 0
                const total = qty * unitPrice
                return [
                    c.id,
                    c.date || '-',
                    `"${c.description.replace(/"/g, '""')}"`,
                    qty,
                    unitPrice.toFixed(2).replace('.', ','),
                    total.toFixed(2).replace('.', ','),
                    `"${c.category}"`,
                    c.type,
                    `"${c.link || ''}"`
                ]
            })

            const csvContent = "\uFEFF" + [header.join(";"), ...rows.map(e => e.join(";"))].join("\n")
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `padoca_financeiro_${new Date().toISOString().split('T')[0]}.csv`
            link.click()
            showToast('Relatório Excel exportado!')
        } catch (e) {
            showToast('Erro ao exportar CSV', 'error')
        }
    }

    const exportJSON = (): void => {
        try {
            const data = JSON.stringify({ version: '2', costs, categories, taxRate }, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `padoca_backup_${new Date().toISOString().split('T')[0]}.json`
            a.click()
            showToast('Backup realizado!')
        } catch (e) {
            showToast('Erro ao realizar backup', 'error')
        }
    }

    const importJSON = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = evt => {
            try {
                const parsed = JSON.parse(String(evt.target?.result ?? '{}'))
                if (parsed.costs && Array.isArray(parsed.costs)) {
                    // Import each expense to the store
                    parsed.costs.forEach((cost: Expense) => addExpense(cost))
                    if (parsed.categories) setCategories(parsed.categories)
                    showToast('Dados restaurados!')
                } else {
                    throw new Error('Formato inválido')
                }
            } catch (err) {
                showToast('Arquivo inválido', 'error')
            }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    const clearAllData = (): void => {
        modal.confirm({
            title: 'Apagar Todos os Dados',
            message: 'Isso apagará TODOS os dados financeiros permanentemente.',
            isDangerous: true,
            onConfirm: () => {
                // Remove all expenses from the store
                costs.forEach(cost => removeExpense(cost.id))
                showToast('Dados apagados.')
            }
        })
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            {/* Subtle Background Gradient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Financeiro</h1>
                        <div className="mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Local</span>
                        </div>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Controle de investimentos e fluxo de capital</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    Adicionar Despesa
                </button>
            </div>

            {/* Dashboard Cards */}
            <section className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                {/* Total Investment Card */}
                <div className="md:col-span-2 relative group">
                    <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-[250ms]0"></div>

                        <div className="relative">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <div className="flex items-center gap-2 mb-1 group/title">
                                        {isEditingTitle ? (
                                            <input
                                                className="bg-zinc-100 dark:bg-zinc-900/50 border-none text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest outline-none px-3 py-2 rounded-xl"
                                                value={dashboardTitle}
                                                onChange={(e) => setDashboardTitle(e.target.value)}
                                                onBlur={() => setIsEditingTitle(false)}
                                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                                                autoFocus
                                            />
                                        ) : (
                                            <h3
                                                className="text-[10px] font-bold text-zinc-400 dark:text-indigo-300/60 uppercase tracking-widest cursor-text hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                onClick={() => setIsEditingTitle(true)}
                                            >
                                                {dashboardTitle}
                                            </h3>
                                        )}
                                    </div>
                                    <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide">Status: Ativo</p>
                                </div>
                                <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest ml-1">Total com Impostos</span>
                                <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none flex flex-wrap items-baseline gap-2 md:gap-3">
                                    {formatCurrency(totals.grandTotal)}
                                </div>
                            </div>
                        </div>

                        <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100/80 dark:border-white/5">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Subtotal</span>
                                <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{formatCurrency(totals.total)}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 group/tax">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest"
                                        title={`${provinceName} (${taxDisplay})`}
                                    >
                                        Impostos ({taxDisplay})
                                    </span>
                                </div>
                                <span className="text-2xl md:text-3xl font-semibold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">{formatCurrency(totals.tax)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Costs Card */}
                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-md hover:shadow-lg transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
                            <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">Custo Fixo</h3>
                        </div>
                        <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                            {formatCurrency(totals.fixed)}
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Proporção</span>
                            <span className="text-[8px] font-bold text-indigo-500">{((totals.fixed / totals.total * 100) || 0).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500/80 transition-all duration-[250ms]0" style={{ width: `${(totals.fixed / totals.total * 100) || 0}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Variable Costs Card */}
                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-md hover:shadow-lg transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>
                            <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">Variável</h3>
                        </div>
                        <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                            {formatCurrency(totals.variable)}
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Proporção</span>
                            <span className="text-[8px] font-bold text-orange-500">{((totals.variable / totals.total * 100) || 0).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500/80 transition-all duration-[250ms]0" style={{ width: `${(totals.variable / totals.total * 100) || 0}%` }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ledger Section */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[3rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
                <div className="p-6 md:p-10 pb-4 md:pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
                    <div>
                        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Histórico</h2>
                        <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">Despesas Registradas</h3>
                    </div>
                </div>

                <div className="px-6 md:px-10 pb-6 md:pb-10">
                    {/* Header - Hidden on Mobile */}
                    <div className="hidden md:grid grid-cols-12 gap-8 py-4 border-b border-zinc-100/80 dark:border-white/5 px-4 mb-4">
                        <div className="col-span-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Descrição</div>
                        <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center">Quantidade</div>
                        <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Valor Líquido</div>
                        <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Valor Bruto</div>
                        <div className="col-span-2"></div>
                    </div>

                    <div className="space-y-6">
                        {costs.length === 0 ? (
                            <div className="py-32 text-center flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-white/5 flex items-center justify-center border border-zinc-100/80 dark:border-white/10 opacity-40">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7c0-1.1.9-2 2-2h12a2 2 0 012 2M4 7h16" /></svg>
                                </div>
                                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Nenhuma despesa registrada</p>
                            </div>
                        ) : (
                            Object.entries(groupedCosts).map(([category, items]) => (
                                <div key={category} className="space-y-2">
                                    <div className="flex items-center gap-4 py-2 px-4 mb-2">
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{category}</span>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-500/10 to-transparent"></div>
                                    </div>

                                    <div className="space-y-3 md:space-y-1">
                                        {items.map(cost => (
                                            <div key={cost.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-8 py-5 md:items-center group hover:bg-zinc-50 dark:hover:bg-white/[0.02] px-4 rounded-2xl md:rounded-[1.5rem] transition-all cursor-default border border-zinc-100/80 dark:border-white/5 md:border-transparent">
                                                <div className="md:col-span-4 flex items-start md:items-center gap-4">
                                                    <div className={`mt-1.5 md:mt-0 w-2 h-2 rounded-full shrink-0 ${cost.type === 'Fixo' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                                                    <div className="flex flex-col text-ellipsis overflow-hidden">
                                                        <span className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight leading-tight mb-1 truncate">
                                                            {cost.description}
                                                        </span>
                                                        <div className="flex items-center gap-3 opacity-60">
                                                            <span className="text-[9px] font-bold text-zinc-400 tabular-nums uppercase">{cost.date}</span>
                                                            {cost.link && (
                                                                <a href={cost.link} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-1">
                                                                    Link →
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 flex md:justify-center">
                                                    <span className="inline-flex px-3 py-1 bg-zinc-50 dark:bg-white/5 rounded-full border border-zinc-100/80 dark:border-white/10 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter tabular-nums">
                                                        {cost.quantity} un • {cost.type.slice(0, 1)}
                                                    </span>
                                                </div>

                                                <div className="md:col-span-2 flex flex-row md:flex-col justify-between items-center md:items-end">
                                                    <div className="text-base md:text-lg font-semibold text-zinc-900 dark:text-white tracking-tight tabular-nums">
                                                        {formatCurrency((Number(cost.amount) || 0) * (Number(cost.quantity) || 1))}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {formatCurrency(cost.amount)} / un
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 flex flex-row md:flex-col justify-between items-center md:items-end">
                                                    <div className="text-base md:text-lg font-bold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">
                                                        {formatCurrency(((Number(cost.amount) || 0) * (Number(cost.quantity) || 1)) * (1 + taxRate))}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-indigo-500/50 uppercase tracking-tighter md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Com Imposto
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 flex justify-end gap-2 md:gap-1 md:opacity-0 group-hover:opacity-100 transition-all pt-2 md:pt-0 border-t md:border-0 border-zinc-50 dark:border-white/5">
                                                    <button onClick={() => openEdit(cost)} className="flex-1 md:flex-none py-2.5 md:p-2.5 flex justify-center items-center text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-all">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        <span className="md:hidden ml-2 text-[10px] font-bold uppercase tracking-widest">Editar</span>
                                                    </button>
                                                    <button onClick={() => deleteCost(cost.id)} className="flex-1 md:flex-none py-2.5 md:p-2.5 flex justify-center items-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        <span className="md:hidden ml-2 text-[10px] font-bold uppercase tracking-widest">Excluir</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Tools Section */}
            <section className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group shadow-xl transition-all hover:shadow-2xl">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-50 dark:bg-white/5 rounded-[1rem] md:rounded-[1.25rem] border border-zinc-100/80 dark:border-white/10 flex items-center justify-center transition-all group-hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <div>
                            <h2 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Exportar</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-semibold tracking-tight leading-none">Gerar relatório CSV/Excel</p>
                        </div>
                    </div>
                    <button onClick={exportCSV} className="w-full sm:w-auto px-6 py-4 md:py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest shadow-lg active:scale-90 transition-all">Exportar</button>
                </div>

                <div className="bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Backup & Restaurar</h2>
                        <button onClick={clearAllData} className="text-[9px] font-bold text-red-500/60 hover:text-red-600 uppercase tracking-widest transition-colors">Apagar Tudo</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button onClick={exportJSON} className="py-4 md:py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">Backup JSON</button>
                        <button onClick={() => fileRef.current?.click()} className="py-4 md:py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">Restaurar Backup</button>
                        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
                    </div>
                </div>
            </section>

            {/* AddExpenseModal with Apple HIG */}
            { }
            <AddExpenseModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSave}
                formData={formData}
                setFormData={setFormData}
                categories={categories.map(cat => ({ id: cat, label: cat }))}
                editingId={editingId}
            />
        </div>
    )
}
