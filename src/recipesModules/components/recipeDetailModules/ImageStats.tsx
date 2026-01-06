// ═══════════════════════════════════════════════════════════════════
// RECIPE DETAIL VIEW MODULES — Image & Stats Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { Icons } from '../RecipeIcons'
import { Recipe } from './types'

interface ImageSectionProps { image?: string | null; isUploading: boolean; onImageClick: () => void; onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }

export const ImageSection: React.FC<ImageSectionProps> = ({ image, isUploading, onImageClick, onImageUpload }) => (
    <div className="relative aspect-video md:aspect-[4/5] rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 overflow-hidden shadow-sm border border-zinc-100/80 dark:border-zinc-800 group">
        {image ? (
            <>
                <motion.img src={image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onClick={onImageClick} />
                <label className="absolute top-4 right-4 p-3 rounded-full bg-black/30 backdrop-blur-md text-white/90 hover:bg-black/50 hover:text-white transition-all cursor-pointer opacity-100 md:opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-lg border border-white/10">
                    <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} disabled={isUploading} />
                    {isUploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icons.Camera className="w-5 h-5" />}
                </label>
            </>
        ) : (
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-300 hover:text-zinc-500">
                <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} /><Icons.Camera /><span className="text-[10px] font-bold uppercase tracking-widest mt-3">Adicionar Capa</span>
            </label>
        )}
    </div>
)

interface StatsGridProps { selected: Recipe; selectedId: string | number; updateRecipe: (id: any, changes: any) => void }

export const StatsGrid: React.FC<StatsGridProps> = ({ selected, selectedId, updateRecipe }) => (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[{ label: 'Preparo', val: 'prepTime', unit: 'min' }, { label: 'Cozimento', val: 'cookTime', unit: 'min' }, { label: 'Temperatura', val: 'temperature', unit: '°C' }].map(stat => (
            <div key={stat.label} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-3 md:p-4 border border-zinc-100/80 dark:border-zinc-800 flex flex-col items-center justify-center">
                <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 md:mb-2">{stat.label}</span>
                <div className="flex items-baseline gap-1">
                    <input value={String((selected as any)?.[stat.val] || "")} onChange={e => updateRecipe(selectedId, { [stat.val]: e.target.value })} className="w-full bg-transparent font-bold text-lg md:text-xl text-center text-zinc-900 dark:text-white outline-none p-0 border-none focus:ring-0 tabular-nums" placeholder="0" />
                    {stat.unit && <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold">{stat.unit}</span>}
                </div>
            </div>
        ))}
    </div>
)
