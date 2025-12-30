/**
 * Gmail API Service v3.1 - PRODUCTION DEBUGGING VERSION
 * Added comprehensive logging and error handling at every step
 */

const GOOGLE_CLIENT_ID = '689278956648-ti708lsamubui9d33hcohhr6es3tag34.apps.googleusercontent.com'
const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose'
].join(' ')

const EMAILJS_SERVICE_ID = 'service_g2io60e'
const EMAILJS_TEMPLATE_ID = 'template_at3fl3s'
const EMAILJS_PUBLIC_KEY = '0CObV7BKHDHwHMDxs'

const SENDER_EMAIL = 'padocainc@gmail.com'
const SENDER_NAME = 'Padoca Pizza'

// ============================================================
// HELPER FUNCTIONS - WITH EXTENSIVE DEBUGGING
// ============================================================

function decodeBase64Body(encodedData) {
    if (!encodedData) {
        console.warn('⚠️ decodeBase64Body: encodedData is empty')
        return ''
    }

    try {
        console.log(`🔍 Decoding base64, length: ${encodedData.length}`)
        const normalized = encodedData.replace(/-/g, '+').replace(/_/g, '/')
        const decoded = atob(normalized)
        console.log(`✅ Decoded successfully, result length: ${decoded.length}`)
        return decoded
    } catch (e) {
        console.error('❌ Base64 decode error:', e, 'Data length:', encodedData?.length)
        return ''
    }
}

function extractEmailText(payload, depth = 0) {
    const indent = '  '.repeat(depth)
    console.log(`${indent}📧 extractEmailText called, depth: ${depth}`)

    if (!payload) {
        console.warn(`${indent}⚠️ Payload is null/undefined`)
        return ''
    }

    console.log(`${indent}🔍 Payload structure:`, {
        hasBody: !!payload.body,
        hasBodyData: !!payload.body?.data,
        bodyDataLength: payload.body?.data?.length || 0,
        hasParts: !!payload.parts,
        partsLength: payload.parts?.length || 0,
        mimeType: payload.mimeType
    })

    // Method 1: Direct body data
    if (payload.body?.data) {
        console.log(`${indent}✅ Method 1: Direct body.data found`)
        const text = decodeBase64Body(payload.body.data)
        if (text && text.length > 10) {
            console.log(`${indent}✅ Extracted ${text.length} chars from direct body`)
            return text
        }
        console.log(`${indent}⚠️ Direct body too short: ${text.length} chars`)
    }

    // Method 2: Multipart message
    if (payload.parts && Array.isArray(payload.parts)) {
        console.log(`${indent}🔍 Method 2: Checking ${payload.parts.length} parts`)

        // Try text/plain first
        for (let i = 0; i < payload.parts.length; i++) {
            const part = payload.parts[i]
            console.log(`${indent}  Part ${i}: mimeType=${part.mimeType}, hasBodyData=${!!part.body?.data}`)

            if (part.mimeType === 'text/plain' && part.body?.data) {
                console.log(`${indent}✅ Found text/plain part`)
                const text = decodeBase64Body(part.body.data)
                if (text && text.length > 10) {
                    console.log(`${indent}✅ Extracted ${text.length} chars from text/plain`)
                    return text
                }
            }
        }

        // Try text/html as fallback
        for (let i = 0; i < payload.parts.length; i++) {
            const part = payload.parts[i]
            if (part.mimeType === 'text/html' && part.body?.data) {
                console.log(`${indent}✅ Found text/html part, stripping tags`)
                let html = decodeBase64Body(part.body.data)
                // Remove scripts and styles first
                html = html.replace(/<script[^>]*>.*?<\/script>/gi, '')
                html = html.replace(/<style[^>]*>.*?<\/style>/gi, '')
                // Strip HTML tags
                let text = html.replace(/<[^>]*>/g, ' ')
                // Decode HTML entities
                text = text.replace(/&nbsp;/gi, ' ')
                text = text.replace(/&amp;/gi, '&')
                text = text.replace(/&lt;/gi, '<')
                text = text.replace(/&gt;/gi, '>')
                text = text.replace(/&quot;/gi, '"')
                text = text.replace(/&#39;/gi, "'")
                text = text.replace(/&rsquo;/gi, "'")
                text = text.replace(/&lsquo;/gi, "'")
                // Normalize whitespace
                text = text.replace(/\s+/g, ' ').trim()
                if (text && text.length > 10) {
                    console.log(`${indent}✅ Extracted ${text.length} chars from text/html`)
                    return text
                }
            }
        }

        // Try nested multipart (with depth limit to prevent infinite recursion)
        if (depth < 5) {
            console.log(`${indent}🔍 Checking for nested multipart structures`)
            for (let i = 0; i < payload.parts.length; i++) {
                const part = payload.parts[i]
                // CRITICAL FIX: Check if part has nested parts, regardless of mimeType
                if (part.parts && Array.isArray(part.parts) && part.parts.length > 0) {
                    console.log(`${indent}  🔄 Recursing into nested multipart at part ${i}, mimeType=${part.mimeType}, depth ${depth + 1}`)
                    // Recurse directly into the nested parts array
                    for (const nestedPart of part.parts) {
                        const nestedText = extractEmailText(nestedPart, depth + 1)
                        if (nestedText && nestedText.length > 10) {
                            console.log(`${indent}✅ Extracted ${nestedText.length} chars from nested multipart`)
                            return nestedText
                        }
                    }
                }
            }
        } else {
            console.warn(`${indent}⚠️ Max recursion depth reached (${depth}), skipping nested parts`)
        }
    }

    console.warn(`${indent}⚠️ No valid text found in payload`)
    return ''
}

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

        console.log('🔧 GmailApiService constructor called')
    }

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

    async init() {
        if (this.isInitialized && this.accessToken) return true

        try {
            await Promise.all([this.loadGSI(), this.loadGAPI()])

            const storedToken = localStorage.getItem('gmail_access_token')
            const tokenExpiry = parseInt(localStorage.getItem('gmail_token_expiry')) || 0
            const storedEmail = localStorage.getItem('gmail_user_email')

            if (storedToken && tokenExpiry > Date.now() + 300000) {
                this.accessToken = storedToken
                this.userEmail = storedEmail || SENDER_EMAIL
                window.gapi.client.setToken({ access_token: storedToken })
                this.isInitialized = true
                console.log('✅ Gmail auto-conectado:', this.userEmail)
                return true
            }

            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: GMAIL_SCOPES,
                callback: () => { }
            })

            this.isInitialized = true
            console.log('✅ Gmail service pronto')
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
                    const expiryDate = Date.now() + 3600000
                    localStorage.setItem('gmail_access_token', response.access_token)
                    localStorage.setItem('gmail_token_expiry', String(expiryDate))
                    window.gapi.client.setToken({ access_token: response.access_token })

                    if (response.refresh_token) {
                        localStorage.setItem('gmail_refresh_token', response.refresh_token)
                    }

                    try {
                        const profile = await this.getUserProfile()
                        if (profile?.emailAddress) {
                            this.userEmail = profile.emailAddress
                            localStorage.setItem('gmail_user_email', profile.emailAddress)
                        }
                    } catch (e) {
                        this.userEmail = SENDER_EMAIL
                    }

                    try {
                        const refreshToken = response.refresh_token || localStorage.getItem('gmail_refresh_token')
                        const syncResponse = await fetch(
                            'https://us-central1-padoca-96688.cloudfunctions.net/saveGmailToken',
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    accessToken: response.access_token,
                                    refreshToken: refreshToken,
                                    expiryDate: expiryDate,
                                    userEmail: this.userEmail,
                                    clientId: GOOGLE_CLIENT_ID
                                })
                            }
                        )
                        if (syncResponse.ok) {
                            console.log('✅ Tokens synced to Cloud Functions')
                        }
                    } catch (e) {
                        console.warn('⚠️ Token sync failed:', e)
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

    startFullAuthorization() {
        const CLIENT_ID = GOOGLE_CLIENT_ID
        const REDIRECT_URI = window.location.origin + '/oauth-callback.html'
        const SCOPE = GMAIL_SCOPES

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
        authUrl.searchParams.set('client_id', CLIENT_ID)
        authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('scope', SCOPE)
        authUrl.searchParams.set('access_type', 'offline')
        authUrl.searchParams.set('prompt', 'consent')
        authUrl.searchParams.set('include_granted_scopes', 'true')

        console.log('🔐 Redirecting to Google OAuth...')
        window.location.href = authUrl.toString()
    }

    async activateGmailWatch() {
        try {
            const response = await fetch('https://us-central1-padoca-96688.cloudfunctions.net/setupGmailWatch')
            if (response.ok) {
                const data = await response.json()
                console.log('✅ Gmail Watch activated:', data)
                return true
            }
            return false
        } catch (e) {
            console.error('❌ Gmail Watch activation failed:', e)
            return false
        }
    }

    isConnected() {
        const tokenExpiry = parseInt(localStorage.getItem('gmail_token_expiry')) || 0
        return !!(this.accessToken && tokenExpiry > Date.now())
    }

    async validateToken() {
        if (!this.accessToken) return false

        try {
            const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            })

            if (response.status === 401 || response.status === 403) {
                console.warn('⚠️ Gmail token inválido, desconectando...')
                this.disconnect()
                return false
            }

            return response.ok
        } catch (e) {
            console.error('❌ Erro ao validar token:', e)
            return false
        }
    }

    async ensureValidConnection() {
        if (!this.isConnected()) return false
        const isValid = await this.validateToken()
        if (!isValid) return false
        return true
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

    async sendEmailViaGmail({ to, subject, body }) {
        if (!this.accessToken) {
            throw new Error('Gmail não conectado')
        }

        const email = [
            `To: ${to}`,
            `From: ${SENDER_NAME} <${this.getConnectedEmail()}>`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            '',
            body
        ].join('\r\n')

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

    async sendEmailViaEmailJS({ to, subject, body, supplierName }) {
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

    async sendEmail({ to, subject, body, supplierName }) {
        if (!to || !to.includes('@')) {
            throw new Error('Email do destinatário inválido')
        }

        console.log('📧 Enviando email para:', to)

        if (this.isConnected()) {
            const tokenValid = await this.validateToken()
            if (tokenValid) {
                try {
                    return await this.sendEmailViaGmail({ to, subject, body })
                } catch (e) {
                    console.warn('Gmail API falhou:', e.message)
                    this.lastError = `Gmail API: ${e.message}`
                    if (e.message.includes('401') || e.message.includes('403')) {
                        this.disconnect()
                    }
                }
            }
        }

        try {
            return await this.sendEmailViaEmailJS({ to, subject, body, supplierName })
        } catch (e) {
            this.lastError = `EmailJS: ${e.message}`
            console.error('❌ EmailJS também falhou:', e)
            throw new Error(`Falha ao enviar email: ${e.message}`)
        }
    }

    // --------------------------------------------------------
    // CHECK REPLIES - EXTENSIVELY INSTRUMENTED
    // --------------------------------------------------------

    async checkReplies(supplierEmails, afterDate) {
        console.log('═══════════════════════════════════════════════════')
        console.log('🔍 checkReplies() called')
        console.log('   Supplier emails:', supplierEmails)
        console.log('   After date:', afterDate)
        console.log('═══════════════════════════════════════════════════')

        if (!this.isConnected()) {
            console.log('⚠️ Gmail não conectado para verificar respostas')
            return []
        }

        try {
            const fromQuery = supplierEmails.map(e => `from:${e}`).join(' OR ')
            const dateStr = afterDate.toISOString().split('T')[0].replace(/-/g, '/')
            const searchQuery = `(${fromQuery}) after:${dateStr}`

            console.log('🔍 Search query:', searchQuery)

            const searchResponse = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=50`,
                { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
            )

            console.log('📡 Search response status:', searchResponse.status)

            if (!searchResponse.ok) {
                if (searchResponse.status === 401) {
                    this.disconnect()
                }
                console.error('❌ Busca falhou:', searchResponse.status)
                return []
            }

            const searchData = await searchResponse.json()
            console.log('📊 Search results:', {
                resultSizeEstimate: searchData.resultSizeEstimate,
                messagesFound: searchData.messages?.length || 0
            })

            if (!searchData.messages?.length) {
                console.log('📭 Nenhuma resposta nova')
                return []
            }

            console.log(`📬 ${searchData.messages.length} mensagens encontradas, processando...`)

            const replies = []
            for (let msgIndex = 0; msgIndex < Math.min(searchData.messages.length, 20); msgIndex++) {
                const msg = searchData.messages[msgIndex]
                console.log(`\n───────────────────────────────────────────────`)
                console.log(`📩 Processing message ${msgIndex + 1}/${searchData.messages.length}`)
                console.log(`   Message ID: ${msg.id}`)

                try {
                    const msgResponse = await fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
                        { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
                    )

                    console.log(`   Fetch status: ${msgResponse.status}`)

                    if (!msgResponse.ok) {
                        console.warn(`   ⚠️ Falha ao buscar mensagem: ${msgResponse.status}`)
                        continue
                    }

                    const msgData = await msgResponse.json()
                    console.log(`   ✅ Message data received`)

                    const headers = msgData.payload?.headers || []
                    console.log(`   Headers count: ${headers.length}`)

                    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''
                    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
                    const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || ''

                    console.log(`   From: ${fromHeader}`)
                    console.log(`   Subject: ${subjectHeader}`)
                    console.log(`   Date: ${dateHeader}`)

                    const emailMatch = fromHeader.match(/<(.+?)>/) || [null, fromHeader]
                    const supplierEmail = (emailMatch[1] || fromHeader).toLowerCase().trim()
                    console.log(`   Extracted email: ${supplierEmail}`)

                    // CRITICAL: Extract body with full debugging
                    console.log(`   🔍 Starting body extraction...`)
                    let bodyText = extractEmailText(msgData.payload)

                    if (!bodyText || bodyText.length < 10) {
                        console.warn(`   ⚠️ Extraction failed, using snippet as fallback`)
                        bodyText = msgData.snippet || ''
                    }

                    console.log(`   📄 Final body length: ${bodyText.length} chars`)
                    console.log(`   📄 Body preview: "${bodyText.substring(0, 100)}..."`)

                    // BUG #4 FIX: Simplified email matching with exact comparison and domain fallback
                    const isFromSupplier = supplierEmails.some(e => {
                        const supplierEmailLower = e.toLowerCase().trim()
                        const fromEmailLower = supplierEmail.toLowerCase().trim()

                        // Exact match (preferred)
                        if (fromEmailLower === supplierEmailLower) {
                            console.log(`   ✅ Exact match: ${e}`)
                            return true
                        }

                        // Domain-level fallback: check if both share same domain
                        const supplierDomain = supplierEmailLower.split('@')[1]
                        const fromDomain = fromEmailLower.split('@')[1]
                        if (supplierDomain && fromDomain && supplierDomain === fromDomain) {
                            console.log(`   ✅ Domain match: ${supplierDomain}`)
                            return true
                        }

                        return false
                    })

                    console.log(`   Is from supplier: ${isFromSupplier}`)

                    if (isFromSupplier && bodyText.length > 10) {
                        console.log(`   ✅ VALID EMAIL DETECTED - Adding to replies`)
                        replies.push({
                            id: msg.id,
                            supplierEmail,
                            from: fromHeader,
                            subject: subjectHeader,
                            date: new Date(dateHeader),
                            snippet: msgData.snippet || '',
                            body: bodyText
                        })
                    } else if (isFromSupplier) {
                        console.warn(`   ⚠️ Email from supplier but body is empty/too short`)
                    } else {
                        console.log(`   ⏭️ Not from target supplier, skipping`)
                    }
                } catch (e) {
                    console.warn(`   ❌ Error processing message:`, e)
                }
            }

            console.log(`\n═══════════════════════════════════════════════════`)
            console.log(`✅ FINAL RESULT: ${replies.length} valid replies detected`)
            console.log(`═══════════════════════════════════════════════════\n`)
            return replies

        } catch (error) {
            this.lastError = error.message
            console.error('❌ Erro ao verificar respostas:', error)
            return []
        }
    }

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

export const gmailService = new GmailApiService()
export default gmailService
