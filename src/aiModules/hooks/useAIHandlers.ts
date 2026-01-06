// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Handlers Hook
// ═══════════════════════════════════════════════════════════════════

import { useCallback } from 'react'
import type { Supplier } from '../../types'
import type { AlertItem, EmailDraft, SentEmail } from '../types'

interface UseAIHandlersProps {
    selectedSupplier: Supplier | null
    emailDraft: EmailDraft
    sentEmails: SentEmail[]
    setIsComposerOpen: (open: boolean) => void
    setSelectedSupplier: (supplier: Supplier | null) => void
    setEmailDraft: (draft: EmailDraft | ((d: EmailDraft) => EmailDraft)) => void
    setSentEmails: (emails: SentEmail[] | ((e: SentEmail[]) => SentEmail[])) => void
    setIsSendingEmail: (sending: boolean) => void
    setShowSuccessModal: (show: boolean) => void
    setLastSentEmail: (email: SentEmail | null) => void
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function useAIHandlers({
    selectedSupplier,
    emailDraft,
    sentEmails,
    setIsComposerOpen,
    setSelectedSupplier,
    setEmailDraft,
    setSentEmails,
    setIsSendingEmail,
    setShowSuccessModal,
    setLastSentEmail,
    showToast
}: UseAIHandlersProps) {

    // Generate email content
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

    // Open email composer
    const openEmailComposer = useCallback((supplier: Supplier, items: AlertItem[]): void => {
        const email = generateEmail(supplier, items)
        setSelectedSupplier(supplier)
        setEmailDraft(email)
        setIsComposerOpen(true)
    }, [generateEmail, setSelectedSupplier, setEmailDraft, setIsComposerOpen])

    // Send email
    const handleSendEmail = useCallback(async () => {
        if (!emailDraft.to) {
            showToast('Email do fornecedor não cadastrado', 'error')
            return
        }

        setIsSendingEmail(true)
        await new Promise(resolve => setTimeout(resolve, 1500))

        const newEmail: SentEmail = {
            id: Date.now().toString(),
            ...emailDraft,
            supplierName: selectedSupplier?.name,
            sentAt: new Date().toISOString(),
            status: 'sent'
        }

        setSentEmails([newEmail, ...sentEmails])
        setIsSendingEmail(false)
        setIsComposerOpen(false)
        setLastSentEmail(newEmail)
        setShowSuccessModal(true)
        setSelectedSupplier(null)
        setEmailDraft({ to: '', subject: '', body: '' })
    }, [emailDraft, selectedSupplier, sentEmails, setIsSendingEmail, setSentEmails, setIsComposerOpen, setLastSentEmail, setShowSuccessModal, setSelectedSupplier, setEmailDraft, showToast])

    // Copy email to clipboard
    const copyEmailToClipboard = useCallback(() => {
        const fullText = `Para: ${emailDraft.to}\nAssunto: ${emailDraft.subject}\n\n${emailDraft.body}`
        navigator.clipboard.writeText(fullText)
        showToast('Email copiado para área de transferência!')
    }, [emailDraft, showToast])

    return {
        generateEmail,
        openEmailComposer,
        handleSendEmail,
        copyEmailToClipboard
    }
}
