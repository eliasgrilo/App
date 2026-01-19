// ═════════════════════════════════════════════════════════════════════
// GMAIL OAUTH STORE — Production-Grade State Management
// Zero tolerance for errors. Apple engineering standards.
// ═════════════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GmailTokens {
    accessToken: string
    refreshToken: string
    expiresAt: number
}

interface GmailState {
    // Connection state
    isConnected: boolean
    userEmail: string | null

    // Tokens (access token in memory only for security)
    accessToken: string | null
    refreshToken: string | null
    expiresAt: number | null

    // Actions
    setTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number; email: string }) => void
    clearTokens: () => void
    isTokenExpired: () => boolean
    updateAccessToken: (accessToken: string, expiresIn: number) => void
}

export const useGmailStore = create<GmailState>()(
    persist(
        (set, get) => ({
            // Initial state
            isConnected: false,
            userEmail: null,
            accessToken: null,
            refreshToken: null,
            expiresAt: null,

            // Set tokens after successful OAuth
            setTokens: ({ accessToken, refreshToken, expiresIn, email }) => {
                const expiresAt = Date.now() + (expiresIn * 1000)
                set({
                    isConnected: true,
                    userEmail: email,
                    accessToken,
                    refreshToken,
                    expiresAt
                })
            },

            // Clear all tokens (disconnect)
            clearTokens: () => {
                set({
                    isConnected: false,
                    userEmail: null,
                    accessToken: null,
                    refreshToken: null,
                    expiresAt: null
                })
            },

            // Check if access token is expired
            isTokenExpired: () => {
                const { expiresAt } = get()
                if (!expiresAt) return true
                // Consider expired if less than 5 minutes remaining
                return Date.now() >= (expiresAt - 5 * 60 * 1000)
            },

            // Update access token after refresh
            updateAccessToken: (accessToken, expiresIn) => {
                const expiresAt = Date.now() + (expiresIn * 1000)
                set({ accessToken, expiresAt })
            }
        }),
        {
            name: 'gmail-auth-storage',
            // Only persist refresh token and email (security best practice)
            partialize: (state) => ({
                refreshToken: state.refreshToken,
                userEmail: state.userEmail,
                isConnected: state.isConnected
            })
        }
    )
)
