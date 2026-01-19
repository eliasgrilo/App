// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Header Component with Gmail OAuth
// ══════════════════════════════════════════════════════════════════

import { useGmailAuth } from '../../hooks/useGmailAuth'
import type { SyncStatus, SupplierGroupWithSupplier, AlertItem } from '../types'
import type { Supplier } from '../../types'

interface AIHeaderProps {
    syncStatus: SyncStatus
    alertsBySupplier: SupplierGroupWithSupplier[]
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
    openEmailComposer: (supplier: Supplier, items: AlertItem[]) => void
}

export function AIHeader({ syncStatus, alertsBySupplier, showToast, openEmailComposer }: AIHeaderProps) {
    const { isConnected, userEmail, isConnecting, connect, disconnect, error } = useGmailAuth()

    const handleGmailClick = async () => {
        if (isConnected) {
            // Disconnect
            await disconnect()
            showToast('Gmail desconectado', 'info')
        } else {
            // Connect
            try {
                await connect()
                // Success will be handled by callback
            } catch (err) {
                showToast(error || 'Falha ao conectar Gmail', 'error')
            }
        }
    }

    return (
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Inteligência</h1>
                    <div className={`mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 ${syncStatus === 'syncing'
                        ? 'bg-amber-500/5 border-amber-500/10 text-amber-500 animate-pulse'
                        : syncStatus === 'error'
                            ? 'bg-red-500/5 border-red-500/10 text-red-500'
                            : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80'
                        }`}>
                        <div className={`w-1 h-1 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500' : syncStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                            {syncStatus === 'syncing' ? 'Cloud Syncing' : syncStatus === 'error' ? 'Sync Error' : 'Cloud Active'}
                        </span>
                    </div>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Automação e insights em tempo real</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleGmailClick}
                    disabled={isConnecting}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer group ${isConnected
                            ? 'bg-emerald-50/80 dark:bg-emerald-900/15 border-emerald-200/40 dark:border-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-900/25'
                            : 'bg-amber-50/80 dark:bg-amber-900/15 border-amber-200/40 dark:border-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-900/25'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <div className="flex items-center gap-2">
                        {isConnecting ? (
                            <svg className="w-4 h-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        )}
                        <svg className={`w-4 h-4 ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z" />
                        </svg>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className={`text-[10px] font-semibold group-hover:underline ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {isConnecting ? 'Conectando...' : isConnected ? 'Gmail Conectado' : 'Conectar Gmail'}
                        </span>
                        <span className={`text-[9px] ${isConnected ? 'text-emerald-500/60' : 'text-amber-500/60'}`}>
                            {isConnected ? userEmail || 'Conectado' : 'Para detectar respostas'}
                        </span>
                    </div>
                </button>

                <button
                    onClick={() => alertsBySupplier.length > 0 && alertsBySupplier[0]?.supplier && openEmailComposer(alertsBySupplier[0].supplier, alertsBySupplier[0]?.items ?? [])}
                    disabled={alertsBySupplier.length === 0}
                    className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Notificar Fornecedores
                </button>
            </div>
        </div>
    )
}
