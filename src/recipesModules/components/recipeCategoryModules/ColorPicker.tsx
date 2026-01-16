// ═══════════════════════════════════════════════════════════════════
// RECIPE CATEGORY MODAL MODULES — Color Picker Component
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { colorPalette, CategoryInput } from './types'

interface ColorPickerProps { color: string; cat: CategoryInput; onColorChange: (cat: CategoryInput, color: string) => void; onClose: () => void }

export const MobileColorPicker: React.FC<ColorPickerProps> = ({ color, cat, onColorChange, onClose }) => (
    <>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="md:hidden fixed inset-x-0 bottom-0 z-[80] bg-white dark:bg-zinc-800 rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.3)] p-6"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)' }}>
            <div className="flex justify-center mb-4"><div className="w-9 h-[5px] rounded-full bg-zinc-300 dark:bg-zinc-600" /></div>
            <h4 className="text-[17px] font-bold text-zinc-900 dark:text-white text-center mb-5">Escolha uma Cor</h4>
            <div className="grid grid-cols-5 gap-4 mb-6">
                {colorPalette.map(c => (
                    <button key={c} onClick={() => onColorChange(cat, c)}
                        className={`aspect-square rounded-full transition-all active:scale-90 touch-manipulation ${color === c ? 'ring-[3px] ring-offset-4 ring-offset-white dark:ring-offset-zinc-800 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c }} />
                ))}
            </div>
            <button onClick={onClose} className="w-full h-14 bg-zinc-100 dark:bg-zinc-700 rounded-2xl text-[17px] font-semibold text-zinc-900 dark:text-white active:bg-zinc-200 dark:active:bg-zinc-600 transition-colors touch-manipulation">Fechar</button>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden fixed inset-0 z-[75] bg-black/40" onClick={onClose} />
    </>
)

export const DesktopColorPicker: React.FC<ColorPickerProps> = ({ color, cat, onColorChange }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -8 }}
        className="hidden md:block absolute left-3 top-full mt-2 z-[80] bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-4 border border-zinc-200/80 dark:border-zinc-700">
        <div className="grid grid-cols-5 gap-2">
            {colorPalette.map(c => (
                <button key={c} onClick={() => onColorChange(cat, c)}
                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 active:scale-95 ${color === c ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-zinc-800' : ''}`}
                    style={{ backgroundColor: c }} />
            ))}
        </div>
    </motion.div>
)
