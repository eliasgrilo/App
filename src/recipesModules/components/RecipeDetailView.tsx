// ═══════════════════════════════════════════════════════════════════
// RecipeDetailView — Recipe detail/editor view component
// Refactored: 291 → ~80 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { Reorder, motion } from 'framer-motion'
import { SectionWrapper } from './SectionWrapper'
import { RecipeSection } from './RecipeSection'
import { getCategoryName } from '../utils/recipeUtils'
import { RecipeDetailViewProps, RecipeSectionType, DetailHeader, ImageSection, StatsGrid } from './recipeDetailModules'

export function RecipeDetailView({ selected, selectedId, isEditing, syncing, syncError, isUploading, categories, scrollRef, setSelectedId, setIsEditing, setZoomedImage, updateRecipe, handleImageUpload, finishEditing, onDeleteRecipe, modal }: RecipeDetailViewProps): React.ReactElement {
    const handleClose = () => {
        const cleanedSections = (selected?.sections || []).map((s: RecipeSectionType) => ({ ...s, items: s.items.filter((i: any) => s.type === 'ingredients' ? i.name?.trim() || i.quantity?.trim() : i.text?.trim()) }))
        updateRecipe(selectedId, { sections: cleanedSections }); setSelectedId(null)
    }

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }} className="fixed inset-0 z-[9999] bg-white dark:bg-black overflow-y-auto" ref={scrollRef}>
            <DetailHeader syncing={syncing} syncError={syncError} isEditing={isEditing} onClose={handleClose} onToggleEdit={() => isEditing ? finishEditing() : setIsEditing(true)} onDeleteRecipe={onDeleteRecipe} modal={modal} />
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-40">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-20">
                    {/* LEFT COLUMN: Image & Stats */}
                    <div className="md:col-span-5 space-y-6 md:space-y-10 md:sticky md:top-24 h-fit">
                        <ImageSection image={selected.image} isUploading={isUploading} onImageClick={() => setZoomedImage(selected.image ?? null)} onImageUpload={handleImageUpload} />
                        <StatsGrid selected={selected} selectedId={selectedId} updateRecipe={updateRecipe} />
                    </div>
                    {/* RIGHT COLUMN: Form Content */}
                    <div className="md:col-span-7 space-y-8 md:space-y-12">
                        {/* Header Section */}
                        <div className="space-y-4 md:space-y-6">
                            <div className="flex items-center gap-4">
                                <select value={selected.category} onChange={e => updateRecipe(selectedId, { category: e.target.value })} className="appearance-none bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-full text-zinc-600 dark:text-zinc-300 font-bold text-[11px] uppercase tracking-wider outline-none cursor-pointer hover:bg-zinc-200 transition-colors">{categories.map(c => <option key={getCategoryName(c)} value={getCategoryName(c)}>{getCategoryName(c)}</option>)}</select>
                            </div>
                            <textarea value={selected.name} onChange={e => updateRecipe(selectedId, { name: e.target.value })} className="w-full bg-transparent text-3xl md:text-6xl font-black text-zinc-900 dark:text-white outline-none resize-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800 leading-[1.1] tracking-tight" placeholder="Nome da Receita" rows={1} onInput={e => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px' }} />
                        </div>
                        {/* Add Section Buttons */}
                        <div className="grid grid-cols-2 gap-4 pb-6">
                            <button disabled={!isEditing} onClick={() => updateRecipe(selectedId, { sections: [...(selected?.sections || []), { id: Date.now(), type: 'ingredients', title: 'INGREDIENTES', items: [] }] })} className={`py-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 group ${isEditing ? 'hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}`}><div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">IN</div>+ Ingredientes</button>
                            <button disabled={!isEditing} onClick={() => updateRecipe(selectedId, { sections: [...(selected?.sections || []), { id: Date.now(), type: 'instructions', title: 'PREPARO', items: [] }] })} className={`py-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 group ${isEditing ? 'hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}`}><div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">PR</div>+ Preparo</button>
                        </div>
                        {/* Sections */}
                        <Reorder.Group axis="y" values={selected?.sections || []} onReorder={newSections => updateRecipe(selectedId, { sections: newSections })} className="space-y-6">{(selected?.sections || []).map((section: RecipeSectionType) => <SectionWrapper key={section.id} id={section}>{(dragControls: any) => <RecipeSection section={section} onUpdate={(updatedSec: any) => updateRecipe(selectedId, { sections: selected.sections?.map((s: any) => s.id === section.id ? updatedSec : s) })} onDelete={() => updateRecipe(selectedId, { sections: selected.sections?.filter((s: RecipeSectionType) => s.id !== section.id) })} dragControls={dragControls} isEditing={isEditing} />}</SectionWrapper>)}</Reorder.Group>
                        {/* Delete Button */}
                        <div className="pt-12 pb-8 border-t border-zinc-100/80 dark:border-zinc-800"><button onClick={() => modal.confirm({ title: 'Excluir Receita', message: 'Tem certeza? Esta ação é irreversível.', isDangerous: true, onConfirm: onDeleteRecipe })} className="w-full py-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 font-bold text-sm uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors">Excluir Receita</button></div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default RecipeDetailView
