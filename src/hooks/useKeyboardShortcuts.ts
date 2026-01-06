// ═══════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS HOOK — Global hotkeys for power users
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../stores/useUIStore'

// Keyboard shortcut definitions
const SHORTCUTS = {
    'g h': { path: '/', description: 'Ir para Home' },
    'g i': { path: '/inventory', description: 'Ir para Inventário' },
    'g r': { path: '/recipes', description: 'Ir para Receitas' },
    'g f': { path: '/fichatecnica', description: 'Ir para Fichas Técnicas' },
    'g p': { path: '/products', description: 'Ir para Produtos' },
    'g c': { path: '/costs', description: 'Ir para Custos' },
    'g s': { path: '/suppliers', description: 'Ir para Fornecedores' },
    'g k': { path: '/kanban', description: 'Ir para Kanban' },
    'g a': { path: '/padoca-ai', description: 'Ir para AI Assistant' },
} as const

type ShortcutKey = keyof typeof SHORTCUTS

export function useKeyboardShortcuts() {
    const navigate = useNavigate()
    const location = useLocation()
    const { show: showToast } = useToast()

    const handleKeySequence = useCallback((sequence: string) => {
        const shortcut = SHORTCUTS[sequence as ShortcutKey]
        if (shortcut && location.pathname !== shortcut.path) {
            navigate(shortcut.path)
            showToast(`Navegando: ${shortcut.description}`, 'info')
        }
    }, [navigate, location.pathname, showToast])

    useEffect(() => {
        let keyBuffer = ''
        let timeout: ReturnType<typeof setTimeout>

        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if we're typing in an input
            const target = e.target as HTMLElement
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
                target.contentEditable === 'true'

            if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return

            // Build key sequence
            const key = e.key.toLowerCase()
            if (key === 'escape') {
                keyBuffer = ''
                return
            }

            keyBuffer = keyBuffer ? `${keyBuffer} ${key}` : key

            // Clear after 1s of inactivity
            clearTimeout(timeout)
            timeout = setTimeout(() => { keyBuffer = '' }, 1000)

            // Check for shortcuts
            if (SHORTCUTS[keyBuffer as ShortcutKey]) {
                e.preventDefault()
                handleKeySequence(keyBuffer)
                keyBuffer = ''
            }

            // Help shortcut
            if (keyBuffer === '?') {
                e.preventDefault()
                showToast('Atalhos: g h (Home), g i (Inventário), g r (Receitas), g c (Custos)', 'info')
                keyBuffer = ''
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            clearTimeout(timeout)
        }
    }, [handleKeySequence, showToast])
}

export function useCommandPalette(isOpen: boolean, onClose: () => void) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                // Toggle command palette
            }
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])
}

export const SHORTCUT_LIST = Object.entries(SHORTCUTS).map(([key, value]) => ({
    key,
    ...value
}))
