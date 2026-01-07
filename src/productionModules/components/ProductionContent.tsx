// ═══════════════════════════════════════════════════════════════════
// PRODUCTION MODULE — ProductionContent Component
// Calculator sections content for the Produção tab
// ═══════════════════════════════════════════════════════════════════

import { useRef } from 'react'
import BufferedInput from '../../BufferedInput'
import YeastType, { YeastDataSet } from '../../YeastType'
import Preferment, { PrefermentDataSet } from '../../Preferment'
import { ProductionHeader } from './ProductionHeader'
import { ProductionSummaryCard } from './ProductionSummaryCard'
import { PortioningSection } from './PortioningSection'
import { MaturationSection, ColdFermentationSection } from './MaturationSection'
import { FinalDoughSection } from './FinalDoughSection'
import { SystemControlsSection } from './SystemControlsSection'
import { SavedRecipesSection } from './SavedRecipesSection'
import { ProductionInputModal } from './ProductionInputModal'
import { formatNumber } from '../types'
import type { ProductionProps, PrefermentType, YeastTypeValue, PrefermentKey } from '../types'
import type { ProductionStateReturn } from '../hooks/useProductionState'
import type { ProductionHandlersReturn } from '../hooks/useProductionHandlers'

interface ProductionContentProps {
    inputMode: ProductionProps['inputMode']
    state: ProductionStateReturn
    handlers: ProductionHandlersReturn
}

export function ProductionContent({ inputMode, state, handlers }: ProductionContentProps) {
    const fileRef = useRef<HTMLInputElement>(null)

    return (
        <>
            <ProductionHeader />
            <ProductionSummaryCard inputs={state.inputs} displayGrams={state.displayGrams} totalDoughWeight={state.totalDoughWeight} />
            <PortioningSection
                inputs={state.inputs}
                inputMode={inputMode}
                flourWeight={state.flourWeight}
                totalPct={state.totalPct}
                onDoughBallsChange={(val) => state.update('doughBalls', val)}
                onBallWeightChange={(val, flourW, totalP, mode) => {
                    if (mode === 'grams') {
                        const totalDough = flourW * totalP / 100
                        let newBalls = (val > 0) ? Math.round(totalDough / val) : 1
                        if (newBalls < 1) newBalls = 1
                        state.setInputs(prev => ({ ...prev, ballWeight: Math.round(totalDough / newBalls), doughBalls: newBalls }))
                    } else {
                        state.update('ballWeight', Math.round(val))
                    }
                }}
            />
            {/* Fermentation */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Fermentação</h2>
                <Preferment
                    value={state.inputs.prefermentType}
                    onChange={(t: PrefermentType) => state.update('prefermentType', t)}
                    data={state.inputs.preferment as PrefermentDataSet}
                    onDataChange={state.updatePrefermentData as (data: PrefermentDataSet) => void}
                    inputMode={inputMode === 'percent' ? 'pct' : 'grams'}
                    flourWeight={state.flourWeight}
                />
            </section>
            {/* Ingredients */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Ingredientes</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {inputMode === 'grams' && <BufferedInput label="Farinha Total" value={state.gramsInputs.flour} onChange={state.updateFlourGrams} unit="g" />}
                    <BufferedInput label="Água" value={inputMode === 'grams' ? state.gramsInputs.water : state.inputs.water} onChange={(v) => state.updateIngredient('water', v, inputMode)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Sal" value={inputMode === 'grams' ? state.gramsInputs.salt : state.inputs.salt} onChange={(v) => state.updateIngredient('salt', v, inputMode)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Azeite" value={inputMode === 'grams' ? state.gramsInputs.oliveOil : state.inputs.oliveOil} onChange={(v) => state.updateIngredient('oliveOil', v, inputMode)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Açúcar" value={inputMode === 'grams' ? state.gramsInputs.sugar : state.inputs.sugar} onChange={(v) => state.updateIngredient('sugar', v, inputMode)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Óleo" value={inputMode === 'grams' ? state.gramsInputs.oil : state.inputs.oil} onChange={(v) => state.updateIngredient('oil', v, inputMode)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Leite" value={inputMode === 'grams' ? state.gramsInputs.milk : state.inputs.milk} onChange={(v) => state.updateIngredient('milk', v, inputMode)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Manteiga" value={inputMode === 'grams' ? state.gramsInputs.butter : state.inputs.butter} onChange={(v) => state.updateIngredient('butter', v, inputMode)} unit={inputMode === 'grams' ? 'g' : '%'} />
                    <BufferedInput label="Malte" value={inputMode === 'grams' ? state.gramsInputs.diastatic : state.inputs.diastatic} onChange={(v) => state.updateIngredient('diastatic', v, inputMode)} unit={inputMode === 'grams' ? 'g' : '%'} />
                </div>
            </section>
            {/* Yeast */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Agente Biológico</h2>
                <YeastType
                    value={state.inputs.yeastSelection}
                    onChange={(t: YeastTypeValue) => state.update('yeastSelection', t)}
                    data={state.inputs.yeastType as YeastDataSet}
                    onDataChange={state.updateYeastData as (data: YeastDataSet) => void}
                    inputMode={inputMode === 'percent' ? 'pct' : 'grams'}
                    flourWeight={state.flourWeight}
                />
            </section>
            <MaturationSection inputs={state.inputs} onUpdate={state.update} />
            <ColdFermentationSection inputs={state.inputs} onUpdate={state.update} />
            {/* Preferment Summary */}
            {state.inputs.prefermentType !== 'None' && state.prefermentData && (
                <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] p-6 md:p-8 border border-zinc-200/50 dark:border-white/10 shadow-xl">
                    <h2 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-6">{state.inputs.prefermentType}</h2>
                    <div className="rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/30 p-5 border border-zinc-100/80 dark:border-zinc-700/50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div><div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mb-1">% Farinha</div><div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{formatNumber(state.prefermentData.pct, 1, '%')}</div></div>
                            <div><div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Farinha (g)</div><div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(state.prefermentFlour, 0, 'g')}</div></div>
                            <div><div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Água (g)</div><div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(state.prefermentWater, 0, 'g')}</div></div>
                            <div><div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1">Massa Total (g)</div><div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(state.prefermentMass, 0, 'g')}</div></div>
                        </div>
                    </div>
                </section>
            )}
            <FinalDoughSection
                inputs={state.inputs}
                displayGrams={state.displayGrams}
                hydration={state.hydration}
                prefermentData={state.prefermentData}
                prefermentFlour={state.prefermentFlour}
                prefermentWater={state.prefermentWater}
                prefermentMass={state.prefermentMass}
            />
            <SystemControlsSection
                fileRef={fileRef as React.RefObject<HTMLInputElement>}
                onSave={handlers.saveRecipe}
                onExport={handlers.exportJSON}
                onImport={handlers.importJSON}
                onClear={handlers.clearForm}
            />
            <SavedRecipesSection
                recipes={state.recipes}
                onLoad={handlers.loadRecipe}
                onRename={handlers.renameRecipe}
                onDelete={handlers.deleteRecipe}
            />
            <ProductionInputModal inputModal={state.inputModal} />
        </>
    )
}

export default ProductionContent
