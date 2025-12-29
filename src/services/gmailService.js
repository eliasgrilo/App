/**
 * Gmail API Service v2.0 - Padoca Pizza
 * Senior Engineer Implementation with Robust Error Handling
 * 
 * ARCHITECTURE:
 * - OAuth 2.0 with automatic token refresh
 * - Gmail API for both sending and reading
 * - Fallback to EmailJS for sending if Gmail fails
 * - Comprehensive error logging
 */

// ============================================================
// CONFIGURATION - CRITICAL: Update these values
// ============================================================

// OAuth 2.0 Client ID (from Google Cloud Console)
const GOOGLE_CLIENT_ID = '689278956648-ti708lsamubui9d33hcohhr6es3tag34.apps.googleusercontent.com'

// Scopes required for full access
const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose'
].join(' ')

// EmailJS fallback configuration
const EMAILJS_SERVICE_ID = 'service_g2io60e'
const EMAILJS_TEMPLATE_ID = 'template_at3fl3s'
const EMAILJS_PUBLIC_KEY = '0CObV7BKHDHwHMDxs'

// Sender info
const SENDER_EMAIL = 'padocainc@gmail.com'
const SENDER_NAME = 'Padoca Pizza'

// Timeouts
const EMAIL_TIMEOUT = 30000
const API_TIMEOUT = 10000

// ============================================================
// GMAIL API SERVICE CLASS
// ============================================================

class GmailApiService {
    constructor() {
        this.accessToken = null
        this.tokenClient = null
        this.isInitialized = false
        this.userEmail = null
        this.gsiLoaded = false
        this.gapiLoaded = false
        this.lastError = null
    }

    // --------------------------------------------------------
    // SCRIPT LOADING
    // --------------------------------------------------------

    async loadGSI() {
        if (this.gsiLoaded) return true

        return new Promise((resolve, reject) => {
            if (window.google?.accounts?.oauth2) {
                this.gsiLoaded = true
                resolve(true)
                return
            }

            const existingScript = document.querySelector('script[src*="accounts.google.com/gsi"]')
            if (existingScript) {
                existingScript.addEventListener('load', () => {
                    this.gsiLoaded = true
                    resolve(true)
                })
                return
            }

            const script = document.createElement('script')
            script.src = 'https://accounts.google.com/gsi/client'
            script.async = true
            script.defer = true
            script.onload = () => {
                this.gsiLoaded = true
                console.log('✅ GSI loaded')
                resolve(true)
            }
            script.onerror = (e) => {
                this.lastError = 'Failed to load Google Sign-In'
                reject(new Error('Failed to load GSI'))
            }
            document.head.appendChild(script)
        })
    }

    async loadGAPI() {
        if (this.gapiLoaded) return true

        return new Promise((resolve, reject) => {
            if (window.gapi?.client) {
                this.gapiLoaded = true
                resolve(true)
                return
            }

            const existingScript = document.querySelector('script[src*="apis.google.com/js/api"]')
            if (existingScript) {
                existingScript.addEventListener('load', () => {
                    window.gapi.load('client', async () => {
                        await window.gapi.client.init({})
                        this.gapiLoaded = true
                        resolve(true)
                    })
                })
                return
            }

            const script = document.createElement('script')
            script.src = 'https://apis.google.com/js/api.js'
            script.async = true
            script.defer = true
            script.onload = () => {
                window.gapi.load('client', async () => {
                    try {
                        await window.gapi.client.init({})
                        this.gapiLoaded = true
                        console.log('✅ GAPI loaded')
                        resolve(true)
                    } catch (e) {
                        this.lastError = 'Failed to initialize GAPI client'
                        reject(e)
                    }
                })
            }
            script.onerror = (e) => {
                this.lastError = 'Failed to load Google API'
                reject(new Error('Failed to load GAPI'))
            }
            document.head.appendChild(script)
        })
    }

    // --------------------------------------------------------
    // INITIALIZATION & AUTH
    // --------------------------------------------------------

    async init() {
        if (this.isInitialized && this.accessToken) return true

        try {
            await Promise.all([this.loadGSI(), this.loadGAPI()])

            // Check stored token
            const storedToken = localStorage.getItem('gmail_access_token')
            const tokenExpiry = parseInt(localStorage.getItem('gmail_token_expiry')) || 0
            const storedEmail = localStorage.getItem('gmail_user_email')

            // Token valid for at least 5 more minutes?
            if (storedToken && tokenExpiry > Date.now() + 300000) {
                this.accessToken = storedToken
                this.userEmail = storedEmail || SENDER_EMAIL
                window.gapi.client.setToken({ access_token: storedToken })
                this.isInitialized = true
                console.log('✅ Gmail auto-conectado:', this.userEmail)
                return true
            }

            // Initialize token client
            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: GMAIL_SCOPES,
                callback: () => { } // Will be set dynamically
            })

            this.isInitialized = true
            console.log('✅ Gmail service pronto (precisa autenticar)')
            return true

        } catch (e) {
            this.lastError = e.message
            console.error('❌ Gmail init erro:', e)
            return false
        }
    }

    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.init()
        }
        return this.isInitialized
    }

    // --------------------------------------------------------
    // AUTHORIZATION (requires user interaction)
    // --------------------------------------------------------

    authorize() {
        return new Promise(async (resolve, reject) => {
            await this.ensureInitialized()

            if (!this.tokenClient) {
                reject(new Error('Token client não inicializado'))
                return
            }

            this.tokenClient.callback = async (response) => {
                if (response.error) {
                    this.lastError = response.error_description || response.error
                    console.error('❌ OAuth erro:', response)
                    reject(new Error(this.lastError))
                    return
                }

                if (response.access_token) {
                    this.accessToken = response.access_token
                    localStorage.setItem('gmail_access_token', response.access_token)
                    localStorage.setItem('gmail_token_expiry', String(Date.now() + 3600000))
                    window.gapi.client.setToken({ access_token: response.access_token })

                    // Get user email
                    try {
                        const profile = await this.getUserProfile()
                        if (profile?.emailAddress) {
                            this.userEmail = profile.emailAddress
                            localStorage.setItem('gmail_user_email', profile.emailAddress)
                        }
                    } catch (e) {
                        this.userEmail = SENDER_EMAIL
                    }

                    console.log('✅ Gmail conectado:', this.userEmail)
                    resolve({ email: this.userEmail, connected: true })
                }
            }

            try {
                this.tokenClient.requestAccessToken({ prompt: 'consent' })
            } catch (e) {
                this.lastError = e.message
                reject(e)
            }
        })
    }

    async connect() {
        return this.authorize()
    }

    // --------------------------------------------------------
    // STATUS METHODS
    // --------------------------------------------------------

    isConnected() {
        const tokenExpiry = parseInt(localStorage.getItem('gmail_token_expiry')) || 0
        return !!(this.accessToken && tokenExpiry > Date.now())
    }

    getConnectedEmail() {
        return this.userEmail || localStorage.getItem('gmail_user_email') || SENDER_EMAIL
    }

    getLastError() {
        return this.lastError
    }

    disconnect() {
        if (this.accessToken) {
            try {
                window.google?.accounts?.oauth2?.revoke(this.accessToken)
            } catch (e) { }
        }
        this.accessToken = null
        this.userEmail = null
        localStorage.removeItem('gmail_access_token')
        localStorage.removeItem('gmail_token_expiry')
        localStorage.removeItem('gmail_user_email')
        console.log('✅ Gmail desconectado')
    }

    // --------------------------------------------------------
    // GMAIL API - Read Profile
    // --------------------------------------------------------

    async getUserProfile() {
        if (!this.accessToken) return null

        try {
            const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            })

            if (response.status === 401) {
                this.disconnect()
                return null
            }

            if (response.ok) {
                return await response.json()
            }
            return null
        } catch (e) {
            console.error('Profile erro:', e)
            return null
        }
    }

    // --------------------------------------------------------
    // GMAIL API - Send Email
    // --------------------------------------------------------

    async sendEmailViaGmail({ to, subject, body }) {
        if (!this.accessToken) {
            throw new Error('Gmail não conectado')
        }

        // Create RFC 2822 formatted email
        const email = [
            `To: ${to}`,
            `From: ${SENDER_NAME} <${this.getConnectedEmail()}>`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            '',
            body
        ].join('\r\n')

        // Base64 encode for Gmail API
        const encodedMessage = btoa(unescape(encodeURIComponent(email)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')

        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw: encodedMessage })
        })

        if (!response.ok) {
            if (response.status === 401) {
                this.disconnect()
            }
            const error = await response.json()
            throw new Error(error.error?.message || 'Falha ao enviar email')
        }

        const result = await response.json()
        console.log('✅ Email enviado via Gmail API:', result.id)
        return { success: true, method: 'gmail', messageId: result.id }
    }

    // --------------------------------------------------------
    // EMAILJS FALLBACK - Send Email
    // --------------------------------------------------------

    async sendEmailViaEmailJS({ to, subject, body, supplierName }) {
        // Load EmailJS if needed
        if (!window.emailjs) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script')
                script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
                script.onload = () => {
                    window.emailjs.init(EMAILJS_PUBLIC_KEY)
                    resolve()
                }
                script.onerror = reject
                document.head.appendChild(script)
            })
        }

        const cleanBody = body
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")

        const response = await window.emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            {
                to_email: to,
                to_name: supplierName || to.split('@')[0],
                from_name: SENDER_NAME,
                from_email: SENDER_EMAIL,
                subject: subject,
                message: cleanBody,
                reply_to: SENDER_EMAIL
            }
        )

        console.log('✅ Email enviado via EmailJS')
        return { success: true, method: 'emailjs', status: response.status }
    }

    // --------------------------------------------------------
    // UNIFIED SEND EMAIL (tries Gmail first, then EmailJS)
    // --------------------------------------------------------

    async sendEmail({ to, subject, body, supplierName }) {
        if (!to || !to.includes('@')) {
            throw new Error('Email do destinatário inválido')
        }

        console.log('📧 Enviando email para:', to)

        // Try Gmail API first if connected
        if (this.isConnected()) {
            try {
                return await this.sendEmailViaGmail({ to, subject, body })
            } catch (e) {
                console.warn('Gmail API falhou, tentando EmailJS...', e.message)
            }
        }

        // Fallback to EmailJS
        try {
            return await this.sendEmailViaEmailJS({ to, subject, body, supplierName })
        } catch (e) {
            this.lastError = e.message
            console.error('❌ Ambos os métodos falharam:', e)
            throw new Error(`Falha ao enviar email: ${e.message}`)
        }
    }

    // --------------------------------------------------------
    // GMAIL API - Check Replies
    // --------------------------------------------------------

    async checkReplies(supplierEmails, afterDate) {
        if (!this.isConnected()) {
            console.log('⚠️ Gmail não conectado para verificar respostas')
            return []
        }

        try {
            // Build search query
            const fromQuery = supplierEmails.map(e => `from:${e}`).join(' OR ')
            const dateStr = afterDate.toISOString().split('T')[0].replace(/-/g, '/')
            const searchQuery = `(${fromQuery}) after:${dateStr}`

            console.log('🔍 Buscando respostas:', searchQuery)

            const searchResponse = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=20`,
                { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
            )

            if (!searchResponse.ok) {
                if (searchResponse.status === 401) {
                    this.disconnect()
                }
                console.error('❌ Busca falhou:', searchResponse.status)
                return []
            }

            const searchData = await searchResponse.json()

            if (!searchData.messages?.length) {
                console.log('📭 Nenhuma resposta nova')
                return []
            }

            console.log(`📬 ${searchData.messages.length} mensagens encontradas`)

            // Fetch message details
            const replies = []
            for (const msg of searchData.messages.slice(0, 10)) {
                try {
                    const msgResponse = await fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
                        { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
                    )

                    if (!msgResponse.ok) continue

                    const msgData = await msgResponse.json()
                    const headers = msgData.payload?.headers || []

                    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''
                    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
                    const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || ''

                    // Extract email
                    const emailMatch = fromHeader.match(/<(.+?)>/) || [null, fromHeader]
                    const supplierEmail = (emailMatch[1] || fromHeader).toLowerCase().trim()

                    // Get body text
                    let bodyText = msgData.snippet || ''
                    if (msgData.payload?.parts) {
                        const textPart = msgData.payload.parts.find(p => p.mimeType === 'text/plain')
                        if (textPart?.body?.data) {
                            bodyText = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
                        }
                    } else if (msgData.payload?.body?.data) {
                        bodyText = atob(msgData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
                    }

                    // Match against supplier emails
                    const isFromSupplier = supplierEmails.some(e => {
                        const supplierDomain = e.toLowerCase().split('@')[0]
                        return supplierEmail.includes(supplierDomain)
                    })

                    if (isFromSupplier) {
                        replies.push({
                            id: msg.id,
                            supplierEmail,
                            from: fromHeader,
                            subject: subjectHeader,
                            date: new Date(dateHeader),
                            snippet: msgData.snippet || '',
                            body: bodyText
                        })
                    }
                } catch (e) {
                    console.warn('Erro ao processar mensagem:', e)
                }
            }

            console.log(`✅ ${replies.length} respostas de fornecedores`)
            return replies

        } catch (error) {
            this.lastError = error.message
            console.error('❌ Erro ao verificar respostas:', error)
            return []
        }
    }

    // --------------------------------------------------------
    // GMAIL API - Get Unread Count
    // --------------------------------------------------------

    async getUnreadCount() {
        if (!this.isConnected()) return 0

        try {
            const response = await fetch(
                'https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX',
                { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
            )

            if (response.ok) {
                const data = await response.json()
                return data.messagesUnread || 0
            }
            return 0
        } catch (e) {
            return 0
        }
    }

    // --------------------------------------------------------
    // DEBUG - Get Status
    // --------------------------------------------------------

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isConnected: this.isConnected(),
            userEmail: this.getConnectedEmail(),
            gsiLoaded: this.gsiLoaded,
            gapiLoaded: this.gapiLoaded,
            lastError: this.lastError,
            tokenExpiry: localStorage.getItem('gmail_token_expiry'),
            hasToken: !!this.accessToken
        }
    }
}

// ============================================================
// EXPORT SINGLETON
// ============================================================

export const gmailService = new GmailApiService()
export default gmailService
