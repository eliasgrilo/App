/**
 * ═══════════════════════════════════════════════════════════════════
 * InstructionsTable — Instructions section component
 * Extracted from Recipes.tsx for modularity
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useCallback } from 'react'
import { Reorder } from 'framer-motion'
import { InstructionItem } from './InstructionItem'
import { Icons } from './RecipeIcons'

// ═══════════════════════════════════════════════════════════════════
// TYPES — Using any for items to allow flexibility with different sources
// ═══════════════════════════════════════════════════════════════════

interface RecipeSectionLocal {
    id: number | string
    type: string
    title: string
    items: any[]
}

interface InstructionsTableProps {
    section: RecipeSectionLocal
    onUpdate: (section: RecipeSectionLocal) => void
    onDelete: () => void
    dragControls: any
    isEditing: boolean
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function InstructionsTable({
    section,
    onUpdate,
    onDelete,
    dragControls,
    isEditing
}: InstructionsTableProps): React.ReactElement {

    // Add a new instruction and scroll/focus to it
    const addNewInstruction = useCallback(() => {
        const newId = `instr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newItem = { id: newId, text: '' }
        onUpdate({ ...section, items: [...(section.items || []), newItem] })

        // Use requestAnimationFrame to wait for DOM update
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const field = document.getElementById(`instr-text-${newId}`)
                if (field) {
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    field.focus()
                }
            })
        })
    }, [section, onUpdate])

    return (
        <div className="relative group/section bg-white dark:bg-black rounded-3xl p-4 md:p-6 border border-zinc-100/80 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pl-1">
                <div className="flex items-center gap-3 flex-1">
                    <div
                        className="cursor-grab p-2 -ml-2 text-zinc-300 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors opacity-100 md:opacity-0 md:group-hover/section:opacity-100"
                        onPointerDown={(e: React.PointerEvent) => dragControls.start(e)}
                    >
                        <Icons.Bars className="w-5 h-5" />
                    </div>

                    {/* Badge for Type */}
                    <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                        MP
                    </div>

                    {isEditing ? (
                        <input
                            value={section.title}
                            onChange={e => onUpdate({ ...section, title: e.target.value })}
                            className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider bg-transparent outline-none hover:text-indigo-500 transition-colors flex-1 placeholder:text-zinc-300"
                            placeholder="NOME DA SEÇÃO"
                        />
                    ) : (
                        <span className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex-1">
                            {section.title}
                        </span>
                    )}
                </div>
                {isEditing && (
                    <button
                        onClick={onDelete}
                        className="opacity-100 md:opacity-0 md:group-hover/section:opacity-100 text-zinc-300 hover:text-rose-500 transition-all p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                        <Icons.Trash />
                    </button>
                )}
            </div>

            {/* Items List */}
            <Reorder.Group
                axis="y"
                values={section.items}
                onReorder={newItems => isEditing && onUpdate({ ...section, items: newItems })}
                className="space-y-3"
            >
                {section.items.map((item: any, idx: number) => (
                    <InstructionItem
                        key={item.id}
                        item={item}
                        index={idx}
                        onUpdate={u => onUpdate({
                            ...section,
                            items: section.items.map((i: any) => i.id === item.id ? u : i)
                        })}
                        onDelete={() => onUpdate({
                            ...section,
                            items: section.items.filter((i: any) => i.id !== item.id)
                        })}
                        onNext={() => {
                            if (item.text.trim()) {
                                addNewInstruction()
                            }
                        }}
                        isEditing={isEditing}
                    />
                ))}
            </Reorder.Group>

            {/* Add Button */}
            {isEditing && (
                <button
                    type="button"
                    onClick={addNewInstruction}
                    className="mt-6 w-full py-4 rounded-xl border border-dashed border-zinc-200/80 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 active:scale-[0.98] touch-manipulation cursor-pointer select-none"
                >
                    <Icons.Plus /> Adicionar Passo
                </button>
            )}
        </div>
    )
}

export default InstructionsTable
