// ═════════════════════════════════════════════════════════════════════
// GMAIL AUTH HOOK — React Hook for Gmail OAuth
// Provides easy-to-use interface for components
// ═════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { useGmailStore } from '../stores/useGmailStore'
import { initiateGmailOAuth, revokeGmailAccess, refreshGmailAccessToken } from '../services/gmailAuth'

export function useGmailAuth() {
    const store = useGmailStore()
    const [isConnecting, setIsConnecting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /**
     * Auto-refresh token if expired on mount
     */
    useEffect(() => {
        const checkAndRefreshToken = async () => {
            if (store.isConnected && store.refreshToken && store.isTokenExpired()) {
                try {
                    const { accessToken, expiresIn } = await refreshGmailAccessToken(store.refreshToken)
                    store.updateAccessToken(accessToken, expiresIn)
                } catch (err) {
                    console.error('Failed to refresh token:', err)
                    // If refresh fails, user needs to re-authenticate
                    store.clearTokens()
                }
            }
        }

        checkAndRefreshToken()
    }, [store])

    /**
     * DEV_MODE: Listen for simulated auth success
     */
    useEffect(() => {
        const handleDevAuth = (event: MessageEvent) => {
            if (event.data?.type === 'gmail-auth-dev-success' && event.data?.tokens) {
                const { tokens } = event.data
                store.setTokens({
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn,
                    email: tokens.email
                })
                setIsConnecting(false)
                setError(null)
            }
        }

        window.addEventListener('message', handleDevAuth)
        return () => window.removeEventListener('message', handleDevAuth)
    }, [store])

    /**
     * Connect to Gmail - Start OAuth flow
     */
    const connect = useCallback(async () => {
        setIsConnecting(true)
        setError(null)

        try {
            await initiateGmailOAuth()
            // Token handling happens in callback route
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Falha ao conectar com Gmail'
            setError(errorMessage)
            console.error('Gmail OAuth error:', err)
        } finally {
            setIsConnecting(false)
        }
    }, [])

    /**
     * Disconnect from Gmail - Revoke access
     */
    const disconnect = useCallback(async () => {
        try {
            if (store.refreshToken) {
                await revokeGmailAccess(store.refreshToken)
            }
        } catch (err) {
            console.error('Failed to revoke access:', err)
            // Still clear local tokens even if revoke fails
        } finally {
            store.clearTokens()
        }
    }, [store])

    /**
     * Get valid access token (auto-refresh if needed)
     */
    const getAccessToken = useCallback(async (): Promise<string | null> => {
        if (!store.isConnected || !store.refreshToken) {
            return null
        }

        // Refresh if expired
        if (store.isTokenExpired()) {
            try {
                const { accessToken, expiresIn } = await refreshGmailAccessToken(store.refreshToken)
                store.updateAccessToken(accessToken, expiresIn)
                return accessToken
            } catch (err) {
                console.error('Failed to refresh token:', err)
                store.clearTokens()
                return null
            }
        }

        return store.accessToken
    }, [store])

    return {
        // State
        isConnected: store.isConnected,
        userEmail: store.userEmail,
        isConnecting,
        error,

        // Actions
        connect,
        disconnect,
        getAccessToken,
        clearError: () => setError(null)
    }
}
