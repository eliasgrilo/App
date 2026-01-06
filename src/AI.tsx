// ═══════════════════════════════════════════════════════════════════
// AI INTELLIGENCE — Premium Automation Dashboard
// Refactored: 892 → <200 lines
// ═══════════════════════════════════════════════════════════════════

import {
    useAIState,
    useAIHandlers,
    AIHeader,
    AIHealthCard,
    AIStatsCards,
    SupplierAlertsSection,
    EmailComposerModal,
    EmailSuccessModal,
    EmailHistorySection,
    QuotationManagementSection
} from './aiModules'

export default function AI() {
    // State management hook
    const state = useAIState()

    // Handlers hook
    const handlers = useAIHandlers({
        selectedSupplier: state.selectedSupplier,
        emailDraft: state.emailDraft,
        sentEmails: state.sentEmails,
        setIsComposerOpen: state.setIsComposerOpen,
        setSelectedSupplier: state.setSelectedSupplier,
        setEmailDraft: state.setEmailDraft,
        setSentEmails: state.setSentEmails,
        setIsSendingEmail: state.setIsSendingEmail,
        setShowSuccessModal: state.setShowSuccessModal,
        setLastSentEmail: state.setLastSentEmail,
        showToast: state.showToast
    })

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <AIHeader
                syncStatus={state.syncStatus}
                alertsBySupplier={state.alertsBySupplier}
                showToast={state.showToast}
                openEmailComposer={handlers.openEmailComposer}
            />

            {/* Dashboard */}
            <section className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                <AIHealthCard stats={state.stats} scoreColor={state.scoreColor} />
                <AIStatsCards stats={state.stats} />
            </section>

            {/* Supplier Alerts */}
            <SupplierAlertsSection
                alertsBySupplier={state.alertsBySupplier}
                openEmailComposer={handlers.openEmailComposer}
            />

            {/* Email History */}
            <EmailHistorySection sentEmails={state.sentEmails} />

            {/* Quotation Management */}
            <QuotationManagementSection
                quotationTab={state.quotationTab}
                setQuotationTab={state.setQuotationTab}
                showToast={state.showToast}
            />

            {/* Email Composer Modal */}
            <EmailComposerModal
                isOpen={state.isComposerOpen}
                selectedSupplier={state.selectedSupplier}
                emailDraft={state.emailDraft}
                isSendingEmail={state.isSendingEmail}
                onClose={() => state.setIsComposerOpen(false)}
                onEmailChange={state.setEmailDraft}
                onSend={handlers.handleSendEmail}
                onCopy={handlers.copyEmailToClipboard}
            />

            {/* Email Success Modal */}
            <EmailSuccessModal
                isOpen={state.showSuccessModal}
                lastSentEmail={state.lastSentEmail}
                onClose={() => state.setShowSuccessModal(false)}
            />
        </div>
    )
}
