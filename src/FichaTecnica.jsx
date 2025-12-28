import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import { motion, AnimatePresence } from 'framer-motion'
import { useInventoryItems } from './Inventory.jsx'
import { FirebaseService } from './services/firebaseService'

/**
 * FichaTecnica - Premium multi-pizza recipe management
 * Apple-inspired minimalist design with mobile-first approach
 * 
 * PRICING LOGIC:
 * - pricePerUnit: Cost per 1 unit of the ingredient's unit (e.g., $/g, $/kg, $/ml)
 * - Cost = quantity × pricePerUnit (no additional multiplication needed)
 * - When syncing from inventory, we calculate the proportional price per the ingredient's base unit
 */

const STORAGE_KEY = 'fichaTecnica_pizzas'

// Unit conversion factors to base units (g for weight, ml for volume)
const UNIT_TO_BASE = {
    'g': 1,
    'kg': 1000,
    'ml': 1,
    'L': 1000,
    'un': 1,
    'cx': 1 // Treat 'cx' as a base unit for itself (1 box = 1 box)
}

// Convert quantity from one unit to another
const convertUnit = (value, fromUnit, toUnit) => {
    // Safety check for inputs
    if (!fromUnit || !toUnit || isNaN(value)) return 0

    // Direct match
    if (fromUnit === toUnit) return value

    // Incompatible types check (e.g. weight to volume)
    // For now, we allow cross-conversion assuming density=1 if needed, 
    // but we strictly handle 'cx' and 'un' distinctness where possible.

    // If either unit is 'cx' or 'un' and they don't match, we might return the original value 
    // or 0 if strict. For pricing, we need to be careful.
    // Here we use a safe fallback: if conversion shouldn't happen, we might return 0
    // but existing logic was naive. Let's make it robust.

    const fromBase = UNIT_TO_BASE[fromUnit] || 1
    const toBase = UNIT_TO_BASE[toUnit] || 1

    // Prevent division by zero
    if (toBase === 0) return 0

    // Convert to base unit, then to target unit
    return (value * fromBase) / toBase
}

// Calculate price per base unit from inventory item
// Inventory stores: packageQuantity (e.g., 25kg), packageCount (e.g., 2 bags), pricePerUnit (price per bag, e.g., $15)
// Total value = packageCount × pricePerUnit (e.g., 2 × $15 = $30)
// Total quantity = packageQuantity × packageCount (e.g., 25kg × 2 = 50kg)
// Price per inventory unit = Total value / Total quantity (e.g., $30 / 50kg = $0.60/kg)
// Price per base unit (g) = Price per inventory unit / conversion factor
const calculatePricePerBaseUnit = (inventoryItem) => {
    if (!inventoryItem) return 0


    const packageQty = Number(inventoryItem.packageQuantity) || 0
    const packageCount = Number(inventoryItem.packageCount) || 1
    const pricePerPackage = Number(inventoryItem.pricePerUnit) || 0

    const totalQuantity = packageQty * packageCount // e.g., 50kg
    const totalValue = packageCount * pricePerPackage // e.g., $30

    if (totalQuantity <= 0) return 0

    // Price per single unit of inventory's unit (e.g., $0.60/kg)
    const pricePerInventoryUnit = totalValue / totalQuantity

    // Convert to price per base unit (g or ml)
    const inventoryUnitToBase = UNIT_TO_BASE[inventoryItem.unit] || 1
    return pricePerInventoryUnit / inventoryUnitToBase // e.g., $0.0006/g
}

// Helper component to lock scroll when a modal is open
function ModalScrollLock() {
    useScrollLock(true)
    return null
}

// Create Pizza Modal Component - Fullscreen on Mobile with Top-Aligned Input
function CreatePizzaModal({ newPizzaName, setNewPizzaName, setIsCreatingPizza, handleCreatePizza }) {
    useScrollLock(true)

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-start justify-center">
            {/* Apple-style Glass Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl"
                onClick={() => {
                    setIsCreatingPizza(false)
                    setNewPizzaName('')
                }}
            />

            {/* iOS Style Modal - Top Aligned for Keyboard Visibility */}
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8
                }}
                className="relative w-full md:max-w-md bg-white dark:bg-zinc-900 md:bg-white/95 md:dark:bg-zinc-900/95 md:backdrop-blur-2xl md:rounded-[24px] shadow-2xl overflow-hidden mt-16 md:mt-20 mx-4 md:mx-0 rounded-2xl"
                style={{
                    marginTop: 'max(calc(env(safe-area-inset-top, 0px) + 60px), 60px)',
                }}
            >
                {/* Close Button - Top Right */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="w-12"></div>
                    <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-white">Nova Pizza</h3>
                    <button
                        onClick={() => {
                            setIsCreatingPizza(false)
                            setNewPizzaName('')
                        }}
                        className="w-12 h-12 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90 touch-manipulation"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 mx-4" />

                {/* Content - Keep compact for keyboard visibility */}
                <div className="px-6 py-6">
                    {/* Icon + Description */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[15px] text-zinc-500 dark:text-zinc-400">Dê um nome para sua nova receita</p>
                        </div>
                    </div>

                    {/* Input - Prominent */}
                    <div className="mb-6">
                        <input
                            type="text"
                            className="w-full h-14 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-0 text-[17px] text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            placeholder="Ex: Margherita"
                            value={newPizzaName}
                            onChange={(e) => setNewPizzaName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreatePizza()}
                        />
                    </div>

                    {/* Buttons - 48px touch targets */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setIsCreatingPizza(false)
                                setNewPizzaName('')
                            }}
                            className="flex-1 h-14 rounded-2xl font-semibold text-[17px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98] touch-manipulation"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreatePizza}
                            disabled={!newPizzaName.trim()}
                            className="flex-[1.5] h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[17px] hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-zinc-900/20 dark:shadow-white/10 touch-manipulation"
                        >
                            Criar
                        </button>
                    </div>
                </div>

                {/* Safe Area Bottom Padding */}
                <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
            </motion.div>
        </div>,
        document.body
    )
}

const defaultPizza = {
    id: Date.now(),
    name: 'Pizza Margherita',
    createdAt: new Date().toISOString(),
    ingredients: []
}

export default function FichaTecnica() {
    const [pizzas, setPizzas] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            return saved ? JSON.parse(saved) : [defaultPizza]
        } catch {
            return [defaultPizza]
        }
    })

    // Cloud Load
    const [isCloudSynced, setIsCloudSynced] = useState(false)
    useEffect(() => {
        const loadCloud = async () => {
            try {
                const cloudPizzas = await FirebaseService.getPizzas()
                if (cloudPizzas && cloudPizzas.length > 0) {
                    setPizzas(cloudPizzas.map(p => ({
                        ...p,
                        ingredients: Array.isArray(p.ingredients) ? p.ingredients : []
                    })))
                }
            } catch (err) {
                console.warn("Ficha cloud load failed")
            } finally {
                setIsCloudSynced(true)
            }
        }
        loadCloud()
    }, [])

    const [selectedPizzaId, setSelectedPizzaId] = useState(null)
    const [editingId, setEditingId] = useState(null)
    const [isAddingIngredient, setIsAddingIngredient] = useState(false)
    const [isCreatingPizza, setIsCreatingPizza] = useState(false)
    const [newPizzaName, setNewPizzaName] = useState('')
    const [newIngredient, setNewIngredient] = useState({
        name: '',
        quantity: '',
        unit: 'g',
        pricePerUnit: '',
        isSyncedFromInventory: false,
        inventoryItemId: null
    })
    const [matchedInventoryItem, setMatchedInventoryItem] = useState(null)
    const [confirmModal, setConfirmModal] = useState(null)
    const [inputModal, setInputModal] = useState(null)

    // Premium Toast System
    const [toastMessage, setToastMessage] = useState(null)
    const toastTimeoutRef = useRef(null)
    const showToast = useCallback((message, type = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
        setToastMessage({ message, type })
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500)
    }, [])

    // Get inventory items for price correlation
    const inventoryItems = useInventoryItems()

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pizzas))
        // Cloud Sync (Only if loaded)
        if (isCloudSynced) {
            FirebaseService.syncPizzas(pizzas)
        }
    }, [pizzas, isCloudSynced])

    // Get selected pizza
    const selectedPizza = useMemo(() => {
        return pizzas.find(p => p.id === selectedPizzaId) || null
    }, [pizzas, selectedPizzaId])

    // Calculate totals for a pizza - FIXED FORMULA
    // Cost = quantity × pricePerUnit (pricePerUnit is already per the ingredient's unit)
    const calculateTotals = (ingredients = []) => {
        if (!Array.isArray(ingredients)) return { totalCost: 0, costPerPizza: 0 }

        const totalCost = ingredients.reduce((sum, ing) => {
            return sum + getItemCost(ing)
        }, 0)
        return { totalCost, costPerPizza: totalCost }
    }

    // Format currency (Standard)
    const formatCurrency = (val) => {
        const n = Number(val) || 0
        return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .replace(/^/, '$ ')
    }

    // Format small prices with more precision
    const formatPrice = (val) => {
        const n = Number(val) || 0
        if (n < 0.01 && n > 0) {
            return n.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
                .replace(/^/, '$ ')
        }
        return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
            .replace(/^/, '$ ')
    }

    // Create new pizza
    const handleCreatePizza = () => {
        if (!newPizzaName.trim()) return

        const newPizza = {
            id: Date.now(),
            name: newPizzaName.trim(),
            createdAt: new Date().toISOString(),
            ingredients: []
        }

        setPizzas(prev => [...prev, newPizza])
        setNewPizzaName('')
        setIsCreatingPizza(false)
        setSelectedPizzaId(newPizza.id)
    }

    // Delete pizza
    const handleDeletePizza = (id) => {
        const pizza = pizzas.find(p => p.id === id)
        setConfirmModal({
            title: 'Excluir Pizza',
            message: `A pizza "${pizza?.name || ''}" será removida permanentemente.`,
            type: 'danger',
            onConfirm: () => {
                setPizzas(prev => prev.filter(p => p.id !== id))
                if (selectedPizzaId === id) setSelectedPizzaId(null)
                setConfirmModal(null)
            },
            onCancel: () => setConfirmModal(null)
        })
    }

    // Rename pizza
    const handleRenamePizza = (id) => {
        const pizza = pizzas.find(p => p.id === id)
        if (!pizza) return

        setInputModal({
            title: 'Renomear Pizza',
            placeholder: 'Nome da pizza',
            defaultValue: pizza.name,
            onConfirm: (newName) => {
                if (newName && newName !== pizza.name) {
                    setPizzas(prev => prev.map(p =>
                        p.id === id ? { ...p, name: newName.trim() } : p
                    ))
                }
                setInputModal(null)
            },
            onCancel: () => setInputModal(null)
        })
    }

    // Search for matching inventory item when ingredient name changes
    const handleIngredientNameChange = (name) => {
        setNewIngredient(prev => ({ ...prev, name }))
        setMatchedInventoryItem(null)

        // Safety check: ensure inventoryItems is an array
        if (!Array.isArray(inventoryItems)) return

        // Try to find matching inventory item - STRICT MATCH ONLY
        // User requirement: Exact name match, same word count.
        if (name && name.trim().length > 0) {
            const searchTerm = name.toLowerCase().trim()

            const match = inventoryItems.find(item => {
                if (!item || !item.name) return false
                return item.name.toLowerCase() === searchTerm
            })

            if (match) {
                setMatchedInventoryItem(match)

                // Calculate price per base unit from inventory
                const pricePerBaseUnit = calculatePricePerBaseUnit(match)

                // Convert to price per the current selected unit
                const targetUnitToBase = UNIT_TO_BASE[newIngredient.unit] || 1
                const pricePerTargetUnit = pricePerBaseUnit * targetUnitToBase

                setNewIngredient(prev => ({
                    ...prev,
                    pricePerUnit: pricePerTargetUnit.toFixed(6),
                    isSyncedFromInventory: true,
                    inventoryItemId: match.id
                }))
            }
        }
    }

    // Update price when unit changes and we have a matched inventory item
    const handleUnitChange = (newUnit) => {
        setNewIngredient(prev => {
            const updated = { ...prev, unit: newUnit }

            if (matchedInventoryItem) {
                const pricePerBaseUnit = calculatePricePerBaseUnit(matchedInventoryItem)
                const targetUnitToBase = UNIT_TO_BASE[newUnit] || 1
                const pricePerTargetUnit = pricePerBaseUnit * targetUnitToBase

                updated.pricePerUnit = pricePerTargetUnit.toFixed(6)
                updated.isSyncedFromInventory = true
            }

            return updated
        })
    }

    // Add ingredient to selected pizza
    // keepOpen: if true, form stays open for adding more ingredients
    const handleAddIngredient = (keepOpen = false) => {
        // Validation: require both name and quantity
        if (!selectedPizza || !newIngredient.name.trim() || !newIngredient.quantity) return

        const ingredient = {
            id: Date.now(),
            name: newIngredient.name.trim(),
            quantity: Number(newIngredient.quantity) || 0,
            unit: newIngredient.unit,
            pricePerUnit: Number(newIngredient.pricePerUnit) || 0,
            inventoryItemId: newIngredient.inventoryItemId
        }

        setPizzas(prev => prev.map(p =>
            p.id === selectedPizzaId
                ? { ...p, ingredients: [...(p.ingredients || []), ingredient] }
                : p
        ))

        setNewIngredient({ name: '', quantity: '', unit: 'g', pricePerUnit: '', isSyncedFromInventory: false, inventoryItemId: null })
        setMatchedInventoryItem(null)

        if (keepOpen) {
            // Focus back on name input after a short delay
            setTimeout(() => {
                document.getElementById('cat-ing-name-input')?.focus()
            }, 50)
        } else {
            setIsAddingIngredient(false)
        }
    }

    // Update ingredient
    const handleUpdateIngredient = (ingredientId, field, value) => {
        if (!selectedPizza) return

        setPizzas(prev => prev.map(p => {
            if (p.id !== selectedPizzaId) return p
            return {
                ...p,
                ingredients: (p.ingredients || []).map(ing => {
                    if (ing.id !== ingredientId) return ing
                    return {
                        ...ing,
                        [field]: field === 'name' || field === 'unit' ? value : Number(value) || 0
                    }
                })
            }
        }))
    }

    // Delete ingredient
    const handleDeleteIngredient = (ingredientId) => {
        if (!selectedPizza) return

        setPizzas(prev => prev.map(p => {
            if (p.id !== selectedPizzaId) return p
            return {
                ...p,
                ingredients: (p.ingredients || []).filter(ing => ing.id !== ingredientId)
            }
        }))
        setEditingId(null)
    }

    // Calculate individual cost - SIMPLE: quantity × pricePerUnit
    const getItemCost = (ing) => {
        return (Number(ing.quantity) || 0) * (Number(ing.pricePerUnit) || 0)
    }

    const totals = selectedPizza ? calculateTotals(selectedPizza.ingredients) : { totalCost: 0, costPerPizza: 0 }

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            {/* Ultra-Subtle Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header: Identity & Actions */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Ficha Técnica</h1>
                        {/* Sync Status Badge */}
                        <div className="mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                Cloud Active
                            </span>
                        </div>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Gestão premium de receitas e custos</p>
                </div>

                <button
                    onClick={() => setIsCreatingPizza(true)}
                    className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    Nova Pizza
                </button>
            </div>

            {/* Create Pizza Modal - Apple iOS Sheet Design */}
            <AnimatePresence>
                {isCreatingPizza && (
                    <CreatePizzaModal
                        newPizzaName={newPizzaName}
                        setNewPizzaName={setNewPizzaName}
                        setIsCreatingPizza={setIsCreatingPizza}
                        handleCreatePizza={handleCreatePizza}
                    />
                )}
            </AnimatePresence>

            {/* Pizza Grid - Premium Cards */}
            {!selectedPizzaId && (
                <section className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {pizzas.map((pizza) => {
                        const pizzaTotals = calculateTotals(pizza.ingredients)
                        return (
                            <div
                                key={pizza.id}
                                onClick={() => setSelectedPizzaId(pizza.id)}
                                className="group relative bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all cursor-pointer active:scale-[0.98] shadow-xl hover:shadow-2xl overflow-hidden"
                            >
                                {/* Subtle Gradient on Hover */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                <div className="relative">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{pizza.name}</h3>
                                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{pizza.ingredients.length} ingrediente{pizza.ingredients.length !== 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleRenamePizza(pizza.id)
                                                }}
                                                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeletePizza(pizza.id)
                                                }}
                                                className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cost Display */}
                                    <div className="mb-6">
                                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Custo Total</span>
                                        <div className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight tabular-nums mt-1">
                                            {formatCurrency(pizzaTotals.totalCost)}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            Ver detalhes
                                        </div>
                                        <div className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{pizza.ingredients.length} itens</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Empty State - Premium */}
                    {pizzas.length === 0 && (
                        <div className="col-span-full text-center py-20 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden relative">
                            <div className="absolute inset-0 bg-zinc-50/50 dark:bg-white/[0.01]"></div>
                            <div className="relative z-10">
                                <div className="w-20 h-20 mx-auto bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Nenhuma Pizza Cadastrada</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm font-medium">Comece criando sua primeira receita</p>
                                <button
                                    onClick={() => setIsCreatingPizza(true)}
                                    className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                                >
                                    Criar Primeira Pizza
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Selected Pizza Details */}
            {selectedPizza && (
                <div className="relative z-10 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Back Button & Pizza Header */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedPizzaId(null)}
                            className="p-3 rounded-2xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex-1">
                            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{selectedPizza.name}</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                                {selectedPizza.ingredients.length} ingrediente{selectedPizza.ingredients.length !== 1 ? 's' : ''} cadastrado{selectedPizza.ingredients.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Summary Card - Matching Inventory Matrix Design */}
                    <div className="relative group">
                        <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                            {/* Subtle Apple-style Mesh Gradient */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                            <div className="relative">
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h3 className="text-[10px] font-bold text-zinc-400 dark:text-indigo-300/60 uppercase tracking-widest cursor-text hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                            Recipe Cost Matrix
                                        </h3>
                                        <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide mt-1">Protocol Status: Calculated</p>
                                    </div>
                                    <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live Pricing</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest ml-1">Custo Total da Receita</span>
                                    <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none flex flex-wrap items-baseline gap-2 md:gap-3">
                                        {formatCurrency(totals.totalCost)}
                                    </div>
                                </div>
                            </div>

                            <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100 dark:border-white/5">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Ingredients</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{selectedPizza.ingredients.length}</span>
                                        <span className="text-xs font-medium text-zinc-400">itens</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Cost per Unit</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl md:text-3xl font-semibold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">{formatCurrency(totals.costPerPizza)}</span>
                                        <span className="text-xs font-medium text-indigo-500/60">/pizza</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Ingredient Button */}
                    {!isAddingIngredient && (
                        <button
                            onClick={() => setIsAddingIngredient(true)}
                            className="w-full px-8 py-5 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-700 transition-all active:scale-[0.99] flex items-center justify-center gap-3 group shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Adicionar Ingrediente
                        </button>
                    )}

                    {/* Add Ingredient Modal - Apple Premium Design */}
                    {isAddingIngredient && (
                        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 md:p-4">
                            <ModalScrollLock />
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
                                onClick={() => {
                                    setIsAddingIngredient(false)
                                    setNewIngredient({ name: '', quantity: '', unit: 'g', pricePerUnit: '', isSyncedFromInventory: false, inventoryItemId: null })
                                    setMatchedInventoryItem(null)
                                }}
                            ></div>

                            {/* Modal Content */}
                            <div
                                className="relative w-full md:max-w-lg bg-white dark:bg-zinc-900 rounded-2xl md:rounded-[2rem] p-6 pb-32 md:p-8 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto custom-scrollbar mx-4 md:mx-0"
                                style={{
                                    marginTop: 'max(calc(env(safe-area-inset-top, 0px) + 60px), 60px)'
                                }}
                            >

                                {/* Drag Handle (Mobile only) */}
                                <div className="md:hidden w-full flex justify-center mb-5">
                                    <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                                </div>

                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Novo Ingrediente</h3>
                                    <button
                                        onClick={() => {
                                            setIsAddingIngredient(false)
                                            setNewIngredient({ name: '', quantity: '', unit: 'g', pricePerUnit: '', isSyncedFromInventory: false, inventoryItemId: null })
                                            setMatchedInventoryItem(null)
                                        }}
                                        className="p-2 -mr-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Search Input */}
                                <div className="relative mb-5">
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                                        Nome do Ingrediente
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            id="cat-ing-name-input"
                                            type="text"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    document.getElementById('cat-ing-qty-input')?.focus()
                                                }
                                            }}
                                            className={`w-full pl-12 pr-4 py-4 rounded-2xl text-base font-semibold transition-all ${matchedInventoryItem
                                                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                                : 'bg-zinc-50/50 dark:bg-black/20 border border-zinc-200/50 dark:border-white/5 text-zinc-900 dark:text-white shadow-inner focus:shadow-lg focus:bg-white dark:focus:bg-black/40'
                                                } focus:outline-none focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-white/10 placeholder:text-zinc-400`}
                                            placeholder="Buscar no estoque..."
                                            value={newIngredient.name}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                setNewIngredient(prev => ({ ...prev, name: val }))
                                                if (matchedInventoryItem && val !== matchedInventoryItem.name) {
                                                    setMatchedInventoryItem(null)
                                                    setNewIngredient(prev => ({ ...prev, pricePerUnit: '', isSyncedFromInventory: false, inventoryItemId: null }))
                                                }
                                                handleIngredientNameChange(val)
                                            }}
                                            autoFocus
                                        />
                                        {matchedInventoryItem && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Autocomplete Dropdown - Premium Style (Inline/Relative for perfect mobile scrolling) */}
                                    {newIngredient.name.length > 0 && !matchedInventoryItem && (
                                        <div className="mt-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden max-h-[50vh] overflow-y-auto custom-scrollbar animate-fade-in pb-2">
                                            {(() => {
                                                const matches = inventoryItems.filter(i =>
                                                    i.name.toLowerCase().includes(newIngredient.name.toLowerCase())
                                                ).slice(0, 6)

                                                if (matches.length === 0 && newIngredient.name.length > 1) {
                                                    return (
                                                        <div className="p-5 text-center">
                                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mb-3">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nenhum item encontrado</p>
                                                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Adicione "{newIngredient.name}" ao Estoque primeiro</p>
                                                        </div>
                                                    )
                                                }

                                                return matches.map((item, idx) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            setMatchedInventoryItem(item)
                                                            const pricePerBaseUnit = calculatePricePerBaseUnit(item)
                                                            const targetUnitToBase = UNIT_TO_BASE[newIngredient.unit] || 1
                                                            const pricePerTargetUnit = pricePerBaseUnit * targetUnitToBase
                                                            setNewIngredient(prev => ({
                                                                ...prev,
                                                                name: item.name,
                                                                pricePerUnit: pricePerTargetUnit.toFixed(6),
                                                                isSyncedFromInventory: true,
                                                                inventoryItemId: item.id
                                                            }))
                                                        }}
                                                        className={`w-full text-left px-5 py-4 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors group ${idx !== matches.length - 1 ? 'border-b border-zinc-200/50 dark:border-zinc-700/50' : ''}`}
                                                    >
                                                        <div>
                                                            <span className="font-semibold text-zinc-900 dark:text-white">{item.name}</span>
                                                            <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-2">
                                                                {item.packageQuantity * item.packageCount} {item.unit}
                                                            </span>
                                                        </div>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                ))
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {/* Synced Indicator */}
                                {matchedInventoryItem && (
                                    <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 truncate">{matchedInventoryItem.name}</p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    Estoque: {matchedInventoryItem.packageQuantity * matchedInventoryItem.packageCount} {matchedInventoryItem.unit} • {formatCurrency(matchedInventoryItem.packageCount * matchedInventoryItem.pricePerUnit)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Manual Entry Fields (Unit if not matched) */}
                                {!matchedInventoryItem && (
                                    <div className="mb-5">
                                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Unidade</label>
                                        <select
                                            className="w-full px-4 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white text-lg font-bold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none text-center"
                                            value={newIngredient.unit}
                                            onChange={(e) => handleUnitChange(e.target.value)}
                                        >
                                            <option value="g">g</option>
                                            <option value="kg">kg</option>
                                            <option value="ml">ml</option>
                                            <option value="L">L</option>
                                            <option value="un">un</option>
                                        </select>
                                    </div>
                                )}

                                {/* Quantity & Unit Row */}
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Quantidade</label>
                                        <input
                                            id="cat-ing-qty-input"
                                            type="number"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    // Add ingredient and keep form open for next one
                                                    handleAddIngredient(true)
                                                }
                                            }}
                                            step="any"
                                            inputMode="decimal"
                                            className="w-full px-4 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white text-right text-lg font-bold focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                            placeholder="0"
                                            value={newIngredient.quantity}
                                            onChange={(e) => setNewIngredient(prev => ({ ...prev, quantity: e.target.value }))}
                                        />
                                    </div>
                                    {matchedInventoryItem && (
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Unidade</label>
                                            <div className="w-full px-4 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 text-lg font-semibold text-center">
                                                {newIngredient.unit}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cost Preview */}
                                {matchedInventoryItem && newIngredient.quantity && (
                                    <div className="mb-6 p-5 rounded-2xl bg-zinc-900 dark:bg-white">
                                        <div className="text-[10px] font-bold text-white/50 dark:text-zinc-900/50 uppercase tracking-widest mb-2">Custo Calculado</div>
                                        <div className="flex items-end justify-between">
                                            <div className="text-sm text-white/70 dark:text-zinc-600">
                                                {newIngredient.quantity} {newIngredient.unit} × {formatPrice(newIngredient.pricePerUnit)}/{newIngredient.unit}
                                            </div>
                                            <div className="text-3xl font-bold text-white dark:text-zinc-900 tabular-nums">
                                                {formatCurrency(Number(newIngredient.quantity) * Number(newIngredient.pricePerUnit))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 safe-area-bottom">
                                    <button
                                        onClick={() => {
                                            setIsAddingIngredient(false)
                                            setNewIngredient({ name: '', quantity: '', unit: 'g', pricePerUnit: '', isSyncedFromInventory: false, inventoryItemId: null })
                                            setMatchedInventoryItem(null)
                                        }}
                                        className="flex-1 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98]"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddIngredient}
                                        disabled={!newIngredient.name || !newIngredient.quantity}
                                        className="flex-[2] px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 shadow-lg shadow-zinc-900/20 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ingredients Table - Desktop */}
                    {selectedPizza.ingredients.length > 0 && (
                        <div className="hidden md:block rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-6 px-8 py-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                                <div className="col-span-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Ingrediente</div>
                                <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Qtd</div>
                                <div className="col-span-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Un</div>
                                <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">UND</div>
                                <div className="col-span-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Custo</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-zinc-100/50 dark:divide-white/5">
                                {selectedPizza.ingredients.map((ing) => (
                                    <div
                                        key={ing.id}
                                        className="grid grid-cols-12 gap-6 px-8 py-5 items-center hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors duration-300 group"
                                    >
                                        {editingId === ing.id ? (
                                            <>
                                                <div className="col-span-4">
                                                    <input
                                                        id={`edit-ing-name-${ing.id}`}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                document.getElementById(`edit-ing-qty-${ing.id}`)?.focus()
                                                            }
                                                        }}
                                                        type="text"
                                                        className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border-none text-zinc-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                                                        value={ing.name}
                                                        onChange={(e) => handleUpdateIngredient(ing.id, 'name', e.target.value)}
                                                        onBlur={() => {
                                                            if (!ing.name.trim() && (!ing.quantity || ing.quantity === 0)) handleDeleteIngredient(ing.id)
                                                        }}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        id={`edit-ing-qty-${ing.id}`}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                document.getElementById(`edit-ing-price-${ing.id}`)?.focus()
                                                            }
                                                        }}
                                                        type="number"
                                                        step="any"
                                                        inputMode="decimal"
                                                        className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border-none text-zinc-900 dark:text-white text-sm text-right font-medium focus:ring-2 focus:ring-indigo-500/20"
                                                        value={ing.quantity}
                                                        onChange={(e) => handleUpdateIngredient(ing.id, 'quantity', e.target.value)}
                                                        onBlur={() => {
                                                            if (!ing.name.trim() && (!ing.quantity || ing.quantity === 0)) handleDeleteIngredient(ing.id)
                                                        }}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <select
                                                        className="w-full px-2 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border-none text-zinc-900 dark:text-white text-sm text-center font-medium focus:ring-2 focus:ring-indigo-500/20"
                                                        value={ing.unit}
                                                        onChange={(e) => handleUpdateIngredient(ing.id, 'unit', e.target.value)}
                                                    >
                                                        <option value="g">g</option>
                                                        <option value="kg">kg</option>
                                                        <option value="ml">ml</option>
                                                        <option value="L">L</option>
                                                        <option value="un">un</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        id={`edit-ing-price-${ing.id}`}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                setEditingId(null)
                                                            }
                                                        }}
                                                        type="number"
                                                        step="1"
                                                        inputMode="numeric"
                                                        className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border-none text-zinc-900 dark:text-white text-sm text-right font-medium focus:ring-2 focus:ring-indigo-500/20"
                                                        value={ing.pricePerUnit}
                                                        onChange={(e) => handleUpdateIngredient(ing.id, 'pricePerUnit', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <span className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(getItemCost(ing))}</span>
                                                </div>
                                                <div className="col-span-1 flex justify-end gap-1">
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteIngredient(ing.id)}
                                                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="col-span-4">
                                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">{ing.name}</span>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <span className="text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">{ing.quantity}</span>
                                                </div>
                                                <div className="col-span-1 text-center">
                                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-full">{ing.unit}</span>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <span className="text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">{Math.round(Number(ing.pricePerUnit) || 0)}</span>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <span className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(getItemCost(ing))}</span>
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <button
                                                        onClick={() => setEditingId(ing.id)}
                                                        className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Table Footer */}
                            <div className="grid grid-cols-12 gap-6 px-8 py-5 bg-zinc-900 dark:bg-white">
                                <div className="col-span-9 text-[10px] font-bold text-white/60 dark:text-zinc-500 uppercase tracking-widest text-right self-center">Total da Receita</div>
                                <div className="col-span-2 text-right">
                                    <span className="text-xl font-bold text-white dark:text-zinc-900 tabular-nums">{formatCurrency(totals.totalCost)}</span>
                                </div>
                                <div className="col-span-1"></div>
                            </div>
                        </div>
                    )}

                    {/* Ingredients List - Mobile */}
                    {selectedPizza.ingredients.length > 0 && (
                        <div className="md:hidden space-y-4">
                            {selectedPizza.ingredients.map((ing) => (
                                <div
                                    key={ing.id}
                                    className={`relative backdrop-blur-xl rounded-[1.5rem] p-5 border transition-all duration-500 ${editingId === ing.id
                                        ? 'bg-white/90 dark:bg-zinc-900/90 border-indigo-500/20 shadow-[0_8px_30px_rgb(99,102,241,0.06)] scale-[1.01]'
                                        : 'bg-white/60 dark:bg-zinc-900/40 border-white/40 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:bg-white/80 dark:hover:bg-zinc-900/60'
                                        }`}
                                >
                                    {editingId === ing.id ? (
                                        /* Mobile Edit Mode - Ultra Premium */
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Editando</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteIngredient(ing.id)}
                                                        className="p-2 rounded-xl text-red-500 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Nome</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-700 dark:text-zinc-200 font-medium focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm placeholder:text-zinc-300"
                                                    value={ing.name}
                                                    onChange={(e) => handleUpdateIngredient(ing.id, 'name', e.target.value)}
                                                    onBlur={() => {
                                                        if (!ing.name.trim() && (!ing.quantity || ing.quantity === 0)) handleDeleteIngredient(ing.id)
                                                    }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Qtd</label>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        inputMode="decimal"
                                                        className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white font-semibold text-lg text-right focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                                        value={ing.quantity}
                                                        onChange={(e) => handleUpdateIngredient(ing.id, 'quantity', e.target.value)}
                                                        onBlur={() => {
                                                            if (!ing.name.trim() && (!ing.quantity || ing.quantity === 0)) handleDeleteIngredient(ing.id)
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Unidade</label>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-600 dark:text-zinc-300 font-semibold text-center appearance-none focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                                                            value={ing.unit}
                                                            onChange={(e) => handleUpdateIngredient(ing.id, 'unit', e.target.value)}
                                                        >
                                                            <option value="g">g</option>
                                                            <option value="kg">kg</option>
                                                            <option value="ml">ml</option>
                                                            <option value="L">L</option>
                                                            <option value="un">un</option>
                                                        </select>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[9px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Preço/Unidade</label>
                                                <div className="relative group">
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        inputMode="numeric"
                                                        className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white font-semibold text-lg text-right focus:outline-none focus:bg-white dark:focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                                        value={ing.pricePerUnit}
                                                        onChange={(e) => handleUpdateIngredient(ing.id, 'pricePerUnit', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Mobile View Mode - Ultra Premium */
                                        <div onClick={() => setEditingId(ing.id)} className="group cursor-pointer">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-100 text-[15px] mb-1 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{ing.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tabular-nums uppercase tracking-wide">
                                                            {ing.quantity} {ing.unit}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-400/80 font-medium">
                                                            @ {Math.round(Number(ing.pricePerUnit) || 0)}/{ing.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingId(ing.id);
                                                        }}
                                                        className="p-2 rounded-xl text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-dashed border-zinc-100 dark:border-white/5">
                                                <span className="text-[9px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.25em]">Custo</span>
                                                <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tabular-nums tracking-tight">{formatCurrency(getItemCost(ing))}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Mobile Total */}
                            <div className="bg-zinc-900 dark:bg-white rounded-[2rem] p-5 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-white/60 dark:text-zinc-500 uppercase tracking-widest">Total da Receita</span>
                                    <span className="text-2xl font-bold text-white dark:text-zinc-900 tabular-nums">{formatCurrency(totals.totalCost)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty Ingredients State */}
                    {selectedPizza.ingredients.length === 0 && !isAddingIngredient && (
                        <div className="text-center py-16 rounded-[2.5rem] bg-white dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden relative">
                            <div className="absolute inset-0 bg-zinc-50/50 dark:bg-white/[0.01]"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-5 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Nenhum Ingrediente</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm font-medium">Comece adicionando ingredientes à receita</p>
                                <button
                                    onClick={() => setIsAddingIngredient(true)}
                                    className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                                >
                                    Adicionar Primeiro Ingrediente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* Premium Confirmation Modal - Director Standard */}
            <AnimatePresence>
                {confirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    >
                        <ModalScrollLock />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                            onClick={confirmModal.onCancel}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 mx-auto ${confirmModal.type === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-zinc-100 text-zinc-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    {confirmModal.type === 'danger' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    )}
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 text-center tracking-tight">{confirmModal.title}</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed text-center font-medium">
                                {confirmModal.message}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={confirmModal.onCancel}
                                    className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className={`flex-1 py-3.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all ${confirmModal.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25' : 'bg-zinc-900 dark:bg-white dark:text-zinc-900'}`}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Input Modal - Director Standard */}
            <AnimatePresence>
                {inputModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    >
                        <ModalScrollLock />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                            onClick={inputModal.onCancel}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                        >
                            <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 mx-auto text-zinc-600 dark:text-zinc-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 text-center tracking-tight">{inputModal.title}</h3>
                            <input
                                autoFocus
                                defaultValue={inputModal.defaultValue}
                                className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white mb-8 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white text-center font-medium placeholder:text-zinc-400"
                                placeholder={inputModal.placeholder}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        inputModal.onConfirm(e.target.value)
                                    }
                                }}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={inputModal.onCancel}
                                    className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={(e) => {
                                        const input = e.target.closest('.relative').querySelector('input')
                                        inputModal.onConfirm(input.value)
                                    }}
                                    className="flex-1 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                                >
                                    Salvar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Toast */}
            <AnimatePresence>
                {toastMessage && createPortal(
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[20000] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${toastMessage.type === 'error' ? 'bg-rose-500/90 border-rose-400/20 text-white' :
                            toastMessage.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/20 text-white' :
                                'bg-zinc-900/90 border-white/10 text-white'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${toastMessage.type === 'error' ? 'bg-white animate-pulse' :
                            toastMessage.type === 'success' ? 'bg-white' :
                                'bg-indigo-400'
                            }`} />
                        <span className="text-sm font-semibold tracking-tight">{toastMessage.message}</span>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>
        </div>
    )
}
