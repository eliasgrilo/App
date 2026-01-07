// ═══════════════════════════════════════════════════════════════════
// CATEGORY MANAGEMENT MODULES — Section Components with Drag Reorder
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'

// ═══════════════════════════════════════════════════════════════════
// DRAG HANDLE ICON
// ═══════════════════════════════════════════════════════════════════

const DragHandle = () => (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
    </svg>
)

// ═══════════════════════════════════════════════════════════════════
// CATEGORY LIST — With drag reorder
// ═══════════════════════════════════════════════════════════════════

interface CategoryListProps {
    categories: string[]
    onRemove: (cat: string) => void
    onReorder: (categories: string[]) => void
}

export const CategoryList: React.FC<CategoryListProps> = ({ categories, onRemove, onReorder }) => {
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

    const handleDragStart = (idx: number) => (e: React.DragEvent) => {
        setDraggedIdx(idx)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (idx: number) => (e: React.DragEvent) => {
        e.preventDefault()
        setDragOverIdx(idx)
    }

    const handleDrop = (targetIdx: number) => () => {
        if (draggedIdx === null || draggedIdx === targetIdx) {
            setDraggedIdx(null)
            setDragOverIdx(null)
            return
        }
        const newCategories = [...categories]
        const [removed] = newCategories.splice(draggedIdx, 1)
        if (removed) {
            newCategories.splice(targetIdx, 0, removed)
            onReorder(newCategories)
        }
        setDraggedIdx(null)
        setDragOverIdx(null)
    }

    const handleDragEnd = () => {
        setDraggedIdx(null)
        setDragOverIdx(null)
    }

    return (
        <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">Categorias Principais</h4>
            <div className="space-y-2">
                {categories.map((cat, idx) => (
                    <div
                        key={idx}
                        draggable
                        onDragStart={handleDragStart(idx)}
                        onDragOver={handleDragOver(idx)}
                        onDrop={handleDrop(idx)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center justify-between py-3 md:py-2.5 px-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 cursor-grab active:cursor-grabbing transition-all ${draggedIdx === idx ? 'opacity-50 scale-95' : ''
                            } ${dragOverIdx === idx && draggedIdx !== idx ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="touch-none">
                                <DragHandle />
                            </div>
                            <span className="font-medium text-indigo-700 dark:text-indigo-300 text-sm md:text-base">{cat}</span>
                        </div>
                        <button onClick={() => onRemove(cat)} className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-indigo-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                            <svg className="h-5 w-5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// ADD CATEGORY FORM
// ═══════════════════════════════════════════════════════════════════

interface AddCategoryFormProps { value: string; onChange: (v: string) => void; onAdd: () => void }

export const AddCategoryForm: React.FC<AddCategoryFormProps> = ({ value, onChange, onAdd }) => (
    <div className="pt-4 border-t border-indigo-100 dark:border-indigo-800/30">
        <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-3">Adicionar Nova Categoria</h4>
        <div className="flex gap-2">
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="Nome da categoria" className="flex-1 h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none" onKeyDown={e => e.key === 'Enter' && onAdd()} />
            <button onClick={onAdd} className="h-12 px-5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors">Adicionar</button>
        </div>
    </div>
)

// ═══════════════════════════════════════════════════════════════════
// SUBCATEGORY SECTION — With drag reorder (uses allSubcategories)
// ═══════════════════════════════════════════════════════════════════

interface SubcategorySectionProps {
    categories: string[]
    selected: string | null
    setSelected: (c: string | null) => void
    subcategories: Record<string, string[]>
    allSubcategories: string[] // All unique subcategories from items
    newName: string
    setNewName: (v: string) => void
    onAdd: () => void
    onRemove: (cat: string, sub: string) => void
    onReorder: (subcategories: string[]) => void
}

export const SubcategorySection: React.FC<SubcategorySectionProps> = ({
    categories, selected, setSelected, subcategories, allSubcategories,
    newName, setNewName, onAdd, onRemove, onReorder
}) => {
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

    // Use allSubcategories (from items) to show what's actually in use
    const displaySubcategories = allSubcategories.filter(sub => sub !== 'None')

    const handleDragStart = (idx: number) => (e: React.DragEvent) => {
        setDraggedIdx(idx)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (idx: number) => (e: React.DragEvent) => {
        e.preventDefault()
        setDragOverIdx(idx)
    }

    const handleDrop = (targetIdx: number) => () => {
        if (draggedIdx === null || draggedIdx === targetIdx) {
            setDraggedIdx(null)
            setDragOverIdx(null)
            return
        }
        const newOrder = [...displaySubcategories]
        const [removed] = newOrder.splice(draggedIdx, 1)
        if (removed) {
            newOrder.splice(targetIdx, 0, removed)
            onReorder(['None', ...newOrder])
        }
        setDraggedIdx(null)
        setDragOverIdx(null)
    }

    const handleDragEnd = () => {
        setDraggedIdx(null)
        setDragOverIdx(null)
    }

    return (
        <>
            {/* SUBCATEGORIAS - With drag reorder */}
            <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-violet-500 uppercase tracking-widest">Subcategorias</h4>
                <div className="space-y-2">
                    {displaySubcategories.length === 0 ? (
                        <p className="text-sm text-zinc-400 italic py-2">Nenhuma subcategoria cadastrada</p>
                    ) : (
                        displaySubcategories.map((sub, idx) => {
                            // Find parent category for this subcategory
                            const parentCat = categories.find(cat => (subcategories[cat] || []).includes(sub)) || ''
                            return (
                                <div
                                    key={idx}
                                    draggable
                                    onDragStart={handleDragStart(idx)}
                                    onDragOver={handleDragOver(idx)}
                                    onDrop={handleDrop(idx)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center justify-between py-3 md:py-2.5 px-4 rounded-xl bg-violet-50/50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 cursor-grab active:cursor-grabbing transition-all ${draggedIdx === idx ? 'opacity-50 scale-95' : ''
                                        } ${dragOverIdx === idx && draggedIdx !== idx ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="touch-none">
                                            <DragHandle />
                                        </div>
                                        <span className="font-medium text-violet-700 dark:text-violet-300 text-sm md:text-base">{sub}</span>
                                        {parentCat && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-800/50 text-violet-500 dark:text-violet-400 font-medium">
                                                {parentCat}
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => onRemove(parentCat, sub)} className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-violet-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                                        <svg className="h-5 w-5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* ADICIONAR NOVA SUBCATEGORIA */}
            <div className="pt-4 border-t border-violet-100 dark:border-violet-800/30">
                <h4 className="text-[11px] font-bold text-violet-500 uppercase tracking-widest mb-3">Adicionar Nova Subcategoria</h4>
                <div className="flex gap-2">
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome da subcategoria" className="flex-1 h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none" onKeyDown={e => e.key === 'Enter' && onAdd()} />
                    <button onClick={onAdd} disabled={!newName.trim()} className="h-12 px-5 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Adicionar</button>
                </div>
            </div>
        </>
    )
}
