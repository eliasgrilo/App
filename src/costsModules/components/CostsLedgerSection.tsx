// ═══════════════════════════════════════════════════════════════════
// COSTS MODULE — Costs Ledger Section
// ═══════════════════════════════════════════════════════════════════

import type { Expense } from '../../types'
import type { GroupedCosts } from '../types'
import { CostsFilters } from './CostsFilters'

interface CostsLedgerSectionProps {
    costs: Expense[]
    groupedCosts: GroupedCosts
    formatCurrency: (val: number) => string
    taxRate: number
    onEdit: (cost: Expense) => void
    onDelete: (id: number) => void
    // Filter props
    search: string
    setSearch: (val: string) => void
    period: 'today' | '7d' | '30d' | 'all' | 'custom'
    setPeriod: (val: 'today' | '7d' | '30d' | 'all' | 'custom') => void
    customStartDate: string
    setCustomStartDate: (val: string) => void
    customEndDate: string
    setCustomEndDate: (val: string) => void
    categoryFilter: string
    setCategoryFilter: (val: string) => void
    typeFilter: 'all' | 'Fixo' | 'Variável'
    setTypeFilter: (val: 'all' | 'Fixo' | 'Variável') => void
    categories: string[]
}

export function CostsLedgerSection({
    costs, groupedCosts, formatCurrency, taxRate, onEdit, onDelete,
    search, setSearch, period, setPeriod,
    customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
    categoryFilter, setCategoryFilter, typeFilter, setTypeFilter,
    categories
}: CostsLedgerSectionProps) {
    return (
        <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[3rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
            <div className="p-6 md:p-10 pb-4 md:pb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 mb-6">
                    <div>
                        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Histórico</h2>
                        <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">Despesas Registradas</h3>
                    </div>
                </div>

                {/* Filters */}
                <CostsFilters
                    search={search}
                    setSearch={setSearch}
                    period={period}
                    setPeriod={setPeriod}
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                    onCustomDateChange={(start, end) => {
                        setCustomStartDate(start)
                        setCustomEndDate(end)
                    }}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    categories={categories}
                />
            </div>

            <div className="px-6 md:px-10 pb-6 md:pb-10">
                <div className="hidden md:grid grid-cols-12 gap-8 py-4 border-b border-zinc-100/80 dark:border-white/5 px-4 mb-4">
                    <div className="col-span-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Descrição</div>
                    <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center">Quantidade</div>
                    <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Valor Líquido</div>
                    <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Valor Bruto</div>
                    <div className="col-span-2"></div>
                </div>

                <div className="space-y-6">
                    {costs.length === 0 ? (
                        <EmptyState />
                    ) : (
                        Object.entries(groupedCosts).map(([category, items]) => (
                            <CategoryGroup key={category} category={category} items={items} formatCurrency={formatCurrency} taxRate={taxRate} onEdit={onEdit} onDelete={onDelete} />
                        ))
                    )}
                </div>
            </div>
        </section>
    )
}

function EmptyState() {
    return (
        <div className="py-32 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-white/5 flex items-center justify-center border border-zinc-100/80 dark:border-white/10 opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7c0-1.1.9-2 2-2h12a2 2 0 012 2M4 7h16" /></svg>
            </div>
            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Nenhuma despesa registrada</p>
        </div>
    )
}

interface CategoryGroupProps {
    category: string; items: Expense[]; formatCurrency: (val: number) => string; taxRate: number
    onEdit: (cost: Expense) => void; onDelete: (id: number) => void
}

function CategoryGroup({ category, items, formatCurrency, taxRate, onEdit, onDelete }: CategoryGroupProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-4 py-2 px-4 mb-2">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{category}</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-500/10 to-transparent"></div>
            </div>
            <div className="space-y-3 md:space-y-1">
                {items.map(cost => <CostRow key={cost.id} cost={cost} formatCurrency={formatCurrency} taxRate={taxRate} onEdit={onEdit} onDelete={onDelete} />)}
            </div>
        </div>
    )
}

interface CostRowProps {
    cost: Expense; formatCurrency: (val: number) => string; taxRate: number
    onEdit: (cost: Expense) => void; onDelete: (id: number) => void
}

function CostRow({ cost, formatCurrency, taxRate, onEdit, onDelete }: CostRowProps) {
    const qty = Number(cost.quantity) || 1, amount = Number(cost.amount) || 0
    const netTotal = amount * qty, grossTotal = netTotal * (1 + taxRate)

    return (
        <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-8 py-5 md:items-center group hover:bg-zinc-50 dark:hover:bg-white/[0.02] px-4 rounded-2xl md:rounded-[1.5rem] transition-all cursor-default border border-zinc-100/80 dark:border-white/5 md:border-transparent">
            <div className="md:col-span-4 flex items-start md:items-center gap-4">
                <div className={`mt-1.5 md:mt-0 w-2 h-2 rounded-full shrink-0 ${cost.type === 'Fixo' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                <div className="flex flex-col text-ellipsis overflow-hidden">
                    <span className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight leading-tight mb-1 truncate">{cost.description}</span>
                    <div className="flex items-center gap-3 opacity-60">
                        <span className="text-[9px] font-bold text-zinc-400 tabular-nums uppercase">{cost.date}</span>
                        {cost.link && <a href={cost.link} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Link →</a>}
                    </div>
                </div>
            </div>
            <div className="md:col-span-2 flex md:justify-center">
                <span className="inline-flex px-3 py-1 bg-zinc-50 dark:bg-white/5 rounded-full border border-zinc-100/80 dark:border-white/10 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter tabular-nums">{qty} un • {cost.type.slice(0, 1)}</span>
            </div>
            <div className="md:col-span-2 flex flex-row md:flex-col justify-between items-center md:items-end">
                <div className="text-base md:text-lg font-semibold text-zinc-900 dark:text-white tracking-tight tabular-nums">{formatCurrency(netTotal)}</div>
                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter md:opacity-0 group-hover:opacity-100 transition-opacity">{formatCurrency(amount)} / un</div>
            </div>
            <div className="md:col-span-2 flex flex-row md:flex-col justify-between items-center md:items-end">
                <div className="text-base md:text-lg font-bold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">{formatCurrency(grossTotal)}</div>
                <div className="text-[9px] font-bold text-indigo-500/50 uppercase tracking-tighter md:opacity-0 group-hover:opacity-100 transition-opacity">Com Imposto</div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 md:gap-1 md:opacity-0 group-hover:opacity-100 transition-all pt-2 md:pt-0 border-t md:border-0 border-zinc-50 dark:border-white/5">
                <button onClick={() => onEdit(cost)} className="flex-1 md:flex-none py-2.5 md:p-2.5 flex justify-center items-center text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    <span className="md:hidden ml-2 text-[10px] font-bold uppercase tracking-widest">Editar</span>
                </button>
                <button onClick={() => onDelete(cost.id)} className="flex-1 md:flex-none py-2.5 md:p-2.5 flex justify-center items-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    <span className="md:hidden ml-2 text-[10px] font-bold uppercase tracking-widest">Excluir</span>
                </button>
            </div>
        </div>
    )
}
