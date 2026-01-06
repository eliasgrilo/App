// ═══════════════════════════════════════════════════════════════════
// RECIPE LIST VIEW MODULES — RecipeCard Component
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { Icons } from '../RecipeIcons'
import { getCategoryColor } from '../../utils/recipeUtils'
import type { Recipe, ModalContextType } from './types'

interface RecipeCardProps { recipe: Recipe; categories: string[]; onClick: () => void; onDelete: () => void; modal: ModalContextType }

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe: r, categories, onClick, onDelete, modal }) => (
    <motion.div key={r.id} onClick={onClick} className="group relative z-20 bg-white dark:bg-zinc-950 rounded-[2rem] p-4 border border-zinc-200/50 dark:border-white/10 md:hover:border-zinc-300 md:dark:hover:border-white/20 transition-all cursor-pointer shadow-xl md:hover:shadow-2xl md:hover:-translate-y-1 active:scale-[0.98] overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-6 shadow-inner">
            {r.image ? <motion.img src={r.image} className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-105" /> : (
                <div className="w-full h-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-950 dark:to-black" />
                    <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/8 via-transparent to-transparent opacity-60" /><div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-500/8 via-transparent to-transparent opacity-60" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 md:group-hover:opacity-80 transition-opacity"><div className="w-12 h-12 rounded-full bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center mb-2 shadow-lg md:group-hover:scale-110 transition-transform duration-500"><Icons.Camera /></div></div>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity" />
            <button onClick={e => { e.stopPropagation(); modal.confirm({ title: 'Excluir Receita', message: `Tem certeza que deseja excluir "${r.name}"? Esta ação é irreversível.`, isDangerous: true, onConfirm: onDelete }) }} className="absolute top-3 right-3 p-2.5 rounded-full bg-black/30 hover:bg-rose-500/90 backdrop-blur-md text-white/90 hover:text-white opacity-0 md:group-hover:opacity-100 transition-all duration-300 transform scale-90 hover:scale-100 hover:shadow-lg z-[100] border border-white/10 active:scale-95 touch-manipulation cursor-pointer"><Icons.Trash className="w-4 h-4" /></button>
        </div>
        {/* Info */}
        <div className="px-2 pb-4">
            <div className="flex justify-between items-start mb-2">
                <span className="inline-block px-2.5 py-1 text-[10px] font-medium tracking-wide rounded-lg" style={{ backgroundColor: `${getCategoryColor(categories, r.category)}15`, color: getCategoryColor(categories, r.category) }}>{r.category}</span>
                <div className="flex items-center gap-3 text-xs font-bold text-zinc-400"><div className="flex items-center gap-1.5"><Icons.Clock />{Number(r.prepTime || 0) + Number(r.cookTime || 0)}m</div>{(r.temperature || 0) > 0 && <><div className="w-px h-3 bg-zinc-200 dark:bg-zinc-700" /><div className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>{r.temperature}°</div></>}</div>
            </div>
            <h3 className="text-2xl font-bold leading-tight text-zinc-900 dark:text-white md:group-hover:text-indigo-600 md:dark:group-hover:text-indigo-400 transition-colors mb-1">{r.name}</h3>
            <p className="text-xs font-medium text-zinc-400">{(r?.sections || []).filter((s: any) => s.type === 'ingredients').reduce((acc: number, s: any) => acc + (s.items?.length || 0), 0)} ingredientes</p>
        </div>
    </motion.div>
)
