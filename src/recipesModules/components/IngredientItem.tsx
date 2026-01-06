/**
 * IngredientItem — Draggable ingredient row for recipes
 */

import React, { useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'

const Icons = {
    Check: (props: any) => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>,
}

interface IngredientItemProps {
    item: any
    onUpdate: (item: any) => void
    onDelete: () => void
    onNext?: () => void
    isEditing: boolean
}

export const IngredientItem = React.memo(({ item, onUpdate, onDelete, onNext, isEditing }: IngredientItemProps) => {
    const dragControls = useDragControls()
    const [checked, setChecked] = useState(false)

    return (
        <Reorder.Item
            value={item}
            dragListener={isEditing}
            dragControls={dragControls}
            className={`group relative mb-2 transition-all duration-300 ease-out ${!isEditing ? 'cursor-pointer' : ''}`}
            onClick={() => !isEditing && setChecked(!checked)}
        >
            <div className={`flex items-center gap-2 md:gap-3 py-3 px-1 rounded-xl transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${isEditing ? 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30' : checked ? 'opacity-50' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/10'}`}>
                {/* Drag Handle */}
                {isEditing && (
                    <div
                        className="cursor-grab active:cursor-grabbing text-zinc-300 dark:text-zinc-700 hover:text-zinc-400 dark:hover:text-zinc-600 transition-colors duration-[250ms]"
                        onPointerDown={(e: any) => dragControls.start(e)}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                            <circle cx="4" cy="4" r="1.5" /><circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="4" r="1.5" /><circle cx="12" cy="12" r="1.5" />
                        </svg>
                    </div>
                )}

                {/* Checkbox for Read Mode */}
                {!isEditing && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 dark:border-zinc-700'}`}>
                        {checked && <Icons.Check className="w-3 h-3 text-white" />}
                    </div>
                )}

                {/* Name */}
                {isEditing ? (
                    <input
                        id={`ing-name-${item.id}`}
                        type="text"
                        value={item.name}
                        onChange={e => onUpdate({ ...item, name: e.target.value })}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                const qtyField = document.getElementById(`ing-qty-${item.id}`)
                                if (qtyField) qtyField.focus()
                            }
                        }}
                        className="flex-1 bg-transparent outline-none font-medium text-[15px] leading-[1.4] tracking-[-0.011em] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-colors duration-[250ms] min-w-0"
                        placeholder="Ingrediente"
                        onBlur={() => { if (!item.name.trim() && !item.quantity.trim()) onDelete() }}
                    />
                ) : (
                    <span className={`flex-1 font-medium text-[15px] leading-[1.4] tracking-tight text-zinc-800 dark:text-zinc-200 ${checked ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
                        {item.name}
                    </span>
                )}

                {/* Quantity */}
                <div className="flex items-center gap-1.5 md:gap-2">
                    {isEditing ? (
                        <>
                            <div className="relative w-12 md:w-24 transition-all duration-300">
                                <input
                                    id={`ing-qty-${item.id}`}
                                    type="text"
                                    inputMode="decimal"
                                    value={item.quantity}
                                    onChange={e => {
                                        const value = e.target.value
                                        if (value === '' || /^[0-9.,]*$/.test(value)) {
                                            onUpdate({ ...item, quantity: value })
                                        }
                                    }}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onNext?.() } }}
                                    className="w-full text-right bg-transparent outline-none font-semibold text-[15px] text-zinc-900 dark:text-white tabular-nums"
                                    placeholder="0"
                                    onBlur={() => { if (!item.name.trim() && !item.quantity.trim()) onDelete() }}
                                />
                            </div>
                            <select
                                value={item.unit}
                                onChange={e => onUpdate({ ...item, unit: e.target.value })}
                                className="bg-transparent text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 outline-none cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors duration-[250ms] appearance-none"
                            >
                                {['g', 'kg', 'ml', 'L', 'un', 'col'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </>
                    ) : (
                        <div className={`font-semibold text-[15px] text-zinc-900 dark:text-white tabular-nums flex items-baseline gap-1 ${checked ? 'opacity-50' : ''}`}>
                            <span>{item.quantity}</span>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">{item.unit}</span>
                        </div>
                    )}

                    {/* Delete */}
                    {isEditing && (
                        <button
                            onClick={onDelete}
                            className="p-3 text-zinc-300 dark:text-zinc-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors duration-[250ms] opacity-100 md:opacity-0 md:group-hover:opacity-100 touch-manipulation"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </Reorder.Item>
    )
})

IngredientItem.displayName = 'IngredientItem'

export default IngredientItem
