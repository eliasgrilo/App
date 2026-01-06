// ═══════════════════════════════════════════════════════════════════
// RECIPE DETAIL VIEW MODULES — Header Component
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { Icons } from '../RecipeIcons'
import { ModalContextType } from './types'

interface DetailHeaderProps { syncing: boolean; syncError: boolean; isEditing: boolean; onClose: () => void; onToggleEdit: () => void; onDeleteRecipe: () => void; modal: ModalContextType }

export const DetailHeader: React.FC<DetailHeaderProps> = ({ syncing, syncError, isEditing, onClose, onToggleEdit, onDeleteRecipe, modal }) => (
    <div className="sticky top-0 left-0 right-0 z-[101] bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-100/80 dark:border-zinc-900 flex justify-between items-center px-4 md:px-6 h-16 transition-all">
        <div className="flex-1 flex justify-start">
            <button onClick={onClose} className="p-3 rounded-2xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-sm group"><Icons.Back className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" /></button>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${syncError ? 'text-rose-500' : syncing ? 'text-zinc-400' : 'text-zinc-300'}`}>{syncError ? 'Falha' : syncing ? 'Sincronizando...' : 'Salvo'}</span>
        <div className="flex-1 flex justify-end gap-2">
            <button onClick={onToggleEdit} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${isEditing ? 'bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/30 shadow-lg' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-500 hover:text-indigo-500'}`}>{isEditing ? 'Concluído' : 'Editar'}</button>
            <button onClick={() => modal.confirm({ title: 'Excluir Receita', message: 'Tem certeza que deseja excluir esta receita permanentemente? Esta ação não pode ser desfeita.', isDangerous: true, onConfirm: onDeleteRecipe })} className="p-3 rounded-2xl text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 active:scale-95 transition-all group"><Icons.Trash className="w-5 h-5 transition-transform group-hover:scale-110" /></button>
        </div>
    </div>
)
