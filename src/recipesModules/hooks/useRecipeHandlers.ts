/**
 * ═══════════════════════════════════════════════════════════════════
 * useRecipeHandlers — CRUD operations and handlers for Recipes
 * Encapsulates all handler functions from Recipes.tsx
 * ═══════════════════════════════════════════════════════════════════
 */

import { useMemo, useCallback } from 'react'
import { compressImage } from '../utils/recipeUtils'
import type { Recipe, RecipeSection } from '../../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type { Recipe }

export interface ToastContextType {
    success: (msg: string) => void
    error: (msg: string) => void
    info: (msg: string) => void
}

export interface ModalContextType {
    close: () => void
    confirm: (opts: {
        title: string
        message: string
        isDangerous?: boolean
        onConfirm: () => void
    }) => void
}

export interface UseRecipeHandlersProps {
    selectedId: string | number | null
    setSelectedId: (id: string | number | null) => void
    isEditing: boolean
    setIsEditing: (v: boolean) => void
    setSyncing: (v: boolean) => void
    setSyncError: (v: boolean) => void
    setIsUploading: (v: boolean) => void
    setImageToCrop: (v: string | null) => void
    storeUpdateRecipe: (id: any, changes: any) => void
    storeRemoveRecipe: (id: any) => void
    recipes: Recipe[]
    toast: ToastContextType
    modal: ModalContextType
}

export interface RecipeHandlersReturn {
    updateRecipe: (id: any, changes: any) => void
    handleDeleteRecipe: (id: any) => void
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onCropComplete: (croppedImage: string) => Promise<void>
    finishEditing: () => void
    selected: Recipe | undefined
    filtered: Recipe[]
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useRecipeHandlers({
    selectedId,
    setSelectedId,
    isEditing,
    setIsEditing,
    setSyncing,
    setSyncError,
    setIsUploading,
    setImageToCrop,
    storeUpdateRecipe,
    storeRemoveRecipe,
    recipes,
    toast,
    modal
}: UseRecipeHandlersProps): RecipeHandlersReturn {

    // Derived state
    const selected = useMemo(
        () => recipes.find(r => String(r.id) === String(selectedId)),
        [recipes, selectedId]
    )

    const filtered = useMemo(
        () => recipes,
        [recipes]
    )

    /**
     * Update recipe - syncs to Zustand store
     */
    const updateRecipe = useCallback((id: any, changes: any) => {
        setSyncing(true)
        setSyncError(false)

        storeUpdateRecipe(id, { ...changes, updatedAt: new Date().toISOString() })

        // Simulate brief sync indicator
        setTimeout(() => setSyncing(false), 300)
    }, [storeUpdateRecipe, setSyncing, setSyncError])

    /**
     * Delete recipe
     */
    const handleDeleteRecipe = useCallback((id: any) => {
        modal.close()
        storeRemoveRecipe(id)

        if (String(selectedId) === String(id)) {
            setSelectedId(null)
        }
    }, [modal, storeRemoveRecipe, selectedId, setSelectedId])

    /**
     * Handle image upload - opens cropper
     */
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!selectedId) {
            toast.error('Nenhuma receita selecionada.')
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            setImageToCrop(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Reset input so same file can be selected again
        e.target.value = ''
    }, [selectedId, toast, setImageToCrop])

    /**
     * Handle crop complete - compress and save
     */
    const onCropComplete = useCallback(async (croppedImage: string) => {
        try {
            setIsUploading(true)
            setImageToCrop(null)

            // Compress the cropped image result
            const compressed = await compressImage(croppedImage)
            updateRecipe(selectedId, { image: compressed })

            toast.success('Imagem atualizada!')
        } catch (err) {
            console.error(err)
            toast.error('Erro ao processar imagem.')
        } finally {
            setIsUploading(false)
        }
    }, [selectedId, setIsUploading, setImageToCrop, updateRecipe, toast])

    /**
     * Finish editing: clean up empty rows from all sections
     */
    const finishEditing = useCallback(() => {
        if (selected && selected.sections) {
            const cleanedSections = selected.sections.map((section: RecipeSection) => {
                if (section.type === 'ingredients') {
                    return {
                        ...section,
                        items: (section.items || []).filter((item: any) =>
                            item.name?.trim() || item.quantity?.trim()
                        )
                    }
                }
                if (section.type === 'instructions') {
                    return {
                        ...section,
                        items: (section.items || []).filter((item: any) =>
                            item.text?.trim()
                        )
                    }
                }
                return section
            })
            updateRecipe(selectedId, { sections: cleanedSections })
        }
        setIsEditing(false)
    }, [selected, selectedId, updateRecipe, setIsEditing])

    return {
        updateRecipe,
        handleDeleteRecipe,
        handleImageUpload,
        onCropComplete,
        finishEditing,
        selected,
        filtered
    }
}

export default useRecipeHandlers
