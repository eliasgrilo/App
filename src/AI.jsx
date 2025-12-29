import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import { FirebaseService } from './services/firebaseService'
import { gmailService } from './services/gmailService'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * AI Intelligence - Premium Automation Dashboard
 * Design pattern matching: Inventory.jsx, Costs.jsx, FichaTecnica.jsx
 */

const INVENTORY_STORAGE_KEY = 'padoca_inventory_v2'
const SUPPLIERS_STORAGE_KEY = 'padoca_suppliers'

// Modal scroll lock component
function ModalScrollLock() {
    useScrollLock(true)
    return null
}

export default function AI() {
    const [inventory, setInventory] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [syncStatus, setSyncStatus] = useState('synced')
    const [isCloudSynced, setIsCloudSynced] = useState(false)

    // Gmail Integration State
    const [gmailConnected, setGmailConnected] = useState(false)
    const [gmailEmail, setGmailEmail] = useState('')
    const [gmailConnecting, setGmailConnecting] = useState(false)
    const [emailReplies, setEmailReplies] = useState([])
    const [activeProtocolTab, setActiveProtocolTab] = useState('pending') // 'pending' | 'awaiting' | 'delivered'

    // Email Composer State
    const [isComposerOpen, setIsComposerOpen] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState(null)
    const [emailDraft, setEmailDraft] = useState({ to: '', subject: '', body: '' })
    const [sentEmails, setSentEmails] = useState([])

    // Premium Toast System
    const [toastMessage, setToastMessage] = useState(null)
    const toastTimeoutRef = useRef(null)
    const showToast = useCallback((message, type = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
        setToastMessage({ message, type })
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500)
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // DATA LOADING - Safe loading with error handling
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        const loadData = async () => {
            setSyncStatus('syncing')
            try {
                // Load Inventory - Try cloud first, fallback to local
                try {
                    const inventoryData = await FirebaseService.getInventory()
                    if (inventoryData?.items && Array.isArray(inventoryData.items)) {
                        setInventory(inventoryData.items)
                    } else {
                        const local = localStorage.getItem(INVENTORY_STORAGE_KEY)
                        if (local) {
                            const parsed = JSON.parse(local)
                            setInventory(Array.isArray(parsed) ? parsed : [])
                        }
                    }
                } catch (e) {
                    console.warn('Inventory load failed:', e)
                    const local = localStorage.getItem(INVENTORY_STORAGE_KEY)
                    if (local) {
                        const parsed = JSON.parse(local)
                        setInventory(Array.isArray(parsed) ? parsed : [])
                    }
                }

                // Load Suppliers - Try cloud first, fallback to local
                try {
                    const suppliersData = await FirebaseService.getSuppliers()
                    if (suppliersData?.suppliers && Array.isArray(suppliersData.suppliers)) {
                        setSuppliers(suppliersData.suppliers)
                    } else {
                        const local = localStorage.getItem(SUPPLIERS_STORAGE_KEY)
                        if (local) {
                            const parsed = JSON.parse(local)
                            // Handle both {suppliers: [...]} and direct array formats
                            const arr = parsed?.suppliers || parsed
                            setSuppliers(Array.isArray(arr) ? arr : [])
                        }
                    }
                } catch (e) {
                    console.warn('Suppliers load failed:', e)
                    const local = localStorage.getItem(SUPPLIERS_STORAGE_KEY)
                    if (local) {
                        const parsed = JSON.parse(local)
                        const arr = parsed?.suppliers || parsed
                        setSuppliers(Array.isArray(arr) ? arr : [])
                    }
                }

                setSyncStatus('synced')
            } catch (error) {
                console.error('Error loading data:', error)
                setSyncStatus('error')
            } finally {
                setIsCloudSynced(true)
            }
        }
        loadData()

        // Load sent emails history - Safe parsing
        try {
            const savedEmails = localStorage.getItem('padoca_sent_emails')
            if (savedEmails) {
                const parsed = JSON.parse(savedEmails)
                setSentEmails(Array.isArray(parsed) ? parsed : [])
            }
        } catch (e) {
            console.warn('Sent emails load failed:', e)
        }
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // GMAIL INTEGRATION
    // ═══════════════════════════════════════════════════════════════

    // Initialize Gmail service (auto-connected mode)
    useEffect(() => {
        const initGmail = async () => {
            try {
                await gmailService.init()
                // Auto-connected mode: always connected
                setGmailConnected(true)
                setGmailEmail(gmailService.getConnectedEmail() || 'padocainc@gmail.com')
            } catch (e) {
                console.warn('Gmail init failed:', e)
                // Still show as connected in auto mode
                setGmailConnected(true)
                setGmailEmail('padocainc@gmail.com')
            }
        }
        initGmail()
    }, [])

    // Auto-refresh email replies every 30 seconds
    useEffect(() => {
        if (!gmailConnected || sentEmails.length === 0) return

        const checkForReplies = async () => {
            try {
                // Get emails that are pending (sent but not confirmed)
                const pendingEmails = sentEmails.filter(e => e.status === 'sent')
                if (pendingEmails.length === 0) return

                // Get unique supplier emails
                const supplierEmailsSet = new Set(pendingEmails.map(e => e.to).filter(Boolean))
                const supplierEmailsList = [...supplierEmailsSet]

                // Check for replies from these suppliers
                const oldestPending = pendingEmails.reduce((oldest, e) =>
                    new Date(e.sentAt) < new Date(oldest.sentAt) ? e : oldest
                )
                const afterDate = new Date(oldestPending.sentAt)

                const replies = await gmailService.checkReplies(supplierEmailsList, afterDate)

                if (replies.length > 0) {
                    setEmailReplies(replies)

                    // Auto-mark emails as received if we got a reply
                    const updatedEmails = sentEmails.map(email => {
                        const hasReply = replies.some(r =>
                            r.supplierEmail.toLowerCase() === email.to?.toLowerCase()
                        )
                        if (hasReply && email.status === 'sent') {
                            return { ...email, status: 'replied' }
                        }
                        return email
                    })

                    if (JSON.stringify(updatedEmails) !== JSON.stringify(sentEmails)) {
                        setSentEmails(updatedEmails)
                        localStorage.setItem('padoca_sent_emails', JSON.stringify(updatedEmails))
                        showToast('📬 Nova resposta recebida!', 'success')
                    }
                }
            } catch (e) {
                console.warn('Error checking replies:', e)
            }
        }

        // Initial check
        checkForReplies()

        // Set up interval
        const interval = setInterval(checkForReplies, 30000) // 30 seconds

        return () => clearInterval(interval)
    }, [gmailConnected, sentEmails, showToast])

    // Auto-complete orders when stock is replenished
    // When items in confirmed orders are back above minimum, mark as delivered
    // NOTE: Only runs when inventory changes, not when sentEmails changes (to avoid loops)
    const sentEmailsRef = useRef(sentEmails)
    sentEmailsRef.current = sentEmails

    useEffect(() => {
        if (inventory.length === 0) return

        const emails = sentEmailsRef.current
        if (emails.length === 0) return

        const confirmedOrders = emails.filter(e => e.status === 'confirmed')
        if (confirmedOrders.length === 0) return

        let hasChanges = false
        const updatedEmails = emails.map(email => {
            if (email.status !== 'confirmed' || !email.itemIds?.length) return email

            // Check if all items in this order are now above minimum stock
            const allItemsRestocked = email.itemIds.every(itemId => {
                const item = inventory.find(i => i.id === itemId)
                if (!item) return true // Item deleted, consider restocked

                const total = (Number(item.packageQuantity) || 0) * (Number(item.packageCount) || 1)
                const min = Number(item.minStock) || 0
                return total >= min
            })

            if (allItemsRestocked) {
                hasChanges = true
                return { ...email, status: 'delivered', deliveredAt: new Date().toISOString() }
            }
            return email
        })

        if (hasChanges) {
            setSentEmails(updatedEmails)
            localStorage.setItem('padoca_sent_emails', JSON.stringify(updatedEmails))
            showToast('📦 Pedido entregue - estoque atualizado!', 'success')
        }
    }, [inventory, showToast]) // Removed sentEmails to avoid infinite loop

    // Connect Gmail
    const connectGmail = async () => {
        setGmailConnecting(true)
        try {
            const result = await gmailService.connect()
            setGmailConnected(true)
            setGmailEmail(result.email || '')
            showToast('📧 Gmail conectado com sucesso!', 'success')
        } catch (e) {
            console.error('Gmail connect failed:', e)
            showToast('Erro ao conectar Gmail', 'error')
        } finally {
            setGmailConnecting(false)
        }
    }

    // Disconnect Gmail
    const disconnectGmail = () => {
        gmailService.disconnect()
        setGmailConnected(false)
        setGmailEmail('')
        setEmailReplies([])
        showToast('Gmail desconectado', 'info')
    }

    // ═══════════════════════════════════════════════════════════════
    // INTELLIGENCE ENGINE
    // ═══════════════════════════════════════════════════════════════
    const getTotalQuantity = (item) => {
        return (Number(item.packageQuantity) || 0) * (Number(item.packageCount) || 1)
    }

    const getStockStatus = (item) => {
        const total = getTotalQuantity(item)
        const min = Number(item.minStock) || 0
        if (min === 0) return 'ok'
        if (total < min) return 'critical'
        if (total <= min * 1.2) return 'warning'
        return 'ok'
    }

    // Get items with stock issues grouped by supplier
    // Exclude suppliers that already have pending emails (status === 'sent')
    const alertsBySupplier = useMemo(() => {
        // Get supplier IDs that already have pending emails
        const suppliersWithPendingEmails = new Set(
            sentEmails
                .filter(e => e.status === 'sent' || e.status === 'replied')
                .map(e => e.supplierId)
                .filter(Boolean)
        )

        const alerts = inventory
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
        const grouped = {}
        alerts.forEach(item => {
            const supplier = suppliers.find(s => s.linkedItems?.some(li => li.itemId === item.id))
            const key = supplier?.id || 'unlinked'

            // Skip if supplier already has pending email
            if (suppliersWithPendingEmails.has(supplier?.id)) return

            if (!grouped[key]) {
                grouped[key] = { supplier, items: [] }
            }
            grouped[key].items.push(item)
        })

        return Object.values(grouped).filter(g => g.supplier)
    }, [inventory, suppliers, sentEmails])

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
    const generateEmail = useCallback((supplier, items) => {
        const today = new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })

        const itemsList = items
            .map(item => {
                const atual = item.totalQty || 0
                const maximo = item.maxStock || 0
                const pedir = Math.max(0, maximo - atual)
                return `• ${item.name}: ${pedir.toFixed(0)}${item.unit || 'kg'}`
            })
            .join('\n')

        return {
            to: supplier.email || '',
            subject: `Solicitação de Cotação - Padoca Pizza - ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}`,
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

    const [selectedItems, setSelectedItems] = useState([])

    const openEmailComposer = (supplier, items) => {
        const email = generateEmail(supplier, items)
        setSelectedSupplier(supplier)
        setSelectedItems(items) // Track which items we're quoting
        setEmailDraft(email)
        setIsComposerOpen(true)
    }

    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [lastSentEmail, setLastSentEmail] = useState(null)

    const handleSendEmail = async () => {
        if (!emailDraft.to) {
            showToast('Email do fornecedor não cadastrado', 'error')
            return
        }

        // Check for duplicate - prevent sending if supplier already has pending email
        const existingPending = sentEmails.find(
            e => e.supplierId === selectedSupplier?.id &&
                (e.status === 'sent' || e.status === 'confirmed')
        )
        if (existingPending) {
            showToast('Já existe uma cotação pendente para este fornecedor', 'error')
            setIsComposerOpen(false)
            return
        }

        // Start sending animation
        setIsSendingEmail(true)

        try {
            // Send email via Gmail compose
            console.log('📧 Opening email composer...')
            await gmailService.sendEmail({
                to: emailDraft.to,
                subject: emailDraft.subject,
                body: emailDraft.body,
                supplierName: selectedSupplier?.name
            })
            console.log('✅ Email service completed!')

            // Save to history with full tracking data
            const newEmail = {
                id: Date.now().toString(),
                ...emailDraft,
                supplierName: selectedSupplier?.name,
                supplierId: selectedSupplier?.id, // Track supplier for flow
                itemIds: selectedItems.map(i => i.id), // Track items for flow
                itemNames: selectedItems.map(i => i.name),
                sentAt: new Date().toISOString(),
                status: 'sent',
                sentViaGmail: gmailConnected
            }

            const updated = [newEmail, ...sentEmails]
            setSentEmails(updated)
            localStorage.setItem('padoca_sent_emails', JSON.stringify(updated))

            // Close composer and stop loading
            setIsSendingEmail(false)
            setIsComposerOpen(false)

            // Show immediate toast confirmation
            showToast('✅ Email enviado! Gmail aberto para finalizar.', 'success')

            // Show success modal
            console.log('🎉 Showing success modal...')
            setLastSentEmail(newEmail)
            setShowSuccessModal(true)

            // Switch to Awaiting tab
            setActiveProtocolTab('awaiting')

            // Reset state
            setSelectedSupplier(null)
            setSelectedItems([])
            setEmailDraft({ to: '', subject: '', body: '' })
        } catch (error) {
            console.error('❌ Send email failed:', error)
            setIsSendingEmail(false)
            showToast('Erro ao enviar email: ' + error.message, 'error')
        }
    }

    const copyEmailToClipboard = () => {
        const fullText = `Para: ${emailDraft.to}\nAssunto: ${emailDraft.subject}\n\n${emailDraft.body}`
        navigator.clipboard.writeText(fullText)
        showToast('Email copiado para área de transferência!')
    }

    // Format currency
    const formatCurrency = (val) => {
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
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-2">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                        <h1 className="text-2xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Inteligência</h1>
                        {/* Sync Status Badge - EXACT match */}
                        <div className={`px-2 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 shrink-0 ${syncStatus === 'syncing'
                            ? 'bg-amber-500/5 border-amber-500/10 text-amber-500 animate-pulse'
                            : syncStatus === 'error'
                                ? 'bg-red-500/5 border-red-500/10 text-red-500'
                                : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80'
                            }`}>
                            <div className={`w-1 h-1 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500' : syncStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                                }`} />
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest leading-none whitespace-nowrap">
                                {syncStatus === 'syncing' ? 'Sync' : syncStatus === 'error' ? 'Error' : 'Active'}
                            </span>
                        </div>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Automação e insights em tempo real</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {/* Gmail Connect Button */}
                    {gmailConnected ? (
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Gmail Conectado</span>
                                <span className="text-[10px] text-emerald-500/70 truncate max-w-[150px]">{gmailEmail}</span>
                            </div>
                            <button
                                onClick={disconnectGmail}
                                className="ml-2 p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                                title="Desconectar"
                            >
                                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={connectGmail}
                            disabled={gmailConnecting}
                            className="px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {gmailConnecting ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Conectando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                    </svg>
                                    Conectar Gmail
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => alertsBySupplier.length > 0 && openEmailComposer(alertsBySupplier[0].supplier, alertsBySupplier[0].items)}
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
                        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

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

                        <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100 dark:border-white/5">
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
                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all">
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
                            <div className="h-full bg-rose-500/80 transition-all duration-1000" style={{ width: stats.total > 0 ? `${(stats.critical / stats.total * 100)}%` : '0%' }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all">
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
                            <div className="h-full bg-amber-500/80 transition-all duration-1000" style={{ width: stats.total > 0 ? `${(stats.warning / stats.total * 100)}%` : '0%' }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════════════
                 AUTOMATION PROTOCOL - Apple-Quality Tabs
                 3 Tabs: Cotação Pendente | Aguardando Resposta | Pedido Entregue
            ═══════════════════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[3rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">

                {/* Header */}
                <div className="p-6 md:p-10 pb-0">
                    <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Automation Protocol</h2>
                    <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none mb-6">Gestão de Cotações</h3>

                    {/* Apple-Style Segmented Control */}
                    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/50 dark:border-white/5 overflow-x-auto">
                        {[
                            { key: 'pending', label: 'Pendente', count: alertsBySupplier.length, color: 'rose' },
                            { key: 'awaiting', label: 'Aguardando', count: sentEmails.filter(e => e.status === 'sent').length, color: 'amber' },
                            { key: 'delivered', label: 'Entregue', count: sentEmails.filter(e => e.status === 'delivered').length, color: 'emerald' },
                            { key: 'history', label: 'Histórico', count: sentEmails.length, color: 'zinc' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveProtocolTab(tab.key)}
                                className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${activeProtocolTab === tab.key
                                    ? 'text-zinc-900 dark:text-white'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {activeProtocolTab === tab.key && (
                                    <motion.div
                                        layoutId="protocol-tab-indicator"
                                        className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-md"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`relative z-10 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeProtocolTab === tab.key
                                        ? `bg-${tab.color}-500/20 text-${tab.color}-600 dark:text-${tab.color}-400`
                                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6 md:p-10 pt-6">
                    <AnimatePresence mode="wait">

                        {/* TAB 1: Cotação Pendente */}
                        {activeProtocolTab === 'pending' && (
                            <motion.div
                                key="pending"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {alertsBySupplier.length === 0 ? (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/10">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">Estoque em dia</p>
                                        <p className="text-[10px] text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">Nenhuma cotação pendente</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {alertsBySupplier.map(({ supplier, items }) => (
                                            <motion.div
                                                key={supplier.id}
                                                className="flex flex-col md:flex-row md:items-center gap-4 py-5 px-5 rounded-2xl border border-rose-100 dark:border-rose-500/10 bg-rose-50/30 dark:bg-rose-500/5 hover:bg-rose-50/50 dark:hover:bg-rose-500/10 transition-all cursor-pointer group"
                                                onClick={() => openEmailComposer(supplier, items)}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-rose-500/25 shrink-0">
                                                        {supplier.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{supplier.name}</p>
                                                        <p className="text-[10px] text-rose-600 dark:text-rose-400 truncate">{items.length} item{items.length > 1 ? 's' : ''} abaixo do mínimo</p>
                                                    </div>
                                                </div>
                                                {/* Items List - Clean Apple Design */}
                                                <div className="w-full mt-3 space-y-1.5">
                                                    {items.map(item => {
                                                        const atual = item.totalQty || 0
                                                        const maximo = item.maxStock || 0
                                                        const pedir = Math.max(0, maximo - atual)
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
                                                            >
                                                                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{item.name}</span>
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-xs text-zinc-400">Atual: {atual.toFixed(0)}{item.unit || ''}</span>
                                                                    <span className="text-sm font-semibold text-rose-500">+{pedir.toFixed(0)}{item.unit || ''}</span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                                <button className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md group-hover:scale-105 transition-all flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                    Solicitar
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* TAB 2: Aguardando Resposta */}
                        {activeProtocolTab === 'awaiting' && (
                            <motion.div
                                key="awaiting"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {sentEmails.filter(e => e.status === 'sent').length === 0 ? (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        </div>
                                        <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">Nenhum email pendente</p>
                                        <p className="text-[10px] text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">Envie cotações na aba "Pendente"</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {sentEmails.filter(e => e.status === 'sent').map((email) => (
                                            <motion.div
                                                key={email.id}
                                                className="flex flex-col md:flex-row md:items-center gap-4 py-5 px-5 rounded-2xl border border-amber-100 dark:border-amber-500/10 bg-amber-50/30 dark:bg-amber-500/5"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-amber-500/25 shrink-0 relative">
                                                        {email.supplierName?.charAt(0)?.toUpperCase() || '?'}
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                                                            <div className="w-2 h-2 bg-white rounded-full" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{email.supplierName || email.to}</p>
                                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Enviado {new Date(email.sentAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const updated = sentEmails.map(e => e.id === email.id ? { ...e, status: 'confirmed' } : e)
                                                            setSentEmails(updated)
                                                            localStorage.setItem('padoca_sent_emails', JSON.stringify(updated))
                                                            showToast('✓ Pedido confirmado!', 'success')
                                                        }}
                                                        className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                        Confirmar
                                                    </button>
                                                    <button
                                                        onClick={() => openEmailComposer(suppliers.find(s => s.name === email.supplierName) || { name: email.supplierName, email: email.to }, [])}
                                                        className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                                    >
                                                        Reenviar
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {/* Gmail Auto-Read Status */}
                                        {gmailConnected && (
                                            <div className="mt-6 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
                                                    <svg className="w-4 h-4 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" /></svg>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">Gmail Monitorando</p>
                                                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400">Respostas são detectadas automaticamente</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* TAB 3: Pedido Entregue */}
                        {activeProtocolTab === 'delivered' && (
                            <motion.div
                                key="delivered"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {sentEmails.filter(e => e.status === 'delivered').length === 0 ? (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                        </div>
                                        <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">Nenhum pedido entregue</p>
                                        <p className="text-[10px] text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">Confirme pedidos na aba "Aguardando"</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {sentEmails.filter(e => e.status === 'delivered').map((email) => (
                                            <motion.div
                                                key={email.id}
                                                className="flex items-center gap-4 py-4 px-5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 bg-emerald-50/30 dark:bg-emerald-500/5"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{email.supplierName || email.to}</p>
                                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{email.subject}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✓ Entregue</p>
                                                    <p className="text-[9px] text-zinc-400">{new Date(email.sentAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* TAB 4: Histórico / Registro de Movimentações */}
                        {activeProtocolTab === 'history' && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {sentEmails.length === 0 ? (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">Nenhum registro</p>
                                        <p className="text-[10px] text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">As movimentações aparecerão aqui</p>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Table Header - Desktop */}
                                        <div className="hidden md:grid grid-cols-12 gap-4 py-3 mb-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-white/5">
                                            <div className="col-span-1">Status</div>
                                            <div className="col-span-3">Fornecedor</div>
                                            <div className="col-span-3">Itens</div>
                                            <div className="col-span-2">Enviado</div>
                                            <div className="col-span-2">Atualizado</div>
                                            <div className="col-span-1 text-right">Ação</div>
                                        </div>

                                        {/* Table Body */}
                                        <div className="space-y-2">
                                            {sentEmails.slice(0, 10).map((email) => {
                                                const statusConfig = {
                                                    sent: { color: 'amber', icon: '⏳', label: 'Aguardando' },
                                                    replied: { color: 'blue', icon: '📩', label: 'Respondido' },
                                                    confirmed: { color: 'indigo', icon: '✓', label: 'Confirmado' },
                                                    delivered: { color: 'emerald', icon: '📦', label: 'Entregue' }
                                                }
                                                const status = statusConfig[email.status] || statusConfig.sent

                                                return (
                                                    <motion.div
                                                        key={email.id}
                                                        className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                    >
                                                        {/* Status */}
                                                        <div className="md:col-span-1 flex items-center gap-2">
                                                            <div className={`w-8 h-8 rounded-lg bg-${status.color}-100 dark:bg-${status.color}-500/10 flex items-center justify-center text-sm shrink-0`}>
                                                                {status.icon}
                                                            </div>
                                                            <span className={`md:hidden text-[10px] font-bold text-${status.color}-600 dark:text-${status.color}-400 uppercase`}>{status.label}</span>
                                                        </div>

                                                        {/* Supplier */}
                                                        <div className="md:col-span-3 flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-500 to-zinc-600 flex items-center justify-center text-white text-sm font-bold shadow shrink-0">
                                                                {email.supplierName?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{email.supplierName || 'Fornecedor'}</p>
                                                                <p className="text-[10px] text-zinc-400 truncate">{email.to}</p>
                                                            </div>
                                                        </div>

                                                        {/* Items */}
                                                        <div className="md:col-span-3 flex flex-wrap gap-1.5 items-center">
                                                            {(email.itemNames || []).slice(0, 2).map((name, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-[9px] font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[80px]">
                                                                    {name}
                                                                </span>
                                                            ))}
                                                            {(email.itemNames?.length || 0) > 2 && (
                                                                <span className="text-[9px] text-zinc-400">+{email.itemNames.length - 2}</span>
                                                            )}
                                                            {(!email.itemNames || email.itemNames.length === 0) && (
                                                                <span className="text-[10px] text-zinc-300 dark:text-zinc-600">—</span>
                                                            )}
                                                        </div>

                                                        {/* Sent Date */}
                                                        <div className="md:col-span-2 flex items-center">
                                                            <div>
                                                                <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                                                                    {new Date(email.sentAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                                </p>
                                                                <p className="text-[9px] text-zinc-400">
                                                                    {new Date(email.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Updated Date */}
                                                        <div className="md:col-span-2 flex items-center">
                                                            <div>
                                                                <p className={`text-[11px] font-medium text-${status.color}-600 dark:text-${status.color}-400`}>
                                                                    {status.label}
                                                                </p>
                                                                <p className="text-[9px] text-zinc-400">
                                                                    {email.deliveredAt
                                                                        ? new Date(email.deliveredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                                                                        : '—'
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Action */}
                                                        <div className="md:col-span-1 flex items-center justify-end">
                                                            {email.status === 'sent' && (
                                                                <button
                                                                    onClick={() => {
                                                                        const updated = sentEmails.map(e => e.id === email.id ? { ...e, status: 'confirmed' } : e)
                                                                        setSentEmails(updated)
                                                                        localStorage.setItem('padoca_sent_emails', JSON.stringify(updated))
                                                                        showToast('✓ Confirmado!', 'success')
                                                                    }}
                                                                    className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors group"
                                                                    title="Confirmar recebimento"
                                                                >
                                                                    <svg className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {email.status === 'delivered' && (
                                                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>

                                        {/* Footer */}
                                        {sentEmails.length > 10 && (
                                            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/5 text-center">
                                                <p className="text-[10px] text-zinc-400">Mostrando 10 de {sentEmails.length} registros</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* Email Composer Modal - Matching exactly Costs.jsx modal pattern */}
            <AnimatePresence>
                {isComposerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-20 md:pt-4"
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
                                    <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden">
                                        <div className="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                                            <label className="w-20 text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Para</label>
                                            <input
                                                className="flex-1 bg-transparent border-none py-1 text-sm font-semibold text-zinc-800 dark:text-white outline-none placeholder:text-zinc-300"
                                                value={emailDraft.to}
                                                onChange={e => setEmailDraft(d => ({ ...d, to: e.target.value }))}
                                                placeholder="email@fornecedor.com"
                                            />
                                        </div>
                                        <div className="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-white/5">
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
                                                className="py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all"
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Email Success Modal */}
            {showSuccessModal && lastSentEmail && createPortal(
                <AnimatePresence>
                    <motion.div
                        key="success-modal"
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
                                <svg
                                    className="w-10 h-10 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
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
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}

            {/* Premium Toast - EXACT match from Costs.jsx */}
            <AnimatePresence>
                {toastMessage && createPortal(
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[20000] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${toastMessage.type === 'error' ? 'bg-rose-500/90 border-rose-400/20 text-white' :
                            toastMessage.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/20 text-white' :
                                'bg-zinc-900/90 border-white/10 text-white'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${toastMessage.type === 'error' ? 'bg-white animate-pulse' :
                            toastMessage.type === 'success' ? 'bg-white' : 'bg-indigo-400'
                            }`} />
                        <span className="text-sm font-semibold tracking-tight">{toastMessage.message}</span>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>
        </div>
    )
}
