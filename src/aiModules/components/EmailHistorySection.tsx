// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Email History Section Component
// ═══════════════════════════════════════════════════════════════════

import type { SentEmail } from '../types'

interface EmailHistorySectionProps {
    sentEmails: SentEmail[]
}

export function EmailHistorySection({ sentEmails }: EmailHistorySectionProps) {
    if (sentEmails.length === 0) return null

    return (
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
    )
}
