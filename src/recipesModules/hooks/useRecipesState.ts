/**
 * ═══════════════════════════════════════════════════════════════════
 * useRecipesState — Centralized UI state management for Recipes
 * Encapsulates all local state from Recipes.tsx
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useEffect } from 'react'
import type { CategoryInput, NormalizedCategory } from '../components/recipeCategoryModules'

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_CATEGORIES: NormalizedCategory[] = [
    { name: 'Tradicionais', color: '#007AFF' },
    { name: 'Especiais', color: '#FF9500' },
    { name: 'Veganas', color: '#34C759' },
    { name: 'Doces', color: '#FF2D55' }
]

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface RecipesStateReturn {
    // Selection
    selectedId: string | number | null
    setSelectedId: (id: string | number | null) => void
    isEditing: boolean
    setIsEditing: (v: boolean) => void

    // Filters
    activeFilter: string
    setActiveFilter: (v: string) => void
    categories: NormalizedCategory[]
    setCategories: React.Dispatch<React.SetStateAction<NormalizedCategory[]>>

    // Loading/Error
    loading: boolean
    setLoading: (v: boolean) => void
    loadError: string | null
    setLoadError: (v: string | null) => void

    // Modals
    showCatModal: boolean
    setShowCatModal: (v: boolean) => void
    zoomedImage: string | null
    setZoomedImage: (v: string | null) => void
    imageToCrop: string | null
    setImageToCrop: (v: string | null) => void

    // Sync
    syncing: boolean
    setSyncing: (v: boolean) => void
    syncError: boolean
    setSyncError: (v: boolean) => void
    isUploading: boolean
    setIsUploading: (v: boolean) => void

    // Refs
    scrollRef: React.RefObject<HTMLDivElement | null>
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useRecipesState(): RecipesStateReturn {
    // Selection state
    const [selectedId, setSelectedId] = useState<string | number | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    // Filter state
    const [activeFilter, setActiveFilter] = useState('Todas')
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES)

    // Loading/Error state
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    // Modal state
    const [showCatModal, setShowCatModal] = useState(false)
    const [zoomedImage, setZoomedImage] = useState<string | null>(null)
    const [imageToCrop, setImageToCrop] = useState<string | null>(null)

    // Sync state
    const [syncing, setSyncing] = useState(false)
    const [syncError, setSyncError] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Refs
    const scrollRef = useRef<HTMLDivElement | null>(null)

    // Initialize loading state
    useEffect(() => {
        setLoading(false)
        setLoadError(null)
    }, [])

    return {
        // Selection
        selectedId,
        setSelectedId,
        isEditing,
        setIsEditing,

        // Filters
        activeFilter,
        setActiveFilter,
        categories,
        setCategories,

        // Loading/Error
        loading,
        setLoading,
        loadError,
        setLoadError,

        // Modals
        showCatModal,
        setShowCatModal,
        zoomedImage,
        setZoomedImage,
        imageToCrop,
        setImageToCrop,

        // Sync
        syncing,
        setSyncing,
        syncError,
        setSyncError,
        isUploading,
        setIsUploading,

        // Refs
        scrollRef
    }
}

export default useRecipesState
