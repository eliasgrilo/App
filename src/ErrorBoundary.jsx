import React from 'react'

/**
 * ErrorBoundary - Catches React errors and prevents full app crashes
 * Apple-quality error handling with graceful fallback UI
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-6">
                    <div className="max-w-md text-center">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">
                            Algo deu errado
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                            Desculpe, encontramos um erro inesperado. Tente recarregar a página.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-sm uppercase tracking-wide shadow-xl hover:scale-105 active:scale-95 transition-transform"
                        >
                            Recarregar Página
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <details className="mt-8 text-left">
                                <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300">
                                    Detalhes do erro (dev)
                                </summary>
                                <pre className="mt-4 p-4 bg-zinc-900 text-zinc-100 text-xs rounded-xl overflow-auto">
                                    {this.state.error?.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
