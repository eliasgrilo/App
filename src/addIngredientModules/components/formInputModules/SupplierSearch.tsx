// ═══════════════════════════════════════════════════════════════════
// FORM INPUTS MODULES — SupplierSearch
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icons } from '../../Icons'

export interface SupplierSearchProps { suppliers: Array<{ id: number | string; name?: string }>; selected: string | null; onSelect: (supplier: { id: number | string; name?: string }) => void; onClear: () => void }

export function SupplierSearch({ suppliers, selected, onSelect, onClear }: SupplierSearchProps) {
    const [search, setSearch] = useState(''); const [open, setOpen] = useState(false)
    const filtered = suppliers.filter(s => s.name?.toLowerCase().includes(search.toLowerCase())).slice(0, 5)

    if (selected) return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between min-h-[52px] px-4">
            <div className="flex items-center gap-3"><motion.div className="w-7 h-7 rounded-full bg-[#34c759] flex items-center justify-center text-white" style={{ boxShadow: '0 2px 8px rgba(52,199,89,0.4)' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}>{Icons.check}</motion.div><span className="text-[17px] font-medium text-[#1d1d1f] dark:text-white">{selected}</span></div>
            <motion.button onClick={onClear} whileTap={{ scale: 0.9 }} whileHover={{ backgroundColor: 'rgba(255,59,48,0.1)' }} className="w-8 h-8 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center text-[#8e8e93] hover:text-[#ff3b30] transition-colors">{Icons.xmark}</motion.button>
        </motion.div>
    )

    return (
        <div className="relative">
            <div className="flex items-center min-h-[52px] px-4 gap-3"><input type="text" value={search} onChange={e => { setSearch(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} placeholder="Buscar fornecedor..." className="flex-1 text-[17px] bg-transparent outline-none text-[#1d1d1f] dark:text-white placeholder:text-[#aeaeb2]" /><motion.div className="text-[#c7c7cc]" animate={{ rotate: open ? 90 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>{Icons.chevronRight}</motion.div></div>
            <AnimatePresence>{open && filtered.length > 0 && (<><motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="absolute left-2 right-2 top-full mt-1 bg-white dark:bg-[#2c2c2e] rounded-[14px] shadow-2xl overflow-hidden z-50 border border-black/[0.04] dark:border-white/[0.06]" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>{filtered.map((s, i) => (<motion.button key={s.id} onClick={() => { onSelect(s); setSearch(''); setOpen(false) }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} whileHover={{ backgroundColor: 'rgba(0,122,255,0.08)' }} whileTap={{ scale: 0.98 }} className={`w-full h-[50px] px-4 text-left flex items-center gap-3 text-[16px] text-[#1d1d1f] dark:text-white ${i < filtered.length - 1 ? 'border-b border-[#f5f5f7] dark:border-[#3a3a3c]' : ''}`}><div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#a55eea] to-[#8854d0] flex items-center justify-center text-[12px] font-bold text-white shadow-sm">{s.name?.charAt(0).toUpperCase()}</div>{s.name}</motion.button>))}</motion.div><button type="button" aria-label="Fechar busca" className="fixed inset-0 z-40 bg-transparent border-none cursor-default" onClick={() => setOpen(false)} /></>)}</AnimatePresence>
        </div>
    )
}
