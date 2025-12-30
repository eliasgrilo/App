/**
 * SF Symbols — Apple-Quality Icon System
 * Custom SVG icons designed to match SF Pro typography
 * Weights: ultralight, thin, light, regular, medium, semibold, bold, heavy, black
 * Renders: monochrome, hierarchical, multicolor
 */

import { memo, forwardRef } from 'react'

// Icon wrapper with consistent sizing and animation support
const IconWrapper = forwardRef(({
    children,
    size = 20,
    className = '',
    color,
    secondaryColor,
    animate = false,
    ...props
}, ref) => (
    <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`sf-symbol ${animate ? 'sf-symbol--animate' : ''} ${className}`}
        style={{
            '--sf-primary': color || 'currentColor',
            '--sf-secondary': secondaryColor || 'currentColor'
        }}
        {...props}
    >
        {children}
    </svg>
))
IconWrapper.displayName = 'IconWrapper'

// ────────────────────────────────────────
// STATUS & ALERT ICONS
// ────────────────────────────────────────

export const ExclamationTriangle = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M12 2L2 20h20L12 2z"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : variant === 'light' ? 1.2 : 1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <path
            d="M12 9v4"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : variant === 'light' ? 1.2 : 1.8}
            strokeLinecap="round"
        />
        <circle cx="12" cy="16" r="1" fill="var(--sf-primary)" />
    </IconWrapper>
))
ExclamationTriangle.displayName = 'ExclamationTriangle'

export const ExclamationCircle = memo(({ size = 20, variant = 'regular', filled = false, ...props }) => (
    <IconWrapper size={size} {...props}>
        <circle
            cx="12" cy="12" r="10"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill={filled ? 'var(--sf-primary)' : 'none'}
        />
        <path
            d="M12 8v4"
            stroke={filled ? 'white' : 'var(--sf-primary)'}
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
        />
        <circle cx="12" cy="15" r="1" fill={filled ? 'white' : 'var(--sf-primary)'} />
    </IconWrapper>
))
ExclamationCircle.displayName = 'ExclamationCircle'

export const CheckmarkCircle = memo(({ size = 20, variant = 'regular', filled = false, ...props }) => (
    <IconWrapper size={size} {...props}>
        <circle
            cx="12" cy="12" r="10"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill={filled ? 'var(--sf-primary)' : 'none'}
        />
        <path
            d="M8 12l3 3 5-6"
            stroke={filled ? 'white' : 'var(--sf-primary)'}
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </IconWrapper>
))
CheckmarkCircle.displayName = 'CheckmarkCircle'

export const XMarkCircle = memo(({ size = 20, variant = 'regular', filled = false, ...props }) => (
    <IconWrapper size={size} {...props}>
        <circle
            cx="12" cy="12" r="10"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill={filled ? 'var(--sf-primary)' : 'none'}
        />
        <path
            d="M9 9l6 6M15 9l-6 6"
            stroke={filled ? 'white' : 'var(--sf-primary)'}
            strokeWidth={variant === 'bold' ? 2 : 1.8}
            strokeLinecap="round"
        />
    </IconWrapper>
))
XMarkCircle.displayName = 'XMarkCircle'

// ────────────────────────────────────────
// TREND & CHART ICONS
// ────────────────────────────────────────

export const ArrowTrendUp = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M3 17l6-6 4 4 8-8"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <path
            d="M14 5h7v7"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </IconWrapper>
))
ArrowTrendUp.displayName = 'ArrowTrendUp'

export const ArrowTrendDown = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M3 7l6 6 4-4 8 8"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <path
            d="M14 19h7v-7"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </IconWrapper>
))
ArrowTrendDown.displayName = 'ArrowTrendDown'

export const ChevronUp = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M18 15l-6-6-6 6"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </IconWrapper>
))
ChevronUp.displayName = 'ChevronUp'

export const ChevronDown = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M6 9l6 6 6-6"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </IconWrapper>
))
ChevronDown.displayName = 'ChevronDown'

// ────────────────────────────────────────
// INVENTORY & PRODUCT ICONS
// ────────────────────────────────────────

export const Cube = memo(({ size = 20, variant = 'regular', filled = false, ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill={filled ? 'var(--sf-primary)' : 'none'}
        />
        <path
            d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
            stroke={filled ? 'white' : 'var(--sf-primary)'}
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </IconWrapper>
))
Cube.displayName = 'Cube'

export const CubeStack = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M12 2L2 7l10 5 10-5-10-5z"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <path
            d="M2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="var(--sf-secondary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.5"
        />
    </IconWrapper>
))
CubeStack.displayName = 'CubeStack'

export const ShippingBox = memo(({ size = 20, variant = 'regular', open = false, ...props }) => (
    <IconWrapper size={size} {...props}>
        {open ? (
            <>
                <path
                    d="M3 9l9-4 9 4v6a2 2 0 01-1 1.73l-7 4a2 2 0 01-2 0l-7-4A2 2 0 013 15V9z"
                    stroke="var(--sf-primary)"
                    strokeWidth={variant === 'bold' ? 2 : 1.5}
                    fill="none"
                />
                <path
                    d="M12 5v7.5M3 9l9 4.5 9-4.5"
                    stroke="var(--sf-primary)"
                    strokeWidth={variant === 'bold' ? 2 : 1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Flaps open */}
                <path
                    d="M3 9L1 7M21 9l2-2"
                    stroke="var(--sf-secondary)"
                    strokeWidth={variant === 'bold' ? 2 : 1.5}
                    strokeLinecap="round"
                    opacity="0.6"
                />
            </>
        ) : (
            <>
                <path
                    d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                    stroke="var(--sf-primary)"
                    strokeWidth={variant === 'bold' ? 2 : 1.5}
                    fill="none"
                />
                <path
                    d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
                    stroke="var(--sf-primary)"
                    strokeWidth={variant === 'bold' ? 2 : 1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </>
        )}
    </IconWrapper>
))
ShippingBox.displayName = 'ShippingBox'

// ────────────────────────────────────────
// MOVEMENT & FLOW ICONS
// ────────────────────────────────────────

export const ArrowDown = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M12 5v14M19 12l-7 7-7-7"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </IconWrapper>
))
ArrowDown.displayName = 'ArrowDown'

export const ArrowUp = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </IconWrapper>
))
ArrowUp.displayName = 'ArrowUp'

export const ArrowLeftRight = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M17 8l4 4-4 4M7 16l-4-4 4-4"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <path
            d="M3 12h18"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
        />
    </IconWrapper>
))
ArrowLeftRight.displayName = 'ArrowLeftRight'

export const PlusCircle = memo(({ size = 20, variant = 'regular', filled = false, ...props }) => (
    <IconWrapper size={size} {...props}>
        <circle
            cx="12" cy="12" r="10"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill={filled ? 'var(--sf-primary)' : 'none'}
        />
        <path
            d="M12 8v8M8 12h8"
            stroke={filled ? 'white' : 'var(--sf-primary)'}
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
        />
    </IconWrapper>
))
PlusCircle.displayName = 'PlusCircle'

export const MinusCircle = memo(({ size = 20, variant = 'regular', filled = false, ...props }) => (
    <IconWrapper size={size} {...props}>
        <circle
            cx="12" cy="12" r="10"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill={filled ? 'var(--sf-primary)' : 'none'}
        />
        <path
            d="M8 12h8"
            stroke={filled ? 'white' : 'var(--sf-primary)'}
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
        />
    </IconWrapper>
))
MinusCircle.displayName = 'MinusCircle'

// ────────────────────────────────────────
// STATE & ACTIVITY ICONS
// ────────────────────────────────────────

export const Moon = memo(({ size = 20, variant = 'regular', filled = false, ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={filled ? 'var(--sf-primary)' : 'none'}
        />
    </IconWrapper>
))
Moon.displayName = 'Moon'

export const QuestionMark = memo(({ size = 20, variant = 'regular', filled = false, ...props }) => (
    <IconWrapper size={size} {...props}>
        <circle
            cx="12" cy="12" r="10"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill={filled ? 'var(--sf-primary)' : 'none'}
        />
        <path
            d="M9 9a3 3 0 115.12 2.12A2.25 2.25 0 0012 13.5"
            stroke={filled ? 'white' : 'var(--sf-primary)'}
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <circle cx="12" cy="17" r="1" fill={filled ? 'white' : 'var(--sf-primary)'} />
    </IconWrapper>
))
QuestionMark.displayName = 'QuestionMark'

// ────────────────────────────────────────
// FINANCE & VALUE ICONS
// ────────────────────────────────────────

export const CurrencyReal = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <circle
            cx="12" cy="12" r="10"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill="none"
        />
        <text
            x="12" y="16"
            textAnchor="middle"
            fill="var(--sf-primary)"
            fontSize="11"
            fontWeight={variant === 'bold' ? '700' : '600'}
            fontFamily="system-ui, -apple-system, sans-serif"
        >
            R$
        </text>
    </IconWrapper>
))
CurrencyReal.displayName = 'CurrencyReal'

export const ChartBar = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M18 20V10M12 20V4M6 20v-6"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 3 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </IconWrapper>
))
ChartBar.displayName = 'ChartBar'

export const Sparkles = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 1.8 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <path
            d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"
            stroke="var(--sf-secondary)"
            strokeWidth={variant === 'bold' ? 1.5 : 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.7"
        />
        <path
            d="M19 14l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z"
            stroke="var(--sf-secondary)"
            strokeWidth={variant === 'bold' ? 1.5 : 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.7"
        />
    </IconWrapper>
))
Sparkles.displayName = 'Sparkles'

// ────────────────────────────────────────
// NAVIGATION & ACTION ICONS
// ────────────────────────────────────────

export const MagnifyingGlass = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <circle
            cx="11" cy="11" r="7"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill="none"
        />
        <path
            d="M21 21l-4.35-4.35"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
        />
    </IconWrapper>
))
MagnifyingGlass.displayName = 'MagnifyingGlass'

export const Camera = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <rect
            x="3" y="6" width="18" height="14" rx="2"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill="none"
        />
        <circle
            cx="12" cy="13" r="3"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill="none"
        />
        <path
            d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
        />
    </IconWrapper>
))
Camera.displayName = 'Camera'

export const ArrowDownTray = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 3v12M7 10l5 5 5-5"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </IconWrapper>
))
ArrowDownTray.displayName = 'ArrowDownTray'

export const Document = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <path
            d="M14 2v6h6"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </IconWrapper>
))
Document.displayName = 'Document'

export const Ellipsis = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <circle cx="12" cy="12" r="1.5" fill="var(--sf-primary)" />
        <circle cx="6" cy="12" r="1.5" fill="var(--sf-primary)" />
        <circle cx="18" cy="12" r="1.5" fill="var(--sf-primary)" />
    </IconWrapper>
))
Ellipsis.displayName = 'Ellipsis'

export const XMark = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M18 6L6 18M6 6l12 12"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </IconWrapper>
))
XMark.displayName = 'XMark'

// ────────────────────────────────────────
// SPECIALTY ICONS (FOOD & BAKERY)
// ────────────────────────────────────────

export const Wheat = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M12 22V12M9 12s-3-2-3-5c0-3 3-5 6-5s6 2 6 5c0 3-3 5-3 5"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <path
            d="M8 18s-2-1-2-3c0-2 2-3 4-3M16 18s2-1 2-3c0-2-2-3-4-3"
            stroke="var(--sf-secondary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.6"
        />
    </IconWrapper>
))
Wheat.displayName = 'Wheat'

export const Truck = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <path
            d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <circle cx="5.5" cy="18.5" r="2.5" stroke="var(--sf-primary)" strokeWidth={variant === 'bold' ? 2 : 1.5} fill="none" />
        <circle cx="18.5" cy="18.5" r="2.5" stroke="var(--sf-primary)" strokeWidth={variant === 'bold' ? 2 : 1.5} fill="none" />
    </IconWrapper>
))
Truck.displayName = 'Truck'

export const Clock = memo(({ size = 20, variant = 'regular', ...props }) => (
    <IconWrapper size={size} {...props}>
        <circle
            cx="12" cy="12" r="10"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            fill="none"
        />
        <path
            d="M12 6v6l4 2"
            stroke="var(--sf-primary)"
            strokeWidth={variant === 'bold' ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </IconWrapper>
))
Clock.displayName = 'Clock'

// ────────────────────────────────────────
// EXPORT ALL
// ────────────────────────────────────────

const SFSymbols = {
    ExclamationTriangle,
    ExclamationCircle,
    CheckmarkCircle,
    XMarkCircle,
    ArrowTrendUp,
    ArrowTrendDown,
    ChevronUp,
    ChevronDown,
    Cube,
    CubeStack,
    ShippingBox,
    ArrowDown,
    ArrowUp,
    ArrowLeftRight,
    PlusCircle,
    MinusCircle,
    Moon,
    QuestionMark,
    CurrencyReal,
    ChartBar,
    Sparkles,
    MagnifyingGlass,
    Camera,
    ArrowDownTray,
    Document,
    Ellipsis,
    XMark,
    Wheat,
    Truck,
    Clock
}

export default SFSymbols
