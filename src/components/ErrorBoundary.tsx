import { Component, ReactNode, ErrorInfo } from 'react'
import { motion } from 'framer-motion'

/**
 * ═══════════════════════════════════════════════════════════════════
 * ERROR BOUNDARY — Graceful Error Handling
 * ═══════════════════════════════════════════════════════════════════
 */

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo })
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center"
                >
                    <div className="w-16 h-16 mb-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-rose-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                        Ops! Algo deu errado
                    </h2>

                    <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm">
                        Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
                    </p>

                    <div className="flex gap-3">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={this.handleReset}
                            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors"
                        >
                            Tentar Novamente
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Recarregar
                        </motion.button>
                    </div>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mt-8 text-left w-full max-w-lg">
                            <summary className="cursor-pointer text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                Ver detalhes do erro
                            </summary>
                            <pre className="mt-2 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-xs overflow-auto text-rose-600 dark:text-rose-400">
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                </motion.div>
            )
        }

        return this.props.children
    }
}

interface SectionErrorBoundaryProps {
    children: ReactNode
    name?: string
}

export const SectionErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ children, name = 'Esta seção' }) => (
    <ErrorBoundary
        fallback={
            <div className="p-6 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {name} não pôde ser carregada
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-3 text-sm text-indigo-500 hover:text-indigo-600 font-medium"
                >
                    Recarregar página
                </button>
            </div>
        }
    >
        {children}
    </ErrorBoundary>
)

export default ErrorBoundary
