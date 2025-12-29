/**
 * Gmail API Service - Padoca Pizza
 * Complete Gmail integration with OAuth for automatic email reading
 */

// OAuth Configuration
const GOOGLE_CLIENT_ID = '288245433770-mnrej3g3kud0ai1qn670cd4c6vm00ui5.apps.googleusercontent.com'
const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send'

// EmailJS for sending (backup)
const EMAILJS_SERVICE_ID = 'service_g2io60e'
const EMAILJS_TEMPLATE_ID = 'template_at3fl3s'
const EMAILJS_PUBLIC_KEY = '0CObV7BKHDHwHMDxs'

const SENDER_EMAIL = 'padocainc@gmail.com'
const SENDER_NAME = 'Padoca Pizza'
const EMAIL_TIMEOUT = 30000

class GmailApiService {
    constructor() {
        this.accessToken = null
        this.tokenClient = null
        this.isInitialized = false
        this.userEmail = null
        this.gsiLoaded = false
        this.gapiLoaded = false
    }

    /**
     * Load Google Identity Services script
     */
    async loadGSI() {
        if (this.gsiLoaded) return true

        return new Promise((resolve, reject) => {
            if (window.google?.accounts) {
                this.gsiLoaded = true
                resolve(true)
                return
            }

            const script = document.createElement('script')
            script.src = 'https://accounts.google.com/gsi/client'
            script.async = true
            script.defer = true
            script.onload = () => {
                this.gsiLoaded = true
                console.log('✅ Google Identity Services loaded')
                resolve(true)
            }
            script.onerror = () => reject(new Error('Failed to load GSI'))
            document.head.appendChild(script)
        })
    }

    /**
     * Load GAPI client for Gmail API
     */
    async loadGAPI() {
        if (this.gapiLoaded) return true

        return new Promise((resolve, reject) => {
            if (window.gapi?.client) {
                this.gapiLoaded = true
                resolve(true)
                return
            }

            const script = document.createElement('script')
            script.src = 'https://apis.google.com/js/api.js'
            script.async = true
            script.defer = true
            script.onload = () => {
                window.gapi.load('client', async () => {
                    await window.gapi.client.init({})
                    this.gapiLoaded = true
                    console.log('✅ GAPI client loaded')
                    resolve(true)
                })
            }
            script.onerror = () => reject(new Error('Failed to load GAPI'))
            document.head.appendChild(script)
        })
    }

    /**
     * Initialize Gmail API with OAuth
     */
    async init() {
        if (this.isInitialized && this.accessToken) return true

        try {
            await Promise.all([this.loadGSI(), this.loadGAPI()])

            // Check for stored token
            const storedToken = localStorage.getItem('gmail_access_token')
            const tokenExpiry = localStorage.getItem('gmail_token_expiry')

            if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
                this.accessToken = storedToken
                this.userEmail = localStorage.getItem('gmail_user_email') || SENDER_EMAIL
                window.gapi.client.setToken({ access_token: storedToken })
                this.isInitialized = true
                console.log('✅ Gmail API initialized with stored token')
                return true
            }

            // Initialize token client for new auth
            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: GMAIL_SCOPES,
                callback: (response) => {
                    if (response.access_token) {
                        this.accessToken = response.access_token
                        // Store token with 1 hour expiry
                        localStorage.setItem('gmail_access_token', response.access_token)
                        localStorage.setItem('gmail_token_expiry', String(Date.now() + 3600000))
                        window.gapi.client.setToken({ access_token: response.access_token })
                        console.log('✅ New Gmail token obtained')
                    }
                }
            })

            this.isInitialized = true
            console.log('✅ Gmail API service initialized')
            return true
        } catch (e) {
            console.error('❌ Gmail API init failed:', e)
            return false
        }
    }

    /**
     * Ensure scripts are loaded - call this on component mount!
     * This MUST be called before authorize() to ensure popup opens correctly
     */
    async ensureInitialized() {
        if (this.isInitialized) return true
        return await this.init()
    }

    /**
     * Request user authorization - MUST be called directly from user click
     * Scripts must be pre-loaded via ensureInitialized()
     */
    authorize() {
        // If not initialized, we can't open popup correctly
        if (!this.tokenClient) {
            console.error('❌ Gmail not initialized. Call ensureInitialized() first.')
            return Promise.reject(new Error('Gmail não inicializado. Recarregue a página.'))
        }

        return new Promise((resolve, reject) => {
            try {
                this.tokenClient.callback = async (response) => {
                    if (response.error) {
                        console.error('OAuth error:', response.error)
                        reject(new Error(response.error))
                        return
                    }
                    if (response.access_token) {
                        this.accessToken = response.access_token
                        localStorage.setItem('gmail_access_token', response.access_token)
                        localStorage.setItem('gmail_token_expiry', String(Date.now() + 3600000))
                        window.gapi.client.setToken({ access_token: response.access_token })
                        console.log('✅ Gmail OAuth token obtained!')

                        // Get user email
                        const profile = await this.getUserProfile()
                        if (profile) {
                            this.userEmail = profile.emailAddress
                            localStorage.setItem('gmail_user_email', profile.emailAddress)
                            console.log('✅ Gmail connected:', profile.emailAddress)
                        }

                        resolve({ email: this.userEmail, connected: true })
                    }
                }

                // Clear any existing token before requesting new one
                if (this.accessToken) {
                    try {
                        window.google.accounts.oauth2.revoke(this.accessToken)
                    } catch (e) {
                        // Ignore revoke errors
                    }
                }

                // THIS is the critical call - must happen synchronously from user gesture
                console.log('🔐 Requesting Gmail access token...')
                this.tokenClient.requestAccessToken({ prompt: 'consent' })
            } catch (e) {
                console.error('OAuth exception:', e)
                reject(e)
            }
        })
    }


    /**
     * Check if connected
     */
    isConnected() {
        return !!this.accessToken
    }

    getConnectedEmail() {
        return this.userEmail || SENDER_EMAIL
    }

    /**
     * Get user profile
     */
    async getUserProfile() {
        if (!this.accessToken) return null

        try {
            const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            })

            if (response.ok) {
                return await response.json()
            }
            return null
        } catch (e) {
            console.error('Error getting profile:', e)
            return null
        }
    }

    /**
     * Disconnect / Revoke access
     */
    disconnect() {
        if (this.accessToken) {
            window.google?.accounts?.oauth2?.revoke(this.accessToken)
        }
        this.accessToken = null
        this.userEmail = null
        localStorage.removeItem('gmail_access_token')
        localStorage.removeItem('gmail_token_expiry')
        localStorage.removeItem('gmail_user_email')
    }

    /**
     * Send email via EmailJS (remains the same for reliability)
     */
    async sendEmail({ to, subject, body, supplierName }) {
        console.log('📧 Enviando email para:', to)

        if (!to || !to.includes('@')) {
            throw new Error('Email do destinatário inválido')
        }

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

        const sendPromise = window.emailjs.send(
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

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout ao enviar email')), EMAIL_TIMEOUT)
        })

        const response = await Promise.race([sendPromise, timeoutPromise])

        console.log('✅ Email enviado com sucesso!')
        return { success: true, method: 'emailjs', status: response.status }
    }

    /**
     * CRITICAL: Check for email replies - THE MAIN AUTOMATION FUNCTION
     */
    async checkReplies(supplierEmails, afterDate) {
        if (!this.accessToken) {
            console.log('⚠️ Gmail não conectado, não é possível verificar respostas')
            return []
        }

        try {
            // Build search query for emails from suppliers after the date
            const fromQuery = supplierEmails.map(e => `from:${e}`).join(' OR ')
            const dateStr = afterDate.toISOString().split('T')[0].replace(/-/g, '/')
            const searchQuery = `(${fromQuery}) after:${dateStr}`

            console.log('🔍 Buscando respostas:', searchQuery)

            // Search for messages
            const searchResponse = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=20`,
                { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
            )

            if (!searchResponse.ok) {
                if (searchResponse.status === 401) {
                    // Token expired, clear it
                    this.disconnect()
                }
                console.error('Gmail search failed:', searchResponse.status)
                return []
            }

            const searchData = await searchResponse.json()

            if (!searchData.messages || searchData.messages.length === 0) {
                console.log('📭 Nenhuma resposta encontrada')
                return []
            }

            console.log(`📬 ${searchData.messages.length} mensagens encontradas`)

            // Fetch message details
            const replies = []
            for (const msg of searchData.messages.slice(0, 10)) {
                const msgResponse = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
                    { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
                )

                if (msgResponse.ok) {
                    const msgData = await msgResponse.json()
                    const headers = msgData.payload?.headers || []

                    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''
                    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
                    const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || ''

                    // Extract email from "Name <email@domain.com>" format
                    const emailMatch = fromHeader.match(/<(.+?)>/) || [null, fromHeader]
                    const supplierEmail = emailMatch[1]?.toLowerCase() || fromHeader.toLowerCase()

                    if (supplierEmails.some(e => supplierEmail.includes(e.toLowerCase().split('@')[0]))) {
                        replies.push({
                            id: msg.id,
                            supplierEmail,
                            from: fromHeader,
                            subject: subjectHeader,
                            date: new Date(dateHeader),
                            snippet: msgData.snippet || ''
                        })
                    }
                }
            }

            console.log(`✅ ${replies.length} respostas de fornecedores encontradas`)
            return replies

        } catch (error) {
            console.error('❌ Erro ao verificar respostas:', error)
            return []
        }
    }

    /**
     * Get unread email count
     */
    async getUnreadCount() {
        if (!this.accessToken) return 0

        try {
            const response = await fetch(
                'https://gmail.googleapis.com/gmail/v1/users/me/labels/UNREAD',
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

    /**
     * Connect with popup (for UI button)
     */
    async connect() {
        return await this.authorize()
    }
}

export const gmailService = new GmailApiService()
export default gmailService
