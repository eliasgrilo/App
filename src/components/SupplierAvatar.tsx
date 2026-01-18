/**
 * ═══════════════════════════════════════════════════════════════════
 * SUPPLIER AVATAR — Reusable Avatar Component
 * Shows supplier image if available, otherwise shows initials
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'

interface SupplierAvatarProps {
    name: string
    image?: string | null
    size?: 'xs' | 'sm' | 'md' | 'lg'
    className?: string
}

// Size configurations
const SIZES = {
    xs: { container: 'w-6 h-6', text: 'text-[9px]' },
    sm: { container: 'w-8 h-8', text: 'text-[10px]' },
    md: { container: 'w-10 h-10', text: 'text-xs' },
    lg: { container: 'w-12 h-12', text: 'text-sm' }
}

// Generate consistent color from name
function getColorFromName(name: string): string {
    const colors = [
        'bg-blue-500', 'bg-emerald-500', 'bg-purple-500',
        'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
        'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
    ]
    const charCode = name.charCodeAt(0) || 0
    return colors[charCode % colors.length] ?? 'bg-blue-500'
}

// Get initials from name (max 2 chars)
function getInitials(name: string): string {
    if (!name) return '?'
    const words = name.trim().split(/\s+/)
    if (words.length >= 2) {
        return (words[0]?.[0] || '').toUpperCase() + (words[1]?.[0] || '').toUpperCase()
    }
    return (name.substring(0, 2) || '').toUpperCase()
}

export function SupplierAvatar({ name, image, size = 'md', className = '' }: SupplierAvatarProps) {
    const sizeConfig = SIZES[size]
    const bgColor = getColorFromName(name)
    const initials = getInitials(name)

    // If image exists and is valid
    if (image) {
        return (
            <div
                className={`${sizeConfig.container} rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/20 dark:ring-black/20 ${className}`}
            >
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                            parent.classList.add(bgColor, 'flex', 'items-center', 'justify-center')
                            parent.innerHTML = `<span class="${sizeConfig.text} font-semibold text-white">${initials}</span>`
                        }
                    }}
                />
            </div>
        )
    }

    // Initials fallback
    return (
        <div
            className={`${sizeConfig.container} ${bgColor} rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white/20 dark:ring-black/20 ${className}`}
        >
            <span className={`${sizeConfig.text} font-semibold text-white`}>
                {initials}
            </span>
        </div>
    )
}

export default SupplierAvatar
