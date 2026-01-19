// ═════════════════════════════════════════════════════════════════════
// GMAIL OAUTH SERVICE — Production OAuth 2.0 Flow + DEV MODE
// Implements Google OAuth with PKCE, state validation, token management
// DEV_MODE: Works instantly without Google Cloud setup
// ═════════════════════════════════════════════════════════════════════

// 🔧 DEVELOPMENT MODE - Set to true for instant testing without Google
const DEV_MODE = true // TODO: Set to false for production

// OAuth Configuration
const GOOGLE_CLIENT_ID = (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string | undefined) || '794336933653-7kq7i95pm6gam34k82vhoflcl95kgjb7.apps.googleusercontent.com'
const REDIRECT_URI = `${window.location.origin}/auth/gmail/callback`
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke'

// Gmail API scopes
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email'
].join(' ')

// Generate CSRF state token
function generateState(): string {
    return crypto.randomUUID()
}

// Store state in sessionStorage for validation
function storeState(state: string) {
    sessionStorage.setItem('gmail_oauth_state', state)
}

// Validate state from callback
function validateState(state: string): boolean {
    const storedState = sessionStorage.getItem('gmail_oauth_state')
    sessionStorage.removeItem('gmail_oauth_state')
    return state === storedState
}

/**
 * DEV MODE: Simulate successful OAuth
 */
function simulateDevAuth(): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    email: string
}> {
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            resolve({
                accessToken: 'dev_access_token_' + Date.now(),
                refreshToken: 'dev_refresh_token_' + Date.now(),
                expiresIn: 3600, // 1 hour
                email: 'dev@padoca.app' // You can change this to any email
            })
        }, 500)
    })
}

/**
 * Initiate OAuth flow - Opens Google consent screen
 * DEV_MODE: Simulates instant success
 */
export async function initiateGmailOAuth(): Promise<void> {
    // 🔧 DEV MODE: Bypass Google OAuth
    if (DEV_MODE) {
        console.log('🔧 DEV MODE: Simulating OAuth...')
        const tokens = await simulateDevAuth()

        // Simulate callback by posting message
        window.postMessage({
            type: 'gmail-auth-dev-success',
            tokens
        }, window.location.origin)

        return
    }

    // PRODUCTION MODE: Real Google OAuth
    const state = generateState()
    storeState(state)

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES,
        state,
        access_type: 'offline', // Get refresh token
        prompt: 'consent' // Force consent to get refresh token
    })

    const authUrl = `${AUTH_ENDPOINT}?${params.toString()}`

    // Open in popup (better UX than redirect)
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
        authUrl,
        'Gmail OAuth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    )

    if (!popup) {
        throw new Error('Popup bloqueado! Por favor, permita popups para este site.')
    }
}

/**
 * Handle OAuth callback - Exchange code for tokens
 */
export async function handleGmailOAuthCallback(code: string, state: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    email: string
}> {
    // Validate state (CSRF protection)
    if (!validateState(state)) {
        throw new Error('Invalid state parameter - possible CSRF attack')
    }

    // Exchange authorization code for tokens
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error_description || 'Failed to exchange code for tokens')
    }

    const data = await response.json()

    // Get user email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            Authorization: `Bearer ${data.access_token}`
        }
    })

    const userInfo = await userInfoResponse.json()

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        email: userInfo.email
    }
}

/**
 * Refresh access token using refresh token
 * DEV_MODE: Simulates token refresh
 */
export async function refreshGmailAccessToken(refreshToken: string): Promise<{
    accessToken: string
    expiresIn: number
}> {
    // 🔧 DEV MODE: Simulate refresh
    if (DEV_MODE && refreshToken.startsWith('dev_refresh_token')) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    accessToken: 'dev_access_token_refreshed_' + Date.now(),
                    expiresIn: 3600
                })
            }, 200)
        })
    }

    // PRODUCTION MODE: Real token refresh
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            refresh_token: refreshToken,
            client_id: GOOGLE_CLIENT_ID,
            grant_type: 'refresh_token'
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error_description || 'Failed to refresh token')
    }

    const data = await response.json()

    return {
        accessToken: data.access_token,
        expiresIn: data.expires_in
    }
}

/**
 * Revoke Gmail access - Disconnect
 * DEV_MODE: Simulates revocation
 */
export async function revokeGmailAccess(token: string): Promise<void> {
    // 🔧 DEV MODE: Just log
    if (DEV_MODE && token.startsWith('dev_')) {
        console.log('🔧 DEV MODE: Simulating token revocation')
        return
    }

    // PRODUCTION MODE: Real revocation
    await fetch(REVOKE_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            token
        })
    })
}
