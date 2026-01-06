/**
 * InstructionItem — Draggable instruction step for recipes
 */

import React, { useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'

const Icons = {
    Check: (props: any) => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>,
}

interface InstructionItemProps {
    item: any
    index: number
    onUpdate: (item: any) => void
    onDelete: () => void
    onNext?: () => void
    isEditing: boolean
}

export const InstructionItem = React.memo(({ item, index, onUpdate, onDelete, onNext, isEditing }: InstructionItemProps) => {
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
            <div className={`flex gap-3 py-3 px-1 rounded-xl transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${isEditing ? 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30' : checked ? 'opacity-50' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/10'}`}>
                {/* Drag Handle */}
                {isEditing && (
                    <div
                        className="cursor-grab active:cursor-grabbing text-zinc-300 dark:text-zinc-700 hover:text-zinc-400 dark:hover:text-zinc-600 transition-colors duration-[250ms] mt-1"
                        onPointerDown={(e: any) => dragControls.start(e)}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                            <circle cx="4" cy="4" r="1.5" /><circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="4" r="1.5" /><circle cx="12" cy="12" r="1.5" />
                        </svg>
                    </div>
                )}

                {/* Step Number / Checkbox */}
                <div className="pt-1 w-5 shrink-0 flex justify-center">
                    {!isEditing && checked ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                            <Icons.Check className="w-3 h-3 text-white" />
                        </div>
                    ) : (
                        <span className={`text-[11px] font-black pt-0.5 select-none font-mono tabular-nums ${checked ? 'text-zinc-300' : 'text-zinc-300 dark:text-zinc-700'}`}>
                            {String(index + 1).padStart(2, '0')}
                        </span>
                    )}
                </div>

                {/* Instruction Text */}
                {isEditing ? (
                    <textarea
                        id={`instr-text-${item.id}`}
                        value={item.text}
                        onChange={e => onUpdate({ ...item, text: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onNext?.() } }}
                        className="flex-1 bg-transparent outline-none resize-none text-[15px] font-medium leading-[1.6] tracking-[-0.011em] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 min-w-0 transition-colors duration-[250ms]"
                        placeholder="Descreva este passo..."
                        rows={1}
                        onInput={e => { (e.target as HTMLElement).style.height = 'auto'; (e.target as HTMLElement).style.height = (e.target as HTMLElement).scrollHeight + 'px' }}
                        onBlur={() => { if (!item.text.trim()) onDelete() }}
                    />
                ) : (
                    <p className={`flex-1 text-[15px] font-medium leading-[1.6] text-zinc-800 dark:text-zinc-200 ${checked ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
                        {item.text}
                    </p>
                )}

                {/* Delete */}
                {isEditing && (
                    <button
                        onClick={onDelete}
                        className="p-3 text-zinc-300 dark:text-zinc-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors duration-[250ms] opacity-100 md:opacity-0 md:group-hover:opacity-100 touch-manipulation mt-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>
        </Reorder.Item>
    )
})

InstructionItem.displayName = 'InstructionItem'

export default InstructionItem
