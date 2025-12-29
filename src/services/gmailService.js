/**
 * Email Service - Padoca Pizza
 * EmailJS integration for automatic email sending
 * Sends emails directly without opening another page
 */

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_g2io60e'
const EMAILJS_TEMPLATE_ID = 'template_at3fl3s'
const EMAILJS_PUBLIC_KEY = '0CObV7BKHDHwHMDxs'

// Fixed sender info
const SENDER_EMAIL = 'padocainc@gmail.com'
const SENDER_NAME = 'Padoca Pizza'

class EmailService {
    constructor() {
        this.senderEmail = SENDER_EMAIL
        this.isInitialized = false
    }

    /**
     * Initialize EmailJS library
     */
    async init() {
        if (this.isInitialized) return true

        // Load EmailJS script if not loaded
        if (!window.emailjs) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script')
                script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
                script.onload = () => {
                    window.emailjs.init(EMAILJS_PUBLIC_KEY)
                    this.isInitialized = true
                    console.log('✅ EmailJS initialized')
                    resolve()
                }
                script.onerror = (e) => {
                    console.error('❌ Failed to load EmailJS:', e)
                    reject(new Error('Failed to load EmailJS'))
                }
                document.head.appendChild(script)
            })
        } else {
            window.emailjs.init(EMAILJS_PUBLIC_KEY)
            this.isInitialized = true
        }

        return true
    }

    /**
     * Always connected
     */
    isConnected() {
        return true
    }

    getConnectedEmail() {
        return SENDER_EMAIL
    }

    async connect() {
        await this.init()
        return { email: SENDER_EMAIL, connected: true }
    }

    disconnect() { }

    /**
     * Send email via EmailJS - Automatic, no page redirect
     */
    async sendEmail({ to, subject, body, supplierName }) {
        console.log('📧 Sending email via EmailJS...')
        console.log('To:', to)
        console.log('Subject:', subject)

        // Initialize EmailJS if not done
        await this.init()

        if (!window.emailjs) {
            throw new Error('EmailJS não foi carregado corretamente')
        }

        try {
            // Send via EmailJS
            const response = await window.emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                {
                    to_email: to,
                    to_name: supplierName || to,
                    from_name: SENDER_NAME,
                    from_email: SENDER_EMAIL,
                    subject: subject,
                    message: body,
                    reply_to: SENDER_EMAIL
                }
            )

            console.log('✅ Email sent successfully!', response)
            return {
                success: true,
                method: 'emailjs',
                status: response.status,
                text: response.text
            }

        } catch (error) {
            console.error('❌ EmailJS error:', error)
            throw new Error(error.text || error.message || 'Falha ao enviar email')
        }
    }

    async checkReplies() {
        return []
    }

    async getUnreadCount() {
        return 0
    }
}

export const gmailService = new EmailService()
export default gmailService
