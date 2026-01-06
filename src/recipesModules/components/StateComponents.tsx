// ═══════════════════════════════════════════════════════════════════
// RECIPES MODULE — State Components
// Loading and Error states for Recipes
// ═══════════════════════════════════════════════════════════════════

export function LoadingState() {
    return (
        <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-zinc-200/80 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Carregando receitas...</p>
            </div>
        </div>
    )
}

interface ErrorStateProps {
    error: string
}

export function ErrorState({ error }: ErrorStateProps) {
    return (
        <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-6">
            <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Erro de Conexão</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">{error}</p>
                <button onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm uppercase tracking-wide hover:scale-105 active:scale-95 transition-transform">
                    Tentar Novamente
                </button>
            </div>
        </div>
    )
}
