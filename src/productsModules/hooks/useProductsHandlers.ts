// ═══════════════════════════════════════════════════════════════════
// PRODUCTS MODULE — useProductsHandlers Hook
// Handlers for Products component
// ═══════════════════════════════════════════════════════════════════

import { useCallback } from 'react'
import { useModal, useToast } from '../../stores/useUIStore'
import type { StockMovement } from '../../stores/useAppStore'
import type { Ingredient } from '../../types'
import { TYPES, DEFAULT_FORM, REASON_BY_TYPE, type MovementForm, type SimpleMovementType, type UnitType } from '../types'

const getStock = (i: Ingredient) => (i.packageQuantity || 0) * (i.packageCount || 1)

interface UseProductsHandlersProps {
    items: Ingredient[]
    form: MovementForm
    setForm: React.Dispatch<React.SetStateAction<MovementForm>>
    setOpen: (open: boolean) => void
    setItemSearch: (val: string) => void
    addMovement: (m: Omit<StockMovement, 'id' | 'timestamp'>) => void
    deleteMovement: (id: string) => void
    updateIngredient: (id: number, data: Partial<Ingredient>) => void
}

export function useProductsHandlers({
    items, form, setForm, setOpen, setItemSearch,
    addMovement, deleteMovement, updateIngredient
}: UseProductsHandlersProps) {
    const { modal } = useModal()
    const { toast } = useToast()

    const save = useCallback(() => {
        if (!form.itemId || !form.qty || !form.reasonLabel) {
            toast.error('Preencha todos os campos'); return
        }
        const it = items.find(i => i.id === form.itemId)!
        const q = parseFloat(form.qty), t = TYPES[form.type]
        const prev = getStock(it), next = t.isOut ? prev - q : prev + q
        const fullReason = form.reasonNote ? `${form.reasonLabel} - ${form.reasonNote}` : form.reasonLabel

        addMovement({
            itemId: it.id, itemName: it.name, type: form.type, quantity: q, unit: form.unit,
            previousStock: prev, newStock: next, costAtTime: (it.pricePerUnit || 0) * q, reason: fullReason
        })
        updateIngredient(it.id, { packageCount: Math.max(0, next / (it.packageQuantity || 1)) })
        toast.success('Movimentação salva')
        setOpen(false)
        setForm(DEFAULT_FORM)
        setItemSearch('')
    }, [form, items, addMovement, updateIngredient, toast, setOpen, setForm, setItemSearch])

    const remove = useCallback((m: StockMovement) => {
        modal.confirm({
            title: 'Excluir Movimentação',
            message: `A movimentação "${m.itemName}" será removida permanentemente.`,
            isDangerous: true,
            onConfirm: () => { deleteMovement(m.id); toast.success('Excluído') }
        })
    }, [modal, deleteMovement, toast])

    const selectItem = useCallback((item: Ingredient) => {
        setForm(f => ({ ...f, itemId: item.id, unit: (item.unit as UnitType) || 'kg' }))
        setItemSearch('')
    }, [setForm, setItemSearch])

    const changeType = useCallback((type: SimpleMovementType) => {
        setForm(f => ({
            ...f, type, reasonLabel: REASON_BY_TYPE[type][0] || '', reasonNote: ''
        }))
    }, [setForm])

    const clearItem = useCallback(() => {
        setForm(f => ({ ...f, itemId: 0 }))
        setItemSearch('')
    }, [setForm, setItemSearch])

    return { save, remove, selectItem, changeType, clearItem }
}

export type ProductsHandlersReturn = ReturnType<typeof useProductsHandlers>
