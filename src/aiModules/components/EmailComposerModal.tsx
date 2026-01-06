// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Email Composer Modal Component
// ═══════════════════════════════════════════════════════════════════

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ModalScrollLock from '../../components/ModalScrollLock'
import type { Supplier } from '../../types'
import type { EmailDraft } from '../types'
import { EmailFormFields } from './EmailFormFields'

interface EmailComposerModalProps {
    isOpen: boolean
    selectedSupplier: Supplier | null
    emailDraft: EmailDraft
    isSendingEmail: boolean
    onClose: () => void
    onEmailChange: (draft: EmailDraft | ((d: EmailDraft) => EmailDraft)) => void
    onSend: () => void
    onCopy: () => void
}

export function EmailComposerModal({ isOpen, selectedSupplier, emailDraft, isSendingEmail, onClose, onEmailChange, onSend, onCopy }: EmailComposerModalProps) {
    return (
        <AnimatePresence>
            {isOpen && createPortal(
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-start md:items-center justify-center p-4 pt-20 md:pt-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />

                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-zinc-100 dark:bg-zinc-900 w-full max-w-lg rounded-2xl md:rounded-[2rem] shadow-2xl border border-zinc-200/50 dark:border-white/5 flex flex-col overflow-hidden max-h-[85vh]">
                        <ModalScrollLock />

                        <div className="md:hidden w-full flex justify-center pt-4 pb-1 shrink-0">
                            <div className="w-8 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800"></div>
                        </div>

                        <div className="px-6 py-4 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Compor Email</h3>
                                <p className="text-xs text-zinc-500">{selectedSupplier?.name}</p>
                            </div>
                            <button onClick={onClose}
                                className="w-11 h-11 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90 touch-manipulation">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar flex-1 pb-10">
                            <div className="space-y-6 px-4 animate-fade-in">
                                <EmailFormFields emailDraft={emailDraft} onEmailChange={onEmailChange} />

                                <div className="flex flex-col gap-2 pt-2">
                                    <button onClick={onSend} disabled={isSendingEmail || !emailDraft.to}
                                        className={`w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${isSendingEmail ? 'bg-emerald-500 text-white cursor-wait' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 active:scale-95'} disabled:opacity-50`}>
                                        {isSendingEmail ? (
                                            <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Enviando...</>
                                        ) : (
                                            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Enviar Email</>
                                        )}
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={onCopy} className="py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">Copiar</button>
                                        <button onClick={onClose} className="py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all">Cancelar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>,
                document.body
            )}
        </AnimatePresence>
    )
}
