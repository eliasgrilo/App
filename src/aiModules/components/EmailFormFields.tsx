// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Email Form Fields Component
// ═══════════════════════════════════════════════════════════════════

import type { EmailDraft } from '../types'

interface EmailFormFieldsProps {
    emailDraft: EmailDraft
    onEmailChange: (draft: EmailDraft | ((d: EmailDraft) => EmailDraft)) => void
}

export function EmailFormFields({ emailDraft, onEmailChange }: EmailFormFieldsProps) {
    return (
        <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/80 dark:border-white/5 overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-zinc-100/80 dark:border-white/5">
                <label htmlFor="email-to-field" className="w-20 text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Para</label>
                <input id="email-to-field" className="flex-1 bg-transparent border-none py-1 text-sm font-semibold text-zinc-800 dark:text-white outline-none placeholder:text-zinc-300"
                    value={emailDraft.to} onChange={e => onEmailChange(d => ({ ...d, to: e.target.value }))} placeholder="email@fornecedor.com" />
            </div>
            <div className="flex items-center px-4 py-3 border-b border-zinc-100/80 dark:border-white/5">
                <label htmlFor="email-subject-field" className="w-20 text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Assunto</label>
                <input id="email-subject-field" className="flex-1 bg-transparent border-none py-1 text-sm font-semibold text-zinc-800 dark:text-white outline-none placeholder:text-zinc-300"
                    value={emailDraft.subject} onChange={e => onEmailChange(d => ({ ...d, subject: e.target.value }))} placeholder="Assunto do email" />
            </div>
            <div className="px-4 py-3">
                <label htmlFor="email-body-field" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Mensagem</label>
                <textarea id="email-body-field" className="w-full bg-transparent border-none py-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 outline-none resize-none leading-relaxed min-h-[200px]"
                    value={emailDraft.body} onChange={e => onEmailChange(d => ({ ...d, body: e.target.value }))} placeholder="Conteúdo do email..." />
            </div>
        </div>
    )
}
