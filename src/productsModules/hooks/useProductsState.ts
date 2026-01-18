// ═══════════════════════════════════════════════════════════════════
// PRODUCTS MODULE — useProductsState Hook
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react'
import { useInventoryItems } from '../../Inventory'
import { useAppStore, useStockMovements, type StockMovement, type MovementType } from '../../stores/useAppStore'
import type { Ingredient } from '../../types'
import { DEFAULT_FORM, getDateLabel, type MovementForm, type PeriodFilter, type UnitType } from '../types'

const getStock = (i: Ingredient) => (i.packageQuantity || 0) * (i.packageCount || 1)

export function useProductsState() {
    const items = useInventoryItems()
    const movements = useStockMovements()
    const addMovement = useAppStore(s => s.addStockMovement)
    const deleteMovement = useAppStore(s => s.deleteStockMovement)
    const updateIngredient = useAppStore(s => s.updateIngredient)

    // UI State
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [itemSearch, setItemSearch] = useState('')
    const [showItemResults, setShowItemResults] = useState(false)
    const [period, setPeriod] = useState<PeriodFilter>('all')
    const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all')
    const [form, setForm] = useState<MovementForm>(DEFAULT_FORM)

    const filteredItems = useMemo(() => {
        if (!itemSearch.trim() || itemSearch.trim().length < 2) return []
        const words = itemSearch.toLowerCase().split(/\s+/).filter(w => w.length > 0)
        return items.filter(i => {
            const name = i.name.toLowerCase()
            return words.every(word => name.split(/\s+/).some(nameWord => nameWord.startsWith(word)))
        }).slice(0, 6)
    }, [items, itemSearch])

    const filtered = useMemo(() => {
        let r = movements
        if (search && search.trim().length >= 3) {
            const normalizedSearch = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
            const queryWords = normalizedSearch.split(/\s+/).filter(w => w.length > 0)

            r = r.filter(m => {
                const normalizedName = m.itemName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
                const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 0)

                // Query words must be <= name words (allows partial matching)
                if (queryWords.length > nameWords.length) return false

                // Each query word must START the corresponding name word in sequence
                return queryWords.every((qWord, idx) => nameWords[idx]?.startsWith(qWord) ?? false)
            })
        }
        if (typeFilter !== 'all') r = r.filter(m => m.type === typeFilter)
        if (period !== 'all') {
            const now = new Date(); now.setHours(0, 0, 0, 0)
            const days = period === 'today' ? 0 : period === '7d' ? 7 : 30
            const cut = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
            r = r.filter(m => new Date(m.timestamp) >= cut)
        }
        return r
    }, [movements, search, typeFilter, period])

    const grouped = useMemo(() => {
        const g: Record<string, StockMovement[]> = {}
        filtered.forEach(m => { const k = getDateLabel(m.timestamp); (g[k] = g[k] || []).push(m) })
        return g
    }, [filtered])

    const totals = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        return {
            total: movements.length,
            today: movements.filter(m => new Date(m.timestamp) >= today).length,
            entradas: movements.filter(m => m.type === 'entrada').length,
            saidas: movements.filter(m => ['saida', 'producao', 'perda'].includes(m.type)).length
        }
    }, [movements])

    const selectedItem = items.find(i => i.id === form.itemId)

    const resetForm = () => {
        setForm(DEFAULT_FORM)
        setItemSearch('')
    }

    return {
        items, movements, addMovement, deleteMovement, updateIngredient,
        open, setOpen, search, setSearch, itemSearch, setItemSearch,
        showItemResults, setShowItemResults, period, setPeriod,
        typeFilter, setTypeFilter, form, setForm,
        filteredItems, filtered, grouped, totals, selectedItem,
        resetForm, getStock
    }
}

export type ProductsStateReturn = ReturnType<typeof useProductsState>
