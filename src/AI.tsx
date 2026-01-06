import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from './contexts/ToastContext'
import ModalScrollLock from './components/ModalScrollLock'
import { useAppStore, useIngredients, useSuppliers as useStoreSuppliers } from './stores/useAppStore'
import type { Ingredient, Supplier } from './types'

// ═══ TYPE DEFINITIONS ═══
interface AlertItem extends Ingredient {
    status: 'critical' | 'warning' | 'ok'
    totalQty: number
}

interface SupplierGroup {
    supplier: Supplier | undefined
    items: AlertItem[]
}

interface SupplierGroupWithSupplier {
    supplier: Supplier
    items: AlertItem[]
}

interface EmailDraft {
    to: string
    subject: string
    body: string
}

interface SentEmail {
    id: string
    to: string
    subject: string
    body: string
    supplierName?: string
    sentAt: string
    status: string
}

interface QuotationItemData {
    name: string
    current: number
    max: number
    requested: number
}

interface Quotation {
    id: string
    supplier: string
    supplierInitial: string
    itemCount: number
    timestamp: string
    items: QuotationItemData[]
}

type QuotationTabKey = 'pendente' | 'aguardando' | 'ordens' | 'recebido' | 'historico'


/**
 * AI Intelligence - Premium Automation Dashboard
 * Design pattern matching: Inventory.jsx, Costs.jsx, FichaTecnica.jsx
 */

export default function AI() {
    // Zustand Store - persistent state (direct access)
    const inventory = useIngredients()
    const suppliers = useStoreSuppliers()

    const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced')
    const [isCloudSynced, setIsCloudSynced] = useState(true)

    // Email Composer State
    const [isComposerOpen, setIsComposerOpen] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const [emailDraft, setEmailDraft] = useState<EmailDraft>({ to: '', subject: '', body: '' })
    // Email history - local state (could be added to store later)
    const [sentEmails, setSentEmails] = useState<SentEmail[]>([])

    // Toast from centralized context
    const { toast } = useToast()
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    // Quotation Management State
    const [quotationTab, setQuotationTab] = useState<QuotationTabKey>('aguardando')


    // Mock Quotation Data for Static Prototype
    const mockQuotations = useMemo(() => ({
        pendente: [],
        aguardando: [
            {
                id: 'q1',
                supplier: 'João Silva',
                supplierInitial: 'J',
                itemCount: 3,
                timestamp: '2 dias atrás',
                items: [
                    { name: 'Farinha Tipo 00', current: 45, max: 100, requested: 55 },
                    { name: 'Fermento Biológico', current: 2, max: 10, requested: 8 },
                    { name: 'Sal Marinho', current: 3, max: 5, requested: 2 }
                ]
            },
            {
                id: 'q2',
                supplier: 'Maria Santos',
                supplierInitial: 'M',
                itemCount: 2,
                timestamp: '3 dias atrás',
                items: [
                    { name: 'Mussarela di Bufala', current: 2, max: 8, requested: 6 },
                    { name: 'Gorgonzola', current: 1, max: 3, requested: 2 }
                ]
            }
        ],
        ordens: [
            {
                id: 'q3',
                supplier: 'Pedro Oliveira',
                supplierInitial: 'P',
                itemCount: 4,
                timestamp: '1 dia atrás',
                items: [
                    { name: 'Azeite Extra Virgem', current: 5, max: 15, requested: 10 }
                ]
            }
        ],
        recebido: [
            {
                id: 'q4',
                supplier: 'Ana Costa',
                supplierInitial: 'A',
                itemCount: 2,
                timestamp: '5 dias atrás',
                items: [
                    { name: 'Molho San Marzano', current: 8, max: 30, requested: 22 }
                ]
            }
        ],
        historico: [
            {
                id: 'q5',
                supplier: 'Carlos Mendes',
                supplierInitial: 'C',
                itemCount: 5,
                timestamp: '1 semana atrás',
                items: []
            }
        ]
    }), [])

    const quotationTabs: { key: QuotationTabKey, label: string, count: number }[] = [
        { key: 'pendente', label: 'Pendente', count: mockQuotations.pendente.length },
        { key: 'aguardando', label: 'Aguardando', count: mockQuotations.aguardando.length },
        { key: 'ordens', label: 'Ordens', count: mockQuotations.ordens.length },
        { key: 'recebido', label: 'Recebido', count: mockQuotations.recebido.length },
        { key: 'historico', label: 'Histórico', count: mockQuotations.historico.length }
    ]

    // ═══════════════════════════════════════════════════════════════
    // DATA LOADING - Uses Zustand store (persistent)
    // ═══════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════
    // INTELLIGENCE ENGINE
    // ═══════════════════════════════════════════════════════════════
    const getTotalQuantity = (item: Ingredient): number => {
        return (Number(item.packageQuantity) || 0) * (Number(item.packageCount) || 1)
    }

    const getStockStatus = (item: Ingredient): 'critical' | 'warning' | 'ok' => {
        const total = getTotalQuantity(item)
        const min = Number(item.minStock) || 0
        if (min === 0) return 'ok'
        if (total < min) return 'critical'
        if (total <= min * 1.2) return 'warning'
        return 'ok'
    }

    // Get items with stock issues grouped by supplier
    const alertsBySupplier: SupplierGroupWithSupplier[] = useMemo(() => {
        const alerts: AlertItem[] = inventory
            .filter(item => {
                const status = getStockStatus(item)
                return status === 'critical' || status === 'warning'
            })
            .map(item => ({
                ...item,
                status: getStockStatus(item),
                totalQty: getTotalQuantity(item)
            }))

        // Group by supplier
        const grouped: Record<string | number, SupplierGroup> = {}
        alerts.forEach(item => {
            const supplier = suppliers.find(s => (s.linkedItems as unknown as Array<{ itemId: number }> | undefined)?.some(li => li.itemId === item.id))
            const key = supplier?.id ?? 'unlinked'
            if (!grouped[key]) {
                grouped[key] = { supplier, items: [] }
            }
            grouped[key].items.push(item)
        })

        return Object.values(grouped).filter((g): g is SupplierGroupWithSupplier => g.supplier !== undefined)
    }, [inventory, suppliers])

    // Stats for dashboard
    const stats = useMemo(() => {
        const total = inventory.length
        const critical = inventory.filter(i => getStockStatus(i) === 'critical').length
        const warning = inventory.filter(i => getStockStatus(i) === 'warning').length
        const suppliersWithAlerts = alertsBySupplier.length
        const healthScore = total > 0 ? Math.max(0, Math.round(100 - (critical * 20) - (warning * 5))) : 100
        return { total, critical, warning, suppliersWithAlerts, healthScore }
    }, [inventory, alertsBySupplier])

    // ═══════════════════════════════════════════════════════════════
    // EMAIL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    const generateEmail = useCallback((supplier: Supplier, items: AlertItem[]): EmailDraft => {
        const today = new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })

        const itemsList = items
            .map((item: AlertItem) => `• ${item.name}: ${item.totalQty.toFixed(1)}${item.unit || 'g'} (mínimo: ${item.minStock || 0}${item.unit || 'g'})`)
            .join('\n')

        return {
            to: supplier.email || '',
            subject: `Solicitação de Cotação - Padoca Pizza - ${new Date().toLocaleDateString('pt-BR')}`,
            body: `Olá ${supplier.name},

Espero que esteja bem!

Estamos precisando repor alguns itens do nosso estoque e gostaríamos de solicitar uma cotação:

${itemsList}

Poderia nos enviar os preços atualizados e prazo de entrega?

Obrigado!
Equipe Padoca Pizza

────────────────
${today}`
        }
    }, [])

    const openEmailComposer = (supplier: Supplier, items: AlertItem[]): void => {
        const email = generateEmail(supplier, items)
        setSelectedSupplier(supplier)
        setEmailDraft(email)
        setIsComposerOpen(true)
    }

    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [lastSentEmail, setLastSentEmail] = useState<SentEmail | null>(null)

    const handleSendEmail = async () => {
        if (!emailDraft.to) {
            showToast('Email do fornecedor não cadastrado', 'error')
            return
        }

        // Start sending animation
        setIsSendingEmail(true)

        // Simulate sending delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Save to history
        const newEmail = {
            id: Date.now().toString(),
            ...emailDraft,
            supplierName: selectedSupplier?.name,
            sentAt: new Date().toISOString(),
            status: 'sent'
        }

        const updated = [newEmail, ...sentEmails]
        setSentEmails(updated)
        // Note: Email history not persisted (local state only)

        setIsSendingEmail(false)
        setIsComposerOpen(false)

        // Show success modal
        setLastSentEmail(newEmail)
        setShowSuccessModal(true)

        setSelectedSupplier(null)
        setEmailDraft({ to: '', subject: '', body: '' })
    }

    const copyEmailToClipboard = () => {
        const fullText = `Para: ${emailDraft.to}\nAssunto: ${emailDraft.subject}\n\n${emailDraft.body}`
        navigator.clipboard.writeText(fullText)
        showToast('Email copiado para área de transferência!')
    }

    // Format currency
    const formatCurrency = (val: number): string => {
        const n = Number(val) || 0
        return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .replace(/^/, '$ ')
    }

    const scoreColor = stats.healthScore >= 80 ? 'emerald' : stats.healthScore >= 60 ? 'amber' : 'rose'

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            {/* Ultra-Subtle Background - EXACT match from Inventory/Costs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header: Identity & Actions - EXACT match from Inventory/Costs/FichaTecnica */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Inteligência</h1>
                        {/* Sync Status Badge - EXACT match */}
                        <div className={`mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 ${syncStatus === 'syncing'
                            ? 'bg-amber-500/5 border-amber-500/10 text-amber-500 animate-pulse'
                            : syncStatus === 'error'
                                ? 'bg-red-500/5 border-red-500/10 text-red-500'
                                : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80'
                            }`}>
                            <div className={`w-1 h-1 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500' : syncStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                                }`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                {syncStatus === 'syncing' ? 'Cloud Syncing' : syncStatus === 'error' ? 'Sync Error' : 'Cloud Active'}
                            </span>
                        </div>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Automação e insights em tempo real</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Gmail Connect Button - EXACT match from production */}
                    <button
                        onClick={() => showToast('Gmail conectado com sucesso!', 'success')}
                        className="flex items-center gap-2.5 px-3.5 py-2 bg-amber-50/80 dark:bg-amber-900/15 rounded-xl border border-amber-200/40 dark:border-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-900/25 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-2">
                            {/* Status dot */}
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            {/* Heroicons envelope icon - exact SVG from production */}
                            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z" />
                            </svg>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">Conectar Gmail</span>
                            <span className="text-[9px] text-amber-500/60">Para detectar respostas</span>
                        </div>
                    </button>

                    <button
                        onClick={() => alertsBySupplier.length > 0 && alertsBySupplier[0]?.supplier && openEmailComposer(alertsBySupplier[0].supplier, alertsBySupplier[0]?.items ?? [])}
                        disabled={alertsBySupplier.length === 0}
                        className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Notificar Fornecedores
                    </button>
                </div>
            </div>

            {/* Dashboard: Precise & Light - EXACT match from Inventory/Costs */}
            <section className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                {/* Health Score Card - Apple Pro Aesthetic */}
                <div className="md:col-span-2 relative group">
                    <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                        {/* Subtle Apple-style Mesh Gradient */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-[250ms]0"></div>

                        <div className="relative">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h3 className="text-[10px] font-bold text-zinc-400 dark:text-emerald-300/60 uppercase tracking-widest cursor-text hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                        Intelligence Matrix
                                    </h3>
                                    <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide mt-1">Protocol Status: Active Monitoring</p>
                                </div>
                                <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                                    <div className={`w-1.5 h-1.5 rounded-full ${scoreColor === 'emerald' ? 'bg-emerald-500' : scoreColor === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                    <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live Analysis</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest ml-1">Health Score</span>
                                <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none flex flex-wrap items-baseline gap-2 md:gap-3">
                                    <span className={scoreColor === 'emerald' ? 'text-emerald-500' : scoreColor === 'amber' ? 'text-amber-500' : 'text-rose-500'}>{stats.healthScore}</span>
                                    <span className="text-2xl md:text-4xl text-zinc-300 dark:text-zinc-600">/ 100</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100/80 dark:border-white/5">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Itens Monitorados</span>
                                <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{stats.total}</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest">Alertas Ativos</span>
                                <span className="text-2xl md:text-3xl font-semibold text-rose-600 dark:text-rose-400 tracking-tight tabular-nums">{stats.critical + stats.warning}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Cards */}
                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-md hover:shadow-lg transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                            <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">Crítico</h3>
                        </div>
                        <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                            {stats.critical}
                        </div>
                        <div className="text-[9px] font-medium text-zinc-400 tabular-nums">
                            itens abaixo do mínimo
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Urgência</span>
                            <span className="text-[8px] font-bold text-rose-500">Alta</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500/80 transition-all duration-[250ms]0" style={{ width: stats.total > 0 ? `${(stats.critical / stats.total * 100)}%` : '0%' }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-md hover:shadow-lg transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                            <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">Atenção</h3>
                        </div>
                        <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                            {stats.warning}
                        </div>
                        <div className="text-[9px] font-medium text-zinc-400 tabular-nums">
                            itens próximos do limite
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Monitorar</span>
                            <span className="text-[8px] font-bold text-amber-500">Média</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500/80 transition-all duration-[250ms]0" style={{ width: stats.total > 0 ? `${(stats.warning / stats.total * 100)}%` : '0%' }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Supplier Alerts Ledger - EXACT match from Costs.jsx ledger pattern */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[3rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
                <div className="p-6 md:p-10 pb-4 md:pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
                    <div>
                        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Automation Protocol</h2>
                        <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">Cotações Pendentes</h3>
                    </div>
                    {alertsBySupplier.length > 0 && (
                        <div className="px-4 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-full border border-rose-200 dark:border-rose-500/20">
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                                {alertsBySupplier.length} fornecedor{alertsBySupplier.length > 1 ? 'es' : ''}
                            </span>
                        </div>
                    )}
                </div>

                <div className="px-6 md:px-10 pb-6 md:pb-10">
                    {alertsBySupplier.length === 0 ? (
                        <div className="py-32 text-center flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/5 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">Estoque OK — Nenhuma cotação pendente</p>
                        </div>
                    ) : (
                        <div className="space-y-3 md:space-y-1">
                            {alertsBySupplier.map(({ supplier, items }) => (
                                <div key={supplier.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-8 py-5 md:items-center group hover:bg-zinc-50 dark:hover:bg-white/[0.02] px-4 rounded-2xl md:rounded-[1.5rem] transition-all cursor-pointer border border-zinc-100/80 dark:border-white/5 md:border-transparent"
                                    onClick={() => openEmailComposer(supplier, items)}
                                >
                                    <div className="md:col-span-5 flex items-start md:items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/25 shrink-0">
                                            {supplier.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div className="flex flex-col text-ellipsis overflow-hidden">
                                            <span className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight leading-tight mb-1 truncate">
                                                {supplier.name}
                                            </span>
                                            <div className="flex items-center gap-3 opacity-60">
                                                <span className="text-[9px] font-bold text-zinc-400 tabular-nums">{supplier.email || 'Sem email'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-4 flex flex-wrap gap-2">
                                        {items.slice(0, 3).map(item => (
                                            <span key={item.id} className={`inline-flex px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-tighter ${item.status === 'critical'
                                                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                                                : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                                                }`}>
                                                {item.name}
                                            </span>
                                        ))}
                                        {items.length > 3 && (
                                            <span className="inline-flex px-3 py-1 bg-zinc-50 dark:bg-white/5 rounded-full border border-zinc-100/80 dark:border-white/10 text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                                +{items.length - 3} mais
                                            </span>
                                        )}
                                    </div>

                                    <div className="md:col-span-3 flex justify-end">
                                        <button className="w-full md:w-auto px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Solicitar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Email History - Matching Costs.jsx utility section */}
            {sentEmails.length > 0 && (
                <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Histórico de Cotações</h2>
                        <span className="text-[9px] font-medium text-zinc-300">{sentEmails.length} enviado{sentEmails.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-2">
                        {sentEmails.slice(0, 5).map((email, i) => (
                            <div key={email.id} className={`flex items-center gap-4 py-3 px-4 rounded-xl ${i !== Math.min(sentEmails.length, 5) - 1 ? 'border-b border-zinc-100/80 dark:border-white/5' : ''}`}>
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{email.supplierName || email.to}</p>
                                    <p className="text-[10px] text-zinc-400 truncate">{email.subject}</p>
                                </div>
                                <span className="text-[10px] font-medium text-zinc-300 shrink-0">
                                    {new Date(email.sentAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* GESTÃO DE COTAÇÕES - Quotation Management Section */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gestão de Cotações</h2>
                </div>

                {/* Tabbed Navigation */}
                <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl mb-6 overflow-x-auto">
                    {quotationTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setQuotationTab(tab.key)}
                            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${quotationTab === tab.key
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${quotationTab === tab.key
                                    ? 'bg-zinc-100 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-200'
                                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Quotation Cards */}
                <div className="space-y-4">
                    {mockQuotations[quotationTab]?.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Nenhuma cotação nesta categoria</p>
                        </div>
                    ) : (
                        mockQuotations[quotationTab]?.map((quotation: Quotation) => (
                            <div key={quotation.id} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-zinc-100/80 dark:border-zinc-800">
                                {/* Card Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {/* Supplier Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                                            {quotation.supplierInitial}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{quotation.supplier}</p>
                                            <p className="text-[10px] text-zinc-400">{quotation.itemCount} itens • {quotation.timestamp}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => showToast('Cotação registrada!', 'success')}
                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                                        >
                                            Registrar Cotação
                                        </button>
                                        <button
                                            onClick={() => showToast('Email reenviado!', 'success')}
                                            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                                        >
                                            Reenviar
                                        </button>
                                    </div>
                                </div>

                                {/* Items Table */}
                                {quotation.items.length > 0 && (
                                    <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100/80 dark:border-zinc-700/50 overflow-hidden">
                                        <div className="grid grid-cols-4 gap-4 px-4 py-2 border-b border-zinc-100/80 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/30">
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Item</span>
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-center">Estoque Atual</span>
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-center">Máximo</span>
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-right">Qtd. Solicitada</span>
                                        </div>
                                        {quotation.items.map((item: QuotationItemData, idx: number) => (
                                            <div key={idx} className={`grid grid-cols-4 gap-4 px-4 py-3 ${idx !== quotation.items.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-700/30' : ''}`}>
                                                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{item.name}</span>
                                                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center tabular-nums">{item.current}</span>
                                                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center tabular-nums">{item.max}</span>
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">+{item.requested}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Email Composer Modal - Matching exactly Costs.jsx modal pattern */}
            <AnimatePresence>
                {isComposerOpen && createPortal(
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-start md:items-center justify-center p-4 pt-20 md:pt-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsComposerOpen(false)}
                        />

                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative bg-zinc-100 dark:bg-zinc-900 w-full max-w-lg rounded-2xl md:rounded-[2rem] shadow-2xl border border-zinc-200/50 dark:border-white/5 flex flex-col overflow-hidden max-h-[85vh]"
                        >
                            <ModalScrollLock />

                            {/* Drag Handle - Mobile */}
                            <div className="md:hidden w-full flex justify-center pt-4 pb-1 shrink-0">
                                <div className="w-8 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800"></div>
                            </div>

                            {/* Header */}
                            <div className="px-6 py-4 flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Compor Email</h3>
                                    <p className="text-xs text-zinc-500">{selectedSupplier?.name}</p>
                                </div>
                                <button
                                    onClick={() => setIsComposerOpen(false)}
                                    className="w-11 h-11 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90 touch-manipulation"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar flex-1 pb-10">
                                <div className="space-y-6 px-4 animate-fade-in">
                                    {/* Email Fields Group */}
                                    <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/80 dark:border-white/5 overflow-hidden">
                                        <div className="flex items-center px-4 py-3 border-b border-zinc-100/80 dark:border-white/5">
                                            <label className="w-20 text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Para</label>
                                            <input
                                                className="flex-1 bg-transparent border-none py-1 text-sm font-semibold text-zinc-800 dark:text-white outline-none placeholder:text-zinc-300"
                                                value={emailDraft.to}
                                                onChange={e => setEmailDraft(d => ({ ...d, to: e.target.value }))}
                                                placeholder="email@fornecedor.com"
                                            />
                                        </div>
                                        <div className="flex items-center px-4 py-3 border-b border-zinc-100/80 dark:border-white/5">
                                            <label className="w-20 text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Assunto</label>
                                            <input
                                                className="flex-1 bg-transparent border-none py-1 text-sm font-semibold text-zinc-800 dark:text-white outline-none placeholder:text-zinc-300"
                                                value={emailDraft.subject}
                                                onChange={e => setEmailDraft(d => ({ ...d, subject: e.target.value }))}
                                                placeholder="Assunto do email"
                                            />
                                        </div>
                                        <div className="px-4 py-3">
                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Mensagem</label>
                                            <textarea
                                                className="w-full bg-transparent border-none py-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 outline-none resize-none leading-relaxed min-h-[200px]"
                                                value={emailDraft.body}
                                                onChange={e => setEmailDraft(d => ({ ...d, body: e.target.value }))}
                                                placeholder="Conteúdo do email..."
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 pt-2">
                                        <button
                                            onClick={handleSendEmail}
                                            disabled={isSendingEmail || !emailDraft.to}
                                            className={`w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${isSendingEmail
                                                ? 'bg-emerald-500 text-white cursor-wait'
                                                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 active:scale-95'
                                                } disabled:opacity-50`}
                                        >
                                            {isSendingEmail ? (
                                                <>
                                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                    </svg>
                                                    Enviar Email
                                                </>
                                            )}
                                        </button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={copyEmailToClipboard}
                                                className="py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all"
                                            >
                                                Copiar
                                            </button>
                                            <button
                                                onClick={() => setIsComposerOpen(false)}
                                                className="py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>

            {/* Email Success Modal */}
            <AnimatePresence>
                {showSuccessModal && lastSentEmail && createPortal(
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                        onClick={() => setShowSuccessModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden text-center p-8"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Success Animation */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 25 }}
                                className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                            >
                                <motion.svg
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.4 }}
                                    className="w-10 h-10 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </motion.svg>
                            </motion.div>

                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-xl font-bold text-zinc-900 dark:text-white mb-2"
                            >
                                Email Enviado!
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm text-zinc-500 dark:text-zinc-400 mb-6"
                            >
                                Cotação enviada para<br />
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{lastSentEmail.supplierName || lastSentEmail.to}</span>
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-2"
                            >
                                <button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                >
                                    Continuar
                                </button>
                            </motion.div>
                        </motion.div>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>
        </div>
    )
}
