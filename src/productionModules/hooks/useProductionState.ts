// ═══════════════════════════════════════════════════════════════════
// PRODUCTION MODULE — useProductionState Hook
// State and calculations for Production component
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useModal, useToast } from '../../stores/useUIStore'
import type {
    InputState, GramsInputState, InputModalState, Recipes,
    YeastTypeKey, PrefermentKey, PrefermentData, YeastTypeData, DisplayGrams
} from '../types'
import { DEFAULT_INPUT_STATE, DEFAULT_GRAMS_STATE } from '../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ProductionStateReturn {
    // Core state
    inputs: InputState
    setInputs: React.Dispatch<React.SetStateAction<InputState>>
    gramsInputs: GramsInputState
    setGramsInputs: React.Dispatch<React.SetStateAction<GramsInputState>>
    recipes: Recipes
    setRecipes: React.Dispatch<React.SetStateAction<Recipes>>
    inputModal: InputModalState | null
    setInputModal: (v: InputModalState | null) => void
    fileRef: React.RefObject<HTMLInputElement>

    // Calculated values
    totalPct: number
    totalDoughWeight: number
    flourWeight: number
    grams: DisplayGrams
    displayGrams: DisplayGrams
    hydration: number
    prefermentKey: PrefermentKey
    prefermentData: any
    prefermentFlour: number
    prefermentWater: number
    prefermentMass: number

    // Contexts
    modal: ReturnType<typeof useModal>['modal']
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void

    // Update functions
    update: <K extends keyof InputState>(key: K, val: InputState[K]) => void
    updatePrefermentData: (next: PrefermentData) => void
    updateYeastData: (next: YeastTypeData) => void
    updateIngredient: (key: string, newVal: number | string, inputMode: 'percent' | 'grams') => void
    updateFlourGrams: (val: number | string) => void
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useProductionState(): ProductionStateReturn {
    const { modal } = useModal()
    const { toast } = useToast()

    const [inputs, setInputs] = useState<InputState>(DEFAULT_INPUT_STATE)
    const [gramsInputs, setGramsInputs] = useState<GramsInputState>(DEFAULT_GRAMS_STATE)
    const [recipes, setRecipes] = useState<Recipes>({})
    const [inputModal, setInputModal] = useState<InputModalState | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    // Toast helper
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    // Initialize recipes
    useEffect(() => { setRecipes({}) }, [])

    // ═══════════════════════════════════════════════════════════════
    // UPDATE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    const update = useCallback(<K extends keyof InputState>(key: K, val: InputState[K]): void => {
        setInputs(prev => ({
            ...prev,
            [key]: (typeof val === 'number' ? (Number.isNaN(val) ? '' : val) : val)
        }))
    }, [])

    const updatePrefermentData = useCallback((next: PrefermentData): void => {
        setInputs(prev => ({ ...prev, preferment: next }))
    }, [])

    const updateYeastData = useCallback((next: YeastTypeData): void => {
        setInputs(prev => ({ ...prev, yeastType: next }))
    }, [])

    const updateIngredient = useCallback((key: string, newVal: number | string, inputMode: 'percent' | 'grams'): void => {
        if (inputMode === 'grams') {
            setGramsInputs(prev => ({ ...prev, [key]: Number(newVal) || 0 }))
        } else {
            update(key as keyof InputState, newVal as InputState[keyof InputState])
        }
    }, [update])

    const updateFlourGrams = useCallback((val: number | string): void => {
        setGramsInputs(prev => ({ ...prev, flour: Number(val) || 0 }))
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // CALCULATED VALUES
    // ═══════════════════════════════════════════════════════════════

    const totalPct = useMemo((): number => {
        const p = (n: number | string): number => Number(n) || 0
        const selected = inputs.yeastType[inputs.yeastSelection as YeastTypeKey]
        const yeastPct = p(selected?.yeastPct ?? 0)
        return 100 + p(inputs.water) + p(inputs.sugar) + p(inputs.salt) + p(inputs.oliveOil) + p(inputs.oil) + p(inputs.milk) + p(inputs.butter) + p(inputs.diastatic) + yeastPct
    }, [inputs.water, inputs.sugar, inputs.salt, inputs.oliveOil, inputs.oil, inputs.milk, inputs.butter, inputs.diastatic, inputs.yeastType, inputs.yeastSelection])

    const totalDoughWeight = useMemo(() => {
        const nBalls = Number(inputs.doughBalls) || 0
        const w = Number(inputs.ballWeight) || 0
        return nBalls * w
    }, [inputs.doughBalls, inputs.ballWeight])

    const flourWeight = useMemo(() => {
        const total = Number(totalDoughWeight) || 0
        const t = Number(totalPct) || 100
        if (t <= 0) return 0
        return total * 100 / t
    }, [totalDoughWeight, totalPct])

    const grams = useMemo((): DisplayGrams => {
        const f = flourWeight
        const g = (pct: number | string): number => f * (Number(pct) || 0) / 100
        const selected = inputs.yeastType[inputs.yeastSelection as YeastTypeKey]
        const yeastPct = Number(selected?.yeastPct) || 0
        return {
            flour: f,
            water: g(inputs.water),
            sugar: g(inputs.sugar),
            salt: g(inputs.salt),
            oliveOil: g(inputs.oliveOil),
            oil: g(inputs.oil),
            milk: g(inputs.milk),
            butter: g(inputs.butter),
            diastatic: g(inputs.diastatic),
            yeast: f * yeastPct / 100,
            total: f + g(inputs.water) + g(inputs.sugar) + g(inputs.salt) + g(inputs.oliveOil) + g(inputs.oil) + g(inputs.milk) + g(inputs.butter) + g(inputs.diastatic) + (f * yeastPct / 100)
        }
    }, [flourWeight, inputs])

    const displayGrams = useMemo((): DisplayGrams => {
        const total = (Number(gramsInputs.flour) || 0) +
            (Number(gramsInputs.water) || 0) +
            (Number(gramsInputs.sugar) || 0) +
            (Number(gramsInputs.salt) || 0) +
            (Number(gramsInputs.oliveOil) || 0) +
            (Number(gramsInputs.oil) || 0) +
            (Number(gramsInputs.milk) || 0) +
            (Number(gramsInputs.butter) || 0) +
            (Number(gramsInputs.diastatic) || 0) +
            (Number(gramsInputs.yeast) || 0)
        return {
            flour: gramsInputs.flour,
            water: gramsInputs.water,
            sugar: gramsInputs.sugar,
            salt: gramsInputs.salt,
            oliveOil: gramsInputs.oliveOil,
            oil: gramsInputs.oil,
            milk: gramsInputs.milk,
            butter: gramsInputs.butter,
            diastatic: gramsInputs.diastatic,
            yeast: gramsInputs.yeast,
            total
        }
    }, [gramsInputs])

    const hydration = useMemo(() => {
        const f = Number(displayGrams.flour) || 0
        if (f <= 0) return 0
        const w = Number(displayGrams.water) || 0
        const m = Number(displayGrams.milk) || 0
        return ((w + m) / f) * 100
    }, [displayGrams.flour, displayGrams.water, displayGrams.milk])

    const prefermentKey = inputs.prefermentType.toLowerCase() as PrefermentKey
    const prefermentData = (inputs.prefermentType !== 'None' && inputs.preferment[prefermentKey]) ? inputs.preferment[prefermentKey] : null
    const prefermentFlour = prefermentData ? flourWeight * (Number(prefermentData.pct) || 0) / 100 : 0
    const prefermentWater = prefermentFlour * (Number(prefermentData?.hydration) || 0) / 100
    const prefermentMass = prefermentFlour + prefermentWater

    return {
        inputs, setInputs,
        gramsInputs, setGramsInputs,
        recipes, setRecipes,
        inputModal, setInputModal,
        fileRef: fileRef as any,
        totalPct, totalDoughWeight, flourWeight,
        grams, displayGrams, hydration,
        prefermentKey, prefermentData, prefermentFlour, prefermentWater, prefermentMass,
        modal, showToast,
        update, updatePrefermentData, updateYeastData, updateIngredient, updateFlourGrams
    }
}

export default useProductionState
