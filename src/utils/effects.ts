/**
 * ═══════════════════════════════════════════════════════════════════
 * PREMIUM EFFECTS — Micro-interações Nível Apple
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ TYPES ═══
interface ConfettiOrigin {
    x: number
    y: number
}

interface ConfettiOptions {
    particleCount?: number
    origin?: ConfettiOrigin
    colors?: string[]
    spread?: number
}

interface DissolveOptions {
    particleCount?: number
    duration?: number
    color?: string | null
}

interface ExplodeOptions {
    particleCount?: number
    duration?: number
    colors?: string[]
}

interface SparkleOptions {
    count?: number
    duration?: number
    color?: string
}

// ═══ HAPTICS SERVICE ═══
export const haptics = {
    light: (): void => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10)
        }
    },
    medium: (): void => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(20)
        }
    },
    heavy: (): void => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(30)
        }
    },
    success: (): void => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([10, 50, 10])
        }
    },
    warning: (): void => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([20, 30, 20])
        }
    },
    error: (): void => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([30, 50, 30, 50, 30])
        }
    },
    selection: (): void => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(5)
        }
    }
}

// ═══ CONFETTI SYSTEM ═══
const createConfettiPiece = (x: number, y: number, color: string): HTMLDivElement => {
    const piece = document.createElement('div')
    piece.className = 'confetti-piece'
    piece.style.cssText = `
        position: fixed;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        background: ${color};
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        z-index: 99999;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        transform: rotate(${Math.random() * 360}deg);
    `
    return piece
}

const animateConfetti = (piece: HTMLDivElement, direction: number): void => {
    const duration = 1500 + Math.random() * 1000
    const xVelocity = (Math.random() - 0.5) * 400 * direction
    const yVelocity = -300 - Math.random() * 200
    const rotationSpeed = (Math.random() - 0.5) * 720
    const gravity = 800

    let startTime: number | null = null

    const animate = (timestamp: number): void => {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = elapsed / duration

        if (progress >= 1) {
            piece.remove()
            return
        }

        const rotation = rotationSpeed * (elapsed / 1000)
        const opacity = 1 - progress

        piece.style.transform = `translateX(${xVelocity * (elapsed / 1000)}px) translateY(${yVelocity * (elapsed / 1000) + 0.5 * gravity * Math.pow(elapsed / 1000, 2)}px) rotate(${rotation}deg)`
        piece.style.opacity = String(opacity)

        requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
}

export const confetti = {
    colors: {
        success: ['#34C759', '#30D158', '#32D74B', '#28CD41'],
        celebration: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55'],
        gold: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520'],
        blue: ['#007AFF', '#5856D6', '#0A84FF', '#5E5CE6']
    },

    fire: (options: ConfettiOptions = {}): void => {
        const {
            particleCount = 50,
            origin = { x: 0.5, y: 0.5 },
            colors = confetti.colors.celebration,
            spread = 360
        } = options

        const x = window.innerWidth * origin.x
        const y = window.innerHeight * origin.y

        haptics.success()

        const container = document.createElement('div')
        container.id = 'confetti-container'
        document.body.appendChild(container)

        for (let i = 0; i < particleCount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)] ?? '#ff0000'
            const piece = createConfettiPiece(x, y, color)
            container.appendChild(piece)
            animateConfetti(piece, spread === 360 ? 1 : (Math.random() > 0.5 ? 1 : -1))
        }

        setTimeout(() => container.remove(), 3000)
    },

    success: (origin: ConfettiOrigin = { x: 0.5, y: 0.6 }): void => {
        confetti.fire({
            particleCount: 40,
            origin,
            colors: confetti.colors.success
        })
    },

    celebrate: (origin: ConfettiOrigin = { x: 0.5, y: 0.5 }): void => {
        confetti.fire({
            particleCount: 80,
            origin,
            colors: confetti.colors.celebration
        })
    },

    gold: (origin: ConfettiOrigin = { x: 0.5, y: 0.6 }): void => {
        confetti.fire({
            particleCount: 50,
            origin,
            colors: confetti.colors.gold
        })
    },

    burst: (element: HTMLElement | null): void => {
        if (!element) return
        const rect = element.getBoundingClientRect()
        const x = (rect.left + rect.width / 2) / window.innerWidth
        const y = (rect.top + rect.height / 2) / window.innerHeight
        confetti.fire({ particleCount: 30, origin: { x, y } })
    }
}

// ═══ PARTICLE EFFECTS SYSTEM ═══
export const particles = {
    /**
     * Dissolve effect — elemento se desintegra em partículas
     */
    dissolve: (element: HTMLElement | null, options: DissolveOptions = {}): Promise<void> => {
        if (!element) return Promise.resolve()

        const {
            particleCount = 20,
            duration = 600,
            color = null
        } = options

        const rect = element.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(element)
        const bgColor = color || computedStyle.backgroundColor || '#888'

        // Fade out original
        element.style.transition = `opacity ${duration / 2}ms ease-out`
        element.style.opacity = '0'

        haptics.light()

        // Create particles
        const container = document.createElement('div')
        container.style.cssText = `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            pointer-events: none;
            z-index: 99999;
        `
        document.body.appendChild(container)

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div')
            const size = Math.random() * 8 + 4
            const startX = Math.random() * rect.width
            const startY = Math.random() * rect.height

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${bgColor};
                left: ${startX}px;
                top: ${startY}px;
                border-radius: 50%;
                opacity: 1;
            `
            container.appendChild(particle)

            // Animate particle
            const angle = Math.random() * Math.PI * 2
            const velocity = 50 + Math.random() * 100
            const xEnd = startX + Math.cos(angle) * velocity
            const yEnd = startY + Math.sin(angle) * velocity + 50

            particle.animate([
                {
                    transform: 'scale(1) translate(0, 0)',
                    opacity: 1
                },
                {
                    transform: `scale(0) translate(${xEnd - startX}px, ${yEnd - startY}px)`,
                    opacity: 0
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fill: 'forwards'
            })
        }

        return new Promise(resolve => {
            setTimeout(() => {
                container.remove()
                resolve()
            }, duration)
        })
    },

    /**
     * Explode effect — partículas explodem do centro
     */
    explode: (element: HTMLElement | null, options: ExplodeOptions = {}): Promise<void> => {
        if (!element) return Promise.resolve()

        const {
            particleCount = 30,
            duration = 500,
            colors = ['#FF3B30', '#FF6961', '#FF4500']
        } = options

        const rect = element.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        haptics.medium()

        const container = document.createElement('div')
        container.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 99999;
        `
        document.body.appendChild(container)

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div')
            const size = Math.random() * 6 + 3
            const color = colors[Math.floor(Math.random() * colors.length)]

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                left: ${centerX}px;
                top: ${centerY}px;
                border-radius: 50%;
            `
            container.appendChild(particle)

            const angle = (Math.PI * 2 / particleCount) * i + (Math.random() - 0.5) * 0.5
            const velocity = 80 + Math.random() * 120

            particle.animate([
                {
                    transform: 'scale(1) translate(0, 0)',
                    opacity: 1
                },
                {
                    transform: `scale(0) translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity}px)`,
                    opacity: 0
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fill: 'forwards'
            })
        }

        return new Promise(resolve => {
            setTimeout(() => {
                container.remove()
                resolve()
            }, duration)
        })
    },

    /**
     * Sparkle effect — brilhos aparecem ao redor
     */
    sparkle: (element: HTMLElement | null, options: SparkleOptions = {}): void => {
        if (!element) return

        const {
            count = 5,
            duration = 800,
            color = '#FFD700'
        } = options

        const rect = element.getBoundingClientRect()

        haptics.selection()

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div')
                const x = rect.left + Math.random() * rect.width
                const y = rect.top + Math.random() * rect.height

                sparkle.innerHTML = '✦'
                sparkle.style.cssText = `
                    position: fixed;
                    left: ${x}px;
                    top: ${y}px;
                    font-size: ${12 + Math.random() * 8}px;
                    color: ${color};
                    pointer-events: none;
                    z-index: 99999;
                `
                document.body.appendChild(sparkle)

                sparkle.animate([
                    { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                    { transform: 'scale(1) rotate(180deg)', opacity: 1, offset: 0.5 },
                    { transform: 'scale(0) rotate(360deg)', opacity: 0 }
                ], {
                    duration: duration,
                    easing: 'ease-out',
                    fill: 'forwards'
                })

                setTimeout(() => sparkle.remove(), duration)
            }, i * 100)
        }
    }
}

// ═══ COMBINED EFFECTS ═══
export const effects = {
    /**
     * Sucesso com confetti e haptic
     */
    success: (element: HTMLElement | null = null): void => {
        haptics.success()
        if (element) {
            particles.sparkle(element, { color: '#34C759' })
            const rect = element.getBoundingClientRect()
            confetti.success({
                x: (rect.left + rect.width / 2) / window.innerWidth,
                y: (rect.top + rect.height / 2) / window.innerHeight
            })
        } else {
            confetti.success()
        }
    },

    /**
     * Delete com dissolve e haptic
     */
    delete: async (element: HTMLElement | null): Promise<void> => {
        haptics.error()
        await particles.dissolve(element, {
            color: '#FF3B30',
            particleCount: 25
        })
    },

    /**
     * Celebração grande
     */
    celebrate: (): void => {
        haptics.success()
        confetti.celebrate()
    }
}

export default { confetti, particles, haptics, effects }
