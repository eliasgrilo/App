import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * ═══════════════════════════════════════════════════════════════════
 * THEME STORE — Zustand-based Theme Management with Persistence
 * Supports Light, Dark, and Auto (system) themes
 * ═══════════════════════════════════════════════════════════════════
 */

export type ThemeMode = 'light' | 'dark' | 'auto'

// ═══ STATE INTERFACE ═══
interface ThemeState {
    theme: ThemeMode
}

interface ThemeActions {
    setTheme: (theme: ThemeMode) => void
    applyTheme: () => void
}

type ThemeStore = ThemeState & ThemeActions

// ═══ HELPER FUNCTIONS ═══
const applyThemeToDOM = (theme: ThemeMode): void => {
    const root = document.documentElement

    // Remove any existing theme class first
    root.classList.remove('dark')

    if (theme === 'dark') {
        root.classList.add('dark')
    } else if (theme === 'light') {
        // Already removed above
    } else {
        // Auto: follow system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
            root.classList.add('dark')
        }
    }
}

// ═══ INITIAL STATE ═══
const initialState: ThemeState = {
    theme: 'auto'
}

// ═══ STORE ═══
export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            setTheme: (theme) => {
                set({ theme })
                applyThemeToDOM(theme)
            },

            applyTheme: () => {
                applyThemeToDOM(get().theme)
            }
        }),
        {
            name: 'padoca-theme',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                theme: state.theme
            }),
            onRehydrateStorage: () => (state) => {
                // Apply theme when store rehydrates
                if (state) {
                    applyThemeToDOM(state.theme)
                }
            }
        }
    )
)

// ═══ CONVENIENCE HOOK ═══
// Uses shallow equality by default for selector stability
export const useTheme = () => {
    const store = useThemeStore()

    return {
        theme: store.theme,
        setTheme: store.setTheme,
        applyTheme: store.applyTheme
    }
}

// ═══ INIT FUNCTION ═══
// Call this once when app starts to set up system preference listener
export const initTheme = (): (() => void) => {
    // Apply theme immediately on init
    const currentTheme = useThemeStore.getState().theme
    applyThemeToDOM(currentTheme)

    // Listen for system preference changes (when theme is 'auto')
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
        if (useThemeStore.getState().theme === 'auto') {
            applyThemeToDOM('auto')
        }
    }

    mediaQuery.addEventListener('change', handleChange)

    // Return cleanup function
    return () => {
        mediaQuery.removeEventListener('change', handleChange)
    }
}

export default useThemeStore
