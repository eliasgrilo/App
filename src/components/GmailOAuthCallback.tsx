// ═════════════════════════════════════════════════════════════════════
// GMAIL OAUTH CALLBACK — Handle OAuth redirect
// Extracts authorization code and completes authentication
// ═════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { useGmailStore } from '../stores/useGmailStore'
import { handleGmailOAuthCallback } from '../services/gmailAuth'

export function GmailOAuthCallback() {
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
    const [message, setMessage] = useState('Conectando...')
    const store = useGmailStore()

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Get code and state from URL
                const params = new URLSearchParams(window.location.search)
                const code = params.get('code')
                const state = params.get('state')
                const error = params.get('error')

                // Check for errors
                if (error) {
                    throw new Error(
                        error === 'access_denied'
                            ? 'Você negou o acesso ao Gmail'
                            : `Erro: ${error}`
                    )
                }

                if (!code || !state) {
                    throw new Error('Código de autorização inválido')
                }

                // Exchange code for tokens
                setMessage('Obtendo tokens...')
                const tokens = await handleGmailOAuthCallback(code, state)

                // Save to store
                store.setTokens(tokens)

                setStatus('success')
                setMessage('Gmail conectado com sucesso!')

                // Close popup after success
                setTimeout(() => {
                    if (window.opener) {
                        window.opener.postMessage({ type: 'gmail-auth-success' }, window.location.origin)
                        window.close()
                    } else {
                        // Not in popup, redirect to main app
                        window.location.href = '/'
                    }
                }, 1500)

            } catch (err) {
                console.error('OAuth callback error:', err)
                setStatus('error')
                setMessage(err instanceof Error ? err.message : 'Falha na autenticação')

                // Close popup after error
                setTimeout(() => {
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'gmail-auth-error',
                            error: err instanceof Error ? err.message : 'Unknown error'
                        }, window.location.origin)
                        window.close()
                    }
                }, 3000)
            }
        }

        processCallback()
    }, [store])

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <div className="max-w-md w-full mx-auto p-8 text-center">
                {status === 'processing' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 mx-auto">
                            <svg className="animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                                Conectando Gmail
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400">{message}</p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                            <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                                Sucesso!
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400">{message}</p>
                            <p className="text-sm text-zinc-400 mt-4">Esta janela será fechada automaticamente...</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                                Erro
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400">{message}</p>
                            <button
                                onClick={() => window.close()}
                                className="mt-6 px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold hover:scale-105 transition-transform"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
