import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import { FirebaseService } from './services/firebaseService'
import { gmailService } from './services/gmailService'
import { GeminiService } from './services/geminiService'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime, formatTime } from './utils/formatUtils'

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

    // Quote Details Modal State
    const [quoteModalOpen, setQuoteModalOpen] = useState(false)
    const [selectedEmailForQuote, setSelectedEmailForQuote] = useState(null)
    const [quoteDetails, setQuoteDetails] = useState({ quotedValue: '', expectedDelivery: '' })

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

        // Load sent emails history with migration for legacy data
        try {
            const savedEmails = localStorage.getItem('padoca_sent_emails')
            if (savedEmails) {
                const parsed = JSON.parse(savedEmails)
                if (Array.isArray(parsed)) {
                    // Migration: Parse body to extract items for legacy emails
                    const migrated = parsed.map(email => {
                        // Skip if already has items array
                        if (email.items && email.items.length > 0) return email

                        // Try to parse items from body text (format: "• Item Name: 90kg" or "Item Name: 90 kg")
                        if (email.body) {
                            const itemRegex = /[•\-]\s*([^:]+):\s*(\d+(?:\.\d+)?)\s*(kg|g|un|L|ml|pç|cx|pac)?/gi
                            const parsedItems = []
                            let match
                            while ((match = itemRegex.exec(email.body)) !== null) {
                                parsedItems.push({
                                    id: `legacy-${Date.now()}-${parsedItems.length}`,
                                    name: match[1].trim(),
                                    quantityToOrder: parseFloat(match[2]),
                                    unit: match[3] || '',
                                    currentStock: 0,
                                    maxStock: 0
                                })
                            }
                            if (parsedItems.length > 0) {
                                return { ...email, items: parsedItems }
                            }
                        }
                        // Fallback: create items from itemNames if available
                        if (email.itemNames && email.itemNames.length > 0) {
                            return {
                                ...email,
                                items: email.itemNames.map((name, idx) => ({
                                    id: `legacy-name-${idx}`,
                                    name,
                                    quantityToOrder: 0,
                                    unit: '',
                                    currentStock: 0,
                                    maxStock: 0
                                }))
                            }
                        }
                        return email
                    })
                    setSentEmails(migrated)
                    // Save migrated data back
                    localStorage.setItem('padoca_sent_emails', JSON.stringify(migrated))
                }
            }
        } catch (e) {
            console.warn('Sent emails load failed:', e)
        }
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // GMAIL INTEGRATION
    // ═══════════════════════════════════════════════════════════════

    // Initialize Gmail service - AUTO-CONNECT if valid token exists
    useEffect(() => {
        const initGmail = async () => {
            try {
                // Pre-load OAuth scripts - this MUST happen before user clicks Connect Gmail
                await gmailService.ensureInitialized()
                const connected = gmailService.isConnected()

                if (connected) {
                    setGmailConnected(true)
                    setGmailEmail(gmailService.getConnectedEmail() || 'padocainc@gmail.com')
                    console.log('✅ Gmail API AUTO-CONNECTED:', gmailService.getConnectedEmail())
                    // Test the connection by validating the token
                    const profile = await gmailService.getUserProfile()
                    if (profile) {
                        console.log('✅ Gmail token validated, email:', profile.emailAddress)
                    } else {
                        console.warn('⚠️ Token expired, will need to reconnect')
                        gmailService.disconnect()
                        setGmailConnected(false)
                    }
                } else {
                    // Check if we have a stored token that just needs refreshing
                    const storedToken = localStorage.getItem('gmail_access_token')
                    const tokenExpiry = localStorage.getItem('gmail_token_expiry')

                    if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
                        // We have a valid token in storage - initialize with it
                        console.log('🔄 Found stored Gmail token, reconnecting...')
                        setGmailConnected(true)
                        setGmailEmail(localStorage.getItem('gmail_user_email') || 'padocainc@gmail.com')
                    } else {
                        console.log('⚠️ Gmail API not connected - click "Conectar Gmail" to authorize')
                        setGmailConnected(false)
                        setGmailEmail('padocainc@gmail.com')
                    }
                }
            } catch (e) {
                console.warn('Gmail init failed:', e)
                setGmailConnected(false)
                setGmailEmail('padocainc@gmail.com')
            }
        }
        initGmail()
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // EMAIL REPLY DETECTION (Real-time Firestore Listener + AI Analysis)
    // ═══════════════════════════════════════════════════════════════
    // Real-time listener for Firestore quotations - Zero manual intervention
    // Gmail Pub/Sub -> Cloud Function -> Firestore -> This listener
    const sentEmailsForRepliesRef = useRef(sentEmails)
    sentEmailsForRepliesRef.current = sentEmails

    // Primary: Real-time Firestore listener (zero latency, no polling)
    useEffect(() => {
        if (!gmailConnected) return

        console.log('🔔 Setting up Firestore real-time listener for quotations...')

        const unsubscribe = FirebaseService.subscribeToQuotations(async (quotations) => {
            console.log('📬 Real-time update received:', quotations.length, 'quotations')

            const currentEmails = sentEmailsForRepliesRef.current
            if (quotations.length === 0 || currentEmails.length === 0) return

            let hasUpdates = false
            const updatedEmails = await Promise.all(currentEmails.map(async (email) => {
                // Match quotation by supplier email and status
                const matchingQuotation = quotations.find(q =>
                    q.supplierEmail?.toLowerCase() === email.to?.toLowerCase() &&
                    (q.status === 'reply_received' || q.status === 'quoted')
                )

                if (matchingQuotation && email.status === 'sent') {
                    hasUpdates = true
                    console.log('✅ Auto-update from Pub/Sub:', matchingQuotation.supplierEmail)

                    // If quotation has reply body but not yet processed by AI, process it now
                    let quotedData = null
                    const emailBody = matchingQuotation.replyBody || ''
                    const emailItems = email.items || []

                    if (GeminiService.isReady() && emailBody.length > 20 && !matchingQuotation.quotedValue) {
                        try {
                            console.log('🤖 Analyzing email with Gemini AI...')
                            const analysis = await GeminiService.analyzeSupplierResponse(
                                emailBody,
                                emailItems.map(i => ({ name: i.name }))
                            )

                            if (analysis.success && analysis.data?.hasQuote) {
                                quotedData = {
                                    items: analysis.data.items || [],
                                    totalQuote: analysis.data.totalQuote,
                                    deliveryDate: analysis.data.deliveryDate,
                                    deliveryDays: analysis.data.deliveryDays,
                                    paymentTerms: analysis.data.paymentTerms,
                                    supplierNotes: analysis.data.supplierNotes,
                                    sentiment: analysis.data.sentiment,
                                    hasProblems: analysis.data.hasProblems || false,
                                    hasDelay: analysis.data.hasDelay || false,
                                    delayReason: analysis.data.delayReason,
                                    problemSummary: analysis.data.problemSummary,
                                    urgency: analysis.data.urgency || 'low',
                                    suggestedAction: analysis.data.suggestedAction || 'confirm'
                                }
                                console.log('✅ AI extracted data:', quotedData)
                            }
                        } catch (aiError) {
                            console.warn('⚠️ AI analysis failed:', aiError)
                        }
                    }

                    return {
                        ...email,
                        status: quotedData ? 'quoted' : (matchingQuotation.status === 'quoted' ? 'quoted' : 'replied'),
                        repliedAt: matchingQuotation.replyReceivedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                        replySnippet: emailBody.substring(0, 150),
                        replySubject: matchingQuotation.replySubject || '',
                        replyFrom: matchingQuotation.replyFrom || '',
                        replyBody: emailBody,
                        // Quoted data - from AI or from Firestore
                        quotedData: quotedData || matchingQuotation.quotedData || null,
                        quotedValue: quotedData?.totalQuote || matchingQuotation.quotedValue || null,
                        expectedDelivery: quotedData?.deliveryDate || matchingQuotation.expectedDelivery || null,
                        deliveryDays: quotedData?.deliveryDays || matchingQuotation.deliveryDays || null,
                        paymentTerms: quotedData?.paymentTerms || matchingQuotation.paymentTerms || null,
                        // Problem flags
                        hasProblems: quotedData?.hasProblems || matchingQuotation.hasProblems || false,
                        hasDelay: quotedData?.hasDelay || matchingQuotation.hasDelay || false,
                        problemSummary: quotedData?.problemSummary || matchingQuotation.problemSummary || null,
                        urgency: quotedData?.urgency || matchingQuotation.urgency || 'low',
                        suggestedAction: quotedData?.suggestedAction || matchingQuotation.suggestedAction || 'confirm',
                        // Update items with quoted prices
                        items: emailItems.map(item => {
                            const quotedItem = quotedData?.items?.find(qi =>
                                qi.name?.toLowerCase().includes(item.name?.toLowerCase()) ||
                                item.name?.toLowerCase().includes(qi.name?.toLowerCase())
                            )
                            return {
                                ...item,
                                quotedPrice: quotedItem?.unitPrice || null,
                                available: quotedItem?.available ?? true,
                                partialAvailability: quotedItem?.partialAvailability || false,
                                availableQuantity: quotedItem?.availableQuantity || null,
                                unavailableReason: quotedItem?.unavailableReason || null
                            }
                        })
                    }
                }
                return email
            }))

            if (hasUpdates) {
                setSentEmails(updatedEmails)
                localStorage.setItem('padoca_sent_emails', JSON.stringify(updatedEmails))

                const newlyQuoted = updatedEmails.filter(e =>
                    e.status === 'quoted' && currentEmails.find(ce => ce.id === e.id)?.status === 'sent'
                )
                if (newlyQuoted.length > 0) {
                    showToast(`📬 ${newlyQuoted.length} cotação(ões) recebida(s) via Pub/Sub! Zero intervenção manual.`, 'success')
                } else {
                    showToast('📬 Resposta recebida em tempo real!', 'success')
                }
            }
        })

        return () => {
            console.log('🔕 Unsubscribing from Firestore listener')
            unsubscribe()
        }
    }, [gmailConnected, showToast])

    // Fallback: Manual polling every 60s for edge cases (Pub/Sub not configured)
    useEffect(() => {
        if (!gmailConnected) return

        let isMounted = true

        const checkForRepliesFallback = async () => {
            if (!isMounted) return

            const currentEmails = sentEmailsForRepliesRef.current
            const pendingEmails = currentEmails.filter(e => e.status === 'sent')
            if (pendingEmails.length === 0) return

            try {
                const supplierEmailsList = [...new Set(pendingEmails.map(e => e.to).filter(Boolean))]
                const oldestPending = pendingEmails.reduce((oldest, e) =>
                    new Date(e.sentAt) < new Date(oldest.sentAt) ? e : oldest
                )

                console.log('🔍 Fallback polling for replies...')
                const replies = await gmailService.checkReplies(supplierEmailsList, new Date(oldestPending.sentAt))

                if (!isMounted || replies.length === 0) return

                setEmailReplies(replies)
                console.log('📬 Fallback found replies:', replies.length)

                // Process with AI
                const updatedEmails = await Promise.all(currentEmails.map(async (email) => {
                    const matchingReply = replies.find(r =>
                        r.supplierEmail.toLowerCase() === email.to?.toLowerCase()
                    )

                    if (matchingReply && email.status === 'sent') {
                        const emailBody = matchingReply.body || matchingReply.snippet || ''
                        const emailItems = email.items || []
                        let quotedData = null

                        if (GeminiService.isReady() && emailBody.length > 20) {
                            try {
                                const analysis = await GeminiService.analyzeSupplierResponse(
                                    emailBody,
                                    emailItems.map(i => ({ name: i.name }))
                                )
                                if (analysis.success && analysis.data?.hasQuote) {
                                    quotedData = {
                                        items: analysis.data.items || [],
                                        totalQuote: analysis.data.totalQuote,
                                        deliveryDate: analysis.data.deliveryDate,
                                        deliveryDays: analysis.data.deliveryDays,
                                        paymentTerms: analysis.data.paymentTerms,
                                        supplierNotes: analysis.data.supplierNotes,
                                        sentiment: analysis.data.sentiment,
                                        hasProblems: analysis.data.hasProblems || false,
                                        hasDelay: analysis.data.hasDelay || false,
                                        delayReason: analysis.data.delayReason,
                                        problemSummary: analysis.data.problemSummary,
                                        urgency: analysis.data.urgency || 'low',
                                        suggestedAction: analysis.data.suggestedAction || 'confirm'
                                    }
                                }
                            } catch (e) { console.warn('AI analysis failed:', e) }
                        }

                        return {
                            ...email,
                            status: quotedData ? 'quoted' : 'replied',
                            repliedAt: new Date().toISOString(),
                            replySnippet: matchingReply.snippet,
                            replySubject: matchingReply.subject,
                            replyFrom: matchingReply.from,
                            replyBody: emailBody,
                            quotedData,
                            quotedValue: quotedData?.totalQuote || null,
                            expectedDelivery: quotedData?.deliveryDate || null,
                            deliveryDays: quotedData?.deliveryDays || null,
                            paymentTerms: quotedData?.paymentTerms || null,
                            hasProblems: quotedData?.hasProblems || false,
                            hasDelay: quotedData?.hasDelay || false,
                            problemSummary: quotedData?.problemSummary || null,
                            urgency: quotedData?.urgency || 'low',
                            suggestedAction: quotedData?.suggestedAction || 'confirm',
                            items: emailItems.map(item => {
                                const quotedItem = quotedData?.items?.find(qi =>
                                    qi.name?.toLowerCase().includes(item.name?.toLowerCase()) ||
                                    item.name?.toLowerCase().includes(qi.name?.toLowerCase())
                                )
                                return { ...item, quotedPrice: quotedItem?.unitPrice || null, available: quotedItem?.available ?? true }
                            })
                        }
                    }
                    return email
                }))

                if (JSON.stringify(updatedEmails) !== JSON.stringify(currentEmails)) {
                    setSentEmails(updatedEmails)
                    localStorage.setItem('padoca_sent_emails', JSON.stringify(updatedEmails))
                    showToast('📋 Cotação recebida (via fallback polling)', 'success')
                }
            } catch (e) {
                console.warn('Fallback polling error:', e)
            }
        }

        // Fallback polling every 60 seconds (less aggressive than before)
        const timeout = setTimeout(checkForRepliesFallback, 5000)
        const interval = setInterval(checkForRepliesFallback, 60000)

        console.log('🔄 Fallback polling ativado (60s interval)')

        return () => {
            isMounted = false
            clearTimeout(timeout)
            clearInterval(interval)
        }
    }, [gmailConnected, showToast])

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

            // Save to history with COMPLETE tracking data for audit log
            const itemsWithDetails = selectedItems.map(item => {
                const atual = item.totalQty || 0
                const maximo = item.maxStock || 0
                const quantidadePedir = Math.max(0, maximo - atual)
                return {
                    id: item.id,
                    name: item.name,
                    currentStock: atual,
                    maxStock: maximo,
                    quantityToOrder: quantidadePedir,
                    unit: item.unit || '',
                    supplierId: item.supplierId
                }
            })

            const newEmail = {
                id: Date.now().toString(),
                ...emailDraft,
                supplierName: selectedSupplier?.name,
                supplierId: selectedSupplier?.id,
                // Complete item tracking for all tabs
                items: itemsWithDetails,
                itemNames: selectedItems.map(i => i.name), // Keep for backwards compat
                totalItems: selectedItems.length,
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

    // Format currency - Canadian Dollar
    const formatCurrency = (val) => {
        const n = Number(val) || 0
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
            minimumFractionDigits: 2
        }).format(n)
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
                    {/* Gmail Connection Button - Click to authorize Gmail API */}
                    {gmailConnected ? (
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-500/20">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Gmail Conectado</span>
                                <span className="text-[9px] text-emerald-500/70">{gmailEmail}</span>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                // CRITICAL: authorize() must be called synchronously from user click
                                // Do NOT use async/await before this call or popup will be blocked!
                                showToast('Abrindo autorização do Gmail...', 'info')
                                gmailService.authorize()
                                    .then((result) => {
                                        if (result.connected) {
                                            setGmailConnected(true)
                                            setGmailEmail(result.email)
                                            showToast('✅ Gmail conectado! Respostas serão detectadas automaticamente.', 'success')
                                        }
                                    })
                                    .catch((e) => {
                                        showToast('Erro ao conectar: ' + e.message, 'error')
                                    })
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                </svg>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 group-hover:underline">Conectar Gmail</span>
                                <span className="text-[9px] text-amber-500/70">Para detectar respostas</span>
                            </div>
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

                    {/* Apple-Style Segmented Control - Premium Design */}
                    <div className="flex p-1.5 bg-zinc-100/80 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/30 dark:border-white/5 overflow-x-auto scrollbar-hide -mx-2 md:mx-0 backdrop-blur-sm">
                        {[
                            { key: 'pending', label: 'Pendente', count: alertsBySupplier.length, color: 'zinc', icon: '○' },
                            { key: 'awaiting', label: 'Aguardando', count: sentEmails.filter(e => e.status === 'sent' || e.status === 'quoted').length, color: 'zinc', icon: '◔' },
                            { key: 'ordered', label: 'Ordens', count: sentEmails.filter(e => e.status === 'confirmed').length, color: 'zinc', icon: '◑' },
                            { key: 'received', label: 'Recebido', count: sentEmails.filter(e => e.status === 'delivered').length, color: 'zinc', icon: '●' },
                            { key: 'history', label: 'Histórico', count: sentEmails.length, color: 'zinc', icon: '◷' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveProtocolTab(tab.key)}
                                className={`relative flex-shrink-0 flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2.5 md:py-3 px-2.5 md:px-4 rounded-xl text-[9px] md:text-[10px] font-semibold uppercase tracking-wide transition-all duration-300 whitespace-nowrap ${activeProtocolTab === tab.key
                                    ? 'text-zinc-900 dark:text-white'
                                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400'
                                    }`}
                            >
                                {activeProtocolTab === tab.key && (
                                    <motion.div
                                        layoutId="protocol-tab-indicator"
                                        className="absolute inset-0 bg-white dark:bg-zinc-700/80 rounded-xl shadow-sm"
                                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`relative z-10 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[8px] font-bold ${activeProtocolTab === tab.key
                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                        : 'bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-500 dark:text-zinc-400'
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

                        {/* TAB 1: Cotação Pendente - Apple Premium Design */}
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
                                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Estoque em dia</p>
                                        <p className="text-[10px] text-zinc-300 dark:text-zinc-600">Nenhuma cotação pendente</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {alertsBySupplier.map(({ supplier, items }) => (
                                            <motion.div
                                                key={supplier.id}
                                                className="rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-white/5 overflow-hidden hover:border-zinc-300 dark:hover:border-white/10 transition-all"
                                                whileHover={{ scale: 1.002 }}
                                            >
                                                {/* Supplier Header */}
                                                <div
                                                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 md:p-5 cursor-pointer"
                                                    onClick={() => openEmailComposer(supplier, items)}
                                                >
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="w-11 h-11 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 text-base font-semibold shrink-0">
                                                            {supplier.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{supplier.name}</p>
                                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{items.length} {items.length === 1 ? 'item' : 'itens'} abaixo do mínimo</p>
                                                        </div>
                                                    </div>
                                                    <button className="w-full md:w-auto px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                        Solicitar Cotação
                                                    </button>
                                                </div>

                                                {/* Items List */}
                                                <div className="border-t border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-zinc-900/20">
                                                    <div className="hidden md:grid grid-cols-3 gap-4 px-5 py-2 text-[9px] font-medium text-zinc-400 uppercase tracking-wider">
                                                        <span>Item</span>
                                                        <span className="text-center">Estoque Atual</span>
                                                        <span className="text-right">Quantidade a Pedir</span>
                                                    </div>
                                                    {items.map(item => {
                                                        const atual = item.totalQty || 0
                                                        const maximo = item.maxStock || 0
                                                        const pedir = Math.max(0, maximo - atual)
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 py-3 px-4 md:px-5 border-b border-zinc-100 dark:border-white/5 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                                                            >
                                                                <span className="col-span-2 md:col-span-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{item.name}</span>
                                                                <span className="text-xs text-zinc-400 md:text-center tabular-nums">
                                                                    <span className="md:hidden text-[10px] text-zinc-300 mr-1">Atual:</span>
                                                                    {atual.toFixed(0)}{item.unit || ''}
                                                                </span>
                                                                <span className="text-sm font-semibold text-zinc-900 dark:text-white md:text-right tabular-nums">
                                                                    <span className="md:hidden text-[10px] text-zinc-300 mr-1">Pedir:</span>
                                                                    +{pedir.toFixed(0)}{item.unit || ''}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* TAB 2: Aguardando - Com sub-estados */}
                        {activeProtocolTab === 'awaiting' && (
                            <motion.div
                                key="awaiting"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {sentEmails.filter(e => e.status === 'sent' || e.status === 'quoted').length === 0 ? (
                                    <motion.div
                                        className="py-16 md:py-24 text-center flex flex-col items-center gap-6"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                        {/* Animated Icon Container */}
                                        <motion.div
                                            className="relative"
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/10 flex items-center justify-center shadow-lg shadow-amber-500/10">
                                                <svg className="w-10 h-10 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                                </svg>
                                            </div>
                                            {/* Decorative rings */}
                                            <div className="absolute inset-0 rounded-3xl border-2 border-amber-200/30 dark:border-amber-500/10 animate-ping" style={{ animationDuration: '3s' }} />
                                        </motion.div>

                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">
                                                Nenhuma cotação em andamento
                                            </h3>
                                            <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                                                Envie uma nova cotação para fornecedores através da aba Pendente
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setActiveProtocolTab('pending')}
                                            className="mt-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                            Nova Cotação
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Sem Resposta Section */}
                                        {sentEmails.filter(e => e.status === 'sent').length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Aguardando Resposta</span>
                                                    <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 rounded text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                                        {sentEmails.filter(e => e.status === 'sent').length}
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {sentEmails.filter(e => e.status === 'sent').map((email) => (
                                                        <motion.div
                                                            key={email.id}
                                                            className="rounded-2xl bg-amber-50/30 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 overflow-hidden"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                        >
                                                            {/* Header */}
                                                            <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
                                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                    <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center text-white text-base font-semibold shrink-0 shadow-lg shadow-amber-500/20">
                                                                        {email.supplierName?.charAt(0)?.toUpperCase() || '?'}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{email.supplierName}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                                                                {/* Use items array, fallback to itemNames, or show "Cotação enviada" */}
                                                                                {email.items?.length > 0
                                                                                    ? `${email.items.length} itens solicitados`
                                                                                    : email.itemNames?.length > 0
                                                                                        ? `${email.itemNames.length} itens`
                                                                                        : 'Cotação enviada'
                                                                                }
                                                                            </span>
                                                                            <span className="text-[10px] text-zinc-300">•</span>
                                                                            <span className="text-[10px] text-zinc-400">
                                                                                {formatRelativeTime(email.sentAt)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedEmailForQuote(email)
                                                                            setQuoteDetails({ quotedValue: '', expectedDelivery: '' })
                                                                            setQuoteModalOpen(true)
                                                                        }}
                                                                        className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:bg-amber-600 transition-all shadow-md"
                                                                    >
                                                                        Registrar Cotação
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openEmailComposer(suppliers.find(s => s.name === email.supplierName) || { name: email.supplierName, email: email.to }, [])}
                                                                        className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                                                    >
                                                                        Reenviar
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Items List - Show what was ordered (with fallback for legacy data) */}
                                                            {email.items && email.items.length > 0 ? (
                                                                <div className="border-t border-amber-100 dark:border-amber-500/10 bg-white/50 dark:bg-zinc-900/30">
                                                                    <div className="hidden md:grid grid-cols-4 gap-4 px-5 py-2 text-[9px] font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-white/5">
                                                                        <span>Item</span>
                                                                        <span className="text-center">Estoque Atual</span>
                                                                        <span className="text-center">Máximo</span>
                                                                        <span className="text-right">Qtd. Solicitada</span>
                                                                    </div>
                                                                    {email.items.slice(0, 5).map((item, idx) => (
                                                                        <div
                                                                            key={item.id || idx}
                                                                            className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 py-2.5 px-4 md:px-5 border-b border-zinc-100 dark:border-white/5 last:border-b-0"
                                                                        >
                                                                            <span className="col-span-2 md:col-span-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{item.name}</span>
                                                                            <span className="text-xs text-zinc-400 md:text-center tabular-nums">
                                                                                <span className="md:hidden text-[10px] text-zinc-300 mr-1">Atual:</span>
                                                                                {item.currentStock}{item.unit}
                                                                            </span>
                                                                            <span className="text-xs text-zinc-400 md:text-center tabular-nums">
                                                                                <span className="md:hidden text-[10px] text-zinc-300 mr-1">Máx:</span>
                                                                                {item.maxStock}{item.unit}
                                                                            </span>
                                                                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 md:text-right tabular-nums">
                                                                                <span className="md:hidden text-[10px] text-zinc-300 mr-1">Pedido:</span>
                                                                                +{item.quantityToOrder}{item.unit}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {email.items.length > 5 && (
                                                                        <div className="px-5 py-2 text-[10px] text-zinc-400 text-center border-t border-zinc-100 dark:border-white/5">
                                                                            +{email.items.length - 5} mais itens
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : email.itemNames && email.itemNames.length > 0 ? (
                                                                /* Fallback for legacy emails with only itemNames */
                                                                <div className="border-t border-amber-100 dark:border-amber-500/10 bg-white/50 dark:bg-zinc-900/30 p-4">
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {email.itemNames.slice(0, 5).map((name, idx) => (
                                                                            <span key={idx} className="px-3 py-1.5 bg-amber-100/80 dark:bg-amber-500/20 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-300">
                                                                                {name}
                                                                            </span>
                                                                        ))}
                                                                        {email.itemNames.length > 5 && (
                                                                            <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs text-zinc-500">
                                                                                +{email.itemNames.length - 5} mais
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-zinc-400 mt-2 italic">
                                                                        * Detalhes de quantidade não disponíveis para cotações antigas
                                                                    </p>
                                                                </div>
                                                            ) : null}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Cotação Recebida Section */}
                                        {sentEmails.filter(e => e.status === 'quoted').length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Cotação Recebida</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {sentEmails.filter(e => e.status === 'quoted').map((email) => (
                                                        <motion.div
                                                            key={email.id}
                                                            className="rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 overflow-hidden"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                        >
                                                            <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 md:p-5">
                                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                                                                        {email.supplierName?.charAt(0)?.toUpperCase() || '?'}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{email.supplierName || email.to}</p>
                                                                        <p className="text-[10px] text-blue-600 dark:text-blue-400">
                                                                            {email.quotedValue ? (
                                                                                <>Cotação: <span className="font-bold">{formatCurrency(email.quotedValue)}</span></>
                                                                            ) : 'Aguardando aprovação'}
                                                                            {email.expectedDelivery && (
                                                                                <span className="ml-2 text-zinc-400">• Entrega: {formatDate(email.expectedDelivery, { month: 'short', day: '2-digit' })}</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {/* Problems Alert Badge */}
                                                                {email.hasProblems && (
                                                                    <div className="w-full px-4 py-2 bg-rose-50 dark:bg-rose-500/10 border-t border-rose-100 dark:border-rose-500/10 flex items-center gap-2">
                                                                        <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                        </svg>
                                                                        <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">
                                                                            {email.hasDelay && '⏰ Atraso na entrega • '}
                                                                            {email.problemSummary || 'Problemas detectados - verifique os detalhes'}
                                                                        </span>
                                                                        {email.urgency === 'high' && (
                                                                            <span className="ml-auto px-2 py-0.5 bg-rose-500 text-white rounded-full text-[8px] font-bold uppercase">Urgente</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {/* Quote Summary Badge */}
                                                                {email.quotedValue && (
                                                                    <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0 px-4">
                                                                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatCurrency(email.quotedValue)}</span>
                                                                        {email.expectedDelivery && (
                                                                            <span className="text-[9px] text-zinc-400 uppercase tracking-wider">
                                                                                Entrega: {formatDate(email.expectedDelivery, { month: 'short', day: '2-digit' })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            const updated = sentEmails.map(e => e.id === email.id ? { ...e, status: 'confirmed', confirmedAt: new Date().toISOString() } : e)
                                                                            setSentEmails(updated)
                                                                            localStorage.setItem('padoca_sent_emails', JSON.stringify(updated))
                                                                            showToast('✓ Ordem de compra criada!', 'success')
                                                                        }}
                                                                        className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:bg-blue-600 transition-all flex items-center gap-1.5"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                        Aprovar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const updated = sentEmails.map(e => e.id === email.id ? { ...e, status: 'sent', quotedValue: null, expectedDelivery: null } : e)
                                                                            setSentEmails(updated)
                                                                            localStorage.setItem('padoca_sent_emails', JSON.stringify(updated))
                                                                            showToast('Solicitando nova cotação...', 'info')
                                                                            openEmailComposer(suppliers.find(s => s.name === email.supplierName) || { name: email.supplierName, email: email.to }, [])
                                                                        }}
                                                                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                                                    >
                                                                        Nova Cotação
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* TAB 3: Ordens de Compra */}
                        {activeProtocolTab === 'ordered' && (
                            <motion.div
                                key="ordered"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {sentEmails.filter(e => e.status === 'confirmed').length === 0 ? (
                                    <motion.div
                                        className="py-16 md:py-24 text-center flex flex-col items-center gap-6"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <motion.div
                                            className="relative"
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-50 dark:from-indigo-500/20 dark:to-purple-500/10 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                                                <svg className="w-10 h-10 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                                </svg>
                                            </div>
                                        </motion.div>

                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">
                                                Nenhuma ordem de compra
                                            </h3>
                                            <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                                                Aprove cotações recebidas para criar ordens de compra
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setActiveProtocolTab('awaiting')}
                                            className="mt-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Ver Cotações
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-3">
                                        {sentEmails.filter(e => e.status === 'confirmed').map((email) => (
                                            <motion.div
                                                key={email.id}
                                                className="rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 overflow-hidden"
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 md:p-5">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{email.supplierName || email.to}</p>
                                                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                                                                Ordem criada em {formatDate(email.confirmedAt || email.sentAt, { month: 'short', day: '2-digit' })}
                                                                {email.expectedDelivery && (
                                                                    <span className="ml-2 text-zinc-400">• Entrega prev.: {formatDate(email.expectedDelivery, { month: 'short', day: '2-digit' })}</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* Value Badge */}
                                                    {email.quotedValue && (
                                                        <div className="hidden md:block px-4 py-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                                                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{formatCurrency(email.quotedValue)}</span>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            const updated = sentEmails.map(e => e.id === email.id ? { ...e, status: 'delivered', deliveredAt: new Date().toISOString() } : e)
                                                            setSentEmails(updated)
                                                            localStorage.setItem('padoca_sent_emails', JSON.stringify(updated))
                                                            showToast('📦 Produto recebido!', 'success')
                                                        }}
                                                        className="w-full md:w-auto px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                                        Confirmar Recebimento
                                                    </button>
                                                </div>
                                                {/* Mobile value display */}
                                                {email.quotedValue && (
                                                    <div className="md:hidden px-5 pb-4 flex items-center justify-between">
                                                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Valor:</span>
                                                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{formatCurrency(email.quotedValue)}</span>
                                                    </div>
                                                )}

                                                {/* Items List - Show what was ordered */}
                                                {email.items && email.items.length > 0 && (
                                                    <div className="border-t border-indigo-100 dark:border-indigo-500/10 bg-white/50 dark:bg-zinc-900/30">
                                                        <div className="hidden md:grid grid-cols-3 gap-4 px-5 py-2 text-[9px] font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-white/5">
                                                            <span>Item</span>
                                                            <span className="text-center">Quantidade Solicitada</span>
                                                            <span className="text-right">Unidade</span>
                                                        </div>
                                                        {email.items.slice(0, 4).map((item, idx) => (
                                                            <div
                                                                key={item.id || idx}
                                                                className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 py-2.5 px-4 md:px-5 border-b border-zinc-100 dark:border-white/5 last:border-b-0"
                                                            >
                                                                <span className="col-span-2 md:col-span-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{item.name}</span>
                                                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 md:text-center tabular-nums">
                                                                    {item.quantityToOrder}{item.unit}
                                                                </span>
                                                                <span className="text-xs text-zinc-400 md:text-right">{item.unit || '—'}</span>
                                                            </div>
                                                        ))}
                                                        {email.items.length > 4 && (
                                                            <div className="px-5 py-2 text-[10px] text-zinc-400 text-center">
                                                                +{email.items.length - 4} mais itens
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* TAB 4: Recebido */}
                        {activeProtocolTab === 'received' && (
                            <motion.div
                                key="received"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {sentEmails.filter(e => e.status === 'delivered').length === 0 ? (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                        </div>
                                        <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Nenhum recebimento</p>
                                        <p className="text-[10px] text-zinc-300 dark:text-zinc-600">Confirme entregas na aba "Ordens"</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {sentEmails.filter(e => e.status === 'delivered').map((email) => (
                                            <motion.div
                                                key={email.id}
                                                className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 overflow-hidden"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 md:p-5">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{email.supplierName || email.to}</p>
                                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                                                Recebido em {formatDate(email.deliveredAt || email.sentAt, { month: 'short', day: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* Value Badge */}
                                                    {email.quotedValue && (
                                                        <div className="hidden md:block px-4 py-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
                                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(email.quotedValue)}</span>
                                                        </div>
                                                    )}
                                                    <div className="shrink-0">
                                                        <span className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                                            ✓ Recebido
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Mobile value display */}
                                                {email.quotedValue && (
                                                    <div className="md:hidden px-5 pb-4 flex items-center justify-between border-t border-emerald-100 dark:border-emerald-500/10 pt-3">
                                                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Valor pago:</span>
                                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(email.quotedValue)}</span>
                                                    </div>
                                                )}

                                                {/* Items List - Show what was received */}
                                                {email.items && email.items.length > 0 && (
                                                    <div className="border-t border-emerald-100 dark:border-emerald-500/10 bg-white/50 dark:bg-zinc-900/30">
                                                        <div className="hidden md:grid grid-cols-2 gap-4 px-5 py-2 text-[9px] font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-white/5">
                                                            <span>Item Recebido</span>
                                                            <span className="text-right">Quantidade</span>
                                                        </div>
                                                        {email.items.slice(0, 3).map((item, idx) => (
                                                            <div
                                                                key={item.id || idx}
                                                                className="flex items-center justify-between py-2.5 px-4 md:px-5 border-b border-zinc-100 dark:border-white/5 last:border-b-0"
                                                            >
                                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                    {item.name}
                                                                </span>
                                                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                                    {item.quantityToOrder}{item.unit}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {email.items.length > 3 && (
                                                            <div className="px-5 py-2 text-[10px] text-zinc-400 text-center">
                                                                +{email.items.length - 3} mais itens
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                                            {sentEmails.slice(0, 20).map((email) => {
                                                const statusConfig = {
                                                    sent: { color: 'amber', icon: '◔', label: 'Sem Resposta' },
                                                    quoted: { color: 'blue', icon: '◑', label: 'Cotado' },
                                                    confirmed: { color: 'indigo', icon: '◕', label: 'Em Ordem' },
                                                    delivered: { color: 'emerald', icon: '●', label: 'Recebido' }
                                                }
                                                const status = statusConfig[email.status] || statusConfig.sent

                                                return (
                                                    <motion.div
                                                        key={email.id}
                                                        className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 rounded-2xl bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-100/50 dark:border-white/5"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                    >
                                                        {/* Status */}
                                                        <div className="md:col-span-1 flex items-center gap-2">
                                                            <div className={`w-8 h-8 rounded-lg bg-${status.color}-100 dark:bg-${status.color}-500/10 flex items-center justify-center text-sm shrink-0`}>
                                                                {status.icon}
                                                            </div>
                                                            <span className={`md:hidden text-[10px] font-semibold text-${status.color}-600 dark:text-${status.color}-400`}>{status.label}</span>
                                                        </div>

                                                        {/* Supplier */}
                                                        <div className="md:col-span-3 flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 text-sm font-semibold shrink-0">
                                                                {email.supplierName?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{email.supplierName || 'Fornecedor'}</p>
                                                                <p className="text-[10px] text-zinc-400 truncate">{email.to}</p>
                                                            </div>
                                                        </div>

                                                        {/* Items - Show names AND quantities */}
                                                        <div className="md:col-span-3 flex flex-col gap-1">
                                                            {/* Use new items array if available, fallback to itemNames */}
                                                            {email.items && email.items.length > 0 ? (
                                                                <>
                                                                    {email.items.slice(0, 2).map((item, i) => (
                                                                        <div key={item.id || i} className="flex items-center justify-between">
                                                                            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 truncate max-w-[100px]">{item.name}</span>
                                                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tabular-nums ml-2">+{item.quantityToOrder}{item.unit}</span>
                                                                        </div>
                                                                    ))}
                                                                    {email.items.length > 2 && (
                                                                        <span className="text-[9px] text-zinc-400">+{email.items.length - 2} mais</span>
                                                                    )}
                                                                </>
                                                            ) : (email.itemNames || []).length > 0 ? (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {(email.itemNames || []).slice(0, 2).map((name, i) => (
                                                                        <span key={i} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-[9px] font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[80px]">
                                                                            {name}
                                                                        </span>
                                                                    ))}
                                                                    {(email.itemNames?.length || 0) > 2 && (
                                                                        <span className="text-[9px] text-zinc-400">+{email.itemNames.length - 2}</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-zinc-300 dark:text-zinc-600">—</span>
                                                            )}
                                                            {/* Show total value if available */}
                                                            {email.quotedValue && (
                                                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                                                                    Total: {formatCurrency(email.quotedValue)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Sent Date */}
                                                        <div className="md:col-span-2 flex items-center">
                                                            <div>
                                                                <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                                                                    {formatDate(email.sentAt, { day: '2-digit', month: 'short' })}
                                                                </p>
                                                                <p className="text-[9px] text-zinc-400">
                                                                    {formatTime(email.sentAt)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Status Badge */}
                                                        <div className="md:col-span-2 flex items-center">
                                                            <div>
                                                                <p className={`text-[11px] font-medium text-${status.color}-600 dark:text-${status.color}-400`}>
                                                                    {status.label}
                                                                </p>
                                                                <p className="text-[9px] text-zinc-400">
                                                                    {email.deliveredAt
                                                                        ? formatDate(email.deliveredAt, { day: '2-digit', month: 'short' })
                                                                        : email.confirmedAt
                                                                            ? formatDate(email.confirmedAt, { day: '2-digit', month: 'short' })
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
            </section >

            {/* Email Composer Modal - Matching exactly Costs.jsx modal pattern */}
            < AnimatePresence >
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
                )
                }
            </AnimatePresence >

            {/* Email Success Modal */}
            {
                showSuccessModal && lastSentEmail && createPortal(
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
                )
            }

            {/* Premium Toast - EXACT match from Costs.jsx */}

            {/* Quote Details Modal - Apple Premium Design */}
            <AnimatePresence>
                {quoteModalOpen && selectedEmailForQuote && createPortal(
                    <motion.div
                        key="quote-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                        onClick={() => setQuoteModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-zinc-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white text-lg font-semibold shrink-0">
                                        {selectedEmailForQuote.supplierName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Detalhes da Cotação</h3>
                                        <p className="text-sm text-zinc-500">{selectedEmailForQuote.supplierName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="p-6 space-y-5">
                                {/* Quoted Value */}
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                        Valor Cotado (CAD)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={quoteDetails.quotedValue}
                                            onChange={e => setQuoteDetails(d => ({ ...d, quotedValue: e.target.value }))}
                                            className="w-full pl-8 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl text-lg font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Expected Delivery */}
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                        Data de Entrega Prevista
                                    </label>
                                    <input
                                        type="date"
                                        value={quoteDetails.expectedDelivery}
                                        onChange={e => setQuoteDetails(d => ({ ...d, expectedDelivery: e.target.value }))}
                                        className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl text-base font-medium text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                                    />
                                </div>

                                {/* Items Preview */}
                                {selectedEmailForQuote.itemNames?.length > 0 && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                            Itens
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedEmailForQuote.itemNames.map((name, i) => (
                                                <span key={i} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                                                    {name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 pt-0 space-y-2">
                                <button
                                    onClick={() => {
                                        const updated = sentEmails.map(e => e.id === selectedEmailForQuote.id ? {
                                            ...e,
                                            status: 'quoted',
                                            quotedAt: new Date().toISOString(),
                                            quotedValue: quoteDetails.quotedValue ? parseFloat(quoteDetails.quotedValue) : null,
                                            expectedDelivery: quoteDetails.expectedDelivery || null
                                        } : e)
                                        setSentEmails(updated)
                                        localStorage.setItem('padoca_sent_emails', JSON.stringify(updated))
                                        setQuoteModalOpen(false)
                                        setSelectedEmailForQuote(null)
                                        showToast(quoteDetails.quotedValue ? `Cotação de ${formatCurrency(quoteDetails.quotedValue)} registrada!` : 'Cotação recebida!', 'success')
                                    }}
                                    className="w-full py-4 bg-blue-500 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    Confirmar Cotação
                                </button>
                                <button
                                    onClick={() => {
                                        setQuoteModalOpen(false)
                                        setSelectedEmailForQuote(null)
                                    }}
                                    className="w-full py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>
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
        </div >
    )
}
