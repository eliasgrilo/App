import React, { useState, useMemo, useEffect, useRef, useCallback, ChangeEvent, MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import BufferedInput from './BufferedInput'
import YeastType, { YeastDataSet } from './YeastType'
import Preferment, { PrefermentDataSet } from './Preferment'
import { motion, AnimatePresence } from 'framer-motion'
import { useModal } from './contexts/ModalContext'
import { useToast } from './contexts/ToastContext'
import ModalScrollLock from './components/ModalScrollLock'
import { useAppStore, useRecipes } from './stores/useAppStore'

// ═══ TYPE DEFINITIONS ═══
export type InputMode = 'percent' | 'grams'
type YeastTypeKey = 'ADY' | 'IDY' | 'CY'
type YeastTypeValue = 'None' | 'ADY' | 'IDY' | 'CY'
type PrefermentType = 'None' | 'Poolish' | 'Biga' | 'Levain'
type PrefermentKey = 'poolish' | 'biga' | 'levain'

interface ProductionProps {
    inputMode: InputMode
    setInputMode: (mode: InputMode) => void
}

interface YeastDataItem {
    yeastPct: number
}

interface YeastTypeData {
    ADY: YeastDataItem
    IDY: YeastDataItem
    CY: YeastDataItem
    [key: string]: YeastDataItem | undefined
}

interface PrefermentDataItem {
    pct: number
    hydration: number
    yeastPct?: number
    inoculationPct?: number
    time_h: number
    temp_C: number
}

interface PrefermentData {
    poolish: PrefermentDataItem
    biga: PrefermentDataItem
    levain: PrefermentDataItem
    [key: string]: PrefermentDataItem | undefined
}

interface InputState {
    flour: number
    water: number
    sugar: number
    salt: number
    oliveOil: number
    oil: number
    milk: number
    butter: number
    diastatic: number
    RT_h: number
    RT_C: number
    CT_h: number
    CT_C: number
    doughBalls: number
    ballWeight: number
    yeastType: YeastTypeData
    yeastSelection: YeastTypeValue
    prefermentType: PrefermentType
    preferment: PrefermentData
}

interface GramsInputState {
    flour: number
    water: number
    sugar: number
    salt: number
    oliveOil: number
    oil: number
    milk: number
    butter: number
    diastatic: number
    yeast: number
}

interface InputModalState {
    title: string
    placeholder: string
    defaultValue: string
    onConfirm: (value: string) => void
    onCancel: () => void
}

interface Recipes {
    [name: string]: InputState
}

// Production recipes are managed locally within this component
// They are separate from the main recipes store (by design)
const DEFAULT_PRODUCTION_RECIPES = {
    'Napoletana Clássica': {
        flourGrams: 1000, hydration: 65, salt: 3, yeast: 0.3, oil: 0, sugar: 0,
        preferment: { enabled: false }, yeastType: { type: 'fresh', factor: 1 }
    },
    'Pan Pizza': {
        flourGrams: 500, hydration: 70, salt: 2, yeast: 1.4, oil: 6, sugar: 2,
        preferment: { enabled: false }, yeastType: { type: 'dry', factor: 0.33 }
    },
    'Longa Fermentação': {
        flourGrams: 1000, hydration: 68, salt: 2.8, yeast: 0.1, oil: 0, sugar: 0,
        preferment: { enabled: true, percentage: 20, hydration: 100 }, yeastType: { type: 'fresh', factor: 1 }
    }
}


/**
 * Production - Premium dough production calculator
 * Apple-inspired design with complete functionality
 */

export default function Production({ inputMode, setInputMode }: ProductionProps) {
    const [inputs, setInputs] = useState<InputState>({
        flour: 100,
        water: 70,
        sugar: 0,
        salt: 2.5,
        oliveOil: 0,
        oil: 0,
        milk: 0,
        butter: 0,
        diastatic: 0,
        RT_h: 6,
        RT_C: 21,
        CT_h: 48,
        CT_C: 4,
        doughBalls: 10,
        ballWeight: 300,
        yeastType: {
            ADY: { yeastPct: 0.04 },
            IDY: { yeastPct: 0.12 },
            CY: { yeastPct: 0.05 },
        },
        yeastSelection: 'IDY',
        prefermentType: 'None',
        preferment: {
            poolish: { pct: 30, hydration: 70, yeastPct: 0.05, time_h: 12, temp_C: 22 },
            biga: { pct: 30, hydration: 50, yeastPct: 0.05, time_h: 16, temp_C: 18 },
            levain: { pct: 20, hydration: 100, inoculationPct: 20, time_h: 12, temp_C: 24 },
        },
    })

    const [recipes, setRecipes] = useState<Recipes>({})
    const fileRef = useRef<HTMLInputElement>(null)
    const { modal } = useModal()

    const [inputModal, setInputModal] = useState<InputModalState | null>(null)

    // Toast from centralized context
    const { toast } = useToast()
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
        if (type === 'success') toast.success(message)
        else if (type === 'error') toast.error(message)
        else toast.info(message)
    }, [toast])

    const [gramsInputs, setGramsInputs] = useState<GramsInputState>({
        flour: 1736,
        water: 1215,
        sugar: 0,
        salt: 43,
        oliveOil: 0,
        oil: 0,
        milk: 0,
        butter: 0,
        diastatic: 0,
        yeast: 2
    })

    useEffect(() => {
        // Using mock data for production recipes (specific to this component)
        // Note: DEFAULT_PRODUCTION_RECIPES has different structure; we start with empty recipes
        setRecipes({})
    }, [])

    function update<K extends keyof InputState>(key: K, val: InputState[K]): void {
        setInputs(prev => ({
            ...prev,
            [key]: (typeof val === 'number' ? (Number.isNaN(val) ? '' : val) : val)
        }))
    }

    function updatePrefermentData(next: PrefermentData): void {
        setInputs(prev => ({ ...prev, preferment: next }))
    }

    function updateYeastData(next: YeastTypeData): void {
        setInputs(prev => ({ ...prev, yeastType: next }))
    }

    function updateIngredient(key: string, newVal: number | string): void {
        if (inputMode === 'grams') {
            setGramsInputs(prev => ({
                ...prev,
                [key]: Number(newVal) || 0
            }))
        } else {
            update(key as keyof InputState, newVal as InputState[keyof InputState])
        }
    }

    function updateFlourGrams(val: number | string): void {
        setGramsInputs(prev => ({
            ...prev,
            flour: Number(val) || 0
        }))
    }

    const totalPct = useMemo((): number => {
        const p = (n: number | string): number => Number(n) || 0
        const selected = inputs.yeastType[inputs.yeastSelection as YeastTypeKey]
        const yeastPct = p(selected?.yeastPct ?? 0)
        return 100 + p(inputs.water) + p(inputs.sugar) + p(inputs.salt) + p(inputs.oliveOil) + p(inputs.oil) + p(inputs.milk) + p(inputs.butter) + p(inputs.diastatic) + yeastPct
    }, [
        inputs.water, inputs.sugar, inputs.salt, inputs.oliveOil, inputs.oil, inputs.milk,
        inputs.butter, inputs.diastatic, inputs.yeastType, inputs.yeastSelection
    ])

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

    const grams = useMemo(() => {
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

    const displayGrams = useMemo(() => {
        if (inputMode === 'grams') {
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
        }
        return grams
    }, [inputMode, gramsInputs, grams])

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

    // Recipe management
    // Recipe management
    function saveRecipe(): void {
        setInputModal({
            title: 'Salvar Receita',
            placeholder: 'Nome da receita',
            defaultValue: '',
            onConfirm: (name: string): void => {
                if (!name) return
                const nextBase = { ...recipes, [name]: inputs }
                setRecipes(nextBase)
                setInputModal(null)
            },
            onCancel: () => setInputModal(null)
        })
    }

    function loadRecipe(name: string): void {
        const r = recipes[name]
        if (!r) return
         
        setInputs(r as unknown as InputState)
    }

    function deleteRecipe(name: string): void {
        modal.confirm({
            title: 'Excluir Receita',
            message: `A receita "${name}" será excluída permanentemente.`,
            isDangerous: true,
            onConfirm: () => {
                const next = { ...recipes }
                delete next[name]
                setRecipes(next)
            }
        })
    }

    function renameRecipe(oldName: string): void {
        setInputModal({
            title: 'Renomear Receita',
            placeholder: 'Novo nome',
            defaultValue: oldName,
            onConfirm: (newName: string): void => {
                if (!newName || newName === oldName) return
                const oldRecipe = recipes[oldName]
                if (!oldRecipe) return
                const next = { ...recipes, [newName]: oldRecipe }
                delete next[oldName]
                setRecipes(next)
                setInputModal(null)
            },
            onCancel: () => setInputModal(null)
        })
    }

    function exportJSON() {
        const data = JSON.stringify({ inputs, recipes }, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'padoca_pizza_recipes.json'
        a.click()
        URL.revokeObjectURL(url)
    }

    function importJSON(e: ChangeEvent<HTMLInputElement>): void {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(String(evt.target?.result || '{}'))
                if (parsed.inputs) setInputs(parsed.inputs)
                if (parsed.recipes) {
                    setRecipes(parsed.recipes)
                }
                showToast('Importação concluída!', 'success')
            } catch (err) { showToast('Arquivo inválido.', 'error') }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    function clearForm() {
        setInputs({
            flour: 100, water: 70, sugar: 0, salt: 2.5, oliveOil: 0, oil: 0, milk: 0, butter: 0, diastatic: 0,
            yeastSelection: 'IDY', yeastType: { ADY: { yeastPct: 0.04 }, IDY: { yeastPct: 0.12 }, CY: { yeastPct: 0.05 } }, RT_h: 6, RT_C: 21, CT_h: 48, CT_C: 4,
            doughBalls: 10, ballWeight: 350, prefermentType: 'None',
            preferment: {
                poolish: { pct: 30, hydration: 70, yeastPct: 0.05, time_h: 12, temp_C: 22 },
                biga: { pct: 30, hydration: 50, yeastPct: 0.05, time_h: 16, temp_C: 18 },
                levain: { pct: 20, hydration: 100, inoculationPct: 20, time_h: 12, temp_C: 24 },
            },
        })
    }

    function formatNumber(val: number | string, decimals: number = 0, unit: string = ''): string {
        let n = Number(val)
        if (!Number.isFinite(n)) return '—'

        let displayUnit = unit
        let displayDecimals = decimals

        if (unit === 'g' && Math.abs(n) >= 1000) {
            n = n / 1000
            displayUnit = 'kg'
            displayDecimals = 2
        }

        const s = n.toLocaleString('pt-BR', {
            minimumFractionDigits: displayDecimals,
            maximumFractionDigits: displayDecimals
        })
        return displayUnit ? `${s} ${displayUnit}` : s
    }

    function hasValue(val: number | string): boolean {
        return (Number(val) || 0) > 0.001
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            {/* Ultra-Subtle Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Produção</h1>

                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Calculadora de massa premium</p>
                </div>
            </div>

            {/* Production Summary Matrix - Hero Card */}
            <div className="relative group">
                <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                    {/* Subtle Mesh Gradient */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-[250ms]0"></div>

                    <div className="relative">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h3 className="text-[10px] font-bold text-zinc-400 dark:text-indigo-300/60 uppercase tracking-widest cursor-text hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    Production Matrix
                                </h3>
                                <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide mt-1">Protocol Status: Calculated</p>
                            </div>
                            <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">Live Calc</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest ml-1">Massa Preparada</span>
                            <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none flex flex-wrap items-baseline gap-2 md:gap-3">
                                {formatNumber(displayGrams.total, 0, 'g')}
                            </div>
                        </div>
                    </div>

                    <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100/80 dark:border-white/5">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Quantidade</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{inputs.doughBalls}</span>
                                <span className="text-xs font-medium text-zinc-400">un</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Peso/Unidade</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">{inputs.ballWeight}</span>
                                <span className="text-xs font-medium text-zinc-400">g</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Peso Esperado</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl md:text-3xl font-semibold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">{formatNumber(totalDoughWeight, 0, 'g')}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Diferença</span>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-2xl md:text-3xl font-semibold tracking-tight tabular-nums ${Math.abs((Number(displayGrams.total) || 0) - (Number(totalDoughWeight) || 0)) < 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {formatNumber((Number(displayGrams.total) || 0) - (Number(totalDoughWeight) || 0), 1, 'g')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Porcionamento Section */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Porcionamento</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Dough Balls</label>
                        <input
                            className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            step="1"
                            value={inputs.doughBalls}
                            onChange={(e) => {
                                const v = parseFloat(e.target.value)
                                update('doughBalls', Math.round(v))
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Ball Weight (g)</label>
                        <input
                            className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                            type="number"
                            inputMode="decimal"
                            value={inputs.ballWeight}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value)
                                if (inputMode === 'grams') {
                                    const f = flourWeight
                                    const totalDough = f * totalPct / 100
                                    let newBalls = (val > 0) ? Math.round(totalDough / val) : 1
                                    if (newBalls < 1) newBalls = 1
                                    const adjustedBallW = Math.round(totalDough / newBalls)
                                    setInputs(prev => ({ ...prev, ballWeight: adjustedBallW, doughBalls: newBalls }))
                                } else {
                                    update('ballWeight', Math.round(val))
                                }
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* Fermentação Section */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Fermentação</h2>
                { }
                <Preferment
                    value={inputs.prefermentType}
                    onChange={(t: PrefermentType) => update('prefermentType', t)}
                    data={inputs.preferment as PrefermentDataSet}
                    onDataChange={updatePrefermentData as (data: PrefermentDataSet) => void}
                    inputMode={inputMode === 'percent' ? 'pct' : 'grams'}
                    flourWeight={flourWeight}
                />
            </section>

            {/* Ingredientes Section */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Ingredientes</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {inputMode === 'grams' && (
                        <BufferedInput
                            label="Farinha Total"
                            value={gramsInputs.flour}
                            onChange={updateFlourGrams}
                            unit="g"
                        />
                    )}
                    <BufferedInput label="Água" value={inputMode === 'grams' ? gramsInputs.water : inputs.water} onChange={(v) => updateIngredient('water', v)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Sal" value={inputMode === 'grams' ? gramsInputs.salt : inputs.salt} onChange={(v) => updateIngredient('salt', v)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Azeite" value={inputMode === 'grams' ? gramsInputs.oliveOil : inputs.oliveOil} onChange={(v) => updateIngredient('oliveOil', v)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Açúcar" value={inputMode === 'grams' ? gramsInputs.sugar : inputs.sugar} onChange={(v) => updateIngredient('sugar', v)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Óleo" value={inputMode === 'grams' ? gramsInputs.oil : inputs.oil} onChange={(v) => updateIngredient('oil', v)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Leite" value={inputMode === 'grams' ? gramsInputs.milk : inputs.milk} onChange={(v) => updateIngredient('milk', v)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Manteiga" value={inputMode === 'grams' ? gramsInputs.butter : inputs.butter} onChange={(v) => updateIngredient('butter', v)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Malte" value={inputMode === 'grams' ? gramsInputs.diastatic : inputs.diastatic} onChange={(v) => updateIngredient('diastatic', v)} unit={inputMode === 'grams' ? 'g' : '%'} />
                </div>
            </section>

            {/* Agente Biológico Section */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Agente Biológico</h2>
                { }
                <YeastType
                    value={inputs.yeastSelection}
                    onChange={(t: YeastTypeValue) => update('yeastSelection', t)}
                    data={inputs.yeastType as YeastDataSet}
                    onDataChange={updateYeastData as (data: YeastDataSet) => void}
                    inputMode={inputMode === 'percent' ? 'pct' : 'grams'}
                    flourWeight={flourWeight}
                />
            </section>

            {/* Maturação Section */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Maturação</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Tempo (h)</label>
                        <input
                            className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={inputs.RT_h}
                            onChange={(e) => update('RT_h', parseFloat(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Temperatura (°C)</label>
                        <input
                            className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={inputs.RT_C}
                            onChange={(e) => update('RT_C', parseFloat(e.target.value))}
                        />
                    </div>
                </div>
            </section>

            {/* Cold Fermentation Section */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Cold Fermentation</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Tempo (h)</label>
                        <input
                            className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={inputs.CT_h}
                            onChange={(e) => update('CT_h', parseFloat(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Temperatura (°C)</label>
                        <input
                            className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white text-right font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={inputs.CT_C}
                            onChange={(e) => update('CT_C', parseFloat(e.target.value))}
                        />
                    </div>
                </div>
            </section>

            {/* Pré-fermento Summary - only shown when preferment is active */}
            {inputs.prefermentType !== 'None' && prefermentData && (
                <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                    <h2 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-6">{inputs.prefermentType}</h2>
                    <div className="rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/30 p-5 border border-zinc-100/80 dark:border-zinc-700/50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mb-1">% Farinha</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{formatNumber(prefermentData.pct, 1, '%')}</div>
                            </div>
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Farinha (g)</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(prefermentFlour, 0, 'g')}</div>
                            </div>
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Água (g)</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(prefermentWater, 0, 'g')}</div>
                            </div>
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Massa Total (g)</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(prefermentMass, 0, 'g')}</div>
                            </div>
                        </div>
                        {(typeof prefermentData.yeastPct !== 'undefined' || typeof prefermentData.inoculationPct !== 'undefined' || typeof prefermentData.time_h !== 'undefined' || typeof prefermentData.temp_C !== 'undefined') && (
                            <div className="mt-4 pt-4 border-t border-zinc-100/80 dark:border-zinc-700 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {typeof prefermentData.yeastPct !== 'undefined' && (
                                    <div>
                                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Fermento (g)</div>
                                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(prefermentFlour * (Number(prefermentData.yeastPct) || 0) / 100, 2, 'g')}</div>
                                    </div>
                                )}
                                {typeof prefermentData.inoculationPct !== 'undefined' && (
                                    <div>
                                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">% Farinha (Inoc.)</div>
                                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(prefermentData.inoculationPct, 1, '%')}</div>
                                    </div>
                                )}
                                {typeof prefermentData.time_h !== 'undefined' && (
                                    <div>
                                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Tempo (h)</div>
                                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(prefermentData.time_h, 0, 'h')}</div>
                                    </div>
                                )}
                                {typeof prefermentData.temp_C !== 'undefined' && (
                                    <div>
                                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Temperatura (°C)</div>
                                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(prefermentData.temp_C, 0, '°C')}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Massa Final Section */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-6">Massa Final</h2>
                <div className="rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/30 p-5 border border-zinc-100/80 dark:border-zinc-700/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        {hasValue(displayGrams.flour) && (
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Farinha</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.flour - prefermentFlour, 0, 'g')}</div>
                            </div>
                        )}
                        {hasValue(displayGrams.water) && (
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Água</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.water - prefermentWater, 0, 'g')}</div>
                            </div>
                        )}
                        {inputs.prefermentType !== 'None' && prefermentData && (
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Pré-fermento ({inputs.prefermentType})</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(prefermentMass, 0, 'g')}</div>
                            </div>
                        )}
                        {hasValue(displayGrams.salt) && (
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Sal</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.salt, 1, 'g')}</div>
                            </div>
                        )}
                        {hasValue(displayGrams.sugar) && (
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Açúcar</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.sugar, 1, 'g')}</div>
                            </div>
                        )}
                        {hasValue(displayGrams.oliveOil) && (
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Azeite</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.oliveOil, 1, 'g')}</div>
                            </div>
                        )}
                        {hasValue(displayGrams.oil) && (
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Óleo</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.oil, 1, 'g')}</div>
                            </div>
                        )}
                        {hasValue(displayGrams.milk) && (
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Leite</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.milk, 1, 'g')}</div>
                            </div>
                        )}
                        {hasValue(displayGrams.butter) && (
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Manteiga</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.butter, 1, 'g')}</div>
                            </div>
                        )}
                        {hasValue(displayGrams.diastatic) && (
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Malte</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.diastatic, 1, 'g')}</div>
                            </div>
                        )}
                        {hasValue(displayGrams.yeast) && (
                            <div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Fermento</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.yeast, 2, 'g')}</div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-zinc-100/80 dark:border-zinc-700 grid grid-cols-2 sm:grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Total da Massa</div>
                            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(displayGrams.total, 0, 'g')}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Hidratação</div>
                            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(hydration, 1, '%')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* System Controls */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-6">Controle de Sistema</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                        onClick={saveRecipe}
                        className="px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all col-span-2 sm:col-span-1 shadow-lg"
                    >
                        Salvar
                    </button>
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all"
                    >
                        Importar
                    </button>
                    <button
                        onClick={exportJSON}
                        className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all"
                    >
                        Exportar
                    </button>
                    <button
                        onClick={clearForm}
                        className="px-6 py-4 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-[0.98] transition-all border border-red-100 dark:border-red-500/20"
                    >
                        Limpar
                    </button>
                </div>
                <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
            </section>

            {/* Receitas Salvas */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Receitas Salvas</h2>
                {Object.keys(recipes).length === 0 ? (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Nenhum protocolo registrado.</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {Object.entries(recipes).map(([name]) => (
                            <li key={name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-zinc-100/80 dark:hover:border-white/10 transition-all">
                                <div className="font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">{name}</div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => loadRecipe(name)}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Carregar
                                    </button>
                                    <button
                                        onClick={() => renameRecipe(name)}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all"
                                    >
                                        Renomear
                                    </button>
                                    <button
                                        onClick={() => deleteRecipe(name)}
                                        className="flex-none p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Premium Input Modal - Director Standard */}
            <AnimatePresence>
                {inputModal && createPortal(
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-6"
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
                            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden"
                        >
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 text-center tracking-tight">{inputModal.title}</h3>
                            <input
                                autoFocus
                                defaultValue={inputModal.defaultValue}
                                className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-black/20 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white mb-8 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white text-center font-medium placeholder:text-zinc-400"
                                placeholder={inputModal.placeholder}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                        inputModal.onConfirm((e.target as HTMLInputElement).value)
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
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                        const container = (e.target as Element).closest('.relative')
                                        const input = container?.querySelector('input') as HTMLInputElement | null
                                        if (input) inputModal.onConfirm(input.value)
                                    }}
                                    className="flex-1 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                                >
                                    Salvar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>
        </div>
    )
}
