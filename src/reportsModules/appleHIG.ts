/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * APPLE HIG DESIGN TOKENS — Constantes de Design Apple
 * 
 * Definições oficiais do Apple Human Interface Guidelines:
 * - Paleta de cores semânticas
 * - Tipografia SF Pro
 * - Sistema de espaçamento 8pt
 * - Configurações de animação
 * - Raios de borda
 * - Sombras
 * 
 * Referência: https://developer.apple.com/design/human-interface-guidelines/
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// APPLE SEMANTIC COLORS
// ═══════════════════════════════════════════════════════════════════════════════

export const APPLE_COLORS = {
    // Primary Colors
    blue: '#007AFF',
    green: '#34C759',
    indigo: '#5856D6',
    orange: '#FF9500',
    pink: '#FF2D55',
    purple: '#AF52DE',
    red: '#FF3B30',
    teal: '#5AC8FA',
    yellow: '#FFCC00',

    // Grayscale - Light Mode
    label: '#1d1d1f',           // Primary text
    secondaryLabel: '#86868b',  // Secondary text
    tertiaryLabel: '#aeaeb2',   // Tertiary text
    quaternaryLabel: '#c7c7cc', // Quaternary text

    // Backgrounds - Light Mode
    systemBackground: '#ffffff',
    secondaryBackground: '#f5f5f7',
    tertiaryBackground: '#e8e8ed',

    // Separators
    separator: 'rgba(60, 60, 67, 0.12)',
    opaqueSeparator: '#c6c6c8',

    // Fills - Light Mode
    fill: 'rgba(120, 120, 128, 0.2)',
    secondaryFill: 'rgba(120, 120, 128, 0.16)',
    tertiaryFill: 'rgba(118, 118, 128, 0.12)',
    quaternaryFill: 'rgba(116, 116, 128, 0.08)',
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// APPLE DARK MODE COLORS
// ═══════════════════════════════════════════════════════════════════════════════

export const APPLE_COLORS_DARK = {
    // Primary Colors (same in dark mode)
    blue: '#0A84FF',
    green: '#30D158',
    indigo: '#5E5CE6',
    orange: '#FF9F0A',
    pink: '#FF375F',
    purple: '#BF5AF2',
    red: '#FF453A',
    teal: '#64D2FF',
    yellow: '#FFD60A',

    // Grayscale - Dark Mode
    label: '#ffffff',
    secondaryLabel: '#98989d',
    tertiaryLabel: '#545458',
    quaternaryLabel: '#3a3a3c',

    // Backgrounds - Dark Mode
    systemBackground: '#000000',
    secondaryBackground: '#1c1c1e',
    tertiaryBackground: '#2c2c2e',
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY — SF Pro
// ═══════════════════════════════════════════════════════════════════════════════

export const APPLE_TYPOGRAPHY = {
    // Font Family
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',

    // Font Weights
    weights: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    // Font Sizes (iOS scale)
    sizes: {
        caption2: '11px',
        caption1: '12px',
        footnote: '13px',
        subheadline: '15px',
        body: '17px',
        headline: '17px', // Semibold
        title3: '20px',
        title2: '22px',
        title1: '28px',
        largeTitle: '34px',
    },

    // Line Heights
    lineHeights: {
        tight: 1.2,
        normal: 1.4,
        relaxed: 1.6,
    }
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// 8PT GRID SPACING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const APPLE_SPACING = {
    xs: '4px',   // 0.5 units
    sm: '8px',   // 1 unit
    md: '16px',  // 2 units
    lg: '24px',  // 3 units
    xl: '32px',  // 4 units
    '2xl': '40px', // 5 units
    '3xl': '48px', // 6 units
    '4xl': '56px', // 7 units
    '5xl': '64px', // 8 units
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// BORDER RADIUS — Apple Continuous Corners
// ═══════════════════════════════════════════════════════════════════════════════

export const APPLE_RADIUS = {
    sm: '6px',    // Small elements
    md: '10px',   // Buttons, inputs
    lg: '12px',   // Cards, modals (continuous corner)
    xl: '16px',   // Large cards
    '2xl': '20px', // App icons
    full: '9999px', // Pills, avatars
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOWS — Apple Layering
// ═══════════════════════════════════════════════════════════════════════════════

export const APPLE_SHADOWS = {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.16)',
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION — Spring Physics
// ═══════════════════════════════════════════════════════════════════════════════

export const APPLE_ANIMATION = {
    // Spring configurations
    spring: {
        // Default - Balanced
        default: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 30,
        },
        // Bouncy - For buttons and toggles
        bouncy: {
            type: 'spring' as const,
            stiffness: 400,
            damping: 25,
        },
        // Gentle - For modals and overlays
        gentle: {
            type: 'spring' as const,
            stiffness: 200,
            damping: 25,
        },
        // Stiff - For micro-interactions
        stiff: {
            type: 'spring' as const,
            stiffness: 500,
            damping: 35,
        },
    },

    // Duration presets
    durations: {
        instant: 0.1,
        fast: 0.2,
        normal: 0.3,
        slow: 0.5,
    },

    // Easing curves (for non-spring animations)
    easing: {
        easeOut: [0.16, 1, 0.3, 1],
        easeIn: [0.55, 0.055, 0.675, 0.19],
        easeInOut: [0.65, 0, 0.35, 1],
    }
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// TAILWIND CLASS HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const APPLE_CLASSES = {
    // Text colors
    textPrimary: 'text-[#1d1d1f] dark:text-white',
    textSecondary: 'text-[#86868b] dark:text-[#98989d]',
    textTertiary: 'text-[#aeaeb2] dark:text-[#545458]',

    // Background colors
    bgPrimary: 'bg-white dark:bg-[#1c1c1e]',
    bgSecondary: 'bg-[#f5f5f7] dark:bg-[#2c2c2e]',
    bgTertiary: 'bg-[#e8e8ed] dark:bg-[#3a3a3c]',

    // Border colors
    borderLight: 'border-[#c6c6c8]/40 dark:border-[#3a3a3c]/60',

    // Common button styles
    buttonPrimary: `
        bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#0077ED]
        text-white font-semibold
        rounded-xl px-4 py-2.5
        transition-colors duration-150
    `,

    // Card styles
    card: `
        bg-white dark:bg-[#1c1c1e]
        border border-[#c6c6c8]/30 dark:border-[#3a3a3c]/50
        rounded-2xl
        shadow-sm
    `,
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type AppleColor = keyof typeof APPLE_COLORS
export type AppleSpacing = keyof typeof APPLE_SPACING
export type AppleRadius = keyof typeof APPLE_RADIUS
