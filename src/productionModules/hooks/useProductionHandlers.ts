/**
 * ═══════════════════════════════════════════════════════════════════
 * useProductionHandlers — Action handlers for Production
 * Extracted from Production.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useCallback, ChangeEvent } from 'react'
import type { InputState, InputModalState, Recipes } from '../types'
import { DEFAULT_INPUT_STATE } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface ModalContext {
    confirm: (opts: { title: string; message: string; isDangerous?: boolean; onConfirm: () => void }) => void
}

export interface UseProductionHandlersProps {
    inputs: InputState
    setInputs: React.Dispatch<React.SetStateAction<InputState>>
    recipes: Recipes
    setRecipes: React.Dispatch<React.SetStateAction<Recipes>>
    setInputModal: (v: InputModalState | null) => void
    modal: ModalContext
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export interface ProductionHandlersReturn {
    saveRecipe: () => void
    loadRecipe: (name: string) => void
    deleteRecipe: (name: string) => void
    renameRecipe: (oldName: string) => void
    exportJSON: () => void
    importJSON: (e: ChangeEvent<HTMLInputElement>) => void
    clearForm: () => void
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useProductionHandlers({
    inputs, setInputs, recipes, setRecipes, setInputModal, modal, showToast
}: UseProductionHandlersProps): ProductionHandlersReturn {

    const saveRecipe = useCallback(() => {
        setInputModal({
            title: 'Salvar Receita',
            placeholder: 'Nome da receita',
            defaultValue: '',
            onConfirm: (name: string): void => {
                if (!name) return
                setRecipes(prev => ({ ...prev, [name]: inputs }))
                setInputModal(null)
            },
            onCancel: () => setInputModal(null)
        })
    }, [inputs, setRecipes, setInputModal])

    const loadRecipe = useCallback((name: string) => {
        const r = recipes[name]
        if (!r) return
        setInputs(r as InputState)
    }, [recipes, setInputs])

    const deleteRecipe = useCallback((name: string) => {
        modal.confirm({
            title: 'Excluir Receita',
            message: `A receita "${name}" será excluída permanentemente.`,
            isDangerous: true,
            onConfirm: () => {
                setRecipes(prev => {
                    const next = { ...prev }
                    delete next[name]
                    return next
                })
            }
        })
    }, [modal, setRecipes])

    const renameRecipe = useCallback((oldName: string) => {
        setInputModal({
            title: 'Renomear Receita',
            placeholder: 'Novo nome',
            defaultValue: oldName,
            onConfirm: (newName: string): void => {
                if (!newName || newName === oldName) return
                const oldRecipe = recipes[oldName]
                if (!oldRecipe) return
                setRecipes(prev => {
                    const next = { ...prev, [newName]: oldRecipe }
                    delete next[oldName]
                    return next
                })
                setInputModal(null)
            },
            onCancel: () => setInputModal(null)
        })
    }, [recipes, setRecipes, setInputModal])

    const exportJSON = useCallback(() => {
        const data = JSON.stringify({ inputs, recipes }, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'padoca_pizza_recipes.json'
        a.click()
        URL.revokeObjectURL(url)
    }, [inputs, recipes])

    const importJSON = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(String(evt.target?.result || '{}'))
                if (parsed.inputs) setInputs(parsed.inputs)
                if (parsed.recipes) setRecipes(parsed.recipes)
                showToast('Importação concluída!', 'success')
            } catch (err) { showToast('Arquivo inválido.', 'error') }
        }
        reader.readAsText(file)
        e.target.value = ''
    }, [setInputs, setRecipes, showToast])

    const clearForm = useCallback(() => {
        setInputs(DEFAULT_INPUT_STATE)
    }, [setInputs])

    return {
        saveRecipe,
        loadRecipe,
        deleteRecipe,
        renameRecipe,
        exportJSON,
        importJSON,
        clearForm
    }
}

export default useProductionHandlers
